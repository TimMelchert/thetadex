// Visitenkarte (Etappe 10).
// Besucher: #/karte/<skript>/<schluessel> ohne Einrichtung und ohne Passwort, nur lesen (Schritt 10.2).
// Ein Link zeigt genau eine Karte. E-Mail und Telefon stehen gleich da (Wunsch der Person, 4.11.2026, ab 1.2.8).
// Im Gerät der Besucher wird nichts gespeichert. Siehe docs/STAND.md 4 „Visitenkarte“.
// zeichneKarte nutzt auch die Vorschau der Person (Schritt 10.3).

import { el, leeren, sichereUrl } from '../ui/dom.js';
import { apiOeffentlich } from '../api.js';
import { bildAdresse } from '../ui/bild.js';

export const KENNUNG = /^[A-Za-z0-9_-]{20,120}$/;
export const SCHLUESSEL = /^[a-f0-9]{64}$/;
export const KARTEN = [
    { id: 'privat', titel: 'Privat' },
    { id: 'arbeit', titel: 'Arbeit' },
    { id: 'aktivismus', titel: 'Aktivismus' }
];

// Gleiche Regeln wie im Skript (Fund 3 der Prüfung): Die App prüft noch einmal, bevor sie einen Link baut.
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const TELEFON = /^\+?[0-9][0-9 /-]{3,30}$/;

function nurHttps(text) {
    const url = sichereUrl(text);
    return url && url.startsWith('https://') ? url : null;
}

function kontaktLink(a) {
    const wert = String(a.wert || '');
    if (a.art === 'email' && EMAIL.test(wert)) return 'mailto:' + wert;
    if (a.art === 'telefon' && TELEFON.test(wert)) return 'tel:' + wert.replace(/[\s/-]/g, '');
    return null;
}

function aeusserLink(adresse, text, klasse) {
    return el('a', { class: klasse || '', text, attrs: { href: adresse, target: '_blank', rel: 'noopener noreferrer' } });
}

