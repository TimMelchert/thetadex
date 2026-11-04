// Visitenkarte für die Person (Schritt 10.3): Kachel auf der Startseite, am PC auch in der Seitenleiste, Adresse #/visitenkarte.
// Umschalter Privat | Arbeit | Aktivismus mit Vorschau, je Karte Link erstellen, kopieren, als QR-Code zeigen, erneuern, nicht mehr teilen.
// Alles mit dem eigenen Passwort KARTE_PIN (js/api.js schickt es nur an das Skript „karte“).
// Im Gerät: die gewählte Karte (thetadex_karte_wahl) und die selbst erstellten Schlüssel (thetadex_karte_links).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { lesen, schreiben } from '../store.js';
import { bildAdresse } from '../ui/bild.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { zeichneKarte, KARTEN, SCHLUESSEL } from './karte.js';

const ADRESSE = /^https:\/\/script\.google\.com\/macros\/s\/([A-Za-z0-9_-]+)\/exec$/;

// QR-Code-Bibliothek (vendor/qrcode.js, MIT) erst laden, wenn sie gebraucht wird
let qrLaden = null;
function ladeQr() {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (!qrLaden) {
        qrLaden = new Promise((ok, fehler) => {
            const s = document.createElement('script');
            s.src = 'vendor/qrcode.js';
            s.onload = () => (window.qrcode ? ok(window.qrcode) : fehler(new Error('QR-Code konnte nicht geladen werden.')));
            s.onerror = () => { qrLaden = null; fehler(new Error('QR-Code konnte nicht geladen werden.')); };
            document.head.append(s);
        });
    }
    return qrLaden;
}

// QR-Code als Bild (schwarz auf weiß mit Rand, damit jede Kamera ihn liest, auch im Dunkelmodus)
async function qrBild(text) {
    const qrcode = await ladeQr();
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const punkt = 8, rand = 4;
    const seite = (n + 2 * rand) * punkt;
    const leinwand = document.createElement('canvas');
    leinwand.width = seite;
    leinwand.height = seite;
    const malen = leinwand.getContext('2d');
    malen.fillStyle = '#FFFFFF';
    malen.fillRect(0, 0, seite, seite);
    malen.fillStyle = '#000000';
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            if (qr.isDark(y, x)) malen.fillRect((x + rand) * punkt, (y + rand) * punkt, punkt, punkt);
        }
    }
    return leinwand.toDataURL('image/png');
}

