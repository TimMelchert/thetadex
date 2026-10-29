// Platzhalter für Reiter, die noch keinen Inhalt haben.

import { el } from '../ui/dom.js';

export function render(container, ctx) {
    const b = ctx.bereich;
    container.append(
        el('h1', { class: 'bereich-titel', text: b.titel }),
        el('div', { class: 'karte' }, [
            el('p', { text: 'Dieser Reiter bekommt in Etappe ' + b.etappe + ' seinen Inhalt.' })
        ])
    );
}
