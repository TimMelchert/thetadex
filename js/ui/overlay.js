// Kurzes Bestätigungs-Fenster mit grünem Haken (Wunsch der Person, wie in der alten Finanz-App).
// Erscheint nur, nachdem das Skript den Erfolg bestätigt hat, und verschwindet nach gut einer Sekunde von selbst.

import { el } from './dom.js';

export function zeigeGespeichert(text = 'Gespeichert', zusatz = '') {
    const alt = document.querySelector('.overlay-gespeichert');
    if (alt) alt.remove();
    const box = el('div', { class: 'overlay-gespeichert', attrs: { role: 'status', 'aria-live': 'assertive' } }, [
        el('div', { class: 'overlay-inhalt' }, [
            el('span', { class: 'overlay-haken', text: '✓', attrs: { 'aria-hidden': 'true' } }),
            el('p', { class: 'overlay-text', text }),
            zusatz ? el('p', { class: 'overlay-zusatz', text: zusatz }) : null
        ])
    ]);
    const weg = () => box.remove();
    box.addEventListener('click', weg);
    document.body.append(box);
    setTimeout(weg, 1400);
}