// Text in einer vCard: \ ; , und Zeilenumbrüche maskieren
function vText(t) {
    return String(t == null ? '' : t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

// Adressbuch-Datei (vCard 3.0) mit Name, Status, E-Mail, Telefon, dem Link der Karte und den Social-Media-Links
export function vcard(angaben, kartenLink) {
    const name = (angaben.find((a) => a.art === 'name') || {}).wert || 'Kontakt';
    const status = angaben.filter((a) => a.art === 'status').map((a) => a.wert).filter(Boolean);
    const zeilen = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + vText(name), 'N:' + vText(name) + ';;;;'];
    if (status.length) zeilen.push('TITLE:' + vText(status[0]));
    angaben.forEach((a) => {
        if (a.art === 'email' && EMAIL.test(a.wert || '')) zeilen.push('EMAIL;TYPE=INTERNET:' + a.wert);
        if (a.art === 'telefon' && TELEFON.test(a.wert || '')) zeilen.push('TEL:' + a.wert.replace(/[\s/]/g, ''));
    });
    if (kartenLink) zeilen.push('URL:' + kartenLink);
    angaben.filter((a) => a.art === 'social').forEach((a) => { const u = nurHttps(a.link); if (u) zeilen.push('URL:' + u); });
    zeilen.push('END:VCARD');
    return zeilen.join('\r\n') + '\r\n';
}

// Bunte Symbole für bekannte Dienste (selbst gezeichnet, icons/social/). Erkannt am Link, sonst an der Beschriftung.
const DIENSTE = [
    { id: 'instagram', hosts: ['instagram.com', 'instagr.am'] },
    { id: 'linkedin', hosts: ['linkedin.com', 'lnkd.in'] },
    { id: 'signal', hosts: ['signal.me', 'signal.group', 'signal.org'] }
];
export function dienstVon(a) {
    let host = '';
    try { host = new URL(nurHttps(a.link) || 'https://x.invalid').hostname.toLowerCase(); } catch (e) { host = ''; }
    const titel = String(a.titel || '').toLowerCase();
    const d = DIENSTE.find((x) => x.hosts.some((h) => host === h || host.endsWith('.' + h))) || DIENSTE.find((x) => titel.includes(x.id));
    return d ? d.id : '';
}

function speichereDatei(text, dateiname) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/vcard;charset=utf-8' }));
    const a = el('a', { attrs: { href: url, download: dateiname } });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Zeichnet eine Karte. optionen:
//   bildHolen: async (id) => data:-Adresse oder null (Vorschaubilder und Logos beim Status)
//   kartenLink: Link der Karte für „Kontakt speichern“ (undefined = ohne Knopf)
//   ueberschrift: 'h1' (Besucher) oder 'h2'/'h3' (Vorschau)
// Name und Status stehen immer oben. Danach kommen die Blöcke (jeder Text einzeln, Kontakt, Social Media,
// Veröffentlichungen) in der Reihenfolge der Angaben: Ein Block steht dort, wo seine erste Angabe steht.
// Die Angaben kommen vom Skript schon nach Spalte „reihenfolge“ sortiert.
export function zeichneKarte(angaben, optionen = {}) {
    const ebene = optionen.ueberschrift || 'h1';
    const unter = ebene === 'h1' ? 'h2' : (ebene === 'h2' ? 'h3' : 'h4');
    const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const art = (name) => angaben.filter((a) => a.art === name);
    const name = art('name')[0];

    // Kleines Bild aus Drive (Vorschau oder Logo), erscheint erst, wenn es geladen ist
    function bildPlatz(a, klasse) {
        const platz = el('span', { class: klasse, attrs: { 'aria-hidden': 'true', hidden: true } });
        if (a.bild && optionen.bildHolen) {
            optionen.bildHolen(a.id).then((adresse) => {
                if (!adresse) return;
                platz.append(el('img', { attrs: { src: adresse, alt: '', loading: 'lazy' } }));
                platz.hidden = false;
            }).catch(() => {});
        }
        return platz;
    }

    // Eingebautes Symbol aus Spalte „bild“ (zum Beispiel „hut“), Farbe wie die Schrift
    const SYMBOLE = { hut: 'uni' };
    function symbol(a) {
        const s = SYMBOLE[a.symbol];
        return s ? el('span', { class: 'reiter-symbol vk-eigen-symbol', attrs: { 'data-symbol': s, 'aria-hidden': 'true' } }) : null;
    }

    const teile = [];
    teile.push(el(ebene, { class: 'vk-name', text: name ? name.wert || name.titel : 'Visitenkarte' }));
    art('status').forEach((a) => teile.push(el('p', { class: 'vk-status' }, [
        symbol(a) || bildPlatz(a, 'vk-logo'),
        el('span', { text: a.wert || a.titel })
    ])));

    function textBlock(a) {
        const u = nurHttps(a.link);
        return el('p', { class: 'vk-text' }, [symbol(a), u ? aeusserLink(u, a.wert || a.titel) : document.createTextNode(a.wert || a.titel)]);
    }

    function kontaktBlock() {
        const liste = el('ul', { class: 'vk-liste' });
        angaben.filter((a) => a.art === 'email' || a.art === 'telefon').forEach((a) => {
            const link = kontaktLink(a);
            liste.append(el('li', {}, [
                el('span', { class: 'vk-beschriftung', text: a.titel || (a.art === 'email' ? 'E-Mail' : 'Telefon') }),
                link ? el('a', { class: 'vk-wert', text: a.wert, attrs: { href: link } }) : el('span', { class: 'leise', text: 'nicht verfügbar' })
            ]));
        });
        return el('section', { class: 'vk-gruppe' }, [el(unter, { text: 'Kontakt' }), liste]);
    }

    function socialBlock() {
        const social = art('social').filter((a) => nurHttps(a.link));
        if (!social.length) return null;
        return el('section', { class: 'vk-gruppe' }, [
            el(unter, { text: 'Social Media' }),
            el('ul', { class: 'vk-liste' }, social.map((a) => {
                const dienst = dienstVon(a);
                return el('li', {}, [
                    el('span', { class: 'vk-beschriftung' }, [
                        dienst ? el('img', { class: 'vk-symbol', attrs: { src: 'icons/social/' + dienst + '.svg', alt: '', width: 24, height: 24 } }) : null,
                        el('span', { text: a.titel || 'Link' })
                    ]),
                    aeusserLink(nurHttps(a.link), a.wert || new URL(nurHttps(a.link)).hostname, 'vk-wert')
                ]);
            }))
        ]);
    }

    function veroeffBlock() {
        const veroeff = art('veroeffentlichung').filter((a) => nurHttps(a.link));
        if (!veroeff.length) return null;
        return el('section', { class: 'vk-gruppe' }, [
            el(unter, { text: 'Veröffentlichungen' }),
            el('ul', { class: 'vk-veroeff' }, veroeff.map((a) => el('li', {}, [
                el('a', { class: 'vk-veroeff-link', attrs: { href: nurHttps(a.link), target: '_blank', rel: 'noopener noreferrer' } }, [
                    bildPlatz(a, 'vk-vorschau'),
                    el('span', { class: 'vk-veroeff-text' }, [
                        el('strong', {}, [symbol(a), document.createTextNode(a.titel || a.wert)]),
                        a.titel && a.wert ? el('span', { class: 'leise', text: a.wert }) : null
                    ])
                ])
            ])))
        ]);
    }

    // Blöcke in der Reihenfolge ihrer ersten Angabe
    const gruppe = { email: 'kontakt', telefon: 'kontakt', social: 'social', veroeffentlichung: 'veroeff' };
    const baue = { kontakt: kontaktBlock, social: socialBlock, veroeff: veroeffBlock };
    const schon = new Set();
    angaben.forEach((a) => {
        if (a.art === 'text') { teile.push(textBlock(a)); return; }
        const g = gruppe[a.art];
        if (!g || schon.has(g)) return;
        schon.add(g);
        const block = baue[g]();
        if (block) teile.push(block);
    });

    if (optionen.kartenLink !== undefined) {
        teile.push(el('button', {
            class: 'knopf knopf-bereich vk-speichern', text: 'Kontakt speichern', attrs: { type: 'button' },
            on: {
                click: () => {
                    speichereDatei(vcard(angaben, optionen.kartenLink), 'visitenkarte.vcf');
                    status.textContent = 'Datei für das Adressbuch erstellt.';
                }
            }
        }));
    }
    teile.push(status);
    return el('div', { class: 'karte vk' }, teile);
}

// Besucher-Ansicht
export function render(container, ctx = {}) {
    const teile = ctx.teile || [];
    const kennung = String(teile[0] || '');
    const schluessel = String(teile[1] || '');
    const meldung = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' }, text: 'Lade …' });
    // Farbe der Visitenkarte (Lavendel) auch für Besucher
    container.setAttribute('data-bereich', 'visitenkarte');
    container.append(meldung);

    if (!KENNUNG.test(kennung) || !SCHLUESSEL.test(schluessel)) {
        meldung.textContent = 'Dieser Link ist unvollständig. Bitte den ganzen Link öffnen.';
        return;
    }
    const adresse = 'https://script.google.com/macros/s/' + kennung + '/exec';
    const frage = (action, daten = {}) => apiOeffentlich(adresse, action, { ...daten, schluessel });
    // Link der Karte für das Adressbuch: genau diese Seite
    const kartenLink = location.origin + location.pathname + '#/karte/' + kennung + '/' + schluessel;

    frage('karte').then(async (d) => {
        let angaben = d && Array.isArray(d.angaben) ? d.angaben : [];
        // Altes Skript (vor 1.2.8) schickt E-Mail und Telefon leer mit „verdeckt“: dann einmal „kontakt“ dazu holen
        if (angaben.some((a) => a.verdeckt)) {
            const k = await frage('kontakt').then((x) => (x && Array.isArray(x.kontakt) ? x.kontakt : [])).catch(() => []);
            angaben = angaben.map((a) => (a.verdeckt ? { ...a, wert: (k.find((x) => x.id === a.id) || {}).wert || '' } : a));
        }
        leeren(container);
        if (!angaben.length) {
            container.append(el('h1', { text: 'Visitenkarte' }), el('p', { class: 'meldung', text: 'Auf dieser Karte steht noch nichts.' }));
            return;
        }
        container.append(zeichneKarte(angaben, {
            ueberschrift: 'h1',
            kartenLink,
            bildHolen: async (id) => bildAdresse(await frage('bild_karte', { id }))
        }));
    }).catch((e) => {
        meldung.textContent = e.message;
    });
}
