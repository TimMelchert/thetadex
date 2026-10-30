// Reiter Besitz: Liste aller Sachen nach Ort, Hinzufügen, Ändern, Löschen, Suche, Filter und Sortieren.
// Daten aus dem Skript „leben“ (Sheet „Leben“, Blatt „besitz“). Nur mit Passwort.
// Die Liste liegt nur im Arbeitsspeicher, solange die Seite offen ist, nie im Gerät (docs/PLAN-ETAPPE-3.md).

import { el, leeren, heute, kalenderBeiKlick } from '../ui/dom.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';

// Zuletzt geladene Liste, nur im Arbeitsspeicher. Beim Öffnen sofort zeigen, dann frisch laden.
let sachen = null;
// Sortierung (PC, Tipp auf den Spaltenkopf). Bleibt, solange die Seite offen ist.
let sortierung = { spalte: 'name', ab: false };

// Spalten der Tabelle: [Schlüssel, Überschrift, rechtsbündig]
const SPALTEN = [['name', 'Name'], ['kategorie', 'Kategorie'], ['anzahl', 'Anzahl', true], ['kaufpreis', 'Kaufpreis', true], ['kaufdatum', 'Kaufdatum']];

const euro = (v) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const datumText = (t) => (/^\d{4}-\d{2}-\d{2}$/.test(t) ? t.slice(8, 10) + '.' + t.slice(5, 7) + '.' + t.slice(0, 4) : '');
const vergleiche = (a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true });
const klein = (t) => String(t == null ? '' : t).toLocaleLowerCase('de');

// Vergleich nach der gewählten Spalte; leere Werte immer ans Ende, bei Gleichstand nach Name
function nachSpalte(a, b) {
    const { spalte, ab } = sortierung;
    const x = a[spalte], y = b[spalte];
    const leerX = x == null || x === '', leerY = y == null || y === '';
    let e = 0;
    if (leerX || leerY) return leerX === leerY ? vergleiche(a.name, b.name) : (leerX ? 1 : -1);
    e = typeof x === 'number' ? x - y : vergleiche(String(x), String(y));
    if (ab) e = -e;
    return e || vergleiche(a.name, b.name);
}

