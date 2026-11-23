// Reiter Projekte (Etappe 16, docs/PLAN-ETAPPE-16.md). Eine schlichte Übersicht über Projekte mit Titel, Notiz und Status.
// Ein Projekt kann Abschnitte haben (zweite Ebene). Vor jedem Eintrag ein bunter Kreis in der Farbe seines Status.
// Eine Liste, nicht nach Status gruppiert; Projekte und Abschnitte (je Projekt) mit Pfeilen ^ und v sortierbar.
// Ein Tipp auf den Titel klappt auf (Notiz, Status, Abschnitte). Person und Partner*in dürfen alles (das Skript prüft es).
// Daten aus dem Skript „gemeinsam“ (Sheet „Gemeinsam“, Blatt „projekte“). Nur im Arbeitsspeicher.

import { el, leeren, vergleiche } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';

// Zuletzt geladene Daten { projekte, rolle }, nur im Arbeitsspeicher. Beim Öffnen sofort zeigen, dann frisch laden.
let daten = null;
// Aufgeklappte Einträge (ids), solange die Seite offen ist
const offen = new Set();
const MAX_TITEL = 80;
const MAX_NOTIZ = 1000;

// Feste Status (keine persönlichen Daten). Farbe über CSS (.projekt-punkt.ist-<wert>).
const STATUS = [
    { wert: 'idee', text: 'Idee' },
    { wert: 'laeuft', text: 'Läuft' },
    { wert: 'pausiert', text: 'Pausiert' },
    { wert: 'fertig', text: 'Fertig' }
];
const statusText = (w) => (STATUS.find((s) => s.wert === w) || STATUS[0]).text;

// Kleine Zahl zuerst; gleiche Zahl nach Titel
const ordne = (a, b) => (a.reihenfolge - b.reihenfolge) || vergleiche(a.titel, b.titel);
const projekte = () => (daten ? daten.projekte.filter((p) => !p.projekt).sort(ordne) : []);
const abschnitte = (id) => (daten ? daten.projekte.filter((p) => p.projekt === id).sort(ordne) : []);
const geschwister = (p) => (p.projekt ? abschnitte(p.projekt) : projekte());

// Bunter Kreis; für Bildschirmleser mit dem Status als Wort
function punkt(p) {
    return el('span', { class: 'projekt-punkt ist-' + p.status, attrs: { role: 'img', 'aria-label': 'Status: ' + statusText(p.status) } });
}

