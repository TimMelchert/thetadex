// Reiter Besitz: Liste aller Sachen nach Ort, Hinzufügen, Ändern, Löschen, Suche, Filter und Sortieren.
// Zubehör (3.4): Eine Sache kann zu einer Hauptsache gehören (gehoert_zu). Es steht eingerückt und zugeklappt darunter.
// Bild (3.5): freiwillig je Sache, hochgeladen (die App verkleinert es) oder als Google-Drive-Link. Es liegt im Drive der Person.
// 3.6: Tipp auf eine Sache zeigt erst ihre Daten mit Bild (Knopf „Bearbeiten“ öffnet das Formular).
// Sachen mit Anzahl 0 sind ausgeblendet (außer mit Zubehör). „Ausgeliehen an“ mit eigenem Filter. Unterreiter „Übersicht“.
// Daten aus dem Skript „leben“ (Sheet „Leben“, Blatt „besitz“). Nur mit Passwort.
// Die Liste liegt nur im Arbeitsspeicher, solange die Seite offen ist, nie im Gerät (docs/STAND.md, Abschnitt 4).

import { el, leeren, heute, kalenderBeiKlick, euro, vergleiche, datumText } from '../ui/dom.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { bildSpeicher, bildFeld } from '../ui/bild.js';

// Zuletzt geladene Liste, nur im Arbeitsspeicher. Beim Öffnen sofort zeigen, dann frisch laden.
let sachen = null;
// Sortierung (PC, Tipp auf den Spaltenkopf). Bleibt, solange die Seite offen ist.
let sortierung = { spalte: 'name', ab: false };
// Aufgeklappte Hauptsachen (ids). Bleibt, solange die Seite offen ist.
const offen = new Set();
// Schon geladene Bilder (Drive-Kennung → data:-Bild), nur im Arbeitsspeicher
const bilder = bildSpeicher('leben');
const holeBild = bilder.hole;
// Liste oder Übersicht. Bleibt, solange die Seite offen ist.
let teil = 'liste';

// Spalten der Tabelle: [Schlüssel, Überschrift, rechtsbündig]
// Kategorie steht nur im Fenster mit allen Angaben (Wunsch der Person, 15.11.2026)
const SPALTEN = [['name', 'Name'], ['anzahl', 'Anzahl', true], ['kaufpreis', 'Kaufpreis', true], ['kaufdatum', 'Kaufdatum']];

