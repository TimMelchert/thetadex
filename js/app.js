// Thetadex – Start, Reiterleiste, Routing (#/<bereich>) und Hinweis auf neue Version.

import { VERSION, features, BEREICHE } from './config.js';
import { el, leeren } from './ui/dom.js';
import * as start from './views/start.js';
import * as platzhalter from './views/platzhalter.js';
import * as einrichtung from './views/einrichtung.js';
import * as info from './views/info.js';
import * as nichtgefunden from './views/nichtgefunden.js';

const sichtbar = BEREICHE.filter((b) => features[b.id]);

// Adresse → Ansicht. Reiter ohne eigene Ansicht zeigen vorerst den Platzhalter.
const ANSICHTEN = {
    '': start,
    einrichtung,
    info
};
sichtbar.forEach((b) => { ANSICHTEN[b.id] = platzhalter; });

function baueReiter() {
    const leiste = document.getElementById('reiter');
    leeren(leiste);
    sichtbar.forEach((b) => {
        leiste.append(el('a', {
            class: 'reiter-link',
            text: b.titel,
            attrs: { href: '#/' + b.id, 'data-route': b.id, 'data-bereich': b.id }
        }));
    });
}

function aktuelleRoute() {
    return location.hash.replace(/^#\/?/, '').split('/')[0];
}

function zeigeAnsicht() {
    const route = aktuelleRoute();
    const ansicht = ANSICHTEN[route] || nichtgefunden;
    const container = document.getElementById('inhalt');
    const bereich = sichtbar.find((b) => b.id === route) || null;

    leeren(container);
    if (bereich) container.setAttribute('data-bereich', bereich.id);
    else container.removeAttribute('data-bereich');

    ansicht.render(container, { route, bereich, version: VERSION });

    document.querySelectorAll('[data-route]').forEach((a) => {
        if (a.getAttribute('data-route') === route) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    });
    container.focus({ preventScroll: true });
}

// Neue Version: Hinweis zeigen, auf Tipp neu laden.
function beobachteUpdates(reg) {
    const hinweis = document.getElementById('update-hinweis');
    const knopf = document.getElementById('update-knopf');
    let wartend = null;

    const zeige = (sw) => { wartend = sw; hinweis.hidden = false; };

    if (reg.waiting && navigator.serviceWorker.controller) zeige(reg.waiting);
    reg.addEventListener('updatefound', () => {
        const neu = reg.installing;
        if (!neu) return;
        neu.addEventListener('statechange', () => {
            if (neu.state === 'installed' && navigator.serviceWorker.controller) zeige(neu);
        });
    });

    knopf.addEventListener('click', () => {
        if (wartend) wartend.postMessage('skipWaiting');
    });

    let neuGeladen = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (neuGeladen) return;
        neuGeladen = true;
        location.reload();
    });
}

baueReiter();
window.addEventListener('hashchange', zeigeAnsicht);
zeigeAnsicht();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((reg) => { beobachteUpdates(reg); reg.update(); })
            .catch(() => {});
    });
}
