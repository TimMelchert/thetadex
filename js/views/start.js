// Startseite: Name, Version und Hinweis auf die Ersteinrichtung.

import { el } from '../ui/dom.js';
import { istEingerichtet } from '../store.js';

export function render(container, ctx) {
    container.append(
        el('h1', { text: 'Thetadex' }),
        el('p', { class: 'leise', text: 'Version ' + ctx.version })
    );

    if (!istEingerichtet()) {
        container.append(el('div', { class: 'karte' }, [
            el('h2', { text: 'Noch nicht eingerichtet' }),
            el('p', { text: 'Trage einmal dein Passwort und die Adressen deiner Skripte ein. Sie bleiben nur auf diesem Gerät.' }),
            el('a', { class: 'knopf', text: 'Zur Einrichtung', attrs: { href: '#/einrichtung' } })
        ]));
    } else {
        container.append(el('p', { text: 'Wähle einen Bereich aus der Leiste.' }));
    }
}