const klein = (t) => String(t == null ? '' : t).toLocaleLowerCase('de');
// Kategorien, die als Bild-Kacheln nebeneinander stehen (Wunsch der Person, 16.11.2026): Filme, Bücher (und Hefte), Spiele
const GALERIE = [[/^film/, '🎬'], [/^(buch|bücher|heft)/, '📚'], [/^spiel/, '🎲']];
const galerieArt = (s) => GALERIE.find(([muster]) => muster.test(klein(s.kategorie).trim()));
const istGalerie = (s) => Boolean(galerieArt(s));
const galerieZeichen = (s) => (galerieArt(s) || [null, '📦'])[1];
const verliehen = (s) => String(s.ausgeliehen_an || '').trim();
// Unterorte: bis zu drei Ebenen im Text von „ort“, getrennt mit „ / “ (zum Beispiel „Zimmer / Kallax / Stoffkiste“)
const ORT_TRENNER = ' / ';
const ortTeile = (o) => String(o || '').split('/').map((t) => t.trim()).filter(Boolean);
const ortText = (teile) => teile.filter(Boolean).join(ORT_TRENNER);
// Ort in Normalform: leere Ebenen weg („Zimmer /  / “ → „Zimmer“). Bis 1.3.27 speicherte das Formular leere Ebenen mit,
// solche Items fielen aus der Liste. Darum jede Sache vom Skript einmal so ordnen.
const ordne = (s) => { if (s) s.ort = ortText(ortTeile(s.ort)); return s; };
// Gehört die Sache zu diesem Ort oder einem seiner Unterorte?
const imOrt = (o, filter) => o === filter || String(o).startsWith(filter + ORT_TRENNER);
// Alle Orte mit ihren Oberorten, in Baum-Reihenfolge: „Zimmer“, „Zimmer / Kallax“, „Zimmer / Kallax / Stoffkiste“
function ortBaum(orte) {
    const alle = new Set();
    orte.forEach((o) => { const t = ortTeile(o); t.forEach((_, i) => alle.add(ortText(t.slice(0, i + 1)))); });
    return [...alle].sort((a, b) => {
        const x = ortTeile(a), y = ortTeile(b);
        for (let i = 0; i < Math.min(x.length, y.length); i++) {
            const e = vergleiche(x[i], y[i]);
            if (e) return e;
        }
        return x.length - y.length;
    });
}
// Ausmisten: leer = nein. Werte wie im Skript (AUSMISTEN_).
const AUSMISTEN = [['offen', 'ja, noch offen'], ['verkaufen', 'verkaufen'], ['verschenken', 'verschenken'], ['entsorgen', 'entsorgen']];
const ausmistText = (w) => (AUSMISTEN.find(([k]) => k === w) || [, ''])[1];
// Wie viele Stück ausgeliehen sind: die eingetragene Zahl, sonst alle (0 = nicht ausgeliehen)
const leihStueck = (s) => (verliehen(s) ? (s.ausgeliehen_anzahl || s.anzahl) : 0);
// „2 an Name“, wenn nur ein Teil ausgeliehen ist, sonst „an Name“
const leihText = (s) => (s.ausgeliehen_anzahl && s.ausgeliehen_anzahl < s.anzahl ? s.ausgeliehen_anzahl + ' ' : '') + 'an ' + verliehen(s);

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
    // Ort in drei Ebenen: Raum, darin (zum Beispiel ein Regal), darin (zum Beispiel eine Kiste). Gespeichert als ein Text.
    const ortFelder = [
        auswahlFeld({ id: 'besitz-ort', maxlength: 40, placeholder: 'zum Beispiel Zimmer', beiWahl: () => ortListen() }),
        auswahlFeld({ id: 'besitz-ort-2', maxlength: 40, placeholder: 'freiwillig, zum Beispiel Regal', beiWahl: () => ortListen() }),
        auswahlFeld({ id: 'besitz-ort-3', maxlength: 40, placeholder: 'freiwillig, zum Beispiel Kiste' })
    ];
    let bekannteOrte = [];
    const ort = {
        feld: ortFelder[0].feld,
        wert: () => ortText(ortFelder.map((f) => f.feld.value.replace(/\//g, '-').trim())),
        setze: (o) => { const t = ortTeile(o); ortFelder.forEach((f, i) => { f.feld.value = i < 2 ? (t[i] || '') : t.slice(2).join(' - '); }); ortListen(); }
    };
    // Auswahl je Ebene: nur Unterorte des gewählten Oberorts
    function ortListen() {
        const t = ortFelder.map((f) => f.feld.value.trim());
        ortFelder.forEach((f, i) => {
            const vorne = t.slice(0, i);
            f.setzeEintraege([...new Set(bekannteOrte.map(ortTeile)
                .filter((x) => x.length > i && vorne.every((v, j) => vergleiche(x[j], v) === 0))
                .map((x) => x[i]))]);
        });
    }
    ortFelder.slice(0, 2).forEach((f) => f.feld.addEventListener('change', ortListen));
    const ausmisten = el('select', { attrs: { id: 'besitz-ausmisten' } }, [
        el('option', { text: 'nein', attrs: { value: '' } }),
        ...AUSMISTEN.map(([w, t]) => el('option', { text: t, attrs: { value: w } }))
    ]);
    const anzahl = el('input', { attrs: { id: 'besitz-anzahl', type: 'number', inputmode: 'numeric', min: '0', max: '9999', step: '1', value: '1' } });
    const preis = el('input', { attrs: { id: 'besitz-preis', type: 'number', inputmode: 'decimal', min: '0', step: '0.01', placeholder: 'freiwillig' } });
    const datum = kalenderBeiKlick(el('input', { attrs: { id: 'besitz-datum', type: 'date', max: heute(), autocomplete: 'off' } }));
    const ausgeliehen = auswahlFeld({ id: 'besitz-ausgeliehen', maxlength: 60, placeholder: 'Name, leer = nicht ausgeliehen' });
    const leihAnzahl = el('input', { attrs: { id: 'besitz-leih-anzahl', type: 'number', inputmode: 'numeric', min: '1', max: '9999', step: '1', placeholder: 'leer = alle' } });
    const notiz = el('textarea', { attrs: { id: 'besitz-notiz', maxlength: 300, rows: 2, placeholder: 'freiwillig' } });
    // Gehört zu: Auswahl der Hauptsachen. Wer selbst Zubehör hat, kann nicht Zubehör werden (nur eine Ebene).
    // Gehört zu (Wunsch der Person, 20.11.2026): Feld mit Vorschlägen wie bei Kategorie und Ort.
    // Vorschlag = „Name · Ort“, damit gleiche Namen an verschiedenen Orten unterscheidbar bleiben. Leer = eigenes Item.
    const gehoertFeld = auswahlFeld({ id: 'besitz-gehoert', maxlength: 200, placeholder: 'leer = eigenes Item, sonst tippen oder wählen', beiWahl: () => hauptGewaehlt() });
    let gehoertZuId = new Map(); // Vorschlag → id der Hauptsache
    const gehoertText = (x) => x.name + ' · ' + (ortTeile(x.ort).join(' › ') || 'ohne Ort');
    const gehoert = {
        id: () => gehoertZuId.get(gehoertFeld.feld.value.trim()) || '',
        leer: () => !gehoertFeld.feld.value.trim()
    };
    gehoertFeld.feld.addEventListener('change', () => hauptGewaehlt());
    const gehoertHinweis = el('p', { class: 'leise besitz-hinweis' });

    // Bild: hochladen oder Drive-Link (js/ui/bild.js)
    const bild = bildFeld({ id: 'besitz-bild', alt: 'Bild des Items', bilder });
    const speichernKnopf = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
    const loeschenKnopf = el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button', hidden: true }, on: { click: () => loeschen() } });

    let sendet = false; // gegen doppelte Einträge durch mehrfaches Tippen
    async function speichern(ev) {
        ev.preventDefault();
        if (sendet) return;
        const werte = {
            name: name.value.trim(),
            kategorie: kategorie.feld.value.trim(),
            ort: ort.wert(),
            ausmisten: ausmisten.value,
            anzahl: anzahl.value.trim(),
            kaufpreis: preis.value.trim(),
            kaufdatum: datum.value,
            notiz: notiz.value.trim(),
            ausgeliehen_an: ausgeliehen.feld.value.trim(),
            ausgeliehen_anzahl: '',
            gehoert_zu: gehoert.id()
        };
        // Bild: neu gewählt geht als Text mit, sonst Link oder das bisherige Bild (leer = kein Bild)
        Object.assign(werte, bild.werte());
        const fehlt = [[werte.name, name, 'einen Namen'], [werte.kategorie, kategorie.feld, 'eine Kategorie'], [ortFelder[0].feld.value.trim(), ort.feld, 'einen Ort']]
            .find(([w]) => !w);
        if (fehlt) {
            status.textContent = 'Bitte ' + fehlt[2] + ' eingeben.';
            fehlt[1].focus();
            return;
        }
        if (!gehoert.leer() && !werte.gehoert_zu) {
            status.textContent = 'Bitte bei „Gehört zu“ eine Hauptsache aus der Liste wählen (oder das Feld leeren).';
            gehoertFeld.feld.focus();
            return;
        }
        const n = Number(werte.anzahl);
        if (werte.anzahl === '' || !Number.isInteger(n) || n < 0 || n > 9999) {
            status.textContent = 'Anzahl bitte als ganze Zahl von 0 bis 9999.';
            anzahl.focus();
            return;
        }
        // Ausgeliehene Anzahl zählt nur, wenn „Ausgeliehen an“ ausgefüllt ist
        const leih = leihAnzahl.value.trim();
        if (werte.ausgeliehen_an && leih !== '') {
            const l = Number(leih);
            if (!Number.isInteger(l) || l < 1 || l > n) {
                status.textContent = 'Ausgeliehen bitte als ganze Zahl von 1 bis ' + n + ' (oder leer = alle).';
                leihAnzahl.focus();
                return;
            }
            werte.ausgeliehen_anzahl = l;
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
            ordne(antwort.sache);
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
            bild.merke(antwort.sache.bild);
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
        el('label', { text: 'Ort', attrs: { for: 'besitz-ort' } }), ortFelder[0].box,
        el('label', { text: 'Darin (Unterort)', attrs: { for: 'besitz-ort-2' } }), ortFelder[1].box,
        el('label', { text: 'Darin (zum Beispiel Kiste)', attrs: { for: 'besitz-ort-3' } }), ortFelder[2].box,
        el('label', { text: 'Anzahl', attrs: { for: 'besitz-anzahl' } }), anzahl,
        el('label', { text: 'Kaufpreis (€)', attrs: { for: 'besitz-preis' } }), preis,
        el('label', { text: 'Kaufdatum', attrs: { for: 'besitz-datum' } }), datum,
        el('label', { text: 'Ausgeliehen an', attrs: { for: 'besitz-ausgeliehen' } }), ausgeliehen.box,
        el('label', { text: 'Davon ausgeliehen (Stück)', attrs: { for: 'besitz-leih-anzahl' } }), leihAnzahl,
        el('label', { text: 'Ausmisten', attrs: { for: 'besitz-ausmisten' } }), ausmisten,
        el('label', { text: 'Notiz', attrs: { for: 'besitz-notiz' } }), notiz,
        el('label', { text: 'Gehört zu (Zubehör von)', attrs: { for: 'besitz-gehoert' } }), gehoertFeld.box, gehoertHinweis,
        ...bild.elemente,
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
        leihAnzahl.value = '';
        ausmisten.value = '';
        bild.setze('');
    }

    // Hauptsachen = Sachen, die nicht selbst Zubehör einer vorhandenen Sache sind
    // Während zeigeListe() läuft, gilt ein Verzeichnis (ids und Zubehör je Hauptsache), damit die Suche flüssig bleibt (Etappe 8).
    // Es wird bei jedem Aufruf neu gebaut, weil Speichern die Liste direkt ändert.
    let verzeichnis = null;
    const baueVerzeichnis = () => {
        const ids = new Set();
        const kinder = new Map();
        for (const x of sachen) {
            ids.add(x.id);
            if (x.gehoert_zu) (kinder.get(x.gehoert_zu) || kinder.set(x.gehoert_zu, []).get(x.gehoert_zu)).push(x);
        }
        return { ids, kinder };
    };
    const istZubehoer = (s) => Boolean(s.gehoert_zu) && (verzeichnis ? verzeichnis.ids.has(s.gehoert_zu) : sachen.some((x) => x.id === s.gehoert_zu));
    const zubehoerVon = (id) => (verzeichnis ? (verzeichnis.kinder.get(id) || []).slice() : (sachen || []).filter((x) => x.gehoert_zu === id));

    // Füllt „Gehört zu“ für die Sache, die gerade im Formular steht (null = neu)
    function fuelleGehoert(sache) {
        const hatEigenes = sache ? zubehoerVon(sache.id).length > 0 : false;
        const kandidaten = (sachen || []).filter((x) => !istZubehoer(x) && (!sache || x.id !== sache.id));
        gehoertZuId = new Map();
        kandidaten.forEach((x) => {
            let t = gehoertText(x);
            for (let k = 2; gehoertZuId.has(t); k++) t = gehoertText(x) + ' (' + k + ')'; // gleicher Name am gleichen Ort
            gehoertZuId.set(t, x.id);
        });
        gehoertFeld.setzeEintraege([...gehoertZuId.keys()]);
        const haupt = sache && istZubehoer(sache) ? sache.gehoert_zu : '';
        gehoertFeld.feld.value = haupt ? ([...gehoertZuId].find(([, id]) => id === haupt) || [''])[0] : '';
        gehoertFeld.feld.disabled = hatEigenes;
        gehoertFeld.box.querySelector('.auswahl-pfeil').disabled = hatEigenes;
        gehoertHinweis.textContent = hatEigenes ? 'Dieses Item hat selbst Zubehör und bleibt darum ein eigenes Item.' : '';
    }

    // Hauptsache gewählt: Ort übernehmen, wenn noch keiner eingetragen ist
    function hauptGewaehlt() {
        const h = (sachen || []).find((x) => x.id === gehoert.id());
        if (h && !ort.wert()) ort.setze(h.ort);
    }

    // Löschen ist weich: Im Sheet steht dann geloescht = TRUE, die Person kann es dort zurückholen.
    async function loeschen() {
        const s = bearbeite;
        if (!s || sendet) return;
        const zahl = zubehoerVon(s.id).length;
        const frage = '„' + s.name + '“ löschen?' + (zahl ? ' Das Zubehör (' + zahl + ') bleibt als eigenes Item erhalten.' : '');
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
            ort.setze(sache.ort);
            ausmisten.value = sache.ausmisten || '';
            anzahl.value = String(sache.anzahl);
            preis.value = sache.kaufpreis == null ? '' : String(sache.kaufpreis);
            datum.value = sache.kaufdatum || '';
            notiz.value = sache.notiz || '';
            ausgeliehen.feld.value = verliehen(sache);
            leihAnzahl.value = sache.ausgeliehen_anzahl ? String(sache.ausgeliehen_anzahl) : '';
            bild.setze(sache.bild || '');
        } else if (warBearbeiten) {
            // Vom Ändern zurück: keine Werte der geänderten Sache stehen lassen
            felderLeeren();
            ort.setze('');
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
            ['Gehört zu', haupt ? haupt.name : ''],
            ['Zubehör', zubehoer.map((z) => z.name + (z.anzahl > 1 ? ' (' + z.anzahl + ')' : '')).join(', ')],
            ['Notiz', s.notiz],
            ['Unklar', s.unklar]
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
            schnellAendern(s),
            el('div', { class: 'besitz-form-knoepfe' }, [
                el('button', { class: 'knopf knopf-bereich', text: 'Bearbeiten', attrs: { type: 'button' }, on: { click: () => { dialog.close(); zeigeFormular(true, s); } } }),
                el('button', { class: 'knopf knopf-zweit', text: 'Schließen', attrs: { type: 'button' }, on: { click: () => dialog.close() } })
            ])
        ]));
        if (!dialog.open) dialog.showModal();
    }

    // Im Fenster direkt ausleihen und ausmisten (Wunsch der Person, 16.11.2026): je ein Haken mit Feld, nebeneinander.
    // „Übernehmen“ speichert die ganze Sache mit den neuen Werten (gleicher Schutz vor Überschreiben wie im Formular).
    function schnellAendern(s) {
        const leihHaken = el('input', { attrs: { id: 'besitz-schnell-leihe', type: 'checkbox', checked: Boolean(verliehen(s)) } });
        const leihName = el('input', { attrs: { id: 'besitz-schnell-leihe-name', type: 'text', maxlength: 60, autocomplete: 'off', placeholder: 'an wen', 'aria-label': 'Ausgeliehen an', value: verliehen(s) } });
        const mistHaken = el('input', { attrs: { id: 'besitz-schnell-mist', type: 'checkbox', checked: Boolean(s.ausmisten) } });
        const mistArt = el('select', { attrs: { id: 'besitz-schnell-mist-art', 'aria-label': 'Wie ausmisten' } },
            AUSMISTEN.map(([w, t]) => el('option', { text: t, attrs: { value: w } })));
        mistArt.value = s.ausmisten || 'offen';
        const meldung = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const knopf = el('button', { class: 'knopf knopf-bereich', text: 'Übernehmen', attrs: { type: 'button', hidden: true }, on: { click: () => uebernehmen() } });
        const neu = () => ({
            ausgeliehen_an: leihHaken.checked ? leihName.value.trim() : '',
            ausmisten: mistHaken.checked ? mistArt.value : ''
        });
        const geaendert = () => { const n = neu(); return n.ausgeliehen_an !== verliehen(s) || n.ausmisten !== (s.ausmisten || ''); };
        function stand() {
            leihName.disabled = !leihHaken.checked;
            mistArt.disabled = !mistHaken.checked;
            knopf.hidden = !geaendert();
            meldung.textContent = '';
        }
        leihHaken.addEventListener('change', () => { stand(); if (leihHaken.checked) leihName.focus(); });
        mistHaken.addEventListener('change', stand);
        leihName.addEventListener('input', stand);
        mistArt.addEventListener('change', stand);
        stand();

        let laeuft = false;
        async function uebernehmen() {
            if (laeuft) return;
            const n = neu();
            if (leihHaken.checked && !n.ausgeliehen_an) {
                meldung.textContent = 'Bitte eintragen, an wen es ausgeliehen ist.';
                leihName.focus();
                return;
            }
            laeuft = true;
            knopf.disabled = true;
            meldung.textContent = 'Speichere …';
            try {
                // Die ausgeliehene Anzahl bleibt, solange es an dieselbe Person geht; sonst gelten alle Stück
                const leihAnzahl = n.ausgeliehen_an && n.ausgeliehen_an === verliehen(s) ? (s.ausgeliehen_anzahl || '') : '';
                const antwort = await api('leben', 'speichern', {
                    id: s.id, geaendert_am: s.geaendert_am,
                    name: s.name, kategorie: s.kategorie, ort: s.ort, anzahl: s.anzahl,
                    kaufpreis: s.kaufpreis == null ? '' : s.kaufpreis, kaufdatum: s.kaufdatum || '', notiz: s.notiz || '',
                    gehoert_zu: s.gehoert_zu || '', bild: s.bild || '',
                    ausgeliehen_an: n.ausgeliehen_an, ausgeliehen_anzahl: leihAnzahl, ausmisten: n.ausmisten
                });
                ordne(antwort.sache);
                const i = sachen.findIndex((x) => x.id === s.id);
                if (i >= 0) sachen[i] = antwort.sache;
                zeigeGespeichert('Geändert', antwort.sache.name);
                zeigeAlles();
                zeigeSache(antwort.sache);
            } catch (e) {
                meldung.textContent = 'NICHT gespeichert: ' + e.message;
                knopf.disabled = false;
                laeuft = false;
            }
        }

        return el('div', { class: 'besitz-schnell' }, [
            el('div', { class: 'besitz-schnell-teil' }, [
                el('h3', { text: 'Ausleihen' }),
                el('label', { class: 'besitz-schnell-haken', attrs: { for: 'besitz-schnell-leihe' } }, [leihHaken, el('span', { text: 'ausgeliehen' })]),
                leihName
            ]),
            el('div', { class: 'besitz-schnell-teil' }, [
                el('h3', { text: 'Ausmisten' }),
                el('label', { class: 'besitz-schnell-haken', attrs: { for: 'besitz-schnell-mist' } }, [mistHaken, el('span', { text: 'ausmisten' })]),
                mistArt
            ]),
            el('div', { class: 'besitz-schnell-ende' }, [knopf, meldung])
        ]);
    }

    // --- Suche und Filter (rechnen nur im Gerät) ---
    const suche = el('input', {
        attrs: { id: 'besitz-suche', type: 'search', autocomplete: 'off', placeholder: 'Name, Kategorie, Ort, Notiz, ausgeliehen an' },
        // Erst 200 ms nach dem letzten Buchstaben neu zeichnen, damit Tippen nicht ruckelt (Etappe 8)
        on: { input: () => { clearTimeout(suchWarten); suchWarten = setTimeout(zeigeListe, 200); } }
    });
    let suchWarten = null;
    const ortFilter = el('select', { attrs: { id: 'besitz-filter-ort' }, on: { change: () => zeigeListe() } });
    const katFilter = el('select', { attrs: { id: 'besitz-filter-kategorie' }, on: { change: () => zeigeListe() } });
    const leihFilter = el('select', { attrs: { id: 'besitz-filter-leihe' }, on: { change: () => zeigeListe() } });
    const mistFilter = el('select', { attrs: { id: 'besitz-filter-ausmisten' }, on: { change: () => zeigeListe() } });
    const nullZeigen = el('input', { attrs: { id: 'besitz-null', type: 'checkbox' }, on: { change: () => zeigeListe() } });
    const nullText = el('span');
    const nullBox = el('label', { class: 'besitz-null', attrs: { for: 'besitz-null' } }, [nullZeigen, nullText]);
    const suchBox = el('div', { class: 'formular besitz-suche', attrs: { role: 'search' } }, [
        el('label', { text: 'Suchen', attrs: { for: 'besitz-suche' } }), suche,
        el('div', { class: 'besitz-filter' }, [
            el('div', {}, [el('label', { text: 'Ort', attrs: { for: 'besitz-filter-ort' } }), ortFilter]),
            el('div', {}, [el('label', { text: 'Kategorie', attrs: { for: 'besitz-filter-kategorie' } }), katFilter]),
            el('div', {}, [el('label', { text: 'Ausgeliehen', attrs: { for: 'besitz-filter-leihe' } }), leihFilter]),
            el('div', {}, [el('label', { text: 'Ausmisten', attrs: { for: 'besitz-filter-ausmisten' } }), mistFilter])
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
        clearTimeout(suchWarten);
        verzeichnis = sachen ? baueVerzeichnis() : null;
        try {
            zeichneListe();
        } finally {
            verzeichnis = null;
        }
    }

    function zeichneListe() {
        leeren(listeBox);
        if (!sachen) return;
        const alleOrte = [...new Set(sachen.map((s) => s.ort).filter(Boolean))].sort(vergleiche);
        bekannteOrte = alleOrte;
        const alleKat = [...new Set(sachen.map((s) => s.kategorie).filter(Boolean))].sort(vergleiche);
        const alleLeiher = [...new Set(sachen.map(verliehen).filter(Boolean))].sort(vergleiche);
        kategorie.setzeEintraege(alleKat);
        ortListen();
        ausgeliehen.setzeEintraege(alleLeiher);
        // Ort-Filter als Baum: ein Oberort zeigt auch alles in seinen Unterorten
        fuelleFilter(ortFilter, 'Alle Orte', ortBaum(alleOrte).map((o) => {
            const t = ortTeile(o);
            return [o, '\u00A0\u00A0\u00A0'.repeat(t.length - 1) + (t.length > 1 ? '↳ ' : '') + t[t.length - 1]];
        }));
        fuelleFilter(mistFilter, 'Alle', [['ja', 'Nur zum Ausmisten'], ['nein', 'Nicht ausmisten'], ...AUSMISTEN.map(([w, t]) => ['=' + w, t])]);
        fuelleFilter(katFilter, 'Alle Kategorien', alleKat);
        fuelleFilter(leihFilter, 'Alle', [['ja', 'Nur ausgeliehene'], ['nein', 'Nicht ausgeliehen'], ...alleLeiher.map((n) => ['an:' + n, 'an ' + n])]);
        const ohne = sachen.filter((s) => !vorhanden(s)).length;
        nullText.textContent = 'Auch Items mit Anzahl 0 zeigen (' + ohne + ')';
        suchBox.hidden = !sachen.length;
        trefferText.textContent = '';
        zeigeSortZeile(false);
        if (!sachen.length) {
            listeBox.append(el('p', { class: 'leise', text: 'Noch keine Items eingetragen. Tippe auf „+ Hinzufügen“.' }));
            return;
        }
        const wort = klein(suche.value.trim());
        const leihe = leihFilter.value;
        const mist = mistFilter.value;
        const filterAn = Boolean(wort || ortFilter.value || katFilter.value || leihe || mist);
        const passtMist = (s) => !mist || (mist === 'ja' ? Boolean(s.ausmisten) : mist === 'nein' ? !s.ausmisten : s.ausmisten === mist.slice(1));
        const passtLeihe = (s) => !leihe || (leihe === 'ja' ? Boolean(verliehen(s)) : leihe === 'nein' ? !verliehen(s) : verliehen(s) === leihe.slice(3));
        const passt = (s) =>
            sichtbar(s)
            && (!ortFilter.value || imOrt(s.ort, ortFilter.value))
            && (!katFilter.value || s.kategorie === katFilter.value)
            && passtLeihe(s)
            && passtMist(s)
            && (!wort || [s.name, s.kategorie, s.ort, s.notiz, verliehen(s), s.unklar].some((t) => klein(t).includes(wort)));
        const treffer = sachen.filter(passt).length;
        if (filterAn) {
            trefferText.textContent = treffer ? treffer + ' von ' + sachen.filter(sichtbar).length + ' Items' : 'Keine Treffer.';
        }
        // Hauptsachen mit ihrem Zubehör. Eine Hauptsache steht da, wenn sie selbst oder ihr Zubehör passt.
        // Bei Suche oder Filter wird passendes Zubehör aufgeklappt gezeigt, sonst alles Zubehör zugeklappt.
        const eintraege = sachen.filter((s) => !istZubehoer(s)).map((s) => {
            const alle = zubehoerVon(s.id).filter(sichtbar).sort(nachSpalte);
            const kinder = filterAn ? alle.filter(passt) : alle;
            return { s, kinder, anzahlZubehoer: alle.length, selbst: passt(s), auf: offen.has(s.id) || (filterAn && kinder.length > 0) };
        }).filter((e) => e.selbst || e.kinder.length);
        zeigeSortZeile(eintraege.length > 0);
        if (!eintraege.length && !filterAn) {
            listeBox.append(el('p', { class: 'leise', text: 'Alle Items haben Anzahl 0. Setze den Haken oben, um sie zu sehen.' }));
            return;
        }
        // Nach Ort gruppiert, Orte nach Name, Sachen nach der gewählten Spalte
        const orte = new Map();
        eintraege.sort((a, b) => nachSpalte(a.s, b.s)).forEach((e) => {
            if (!orte.has(e.s.ort)) orte.set(e.s.ort, []);
            orte.get(e.s.ort).push(e);
        });
        // Je Raum eine Überschrift, darunter je Unterort eine kleinere (Baum-Reihenfolge)
        const zahlText = (n) => (n === 1 ? '1 Item' : n + ' Items');
        let raum = null;
        ortBaum([...orte.keys()]).filter((o) => orte.has(o) || ortTeile(o).length === 1).forEach((o) => {
            const t = ortTeile(o);
            if (t[0] !== raum) {
                raum = t[0];
                const imRaum = [...orte.entries()].filter(([k]) => ortTeile(k)[0] === raum).reduce((n, [, l]) => n + l.length, 0);
                listeBox.append(el('h2', { class: 'besitz-ort' }, [el('span', { text: raum }), el('span', { class: 'besitz-zahl', text: zahlText(imRaum) })]));
            }
            if (orte.has(o)) listeBox.append(ortGruppe(t.length > 1 ? t.slice(1).join(' › ') : '', orte.get(o), zahlText));
        });
    }

    // Eine Tabelle je Ort. Am Handy macht css/components.css daraus Karten (Spaltenname über data-label).
    // unterort = Weg unterhalb des Raums („Kallax › Stoffkiste“), leer = direkt im Raum
    // Filme, Bücher und Spiele stehen als Bild-Kacheln nebeneinander, die anderen in der Tabelle (Wunsch der Person, 16.11.2026).
    // Nur wenn oben im Filter genau eine dieser Kategorien gewählt ist, in der allgemeinen Liste bleiben sie Zeilen.
    function ortGruppe(unterort, liste, zahlText) {
        const alsKachel = (s) => istGalerie({ kategorie: katFilter.value }) && istGalerie(s);
        const galerie = liste.filter((e) => alsKachel(e.s));
        const tabelle = liste.filter((e) => !alsKachel(e.s));
        return el('section', { class: 'besitz-gruppe' }, [
            unterort ? el('h3', { class: 'besitz-unterort' }, [
                el('span', { text: unterort }),
                el('span', { class: 'besitz-zahl', text: zahlText(liste.length) })
            ]) : null,
            tabelle.length ? el('table', { class: 'besitz-tabelle' }, [
                spaltenBreiten(),
                el('tbody', {}, tabelle.flatMap((e) => [zeile(e.s, e), ...e.kinder.map((k) => zeile(k, null, e))]))
            ]) : null,
            galerie.length ? el('ul', { class: 'besitz-galerie' }, galerie.map(bildKachel)) : null
        ]);
    }

    // Eine Kachel: oben das Bild (ohne Bild ein Zeichen der Kategorie), darunter der Name. Tipp öffnet das Fenster.
    function bildKachel(e) {
        const s = e.s;
        const flaeche = el('span', { class: 'besitz-galerie-bild', attrs: { 'aria-hidden': 'true' } }, [
            el('span', { class: 'besitz-galerie-zeichen', text: galerieZeichen(s) })
        ]);
        if (s.bild) bildSpaeter(flaeche, s.bild);
        const merkmale = [
            s.anzahl !== 1 ? s.anzahl + '×' : '',
            e.anzahlZubehoer ? '+ ' + e.anzahlZubehoer + ' Zubehör' : '',
            verliehen(s) ? '🤝 ' + leihText(s) : '',
            s.ausmisten ? '🧹 ' + (s.ausmisten === 'offen' ? 'ausmisten' : ausmistText(s.ausmisten)) : ''
        ].filter(Boolean);
        let klasse = 'besitz-galerie-kachel';
        if (!e.selbst) klasse += ' besitz-nur-kontext';
        if (s.anzahl === 0) klasse += ' besitz-null-zeile';
        if (s.unklar) klasse += ' besitz-unklar';
        return el('li', {}, [el('button', {
            class: klasse,
            attrs: { type: 'button', 'aria-label': s.name + ' ansehen' },
            on: { click: () => zeigeSache(s) }
        }, [
            flaeche,
            el('span', { class: 'besitz-galerie-name', text: s.name }),
            merkmale.length ? el('span', { class: 'besitz-galerie-merkmale leise', text: merkmale.join(' · ') }) : null
        ])]);
    }

    // Bilder der Kacheln erst holen, wenn die Kachel fast zu sehen ist, und höchstens drei gleichzeitig.
    // So fragt die Liste nicht hundert Bilder auf einmal beim Skript an.
    let bildBeobachter = null;
    const bildWarteschlange = [];
    let bilderUnterwegs = 0;
    function bildSpaeter(flaeche, id) {
        if (bilder.has(id)) { setzeKachelBild(flaeche, bilder.get(id)); return; }
        flaeche.dataset.bild = id;
        if (!window.IntersectionObserver) { bildAnstellen(flaeche); return; }
        if (!bildBeobachter) {
            bildBeobachter = new IntersectionObserver((sicht) => sicht.forEach((x) => {
                if (!x.isIntersecting) return;
                bildBeobachter.unobserve(x.target);
                bildAnstellen(x.target);
            }), { rootMargin: '300px 0px' });
        }
        bildBeobachter.observe(flaeche);
    }
    function bildAnstellen(flaeche) {
        bildWarteschlange.push(flaeche);
        naechstesBild();
    }
    function naechstesBild() {
        while (bilderUnterwegs < 3 && bildWarteschlange.length) {
            const flaeche = bildWarteschlange.shift();
            if (!flaeche.isConnected) continue; // Liste wurde inzwischen neu gezeichnet
            bilderUnterwegs++;
            holeBild(flaeche.dataset.bild)
                .then((adresse) => setzeKachelBild(flaeche, adresse))
                .catch(() => { /* Zeichen der Kategorie bleibt stehen */ })
                .finally(() => { bilderUnterwegs--; naechstesBild(); });
        }
    }
    function setzeKachelBild(flaeche, adresse) {
        leeren(flaeche);
        flaeche.append(el('img', { attrs: { src: adresse, alt: '' } }));
    }

    // Gleiche Spaltenbreiten in der Sortier-Zeile oben und in allen Ort-Tabellen (css/components.css)
    const spaltenBreiten = () => el('colgroup', {}, SPALTEN.map(() => el('col')));

    // Eine Sortier-Zeile oben im festen Kopf (PC), darunter die Orte (Wunsch der Person, 16.11.2026)
    const sortZeile = el('table', { class: 'besitz-tabelle besitz-sortzeile', attrs: { 'aria-label': 'Sortieren' } });
    function zeigeSortZeile(an) {
        leeren(sortZeile);
        sortZeile.hidden = !an;
        if (an) sortZeile.append(spaltenBreiten(), el('thead', {}, [el('tr', {}, SPALTEN.map(spaltenKopf))]));
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
        // Noch unklar (Spalte „unklar“ im Sheet): ganze Kachel gelb (Wunsch der Person, 16.11.2026)
        if (s.unklar) klasse += ' besitz-unklar';
        // Zubehör steht optisch in der Kachel der Hauptsache (Wunsch der Person, 16.11.2026)
        if (eintrag && eintrag.kinder.length && eintrag.auf) klasse += ' besitz-offen';
        if (haupt && haupt.kinder[haupt.kinder.length - 1] === s) klasse += ' besitz-kind-letztes';
        // Eine Zeile unter dem Namen: Zubehör-Knopf, dann Bild-Zeichen, dann „ausgeliehen“
        const merkmale = [
            eintrag && eintrag.kinder.length ? aufklapper(eintrag) : null,
            s.bild ? el('span', { class: 'besitz-hat-bild', text: '📷', attrs: { title: 'hat ein Bild', role: 'img', 'aria-label': 'hat ein Bild' } }) : null,
            verliehen(s) ? el('span', { class: 'besitz-verliehen', text: '🤝 ' + leihText(s) }) : null,
            s.ausmisten ? el('span', { class: 'besitz-verliehen besitz-ausmisten', text: '🧹 ' + (s.ausmisten === 'offen' ? 'ausmisten' : ausmistText(s.ausmisten)) }) : null
        ].filter(Boolean);
        return el('tr', {
            class: klasse,
            attrs: { hidden: haupt && !haupt.auf, 'data-haupt': haupt ? haupt.s.id : null },
            on: { click: (ev) => { if (!ev.target.closest('button')) zeigeSache(s); } }
        }, [
            el('th', { class: 'besitz-name', attrs: { scope: 'row' } }, [
                // Name und rechts die Anzahl in einer Zeile (die Anzahl rechts nur am Handy, am PC steht sie in ihrer Spalte)
                el('div', { class: 'besitz-namezeile' }, [
                    el('span', {}, [
                        haupt ? el('span', { class: 'besitz-kind-pfeil', text: '↳ ', attrs: { 'aria-hidden': 'true' } }) : null,
                        el('button', { class: 'besitz-oeffnen', text: s.name, attrs: { type: 'button', 'aria-label': s.name + ' ansehen' }, on: { click: () => zeigeSache(s) } })
                    ]),
                    el('span', { class: 'besitz-stueck', text: s.anzahl + '×', attrs: { 'aria-label': 'Anzahl ' + s.anzahl } })
                ]),
                s.notiz ? el('span', { class: 'besitz-notiz leise', text: s.notiz }) : null,
                merkmale.length ? el('div', { class: 'besitz-merkmale' }, merkmale) : null
            ]),
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
                    knopf.closest('tr').classList.toggle('besitz-offen', e.auf);
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
        const mist = da.filter((s) => s.ausmisten);
        const zahlKachel = (wert, text) => el('div', { class: 'besitz-zahl-kachel' }, [
            el('span', { class: 'besitz-zahl-wert', text: String(wert) }),
            el('span', { class: 'leise', text })
        ]);
        uebersichtBox.append(el('div', { class: 'besitz-zahlen' }, [
            zahlKachel(da.length, da.length === 1 ? 'Item' : 'Items'),
            zahlKachel(stueck, 'Stück'),
            zahlKachel(leihen.length, 'ausgeliehen'),
            zahlKachel(mist.length, 'ausmisten')
        ]));
        if (!da.length) {
            uebersichtBox.append(el('p', { class: 'leise', text: 'Noch nichts eingetragen.' }));
            return;
        }
        uebersichtBox.append(
            zaehlung('Je Kategorie', da, (s) => s.kategorie, (w) => { katFilter.value = w; }),
            zaehlung('Je Ort', da, (s) => ortTeile(s.ort).map((_, i, t) => ortText(t.slice(0, i + 1))), (w) => { ortFilter.value = w; }, undefined, true)
        );
        if (leihen.length) uebersichtBox.append(zaehlung('Ausgeliehen an', leihen, verliehen, (w) => { leihFilter.value = 'an:' + w; }, leihStueck));
        if (mist.length) uebersichtBox.append(zaehlung('Ausmisten', mist, (s) => s.ausmisten, (w) => { mistFilter.value = '=' + w; }, undefined, false, ausmistText));
    }

    // Eine Tabelle: Gruppe, Sachen und Stück. Tipp auf eine Zeile öffnet die Liste mit diesem Filter.
    // stueckVon = was als Stück zählt (sonst die Anzahl). baum = Orte mit Unterorten eingerückt (schluessel gibt dann alle Ebenen).
    // anzeige = Text zu einem Schlüssel
    function zaehlung(titel, liste, schluessel, filtern, stueckVon = (s) => s.anzahl, baum = false, anzeige = (k) => k) {
        const gruppen = new Map();
        liste.forEach((s) => {
            [].concat(schluessel(s)).forEach((k) => {
                const g = gruppen.get(k) || { sachen: 0, stueck: 0 };
                g.sachen += 1;
                g.stueck += stueckVon(s);
                gruppen.set(k, g);
            });
        });
        const reihe = baum
            ? ortBaum([...gruppen.keys()]).map((k) => [k, gruppen.get(k)])
            : [...gruppen.entries()].sort((a, b) => b[1].sachen - a[1].sachen || vergleiche(a[0], b[0]));
        const zeigeGefiltert = (w) => {
            suche.value = '';
            ortFilter.value = '';
            katFilter.value = '';
            leihFilter.value = '';
            mistFilter.value = '';
            filtern(w);
            zeigeTeil('liste');
        };
        return el('section', { class: 'besitz-gruppe' }, [
            el('h2', { class: 'besitz-ort', text: titel }),
            el('table', { class: 'besitz-zaehlung' }, [
                el('thead', {}, [el('tr', {}, [
                    el('th', { text: titel.replace(/^Je /, ''), attrs: { scope: 'col' } }),
                    el('th', { class: 'zahl', text: 'Items', attrs: { scope: 'col' } }),
                    el('th', { class: 'zahl', text: 'Stück', attrs: { scope: 'col' } })
                ])]),
                el('tbody', {}, reihe.map(([name, g]) => {
                    const ebene = baum ? ortTeile(name).length - 1 : 0;
                    const text = baum ? (ebene ? '↳ ' : '') + ortTeile(name)[ebene] : anzeige(name);
                    return el('tr', { class: 'besitz-zeile' + (ebene ? ' besitz-ebene-' + ebene : ''), on: { click: (ev) => { if (!ev.target.closest('button')) zeigeGefiltert(name); } } }, [
                        el('th', { attrs: { scope: 'row' } }, [
                            el('button', { class: 'besitz-oeffnen', text, attrs: { type: 'button', 'aria-label': (baum ? name : text) + ': in der Liste zeigen' }, on: { click: () => zeigeGefiltert(name) } })
                        ]),
                        el('td', { class: 'zahl', text: String(g.sachen) }),
                        el('td', { class: 'zahl', text: String(g.stueck) })
                    ]);
                }))
            ])
        ]);
    }

    // --- Fester Kopf: Titel, Unterreiter, Suche, Filter, Haken „Anzahl 0“ und Sortier-Zeile bleiben beim Blättern oben
    // (Wunsch der Person, 16.11.2026). Solange das Formular offen ist, blättert der Kopf mit, damit Platz für das Formular bleibt.
    const suchKopf = el('div', {}, [suchBox, sortZeile]);
    const listeTeil = el('div', { attrs: { id: 'besitz-teil-liste' } }, [trefferText, listeBox]);
    const teilKnoepfe = [['liste', 'Liste', listeTeil], ['uebersicht', 'Übersicht', uebersichtBox]].map(([id, text, box]) => [
        id,
        el('button', { class: 'ansicht', text, attrs: { type: 'button', 'aria-controls': box.id }, on: { click: () => zeigeTeil(id) } }),
        box
    ]);

    const kopfLeiste = el('div', { class: 'besitz-oben' }, [
        el('div', { class: 'besitz-kopf' }, [
            el('h1', { class: 'bereich-titel titel-mit-emoji' }, [
                el('span', { class: 'titel-emoji', text: '📦', attrs: { 'aria-hidden': 'true' } }),
                el('span', { text: ctx.bereich.titel })
            ]),
            neuKnopf
        ]),
        el('div', { class: 'ansichten' }, teilKnoepfe.map(([, knopf]) => knopf)),
        suchKopf
    ]);

    function zeigeTeil(id) {
        teil = id;
        teilKnoepfe.forEach(([k, knopf, box]) => {
            knopf.setAttribute('aria-pressed', k === id ? 'true' : 'false');
            box.hidden = k !== id;
        });
        suchKopf.hidden = id !== 'liste';
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
            sachen = Array.isArray(d.sachen) ? d.sachen.map(ordne) : [];
            ladeStatus.textContent = '';
            zeigeAlles();
        } catch (e) {
            ladeStatus.textContent = 'Laden fehlgeschlagen: ' + e.message;
        } finally {
            neuLaden.disabled = false;
        }
    }

    container.append(
        kopfLeiste,
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
