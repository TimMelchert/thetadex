// Info: Version und kurzer Hinweis zum Datenschutz.

import { el } from '../ui/dom.js';

export function render(container, ctx) {
    container.append(
        el('h1', { text: 'Info' }),
        el('div', { class: 'karte' }, [
            el('p', { text: 'Thetadex, Version ' + ctx.version }),
            el('p', { text: 'Deine Daten liegen in deinen Google Sheets. Diese Seite speichert auf diesem Gerät Passwort, Script-Adressen und Einstellungen, dazu die letzten Kontostände, die Einkaufsliste, die Uni-Daten für ohne Netz und die eigenen Teilen-Links. Abmelden unter Einstellungen löscht alles.' })
        ])
    );
}
