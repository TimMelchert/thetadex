// Startseite: Name, Version, Kacheln der sichtbaren Reiter und Hinweis auf die Ersteinrichtung.

import { el } from '../ui/dom.js';
import { istEingerichtet } from '../store.js';

export function render(container, ctx) {
    container.append(
        el('h1', { class: 'start-logo' }, [
            el('img', { attrs: { src: 'icons/thetadex-icon.svg', alt: '', width: '72', height: '72' } }),
            el('span', { text: 'Thetadex' })
        ]),
        el('p', { class: 'leise start-version', text: 'Version ' + ctx.version })
    );

    if (ctx.sichtbar.length) {
        container.append(el('ul', { class: 'kacheln' }, ctx.sichtbar.map((b) => el('li', {}, [
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
            el('a', { class: 'knopf', text: 'Zur Einrichtung', attrs: { href: '#/einrichtung' } })
        ]));
    }
}
