// Reiter Besitz: Liste aller Sachen nach Ort und Formular zum Hinzufügen.
// Daten aus dem Skript „leben“ (Sheet „Leben“, Blatt „besitz“). Nur mit Passwort.
// Die Liste liegt nur im Arbeitsspeicher, solange die Seite offen ist, nie im Gerät (docs/PLAN-ETAPPE-3.md).

import { el, leeren, heute, kalenderBeiKlick } from '../ui/dom.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';

// Zuletzt geladene Liste, nur im Arbeitsspeicher. Beim Öffnen sofort zeigen, dann frisch laden.
let sachen = null;

const euro = (v) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const datumText = (t) => (/^\d{4}-\d{2}-\d{2}$/.test(t) ? t.slice(8, 10) + '.' + t.slice(5, 7) + '.' + t.slice(0, 4) : '');
const vergleiche = (a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true });

export function render(container, ctx) {
    const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const listeBox = el('div', { class: 'besitz-liste' });

    // --- Formular ---
    const name = el('input', { attrs: { id: 'besitz-name', type: 'text', maxlength: 80, autocomplete: 'off' } });
    const kategorie = auswahlFeld({ id: 'besitz-kategorie', maxlength: 40, placeholder: 'wählen oder eintippen' });
    const ort = auswahlFeld({ id: 'besitz-ort', maxlength: 60, placeholder: 'wählen oder eintippen' });
    const anzahl = el('input', { attrs: { id: 'besitz-anzahl', type: 'number', inputmode: 'numeric', min: '0', max: '9999', step: '1', value: '1' } });
    const preis = el('input', { attrs: { id: 'besitz-preis', type: 'number', inputmode: 'decimal', min: '0', step: '0.01', placeholder: 'freiwillig' } });
    const datum = kalenderBeiKlick(el('input', { attrs: { id: 'besitz-datum', type: 'date', max: heute(), autocomplete: 'off' } }));
    const notiz = el('textarea', { attrs: { id: 'besitz-notiz', maxlength: 300, rows: 2, placeholder: 'freiwillig' } });
    const speichernKnopf = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });

    let sendet = false; // gegen doppelte Einträge durch mehrfaches Tippen
    async function speichern(ev) {
        ev.preventDefault();
        if (sendet) return;
        const werte = {
            name: name.value.trim(),
            kategorie: kategorie.feld.value.trim(),
            ort: ort.feld.value.trim(),
            anzahl: anzahl.value.trim(),
            kaufpreis: preis.value.trim(),
            kaufdatum: datum.value,
            notiz: notiz.value.trim()
        };
        const fehlt = [[werte.name, name, 'einen Namen'], [werte.kategorie, kategorie.feld, 'eine Kategorie'], [werte.ort, ort.feld, 'einen Ort']]
            .find(([w]) => !w);
        if (fehlt) {
            status.textContent = 'Bitte ' + fehlt[2] + ' eingeben.';
            fehlt[1].focus();
            return;
        }
        const n = Number(werte.anzahl);
        if (werte.anzahl === '' || !Number.isInteger(n) || n < 0 || n > 9999) {
            status.textContent = 'Anzahl bitte als ganze Zahl von 0 bis 9999.';
            anzahl.focus();
            return;
        }
        if (werte.kaufpreis !== '' && !(Number(werte.kaufpreis) >= 0)) {
            status.textContent = 'Bitte einen gültigen Kaufpreis eingeben oder das Feld leer lassen.';
            preis.focus();
            return;
        }
        if (werte.kaufdatum && werte.kaufdatum > heute()) {
            status.textContent = 'Das Kaufdatum liegt in der Zukunft.';
            datum.focus();
            return;
        }

        sendet = true;
        speichernKnopf.disabled = true;
        status.textContent = 'Speichere …';
        try {
            const antwort = await api('leben', 'speichern', { ...werte, anzahl: n });
            if (sachen) sachen.push(antwort.sache);
            // Ort bleibt stehen (praktisch beim Einräumen eines Schranks), der Rest leert sich
            name.value = '';
            kategorie.feld.value = '';
            anzahl.value = '1';
            preis.value = '';
            datum.value = '';
            notiz.value = '';
            status.textContent = '';
            zeigeGespeichert('Gespeichert', antwort.sache.name);
            zeigeListe();
            name.focus();
        } catch (e) {
            status.textContent = 'NICHT gespeichert: ' + e.message;
        } finally {
            sendet = false;
            speichernKnopf.disabled = false;
        }
    }

    const formular = el('form', {
        class: 'formular besitz-formular', attrs: { novalidate: true },
        on: { submit: speichern, input: () => { if (!sendet) status.textContent = ''; } }
    }, [
        el('label', { text: 'Name', attrs: { for: 'besitz-name' } }), name,
        el('label', { text: 'Kategorie', attrs: { for: 'besitz-kategorie' } }), kategorie.box,
        el('label', { text: 'Ort', attrs: { for: 'besitz-ort' } }), ort.box,
        el('label', { text: 'Anzahl', attrs: { for: 'besitz-anzahl' } }), anzahl,
        el('label', { text: 'Kaufpreis (€)', attrs: { for: 'besitz-preis' } }), preis,
        el('label', { text: 'Kaufdatum', attrs: { for: 'besitz-datum' } }), datum,
        el('label', { text: 'Notiz', attrs: { for: 'besitz-notiz' } }), notiz,
        speichernKnopf,
        status
    ]);

    const formBox = el('div', { class: 'karte besitz-form-box', attrs: { id: 'besitz-formular', hidden: true } }, [
        el('div', { class: 'form-kopf' }, [
            el('h2', { text: 'Hinzufügen' }),
            el('button', { class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Formular schließen' }, on: { click: () => zeigeFormular(false) } })
        ]),
        formular
    ]);
    const neuKnopf = el('button', {
        class: 'knopf knopf-bereich', text: '+ Hinzufügen',
        attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'besitz-formular' },
        on: { click: () => zeigeFormular(formBox.hidden) }
    });

    function zeigeFormular(auf) {
        formBox.hidden = !auf;
        neuKnopf.setAttribute('aria-expanded', auf ? 'true' : 'false');
        if (auf) { status.textContent = ''; name.focus(); }
        else neuKnopf.focus();
    }

    // --- Liste ---
    function zeigeListe() {
        leeren(listeBox);
        if (!sachen) return;
        kategorie.setzeEintraege(sachen.map((s) => s.kategorie).filter(Boolean));
        ort.setzeEintraege(sachen.map((s) => s.ort).filter(Boolean));
        if (!sachen.length) {
            listeBox.append(el('p', { class: 'leise', text: 'Noch nichts eingetragen. Tippe auf „+ Hinzufügen“.' }));
            return;
        }
        // Nach Ort gruppiert, Orte und Sachen nach Name sortiert
        const orte = new Map();
        [...sachen].sort((a, b) => vergleiche(a.name, b.name)).forEach((s) => {
            if (!orte.has(s.ort)) orte.set(s.ort, []);
            orte.get(s.ort).push(s);
        });
        [...orte.keys()].sort(vergleiche).forEach((o) => listeBox.append(ortGruppe(o, orte.get(o))));
    }

    // Eine Tabelle je Ort. Am Handy macht css/components.css daraus Karten (Spaltenname über data-label).
    function ortGruppe(o, liste) {
        return el('section', { class: 'besitz-gruppe' }, [
            el('h2', { class: 'besitz-ort' }, [
                el('span', { text: o }),
                el('span', { class: 'besitz-zahl', text: liste.length === 1 ? '1 Sache' : liste.length + ' Sachen' })
            ]),
            el('table', { class: 'besitz-tabelle' }, [
                el('thead', {}, [el('tr', {}, [['Name'], ['Kategorie'], ['Anzahl', 'zahl'], ['Kaufpreis', 'zahl'], ['Kaufdatum']]
                    .map(([t, klasse]) => el('th', { class: klasse, text: t, attrs: { scope: 'col' } })))]),
                el('tbody', {}, liste.map(zeile))
            ])
        ]);
    }

    function zeile(s) {
        return el('tr', {}, [
            el('th', { class: 'besitz-name', attrs: { scope: 'row' } }, [
                el('span', { text: s.name }),
                s.notiz ? el('span', { class: 'besitz-notiz leise', text: s.notiz }) : null
            ]),
            el('td', { text: s.kategorie, attrs: { 'data-label': 'Kategorie' } }),
            el('td', { class: 'zahl', text: String(s.anzahl), attrs: { 'data-label': 'Anzahl' } }),
            el('td', { class: 'zahl', text: s.kaufpreis == null ? '' : euro(s.kaufpreis), attrs: { 'data-label': 'Kaufpreis' } }),
            el('td', { text: datumText(s.kaufdatum), attrs: { 'data-label': 'Kaufdatum' } })
        ]);
    }

    // --- Laden ---
    const ladeStatus = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const neuLaden = el('button', { class: 'knopf knopf-zweit besitz-neu', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => laden() } });

    async function laden() {
        neuLaden.disabled = true;
        ladeStatus.textContent = sachen ? 'Aktualisiere …' : 'Lädt …';
        try {
            const d = await api('leben', 'liste');
            sachen = Array.isArray(d.sachen) ? d.sachen : [];
            ladeStatus.textContent = '';
            zeigeListe();
        } catch (e) {
            ladeStatus.textContent = 'Laden fehlgeschlagen: ' + e.message;
        } finally {
            neuLaden.disabled = false;
        }
    }

    container.append(
        el('div', { class: 'besitz-kopf' }, [el('h1', { class: 'bereich-titel', text: ctx.bereich.titel }), neuKnopf]),
        formBox,
        ladeStatus,
        listeBox,
        neuLaden
    );
    zeigeListe();
    laden();
}
