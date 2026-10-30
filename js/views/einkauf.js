// Reiter Einkauf: Einkaufsliste nach Abteilung und Lebensmittel mit Suche (Schritt 4.1).
// Lebensmittel antippen → Anzahl wählen → steht auf der Einkaufsliste. Abhaken lässt Einträge verschwinden.
// Daten aus dem Skript „gemeinsam“ (Sheet „Gemeinsam“). Person und Partner*in, beide nur mit Passwort.
// Ohne Netz (4.2, Ausnahme in docs/STAND.md 4): Die offene Einkaufsliste liegt zusätzlich im Gerät (thetadex_einkaufsliste).
// Abhaken geht immer; die Haken warten im Gerät (thetadex_einkauf_offen), bis das Skript sie bestätigt.
// Alles andere (Lebensmittel, Gerichte) hält die App nur im Arbeitsspeicher.

import { el, leeren } from '../ui/dom.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { api } from '../api.js';
import { lesen, schreiben } from '../store.js';
import { zeigeGespeichert } from '../ui/overlay.js';

// Zuletzt geladene Daten { lebensmittel, liste, gerichte, vorrat }, im Arbeitsspeicher
let daten = null;
// Abgehakte Einträge (ids), die das Skript noch nicht bestätigt hat. Liegen auch im Gerät.
const offeneHaken = () => lesen('einkauf_offen', []) || [];
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
// Neue Liste vom Skript: Einträge mit noch nicht gesendetem Haken bleiben ausgeblendet
function setzeListe(liste) {
    const warten = new Set(offeneHaken());
    daten.liste = (Array.isArray(liste) ? liste : []).filter((e) => !warten.has(e.id));
    merkeListe();
}
const uhrzeit = (ms) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
// Einkaufsliste oder Lebensmittel. Bleibt, solange die Seite offen ist.
let teil = 'liste';
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