export function render(container) {
    const ladeStatus = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const linkBereich = el('div', { class: 'karte vk-links' });
    const vorschau = el('div');
    const hinweise = el('div');
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'vk-dialog-titel' } });
    // Fenster schließen nur mit × oder „Schließen“
    dialog.addEventListener('cancel', (ev) => ev.preventDefault());
    let daten = null;
    let wahl = KARTEN.some((k) => k.id === lesen('karte_wahl')) ? lesen('karte_wahl') : 'privat';
    const bilder = new Map();

    const knoepfe = KARTEN.map((k) => el('button', {
        class: 'ansicht', text: k.titel,
        attrs: { type: 'button', 'data-wert': k.id, 'aria-pressed': k.id === wahl ? 'true' : 'false' },
        on: { click: () => { wahl = k.id; schreiben('karte_wahl', wahl); zeigeAlles(); } }
    }));

    container.append(
        el('h1', { class: 'bereich-titel', text: 'Visitenkarte' }),
        el('div', { class: 'ansichten', attrs: { role: 'group', 'aria-label': 'Karte' } }, knoepfe),
        ladeStatus,
        // Schmal: Link-Kasten über der Vorschau. Breit (PC): Link-Kasten rechts in einer eigenen Spalte (Wunsch der Person, 4.11.2026).
        el('div', { class: 'vk-seite' }, [
            el('aside', { class: 'vk-seite-rechts', attrs: { 'aria-label': 'Link und QR-Code' } }, [linkBereich]),
            el('div', { class: 'vk-seite-haupt' }, [
                el('h2', { text: 'So sehen es Besucher' }),
                el('p', { class: 'leise', text: 'Ändern geht im Sheet „Visitenkarte“, danach „Neu laden“.' }),
                vorschau, hinweise,
                el('button', { class: 'knopf knopf-zweit', text: 'Neu laden', attrs: { type: 'button' }, on: { click: laden } })
            ])
        ]),
        dialog
    );

    function kennung() {
        return (ADRESSE.exec((lesen('skripte', {}) || {}).karte || '') || [])[1] || '';
    }

    function linkFuer(k) {
        const links = lesen('karte_links', {}) || {};
        const s = daten && daten.geteilt[k] && SCHLUESSEL.test(links[k] || '') ? links[k] : '';
        return s && kennung() ? location.origin + location.pathname + '#/karte/' + kennung() + '/' + s : '';
    }

    async function holeBild(id) {
        if (bilder.has(id)) return bilder.get(id);
        const adresse = bildAdresse(await api('karte', 'bild', { id }));
        bilder.set(id, adresse);
        return adresse;
    }

    async function link(action) {
        const titel = KARTEN.find((k) => k.id === wahl).titel;
        if (action === 'link' && daten.geteilt[wahl] && !confirm('Neuen Link für „' + titel + '“ erstellen? Der alte Link und alte QR-Codes gelten dann sofort nicht mehr.')) return;
        if (action === 'link_weg' && !confirm('„' + titel + '“ nicht mehr teilen? Der Link gilt dann sofort nicht mehr.')) return;
        ladeStatus.textContent = 'Speichere …';
        try {
            const antwort = await api('karte', action, { karte: wahl });
            const links = lesen('karte_links', {}) || {};
            if (action === 'link' && SCHLUESSEL.test(antwort.schluessel || '')) links[wahl] = antwort.schluessel; else delete links[wahl];
            schreiben('karte_links', links);
            daten.geteilt[wahl] = action === 'link';
            ladeStatus.textContent = '';
            zeigeGespeichert(action === 'link' ? 'Link erstellt' : 'Nicht mehr geteilt');
            zeigeAlles();
        } catch (e) {
            ladeStatus.textContent = e.message;
        }
    }

    async function zeigeQr(adresse) {
        leeren(dialog);
        const titel = KARTEN.find((k) => k.id === wahl).titel;
        const inhalt = el('div', { class: 'besitz-dialog-inhalt' }, [
            el('div', { class: 'form-kopf' }, [
                el('h2', { text: 'QR-Code ' + titel, attrs: { id: 'vk-dialog-titel' } }),
                el('button', { class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Schließen' }, on: { click: () => dialog.close() } })
            ]),
            el('p', { class: 'meldung', text: 'Lade …' })
        ]);
        dialog.append(inhalt);
        dialog.showModal();
        try {
            const bild = await qrBild(adresse);
            inhalt.lastChild.replaceWith(
                el('img', { class: 'vk-qr', attrs: { src: bild, alt: 'QR-Code mit dem Link der Karte ' + titel } }),
                el('p', { class: 'leise', text: 'Zum Scannen zeigen oder abfotografieren. Mit „Neuen Link erstellen“ gilt dieser QR-Code nicht mehr.' }),
                el('div', { class: 'besitz-form-knoepfe' }, [
                    el('a', { class: 'knopf knopf-zweit', text: 'Bild speichern', attrs: { href: bild, download: 'visitenkarte-' + wahl + '.png' } }),
                    el('button', { class: 'knopf knopf-zweit', text: 'Schließen', attrs: { type: 'button' }, on: { click: () => dialog.close() } })
                ])
            );
        } catch (e) {
            inhalt.lastChild.textContent = e.message;
        }
    }

    function zeigeLinks() {
        leeren(linkBereich);
        const titel = KARTEN.find((k) => k.id === wahl).titel;
        if (!kennung()) {
            linkBereich.append(el('p', { text: 'Die Script-Adresse von „Visitenkarte“ hat nicht die erwartete Form (https://script.google.com/macros/s/…/exec). Bitte in den Einstellungen prüfen.' }));
            return;
        }
        const adresse = linkFuer(wahl);
        const reihe = el('div', { class: 'besitz-form-knoepfe' });
        if (!daten.geteilt[wahl]) {
            linkBereich.append(el('p', { text: 'Die Karte „' + titel + '“ hat noch keinen Link.' }));
            reihe.append(el('button', { class: 'knopf knopf-bereich', text: 'Link erstellen', attrs: { type: 'button' }, on: { click: () => link('link') } }));
        } else if (adresse) {
            const feld = el('input', { attrs: { id: 'vk-link', type: 'text', readonly: true, value: adresse } });
            feld.addEventListener('focus', () => feld.select());
            linkBereich.append(el('label', { text: 'Link der Karte „' + titel + '“', attrs: { for: 'vk-link' } }), feld);
            reihe.append(
                el('button', { class: 'knopf knopf-bereich', text: 'QR-Code zeigen', attrs: { type: 'button' }, on: { click: () => zeigeQr(adresse) } }),
                el('button', {
                    class: 'knopf knopf-zweit', text: 'Link kopieren', attrs: { type: 'button' },
                    on: { click: async () => { try { await navigator.clipboard.writeText(adresse); ladeStatus.textContent = 'Link kopiert.'; } catch (e) { feld.focus(); ladeStatus.textContent = 'Bitte den Link markieren und kopieren.'; } } }
                })
            );
            if (navigator.share) reihe.append(el('button', { class: 'knopf knopf-zweit', text: 'Senden …', attrs: { type: 'button' }, on: { click: () => navigator.share({ title: 'Visitenkarte', url: adresse }).catch(() => {}) } }));
        } else {
            linkBereich.append(el('p', { text: 'Die Karte „' + titel + '“ hat einen Link. Er wurde auf einem anderen Gerät erstellt und ist hier nicht bekannt.' }),
                el('p', { class: 'leise', text: 'Mit „Neuen Link erstellen“ bekommst du hier einen Link. Der alte gilt dann nicht mehr.' }));
        }
        if (daten.geteilt[wahl]) {
            reihe.append(
                el('button', { class: 'knopf knopf-zweit', text: 'Neuen Link erstellen', attrs: { type: 'button' }, on: { click: () => link('link') } }),
                el('button', { class: 'knopf knopf-zweit', text: 'Nicht mehr teilen', attrs: { type: 'button' }, on: { click: () => link('link_weg') } })
            );
        }
        linkBereich.append(reihe);
    }

    function zeigeAlles() {
        knoepfe.forEach((k) => k.setAttribute('aria-pressed', k.getAttribute('data-wert') === wahl ? 'true' : 'false'));
        leeren(vorschau);
        leeren(hinweise);
        if (!daten) { leeren(linkBereich); linkBereich.hidden = true; return; }
        linkBereich.hidden = false;
        // Nicht mehr geteilt (zum Beispiel an einem anderen Gerät beendet): gemerkten Schlüssel vergessen
        const links = lesen('karte_links', {}) || {};
        let geaendert = false;
        KARTEN.forEach((k) => { if (!daten.geteilt[k.id] && links[k.id]) { delete links[k.id]; geaendert = true; } });
        if (geaendert) schreiben('karte_links', links);
        zeigeLinks();

        const aufKarte = daten.angaben.filter((a) => !a.fehler && a.karten.includes(wahl));
        vorschau.append(aufKarte.length
            ? zeichneKarte(aufKarte, { ueberschrift: 'h3', bildHolen: holeBild })
            : el('p', { class: 'karte', text: 'Auf dieser Karte steht noch nichts. Trage im Sheet „Visitenkarte“, Blatt „angaben“, in der Spalte „karten“ „' + wahl + '“ ein.' }));

        // Angaben, die nirgends erscheinen, mit Grund (Funde 2 und 3 der Prüfung)
        const fehler = daten.angaben.filter((a) => a.fehler);
        if (fehler.length) {
            hinweise.append(el('div', { class: 'karte' }, [
                el('h2', { text: 'Erscheint auf keiner Karte' }),
                el('ul', { class: 'vk-liste' }, fehler.map((a) => el('li', {}, [
                    el('span', { class: 'vk-beschriftung', text: 'Zeile ' + a.zeile }),
                    el('span', { class: 'vk-wert', text: [a.titel, a.wert].filter(Boolean).join(': ') + ' – ' + a.fehler })
                ])))
            ]));
        }
    }

    async function laden() {
        ladeStatus.textContent = 'Lade …';
        try {
            const d = await api('karte', 'angaben');
            daten = {
                geteilt: d && d.geteilt && typeof d.geteilt === 'object' ? d.geteilt : {},
                angaben: (d && Array.isArray(d.angaben) ? d.angaben : []).map((a) => ({ ...a, karten: Array.isArray(a.karten) ? a.karten : [] }))
            };
            ladeStatus.textContent = '';
        } catch (e) {
            ladeStatus.textContent = e.code === 'aktion'
                ? 'Das Skript „karte“ kennt diese Aktion nicht. Bitte die neue Fassung von Code.gs einfügen und eine neue Version bereitstellen.'
                : e.message;
        }
        zeigeAlles();
    }

    zeigeAlles();
    laden();
}
