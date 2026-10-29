// Thetadex – Start, Reiterleiste, Routing (#/<bereich>) und Hinweis auf neue Version.

import { VERSION, features, BEREICHE } from './config.js';
import { el, leeren } from './ui/dom.js';
import { istEingerichtet } from './store.js';
import * as start from './views/start.js';
import * as platzhalter from './views/platzhalter.js';
import * as einrichtung from './views/einrichtung.js';
import * as info from './views/info.js';
import * as nichtgefunden from './views/nichtgefunden.js';
import * as doener from './views/doener.js';
import * as tracking from './views/tracking.js';

const aktiv = BEREICHE.filter((b) => features[b.id]);

// Ohne Einrichtung nur die öffentlichen Reiter.
function sichtbareBereiche() {
    return istEingerichtet() ? aktiv : aktiv.filter((b) => b.oeffentlich);
}

// Adresse → Ansicht. Reiter ohne eigene Ansicht zeigen vorerst den Platzhalter.
const ANSICHTEN = {
    '': start,
    einrichtung,
    info
};
aktiv.forEach((b) => { ANSICHTEN[b.id] = platzhalter; });
ANSICHTEN.doener = doener;
ANSICHTEN.tracking = tracking;

// Baut die Leiste nur neu, wenn sich die sichtbaren Reiter geändert haben (z. B. nach der Einrichtung).
let leisteFuer = '';
function baueReiter(sichtbar) {
    const schluessel = sichtbar.map((b) => b.id).join(',');
    if (schluessel === leisteFuer) return;
    leisteFuer = schluessel;
    const leiste = document.getElementById('reiter');
    leeren(leiste);
    sichtbar.forEach((b) => {
        leiste.append(el('a', {
            class: 'reiter-link',
            attrs: { href: '#/' + b.id, 'data-route': b.id, 'data-bereich': b.id }
        }, [
            el('span', { class: 'reiter-symbol', attrs: { 'data-symbol': b.id, 'aria-hidden': 'true' } }),
            el('span', { class: 'reiter-name', text: b.titel })
        ]));
    });
}

function aktuelleRoute() {
    return location.hash.replace(/^#\/?/, '').split('/')[0];
}

function zeigeAnsicht() {
    const sichtbar = sichtbareBereiche();
    baueReiter(sichtbar);
    let route = aktuelleRoute();
    // Private Reiter ohne Einrichtung: zur Startseite
    if (aktiv.some((b) => b.id === route) && !sichtbar.some((b) => b.id === route)) route = '';
    const ansicht = ANSICHTEN[route] || nichtgefunden;
    const container = document.getElementById('inhalt');
    const bereich = sichtbar.find((b) => b.id === route) || null;

    leeren(container);
    if (bereich) container.setAttribute('data-bereich', bereich.id);
    else container.removeAttribute('data-bereich');

    const teile = location.hash.replace(/^#\/?/, '').split('/').slice(1);
    ansicht.render(container, { route, teile, bereich, sichtbar, version: VERSION });

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

    // Neu laden nur, wenn auf dieser Seite „Jetzt neu laden“ getippt wurde.
    // Sonst würde die Seite beim ersten Besuch (Service Worker übernimmt) oder durch ein anderes Fenster
    // von selbst neu laden, und halb ausgefüllte Formulare wären weg.
    let gewuenscht = false;
    knopf.addEventListener('click', () => {
        if (!wartend) return;
        // Schon von einem anderen Fenster übernommen: einfach neu laden
        if (wartend.state === 'activated') { location.reload(); return; }
        gewuenscht = true;
        wartend.postMessage('skipWaiting');
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!gewuenscht) return;
        gewuenscht = false;
        location.reload();
    });
}

window.addEventListener('hashchange', zeigeAnsicht);
zeigeAnsicht();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((reg) => { beobachteUpdates(reg); reg.update(); })
            .catch(() => {});
    });
}
