// Aussehen hell, dunkel oder wie das Gerät. Die Wahl liegt nur im Gerät (thetadex_aussehen).
// css/base.css liest das Merkmal data-aussehen am <html>.

import { lesen, schreiben } from '../store.js';

export const AUSSEHEN = [
    { id: 'hell', titel: 'Hell' },
    { id: 'dunkel', titel: 'Dunkel' },
    { id: 'geraet', titel: 'Wie Gerät' }
];

// Farbe der Leiste am Handy, gleich wie die Kopfzeile (--kopf-grund in css/base.css, seit 0.6.1 auch im hellen Modus dunkel)
const LEISTE = '#1C1B19';

export function aktuellesAussehen() {
    const wert = lesen('aussehen', 'geraet');
    return AUSSEHEN.some((a) => a.id === wert) ? wert : 'geraet';
}

// Setzt das Aussehen auf der Seite. Beim Start und nach jeder Wahl aufrufen.
export function wendeAussehenAn() {
    const wert = aktuellesAussehen();
    const wurzel = document.documentElement;
    if (wert === 'geraet') wurzel.removeAttribute('data-aussehen');
    else wurzel.setAttribute('data-aussehen', wert);
    // Die Leiste ist in jedem Aussehen gleich dunkel (beide theme-color-Angaben in index.html)
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', LEISTE));
}

export function setzeAussehen(wert) {
    const ok = schreiben('aussehen', wert);
    wendeAussehenAn();
    return ok;
}
