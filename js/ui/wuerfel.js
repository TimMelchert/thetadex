// Würfel (6.5): W4, W6, W8, W10, W12, W20, Anzahl wählbar. Rechnet nur im Gerät, nichts wird gespeichert.
// Zufall aus crypto.getRandomValues (der Zufall, den der Browser auch für Verschlüsselung nutzt).
// Ohne Verzerrung: Zahlen, die nicht gleichmäßig auf die Seiten passen, werden verworfen und neu gezogen.
// Wird im Reiter Pen & Paper und in der geteilten Ansicht (6.6) genutzt.

import { el, leeren } from './dom.js';

export const WUERFEL = [4, 6, 8, 10, 12, 20];
const MAX_ANZAHL = 20;
// Letzte Würfe, nur solange die Seite offen ist
const letzte = [];

// Ein Wurf mit einem Würfel mit „seiten“ Seiten: 1 bis seiten, jede Seite genau gleich wahrscheinlich
export function wurf(seiten) {
    const grenze = Math.floor(0x100000000 / seiten) * seiten;
    const zahl = new Uint32Array(1);
    do {
        crypto.getRandomValues(zahl);
    } while (zahl[0] >= grenze);
    return (zahl[0] % seiten) + 1;
}

// Schwebender Knopf „🎲 Würfeln“ mit eigenem Fenster. Gibt [knopf, fenster] zum Einhängen zurück.
export function wuerfelKnopf() {
    let anzahl = 1;
    const dialog = el('dialog', { class: 'besitz-dialog wuerfel-dialog', attrs: { 'aria-labelledby': 'wuerfel-titel' } });
    // Wie alle Fenster: nur × schließt
    dialog.addEventListener('cancel', (ev) => ev.preventDefault());
    const anzahlText = el('output', { class: 'wuerfel-anzahl-zahl', text: '1', attrs: { id: 'wuerfel-anzahl', 'aria-live': 'polite' } });
    const weniger = el('button', { class: 'knopf knopf-zweit wuerfel-pm', text: '−', attrs: { type: 'button', 'aria-label': 'Ein Würfel weniger' }, on: { click: () => setzeAnzahl(anzahl - 1) } });
    const mehr = el('button', { class: 'knopf knopf-zweit wuerfel-pm', text: '+', attrs: { type: 'button', 'aria-label': 'Ein Würfel mehr' }, on: { click: () => setzeAnzahl(anzahl + 1) } });
    const ergebnis = el('div', { class: 'wuerfel-ergebnis', attrs: { role: 'status', 'aria-live': 'polite' } }, [
        el('p', { class: 'leise', text: 'Tippe auf einen Würfel.' })
    ]);
    const liste = el('ul', { class: 'wuerfel-letzte', attrs: { 'aria-label': 'Letzte Würfe' } });

    function setzeAnzahl(n) {
        anzahl = Math.min(MAX_ANZAHL, Math.max(1, n));
        anzahlText.textContent = String(anzahl);
        weniger.disabled = anzahl <= 1;
        mehr.disabled = anzahl >= MAX_ANZAHL;
    }

    function wuerfle(seiten) {
        const wuerfe = Array.from({ length: anzahl }, () => wurf(seiten));
        const summe = wuerfe.reduce((a, b) => a + b, 0);
        const name = (anzahl > 1 ? anzahl : '') + 'W' + seiten;
        leeren(ergebnis);
        ergebnis.append(...[
            el('p', { class: 'wuerfel-name', text: name }),
            el('div', { class: 'wuerfel-einzeln' }, wuerfe.map((w) => el('span', {
                class: 'wuerfel-stein' + (w === seiten ? ' ist-hoch' : '') + (w === 1 ? ' ist-eins' : ''), text: String(w)
            }))),
            anzahl > 1 ? el('p', { class: 'wuerfel-summe', text: 'Summe ' + summe }) : null
        ].filter(Boolean));
        letzte.unshift(name + ': ' + wuerfe.join(' · ') + (anzahl > 1 ? ' = ' + summe : ''));
        letzte.length = Math.min(letzte.length, 10);
        zeigeLetzte();
    }

    function zeigeLetzte() {
        leeren(liste);
        letzte.slice(1).forEach((t) => liste.append(el('li', { text: t })));
        liste.hidden = letzte.length < 2;
    }

    dialog.append(el('div', { class: 'besitz-dialog-inhalt' }, [
        el('div', { class: 'form-kopf' }, [
            el('h2', { text: '🎲 Würfeln', attrs: { id: 'wuerfel-titel' } }),
            el('button', { class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Schließen' }, on: { click: () => dialog.close() } })
        ]),
        el('div', { class: 'wuerfel-anzahl', attrs: { role: 'group', 'aria-label': 'Anzahl Würfel' } }, [
            el('span', { text: 'Anzahl' }), weniger, anzahlText, mehr
        ]),
        el('div', { class: 'wuerfel-arten' }, WUERFEL.map((s) => el('button', {
            class: 'knopf knopf-bereich wuerfel-art', text: 'W' + s, attrs: { type: 'button' }, on: { click: () => wuerfle(s) }
        }))),
        ergebnis,
        liste
    ]));
    setzeAnzahl(1);
    zeigeLetzte();

    const knopf = el('button', {
        class: 'knopf knopf-bereich wuerfel-schwebend', text: '🎲 Würfeln', attrs: { type: 'button' },
        on: { click: () => { if (!dialog.open) dialog.showModal(); } }
    });
    return [knopf, dialog];
}
