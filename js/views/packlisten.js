// Reiter Packlisten (Etappe 15, docs/STAND.md 4 „Packlisten“). Feste Listen je Anlass, jede Liste ein Unterreiter.
// Ein Eintrag hat Name, Gruppe, Anzahl (freiwillig) und zwei Haken: „Hin“ (eingepackt) und „Zurück“ (wieder eingepackt).
// Gruppen und Einträge lassen sich mit Pfeilen ^ und v ordnen. „Alle Haken weg“ macht die Liste fürs nächste Mal leer.
// Zeigt ein Eintrag auf ein Item im Besitz und ist er bei „Hin“ abgehakt, steht oben dessen Zähler „Nutzungen“ mit − und + (Wunsch der Person: Wasserfilter).
// Die Namen der Listen stehen nur im Sheet (Spalte „liste“), nicht im Repo. Daten aus dem Skript „leben“, nur im Arbeitsspeicher.

import { el, leeren, vergleiche } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { lesen, schreiben } from '../store.js';

// Zuletzt geladene Daten { eintraege, zaehler }, nur im Arbeitsspeicher. Beim Öffnen sofort zeigen, dann frisch laden.
let daten = null;
// Gewählte Liste (Unterreiter). Bleibt, solange die Seite offen ist.
let listeWahl = '';
// Items im Besitz für die Auswahl im Formular (erst beim ersten Formular geladen)
let besitzItems = null;
// Zähler ohne Netz (ab 1.7.4, Ausnahme von 1.5, Wunsch der Person): noch nicht gesendete Schritte je Item im Gerät,
// { <besitz_id>: +2 }. Sie werden nachgetragen, sobald wieder Netz da ist. Nur Kennung und Zahl, keine Namen.
const OFFEN_SPEICHER = 'pack_zaehler_offen';
const offeneSchritte = () => { const o = lesen(OFFEN_SPEICHER, {}); return o && typeof o === 'object' ? o : {}; };
// Dazu (ab 1.7.5) die Zähler, die zuletzt über einer Liste standen: { <besitz_id>: { name, nutzungen } }.
// So sind sie auch da, wenn die App ohne Netz neu geöffnet wird (Wunsch der Person: Wasserfilter im Wald). Die Packliste selbst nicht.
const GERAET_SPEICHER = 'pack_zaehler_geraet';
const geraeteZaehler = () => { const o = lesen(GERAET_SPEICHER, {}); return o && typeof o === 'object' ? o : {}; };
// Wieder Netz oder zurück in der App: offene Schritte nachtragen (nur, wenn der Reiter offen ist)
let nachtragen = null;
window.addEventListener('online', () => { if (nachtragen && /^#\/packlisten/.test(location.hash)) nachtragen(); });
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && nachtragen && /^#\/packlisten/.test(location.hash)) nachtragen();
});
const MAX_NAME = 80;
const MAX_GRUPPE = 40;
const MAX_LISTE = 40;
const MAX_ANZAHL = 999;
const OHNE_GRUPPE = 'Ohne Gruppe';

const klein = (t) => String(t || '').trim().toLocaleLowerCase('de');
const ordne = (a, b) => (a.reihenfolge - b.reihenfolge) || vergleiche(a.name, b.name);
const inListe = (e) => klein(e.liste) === klein(listeWahl);
const eintraegeDerListe = () => (daten ? daten.eintraege.filter(inListe).sort(ordne) : []);

// Namen aller Listen, A–Z, jeder Name nur einmal
function listenNamen() {
    const namen = [];
    (daten ? daten.eintraege : []).forEach((e) => {
        const n = String(e.liste || '').trim();
        if (n && !namen.some((x) => klein(x) === klein(n))) namen.push(n);
    });
    return namen.sort(vergleiche);
}

// Die gewählte Liste als Gruppen: [{ name, eintraege }]. Eine Gruppe steht da, wo ihr erster Eintrag steht.
function gruppen() {
    const liste = [];
    eintraegeDerListe().forEach((e) => {
        let g = liste.find((x) => klein(x.name) === klein(e.gruppe));
        if (!g) { g = { name: e.gruppe, eintraege: [] }; liste.push(g); }
        g.eintraege.push(e);
    });
    return liste;
}

export function render(container, ctx) {
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'pack-dialog-titel' } });
    let sendet = false; // gegen doppeltes Senden im Formular

    function oeffneDialog(titel, inhalt) {
        leeren(dialog);
        dialog.append(el('div', { class: 'besitz-dialog-inhalt' }, [
            el('div', { class: 'form-kopf' }, [
                el('h2', { text: titel, attrs: { id: 'pack-dialog-titel' } }),
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
            const antwort = await api('leben', action, werte);
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

    function merke(e, zaehler) {
        const i = daten.eintraege.findIndex((x) => x.id === e.id);
        if (i >= 0) daten.eintraege[i] = e; else daten.eintraege.push(e);
        if (zaehler) Object.assign(daten.zaehler, zaehler);
    }

    // --- Formular: neu oder ändern ---
    // Füllt das Suchfeld „Item aus dem Besitz“: Vorschlag „Name · Ort“ → id
    async function ladeBesitz(wahl, hinweis, zuId) {
        if (!besitzItems) {
            hinweis.textContent = 'Items aus dem Besitz laden …';
            try {
                const d = await api('leben', 'liste');
                besitzItems = (Array.isArray(d.sachen) ? d.sachen : []).map((s) => ({ id: s.id, name: s.name, ort: s.ort }))
                    .sort((a, b) => vergleiche(a.name, b.name));
            } catch (e) {
                hinweis.textContent = 'Besitz nicht geladen: ' + e.message;
                return;
            }
        }
        hinweis.textContent = 'Freiwillig. Tippe ins Feld oder suche. Ist der Eintrag bei „Hin“ abgehakt, steht oben der Zähler „Nutzungen“ dieses Items.';
        besitzItems.forEach((s) => {
            const basis = s.name + (s.ort ? ' · ' + s.ort : '');
            let t = basis;
            for (let k = 2; zuId.has(t); k++) t = basis + ' (' + k + ')'; // gleicher Name am gleichen Ort
            zuId.set(t, s.id);
        });
        wahl.setzeEintraege([...zuId.keys()]);
    }

    function zeigeForm(e, neueListe) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const name = el('input', { attrs: { id: 'pack-f-name', type: 'text', maxlength: MAX_NAME, autocomplete: 'off', value: e ? e.name : '' } });
        const gruppe = auswahlFeld({ id: 'pack-f-gruppe', maxlength: MAX_GRUPPE, placeholder: 'zum Beispiel Kleidung' });
        gruppe.feld.value = e ? e.gruppe : '';
        gruppe.setzeEintraege(gruppen().map((g) => g.name).filter(Boolean));
        const anzahl = el('input', { attrs: { id: 'pack-f-anzahl', type: 'number', inputmode: 'numeric', min: 1, max: MAX_ANZAHL, step: 1, placeholder: 'freiwillig', value: e && e.anzahl ? e.anzahl : '' } });
        const liste = auswahlFeld({ id: 'pack-f-liste', maxlength: MAX_LISTE, placeholder: 'Name der Liste' });
        liste.feld.value = e ? e.liste : (neueListe ? '' : listeWahl);
        liste.setzeEintraege(listenNamen());
        // Item aus dem Besitz: Suchfeld mit Liste zum Antippen (ab 1.7.4, Wunsch der Person: leichter am Handy)
        const besitz = auswahlFeld({ id: 'pack-f-besitz', maxlength: 200, placeholder: 'leer = keins' });
        const besitzHinweis = el('p', { class: 'leise besitz-hinweis' });
        const besitzZuId = new Map();
        const gewaehlt = e ? e.besitz_id : '';
        const besitzId = () => {
            const t = besitz.feld.value.trim();
            if (!t) return '';
            if (besitzZuId.has(t)) return besitzZuId.get(t);
            // Noch nicht geladen oder unverändert: das bisherige Item bleibt
            return gewaehlt && t === besitzStart ? gewaehlt : null;
        };
        let besitzStart = gewaehlt ? ((daten.zaehler[gewaehlt] || {}).name || 'Item im Besitz') : '';
        besitz.feld.value = besitzStart;
        ladeBesitz(besitz, besitzHinweis, besitzZuId).then(() => {
            // Bisheriges Item mit seinem Vorschlagstext zeigen (wenn noch nichts geändert wurde)
            const t = [...besitzZuId].find(([, id]) => id === gewaehlt);
            if (gewaehlt && t && besitz.feld.value === besitzStart) { besitz.feld.value = t[0]; besitzStart = t[0]; }
        });

        const speichern = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const loeschen = e ? el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button' }, on: { click: () => entfernen() } }) : null;
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        const knoepfe = [speichern, loeschen, abbrechen].filter(Boolean);

        async function absenden(ev) {
            ev.preventDefault();
            const n = name.value.trim();
            if (!n) { status.textContent = 'Bitte einen Namen eingeben.'; name.focus(); return; }
            const l = liste.feld.value.trim();
            if (!l) { status.textContent = 'Bitte eine Liste angeben.'; liste.feld.focus(); return; }
            const a = anzahl.value.trim();
            if (a && !(/^\d+$/.test(a) && Number(a) >= 1 && Number(a) <= MAX_ANZAHL)) {
                status.textContent = 'Anzahl bitte als ganze Zahl von 1 bis ' + MAX_ANZAHL + ' (oder leer).'; anzahl.focus(); return;
            }
            // Gleicher Name wie eine schon vorhandene Liste oder Gruppe (anders geschrieben): deren Schreibweise nehmen
            const listenName = listenNamen().find((x) => klein(x) === klein(l)) || l;
            const g = gruppe.feld.value.trim();
            const gruppenName = (daten.eintraege.find((x) => klein(x.liste) === klein(listenName) && klein(x.gruppe) === klein(g)) || {}).gruppe || g;
            const bid = besitzId();
            if (bid === null) { status.textContent = 'Bitte bei „Item aus dem Besitz“ ein Item aus der Liste wählen (oder das Feld leeren).'; besitz.feld.focus(); return; }
            const werte = { name: n, gruppe: gruppenName, anzahl: a, liste: listenName, besitz_id: bid };
            if (e) { werte.id = e.id; werte.geaendert_am = e.geaendert_am; }
            const antwort = await senden(status, knoepfe, 'pack_speichern', werte);
            if (!antwort || !antwort.eintrag) return;
            merke(antwort.eintrag, antwort.zaehler);
            listeWahl = antwort.eintrag.liste;
            dialog.close();
            zeigeGespeichert(e ? 'Geändert' : 'Gespeichert', antwort.eintrag.name);
            zeigeListe();
        }

        // Löschen ist weich: Im Sheet steht dann geloescht = TRUE, die Person kann es dort zurückholen.
        async function entfernen() {
            if (!confirm('„' + e.name + '“ löschen?')) return;
            const antwort = await senden(status, knoepfe, 'pack_loeschen', { id: e.id, geaendert_am: e.geaendert_am });
            if (!antwort) return;
            daten.eintraege = daten.eintraege.filter((x) => x.id !== e.id);
            dialog.close();
            zeigeGespeichert('Gelöscht', e.name);
            zeigeListe();
        }

        oeffneDialog(e ? 'Eintrag ändern' : (neueListe ? 'Neue Liste' : 'Neuer Eintrag'), [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden, input: () => { if (!sendet) status.textContent = ''; } } }, [
                neueListe ? el('p', { class: 'leise besitz-hinweis', text: 'Eine neue Liste entsteht mit ihrem ersten Eintrag.' }) : null,
                el('label', { text: 'Liste', attrs: { for: 'pack-f-liste' } }), liste.box,
                el('label', { text: 'Name', attrs: { for: 'pack-f-name' } }), name,
                el('label', { text: 'Gruppe', attrs: { for: 'pack-f-gruppe' } }), gruppe.box,
                el('label', { text: 'Anzahl', attrs: { for: 'pack-f-anzahl' } }), anzahl,
                el('label', { text: 'Item aus dem Besitz', attrs: { for: 'pack-f-besitz' } }), besitz.box, besitzHinweis,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        (neueListe ? liste.feld : name).focus();
    }

    // --- Haken: wirkt sofort, springt bei einem Fehler zurück ---
    // Je Haken läuft höchstens eine Anfrage. Tippt man währenddessen noch einmal, wird danach
    // der zuletzt gezeigte Stand gesendet. So kommen Antworten nie in falscher Reihenfolge an.
    const listeStatus = el('p', { class: 'meldung pack-status', attrs: { role: 'status', 'aria-live': 'polite' } });
    const hakenLaeuft = new Set();
    async function haken(e, art) {
        e[art] = !e[art];
        zeigeListe();
        const schluessel = e.id + '|' + art;
        if (hakenLaeuft.has(schluessel)) return;
        hakenLaeuft.add(schluessel);
        let gespeichert = !e[art];
        try {
            while (e[art] !== gespeichert) {
                const wert = e[art];
                await api('leben', 'pack_haken', { id: e.id, art, wert });
                gespeichert = wert;
            }
        } catch (f) {
            e[art] = gespeichert;
            listeStatus.textContent = '„' + e.name + '“ NICHT gespeichert: ' + f.message;
            zeigeListe();
        } finally {
            hakenLaeuft.delete(schluessel);
        }
    }

    // --- Alle Haken der Liste weg ---
    async function zuruecksetzen(knopf) {
        if (!confirm('Alle Haken in „' + listeWahl + '“ entfernen?')) return;
        const antwort = await senden(listeStatus, [knopf], 'pack_zuruecksetzen', { liste: listeWahl });
        if (!antwort) return;
        eintraegeDerListe().forEach((e) => { e.hin = false; e.zurueck = false; });
        zeigeGespeichert('Alle Haken weg', listeWahl);
        zeigeListe();
    }

    // --- Zähler „Nutzungen“ eines Items im Besitz ---
    // Jeder Tipp zählt sofort im Gerät mit und wird dann gesendet. Ohne Netz bleibt der Schritt im Gerät
    // und wird nachgetragen (beim nächsten Tipp, wenn wieder Netz da ist oder beim Laden). Gesendet wird Schritt für Schritt.
    let sendetZaehler = false;
    // Zähler aus dem Skript, ohne geladene Liste die im Gerät gemerkten
    const zaehlerDaten = () => (daten ? daten.zaehler : geraeteZaehler());
    const anzeige = (id) => Math.max(0, (zaehlerDaten()[id] ? zaehlerDaten()[id].nutzungen : 0) + (offeneSchritte()[id] || 0));
    // Zähler, die über einer Liste stehen (Eintrag mit Item und Haken „Hin“), im Gerät merken
    function merkeZaehler() {
        const ids = [];
        daten.eintraege.forEach((e) => { if (e.hin && e.besitz_id && daten.zaehler[e.besitz_id] && !ids.includes(e.besitz_id)) ids.push(e.besitz_id); });
        const neu = {};
        ids.forEach((id) => { neu[id] = { name: daten.zaehler[id].name, nutzungen: daten.zaehler[id].nutzungen }; });
        if (JSON.stringify(neu) !== JSON.stringify(geraeteZaehler())) schreiben(GERAET_SPEICHER, neu);
    }
    function zaehle(id, schritt) {
        if (schritt < 0 && anzeige(id) <= 0) return;
        const offen = offeneSchritte();
        offen[id] = (offen[id] || 0) + schritt;
        if (!offen[id]) delete offen[id];
        schreiben(OFFEN_SPEICHER, offen);
        zeigeListe();
        sendeZaehler();
    }
    async function sendeZaehler() {
        if (sendetZaehler) return;
        sendetZaehler = true;
        try {
            for (;;) {
                const offen = offeneSchritte();
                const id = Object.keys(offen).find((k) => offen[k]);
                if (!id) break;
                const schritt = offen[id] > 0 ? 1 : -1;
                let antwort;
                try {
                    antwort = await api('leben', 'besitz_nutzung', { id, schritt });
                } catch (f) {
                    if (f.code === 'fehlt') { // Item gibt es nicht mehr: Schritte verwerfen
                        const o = offeneSchritte(); delete o[id]; schreiben(OFFEN_SPEICHER, o); continue;
                    }
                    listeStatus.textContent = f.code === 'netz' || !navigator.onLine ? 'Ohne Netz: Der Zähler wird nachgetragen, sobald wieder Netz da ist.' : 'Zähler noch nicht gesendet: ' + f.message;
                    break;
                }
                const o = offeneSchritte();
                o[id] = (o[id] || 0) - schritt;
                if (!o[id]) delete o[id];
                schreiben(OFFEN_SPEICHER, o);
                if (daten && daten.zaehler[id]) daten.zaehler[id].nutzungen = antwort.nutzungen;
                const g = geraeteZaehler();
                if (g[id]) { g[id].nutzungen = antwort.nutzungen; schreiben(GERAET_SPEICHER, g); }
                if (!Object.keys(o).length) listeStatus.textContent = '';
            }
        } finally {
            sendetZaehler = false;
            zeigeListe();
        }
    }
    nachtragen = () => (daten ? sendeZaehler() : laden());

    // --- Reihenfolge: Pfeile ^ und v. Verschieben wirkt sofort, gespeichert wird kurz nach dem letzten Tippen. ---
    const reiheText = el('span');
    const reiheNochmal = el('button', { class: 'knopf knopf-zweit', text: 'Nochmal speichern', attrs: { type: 'button', hidden: true }, on: { click: () => speichereReihe() } });
    const reiheStatus = el('p', { class: 'meldung einkauf-reihe-status pack-reihe', attrs: { role: 'status', 'aria-live': 'polite' } }, [reiheText, reiheNochmal]);
    let reiheTimer = 0;
    let reiheFertigTimer = 0;
    let reiheListe = '';

    // Neue Folge übernehmen: der Reihe nach 1, 2, 3 … (wie das Skript)
    function uebernimm(gs, fokusId, d) {
        gs.flatMap((g) => g.eintraege).forEach((x, k) => { x.reihenfolge = k + 1; });
        zeigeListe();
        // Den Finger am gleichen Pfeil lassen; ist er jetzt aus (ganz oben oder unten), den anderen nehmen
        const knoepfe = [...listeBox.querySelectorAll('.einkauf-reihe-pfeil')].filter((k) => k.dataset.id === fokusId);
        const ziel = knoepfe.find((k) => k.dataset.d === String(d) && !k.disabled) || knoepfe.find((k) => !k.disabled);
        if (ziel) ziel.focus();
        clearTimeout(reiheTimer);
        clearTimeout(reiheFertigTimer);
        reiheNochmal.hidden = true;
        reiheText.textContent = 'Wird gleich gespeichert …';
        reiheListe = listeWahl;
        reiheTimer = setTimeout(speichereReihe, 900);
    }
    function schiebe(e, d) {
        const gs = gruppen();
        const g = gs.find((x) => x.eintraege.includes(e));
        const i = g ? g.eintraege.indexOf(e) : -1;
        if (i < 0 || !g.eintraege[i + d]) return;
        [g.eintraege[i], g.eintraege[i + d]] = [g.eintraege[i + d], g.eintraege[i]];
        uebernimm(gs, e.id, d);
    }
    function schiebeGruppe(name, d) {
        const gs = gruppen();
        const i = gs.findIndex((x) => klein(x.name) === klein(name));
        if (i < 0 || !gs[i + d]) return;
        [gs[i], gs[i + d]] = [gs[i + d], gs[i]];
        uebernimm(gs, 'gruppe:' + klein(name), d);
    }
    async function speichereReihe() {
        clearTimeout(reiheTimer);
        if (sendet) { reiheTimer = setTimeout(speichereReihe, 600); return; }
        const liste = reiheListe;
        const ids = daten.eintraege.filter((e) => klein(e.liste) === klein(liste)).sort(ordne).map((e) => e.id);
        reiheNochmal.hidden = true;
        const antwort = await senden(reiheText, [], 'pack_reihenfolge', { liste, ids });
        if (!antwort) { reiheNochmal.hidden = false; return; }
        if (reiheText.textContent === '') reiheText.textContent = 'Reihenfolge gespeichert.';
        reiheFertigTimer = setTimeout(() => { if (reiheText.textContent === 'Reihenfolge gespeichert.') reiheText.textContent = ''; }, 3000);
    }

    function pfeile(beschriftung, id, i, anzahl, beiKlick) {
        if (anzahl < 2) return null;
        return el('span', { class: 'einkauf-reihe-pfeile' }, [-1, 1].map((d) => el('button', {
            class: 'einkauf-reihe-pfeil ' + (d < 0 ? 'ist-hoch' : 'ist-runter'),
            attrs: { type: 'button', 'aria-label': beschriftung + (d < 0 ? ' nach oben' : ' nach unten'), disabled: d < 0 ? i === 0 : i === anzahl - 1, 'data-id': id, 'data-d': String(d) },
            on: { click: () => beiKlick(d) }
        })));
    }

    // Ein Haken-Knopf: ohne Haken steht „Hin“ oder „Zurück“ darin, mit Haken ein ✓
    function hakenKnopf(e, art) {
        const an = Boolean(e[art]);
        const wort = art === 'hin' ? 'Hin' : 'Zurück';
        return el('button', {
            class: 'pack-haken' + (an ? ' ist-an' : ''),
            text: an ? '✓' : wort,
            attrs: { type: 'button', 'aria-pressed': an ? 'true' : 'false', 'aria-label': e.name + ': ' + wort },
            on: { click: () => haken(e, art) }
        });
    }

    // Eine Zeile: Haken hin, Haken zurück, Name mit Anzahl (Tipp öffnet das Formular), Pfeile
    function zeile(e, i, anzahl) {
        return el('li', { class: 'einkauf-zeile pack-zeile' + (e.hin && e.zurueck ? ' ist-fertig' : '') }, [
            hakenKnopf(e, 'hin'),
            hakenKnopf(e, 'zurueck'),
            el('button', { class: 'einkauf-lm-wahl', attrs: { type: 'button', 'aria-label': e.name + ' bearbeiten' }, on: { click: () => zeigeForm(e, false) } }, [
                el('span', { class: 'einkauf-lm-name', text: e.name + (e.anzahl ? ' · ' + e.anzahl + '×' : '') })
            ]),
            pfeile(e.name, e.id, i, anzahl, (d) => schiebe(e, d))
        ]);
    }

    // Zähler oben über der Liste: je verknüpftes Item eine Zeile mit − und +.
    // Nur, wenn der Eintrag bei „Hin“ abgehakt ist (Wunsch der Person, 23.11.2026: der Wasserfilter ist dann dabei).
    function zaehlerIds(eintraege) {
        const ids = [];
        eintraege.forEach((e) => { if (e.hin && e.besitz_id && daten.zaehler[e.besitz_id] && !ids.includes(e.besitz_id)) ids.push(e.besitz_id); });
        return ids;
    }
    function zaehlerZeilen(ids) {
        return ids.map((id) => {
            const z = zaehlerDaten()[id];
            const zahl = anzeige(id);
            const wartet = offeneSchritte()[id] || 0;
            return el('div', { class: 'pack-zaehler' }, [
                el('span', { class: 'pack-zaehler-name' }, [
                    el('span', { text: z.name }),
                    el('span', { class: 'leise', text: ' · Nutzungen' })
                ]),
                el('button', { class: 'knopf knopf-zweit pack-zaehler-knopf', text: '−', attrs: { type: 'button', 'aria-label': z.name + ': eine Nutzung weniger', disabled: zahl <= 0 }, on: { click: () => zaehle(id, -1) } }),
                el('span', { class: 'pack-zaehler-zahl', text: String(zahl), attrs: { 'aria-live': 'polite' } }),
                el('button', { class: 'knopf knopf-zweit pack-zaehler-knopf', text: '+', attrs: { type: 'button', 'aria-label': z.name + ': eine Nutzung mehr' }, on: { click: () => zaehle(id, 1) } }),
                wartet ? el('span', { class: 'leise pack-zaehler-wartet', text: 'noch nicht gesendet (' + (wartet > 0 ? '+' : '') + wartet + ')' }) : null
            ]);
        });
    }

    // --- Liste ---
    const listeBox = el('div', { class: 'pack-liste' });
    const listenLeiste = el('div', { class: 'ansichten', attrs: { role: 'group', 'aria-label': 'Listen' } });
    function zeigeListen(namen) {
        leeren(listenLeiste);
        listenLeiste.hidden = !namen.length;
        namen.forEach((n) => listenLeiste.append(el('button', {
            class: 'ansicht', text: n,
            attrs: { type: 'button', 'aria-pressed': klein(n) === klein(listeWahl) ? 'true' : 'false' },
            on: { click: () => { listeWahl = n; listeStatus.textContent = ''; zeigeListe(); } }
        })));
    }
    function zeigeListe() {
        leeren(listeBox);
        if (!daten) {
            // Liste nicht geladen (zum Beispiel ohne Netz): nur die im Gerät gemerkten Zähler
            const ids = ladeFehler ? Object.keys(geraeteZaehler()) : [];
            if (ids.length) listeBox.append(el('p', { class: 'leise', text: 'Ohne Liste: Hier sind nur die Zähler. Sie werden nachgetragen, sobald wieder Netz da ist.' }), ...zaehlerZeilen(ids));
            return;
        }
        merkeZaehler();
        const namen = listenNamen();
        // Gewählte Liste gibt es nicht (mehr): die erste nehmen
        if (!namen.some((n) => klein(n) === klein(listeWahl))) listeWahl = namen[0] || '';
        zeigeListen(namen);
        neuKnopf.hidden = !namen.length;
        if (!namen.length) {
            listeBox.append(el('p', { class: 'leise', text: 'Noch keine Packliste. Tippe auf „+ Neue Liste“.' }));
            return;
        }
        const alle = eintraegeDerListe();
        const hin = alle.filter((e) => e.hin).length;
        const zur = alle.filter((e) => e.zurueck).length;
        const wegKnopf = el('button', { class: 'knopf knopf-zweit', text: 'Alle Haken weg', attrs: { type: 'button', disabled: !hin && !zur }, on: { click: () => zuruecksetzen(wegKnopf) } });
        listeBox.append(
            ...zaehlerZeilen(zaehlerIds(alle)),
            el('div', { class: 'pack-stand' }, [
                el('span', { text: 'Hin ' + hin + ' / ' + alle.length + ' · Zurück ' + zur + ' / ' + alle.length }),
                wegKnopf
            ])
        );
        const gs = gruppen();
        gs.forEach((g, i) => {
            listeBox.append(
                el('h2', { class: 'besitz-ort pack-gruppe' }, [
                    el('span', { class: 'einkauf-reihe-name', text: g.name || OHNE_GRUPPE }),
                    el('span', { class: 'besitz-zahl', text: g.eintraege.filter((e) => e.hin).length + ' / ' + g.eintraege.length }),
                    pfeile('Gruppe ' + (g.name || OHNE_GRUPPE), 'gruppe:' + klein(g.name), i, gs.length, (d) => schiebeGruppe(g.name, d))
                ]),
                el('ul', { class: 'einkauf-liste' }, g.eintraege.map((e, k) => zeile(e, k, g.eintraege.length)))
            );
        });
    }

    // --- Laden ---
    const ladeStatus = el('p', { class: 'meldung besitz-lade', attrs: { role: 'status', 'aria-live': 'polite' } });
    const neuLaden = el('button', { class: 'knopf knopf-zweit besitz-neu', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => laden() } });
    let ladeFehler = false;
    async function laden() {
        neuLaden.disabled = true;
        ladeStatus.textContent = daten ? 'Aktualisiere …' : 'Lädt …';
        try {
            const d = await api('leben', 'packliste');
            daten = { eintraege: Array.isArray(d.eintraege) ? d.eintraege : [], zaehler: d.zaehler && typeof d.zaehler === 'object' ? d.zaehler : {} };
            ladeStatus.textContent = '';
            ladeFehler = false;
            zeigeListe();
            sendeZaehler();
        } catch (e) {
            ladeFehler = true;
            zeigeListe();
            ladeStatus.textContent = 'Laden fehlgeschlagen: ' + e.message
                + (e.code === 'aktion' ? ' Bitte im Sheet „Leben“ die neue Fassung des Skripts einfügen, „einrichten“ ausführen und bereitstellen (Schritt 15.1).' : '');
        } finally {
            neuLaden.disabled = false;
        }
    }

    const neuKnopf = el('button', { class: 'knopf knopf-bereich', text: '+ Neuer Eintrag', attrs: { type: 'button', hidden: true }, on: { click: () => zeigeForm(null, false) } });
    const neueListeKnopf = el('button', { class: 'knopf knopf-zweit', text: '+ Neue Liste', attrs: { type: 'button' }, on: { click: () => zeigeForm(null, true) } });
    container.append(
        el('div', { class: 'besitz-kopf' }, [
            el('h1', { class: 'bereich-titel titel-mit-emoji' }, [
                el('img', { class: 'pack-rucksack', attrs: { src: 'icons/rucksack.svg', alt: '', width: '44', height: '44' } }),
                el('span', { text: ctx.bereich.titel })
            ]),
            el('div', { class: 'pack-kopf-knoepfe' }, [neuKnopf, neueListeKnopf])
        ]),
        listenLeiste,
        ladeStatus,
        listeStatus,
        reiheStatus,
        listeBox,
        neuLaden,
        dialog
    );
    zeigeListe();
    laden();
}
