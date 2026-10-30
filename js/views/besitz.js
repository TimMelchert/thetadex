// Reiter Besitz: Liste aller Sachen nach Ort, Hinzufügen, Ändern, Löschen, Suche, Filter und Sortieren.
// Zubehör (3.4): Eine Sache kann zu einer Hauptsache gehören (gehoert_zu). Es steht eingerückt und zugeklappt darunter.
// Bild (3.5): freiwillig je Sache, hochgeladen (die App verkleinert es) oder als Google-Drive-Link. Es liegt im Drive der Person.
// 3.6: Tipp auf eine Sache zeigt erst ihre Daten mit Bild (Knopf „Bearbeiten“ öffnet das Formular).
// Sachen mit Anzahl 0 sind ausgeblendet (außer mit Zubehör). „Ausgeliehen an“ mit eigenem Filter. Unterreiter „Übersicht“.
// Daten aus dem Skript „leben“ (Sheet „Leben“, Blatt „besitz“). Nur mit Passwort.
// Die Liste liegt nur im Arbeitsspeicher, solange die Seite offen ist, nie im Gerät (docs/STAND.md, Abschnitt 4).

import { el, leeren, heute, kalenderBeiKlick } from '../ui/dom.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { verkleinereBild, bildAdresse } from '../ui/bild.js';

// Zuletzt geladene Liste, nur im Arbeitsspeicher. Beim Öffnen sofort zeigen, dann frisch laden.
let sachen = null;
// Sortierung (PC, Tipp auf den Spaltenkopf). Bleibt, solange die Seite offen ist.
let sortierung = { spalte: 'name', ab: false };
// Aufgeklappte Hauptsachen (ids). Bleibt, solange die Seite offen ist.
const offen = new Set();
// Schon geladene Bilder (Drive-Kennung → data:-Bild), nur im Arbeitsspeicher
const bilder = new Map();
// Liste oder Übersicht. Bleibt, solange die Seite offen ist.
let teil = 'liste';

// Lädt ein gespeichertes Bild vom Skript (nur mit Passwort), einmal je Kennung
async function holeBild(id) {
    if (bilder.has(id)) return bilder.get(id);
    const adresse = bildAdresse(await api('leben', 'bild', { bild: id }));
    if (!adresse) throw new Error('Unbekannte Bildart.');
    bilder.set(id, adresse);
    return adresse;
}

// Spalten der Tabelle: [Schlüssel, Überschrift, rechtsbündig]
const SPALTEN = [['name', 'Name'], ['kategorie', 'Kategorie'], ['anzahl', 'Anzahl', true], ['kaufpreis', 'Kaufpreis', true], ['kaufdatum', 'Kaufdatum']];

