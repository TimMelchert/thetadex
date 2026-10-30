// Reiter Einkauf: Einkaufsliste nach Abteilung und Lebensmittel mit Suche (Schritt 4.1).
// Gerichte (4.3): mit Zutaten und Mengen; ein Gericht wählen → Zutaten angehakt vorgeschlagen → auf die Liste.
// Die Einkaufsliste gibt es auch nach Gericht (Wunsch der Person, 30.10.2026).
// Vorrat (4.4, freiwillig): je Lebensmittel Mengen an Orten zuhause. Wo gepflegt, steht „zuhause: …“ dabei.
// Lebensmittel ankreuzen → „Auf die Einkaufsliste“ → Mengen eintragen. Die Auswahl bleibt bei Suche erhalten.
// Abgehakte Einträge bleiben grau und durchgestrichen stehen, bis „Einkauf fertig“ getippt wird (Wunsch der Person, 30.10.2026).
// Daten aus dem Skript „gemeinsam“ (Sheet „Gemeinsam“). Person und Partner*in, beide nur mit Passwort.
// Ohne Netz (4.2, Ausnahme in docs/STAND.md 4): Die offene Einkaufsliste liegt zusätzlich im Gerät (thetadex_einkaufsliste).
// Abhaken geht immer; die Haken warten im Gerät (thetadex_einkauf_offen), bis das Skript sie bestätigt.
// Alles andere (Lebensmittel, Gerichte) hält die App nur im Arbeitsspeicher.

import { el, leeren, sichereUrl } from '../ui/dom.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { api } from '../api.js';
import { lesen, schreiben } from '../store.js';
import { zeigeGespeichert } from '../ui/overlay.js';

// Zuletzt geladene Daten { lebensmittel, liste, gerichte, vorrat }, im Arbeitsspeicher
let daten = null;
// Abgehakte Einträge (ids), noch vor „Einkauf fertig“. Liegen im Gerät, lassen sich wieder lösen.
const haken = () => lesen('einkauf_haken', []) || [];
// Nach „Einkauf fertig“: ids, die das Skript noch nicht bestätigt hat. Liegen auch im Gerät.
const offeneHaken = () => lesen('einkauf_offen', []) || [];
// Angekreuzte Lebensmittel (ids) für „Auf die Einkaufsliste“. Nur im Arbeitsspeicher, bleibt bei Suche erhalten.
const auswahl = new Set();
// Die Einkaufsliste im Gerät: offene Einträge mit den Namen, die sie zum Anzeigen braucht
function merkeListe() {
    if (!daten) return;
    const lmIds = new Set(daten.liste.map((e) => e.lebensmittel_id));
    const gIds = new Set(daten.liste.map((e) => e.gericht_id).filter(Boolean));
    schreiben('einkaufsliste', {
        stand: Date.now(),
        liste: daten.liste,
        lebensmittel: daten.lebensmittel.filter((l) => lmIds.has(l.id)).map(({ id, name, abteilung, einheit }) => ({ id, name, abteilung, einheit })),
        gerichte: daten.gerichte.filter((g) => gIds.has(g.id)).map(({ id, name }) => ({ id, name }))
    });
}
// Neue Liste vom Skript: Einträge nach „Einkauf fertig“, die noch nicht gesendet sind, bleiben ausgeblendet.
// Haken zu Einträgen, die es nicht mehr gibt (zum Beispiel am anderen Handy entfernt), fallen weg.
function setzeListe(liste) {
    const warten = new Set(offeneHaken());
    daten.liste = (Array.isArray(liste) ? liste : []).filter((e) => !warten.has(e.id));
    const da = new Set(daten.liste.map((e) => e.id));
    schreiben('einkauf_haken', haken().filter((id) => da.has(id)));
    merkeListe();
}
const uhrzeit = (ms) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
// Einkaufsliste oder Lebensmittel. Bleibt, solange die Seite offen ist.
let teil = 'lebensmittel';
// Einkaufsliste nach Abteilung oder nach Gericht. Bleibt, solange die Seite offen ist.
let listeAnsicht = 'abteilung';
// Neu laden beim Zurückkehren in die App (nur, wenn der Reiter offen ist)
let neuLadenBeiRueckkehr = null;
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && neuLadenBeiRueckkehr && /^#\/einkauf/.test(location.hash)) neuLadenBeiRueckkehr();
});
// Wieder Netz: wartende Haken senden und neu laden
window.addEventListener('online', () => {
    if (neuLadenBeiRueckkehr && /^#\/einkauf/.test(location.hash)) neuLadenBeiRueckkehr();
});

const vergleiche = (a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true });
// Für die Suche: klein, ä = ae, ö = oe, ü = ue, ß = ss
const norm = (t) => String(t == null ? '' : t).toLocaleLowerCase('de')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
// Ohne Punkte: ä = a (so findet „apf“ auch „Äpfel“)
const ohnePunkte = (t) => String(t == null ? '' : t).toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss');
const findet = (text, wort) => norm(text).includes(norm(wort)) || ohnePunkte(text).includes(ohnePunkte(wort));
const zahlText = (n) => String(n).replace('.', ',');
const mitEinheit = (n, lm) => zahlText(n) + (lm && lm.einheit ? ' ' + lm.einheit : '');
// Anzahl in halben Schritten von 0,5 bis 9999
const gueltigeAnzahl = (n) => Number.isFinite(n) && n >= 0.5 && n <= 9999 && Math.round(n * 2) === n * 2;
const leseZahl = (t) => Number(String(t).trim().replace(',', '.'));

// Feld für eine Anzahl mit − und + (min = kleinster Wert beim Tippen auf −)
function anzahlFeld(id, wert = 1, min = 0.5) {
    const feld = el('input', { attrs: { id, type: 'text', inputmode: 'decimal', autocomplete: 'off', value: zahlText(wert) } });
    const schritt = (d) => {
        const n = leseZahl(feld.value);
        const neu = Number.isFinite(n) ? Math.max(min, Math.round((n + d) * 2) / 2) : 1;
        feld.value = zahlText(neu);
    };
    const box = el('div', { class: 'einkauf-anzahl' }, [
        el('button', { class: 'knopf knopf-zweit', text: '−', attrs: { type: 'button', 'aria-label': 'eins weniger' }, on: { click: () => schritt(-1) } }),
        feld,
        el('button', { class: 'knopf knopf-zweit', text: '+', attrs: { type: 'button', 'aria-label': 'eins mehr' }, on: { click: () => schritt(1) } })
    ]);
    return { box, feld };
}

