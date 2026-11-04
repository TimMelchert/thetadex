// Visitenkarte (Etappe 10).
// Besucher: #/karte/<skript>/<schluessel> ohne Einrichtung und ohne Passwort, nur lesen (Schritt 10.2).
// Ein Link zeigt genau eine Karte. E-Mail und Telefon kommen erst nach einem Tipp (eigene Anfrage „kontakt“).
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
export function vcard(angaben, kontakt, kartenLink) {
    const name = (angaben.find((a) => a.art === 'name') || {}).wert || 'Kontakt';
    const status = angaben.filter((a) => a.art === 'status').map((a) => a.wert).filter(Boolean);
    const zeilen = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + vText(name), 'N:' + vText(name) + ';;;;'];
    if (status.length) zeilen.push('TITLE:' + vText(status[0]));
    kontakt.forEach((a) => {
        if (a.art === 'email' && EMAIL.test(a.wert || '')) zeilen.push('EMAIL;TYPE=INTERNET:' + a.wert);
        if (a.art === 'telefon' && TELEFON.test(a.wert || '')) zeilen.push('TEL:' + a.wert.replace(/[\s/]/g, ''));
    });
    if (kartenLink) zeilen.push('URL:' + kartenLink);
    angaben.filter((a) => a.art === 'social').forEach((a) => { const u = nurHttps(a.link); if (u) zeilen.push('URL:' + u); });
    zeilen.push('END:VCARD');
    return zeilen.join('\r\n') + '\r\n';
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
//   kontaktHolen: async () => Liste { id, art, titel, wert } (Besucher: Anfrage „kontakt“). Ohne: Werte stehen schon in den Angaben.
//   bildHolen: async (id) => data:-Adresse oder null
//   kartenLink: Link der Karte für „Kontakt speichern“ (leer = ohne)
//   ueberschrift: 'h1' (Besucher) oder 'h2' (Vorschau)
export function zeichneKarte(angaben, optionen = {}) {
    const ebene = optionen.ueberschrift || 'h1';
    const unter = ebene === 'h1' ? 'h2' : 'h3';
    const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const art = (name) => angaben.filter((a) => a.art === name);
    const name = art('name')[0];
    let kontakt = optionen.kontaktHolen ? null : angaben.filter((a) => a.art === 'email' || a.art === 'telefon');

    async function holeKontakt() {
        if (kontakt) return kontakt;
        status.textContent = 'Lade …';
        try {
            const liste = await optionen.kontaktHolen();
            kontakt = Array.isArray(liste) ? liste : [];
            status.textContent = '';
        } catch (e) {
            status.textContent = e.message;
            return null;
        }
        return kontakt;
    }

    const teile = [];
    teile.push(el(ebene, { class: 'vk-name', text: name ? name.wert || name.titel : 'Visitenkarte' }));
    art('status').forEach((a) => teile.push(el('p', { class: 'vk-status', text: a.wert || a.titel })));
    art('text').forEach((a) => {
        const u = nurHttps(a.link);
        teile.push(el('p', { class: 'vk-text' }, [u ? aeusserLink(u, a.wert || a.titel) : document.createTextNode(a.wert || a.titel)]));
    });

    // Kontakt: je Angabe ein Knopf „… zeigen“, nach dem Tipp ein Mail- oder Telefon-Link
    const kontaktAngaben = angaben.filter((a) => a.art === 'email' || a.art === 'telefon');
    if (kontaktAngaben.length) {
        const liste = el('ul', { class: 'vk-liste' });
        kontaktAngaben.forEach((a) => {
            const zeile = el('li');
            const beschriftung = a.titel || (a.art === 'email' ? 'E-Mail' : 'Telefon');
            const zeige = (eintrag) => {
                leeren(zeile);
                const link = eintrag ? kontaktLink(eintrag) : null;
                zeile.append(el('span', { class: 'vk-beschriftung', text: beschriftung }),
                    link ? el('a', { class: 'vk-wert', text: eintrag.wert, attrs: { href: link } }) : el('span', { class: 'leise', text: 'nicht verfügbar' }));
            };
            if (!optionen.kontaktHolen) { zeige(a); liste.append(zeile); return; }
            const knopf = el('button', {
                class: 'knopf knopf-zweit vk-zeigen', text: (a.art === 'email' ? 'E-Mail' : 'Nummer') + ' zeigen' + (a.titel ? ' (' + a.titel + ')' : ''),
                attrs: { type: 'button' },
                on: {
                    click: async () => {
                        knopf.disabled = true;
                        const k = await holeKontakt();
                        knopf.disabled = false;
                        if (!k) return;
                        // Nach einem Tipp alle Kontaktangaben zeigen, sie sind ja schon da
                        Array.from(liste.children).forEach((li) => li._zeige && li._zeige(k.find((x) => x.id === li._id)));
                    }
                }
            });
            zeile._id = a.id;
            zeile._zeige = zeige;
            zeile.append(knopf);
            liste.append(zeile);
        });
        teile.push(el('section', { class: 'vk-gruppe' }, [el(unter, { text: 'Kontakt' }), liste]));
    }

    const social = art('social').filter((a) => nurHttps(a.link));
    if (social.length) {
        teile.push(el('section', { class: 'vk-gruppe' }, [
            el(unter, { text: 'Social Media' }),
            el('ul', { class: 'vk-liste' }, social.map((a) => el('li', {}, [
                el('span', { class: 'vk-beschriftung', text: a.titel || 'Link' }),
                aeusserLink(nurHttps(a.link), a.wert || new URL(nurHttps(a.link)).hostname, 'vk-wert')
            ])))
        ]));
    }

    const veroeff = art('veroeffentlichung').filter((a) => nurHttps(a.link));
    if (veroeff.length) {
        teile.push(el('section', { class: 'vk-gruppe' }, [
            el(unter, { text: 'Veröffentlichungen' }),
            el('ul', { class: 'vk-veroeff' }, veroeff.map((a) => {
                const bildPlatz = el('span', { class: 'vk-vorschau', attrs: { 'aria-hidden': 'true', hidden: !a.bild } });
                if (a.bild && optionen.bildHolen) {
                    optionen.bildHolen(a.id).then((adresse) => {
                        if (adresse) bildPlatz.append(el('img', { attrs: { src: adresse, alt: '', loading: 'lazy' } }));
                        else bildPlatz.hidden = true;
                    }).catch(() => { bildPlatz.hidden = true; });
                }
                return el('li', {}, [
                    el('a', { class: 'vk-veroeff-link', attrs: { href: nurHttps(a.link), target: '_blank', rel: 'noopener noreferrer' } }, [
                        bildPlatz,
                        el('span', { class: 'vk-veroeff-text' }, [
                            el('strong', { text: a.titel || a.wert }),
                            a.titel && a.wert ? el('span', { class: 'leise', text: a.wert }) : null
                        ])
                    ])
                ]);
            }))
        ]));
    }

    if (optionen.kartenLink !== undefined) {
        teile.push(el('button', {
            class: 'knopf vk-speichern', text: 'Kontakt speichern', attrs: { type: 'button' },
            on: {
                click: async () => {
                    const k = await holeKontakt();
                    if (!k) return;
                    speichereDatei(vcard(angaben, k, optionen.kartenLink), 'visitenkarte.vcf');
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
    container.append(meldung);

    if (!KENNUNG.test(kennung) || !SCHLUESSEL.test(schluessel)) {
        meldung.textContent = 'Dieser Link ist unvollständig. Bitte den ganzen Link öffnen.';
        return;
    }
    const adresse = 'https://script.google.com/macros/s/' + kennung + '/exec';
    const frage = (action, daten = {}) => apiOeffentlich(adresse, action, { ...daten, schluessel });
    // Link der Karte für das Adressbuch: genau diese Seite
    const kartenLink = location.origin + location.pathname + '#/karte/' + kennung + '/' + schluessel;

    frage('karte').then((d) => {
        const angaben = d && Array.isArray(d.angaben) ? d.angaben : [];
        leeren(container);
        if (!angaben.length) {
            container.append(el('h1', { text: 'Visitenkarte' }), el('p', { class: 'meldung', text: 'Auf dieser Karte steht noch nichts.' }));
            return;
        }
        container.append(zeichneKarte(angaben, {
            ueberschrift: 'h1',
            kartenLink,
            kontaktHolen: async () => (await frage('kontakt')).kontakt,
            bildHolen: async (id) => bildAdresse(await frage('bild_karte', { id }))
        }));
    }).catch((e) => {
        meldung.textContent = e.message;
    });
}