const euro = (v) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const datumText = (t) => (/^\d{4}-\d{2}-\d{2}$/.test(t) ? t.slice(8, 10) + '.' + t.slice(5, 7) + '.' + t.slice(0, 4) : '');
const vergleiche = (a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true });
const klein = (t) => String(t == null ? '' : t).toLocaleLowerCase('de');
const verliehen = (s) => String(s.ausgeliehen_an || '').trim();

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
    const ausgeliehen = auswahlFeld({ id: 'besitz-ausgeliehen', maxlength: 60, placeholder: 'Name, leer = nicht ausgeliehen' });
    const notiz = el('textarea', { attrs: { id: 'besitz-notiz', maxlength: 300, rows: 2, placeholder: 'freiwillig' } });
    // Gehört zu: Auswahl der Hauptsachen. Wer selbst Zubehör hat, kann nicht Zubehör werden (nur eine Ebene).
    const gehoert = el('select', { attrs: { id: 'besitz-gehoert' }, on: { change: () => hauptGewaehlt() } });
    const gehoertHinweis = el('p', { class: 'leise besitz-hinweis' });

    // Bild: bildStand.id = gespeichertes Bild, bildStand.daten = neu gewähltes (verkleinert), bildLink = eingefügter Drive-Link
    let bildStand = { id: '', daten: null };
    const vorschau = el('img', { class: 'besitz-vorschau', attrs: { alt: 'Bild der Sache', hidden: true } });
    const bildText = el('p', { class: 'leise besitz-hinweis' });
    const bildEntfernen = el('button', { class: 'knopf knopf-zweit', text: 'Bild entfernen', attrs: { type: 'button', hidden: true }, on: { click: () => setzeBild({ id: '', daten: null }) } });
    const bildDatei = el('input', { attrs: { id: 'besitz-bild', type: 'file', accept: 'image/*' }, on: { change: () => bildGewaehlt() } });
    const bildLink = el('input', {
        attrs: { id: 'besitz-bild-link', type: 'url', inputmode: 'url', autocomplete: 'off', spellcheck: 'false', placeholder: 'https://drive.google.com/…' },
        on: { input: () => { if (bildLink.value.trim()) { bildStand = { id: bildStand.id, daten: null }; zeigeVorschau(null, 'Das Bild aus dem Link erscheint nach dem Speichern.'); } } }
    });

    function zeigeVorschau(adresse, text = '') {
        vorschau.hidden = !adresse;
        if (adresse) vorschau.src = adresse; else vorschau.removeAttribute('src');
        bildText.textContent = text;
        bildEntfernen.hidden = !(adresse || bildStand.id || bildLink.value.trim());
    }

    function setzeBild(stand) {
        bildStand = stand;
        bildDatei.value = '';
        bildLink.value = '';
        if (stand.daten) zeigeVorschau(stand.daten);
        else if (stand.id) ladeVorschau(stand.id);
        else zeigeVorschau(null);
    }

    async function bildGewaehlt() {
        const datei = bildDatei.files && bildDatei.files[0];
        if (!datei) return;
        zeigeVorschau(null, 'Bild wird verkleinert …');
        try {
            const daten = await verkleinereBild(datei);
            bildLink.value = '';
            bildStand = { id: bildStand.id, daten };
            zeigeVorschau(daten);
        } catch (e) {
            bildDatei.value = '';
            zeigeVorschau(null, e.message);
        }
    }

    // Zeigt ein gespeichertes Bild, wenn das Formular noch dieselbe Sache zeigt
    async function ladeVorschau(id) {
        if (bilder.has(id)) { zeigeVorschau(bilder.get(id)); return; }
        zeigeVorschau(null, 'Bild lädt …');
        try {
            const adresse = await holeBild(id);
            if (bildStand.id === id && !bildStand.daten && !bildLink.value.trim()) zeigeVorschau(adresse);
        } catch (e) {
            if (bildStand.id === id) zeigeVorschau(null, 'Bild nicht geladen: ' + e.message);
        }
    }
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
            notiz: notiz.value.trim(),
            ausgeliehen_an: ausgeliehen.feld.value.trim(),
            gehoert_zu: gehoert.value
        };
        // Bild: neu gewählt geht als Text mit, sonst Link oder das bisherige Bild (leer = kein Bild)
        if (bildStand.daten) werte.bild_daten = bildStand.daten.replace(/^data:image\/jpeg;base64,/, '');
        else werte.bild = bildLink.value.trim() || bildStand.id;
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
            // Neues Zubehör gleich sichtbar machen: Hauptsache aufklappen
            if (antwort.sache.gehoert_zu) offen.add(antwort.sache.gehoert_zu);
            // Neu hochgeladenes Bild gleich merken, dann muss es nicht neu geladen werden
            if (bildStand.daten && antwort.sache.bild) bilder.set(antwort.sache.bild, bildStand.daten);
            zeigeAlles();
            // Formular schließt sich (Wunsch der Person). Der Ort bleibt für die nächste neue Sache stehen.
            zeigeFormular(false);
            if (!alt) felderLeeren();
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
        el('label', { text: 'Ausgeliehen an', attrs: { for: 'besitz-ausgeliehen' } }), ausgeliehen.box,
        el('label', { text: 'Notiz', attrs: { for: 'besitz-notiz' } }), notiz,
        el('label', { text: 'Gehört zu (Zubehör von)', attrs: { for: 'besitz-gehoert' } }), gehoert, gehoertHinweis,
        el('label', { text: 'Bild (freiwillig): wählen oder aufnehmen', attrs: { for: 'besitz-bild' } }), bildDatei,
        el('label', { text: 'oder Google-Drive-Link', attrs: { for: 'besitz-bild-link' } }), bildLink,
        vorschau, bildText, bildEntfernen,
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
        ausgeliehen.feld.value = '';
        setzeBild({ id: '', daten: null });
    }

    // Hauptsachen = Sachen, die nicht selbst Zubehör einer vorhandenen Sache sind
    const istZubehoer = (s) => Boolean(s.gehoert_zu) && sachen.some((x) => x.id === s.gehoert_zu);
    const zubehoerVon = (id) => (sachen || []).filter((x) => x.gehoert_zu === id);

    // Füllt „Gehört zu“ für die Sache, die gerade im Formular steht (null = neu)
    function fuelleGehoert(sache) {
        leeren(gehoert);
        gehoert.append(el('option', { text: '– keine, eigene Sache –', attrs: { value: '' } }));
        const hatEigenes = sache ? zubehoerVon(sache.id).length > 0 : false;
        (sachen || [])
            .filter((x) => !istZubehoer(x) && (!sache || x.id !== sache.id))
            .sort((a, b) => vergleiche(a.name, b.name))
            .forEach((x) => gehoert.append(el('option', { text: x.name + ' (' + x.ort + ')', attrs: { value: x.id } })));
        gehoert.value = sache && istZubehoer(sache) ? sache.gehoert_zu : '';
        gehoert.disabled = hatEigenes;
        gehoertHinweis.textContent = hatEigenes ? 'Diese Sache hat selbst Zubehör und bleibt darum eine eigene Sache.' : '';
    }

    // Hauptsache gewählt: Ort übernehmen, wenn noch keiner eingetragen ist
    function hauptGewaehlt() {
        const h = (sachen || []).find((x) => x.id === gehoert.value);
        if (h && !ort.feld.value.trim()) ort.feld.value = h.ort;
    }

    // Löschen ist weich: Im Sheet steht dann geloescht = TRUE, die Person kann es dort zurückholen.
    async function loeschen() {
        const s = bearbeite;
        if (!s || sendet) return;
        const zahl = zubehoerVon(s.id).length;
        const frage = '„' + s.name + '“ löschen?' + (zahl ? ' Das Zubehör (' + zahl + ') bleibt als eigene Sache erhalten.' : '');
        if (!confirm(frage)) return;
        sendet = true;
        speichernKnopf.disabled = true;
        loeschenKnopf.disabled = true;
        status.textContent = 'Lösche …';
        try {
            await api('leben', 'loeschen', { id: s.id, geaendert_am: s.geaendert_am });
            if (sachen) sachen = sachen.filter((x) => x.id !== s.id);
            status.textContent = '';
            zeigeGespeichert('Gelöscht', s.name);
            zeigeAlles();
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
        if (auf) fuelleGehoert(sache);
        if (sache) {
            name.value = sache.name;
            kategorie.feld.value = sache.kategorie;
            ort.feld.value = sache.ort;
            anzahl.value = String(sache.anzahl);
            preis.value = sache.kaufpreis == null ? '' : String(sache.kaufpreis);
            datum.value = sache.kaufdatum || '';
            notiz.value = sache.notiz || '';
            ausgeliehen.feld.value = verliehen(sache);
            setzeBild({ id: sache.bild || '', daten: null });
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

    // --- Ansicht einer Sache: erst nur lesen, „Bearbeiten“ öffnet das Formular ---
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'besitz-dialog-titel' } });
    // Tipp neben das Fenster (auf den abgedunkelten Rand) schließt es
    dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });

    function zeigeSache(s) {
        leeren(dialog);
        const haupt = s.gehoert_zu ? (sachen || []).find((x) => x.id === s.gehoert_zu) : null;
        const zubehoer = zubehoerVon(s.id).sort((a, b) => vergleiche(a.name, b.name));
        const angaben = [
            ['Kategorie', s.kategorie],
            ['Ort', s.ort],
            ['Anzahl', String(s.anzahl)],
            ['Kaufpreis', s.kaufpreis == null ? '' : euro(s.kaufpreis)],
            ['Kaufdatum', datumText(s.kaufdatum)],
            ['Ausgeliehen an', verliehen(s)],
            ['Gehört zu', haupt ? haupt.name : ''],
            ['Zubehör', zubehoer.map((z) => z.name + (z.anzahl > 1 ? ' (' + z.anzahl + ')' : '')).join(', ')],
            ['Notiz', s.notiz]
        ].filter(([, w]) => w);
        const bild = el('img', { class: 'besitz-dialog-bild', attrs: { alt: 'Bild: ' + s.name, hidden: true } });
        const bildText = el('p', { class: 'leise besitz-hinweis' });
        if (s.bild) {
            bildText.textContent = 'Bild lädt …';
            holeBild(s.bild)
                .then((adresse) => { bild.src = adresse; bild.hidden = false; bildText.textContent = ''; })
                .catch((e) => { bildText.textContent = 'Bild nicht geladen: ' + e.message; });
        }
        dialog.append(el('div', { class: 'besitz-dialog-inhalt' }, [
            el('div', { class: 'form-kopf' }, [
                el('h2', { text: s.name, attrs: { id: 'besitz-dialog-titel' } }),
                el('button', { class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Schließen' }, on: { click: () => dialog.close() } })
            ]),
            s.bild ? bild : null,
            s.bild ? bildText : null,
            el('dl', { class: 'besitz-angaben' }, angaben.flatMap(([n, w]) => [el('dt', { text: n }), el('dd', { text: w })])),
            el('div', { class: 'besitz-form-knoepfe' }, [
                el('button', { class: 'knopf knopf-bereich', text: 'Bearbeiten', attrs: { type: 'button' }, on: { click: () => { dialog.close(); zeigeFormular(true, s); } } }),
                el('button', { class: 'knopf knopf-zweit', text: 'Schließen', attrs: { type: 'button' }, on: { click: () => dialog.close() } })
            ])
        ]));
        dialog.showModal();
    }

    // --- Suche und Filter (rechnen nur im Gerät) ---
    const suche = el('input', {
        attrs: { id: 'besitz-suche', type: 'search', autocomplete: 'off', placeholder: 'Name, Kategorie, Ort, Notiz, ausgeliehen an' },
        on: { input: () => zeigeListe() }
    });
    const ortFilter = el('select', { attrs: { id: 'besitz-filter-ort' }, on: { change: () => zeigeListe() } });
    const katFilter = el('select', { attrs: { id: 'besitz-filter-kategorie' }, on: { change: () => zeigeListe() } });
    const leihFilter = el('select', { attrs: { id: 'besitz-filter-leihe' }, on: { change: () => zeigeListe() } });
    const nullZeigen = el('input', { attrs: { id: 'besitz-null', type: 'checkbox' }, on: { change: () => zeigeListe() } });
    const nullText = el('span');
    const nullBox = el('label', { class: 'besitz-null', attrs: { for: 'besitz-null' } }, [nullZeigen, nullText]);
    const suchBox = el('div', { class: 'formular besitz-suche', attrs: { role: 'search' } }, [
        el('label', { text: 'Suchen', attrs: { for: 'besitz-suche' } }), suche,
        el('div', { class: 'besitz-filter' }, [
            el('div', {}, [el('label', { text: 'Ort', attrs: { for: 'besitz-filter-ort' } }), ortFilter]),
            el('div', {}, [el('label', { text: 'Kategorie', attrs: { for: 'besitz-filter-kategorie' } }), katFilter]),
            el('div', {}, [el('label', { text: 'Ausgeliehen', attrs: { for: 'besitz-filter-leihe' } }), leihFilter])
        ]),
        nullBox
    ]);
    const trefferText = el('p', { class: 'leise besitz-treffer', attrs: { 'aria-live': 'polite' } });

    // Füllt eine Filter-Auswahl neu und behält die Wahl, wenn es sie noch gibt. werte: Text oder [Wert, Text]
    function fuelleFilter(auswahl, alleText, werte) {
        const vorher = auswahl.value;
        const paare = werte.map((w) => (Array.isArray(w) ? w : [w, w]));
        leeren(auswahl);
        auswahl.append(el('option', { text: alleText, attrs: { value: '' } }));
        paare.forEach(([w, t]) => auswahl.append(el('option', { text: t, attrs: { value: w } })));
        auswahl.value = paare.some(([w]) => w === vorher) ? vorher : '';
    }

    // Anzahl 0 heißt „nicht mehr da“: ausgeblendet, außer die Sache hat Zubehör oder der Haken ist gesetzt
    const vorhanden = (s) => s.anzahl > 0 || zubehoerVon(s.id).length > 0;
    const sichtbar = (s) => nullZeigen.checked || vorhanden(s);

    // --- Liste ---
    function zeigeListe() {
        leeren(listeBox);
        if (!sachen) return;
        const alleOrte = [...new Set(sachen.map((s) => s.ort).filter(Boolean))].sort(vergleiche);
        const alleKat = [...new Set(sachen.map((s) => s.kategorie).filter(Boolean))].sort(vergleiche);
        const alleLeiher = [...new Set(sachen.map(verliehen).filter(Boolean))].sort(vergleiche);
        kategorie.setzeEintraege(alleKat);
        ort.setzeEintraege(alleOrte);
        ausgeliehen.setzeEintraege(alleLeiher);
        fuelleFilter(ortFilter, 'Alle Orte', alleOrte);
        fuelleFilter(katFilter, 'Alle Kategorien', alleKat);
        fuelleFilter(leihFilter, 'Alle', [['ja', 'Nur ausgeliehene'], ['nein', 'Nicht ausgeliehen'], ...alleLeiher.map((n) => ['an:' + n, 'an ' + n])]);
        const ohne = sachen.filter((s) => !vorhanden(s)).length;
        nullText.textContent = 'Auch Sachen mit Anzahl 0 zeigen (' + ohne + ')';
        suchBox.hidden = !sachen.length;
        trefferText.textContent = '';
        if (!sachen.length) {
            listeBox.append(el('p', { class: 'leise', text: 'Noch nichts eingetragen. Tippe auf „+ Hinzufügen“.' }));
            return;
        }
        const wort = klein(suche.value.trim());
        const leihe = leihFilter.value;
        const filterAn = Boolean(wort || ortFilter.value || katFilter.value || leihe);
        const passtLeihe = (s) => !leihe || (leihe === 'ja' ? Boolean(verliehen(s)) : leihe === 'nein' ? !verliehen(s) : verliehen(s) === leihe.slice(3));
        const passt = (s) =>
            sichtbar(s)
            && (!ortFilter.value || s.ort === ortFilter.value)
            && (!katFilter.value || s.kategorie === katFilter.value)
            && passtLeihe(s)
            && (!wort || [s.name, s.kategorie, s.ort, s.notiz, verliehen(s)].some((t) => klein(t).includes(wort)));
        const treffer = sachen.filter(passt).length;
        if (filterAn) {
            trefferText.textContent = treffer ? treffer + ' von ' + sachen.filter(sichtbar).length + ' Sachen' : 'Keine Treffer.';
        }
        // Hauptsachen mit ihrem Zubehör. Eine Hauptsache steht da, wenn sie selbst oder ihr Zubehör passt.
        // Bei Suche oder Filter wird passendes Zubehör aufgeklappt gezeigt, sonst alles Zubehör zugeklappt.
        const eintraege = sachen.filter((s) => !istZubehoer(s)).map((s) => {
            const alle = zubehoerVon(s.id).filter(sichtbar).sort(nachSpalte);
            const kinder = filterAn ? alle.filter(passt) : alle;
            return { s, kinder, anzahlZubehoer: alle.length, selbst: passt(s), auf: offen.has(s.id) || (filterAn && kinder.length > 0) };
        }).filter((e) => e.selbst || e.kinder.length);
        if (!eintraege.length && !filterAn) {
            listeBox.append(el('p', { class: 'leise', text: 'Alle Sachen haben Anzahl 0. Setze den Haken oben, um sie zu sehen.' }));
            return;
        }
        // Nach Ort gruppiert, Orte nach Name, Sachen nach der gewählten Spalte
        const orte = new Map();
        eintraege.sort((a, b) => nachSpalte(a.s, b.s)).forEach((e) => {
            if (!orte.has(e.s.ort)) orte.set(e.s.ort, []);
            orte.get(e.s.ort).push(e);
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
                el('tbody', {}, liste.flatMap((e) => [zeile(e.s, e), ...e.kinder.map((k) => zeile(k, null, e))]))
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

    // Tipp auf eine Zeile (oder den Namen) zeigt die Sache an.
    // eintrag = Hauptsache mit Zubehör (dann Knopf zum Aufklappen); haupt = Eintrag der Hauptsache, wenn s Zubehör ist.
    function zeile(s, eintrag = null, haupt = null) {
        let klasse = 'besitz-zeile';
        if (haupt) klasse += ' besitz-kind';
        if (eintrag && !eintrag.selbst) klasse += ' besitz-nur-kontext'; // passt nicht selbst, nur ihr Zubehör
        if (s.anzahl === 0) klasse += ' besitz-null-zeile';
        // Eine Zeile unter dem Namen: Zubehör-Knopf, dann Bild-Zeichen, dann „ausgeliehen“
        const merkmale = [
            eintrag && eintrag.kinder.length ? aufklapper(eintrag) : null,
            s.bild ? el('span', { class: 'besitz-hat-bild', text: '📷', attrs: { title: 'hat ein Bild', role: 'img', 'aria-label': 'hat ein Bild' } }) : null,
            verliehen(s) ? el('span', { class: 'besitz-verliehen', text: '🤝 an ' + verliehen(s) }) : null
        ].filter(Boolean);
        return el('tr', {
            class: klasse,
            attrs: { hidden: haupt && !haupt.auf, 'data-haupt': haupt ? haupt.s.id : null },
            on: { click: (ev) => { if (!ev.target.closest('button')) zeigeSache(s); } }
        }, [
            el('th', { class: 'besitz-name', attrs: { scope: 'row' } }, [
                haupt ? el('span', { class: 'besitz-kind-pfeil', text: '↳ ', attrs: { 'aria-hidden': 'true' } }) : null,
                el('button', { class: 'besitz-oeffnen', text: s.name, attrs: { type: 'button', 'aria-label': s.name + ' ansehen' }, on: { click: () => zeigeSache(s) } }),
                s.notiz ? el('span', { class: 'besitz-notiz leise', text: s.notiz }) : null,
                merkmale.length ? el('div', { class: 'besitz-merkmale' }, merkmale) : null
            ]),
            el('td', { text: s.kategorie, attrs: { 'data-label': 'Kategorie' } }),
            el('td', { class: 'zahl', text: String(s.anzahl), attrs: { 'data-label': 'Anzahl' } }),
            el('td', { class: 'zahl', text: s.kaufpreis == null ? '' : euro(s.kaufpreis), attrs: { 'data-label': 'Kaufpreis' } }),
            el('td', { text: datumText(s.kaufdatum), attrs: { 'data-label': 'Kaufdatum' } })
        ]);
    }

    // Knopf „▸ 2 Zubehör“: klappt die Zeilen des Zubehörs auf und zu
    function aufklapper(e) {
        const zahl = e.kinder.length < e.anzahlZubehoer ? e.kinder.length + ' von ' + e.anzahlZubehoer : String(e.kinder.length);
        const knopf = el('button', {
            class: 'besitz-aufklappen',
            attrs: { type: 'button', 'aria-expanded': e.auf ? 'true' : 'false' },
            on: {
                click: () => {
                    e.auf = !e.auf;
                    if (e.auf) offen.add(e.s.id); else offen.delete(e.s.id);
                    knopf.setAttribute('aria-expanded', e.auf ? 'true' : 'false');
                    knopf.textContent = (e.auf ? '▾ ' : '▸ ') + zahl + ' Zubehör';
                    listeBox.querySelectorAll('tr[data-haupt="' + CSS.escape(e.s.id) + '"]').forEach((t) => { t.hidden = !e.auf; });
                }
            }
        });
        knopf.textContent = (e.auf ? '▾ ' : '▸ ') + zahl + ' Zubehör';
        return knopf;
    }

    // --- Übersicht: wie viele Sachen insgesamt, je Kategorie, je Ort, ausgeliehen ---
    // Gezählt werden alle Sachen mit Anzahl über 0, Zubehör eingeschlossen. Stück = alle Anzahlen zusammen.
    const uebersichtBox = el('div', { class: 'besitz-uebersicht', attrs: { id: 'besitz-uebersicht', hidden: true } });

    function zeigeUebersicht() {
        leeren(uebersichtBox);
        if (!sachen) return;
        const da = sachen.filter((s) => s.anzahl > 0);
        const stueck = da.reduce((n, s) => n + s.anzahl, 0);
        const leihen = da.filter((s) => verliehen(s));
        const zahlKachel = (wert, text) => el('div', { class: 'besitz-zahl-kachel' }, [
            el('span', { class: 'besitz-zahl-wert', text: String(wert) }),
            el('span', { class: 'leise', text })
        ]);
        uebersichtBox.append(el('div', { class: 'besitz-zahlen' }, [
            zahlKachel(da.length, da.length === 1 ? 'Sache' : 'Sachen'),
            zahlKachel(stueck, 'Stück'),
            zahlKachel(leihen.length, 'ausgeliehen')
        ]));
        if (!da.length) {
            uebersichtBox.append(el('p', { class: 'leise', text: 'Noch nichts eingetragen.' }));
            return;
        }
        uebersichtBox.append(
            zaehlung('Je Kategorie', da, (s) => s.kategorie, (w) => { katFilter.value = w; }),
            zaehlung('Je Ort', da, (s) => s.ort, (w) => { ortFilter.value = w; })
        );
        if (leihen.length) uebersichtBox.append(zaehlung('Ausgeliehen an', leihen, verliehen, (w) => { leihFilter.value = 'an:' + w; }));
        uebersichtBox.append(el('p', { class: 'leise besitz-hinweis', text: 'Gezählt sind alle Sachen mit Anzahl über 0, Zubehör eingeschlossen. Der Balken zeigt, wie viele Sachen es im Vergleich zur größten Gruppe sind. Tipp auf eine Zeile zeigt diese Sachen in der Liste.' }));
    }

    // Eine Tabelle: Gruppe, Sachen, Stück und ein Balken. Tipp auf eine Zeile öffnet die Liste mit diesem Filter.
    function zaehlung(titel, liste, schluessel, filtern) {
        const gruppen = new Map();
        liste.forEach((s) => {
            const k = schluessel(s);
            const g = gruppen.get(k) || { sachen: 0, stueck: 0 };
            g.sachen += 1;
            g.stueck += s.anzahl;
            gruppen.set(k, g);
        });
        const reihe = [...gruppen.entries()].sort((a, b) => b[1].sachen - a[1].sachen || vergleiche(a[0], b[0]));
        const meiste = reihe.length ? reihe[0][1].sachen : 1;
        const zeigeGefiltert = (w) => {
            suche.value = '';
            ortFilter.value = '';
            katFilter.value = '';
            leihFilter.value = '';
            filtern(w);
            zeigeTeil('liste');
        };
        return el('section', { class: 'besitz-gruppe' }, [
            el('h2', { class: 'besitz-ort', text: titel }),
            el('table', { class: 'besitz-zaehlung' }, [
                el('thead', {}, [el('tr', {}, [
                    el('th', { text: titel.replace(/^Je /, ''), attrs: { scope: 'col' } }),
                    el('th', { class: 'zahl', text: 'Sachen', attrs: { scope: 'col' } }),
                    el('th', { class: 'zahl', text: 'Stück', attrs: { scope: 'col' } }),
                    el('th', { class: 'besitz-balken-spalte', attrs: { scope: 'col', 'aria-hidden': 'true' } })
                ])]),
                el('tbody', {}, reihe.map(([name, g]) => {
                    const balken = el('span', { class: 'besitz-balken' });
                    balken.style.width = Math.max(4, Math.round((g.sachen / meiste) * 100)) + '%';
                    return el('tr', { class: 'besitz-zeile', on: { click: (ev) => { if (!ev.target.closest('button')) zeigeGefiltert(name); } } }, [
                        el('th', { attrs: { scope: 'row' } }, [
                            el('button', { class: 'besitz-oeffnen', text: name, attrs: { type: 'button', 'aria-label': name + ': in der Liste zeigen' }, on: { click: () => zeigeGefiltert(name) } })
                        ]),
                        el('td', { class: 'zahl', text: String(g.sachen) }),
                        el('td', { class: 'zahl', text: String(g.stueck) }),
                        el('td', { class: 'besitz-balken-spalte', attrs: { 'aria-hidden': 'true' } }, [balken])
                    ]);
                }))
            ])
        ]);
    }

    // --- Unterreiter Liste / Übersicht ---
    const listeTeil = el('div', { attrs: { id: 'besitz-teil-liste' } }, [suchBox, trefferText, listeBox]);
    const teilKnoepfe = [['liste', 'Liste', listeTeil], ['uebersicht', 'Übersicht', uebersichtBox]].map(([id, text, box]) => [
        id,
        el('button', { class: 'ansicht', text, attrs: { type: 'button', 'aria-controls': box.id }, on: { click: () => zeigeTeil(id) } }),
        box
    ]);

    function zeigeTeil(id) {
        teil = id;
        teilKnoepfe.forEach(([k, knopf, box]) => {
            knopf.setAttribute('aria-pressed', k === id ? 'true' : 'false');
            box.hidden = k !== id;
        });
        zeigeAlles();
    }

    function zeigeAlles() {
        zeigeListe();
        zeigeUebersicht();
    }

    // --- Laden ---
    const ladeStatus = el('p', { class: 'meldung besitz-lade', attrs: { role: 'status', 'aria-live': 'polite' } });
    const neuLaden = el('button', { class: 'knopf knopf-zweit besitz-neu', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => laden() } });

    async function laden() {
        neuLaden.disabled = true;
        ladeStatus.textContent = sachen ? 'Aktualisiere …' : 'Lädt …';
        try {
            const d = await api('leben', 'liste');
            sachen = Array.isArray(d.sachen) ? d.sachen : [];
            ladeStatus.textContent = '';
            zeigeAlles();
        } catch (e) {
            ladeStatus.textContent = 'Laden fehlgeschlagen: ' + e.message;
        } finally {
            neuLaden.disabled = false;
        }
    }

    container.append(
        el('div', { class: 'besitz-kopf' }, [
            el('h1', { class: 'bereich-titel titel-mit-emoji' }, [
                el('span', { class: 'titel-emoji', text: '📦', attrs: { 'aria-hidden': 'true' } }),
                el('span', { text: ctx.bereich.titel })
            ]),
            neuKnopf
        ]),
        el('div', { class: 'ansichten' }, teilKnoepfe.map(([, knopf]) => knopf)),
        formBox,
        ladeStatus,
        listeTeil,
        uebersichtBox,
        neuLaden,
        dialog
    );
    zeigeTeil(teil);
    laden();
}
