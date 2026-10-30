// Auswahlfeld mit Freitext: Textfeld, Pfeil-Knopf und Liste zum Antippen.
// Tipp ins Feld oder auf den Pfeil öffnet die Liste. Tippen filtert die Liste. Eigene Eingaben sind erlaubt. Texte nur über textContent.

import { el, leeren } from './dom.js';

// auswahlFeld({ id, maxlength, placeholder, eintraege: [...], beiWahl(text) })
// Gibt { box, feld, setzeEintraege(liste) } zurück.
export function auswahlFeld({ id, maxlength = 100, placeholder = '', eintraege = [], beiWahl = null }) {
    let liste = [];
    const feld = el('input', {
        attrs: {
            id, type: 'text', autocomplete: 'off', maxlength, placeholder,
            role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': id + '-liste'
        }
    });
    const auswahl = el('ul', { class: 'auswahl-liste', attrs: { id: id + '-liste', role: 'listbox' } });
    auswahl.hidden = true;
    const pfeil = el('button', {
        class: 'auswahl-pfeil', text: '▾',
        attrs: { type: 'button', 'aria-label': 'Liste öffnen', tabindex: '-1' },
        on: { click: () => (auswahl.hidden ? oeffne('') : schliesse()) }
    });

    function schliesse() {
        auswahl.hidden = true;
        feld.setAttribute('aria-expanded', 'false');
    }

    function oeffne(filter) {
        const f = filter.trim().toLowerCase();
        const treffer = f ? liste.filter((t) => t.toLowerCase().includes(f)) : liste;
        leeren(auswahl);
        treffer.forEach((t) => auswahl.append(el('li', { attrs: { role: 'option' } }, [
            el('button', {
                class: 'auswahl-eintrag', text: t, attrs: { type: 'button', tabindex: '-1' },
                on: { click: () => { feld.value = t; schliesse(); feld.focus(); if (beiWahl) beiWahl(t); } }
            })
        ])));
        auswahl.hidden = treffer.length === 0;
        feld.setAttribute('aria-expanded', auswahl.hidden ? 'false' : 'true');
    }

    feld.addEventListener('input', () => oeffne(feld.value));
    // Tipp irgendwo ins Feld öffnet die ganze Liste (nicht nur der kleine Pfeil). Eintippen bleibt möglich.
    feld.addEventListener('click', () => (auswahl.hidden ? oeffne('') : schliesse()));
    feld.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') schliesse();
        if (ev.key === 'ArrowDown') {
            ev.preventDefault();
            if (auswahl.hidden) oeffne(feld.value);
            const erster = auswahl.querySelector('button');
            if (erster) erster.focus();
        }
    });
    auswahl.addEventListener('keydown', (ev) => {
        const knoepfe = [...auswahl.querySelectorAll('button')];
        const i = knoepfe.indexOf(document.activeElement);
        if (ev.key === 'ArrowDown' && i < knoepfe.length - 1) { ev.preventDefault(); knoepfe[i + 1].focus(); }
        if (ev.key === 'ArrowUp') { ev.preventDefault(); (i > 0 ? knoepfe[i - 1] : feld).focus(); }
        if (ev.key === 'Escape') { schliesse(); feld.focus(); }
    });

    const box = el('div', { class: 'auswahl' }, [feld, pfeil, auswahl]);
    // Klick außerhalb schließt die Liste
    box.addEventListener('focusout', () => {
        setTimeout(() => { if (!box.contains(document.activeElement)) schliesse(); }, 0);
    });

    function setzeEintraege(neu) {
        liste = [...new Set(neu.map((t) => String(t)))].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }));
    }
    setzeEintraege(eintraege);

    return { box, feld, setzeEintraege };
}