// Feld für eine Anzahl mit − und +
function anzahlFeld(id, wert = 1) {
    const feld = el('input', { attrs: { id, type: 'text', inputmode: 'decimal', autocomplete: 'off', value: zahlText(wert) } });
    const schritt = (d) => {
        const n = leseZahl(feld.value);
        const neu = Number.isFinite(n) ? Math.max(0.5, Math.round((n + d) * 2) / 2) : 1;
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
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'einkauf-dialog-titel' } });
    dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
    let sendet = false; // gegen doppeltes Senden durch mehrfaches Tippen

    const lmVon = (id) => (daten ? daten.lebensmittel.find((l) => l.id === id) : null);
    const gerichtVon = (id) => (daten && id ? daten.gerichte.find((g) => g.id === id) : null);
    const aufListe = (id) => (daten ? daten.liste.filter((e) => e.lebensmittel_id === id).reduce((n, e) => n + e.anzahl, 0) : 0);

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

    // --- Auf die Liste setzen ---
    function zeigeAufListe(lm) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const anzahl = anzahlFeld('einkauf-auf-anzahl');
        const notiz = el('input', { attrs: { id: 'einkauf-auf-notiz', type: 'text', maxlength: 100, autocomplete: 'off', placeholder: 'freiwillig, zum Beispiel „die große“' } });
        const schon = aufListe(lm.id);
        const ok = el('button', { class: 'knopf knopf-bereich', text: 'Auf die Liste', attrs: { type: 'submit' } });
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        async function absenden(ev) {
            ev.preventDefault();
            const n = leseZahl(anzahl.feld.value);
            if (!gueltigeAnzahl(n)) {
                status.textContent = 'Anzahl bitte von 0,5 bis 9999 (halbe erlaubt).';
                anzahl.feld.focus();
                return;
            }
            const antwort = await senden(status, [ok, abbrechen], 'auf_liste', { eintraege: [{ lebensmittel_id: lm.id, anzahl: n, notiz: notiz.value.trim() }] });
            if (!antwort) return;
            setzeListe(antwort.liste);
            dialog.close();
            zeigeGespeichert('Auf der Liste', mitEinheit(n, lm) + ' ' + lm.name);
            zeigeAlles();
        }
        oeffneDialog(lm.name, [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden } }, [
                schon ? el('p', { class: 'leise besitz-hinweis', text: 'Schon auf der Liste: ' + mitEinheit(schon, lm) + '. Die Anzahl kommt dazu.' }) : null,
                el('label', { text: 'Anzahl' + (lm.einheit ? ' (' + lm.einheit + ')' : ''), attrs: { for: 'einkauf-auf-anzahl' } }), anzahl.box,
                el('label', { text: 'Notiz', attrs: { for: 'einkauf-auf-notiz' } }), notiz,
                el('div', { class: 'besitz-form-knoepfe' }, [ok, abbrechen]),
                status
            ])
        ]);
        anzahl.feld.focus();
        anzahl.feld.select();
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
        const ok = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const loeschen = lm ? el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button' }, on: { click: () => entfernen() } }) : null;
        const knoepfe = [ok, loeschen].filter(Boolean);

        async function absenden(ev) {
            ev.preventDefault();
            const werte = { name: nameFeld.value.trim(), abteilung: abteilung.feld.value.trim(), einheit: einheit.feld.value.trim(), notiz: notiz.value.trim() };
            if (!werte.name) {
                status.textContent = 'Bitte einen Namen eingeben.';
                nameFeld.focus();
                return;
            }
            const doppelt = alle.find((l) => (!lm || l.id !== lm.id) && norm(l.name) === norm(werte.name));
            if (doppelt) {
                status.textContent = '„' + doppelt.name + '“ gibt es schon.';
                nameFeld.focus();
                return;
            }
            const antwort = await senden(status, knoepfe, 'lebensmittel_speichern', lm ? { ...werte, id: lm.id, geaendert_am: lm.geaendert_am } : werte);
            if (!antwort) return;
            const neu = antwort.lebensmittel;
            const i = daten.lebensmittel.findIndex((l) => l.id === neu.id);
            if (i >= 0) daten.lebensmittel[i] = neu; else daten.lebensmittel.push(neu);
            zeigeAlles();
            // Aus der Suche neu angelegt: gleich auf die Liste setzen
            if (!lm && name) {
                zeigeAufListe(neu);
            } else {
                dialog.close();
                zeigeGespeichert(lm ? 'Geändert' : 'Gespeichert', neu.name);
            }
        }

        async function entfernen() {
            const frage = '„' + lm.name + '“ löschen? Es verschwindet auch von der Einkaufsliste.';
            if (!confirm(frage)) return;
            const antwort = await senden(status, knoepfe, 'lebensmittel_loeschen', { id: lm.id, geaendert_am: lm.geaendert_am });
            if (!antwort) return;
            daten.lebensmittel = daten.lebensmittel.filter((l) => l.id !== lm.id);
            daten.liste = daten.liste.filter((e) => e.lebensmittel_id !== lm.id);
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
            listeBox.append(el('p', { class: 'leise einkauf-leer', text: 'Die Einkaufsliste ist leer. Unter „Lebensmittel“ etwas antippen.' }));
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

    function listenZeile({ lm, eintraege }) {
        const summe = eintraege.reduce((n, e) => n + e.anzahl, 0);
        const fuer = eintraege.map((e) => gerichtVon(e.gericht_id)).filter(Boolean).map((g) => g.name);
        const notizen = eintraege.map((e) => e.notiz).filter(Boolean);
        const haken = el('button', {
            class: 'einkauf-haken', text: '',
            attrs: { type: 'button', 'aria-label': lm.name + ' abhaken' },
            on: { click: () => abhaken() }
        });
        // Abhaken geht auch ohne Netz: erst ins Gerät, Eintrag verschwindet sofort, dann senden
        function abhaken() {
            haken.classList.add('ist-an');
            const ids = eintraege.map((e) => e.id);
            schreiben('einkauf_offen', [...new Set([...offeneHaken(), ...ids])]);
            daten.liste = daten.liste.filter((e) => !ids.includes(e.id));
            merkeListe();
            setTimeout(zeigeAlles, 250); // kurz den Haken zeigen
            sendeHaken();
        }
        return el('li', { class: 'einkauf-zeile' }, [
            haken,
            el('div', { class: 'einkauf-text' }, [
                el('button', {
                    class: 'besitz-oeffnen', text: lm.name,
                    attrs: { type: 'button', 'aria-label': lm.name + ' ändern' },
                    on: { click: () => zeigeEintrag(lm, eintraege) }
                }),
                el('span', { class: 'einkauf-menge', text: mitEinheit(summe, lm) }),
                notizen.length ? el('span', { class: 'leise einkauf-klein', text: notizen.join(' · ') }) : null,
                fuer.length ? el('span', { class: 'leise einkauf-klein', text: 'für ' + fuer.join(', ') }) : null
            ])
        ]);
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
    lmBox.append(
        el('div', { class: 'formular besitz-suche' }, [el('label', { text: 'Suchen', attrs: { for: 'einkauf-suche' } }), suche]),
        lmTreffer,
        neuLm
    );

    function zeigeLebensmittel() {
        leeren(lmTreffer);
        if (!daten) return;
        const wort = suche.value.trim();
        const treffer = daten.lebensmittel
            .filter((l) => !wort || [l.name, l.abteilung, l.notiz].some((t) => findet(t, wort)))
            .sort((a, b) => vergleiche(a.name, b.name));
        if (!daten.lebensmittel.length && !wort) {
            lmTreffer.append(el('p', { class: 'leise', text: 'Noch keine Lebensmittel. Tippe oben einen Namen ein oder auf „+ Neues Lebensmittel“.' }));
        }
        if (treffer.length) {
            lmTreffer.append(el('ul', { class: 'einkauf-liste' }, treffer.map((l) => {
                const zahl = aufListe(l.id);
                const zusatz = [l.abteilung, zahl ? 'auf der Liste: ' + mitEinheit(zahl, l) : ''].filter(Boolean).join(' · ');
                return el('li', { class: 'einkauf-zeile einkauf-lm' }, [
                    el('button', {
                        class: 'einkauf-lm-wahl',
                        attrs: { type: 'button', 'aria-label': l.name + ' auf die Liste setzen' },
                        on: { click: () => zeigeAufListe(l) }
                    }, [
                        el('span', { class: 'einkauf-lm-name', text: l.name }),
                        zusatz ? el('span', { class: 'leise einkauf-klein', text: zusatz }) : null
                    ]),
                    el('button', {
                        class: 'einkauf-stift', text: '✎',
                        attrs: { type: 'button', 'aria-label': l.name + ' ändern' },
                        on: { click: () => zeigeLebensmittelForm(l) }
                    })
                ]);
            })));
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

    // --- Unterreiter ---
    const teile = [['liste', 'Einkaufsliste', listeBox], ['lebensmittel', 'Lebensmittel', lmBox]].map(([id, text, box]) => [
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
    }

    // --- Wartende Haken senden (4.2) ---
    const hakenStatus = el('p', { class: 'meldung einkauf-warten', attrs: { role: 'status', 'aria-live': 'polite' } });
    let sendetHaken = false;
    function zeigeHakenStatus(fehler = '') {
        const n = offeneHaken().length;
        hakenStatus.textContent = n ? (n === 1 ? '1 Haken' : n + ' Haken') + ' noch nicht gesendet.' + (fehler ? ' ' + fehler : '') : '';
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
            ladeStatus.textContent = (e.code === 'netz' && im ? 'Ohne Verbindung: Einkaufsliste von ' + uhrzeit(im.stand) + ' Uhr. Abhaken geht, alles andere braucht Netz.'
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
        neuLaden,
        dialog
    );
    zeigeTeil(teil);
    zeigeHakenStatus();
    laden();
}
