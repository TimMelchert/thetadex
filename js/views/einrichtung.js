// Ersteinrichtung: Passwort und Script-Adressen, gespeichert nur im Gerät.

import { el, leeren } from '../ui/dom.js';
import { lesen, schreiben, abmelden } from '../store.js';
import { SKRIPTE } from '../config.js';
import { api } from '../api.js';

// Eine gültige Adresse einer Apps-Script-Web-App
const SKRIPT_MUSTER = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

export function render(container) {
    const skripte = lesen('skripte', {}) || {};
    const meldung = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });

    const passwortFeld = el('input', {
        attrs: { id: 'feld-passwort', type: 'password', autocomplete: 'current-password', placeholder: lesen('passwort') ? 'gespeichert – nur zum Ändern ausfüllen' : '' }
    });

    const adressFelder = SKRIPTE.map((s) => ({
        id: s.id,
        feld: el('input', {
            attrs: { id: 'feld-skript-' + s.id, type: 'url', inputmode: 'url', autocomplete: 'off', spellcheck: 'false', value: skripte[s.id] || '' }
        }),
        titel: s.titel
    }));

    function speichern(ev) {
        ev.preventDefault();
        const neu = {};
        for (const a of adressFelder) {
            const wert = a.feld.value.trim();
            if (!wert) continue;
            if (!SKRIPT_MUSTER.test(wert)) {
                meldung.textContent = 'Die Adresse für ' + a.titel + ' sieht nicht richtig aus. Sie beginnt mit https://script.google.com/macros/s/ und endet mit /exec.';
                a.feld.focus();
                return;
            }
            neu[a.id] = wert;
        }
        const pw = passwortFeld.value;
        if (!pw && !lesen('passwort')) {
            meldung.textContent = 'Bitte ein Passwort eintragen.';
            passwortFeld.focus();
            return;
        }
        const ok = schreiben('skripte', neu) && (!pw || schreiben('passwort', pw));
        passwortFeld.value = '';
        meldung.textContent = ok ? 'Gespeichert.' : 'Konnte nicht speichern. Ist der private Modus des Browsers an?';
        if (ok) passwortFeld.setAttribute('placeholder', 'gespeichert – nur zum Ändern ausfüllen');
    }

    // Fragt jedes eingetragene Skript mit einer Aktion, die nur liest.
    async function pruefen() {
        const gespeichert = lesen('skripte', {}) || {};
        leeren(ergebnis);
        const liste = SKRIPTE.filter((s) => gespeichert[s.id]);
        if (!liste.length) {
            ergebnis.append(el('li', { text: 'Noch keine Script-Adresse gespeichert.' }));
            return;
        }
        pruefKnopf.disabled = true;
        for (const s of liste) {
            const zeile = el('li', { text: s.titel + ': wird geprüft …' });
            ergebnis.append(zeile);
            try {
                await api(s.id, s.test);
                zeile.textContent = s.titel + ': Verbindung klappt.';
            } catch (e) {
                zeile.textContent = s.titel + ': ' + e.message;
            }
        }
        pruefKnopf.disabled = false;
    }

    function allesLoeschen() {
        if (!confirm('Passwort und Script-Adressen von diesem Gerät löschen?')) return;
        abmelden();
        location.hash = '#/';
    }

    const formular = el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: speichern } }, [
        el('label', { text: 'Passwort', attrs: { for: 'feld-passwort' } }),
        passwortFeld,
        ...adressFelder.flatMap((a) => [
            el('label', { text: 'Script-Adresse ' + a.titel, attrs: { for: 'feld-skript-' + a.id } }),
            a.feld
        ]),
        el('button', { class: 'knopf', text: 'Speichern', attrs: { type: 'submit' } })
    ]);

    const ergebnis = el('ul', { class: 'pruefliste', attrs: { 'aria-live': 'polite' } });
    const pruefKnopf = el('button', { class: 'knopf knopf-zweit', text: 'Verbindung prüfen', attrs: { type: 'button' }, on: { click: pruefen } });

    container.append(
        el('h1', { text: 'Einrichtung' }),
        el('p', { class: 'leise', text: 'Alles hier bleibt nur auf diesem Gerät gespeichert. Nichts davon landet im Repo.' }),
        formular,
        meldung,
        el('h2', { text: 'Verbindung' }),
        el('p', { text: 'Prüft mit den gespeicherten Angaben, ob jedes Skript antwortet. Es wird nichts eingetragen.' }),
        pruefKnopf,
        ergebnis,
        el('h2', { text: 'Abmelden' }),
        el('p', { text: 'Löscht Passwort und Adressen von diesem Gerät.' }),
        el('button', { class: 'knopf knopf-zweit', text: 'Abmelden', attrs: { type: 'button' }, on: { click: allesLoeschen } })
    );
}