export function render(container, ctx) {
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'projekt-dialog-titel' } });
    let sendet = false; // gegen doppeltes Senden durch mehrfaches Tippen

    function oeffneDialog(titel, inhalt) {
        leeren(dialog);
        dialog.append(el('div', { class: 'besitz-dialog-inhalt' }, [
            el('div', { class: 'form-kopf' }, [
                el('h2', { text: titel, attrs: { id: 'projekt-dialog-titel' } }),
                el('button', { class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Schließen' }, on: { click: () => dialog.close() } })
            ]),
            ...inhalt
        ]));
        if (!dialog.open) dialog.showModal();
        dialog.scrollTop = 0;
    }

    // Führt eine Anfrage aus: sperrt die Knöpfe, zeigt Fehler in status. Liefert die Antwort oder null.
    async function senden(status, knoepfe, action, werte) {
        if (sendet) return null;
        sendet = true;
        knoepfe.forEach((k) => { k.disabled = true; });
        status.textContent = 'Sende …';
        try {
            const antwort = await api('gemeinsam', action, werte);
            status.textContent = '';
            return antwort;
        } catch (e) {
            status.textContent = 'NICHT gespeichert: ' + e.message;
            return null;
        } finally {
            sendet = false;
            knoepfe.forEach((k) => { k.disabled = false; });
        }
    }

    // Gespeicherten Eintrag in die Liste übernehmen
    function merke(p) {
        const i = daten.projekte.findIndex((x) => x.id === p.id);
        if (i >= 0) daten.projekte[i] = p; else daten.projekte.push(p);
    }

    // --- Formular: neu oder ändern. eltern = Projekt, wenn ein neuer Abschnitt entsteht ---
    function zeigeForm(p, eltern) {
        const istAbschnitt = p ? Boolean(p.projekt) : Boolean(eltern);
        const wort = istAbschnitt ? 'Abschnitt' : 'Projekt';
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const titel = el('input', { attrs: { id: 'projekt-f-titel', type: 'text', maxlength: MAX_TITEL, autocomplete: 'off', value: p ? p.titel : '' } });
        const wahl = el('select', { attrs: { id: 'projekt-f-status' } }, STATUS.map((s) => el('option', { text: s.text, attrs: { value: s.wert } })));
        wahl.value = p ? p.status : 'idee';
        const notiz = el('textarea', { attrs: { id: 'projekt-f-notiz', maxlength: MAX_NOTIZ, rows: 5, placeholder: 'freiwillig' } });
        notiz.value = p ? p.notiz : '';

        const speichern = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const loeschen = p ? el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button' }, on: { click: () => entfernen() } }) : null;
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        const knoepfe = [speichern, loeschen, abbrechen].filter(Boolean);

        async function absenden(ev) {
            ev.preventDefault();
            const t = titel.value.trim();
            if (!t) { status.textContent = 'Bitte einen Titel eingeben.'; titel.focus(); return; }
            const werte = { titel: t, status: wahl.value, notiz: notiz.value };
            if (p) { werte.id = p.id; werte.geaendert_am = p.geaendert_am; } else if (eltern) { werte.projekt = eltern.id; }
            const antwort = await senden(status, knoepfe, 'projekt_speichern', werte);
            if (!antwort || !antwort.projekt) return;
            merke(antwort.projekt);
            // Ein neuer Abschnitt: sein Projekt bleibt aufgeklappt
            if (eltern) offen.add(eltern.id);
            dialog.close();
            zeigeGespeichert(p ? 'Geändert' : 'Gespeichert', antwort.projekt.titel);
            zeigeListe();
        }

        // Löschen ist weich: Im Sheet steht dann geloescht = TRUE. Ein Projekt nimmt seine Abschnitte mit.
        async function entfernen() {
            const n = istAbschnitt ? 0 : abschnitte(p.id).length;
            const frage = '„' + p.titel + '“ löschen?' + (n === 1 ? ' Der Abschnitt darin wird mitgelöscht.' : n ? ' Die ' + n + ' Abschnitte darin werden mitgelöscht.' : '');
            if (!confirm(frage)) return;
            const antwort = await senden(status, knoepfe, 'projekt_loeschen', { id: p.id, geaendert_am: p.geaendert_am });
            if (!antwort) return;
            daten.projekte = daten.projekte.filter((x) => x.id !== p.id && x.projekt !== p.id);
            dialog.close();
            zeigeGespeichert('Gelöscht', p.titel);
            zeigeListe();
        }

        oeffneDialog(p ? wort + ' ändern' : (eltern ? 'Neuer Abschnitt in „' + eltern.titel + '“' : 'Neues Projekt'), [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden, input: () => { if (!sendet) status.textContent = ''; } } }, [
                el('label', { text: 'Titel', attrs: { for: 'projekt-f-titel' } }), titel,
                el('label', { text: 'Status', attrs: { for: 'projekt-f-status' } }), wahl,
                el('label', { text: 'Notiz', attrs: { for: 'projekt-f-notiz' } }), notiz,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        titel.focus();
    }

    // --- Reihenfolge: Pfeile ^ und v. Verschieben wirkt sofort, gespeichert wird kurz nach dem letzten Tippen. ---
    const reiheText = el('span');
    const reiheNochmal = el('button', { class: 'knopf knopf-zweit', text: 'Nochmal speichern', attrs: { type: 'button', hidden: true }, on: { click: () => speichereReihe() } });
    const reiheStatus = el('p', { class: 'meldung einkauf-reihe-status projekt-reihe', attrs: { role: 'status', 'aria-live': 'polite' } }, [reiheText, reiheNochmal]);
    let reiheTimer = 0;
    let reiheFertigTimer = 0;

    function schiebe(p, d) {
        const gruppe = geschwister(p);
        const i = gruppe.findIndex((x) => x.id === p.id);
        const nachbar = gruppe[i + d];
        if (i < 0 || !nachbar) return;
        // In der Folge aller Einträge die beiden tauschen, dann wie das Skript der Reihe nach 1, 2, 3 …
        const alle = daten.projekte.slice().sort(ordne);
        const a = alle.indexOf(p), b = alle.indexOf(nachbar);
        [alle[a], alle[b]] = [alle[b], alle[a]];
        alle.forEach((x, k) => { x.reihenfolge = k + 1; });
        zeigeListe();
        // Den Finger am gleichen Pfeil lassen; ist er jetzt aus (ganz oben oder unten), den anderen nehmen
        const knoepfe = [...listeBox.querySelectorAll('.einkauf-reihe-pfeil')].filter((k) => k.dataset.id === p.id);
        const ziel = knoepfe.find((k) => k.dataset.d === String(d) && !k.disabled) || knoepfe.find((k) => !k.disabled);
        if (ziel) ziel.focus();
        clearTimeout(reiheTimer);
        clearTimeout(reiheFertigTimer);
        reiheNochmal.hidden = true;
        reiheText.textContent = 'Wird gleich gespeichert …';
        reiheTimer = setTimeout(speichereReihe, 900);
    }
    async function speichereReihe() {
        clearTimeout(reiheTimer);
        if (sendet) { reiheTimer = setTimeout(speichereReihe, 600); return; }
        const ids = daten.projekte.slice().sort(ordne).map((x) => x.id);
        reiheNochmal.hidden = true;
        const antwort = await senden(reiheText, [], 'projekt_reihenfolge', { ids });
        if (!antwort) { reiheNochmal.hidden = false; return; }
        // Inzwischen weiter geschoben? Dann gilt die neue Reihenfolge, sie wird gleich gespeichert.
        const jetzt = daten.projekte.slice().sort(ordne).map((x) => x.id);
        if (jetzt.join('\n') === ids.join('\n') && Array.isArray(antwort.projekte)) {
            daten.projekte = antwort.projekte;
            zeigeListe();
        }
        if (reiheText.textContent === '') reiheText.textContent = 'Reihenfolge gespeichert.';
        reiheFertigTimer = setTimeout(() => { if (reiheText.textContent === 'Reihenfolge gespeichert.') reiheText.textContent = ''; }, 3000);
    }

    // --- Aufgeklappt: Notiz, Status als Wort, bei Projekten die Abschnitte, Knöpfe ---
    function inhalt(p) {
        const teile = [el('p', { class: 'leise', text: 'Status: ' + statusText(p.status) })];
        if (p.notiz) teile.push(el('p', { class: 'einkauf-notiz', text: p.notiz }));
        if (!p.projekt) {
            const liste = abschnitte(p.id);
            if (liste.length) teile.push(el('ul', { class: 'einkauf-liste projekt-abschnitte', attrs: { 'aria-label': 'Abschnitte' } }, liste.map((a, i) => zeile(a, i, liste.length))));
        }
        teile.push(el('div', { class: 'besitz-form-knoepfe' }, [
            p.projekt ? null : el('button', { class: 'knopf knopf-zweit', text: '+ Abschnitt', attrs: { type: 'button' }, on: { click: () => zeigeForm(null, p) } }),
            el('button', { class: 'knopf knopf-zweit', text: 'Bearbeiten', attrs: { type: 'button' }, on: { click: () => zeigeForm(p) } })
        ].filter(Boolean)));
        return el('div', { class: 'einkauf-rezept-inhalt' }, teile);
    }

    // Eine Zeile: Kreis, Titel (Tipp klappt auf), Pfeile
    function zeile(p, i, anzahl) {
        const istOffen = offen.has(p.id);
        const n = p.projekt ? 0 : abschnitte(p.id).length;
        const pfeile = anzahl > 1 ? el('span', { class: 'einkauf-reihe-pfeile' }, [-1, 1].map((d) => el('button', {
            class: 'einkauf-reihe-pfeil ' + (d < 0 ? 'ist-hoch' : 'ist-runter'),
            attrs: { type: 'button', 'aria-label': p.titel + (d < 0 ? ' nach oben' : ' nach unten'), disabled: d < 0 ? i === 0 : i === anzahl - 1, 'data-id': p.id, 'data-d': String(d) },
            on: { click: () => schiebe(p, d) }
        }))) : null;
        return el('li', { class: 'einkauf-zeile einkauf-lm einkauf-rezept projekt-zeile' + (istOffen ? ' ist-offen' : '') }, [
            punkt(p),
            el('button', {
                class: 'einkauf-lm-wahl', attrs: { type: 'button', 'aria-expanded': istOffen ? 'true' : 'false' },
                on: { click: () => { if (istOffen) offen.delete(p.id); else offen.add(p.id); zeigeListe(); } }
            }, [
                el('span', { class: 'einkauf-lm-name' }, [
                    el('span', { class: 'einkauf-pfeil', text: istOffen ? '▾ ' : '▸ ', attrs: { 'aria-hidden': 'true' } }),
                    el('span', { text: p.titel })
                ]),
                n ? el('span', { class: 'leise einkauf-klein', text: n === 1 ? '1 Abschnitt' : n + ' Abschnitte' }) : null
            ]),
            pfeile,
            istOffen ? inhalt(p) : null
        ]);
    }

    // --- Liste ---
    const listeBox = el('div', { class: 'projekt-liste' });
    function zeigeListe() {
        leeren(listeBox);
        if (!daten) return;
        neuKnopf.hidden = false;
        const liste = projekte();
        [...offen].forEach((id) => { if (!daten.projekte.some((p) => p.id === id)) offen.delete(id); });
        listeBox.append(liste.length
            ? el('ul', { class: 'einkauf-liste' }, liste.map((p, i) => zeile(p, i, liste.length)))
            : el('p', { class: 'leise', text: 'Noch keine Projekte. Tippe auf „+ Neues Projekt“.' }));
    }

    // --- Laden ---
    const ladeStatus = el('p', { class: 'meldung besitz-lade', attrs: { role: 'status', 'aria-live': 'polite' } });
    const neuLaden = el('button', { class: 'knopf knopf-zweit besitz-neu', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => laden() } });
    async function laden() {
        neuLaden.disabled = true;
        ladeStatus.textContent = daten ? 'Aktualisiere …' : 'Lädt …';
        try {
            const d = await api('gemeinsam', 'projekte');
            daten = { projekte: Array.isArray(d.projekte) ? d.projekte : [], rolle: d.rolle || '' };
            ladeStatus.textContent = '';
            zeigeListe();
        } catch (e) {
            ladeStatus.textContent = 'Laden fehlgeschlagen: ' + e.message
                + (e.code === 'aktion' ? ' Bitte im Sheet „Gemeinsam“ die neue Fassung des Skripts einfügen, „einrichten“ ausführen und bereitstellen (Schritt 16.1).' : '');
        } finally {
            neuLaden.disabled = false;
        }
    }

    const neuKnopf = el('button', { class: 'knopf knopf-bereich', text: '+ Neues Projekt', attrs: { type: 'button', hidden: true }, on: { click: () => zeigeForm(null) } });
    container.append(
        el('div', { class: 'besitz-kopf' }, [
            el('h1', { class: 'bereich-titel titel-mit-emoji' }, [
                el('span', { class: 'titel-emoji', text: '🛠️', attrs: { 'aria-hidden': 'true' } }),
                el('span', { text: ctx.bereich.titel })
            ]),
            neuKnopf
        ]),
        ladeStatus,
        reiheStatus,
        listeBox,
        neuLaden,
        dialog
    );
    zeigeListe();
    laden();
}