export function render(container, ctx) {
    const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const listeBox = el('div', { class: 'besitz-liste' });
    let bearbeite = null; // Sache, die gerade geändert wird; null = neu

    // --- Formular ---
    const name = el('input', { attrs: { id: 'besitz-name', type: 'text', maxlength: 80, autocomplete: 'off' } });
    const kategorie = auswahlFeld({ id: 'besitz-kategorie', maxlength: 40, placeholder: 'wählen oder eintippen' });
    const ort = auswahlFeld({ id: 'besitz-ort', maxlength: 60, placeholder: 'wählen oder eintippen' });
    const anzahl = el('input', { attrs: { id: 'besitz-anzahl', type: 'number', inputmode: 'numeric', min: '0', max: '9999', step: '1', value: '1' } });
    const preis = el('input', { attrs: { id: 'besitz-preis', type: 'number', inputmode: 'decimal', min: '0', step: '0.01', placeholder: 'freiwillig' } });
    const datum = kalenderBeiKlick(el('input', { attrs: { id: 'besitz-datum', type: 'date', max: heute(), autocomplete: 'off' } }));
    const notiz = el('textarea', { attrs: { id: 'besitz-notiz', maxlength: 300, rows: 2, placeholder: 'freiwillig' } });
    const speichernKnopf = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
    const loeschenKnopf = el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button', hidden: true }, on: { click: () => loeschen() } });

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
            const alt = bearbeite;
            const antwort = await api('leben', 'speichern', alt ? { ...werte, anzahl: n, id: alt.id, geaendert_am: alt.geaendert_am } : { ...werte, anzahl: n });
            if (sachen) {
                const i = alt ? sachen.findIndex((x) => x.id === alt.id) : -1;
                if (i >= 0) sachen[i] = antwort.sache;
                else sachen.push(antwort.sache);
            }
            status.textContent = '';
            zeigeGespeichert(alt ? 'Geändert' : 'Gespeichert', antwort.sache.name);
            zeigeListe();
            if (alt) {
                zeigeFormular(false);
            } else {
                // Ort bleibt stehen (praktisch beim Einräumen eines Schranks), der Rest leert sich
                felderLeeren();
                name.focus();
            }
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
        el('div', { class: 'besitz-form-knoepfe' }, [speichernKnopf, loeschenKnopf]),
        status
    ]);

    function felderLeeren() {
        name.value = '';
        kategorie.feld.value = '';
        anzahl.value = '1';
        preis.value = '';
        datum.value = '';
        notiz.value = '';
    }

    // Löschen ist weich: Im Sheet steht dann geloescht = TRUE, die Person kann es dort zurückholen.
    async function loeschen() {
        const s = bearbeite;
        if (!s || sendet) return;
        if (!confirm('„' + s.name + '“ löschen?')) return;
        sendet = true;
        speichernKnopf.disabled = true;
        loeschenKnopf.disabled = true;
        status.textContent = 'Lösche …';
        try {
            await api('leben', 'loeschen', { id: s.id, geaendert_am: s.geaendert_am });
            if (sachen) sachen = sachen.filter((x) => x.id !== s.id);
            status.textContent = '';
            zeigeGespeichert('Gelöscht', s.name);
            zeigeListe();
            zeigeFormular(false);
        } catch (e) {
            status.textContent = 'NICHT gelöscht: ' + e.message;
        } finally {
            sendet = false;
            speichernKnopf.disabled = false;
            loeschenKnopf.disabled = false;
        }
    }

    const formTitel = el('h2', { text: 'Hinzufügen' });
    const formBox = el('div', { class: 'karte besitz-form-box', attrs: { id: 'besitz-formular', hidden: true } }, [
        el('div', { class: 'form-kopf' }, [
            formTitel,
            el('button', { class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Formular schließen' }, on: { click: () => zeigeFormular(false) } })
        ]),
        formular
    ]);
    const neuKnopf = el('button', {
        class: 'knopf knopf-bereich', text: '+ Hinzufügen',
        attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'besitz-formular' },
        on: { click: () => (formBox.hidden || bearbeite ? zeigeFormular(true) : zeigeFormular(false)) }
    });

    // auf = Formular zeigen; sache = diese Sache ändern (sonst neu)
    function zeigeFormular(auf, sache = null) {
        const warBearbeiten = bearbeite;
        bearbeite = auf ? sache : null;
        formBox.hidden = !auf;
        neuKnopf.setAttribute('aria-expanded', auf ? 'true' : 'false');
        formTitel.textContent = sache ? 'Ändern' : 'Hinzufügen';
        loeschenKnopf.hidden = !sache;
        if (sache) {
            name.value = sache.name;
            kategorie.feld.value = sache.kategorie;
            ort.feld.value = sache.ort;
            anzahl.value = String(sache.anzahl);
            preis.value = sache.kaufpreis == null ? '' : String(sache.kaufpreis);
            datum.value = sache.kaufdatum || '';
            notiz.value = sache.notiz || '';
        } else if (warBearbeiten) {
            // Vom Ändern zurück: keine Werte der geänderten Sache stehen lassen
            felderLeeren();
            ort.feld.value = '';
        }
        if (auf) {
            status.textContent = '';
            formBox.scrollIntoView({ block: 'start', behavior: 'smooth' });
            name.focus({ preventScroll: true });
        } else {
            neuKnopf.focus();
        }
    }

    // --- Suche und Filter (rechnen nur im Gerät) ---
    const suche = el('input', {
        attrs: { id: 'besitz-suche', type: 'search', autocomplete: 'off', placeholder: 'Name, Kategorie, Ort, Notiz' },
        on: { input: () => zeigeListe() }
    });
    const ortFilter = el('select', { attrs: { id: 'besitz-filter-ort' }, on: { change: () => zeigeListe() } });
    const katFilter = el('select', { attrs: { id: 'besitz-filter-kategorie' }, on: { change: () => zeigeListe() } });
    const suchBox = el('div', { class: 'formular besitz-suche', attrs: { role: 'search' } }, [
        el('label', { text: 'Suchen', attrs: { for: 'besitz-suche' } }), suche,
        el('div', { class: 'besitz-filter' }, [
            el('div', {}, [el('label', { text: 'Ort', attrs: { for: 'besitz-filter-ort' } }), ortFilter]),
            el('div', {}, [el('label', { text: 'Kategorie', attrs: { for: 'besitz-filter-kategorie' } }), katFilter])
        ])
    ]);
    const trefferText = el('p', { class: 'leise besitz-treffer', attrs: { 'aria-live': 'polite' } });

    // Füllt eine Filter-Auswahl neu und behält die Wahl, wenn es sie noch gibt
    function fuelleFilter(auswahl, alleText, werte) {
        const vorher = auswahl.value;
        leeren(auswahl);
        auswahl.append(el('option', { text: alleText, attrs: { value: '' } }));
        werte.forEach((w) => auswahl.append(el('option', { text: w, attrs: { value: w } })));
        auswahl.value = werte.includes(vorher) ? vorher : '';
    }

    // --- Liste ---
    function zeigeListe() {
        leeren(listeBox);
        if (!sachen) return;
        const alleOrte = [...new Set(sachen.map((s) => s.ort).filter(Boolean))].sort(vergleiche);
        const alleKat = [...new Set(sachen.map((s) => s.kategorie).filter(Boolean))].sort(vergleiche);
        kategorie.setzeEintraege(alleKat);
        ort.setzeEintraege(alleOrte);
        fuelleFilter(ortFilter, 'Alle Orte', alleOrte);
        fuelleFilter(katFilter, 'Alle Kategorien', alleKat);
        suchBox.hidden = !sachen.length;
        trefferText.textContent = '';
        if (!sachen.length) {
            listeBox.append(el('p', { class: 'leise', text: 'Noch nichts eingetragen. Tippe auf „+ Hinzufügen“.' }));
            return;
        }
        const wort = klein(suche.value.trim());
        const gefiltert = sachen.filter((s) =>
            (!ortFilter.value || s.ort === ortFilter.value)
            && (!katFilter.value || s.kategorie === katFilter.value)
            && (!wort || [s.name, s.kategorie, s.ort, s.notiz].some((t) => klein(t).includes(wort))));
        if (gefiltert.length < sachen.length) {
            trefferText.textContent = gefiltert.length ? gefiltert.length + ' von ' + sachen.length + ' Sachen' : 'Keine Treffer.';
        }
        // Nach Ort gruppiert, Orte nach Name, Sachen nach der gewählten Spalte
        const orte = new Map();
        [...gefiltert].sort(nachSpalte).forEach((s) => {
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
                el('thead', {}, [el('tr', {}, SPALTEN.map(spaltenKopf))]),
                el('tbody', {}, liste.map(zeile))
            ])
        ]);
    }

    // Spaltenkopf zum Sortieren: erster Tipp aufsteigend, zweiter absteigend
    function spaltenKopf([schluessel, text, rechts]) {
        const an = sortierung.spalte === schluessel;
        return el('th', {
            class: rechts ? 'zahl' : null,
            attrs: { scope: 'col', 'aria-sort': an ? (sortierung.ab ? 'descending' : 'ascending') : null }
        }, [el('button', {
            class: 'besitz-sortieren', text: text + (an ? (sortierung.ab ? ' ▼' : ' ▲') : ''),
            attrs: { type: 'button' },
            on: {
                click: () => {
                    sortierung = { spalte: schluessel, ab: an ? !sortierung.ab : false };
                    zeigeListe();
                }
            }
        })]);
    }

    // Tipp auf eine Zeile (oder den Namen) öffnet die Sache zum Ändern
    function zeile(s) {
        return el('tr', { class: 'besitz-zeile', on: { click: (ev) => { if (!ev.target.closest('button')) zeigeFormular(true, s); } } }, [
            el('th', { class: 'besitz-name', attrs: { scope: 'row' } }, [
                el('button', { class: 'besitz-oeffnen', text: s.name, attrs: { type: 'button', 'aria-label': s.name + ' ändern' }, on: { click: () => zeigeFormular(true, s) } }),
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
        suchBox,
        ladeStatus,
        trefferText,
        listeBox,
        neuLaden
    );
    zeigeListe();
    laden();
}
