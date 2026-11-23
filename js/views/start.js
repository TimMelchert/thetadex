// Startseite: Name, Version, Kacheln der sichtbaren Reiter und Hinweis auf die Ersteinrichtung.

import { el } from '../ui/dom.js';
import { istEingerichtet } from '../store.js';
import { START } from '../config.js';

export function render(container, ctx) {
    container.append(
        el('h1', { class: 'start-logo' }, [
            el('img', { attrs: { src: 'icons/thetadex-karte.svg', alt: '', width: '80', height: '88' } }),
            el('span', { text: 'Thetadex' })
        ]),
        el('p', { class: 'leise start-version', text: 'Version ' + ctx.version })
    );

    // Reihenfolge der Kacheln (16.3): zuerst wie in START, dann der Rest wie in der Leiste
    const platz = (b) => (START.includes(b.id) ? START.indexOf(b.id) : START.length + ctx.sichtbar.indexOf(b));
    const kacheln = ctx.sichtbar.slice().sort((a, b) => platz(a) - platz(b));
    if (kacheln.length) {
        container.append(el('ul', { class: 'kacheln' }, kacheln.map((b) => el('li', {}, [
            el('a', { class: 'kachel-link', attrs: { href: '#/' + b.id, 'data-bereich': b.id } }, [
                el('span', { class: 'reiter-symbol', attrs: { 'data-symbol': b.id, 'aria-hidden': 'true' } }),
                el('span', { text: b.titel })
            ])
        ]))));
    }

    if (!istEingerichtet()) {
        container.append(el('div', { class: 'karte' }, [
            el('h2', { text: 'Noch nicht eingerichtet' }),
            el('p', { text: 'Trage einmal dein Passwort und die Adressen deiner Skripte ein. Sie bleiben nur auf diesem Gerät.' }),
            el('a', { class: 'knopf', text: 'Zu den Einstellungen', attrs: { href: '#/einstellungen' } })
        ]));
    }
}
