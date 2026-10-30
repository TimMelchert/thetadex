// Aussehen hell, dunkel oder wie das Gerät. Die Wahl liegt nur im Gerät (thetadex_aussehen).
// css/base.css liest das Merkmal data-aussehen am <html>.

import { lesen, schreiben } from '../store.js';

export const AUSSEHEN = [
    { id: 'hell', titel: 'Hell' },
    { id: 'dunkel', titel: 'Dunkel' },
    { id: 'geraet', titel: 'Wie Gerät' }
];

// Farbe der Leiste am Handy, gleich wie --hintergrund in css/base.css
const LEISTE = { hell: '#FAF9F7', dunkel: '#1C1B19' };

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
    // Die beiden theme-color-Angaben in index.html gelten je nach Gerät hell oder dunkel
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
        const geraetHell = (m.getAttribute('media') || '').includes('light');
        m.setAttribute('content', wert === 'geraet' ? LEISTE[geraetHell ? 'hell' : 'dunkel'] : LEISTE[wert]);
    });
}

export function setzeAussehen(wert) {
    const ok = schreiben('aussehen', wert);
    wendeAussehenAn();
    return ok;
}
