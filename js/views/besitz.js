// Reiter Besitz: Liste aller Sachen nach Ort, Hinzufügen, Ändern, Löschen, Suche, Filter und Sortieren.
// Zubehör (3.4): Eine Sache kann zu einer Hauptsache gehören (gehoert_zu). Es steht eingerückt und zugeklappt darunter.
// Bild (3.5): freiwillig je Sache, hochgeladen (die App verkleinert es) oder als Google-Drive-Link. Es liegt im Drive der Person.
// Daten aus dem Skript „leben“ (Sheet „Leben“, Blatt „besitz“). Nur mit Passwort.
// Die Liste liegt nur im Arbeitsspeicher, solange die Seite offen ist, nie im Gerät (docs/PLAN-ETAPPE-3.md).

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

    // Lädt ein gespeichertes Bild vom Skript (nur mit Passwort) und zeigt es, wenn das Formular noch dieselbe Sache zeigt
    async function ladeVorschau(id) {
        if (bilder.has(id)) { zeigeVorschau(bilder.get(id)); return; }
        zeigeVorschau(null, 'Bild lädt …');
        try {
            const adresse = bildAdresse(await api('leben', 'bild', { bild: id }));
            if (!adresse) throw new Error('Unbekannte Bildart.');
            bilder.set(id, adresse);
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
            zeigeListe();
            if (alt) {
                zeigeFormular(false);
            } else {
                // Ort und „Gehört zu“ bleiben stehen (praktisch beim Einräumen oder für mehrere Zubehörteile), der Rest leert sich
                const haupt = gehoert.value;
                felderLeeren();
                fuelleGehoert(null);
                gehoert.value = haupt;
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
        if (auf) fuelleGehoert(sache);
        if (sache) {
            name.value = sache.name;
            kategorie.feld.value = sache.kategorie;
            ort.feld.value = sache.ort;
            anzahl.value = String(sache.anzahl);
            preis.value = sache.kaufpreis == null ? '' : String(sache.kaufpreis);
            datum.value = sache.kaufdatum || '';
            notiz.value = sache.notiz || '';
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
        const filterAn = Boolean(wort || ortFilter.value || katFilter.value);
        const passt = (s) =>
            (!ortFilter.value || s.ort === ortFilter.value)
            && (!katFilter.value || s.kategorie === katFilter.value)
            && (!wort || [s.name, s.kategorie, s.ort, s.notiz].some((t) => klein(t).includes(wort)));
        const treffer = sachen.filter(passt).length;
        if (filterAn) {
            trefferText.textContent = treffer ? treffer + ' von ' + sachen.length + ' Sachen' : 'Keine Treffer.';
        }
        // Hauptsachen mit ihrem Zubehör. Eine Hauptsache steht da, wenn sie selbst oder ihr Zubehör passt.
        // Bei Suche oder Filter wird passendes Zubehör aufgeklappt gezeigt, sonst alles Zubehör zugeklappt.
        const eintraege = sachen.filter((s) => !istZubehoer(s)).map((s) => {
            const alle = zubehoerVon(s.id).sort(nachSpalte);
            const kinder = filterAn ? alle.filter(passt) : alle;
            return { s, kinder, anzahlZubehoer: alle.length, selbst: passt(s), auf: offen.has(s.id) || (filterAn && kinder.length > 0) };
        }).filter((e) => e.selbst || e.kinder.length);
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

    // Tipp auf eine Zeile (oder den Namen) öffnet die Sache zum Ändern.
    // eintrag = Hauptsache mit Zubehör (dann Knopf zum Aufklappen); haupt = Eintrag der Hauptsache, wenn s Zubehör ist.
    function zeile(s, eintrag = null, haupt = null) {
        let klasse = 'besitz-zeile';
        if (haupt) klasse += ' besitz-kind';
        if (eintrag && !eintrag.selbst) klasse += ' besitz-nur-kontext'; // passt nicht selbst, nur ihr Zubehör
        return el('tr', {
            class: klasse,
            attrs: { hidden: haupt && !haupt.auf, 'data-haupt': haupt ? haupt.s.id : null },
            on: { click: (ev) => { if (!ev.target.closest('button')) zeigeFormular(true, s); } }
        }, [
            el('th', { class: 'besitz-name', attrs: { scope: 'row' } }, [
                haupt ? el('span', { class: 'besitz-kind-pfeil', text: '↳ ', attrs: { 'aria-hidden': 'true' } }) : null,
                el('button', { class: 'besitz-oeffnen', text: s.name, attrs: { type: 'button', 'aria-label': s.name + ' ändern' }, on: { click: () => zeigeFormular(true, s) } }),
                s.bild ? el('span', { class: 'besitz-hat-bild', text: ' 📷', attrs: { title: 'hat ein Bild', 'aria-label': 'hat ein Bild' } }) : null,
                s.notiz ? el('span', { class: 'besitz-notiz leise', text: s.notiz }) : null,
                eintrag && eintrag.kinder.length ? aufklapper(eintrag) : null
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