export function render(container, ctx) {
    const ladeStatus = el('p', { class: 'meldung besitz-lade', attrs: { role: 'status', 'aria-live': 'polite' } });
    const listeBox = el('div', { class: 'einkauf-teil', attrs: { id: 'einkauf-teil-liste', hidden: true } });
    const lmBox = el('div', { class: 'einkauf-teil', attrs: { id: 'einkauf-teil-lebensmittel', hidden: true } });
    const gerichteBox = el('div', { class: 'einkauf-teil', attrs: { id: 'einkauf-teil-gerichte', hidden: true } });
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'einkauf-dialog-titel' } });
    dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
    let sendet = false; // gegen doppeltes Senden durch mehrfaches Tippen

    const lmVon = (id) => (daten ? daten.lebensmittel.find((l) => l.id === id) : null);
    const gerichtVon = (id) => (daten && id ? daten.gerichte.find((g) => g.id === id) : null);
    const aufListe = (id) => (daten ? daten.liste.filter((e) => e.lebensmittel_id === id).reduce((n, e) => n + e.anzahl, 0) : 0);
    // Vorrat eines Lebensmittels (leer = nicht gepflegt), größte Menge zuerst
    const vorratVon = (id) => (daten ? daten.vorrat.filter((v) => v.lebensmittel_id === id).sort((a, b) => b.menge - a.menge || vergleiche(a.ort, b.ort)) : []);
    const zuhause = (id) => vorratVon(id).reduce((n, v) => n + v.menge, 0);
    const zuhauseText = (id) => {
        const v = vorratVon(id);
        return v.length ? 'zuhause: ' + v.map((x) => zahlText(x.menge) + ' ' + x.ort).join(', ') : '';
    };

    // Ein Fenster mit Titel, Inhalt und Knöpfen
    function oeffneDialog(titel, inhalt) {
        leeren(dialog);
        dialog.append(el('div', { class: 'besitz-dialog-inhalt' }, [
            el('div', { class: 'form-kopf' }, [
                el('h2', { text: titel, attrs: { id: 'einkauf-dialog-titel' } }),
                el('button', { class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Schließen' }, on: { click: () => dialog.close() } })
            ]),
            ...inhalt
        ]));
        if (!dialog.open) dialog.showModal();
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

    // --- Angekreuzte Lebensmittel auf die Liste setzen: ein Fenster mit allen, je eine Menge ---
    function zeigeAuswahlFenster() {
        const gewaehlt = [...auswahl].map(lmVon).filter(Boolean).sort((a, b) => vergleiche(a.name, b.name));
        if (!gewaehlt.length) return;
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const felder = gewaehlt.map((lm, i) => ({ lm, anzahl: anzahlFeld('einkauf-auf-' + i) }));
        const ok = el('button', { class: 'knopf knopf-bereich', text: 'Auf die Liste', attrs: { type: 'submit' } });
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        async function absenden(ev) {
            ev.preventDefault();
            const eintraege = [];
            for (const f of felder) {
                const n = leseZahl(f.anzahl.feld.value);
                if (!gueltigeAnzahl(n)) {
                    status.textContent = f.lm.name + ': Menge bitte von 0,5 bis 9999 (halbe erlaubt).';
                    f.anzahl.feld.focus();
                    return;
                }
                eintraege.push({ lebensmittel_id: f.lm.id, anzahl: n });
            }
            const antwort = await senden(status, [ok, abbrechen], 'auf_liste', { eintraege });
            if (!antwort) return;
            setzeListe(antwort.liste);
            auswahl.clear();
            dialog.close();
            zeigeGespeichert('Auf der Liste', eintraege.length === 1 ? felder[0].lm.name : eintraege.length + ' Lebensmittel');
            zeigeAlles();
        }
        oeffneDialog('Auf die Einkaufsliste', [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden } }, [
                ...felder.flatMap(({ lm, anzahl }, i) => {
                    const schon = aufListe(lm.id);
                    return [
                        el('label', { text: lm.name + (lm.einheit ? ' (' + lm.einheit + ')' : ''), attrs: { for: 'einkauf-auf-' + i } }),
                        anzahl.box,
                        schon ? el('p', { class: 'leise besitz-hinweis', text: 'Schon auf der Liste: ' + mitEinheit(schon, lm) + '. Die Menge kommt dazu.' }) : null
                    ];
                }),
                el('div', { class: 'besitz-form-knoepfe' }, [ok, abbrechen]),
                status
            ])
        ]);
        felder[0].anzahl.feld.focus();
        felder[0].anzahl.feld.select();
    }

    // --- Lebensmittel anlegen oder ändern (lm = null: neu, name = Vorschlag aus der Suche) ---
    function zeigeLebensmittelForm(lm, name = '') {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const nameFeld = el('input', { attrs: { id: 'einkauf-lm-name', type: 'text', maxlength: 60, autocomplete: 'off', value: lm ? lm.name : name } });
        const abteilung = auswahlFeld({ id: 'einkauf-lm-abteilung', maxlength: 40, placeholder: 'freiwillig, wählen oder eintippen' });
        const einheit = auswahlFeld({ id: 'einkauf-lm-einheit', maxlength: 20, placeholder: 'freiwillig, zum Beispiel Packung' });
        const notiz = el('input', { attrs: { id: 'einkauf-lm-notiz', type: 'text', maxlength: 200, autocomplete: 'off', placeholder: 'freiwillig' } });
        const alle = daten ? daten.lebensmittel : [];
        abteilung.setzeEintraege(alle.map((l) => l.abteilung).filter(Boolean));
        einheit.setzeEintraege(['Stück', 'Packung', ...alle.map((l) => l.einheit).filter(Boolean)]);
        if (lm) {
            abteilung.feld.value = lm.abteilung;
            einheit.feld.value = lm.einheit;
            notiz.value = lm.notiz;
        }
        // Vorrat: je Ort eine Zeile mit Menge (0 = gerade nichts da) und Ort. Keine Zeile = wird nicht gepflegt.
        const alleOrte = [...new Set((daten ? daten.vorrat : []).map((v) => v.ort))];
        const vorratZeilen = [];
        const vorratListe = el('ul', { class: 'einkauf-liste' });
        let vnr = 0;
        function vorratDazu(v = null) {
            const id = 'einkauf-v-' + (vnr++);
            const menge = anzahlFeld(id + '-menge', v ? v.menge : 1, 0);
            const ort = auswahlFeld({ id: id + '-ort', maxlength: 40, placeholder: 'Schrank, Kühlschrank …' });
            ort.setzeEintraege(alleOrte);
            if (v) ort.feld.value = v.ort;
            const z = { v, menge, ort, weg: false };
            const zeile = el('li', { class: 'einkauf-zutat' }, [
                el('div', { class: 'einkauf-text' }, [
                    el('label', { text: 'Wo', attrs: { for: id + '-ort' } }), ort.box,
                    el('label', { text: 'Menge' + (einheit.feld.value.trim() ? ' (' + einheit.feld.value.trim() + ')' : ''), attrs: { for: id + '-menge' } }), menge.box
                ]),
                el('button', {
                    class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Ort entfernen' },
                    on: { click: () => { z.weg = true; zeile.remove(); } }
                })
            ]);
            vorratZeilen.push(z);
            vorratListe.append(zeile);
            if (!v) ort.feld.focus();
        }
        if (lm) vorratVon(lm.id).forEach((v) => vorratDazu(v));

        // Schickt geänderte, neue und entfernte Orte (eine Anfrage je Änderung). Liefert false bei Fehler.
        async function vorratSenden(lmId) {
            for (const z of vorratZeilen) {
                if (z.weg) {
                    if (!z.v) continue;
                    const a = await senden(status, knoepfe, 'vorrat_loeschen', { id: z.v.id });
                    if (!a) return false;
                    daten.vorrat = a.vorrat;
                    z.v = null;
                    continue;
                }
                const ort = z.ort.feld.value.trim();
                const menge = leseZahl(z.menge.feld.value);
                if (z.v && z.v.ort === ort && z.v.menge === menge) continue;
                const a = await senden(status, knoepfe, 'vorrat_speichern', { id: z.v ? z.v.id : '', lebensmittel_id: lmId, ort, menge });
                if (!a) return false;
                daten.vorrat = a.vorrat;
                // Merken, was jetzt gespeichert ist: ein zweiter Versuch schickt dann nur den Rest
                z.v = a.vorrat.find((x) => x.lebensmittel_id === lmId && norm(x.ort) === norm(ort)) || z.v;
            }
            return true;
        }

        const ok = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const loeschen = lm ? el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button' }, on: { click: () => entfernen() } }) : null;
        const knoepfe = [ok, loeschen].filter(Boolean);

        // akt: der gespeicherte Stand. Nach einem Fehler beim Vorrat ändert ein zweiter Versuch dieses Lebensmittel, statt es doppelt anzulegen.
        let akt = lm;
        async function absenden(ev) {
            ev.preventDefault();
            const werte = { name: nameFeld.value.trim(), abteilung: abteilung.feld.value.trim(), einheit: einheit.feld.value.trim(), notiz: notiz.value.trim() };
            for (const z of vorratZeilen) {
                if (z.weg) continue;
                const menge = leseZahl(z.menge.feld.value);
                if (!z.ort.feld.value.trim()) {
                    status.textContent = 'Bitte beim Vorrat einen Ort eintragen (oder den Ort mit × entfernen).';
                    z.ort.feld.focus();
                    return;
                }
                if (!(Number.isFinite(menge) && menge >= 0 && menge <= 9999 && Math.round(menge * 2) === menge * 2)) {
                    status.textContent = 'Menge zuhause bitte von 0 bis 9999 (halbe erlaubt).';
                    z.menge.feld.focus();
                    return;
                }
            }
            if (!werte.name) {
                status.textContent = 'Bitte einen Namen eingeben.';
                nameFeld.focus();
                return;
            }
            const doppelt = alle.find((l) => (!akt || l.id !== akt.id) && norm(l.name) === norm(werte.name));
            if (doppelt) {
                status.textContent = '„' + doppelt.name + '“ gibt es schon.';
                nameFeld.focus();
                return;
            }
            const antwort = await senden(status, knoepfe, 'lebensmittel_speichern', akt ? { ...werte, id: akt.id, geaendert_am: akt.geaendert_am } : werte);
            if (!antwort) return;
            const neu = antwort.lebensmittel;
            akt = neu;
            const i = daten.lebensmittel.findIndex((l) => l.id === neu.id);
            if (i >= 0) daten.lebensmittel[i] = neu; else daten.lebensmittel.push(neu);
            const vorratOk = await vorratSenden(neu.id);
            zeigeAlles();
            if (!vorratOk) {
                // Lebensmittel ist gespeichert, der Vorrat nicht ganz: Fenster bleibt offen mit Meldung
                status.textContent = 'Lebensmittel gespeichert, Vorrat NICHT ganz: ' + status.textContent.replace(/^NICHT gespeichert: /, '');
                return;
            }
            // Neu angelegt: gleich angekreuzt, damit es mit „Auf die Einkaufsliste“ mitkommt
            if (!lm) auswahl.add(neu.id);
            zeigeAlles();
            dialog.close();
            zeigeGespeichert(lm ? 'Geändert' : 'Gespeichert', neu.name);
        }

        async function entfernen() {
            const frage = '„' + lm.name + '“ löschen? Es verschwindet auch von der Einkaufsliste.';
            if (!confirm(frage)) return;
            const antwort = await senden(status, knoepfe, 'lebensmittel_loeschen', { id: lm.id, geaendert_am: lm.geaendert_am });
            if (!antwort) return;
            daten.lebensmittel = daten.lebensmittel.filter((l) => l.id !== lm.id);
            auswahl.delete(lm.id);
            daten.liste = daten.liste.filter((e) => e.lebensmittel_id !== lm.id);
            daten.vorrat = daten.vorrat.filter((v) => v.lebensmittel_id !== lm.id);
            merkeListe();
            dialog.close();
            zeigeGespeichert('Gelöscht', lm.name);
            zeigeAlles();
        }

        oeffneDialog(lm ? 'Lebensmittel ändern' : 'Neues Lebensmittel', [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden } }, [
                el('label', { text: 'Name', attrs: { for: 'einkauf-lm-name' } }), nameFeld,
                el('label', { text: 'Abteilung im Laden', attrs: { for: 'einkauf-lm-abteilung' } }), abteilung.box,
                el('label', { text: 'Einheit', attrs: { for: 'einkauf-lm-einheit' } }), einheit.box,
                el('label', { text: 'Notiz', attrs: { for: 'einkauf-lm-notiz' } }), notiz,
                el('h3', { text: 'Zuhause (freiwillig)' }),
                el('p', { class: 'leise besitz-hinweis', text: 'Wie viel davon zuhause ist und wo. Ohne Ort wird der Vorrat nicht gepflegt.' }),
                vorratListe,
                el('button', { class: 'knopf knopf-zweit', text: '+ Ort', attrs: { type: 'button' }, on: { click: () => vorratDazu() } }),
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        if (!lm && name) abteilung.feld.focus(); else nameFeld.focus();
    }

    // --- Einkaufsliste nach Abteilung ---
    // Je Lebensmittel eine Zeile; die Einträge für verschiedene Gerichte werden zusammengezählt.
    function zeigeListe() {
        leeren(listeBox);
        if (!daten) return;
        if (!daten.liste.length) {
            listeBox.append(el('p', { class: 'leise einkauf-leer', text: 'Die Einkaufsliste ist leer. Unter „Lebensmittel“ etwas ankreuzen.' }));
            return;
        }
        // „Einkauf fertig“: alle abgehakten Einträge senden, danach verschwinden sie
        const abgehakt = haken();
        if (abgehakt.length) {
            const zahl = new Set(daten.liste.filter((e) => abgehakt.includes(e.id)).map((e) => e.lebensmittel_id)).size;
            listeBox.append(el('button', {
                class: 'knopf knopf-bereich einkauf-fertig', text: '✓ Einkauf fertig (' + zahl + ' abgehakt)',
                attrs: { type: 'button' }, on: { click: () => einkaufFertig() }
            }));
        }
        const ansichten = [['abteilung', 'Nach Abteilung'], ['gericht', 'Nach Gericht']].map(([id, text]) => el('button', {
            class: 'ansicht', text,
            attrs: { type: 'button', 'aria-pressed': listeAnsicht === id ? 'true' : 'false' },
            on: { click: () => { listeAnsicht = id; zeigeListe(); } }
        }));
        listeBox.append(el('div', { class: 'ansichten einkauf-ansichten', attrs: { role: 'group', 'aria-label': 'Einkaufsliste ordnen' } }, ansichten));
        if (listeAnsicht === 'gericht') {
            zeigeNachGericht();
            return;
        }
        const jeLm = new Map();
        daten.liste.forEach((e) => {
            if (!jeLm.has(e.lebensmittel_id)) jeLm.set(e.lebensmittel_id, []);
            jeLm.get(e.lebensmittel_id).push(e);
        });
        const abteilungen = new Map();
        jeLm.forEach((eintraege, id) => {
            const lm = lmVon(id);
            if (!lm) return; // gelöscht oder noch nicht geladen
            const abt = lm.abteilung || '';
            if (!abteilungen.has(abt)) abteilungen.set(abt, []);
            abteilungen.get(abt).push({ lm, eintraege });
        });
        // Abteilungen A–Z, ohne Abteilung zuletzt
        const reihe = [...abteilungen.keys()].sort((a, b) => (!a) - (!b) || vergleiche(a, b));
        reihe.forEach((abt) => {
            const posten = abteilungen.get(abt).sort((a, b) => vergleiche(a.lm.name, b.lm.name));
            listeBox.append(el('section', { class: 'besitz-gruppe' }, [
                el('h2', { class: 'besitz-ort' }, [
                    el('span', { text: abt || 'Ohne Abteilung' }),
                    el('span', { class: 'besitz-zahl', text: String(posten.length) })
                ]),
                el('ul', { class: 'einkauf-liste' }, posten.map(listenZeile))
            ]));
        });
    }

    // Je Gericht eine Gruppe mit seinen Zutaten, dazu „Einzeln“ für alles ohne (oder mit gelöschtem) Gericht.
    // Abhaken hier hakt nur die Zutat dieses Gerichts ab.
    function zeigeNachGericht() {
        const gruppen = new Map();
        daten.liste.forEach((e) => {
            const g = gerichtVon(e.gericht_id);
            const k = g ? g.id : '';
            if (!gruppen.has(k)) gruppen.set(k, { g, eintraege: [] });
            gruppen.get(k).eintraege.push(e);
        });
        const reihe = [...gruppen.values()].sort((a, b) => (!a.g) - (!b.g) || vergleiche(a.g ? a.g.name : '', b.g ? b.g.name : ''));
        reihe.forEach(({ g, eintraege }) => {
            const posten = eintraege.map((e) => ({ lm: lmVon(e.lebensmittel_id), eintraege: [e] }))
                .filter((x) => x.lm).sort((a, b) => vergleiche(a.lm.name, b.lm.name));
            if (!posten.length) return;
            const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
            const weg = g ? el('button', {
                class: 'knopf knopf-zweit einkauf-gericht-weg', text: 'Gericht von der Liste nehmen',
                attrs: { type: 'button' }, on: { click: () => gerichtVonListe(g, eintraege, weg, status) }
            }) : null;
            listeBox.append(el('section', { class: 'besitz-gruppe' }, [
                el('h2', { class: 'besitz-ort' }, [
                    el('span', { text: g ? g.name : 'Einzeln' }),
                    el('span', { class: 'besitz-zahl', text: String(posten.length) })
                ]),
                el('ul', { class: 'einkauf-liste' }, posten.map((x) => listenZeile(x, true))),
                weg,
                g ? status : null
            ]));
        });
    }

    // Nimmt alle noch offenen Zutaten eines Gerichts von der Liste (eine Anfrage je Eintrag)
    async function gerichtVonListe(g, eintraege, knopf, status) {
        if (!confirm('Alle Zutaten für „' + g.name + '“ von der Einkaufsliste nehmen?')) return;
        for (const e of eintraege) {
            const antwort = await senden(status, [knopf], 'liste_aendern', { id: e.id, entfernen: true });
            if (!antwort) return;
            setzeListe(antwort.liste);
        }
        zeigeGespeichert('Entfernt', g.name);
        zeigeAlles();
    }

    // Abhaken geht auch ohne Netz: nur im Gerät, nochmal tippen löst den Haken wieder
    // ohneFuer = in der Ansicht nach Gericht steht das Gericht schon als Überschrift
    function listenZeile({ lm, eintraege }, ohneFuer = false) {
        const summe = eintraege.reduce((n, e) => n + e.anzahl, 0);
        const fuer = ohneFuer ? [] : eintraege.map((e) => gerichtVon(e.gericht_id)).filter(Boolean).map((g) => g.name);
        const notizen = eintraege.map((e) => e.notiz).filter(Boolean);
        const ids = eintraege.map((e) => e.id);
        const an = ids.every((id) => haken().includes(id));
        const knopf = el('button', {
            class: 'einkauf-haken' + (an ? ' ist-an' : ''), text: '',
            attrs: { type: 'button', 'aria-pressed': an ? 'true' : 'false', 'aria-label': lm.name + ' abhaken' },
            on: {
                click: () => {
                    const rest = haken().filter((id) => !ids.includes(id));
                    schreiben('einkauf_haken', an ? rest : [...rest, ...ids]);
                    zeigeListe();
                }
            }
        });
        return el('li', { class: 'einkauf-zeile' + (an ? ' einkauf-abgehakt' : '') }, [
            knopf,
            el('div', { class: 'einkauf-text' }, [
                el('div', { class: 'einkauf-kopfzeile' }, [
                    el('button', {
                        class: 'besitz-oeffnen', text: lm.name,
                        attrs: { type: 'button', 'aria-label': lm.name + ' ändern' },
                        on: { click: () => zeigeEintrag(lm, eintraege) }
                    }),
                    el('span', { class: 'einkauf-menge', text: mitEinheit(summe, lm) })
                ]),
                notizen.length ? el('span', { class: 'leise einkauf-klein', text: notizen.join(' · ') }) : null,
                fuer.length ? el('span', { class: 'leise einkauf-klein', text: 'für ' + fuer.join(', ') }) : null,
                zuhauseText(lm.id) ? el('span', { class: 'leise einkauf-klein', text: zuhauseText(lm.id) }) : null
            ])
        ]);
    }

    // Abgehakte Einträge gehen ans Skript (ohne Netz später) und verschwinden von der Liste
    function einkaufFertig() {
        const ids = haken();
        if (!ids.length) return;
        schreiben('einkauf_offen', [...new Set([...offeneHaken(), ...ids])]);
        schreiben('einkauf_haken', []);
        daten.liste = daten.liste.filter((e) => !ids.includes(e.id));
        merkeListe();
        zeigeGespeichert('Einkauf fertig');
        zeigeAlles();
        sendeHaken();
    }

    // Einträge eines Lebensmittels ändern oder entfernen (je Gericht ein Block, sonst einer)
    function zeigeEintrag(lm, eintraege) {
        const bloecke = eintraege.map((e, i) => {
            const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
            const anzahl = anzahlFeld('einkauf-e-anzahl-' + i, e.anzahl);
            const notiz = el('input', { attrs: { id: 'einkauf-e-notiz-' + i, type: 'text', maxlength: 100, autocomplete: 'off', value: e.notiz } });
            const ok = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
            const weg = el('button', { class: 'knopf knopf-zweit', text: 'Von der Liste nehmen', attrs: { type: 'button' }, on: { click: () => schicke(true) } });
            async function schicke(entfernen) {
                const n = leseZahl(anzahl.feld.value);
                if (!entfernen && !gueltigeAnzahl(n)) {
                    status.textContent = 'Anzahl bitte von 0,5 bis 9999 (halbe erlaubt).';
                    anzahl.feld.focus();
                    return;
                }
                const antwort = await senden(status, [ok, weg], 'liste_aendern',
                    entfernen ? { id: e.id, entfernen: true } : { id: e.id, anzahl: n, notiz: notiz.value.trim() });
                if (!antwort) return;
                setzeListe(antwort.liste);
                dialog.close();
                zeigeGespeichert(entfernen ? 'Entfernt' : 'Geändert', lm.name);
                zeigeAlles();
            }
            const g = gerichtVon(e.gericht_id);
            return el('form', { class: 'formular einkauf-block', attrs: { novalidate: true }, on: { submit: (ev) => { ev.preventDefault(); schicke(false); } } }, [
                eintraege.length > 1 ? el('h3', { text: g ? 'für ' + g.name : 'Einzeln' }) : null,
                el('label', { text: 'Anzahl' + (lm.einheit ? ' (' + lm.einheit + ')' : ''), attrs: { for: 'einkauf-e-anzahl-' + i } }), anzahl.box,
                el('label', { text: 'Notiz', attrs: { for: 'einkauf-e-notiz-' + i } }), notiz,
                el('div', { class: 'besitz-form-knoepfe' }, [ok, weg]),
                status
            ]);
        });
        oeffneDialog(lm.name, bloecke);
    }

    // --- Lebensmittel mit Suche ---
    const suche = el('input', {
        attrs: { id: 'einkauf-suche', type: 'search', autocomplete: 'off', placeholder: 'Lebensmittel suchen' },
        on: { input: () => zeigeLebensmittel() }
    });
    const lmTreffer = el('div');
    const neuLm = el('button', { class: 'knopf knopf-zweit', text: '+ Neues Lebensmittel', attrs: { type: 'button' }, on: { click: () => zeigeLebensmittelForm(null) } });
    const aufListeKnopf = el('button', { class: 'knopf knopf-bereich', attrs: { type: 'button' }, on: { click: () => zeigeAuswahlFenster() } });
    const aufheben = el('button', { class: 'knopf knopf-zweit', text: 'Auswahl aufheben', attrs: { type: 'button' }, on: { click: () => { auswahl.clear(); zeigeLebensmittel(); } } });
    const nurZuhause = el('input', { attrs: { id: 'einkauf-nur-zuhause', type: 'checkbox' }, on: { change: () => zeigeLebensmittel() } });
    lmBox.append(
        el('div', { class: 'einkauf-auswahl-leiste' }, [aufListeKnopf, aufheben]),
        el('div', { class: 'formular besitz-suche' }, [
            el('label', { text: 'Suchen', attrs: { for: 'einkauf-suche' } }), suche,
            el('label', { class: 'besitz-null' }, [nurZuhause, el('span', { text: 'Nur was zuhause ist (nach Ort)' })])
        ]),
        lmTreffer,
        neuLm
    );

    function zeigeLebensmittel() {
        leeren(lmTreffer);
        // Gelöschte Lebensmittel fallen aus der Auswahl
        if (daten) [...auswahl].forEach((id) => { if (!lmVon(id)) auswahl.delete(id); });
        aufListeKnopf.textContent = 'Auf die Einkaufsliste' + (auswahl.size ? ' (' + auswahl.size + ')' : '');
        aufListeKnopf.disabled = !auswahl.size;
        aufheben.hidden = !auswahl.size;
        if (!daten) return;
        const wort = suche.value.trim();
        const treffer = daten.lebensmittel
            .filter((l) => !wort || [l.name, l.abteilung, l.notiz].some((t) => findet(t, wort)))
            .filter((l) => !nurZuhause.checked || zuhause(l.id) > 0)
            .sort((a, b) => vergleiche(a.name, b.name));
        if (!daten.lebensmittel.length && !wort) {
            lmTreffer.append(el('p', { class: 'leise', text: 'Noch keine Lebensmittel. Tippe oben einen Namen ein oder auf „+ Neues Lebensmittel“.' }));
        } else if (!wort) {
            lmTreffer.append(el('p', { class: 'leise besitz-hinweis einkauf-tipp', text: 'Ankreuzen, dann oben „Auf die Einkaufsliste“. Tipp auf den Namen zum Ändern.' }));
        }
        if (treffer.length && nurZuhause.checked) {
            // Nach Ort gruppiert: so dient die Liste auch als Vorrat-Übersicht
            const orte = new Map();
            treffer.forEach((l) => vorratVon(l.id).filter((v) => v.menge > 0).forEach((v) => {
                if (!orte.has(v.ort)) orte.set(v.ort, []);
                orte.get(v.ort).push(l);
            }));
            [...orte.keys()].sort(vergleiche).forEach((o) => lmTreffer.append(el('section', { class: 'besitz-gruppe' }, [
                el('h2', { class: 'besitz-ort' }, [el('span', { text: o }), el('span', { class: 'besitz-zahl', text: String(orte.get(o).length) })]),
                el('ul', { class: 'einkauf-liste' }, orte.get(o).map(lmZeile))
            ])));
        } else if (treffer.length) {
            lmTreffer.append(el('ul', { class: 'einkauf-liste' }, treffer.map(lmZeile)));
        } else if (nurZuhause.checked && !wort) {
            lmTreffer.append(el('p', { class: 'leise', text: 'Zuhause ist nichts eingetragen. Den Vorrat trägst du beim Lebensmittel ein (Tipp auf den Namen).' }));
        }
        // Nichts genau so gefunden: neu anlegen mit dem Suchtext als Name
        const text = suche.value.trim();
        if (text && !daten.lebensmittel.some((l) => norm(l.name) === norm(text))) {
            if (!treffer.length) lmTreffer.append(el('p', { class: 'leise', text: 'Nichts gefunden.' }));
            lmTreffer.append(el('button', {
                class: 'knopf knopf-bereich einkauf-neu-aus-suche', text: '„' + text.slice(0, 60) + '“ neu anlegen',
                attrs: { type: 'button' }, on: { click: () => zeigeLebensmittelForm(null, text.slice(0, 60)) }
            }));
        }
    }

    function lmZeile(l) {
        const zahl = aufListe(l.id);
        const zusatz = [l.abteilung, zahl ? 'auf der Liste: ' + mitEinheit(zahl, l) : '', zuhauseText(l.id)].filter(Boolean).join(' · ');
        const an = auswahl.has(l.id);
        return el('li', { class: 'einkauf-zeile einkauf-lm' }, [
            el('button', {
                class: 'einkauf-haken' + (an ? ' ist-an' : ''), text: '',
                attrs: { type: 'button', 'aria-pressed': an ? 'true' : 'false', 'aria-label': l.name + ' auswählen' },
                on: { click: () => { if (an) auswahl.delete(l.id); else auswahl.add(l.id); zeigeLebensmittel(); } }
            }),
            el('button', {
                class: 'einkauf-lm-wahl',
                attrs: { type: 'button', 'aria-label': l.name + ' ändern' },
                on: { click: () => zeigeLebensmittelForm(l) }
            }, [
                el('span', { class: 'einkauf-lm-name', text: l.name }),
                zusatz ? el('span', { class: 'leise einkauf-klein', text: zusatz }) : null
            ])
        ]);
    }

    // --- Gerichte (4.3) ---
    const gerichtSuche = el('input', {
        attrs: { id: 'einkauf-gericht-suche', type: 'search', autocomplete: 'off', placeholder: 'Gericht suchen' },
        on: { input: () => zeigeGerichte() }
    });
    const gerichtTreffer = el('div');
    gerichteBox.append(
        el('div', { class: 'einkauf-auswahl-leiste' }, [
            el('button', { class: 'knopf knopf-bereich', text: '+ Neues Gericht', attrs: { type: 'button' }, on: { click: () => zeigeGerichtForm(null) } })
        ]),
        el('div', { class: 'formular besitz-suche' }, [el('label', { text: 'Suchen', attrs: { for: 'einkauf-gericht-suche' } }), gerichtSuche]),
        gerichtTreffer
    );

    function zeigeGerichte() {
        leeren(gerichtTreffer);
        if (!daten) return;
        const wort = gerichtSuche.value.trim();
        const liste = daten.gerichte
            .filter((g) => !wort || [g.name, g.notiz].some((t) => findet(t, wort))
                || g.zutaten.some((z) => { const l = lmVon(z.lebensmittel_id); return l && findet(l.name, wort); }))
            .sort((a, b) => vergleiche(a.name, b.name));
        if (!daten.gerichte.length) {
            gerichtTreffer.append(el('p', { class: 'leise', text: 'Noch keine Gerichte. Tippe auf „+ Neues Gericht“.' }));
            return;
        }
        if (!liste.length) {
            gerichtTreffer.append(el('p', { class: 'leise', text: 'Nichts gefunden.' }));
            return;
        }
        gerichtTreffer.append(el('ul', { class: 'einkauf-liste' }, liste.map((g) => {
            const zahl = g.zutaten.filter((z) => lmVon(z.lebensmittel_id)).length;
            return el('li', { class: 'einkauf-zeile einkauf-lm' }, [
                el('button', {
                    class: 'einkauf-lm-wahl', attrs: { type: 'button', 'aria-label': g.name + ' ansehen' },
                    on: { click: () => zeigeGericht(g) }
                }, [
                    el('span', { class: 'einkauf-lm-name', text: g.name }),
                    el('span', { class: 'leise einkauf-klein', text: zahl === 1 ? '1 Zutat' : zahl + ' Zutaten' })
                ])
            ]);
        })));
    }

    // Ein Gericht ansehen: alle Zutaten angehakt vorgeschlagen, Menge änderbar → „Auf die Liste“ (für dieses Gericht)
    function zeigeGericht(g) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const zeilen = g.zutaten.map((z) => ({ z, lm: lmVon(z.lebensmittel_id) })).filter((x) => x.lm)
            .sort((a, b) => vergleiche(a.lm.name, b.lm.name))
            .map(({ z, lm }, i) => {
                // Zuhause genug da (nur wenn der Vorrat gepflegt ist): nicht angehakt vorgeschlagen
                let an = !(vorratVon(lm.id).length && zuhause(lm.id) >= z.menge);
                const anzahl = anzahlFeld('einkauf-g-' + i, z.menge);
                const knopf = el('button', {
                    class: 'einkauf-haken' + (an ? ' ist-an' : ''), text: '',
                    attrs: { type: 'button', 'aria-pressed': an ? 'true' : 'false', 'aria-label': lm.name + ' mitnehmen' },
                    on: {
                        click: () => {
                            an = !an;
                            knopf.classList.toggle('ist-an', an);
                            knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
                        }
                    }
                });
                const schon = aufListe(lm.id);
                return {
                    lm, anzahl, an: () => an,
                    zeile: el('li', { class: 'einkauf-zutat' }, [
                        knopf,
                        el('div', { class: 'einkauf-text' }, [
                            el('label', { class: 'einkauf-lm-name', text: lm.name + (lm.einheit ? ' (' + lm.einheit + ')' : ''), attrs: { for: 'einkauf-g-' + i } }),
                            schon ? el('span', { class: 'leise einkauf-klein', text: 'auf der Liste: ' + mitEinheit(schon, lm) }) : null,
                            zuhauseText(lm.id) ? el('span', { class: 'leise einkauf-klein', text: zuhauseText(lm.id) }) : null,
                            anzahl.box
                        ])
                    ])
                };
            });
        const ok = el('button', { class: 'knopf knopf-bereich', text: 'Auf die Liste', attrs: { type: 'submit' } });
        const bearbeiten = el('button', { class: 'knopf knopf-zweit', text: 'Bearbeiten', attrs: { type: 'button' }, on: { click: () => zeigeGerichtForm(g) } });
        async function absenden(ev) {
            ev.preventDefault();
            const eintraege = [];
            for (const x of zeilen) {
                if (!x.an()) continue;
                const n = leseZahl(x.anzahl.feld.value);
                if (!gueltigeAnzahl(n)) {
                    status.textContent = x.lm.name + ': Menge bitte von 0,5 bis 9999 (halbe erlaubt).';
                    x.anzahl.feld.focus();
                    return;
                }
                eintraege.push({ lebensmittel_id: x.lm.id, anzahl: n, gericht_id: g.id });
            }
            if (!eintraege.length) {
                status.textContent = 'Keine Zutat angehakt.';
                return;
            }
            const antwort = await senden(status, [ok, bearbeiten], 'auf_liste', { eintraege });
            if (!antwort) return;
            setzeListe(antwort.liste);
            dialog.close();
            zeigeGespeichert('Auf der Liste', g.name);
            zeigeAlles();
        }
        const link = sichereUrl(g.link);
        oeffneDialog(g.name, [
            g.notiz ? el('p', { class: 'einkauf-notiz', text: g.notiz }) : null,
            link ? el('p', {}, [el('a', { text: 'Rezept öffnen', attrs: { href: link, target: '_blank', rel: 'noopener noreferrer' } })]) : null,
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden } }, [
                zeilen.length ? el('ul', { class: 'einkauf-liste' }, zeilen.map((x) => x.zeile))
                    : el('p', { class: 'leise', text: 'Noch keine Zutaten. Tippe auf „Bearbeiten“.' }),
                el('div', { class: 'besitz-form-knoepfe' }, [zeilen.length ? ok : null, bearbeiten].filter(Boolean)),
                status
            ])
        ]);
    }

    // Gericht anlegen oder ändern: Name, Notiz, Link und Zutaten (Suche in den Lebensmitteln, neue gleich anlegen)
    function zeigeGerichtForm(g) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const name = el('input', { attrs: { id: 'einkauf-gf-name', type: 'text', maxlength: 60, autocomplete: 'off', value: g ? g.name : '' } });
        const notiz = el('textarea', { attrs: { id: 'einkauf-gf-notiz', maxlength: 300, rows: 2, placeholder: 'freiwillig, zum Beispiel kurze Anleitung' } });
        notiz.value = g ? g.notiz : '';
        const link = el('input', { attrs: { id: 'einkauf-gf-link', type: 'url', inputmode: 'url', maxlength: 300, autocomplete: 'off', placeholder: 'freiwillig, https://…', value: g ? g.link : '' } });
        // Zutaten: lebensmittel_id → Feld für die Menge
        const zutaten = new Map();
        const zutatenListe = el('ul', { class: 'einkauf-liste' });
        let nr = 0;
        function zutatDazu(lm, menge = 1) {
            if (zutaten.has(lm.id)) return;
            const id = 'einkauf-gf-z' + (nr++);
            const anzahl = anzahlFeld(id, menge);
            const zeile = el('li', { class: 'einkauf-zutat' }, [
                el('div', { class: 'einkauf-text' }, [
                    el('label', { class: 'einkauf-lm-name', text: lm.name + (lm.einheit ? ' (' + lm.einheit + ')' : ''), attrs: { for: id } }),
                    anzahl.box
                ]),
                el('button', {
                    class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': lm.name + ' entfernen' },
                    on: { click: () => { zutaten.delete(lm.id); zeile.remove(); } }
                })
            ]);
            zutaten.set(lm.id, anzahl);
            zutatenListe.append(zeile);
        }
        if (g) g.zutaten.forEach((z) => { const l = lmVon(z.lebensmittel_id); if (l) zutatDazu(l, z.menge); });

        const zSuche = el('input', { attrs: { id: 'einkauf-gf-suche', type: 'search', autocomplete: 'off', placeholder: 'Lebensmittel suchen' }, on: { input: () => zeigeVorschlaege() } });
        const vorschlaege = el('div', { class: 'einkauf-vorschlaege' });
        function zeigeVorschlaege() {
            leeren(vorschlaege);
            const wort = zSuche.value.trim();
            if (!wort) return;
            daten.lebensmittel.filter((l) => !zutaten.has(l.id) && findet(l.name, wort))
                .sort((a, b) => vergleiche(a.name, b.name)).slice(0, 8)
                .forEach((l) => vorschlaege.append(el('button', {
                    class: 'knopf knopf-zweit', text: '+ ' + l.name, attrs: { type: 'button' },
                    on: { click: () => { zutatDazu(l); zSuche.value = ''; zeigeVorschlaege(); zSuche.focus(); } }
                })));
            if (!daten.lebensmittel.some((l) => norm(l.name) === norm(wort))) {
                vorschlaege.append(el('button', {
                    class: 'knopf knopf-zweit', text: '„' + wort.slice(0, 60) + '“ neu anlegen', attrs: { type: 'button' },
                    on: { click: () => neuesLebensmittel(wort.slice(0, 60)) }
                }));
            }
        }
        // Neues Lebensmittel nur mit Namen; Abteilung und Einheit später unter „Lebensmittel“
        async function neuesLebensmittel(text) {
            const antwort = await senden(status, knoepfe, 'lebensmittel_speichern', { name: text, abteilung: '', einheit: '', notiz: '' });
            if (!antwort) return;
            daten.lebensmittel.push(antwort.lebensmittel);
            zutatDazu(antwort.lebensmittel);
            zSuche.value = '';
            zeigeVorschlaege();
            zeigeLebensmittel();
        }

        const ok = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const loeschen = g ? el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button' }, on: { click: () => entfernen() } }) : null;
        const knoepfe = [ok, loeschen].filter(Boolean);

        async function absenden(ev) {
            ev.preventDefault();
            const werte = { name: name.value.trim(), notiz: notiz.value.trim(), link: link.value.trim(), zutaten: [] };
            if (!werte.name) {
                status.textContent = 'Bitte einen Namen eingeben.';
                name.focus();
                return;
            }
            if (werte.link && !/^https:\/\//i.test(werte.link)) {
                status.textContent = 'Der Link muss mit https:// beginnen.';
                link.focus();
                return;
            }
            for (const [id, anzahl] of zutaten) {
                const n = leseZahl(anzahl.feld.value);
                if (!gueltigeAnzahl(n)) {
                    status.textContent = 'Menge bitte von 0,5 bis 9999 (halbe erlaubt).';
                    anzahl.feld.focus();
                    return;
                }
                werte.zutaten.push({ lebensmittel_id: id, menge: n });
            }
            const antwort = await senden(status, knoepfe, 'gericht_speichern', g ? { ...werte, id: g.id, geaendert_am: g.geaendert_am } : werte);
            if (!antwort) return;
            const neu = antwort.gericht;
            const i = daten.gerichte.findIndex((x) => x.id === neu.id);
            if (i >= 0) daten.gerichte[i] = neu; else daten.gerichte.push(neu);
            zeigeAlles();
            zeigeGericht(neu);
            zeigeGespeichert(g ? 'Geändert' : 'Gespeichert', neu.name);
        }

        // Löschen ist weich. Lebensmittel bleiben; Einträge auf der Liste stehen danach unter „Einzeln“.
        async function entfernen() {
            if (!confirm('„' + g.name + '“ löschen? Die Lebensmittel bleiben erhalten.')) return;
            const antwort = await senden(status, knoepfe, 'gericht_loeschen', { id: g.id, geaendert_am: g.geaendert_am });
            if (!antwort) return;
            daten.gerichte = daten.gerichte.filter((x) => x.id !== g.id);
            merkeListe();
            dialog.close();
            zeigeGespeichert('Gelöscht', g.name);
            zeigeAlles();
        }

        oeffneDialog(g ? 'Gericht ändern' : 'Neues Gericht', [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden } }, [
                el('label', { text: 'Name', attrs: { for: 'einkauf-gf-name' } }), name,
                el('label', { text: 'Notiz', attrs: { for: 'einkauf-gf-notiz' } }), notiz,
                el('label', { text: 'Link zum Rezept', attrs: { for: 'einkauf-gf-link' } }), link,
                el('h3', { text: 'Zutaten' }),
                zutatenListe,
                el('label', { text: 'Zutat hinzufügen', attrs: { for: 'einkauf-gf-suche' } }), zSuche,
                vorschlaege,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        name.focus();
    }

    // --- Unterreiter ---
    const teile = [['liste', 'Einkaufsliste', listeBox], ['lebensmittel', 'Lebensmittel', lmBox], ['gerichte', 'Gerichte', gerichteBox]].map(([id, text, box]) => [
        id,
        el('button', { class: 'ansicht', text, attrs: { type: 'button', 'aria-controls': box.id }, on: { click: () => zeigeTeil(id) } }),
        box
    ]);

    function zeigeTeil(id) {
        teil = id;
        teile.forEach(([k, knopf, box]) => {
            knopf.setAttribute('aria-pressed', k === id ? 'true' : 'false');
            box.hidden = k !== id;
        });
        zeigeAlles();
    }

    function zeigeAlles() {
        zeigeListe();
        zeigeLebensmittel();
        zeigeGerichte();
    }

    // --- Wartende Haken senden (4.2) ---
    const hakenStatus = el('p', { class: 'meldung einkauf-warten', attrs: { role: 'status', 'aria-live': 'polite' } });
    let sendetHaken = false;
    function zeigeHakenStatus(fehler = '') {
        const n = offeneHaken().length;
        hakenStatus.textContent = n ? '„Einkauf fertig“ noch nicht gesendet (' + n + (n === 1 ? ' Eintrag' : ' Einträge') + ').' + (fehler ? ' ' + fehler : '') : '';
    }
    // Sendet, bis nichts mehr wartet. Ohne Netz bleiben die Haken im Gerät.
    async function sendeHaken() {
        zeigeHakenStatus();
        if (sendetHaken) return;
        sendetHaken = true;
        try {
            let ids = offeneHaken();
            while (ids.length) {
                // Höchstens 100 auf einmal (Grenze im Skript). Doppelt senden schadet nicht.
                const teil = ids.slice(0, 100);
                const antwort = await api('gemeinsam', 'abhaken', { ids: teil });
                schreiben('einkauf_offen', offeneHaken().filter((id) => !teil.includes(id)));
                if (daten) {
                    setzeListe(antwort.liste);
                    if (Array.isArray(antwort.vorrat)) daten.vorrat = antwort.vorrat;
                    zeigeAlles();
                }
                ids = offeneHaken();
            }
            zeigeHakenStatus();
        } catch (e) {
            zeigeHakenStatus(e.code === 'netz' ? 'Wird gesendet, sobald wieder Netz da ist.' : e.message);
        } finally {
            sendetHaken = false;
        }
    }

    // --- Laden: beim Öffnen, mit „Neu laden“, beim Zurückkehren in die App und wenn wieder Netz da ist ---
    const neuLaden = el('button', { class: 'knopf knopf-zweit besitz-neu', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => laden() } });
    let laedt = false;
    async function laden() {
        if (laedt || !container.isConnected) return;
        laedt = true;
        neuLaden.disabled = true;
        ladeStatus.textContent = daten ? 'Aktualisiere …' : 'Lädt …';
        try {
            await sendeHaken();
            const d = await api('gemeinsam', 'alles');
            daten = {
                lebensmittel: Array.isArray(d.lebensmittel) ? d.lebensmittel : [],
                liste: [],
                gerichte: Array.isArray(d.gerichte) ? d.gerichte : [],
                vorrat: Array.isArray(d.vorrat) ? d.vorrat : []
            };
            setzeListe(d.liste);
            ladeStatus.textContent = '';
            zeigeAlles();
        } catch (e) {
            // Ohne Netz: die Einkaufsliste aus dem Gerät zeigen
            const im = lesen('einkaufsliste', null);
            if (!daten && im && Array.isArray(im.liste)) {
                daten = { lebensmittel: im.lebensmittel || [], liste: [], gerichte: im.gerichte || [], vorrat: [] };
                const warten = new Set(offeneHaken());
                daten.liste = im.liste.filter((x) => !warten.has(x.id));
            }
            ladeStatus.textContent = (e.code === 'netz' && im ? 'Ohne Verbindung: Einkaufsliste von ' + uhrzeit(im.stand) + ' Uhr. Abhaken und „Einkauf fertig“ gehen, alles andere braucht Netz.'
                : 'Laden fehlgeschlagen: ' + e.message);
            zeigeAlles();
        } finally {
            laedt = false;
            neuLaden.disabled = false;
        }
    }
    neuLadenBeiRueckkehr = () => { if (!dialog.open && !sendet) laden(); };

    container.append(
        el('h1', { class: 'bereich-titel titel-mit-emoji' }, [
            el('span', { class: 'titel-emoji', text: '🛒', attrs: { 'aria-hidden': 'true' } }),
            el('span', { text: ctx.bereich.titel })
        ]),
        el('div', { class: 'ansichten' }, teile.map(([, knopf]) => knopf)),
        ladeStatus,
        hakenStatus,
        listeBox,
        lmBox,
        gerichteBox,
        neuLaden,
        dialog
    );
    zeigeTeil(teil);
    zeigeHakenStatus();
    laden();
}
