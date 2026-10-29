// Unbekannte Adresse.

import { el } from '../ui/dom.js';

export function render(container) {
    container.append(
        el('h1', { text: 'Seite nicht gefunden' }),
        el('p', { text: 'Diese Adresse gibt es in Thetadex nicht.' }),
        el('a', { class: 'knopf', text: 'Zur Startseite', attrs: { href: '#/' } })
    );
}
