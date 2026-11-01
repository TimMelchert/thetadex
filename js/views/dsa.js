// Reiter Pen & Paper (DSA und DnD). 6.1: Bogen wählen und anlegen, Kopf, Eigenschaften und Zähler ansehen und ändern.
// 6.2: Listen (Vor- und Nachteile, Sonderfertigkeiten und Gaben, Talente nach Gruppe, Besitz nach Ort) anlegen, ändern, löschen.
// 6.3: Zauber (aufklappbar mit allen Feldern und Modifikationen) und Waffen (Tabelle, am Handy Karten).
// 6.4: Verlauf. Tipp auf einen Zähler oben: „+“ oder „−“, Betrag, Notiz. Liste der letzten Änderungen.
// 6.5: Knopf „🎲 Würfeln“ (js/ui/wuerfel.js) und Bild des Helden im Kopf (hochladen oder Drive-Link, Ordner „Thetadex DSA“).
// 6.6: Teilen. Knopf „🔗 Teilen“ je Bogen. Die Adresse #/bogen/<skript>/<schluessel> zeigt denselben Reiter ohne Passwort,
// nur lesen: ein Bogen mit den aktuellen Werten und Würfel, ohne Verlauf und ohne Knöpfe zum Ändern (Aktion „geteilt“).
// Daten aus dem Skript „dsa“ (eigenes Sheet „DSA“). Nur mit Passwort.
// Die Bögen liegen nur im Arbeitsspeicher, solange die Seite offen ist. Im Gerät steht nur, welcher Bogen gewählt war
// (thetadex_dsa_bogen). Siehe docs/STAND.md 4 „Pen & Paper, Sheet ‚DSA‘“.

import { el, leeren } from '../ui/dom.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { api, apiOeffentlich } from '../api.js';
import { lesen, schreiben } from '../store.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { verkleinereBild, bildAdresse } from '../ui/bild.js';
import { wuerfelKnopf } from '../ui/wuerfel.js';
import { abenteuerAnsicht, dmAnsicht } from './dsa-abenteuer.js';

// Zuletzt geladene Daten, nur im Arbeitsspeicher
let daten = null;
// Aufgeklappte Abschnitte. Bleibt, solange die Seite offen ist.
const offen = new Set(['kopf']);
// Für wen „daten“ gilt: 'eigen' (mit Passwort) oder der Schlüssel eines geteilten Bogens
let datenFuer = '';
// Ansicht (ab 0.6.8): 'bogen', 'abenteuer' oder 'dm'. Bleibt beim Wechsel erhalten; im geteilten Link nur bogen und abenteuer, ohne Speichern.
const MODI = [['bogen', 'Charakterbogen', 'Bogen'], ['abenteuer', 'Abenteuer', 'Abenteuer'], ['dm', 'DM', 'DM']];
let modusGeteilt = 'bogen';
// Kennung des Skripts und Schlüssel im geteilten Link
const KENNUNG = /^[A-Za-z0-9_-]{20,120}$/;
const SCHLUESSEL = /^[a-f0-9]{64}$/;
const ADRESSE = /^https:\/\/script\.google\.com\/macros\/s\/([A-Za-z0-9_-]+)\/exec$/;

// Schon geladene Bilder (Drive-Kennung → data:-Bild), nur im Arbeitsspeicher
const bilder = new Map();
async function holeBild(id) {
    if (bilder.has(id)) return bilder.get(id);
    const adresse = bildAdresse(await api('dsa', 'bild', { bild: id }));
    if (!adresse) throw new Error('Unbekannte Bildart.');
    bilder.set(id, adresse);
    return adresse;
}
// Verlauf: gewählter Zähler und ob alle Änderungen zu sehen sind
let verlaufFilter = '';
let verlaufAlle = false;

// Listen-Abschnitte (6.2, Zauber und Waffen 6.3). arten: [Schlüssel im Sheet, Überschrift, Name eines Eintrags].
// art: 'chips' = kurze Namen nebeneinander, 'gruppen' = Zeilen je Gruppe, 'orte' = Zeilen je Ort (Feld „ort“).
const LISTEN = [
    { key: 'vorteile', titel: 'Vor- und Nachteile', art: 'chips', wert: 'Stufe oder Wert (freiwillig)',
        arten: [['vorteil', 'Vorteile', 'Vorteil'], ['nachteil', 'Nachteile', 'Nachteil']] },
    { key: 'sf', titel: 'Sonderfertigkeiten und Gaben', art: 'chips', wert: 'Wert (freiwillig)',
        arten: [['sonderfertigkeit', 'Sonderfertigkeiten', 'Sonderfertigkeit'], ['gabe', 'Gaben', 'Gabe']] },
    { key: 'talente', titel: 'Talente', art: 'gruppen', wert: 'TaW', probe: 'zum Beispiel MU · GE · KK',
        arten: [['talent', 'Talente', 'Talent']], felder: [['be', 'BE (zum Beispiel BEx2)'], ['spez', 'Spezialisierung']] },
    { key: 'zauber', titel: 'Zauber', art: 'zauber', wert: 'ZfW', probe: 'zum Beispiel KL / IN / CH', text: 'Wirkung',
        arten: [['zauber', 'Zauber', 'Zauber']],
        felder: [['kosten', 'Kosten'], ['zauberdauer', 'Zauberdauer'], ['wirkungsdauer', 'Wirkungsdauer'], ['reichweite', 'Reichweite'],
            ['technik', 'Technik'], ['merkmale', 'Merkmale'], ['mods', 'Modifikationen (je Zeile eine)', 'liste'], ['haus', 'Hauszauber', 'haken']] },
    { key: 'waffen', titel: 'Waffen', art: 'waffen', wert: null,
        arten: [['waffe', 'Waffen', 'Waffe']],
        felder: [['art', 'Art (zum Beispiel Säbel, Bogen)'], ['tp', 'TP'], ['at', 'AT'], ['pa', 'PA'], ['ini', 'INI'], ['be', 'BE'], ['reichweite', 'Reichweite (Fernkampf)']] },
    { key: 'besitz', titel: 'Besitz', art: 'orte', wert: 'Anzahl (freiwillig)',
        arten: [['besitz', 'Besitz', 'Gegenstand']], felder: [['ort', 'Ort (zum Beispiel am Körper, Rucksack)'], ['gewicht', 'Gewicht']] }
];
// Spalten der Waffen-Tabelle: [Feld, Überschrift]
const WAFFEN_SPALTEN = [['tp', 'TP'], ['at', 'AT'], ['pa', 'PA'], ['ini', 'INI'], ['be', 'BE'], ['reichweite', 'RW']];
// Weitere Felder eines Zaubers in der Ansicht
const ZAUBER_FELDER = [['kosten', 'Kosten'], ['zauberdauer', 'Zauberdauer'], ['wirkungsdauer', 'Wirkungsdauer'], ['reichweite', 'Reichweite'], ['technik', 'Technik'], ['merkmale', 'Merkmale']];
// Feste Reihenfolge der Talent-Gruppen (aus dem Plan), eigene Gruppen danach nach dem Alphabet
const TALENT_GRUPPEN = ['Kampftechniken', 'Körperliche Talente', 'Gesellschaftliche Talente', 'Natur-Talente',
    'Wissenstalente', 'Handwerkliche Talente', 'Sprachen und Schriften'];

const vergleiche = (a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true });
// Erst nach „Reihenfolge“ (falls gesetzt), dann nach Name
const rang = (e) => (e.reihenfolge > 0 ? e.reihenfolge : 10000);
const sortiere = (liste) => [...liste].sort((a, b) => rang(a) - rang(b) || vergleiche(a.name, b.name));
// Gruppen in fester Reihenfolge, dann eigene nach dem Alphabet, leere Gruppe zuletzt
function gruppenFolge(namen, fest = []) {
    const da = [...new Set(namen)];
    return [...fest.filter((g) => da.includes(g)), ...da.filter((g) => g && !fest.includes(g)).sort(vergleiche), ...(da.includes('') ? [''] : [])];
}

// Felder des Kopfs: [Schlüssel, Anzeige]
const KOPF = [
    ['rasse', 'Rasse'], ['kultur', 'Kultur'], ['profession', 'Profession'], ['geschlecht', 'Geschlecht'],
    ['alter', 'Alter'], ['groesse', 'Größe'], ['gewicht', 'Gewicht'], ['haare', 'Haarfarbe'], ['augen', 'Augenfarbe'],
    ['stand', 'Stand'], ['titel', 'Titel'], ['sozialstatus', 'Sozialstatus'], ['herkunft', 'Herkunft'], ['gp_basis', 'GP-Basis']
];

// Vorlage für einen neuen Bogen (DnD ist wie DSA aufgebaut, Entscheidung der Person, 31.10.2026)
const VORLAGE_EIGENSCHAFTEN = [
    ['MU', 'Mut'], ['KL', 'Klugheit'], ['IN', 'Intuition'], ['CH', 'Charisma'],
    ['FF', 'Fingerfertigkeit'], ['GE', 'Gewandtheit'], ['KO', 'Konstitution'], ['KK', 'Körperkraft']
].map(([k, n]) => ({ k, n, w: '', g: 'e' })).concat([
    ['LeP', 'Lebensenergie'], ['AuP', 'Ausdauer'], ['AsP', 'Astralenergie'], ['MR', 'Magieresistenz'],
    ['INI', 'Initiative-Basis'], ['AT', 'Attacke-Basis'], ['PA', 'Parade-Basis'], ['FK', 'Fernkampf-Basis'], ['GS', 'Geschwindigkeit']
].map(([k, n]) => ({ k, n, w: '', g: 'b' })));
const VORLAGE_ZAEHLER = [
    { k: 'Geld', n: 'Geld', art: 'geld', start: 0, max: null },
    { k: 'LeP', n: 'Lebenspunkte', art: 'leben', start: 0, max: null },
    { k: 'AsP', n: 'Astralpunkte', art: 'leben', start: 0, max: null },
    { k: 'AP', n: 'Abenteuerpunkte', art: 'ap', start: 0, max: null }
];
const ARTEN = [['geld', 'Geld (in Kreuzern)'], ['leben', 'Punkte mit Höchstwert'], ['ap', 'AP (nur gesammelte zählen)'], ['zahl', 'Zahl']];

// Symbol je Zähler, sonst ein Punkt
function symbol(z) {
    if (z.art === 'geld') return '💰';
    if (z.art === 'ap') return '⭐';
    if (/^(lep|hp|le)$/i.test(z.k)) return '❤️';
    if (/^(asp|ae)$/i.test(z.k)) return '✨';
    return '•';
}

// Geld steht in Kreuzern: 1 Dukaten = 10 Silbertaler = 100 Heller = 1000 Kreuzer
function geldText(kreuzer) {
    const minus = kreuzer < 0;
    let rest = Math.abs(kreuzer);
    const teile = [];
    [[1000, 'D'], [100, 'S'], [10, 'H'], [1, 'K']].forEach(([wert, zeichen]) => {
        const n = Math.floor(rest / wert);
        rest -= n * wert;
        if (n) teile.push(n + ' ' + zeichen);
    });
    return (minus ? '− ' : '') + (teile.join(' ') || '0');
}

// Wie viele Änderungen der Verlauf zuerst zeigt
const VERLAUF_ANFANG = 30;
// Münzen: [Wert in Kreuzern, Kürzel, Name]
const MUENZEN = [[1000, 'D', 'Dukaten'], [100, 'S', 'Silbertaler'], [10, 'H', 'Heller'], [1, 'K', 'Kreuzer']];
const wertText = (z, n) => (z.art === 'geld' ? geldText(n) : String(n));
// „2026-10-31 14:05“ → „31.10.2026 14:05“
// (im laufenden Jahr ohne Jahreszahl: „31.10. 14:05“)
// mitJahr: immer mit Jahreszahl (Sessions)
function datumText(d, mitJahr = false) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(.*)$/.exec(String(d || ''));
    if (!m) return String(d || '');
    const jahr = !mitJahr && Number(m[1]) === new Date().getFullYear() ? '' : m[1];
    return m[3] + '.' + m[2] + '.' + jahr + m[4].replace('T', ' ').slice(0, 6);
}
// Text einer Änderung: AP mit „−“ heißt ausgegeben
const istAusgegeben = (z, a) => !!(z && z.art === 'ap' && a < 0);
function aenderungText(z, a) {
    const betrag = z && z.art === 'geld' ? geldText(Math.abs(a)) : String(Math.abs(a));
    return (a < 0 ? '− ' : '+ ') + betrag + (istAusgegeben(z, a) ? ' ausgegeben' : '');
}
// Summe aller Änderungen (für AP: was noch frei ist)
function summe(bogen, z) {
    return daten.verlauf.reduce((s, v) => (v.bogen_id === bogen.id && v.zaehler === z.k ? s + v.aenderung : s), Number(z.start) || 0);
}

// Geld als Münzen untereinander (Gold, Silber, Bronze, Eisen), nur Münzen mit Anzahl (Wunsch der Person, 31.10.2026)
function muenzen(kreuzer) {
    let rest = Math.abs(kreuzer);
    const zeilen = [];
    MUENZEN.forEach(([wert, kurz, name], i) => {
        const n = Math.floor(rest / wert);
        rest -= n * wert;
        if (n) zeilen.push(el('span', { class: 'dsa-muenze-zeile', attrs: { title: n + ' ' + name } }, [
            el('span', { class: 'dsa-muenze dsa-muenze-' + ['gold', 'silber', 'bronze', 'eisen'][i], text: kurz, attrs: { 'aria-hidden': 'true' } }),
            el('span', { text: (kreuzer < 0 ? '− ' : '') + n }),
            el('span', { class: 'dsa-muenze-name', text: ' ' + name })
        ]));
    });
    return el('span', { class: 'dsa-muenzen-stapel' }, zeilen.length ? zeilen : [el('span', { text: '0' })]);
}

// Aktueller Stand eines Zählers: Startwert plus Verlauf (AP: nur gesammelte), höchstens der Höchstwert
function stand(bogen, z) {
    let s = Number(z.start) || 0;
    daten.verlauf.forEach((v) => {
        if (v.bogen_id !== bogen.id || v.zaehler !== z.k) return;
        if (z.art === 'ap' && v.aenderung < 0) return;
        s += v.aenderung;
    });
    if (z.max != null && z.max !== '' && s > Number(z.max)) s = Number(z.max);
    return s;
}

export function render(container, ctx = {}) {
    // Geteilter Bogen (6.6): nur lesen, ohne Passwort
    const teile = ctx.teile || [];
    const geteilt = ctx.route === 'bogen' ? { kennung: String(teile[0] || ''), schluessel: String(teile[1] || '') } : null;
    const nurLesen = Boolean(geteilt);
    if (nurLesen) container.setAttribute('data-bereich', 'dsa');
    const fuer = nurLesen ? 'geteilt:' + geteilt.schluessel : 'eigen';
    if (datenFuer !== fuer) { daten = null; datenFuer = fuer; }
    const leerText = nurLesen ? 'Leer.' : null;
    const ladeStatus = el('p', { class: 'meldung besitz-lade', attrs: { role: 'status', 'aria-live': 'polite' } });
    const auswahl = el('select', { attrs: { id: 'dsa-bogen', 'aria-label': 'Bogen' }, on: { change: () => { schreiben('dsa_bogen', auswahl.value); zeigeAlles(); } } });
    const marke = el('span', { class: 'dsa-marke', attrs: { hidden: true } });
    // Name des Bogens als große Überschrift. Darüber liegt die (unsichtbare) Auswahl, Tipp öffnet sie (Wunsch der Person, 31.10.2026).
    const bogenName = el('h2', { class: 'dsa-bogen-name' });
    const namePfeil = el('span', { class: 'dsa-name-pfeil', attrs: { 'aria-hidden': 'true' } });
    const teilenText = el('span', { class: 'dsa-teilen-text', text: 'Teilen' });
    const teilenKnopf = el('button', { class: 'knopf knopf-zweit dsa-teilen', attrs: { type: 'button', hidden: true, 'aria-label': 'Teilen' }, on: { click: () => { const b = gewaehlt(); if (b) zeigeTeilen(b); } } }, [el('span', { text: '🔗', attrs: { 'aria-hidden': 'true' } }), teilenText]);
    // Schalter Charakterbogen | Abenteuer | DM (Wunsch der Person, 31.10.2026). DM nur mit Passwort.
    const modus = () => {
        const m = nurLesen ? modusGeteilt : lesen('dsa_modus', 'bogen');
        return MODI.some(([k]) => k === m) && !(nurLesen && m === 'dm') ? m : 'bogen';
    };
    const schalterKnoepfe = MODI.filter(([k]) => !(nurLesen && k === 'dm')).map(([k, lang, kurz]) => el('button', {
        class: 'dsa-schalter-knopf', attrs: { type: 'button', 'data-modus': k },
        on: { click: () => { if (nurLesen) modusGeteilt = k; else schreiben('dsa_modus', k); zeigeAlles(); } }
    }, [el('span', { class: 'dsa-schalter-lang', text: lang }), el('span', { class: 'dsa-schalter-kurz', text: kurz })]));
    const schalter = el('div', { class: 'dsa-schalter', attrs: { role: 'group', 'aria-label': 'Ansicht' } }, schalterKnoepfe);
    const leiste = el('div', { class: 'dsa-leiste' }, [schalter, marke, teilenKnopf]);
    const nameZeile = el('div', { class: 'dsa-name-zeile', attrs: { hidden: true } }, [bogenName, namePfeil, auswahl]);
    const oben = el('div', { class: 'dsa-oben', attrs: { hidden: true } });
    const abschnitte = el('div', { class: 'dsa-abschnitte' });
    const neuKnopf = el('button', { class: 'knopf knopf-bereich', text: '+ Bogen', attrs: { type: 'button', disabled: true }, on: { click: () => zeigeBogenForm(null) } });
    const neuLaden = el('button', { class: 'knopf knopf-zweit dsa-neu-laden', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => laden() } });
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'dsa-dialog-titel' } });
    // Nur × und Abbrechen schließen (kein Tipp daneben, keine Escape-Taste), damit nichts Eingetipptes verloren geht
    dialog.addEventListener('cancel', (ev) => ev.preventDefault());
    let sendet = false;
    let laedt = false;

    const gewaehlt = () => (daten ? daten.boegen.find((b) => b.id === auswahl.value) || null : null);

    // --- Anzeige ---

    function zeigeAlles() {
        const boegen = daten ? [...daten.boegen].sort((a, b) => a.name.localeCompare(b.name, 'de')) : [];
        const gemerkt = lesen('dsa_bogen', '');
        const wahl = boegen.some((b) => b.id === auswahl.value) ? auswahl.value
            : (boegen.some((b) => b.id === gemerkt) ? gemerkt : (boegen[0] ? boegen[0].id : ''));
        leeren(auswahl);
        boegen.forEach((b) => auswahl.append(el('option', { text: b.name, attrs: { value: b.id } })));
        auswahl.value = wahl;
        auswahl.hidden = !boegen.length || nurLesen;
        neuKnopf.disabled = !daten;

        const bogen = gewaehlt();
        const m = modus();
        schalterKnoepfe.forEach((k) => k.setAttribute('aria-pressed', String(k.dataset.modus === m)));
        const mitBogen = bogen && m !== 'dm';
        nameZeile.hidden = !mitBogen;
        nameZeile.classList.toggle('ist-wahl', !nurLesen);
        namePfeil.hidden = nurLesen;
        bogenName.textContent = bogen ? bogen.name : '';
        // Die Leiste mit dem Schalter steht immer da (DM geht auch ohne Bogen), im geteilten Link nur mit Bogen
        leiste.hidden = nurLesen ? !bogen : !daten;
        teilenKnopf.hidden = nurLesen || !mitBogen;
        teilenText.textContent = bogen && bogen.geteilt ? 'Geteilt' : 'Teilen';
        teilenKnopf.setAttribute('aria-label', teilenText.textContent);
        marke.hidden = !mitBogen;
        marke.textContent = bogen ? (bogen.regelwerk === 'dnd' ? 'DnD' : 'DSA') : '';
        leeren(oben);
        leeren(abschnitte);
        // Bei Abenteuer ohne die klebende Leiste mit Zählern und Eigenschaften (Wunsch der Person, 1.11.2026)
        oben.hidden = !mitBogen || m === 'abenteuer';
        if (daten && m === 'dm') {
            abschnitte.append(...dmAnsicht(helfer()));
            return;
        }
        if (!bogen) {
            if (daten && !nurLesen) abschnitte.append(el('p', { class: 'leise', text: 'Noch kein Bogen. Lege mit „+ Bogen“ den ersten an.' }));
            return;
        }
        if (m === 'abenteuer') {
            abschnitte.append(...abenteuerAnsicht(helfer(), bogen));
            return;
        }
        zeigeOben(bogen);
        abschnitte.append(...[kopfKarte(bogen), eigenschaftenKarte(bogen), nurLesen ? null : verlaufKarte(bogen), ...LISTEN.map((def) => listenKarte(bogen, def))].filter(Boolean));
    }

    // Helfer für js/views/dsa-abenteuer.js
    const helfer = () => ({ daten, nurLesen, karte, oeffneDialog, senden, formKnoepfe, textFeld, feld, dialog, zeigeAlles, datumText, offen, holeBild: holeAbBild, jetzt: () => daten });
    // Bild eines gespielten Abenteuers (ab 0.6.9): mit Passwort wie das Bogenbild, im geteilten Link über „geteilt“ mit dem Schlüssel
    async function holeAbBild(id) {
        if (!nurLesen) return holeBild(id);
        const key = 'geteilt-ab-' + id;
        if (bilder.has(key)) return bilder.get(key);
        const adresse = bildAdresse(await apiOeffentlich('https://script.google.com/macros/s/' + geteilt.kennung + '/exec', 'geteilt', { schluessel: geteilt.schluessel, bild: id }));
        if (!adresse) throw new Error('Unbekannte Bildart.');
        bilder.set(key, adresse);
        return adresse;
    }

    // Zähler (Geld, LeP, AsP, AP) und Eigenschaften-Leiste, kleben beim Scrollen oben
    function zeigeOben(bogen) {
        const zaehler = bogen.zaehler.filter((z) => {
            // AsP ohne Höchstwert und ohne Stand (Held ohne Zauber) blendet die App aus
            return !(/^(asp|ae)$/i.test(z.k) && !Number(z.max) && stand(bogen, z) === 0);
        });
        if (zaehler.length) {
            oben.append(el('div', { class: 'dsa-zaehler' }, zaehler.map((z) => {
                const s = stand(bogen, z);
                const wert = z.art === 'geld' ? [muenzen(s)]
                    : [el('span', { text: String(s) }), Number(z.max) ? el('small', { text: ' / ' + z.max }) : null];
                const kachel = nurLesen ? el('div', { class: 'dsa-zaehler-kachel' })
                    : el('button', { class: 'dsa-zaehler-kachel', attrs: { type: 'button', 'aria-label': (z.n || z.k) + ' ändern' }, on: { click: () => zeigeZaehlerForm(bogen, z) } });
                kachel.append(
                    el('span', { class: 'dsa-zaehler-name', text: symbol(z) + ' ' + z.k }),
                    el('span', { class: 'dsa-zaehler-wert' }, wert)
                );
                return kachel;
            })));
        }
        const eig = bogen.eigenschaften.filter((e) => e.g !== 'b');
        if (eig.length) {
            oben.append(el('div', { class: 'dsa-eig' }, eig.map((e) => el('div', { attrs: { title: e.n } }, [
                el('b', { text: e.w || '–' }), el('span', { text: e.k })
            ]))));
        }
    }

    // Eine aufklappbare Karte mit Titel, Zahl, Knopf (✎ oder +) und Inhalt. Auf- und Zuklappen bleibt beim Neuzeichnen.
    function karte(key, titel, knopf, inhalt, anzahl = '') {
        const k = nurLesen || !knopf ? null : el('button', {
            class: 'dsa-stift', text: knopf.zeichen,
            attrs: { type: 'button', 'aria-label': knopf.label }, on: { click: (ev) => { ev.preventDefault(); knopf.tun(); } }
        });
        const box = el('details', { class: 'dsa-abschnitt', attrs: { open: offen.has(key) } }, [
            el('summary', {}, [el('span', { class: 'dsa-abschnitt-titel', text: titel }), anzahl !== '' ? el('span', { class: 'leise dsa-anzahl', text: String(anzahl) }) : null, k]),
            el('div', { class: 'dsa-abschnitt-inhalt' }, inhalt)
        ]);
        box.addEventListener('toggle', () => { if (box.open) offen.add(key); else offen.delete(key); });
        return box;
    }

    // --- Listen (6.2): Vor- und Nachteile, Sonderfertigkeiten und Gaben, Talente, Besitz ---
    function listenKarte(bogen, def) {
        const alle = daten.eintraege.filter((e) => e.bogen_id === bogen.id && def.arten.some(([a]) => a === e.abschnitt));
        const inhalt = [];
        if (def.art === 'chips') {
            def.arten.forEach(([a, ueber]) => {
                const teil = sortiere(alle.filter((e) => e.abschnitt === a));
                if (!teil.length) return;
                inhalt.push(el('h3', { class: 'dsa-gruppe', text: ueber }), el('div', { class: 'dsa-chips' }, teil.map((e) => el('button', {
                    class: 'dsa-chip', text: e.name + (e.wert ? ' ' + e.wert : '') + (e.text ? ' …' : ''),
                    attrs: { type: 'button', 'aria-label': e.name + (nurLesen ? ' ansehen' : ' bearbeiten') }, on: { click: () => oeffneEintrag(bogen, def, e) }
                }))));
            });
        } else if (def.art === 'zauber') {
            sortiere(alle).forEach((e) => inhalt.push(zauberBlock(bogen, def, e)));
        } else if (def.art === 'waffen') {
            if (alle.length) inhalt.push(waffenTabelle(bogen, def, sortiere(alle)));
        } else {
            const gruppeVon = (e) => (def.art === 'orte' ? String((e.felder && e.felder.ort) || '') : e.gruppe);
            const leer = def.art === 'orte' ? 'Ohne Ort' : 'Ohne Gruppe';
            gruppenFolge(alle.map(gruppeVon), def.art === 'gruppen' ? TALENT_GRUPPEN : []).forEach((g) => {
                inhalt.push(el('h3', { class: 'dsa-gruppe', text: g || leer }));
                sortiere(alle.filter((e) => gruppeVon(e) === g)).forEach((e) => inhalt.push(eintragZeile(bogen, def, e)));
            });
        }
        if (!alle.length) inhalt.push(el('p', { class: 'leise', text: leerText || 'Noch leer. Tippe auf +.' }));
        return karte(def.key, def.titel, { zeichen: '+', label: 'Neu bei ' + def.titel, tun: () => zeigeEintragForm(bogen, def, null) }, inhalt, alle.length || '');
    }

    // Ein Zauber: Kopfzeile mit Name, Probe und ZfW; aufgeklappt alle Felder, Wirkung und Modifikationen
    function zauberBlock(bogen, def, e) {
        const f = e.felder || {};
        const felder = ZAUBER_FELDER.filter(([k]) => f[k]);
        const mods = Array.isArray(f.mods) ? f.mods : [];
        const key = 'zauber-' + e.id;
        const box = el('details', { class: 'dsa-zauber', attrs: { open: offen.has(key) } }, [
            el('summary', {}, [
                el('span', { class: 'dsa-zeile-name' }, [el('b', { text: e.name }), f.haus ? el('span', { class: 'dsa-marke dsa-marke-klein', text: 'Haus' }) : null]),
                e.probe ? el('span', { class: 'leise', text: e.probe }) : null,
                el('span', { class: 'dsa-zeile-wert', text: e.wert ? 'ZfW ' + e.wert : '' })
            ]),
            el('div', { class: 'dsa-zauber-inhalt' }, [
                felder.length ? el('dl', { class: 'dsa-felder' }, felder.flatMap(([k, t]) => [el('dt', { text: t }), el('dd', { text: f[k] })])) : null,
                e.text ? el('p', { class: 'dsa-notiz', text: e.text }) : null,
                mods.length ? el('h4', { class: 'dsa-gruppe', text: 'Modifikationen' }) : null,
                mods.length ? el('ul', { class: 'dsa-mods' }, mods.map((m) => el('li', { text: m }))) : null,
                nurLesen ? null : el('button', { class: 'knopf knopf-zweit dsa-klein', text: '✎ Bearbeiten', attrs: { type: 'button' }, on: { click: () => oeffneEintrag(bogen, def, e) } })
            ])
        ]);
        box.addEventListener('toggle', () => { if (box.open) offen.add(key); else offen.delete(key); });
        return box;
    }

    // Waffen: am PC eine Tabelle, am Handy je Waffe eine Karte (CSS). Tipp auf ✎ öffnet das Formular.
    function waffenTabelle(bogen, def, liste) {
        return el('table', { class: 'dsa-waffen' }, [
            el('thead', {}, [el('tr', {}, [el('th', { text: 'Waffe', attrs: { scope: 'col' } }), ...WAFFEN_SPALTEN.map(([, t]) => el('th', { text: t, attrs: { scope: 'col' } })), el('th', { attrs: { scope: 'col' } }, [el('span', { class: 'reiter-name', text: nurLesen ? 'Mehr' : 'Bearbeiten' })])])]),
            el('tbody', {}, liste.map((e) => {
                const f = e.felder || {};
                return el('tr', {}, [
                    el('th', { attrs: { scope: 'row' } }, [el('span', { text: e.name }), f.art ? el('span', { class: 'leise dsa-waffe-art', text: f.art }) : null]),
                    ...WAFFEN_SPALTEN.map(([k, t]) => el('td', { text: f[k] || '–', attrs: { 'data-titel': t, class: f[k] ? null : 'dsa-leer' } })),
                    el('td', { class: 'dsa-waffe-knopf' }, [el('button', { class: 'dsa-stift', text: nurLesen ? 'ⓘ' : '✎', attrs: { type: 'button', 'aria-label': e.name + (nurLesen ? ' ansehen' : ' bearbeiten') }, on: { click: () => oeffneEintrag(bogen, def, e) } })])
                ]);
            }))
        ]);
    }

    // Eine Zeile (Talent oder Gegenstand). Tipp öffnet das Formular.
    function eintragZeile(bogen, def, e) {
        const f = e.felder || {};
        const zusatz = def.key === 'talente' ? [e.probe, f.be].filter(Boolean).join(' · ') : (f.gewicht || '');
        return el('button', { class: 'dsa-zeile dsa-zeile-knopf', attrs: { type: 'button', 'aria-label': e.name + (nurLesen ? ' ansehen' : ' bearbeiten') }, on: { click: () => oeffneEintrag(bogen, def, e) } }, [
            el('span', { class: 'dsa-zeile-name' }, [
                el('span', { text: e.name }),
                f.spez ? el('span', { class: 'leise', text: ' (' + f.spez + ')' }) : null
            ]),
            zusatz ? el('span', { class: 'leise', text: zusatz }) : null,
            el('span', { class: 'dsa-zeile-wert', text: e.wert || '' }),
            el('span', { class: 'dsa-zeile-stift', text: nurLesen ? 'ⓘ' : '✎', attrs: { 'aria-hidden': 'true' } })
        ]);
    }

    function kopfKarte(bogen) {
        const felder = KOPF.filter(([k]) => bogen.kopf[k]);
        const inhalt = [];
        const liste = felder.length
            ? el('dl', { class: 'dsa-felder' }, felder.flatMap(([k, t]) => [el('dt', { text: t }), el('dd', { text: bogen.kopf[k] })]))
            : el('p', { class: 'leise', text: leerText || 'Noch leer. Tippe auf ✎.' });
        if (bogen.bild) {
            // Bild des Helden links neben dem Kopf, lädt nach (Wunsch der Person, 31.10.2026: links, ganz zu sehen, nichts unscharf)
            // Der Kasten hat genau das Seitenverhältnis des Bildes: so hoch wie der Text, die Breite folgt daraus.
            // Ist das zu breit (am Handy), wird der Kasten schmaler und damit niedriger. Das Bild wird nie beschnitten.
            const bild = el('img', { class: 'dsa-bild', attrs: { alt: 'Bild: ' + bogen.name, hidden: true } });
            const bildText = el('p', { class: 'leise dsa-bild-text', text: 'Bild lädt …' });
            // Tipp auf das Bild zeigt es groß (Wunsch der Person, 31.10.2026)
            const gross = () => {
                if (bild.hidden) return;
                oeffneDialog(bogen.name, [
                    el('img', { class: 'besitz-dialog-bild', attrs: { src: bild.src, alt: 'Bild: ' + bogen.name } }),
                    el('div', { class: 'besitz-form-knoepfe' }, [el('button', { class: 'knopf knopf-zweit', text: 'Schließen', attrs: { type: 'button' }, on: { click: () => dialog.close() } })])
                ]);
            };
            const box = el('button', { class: 'dsa-bild-box', attrs: { type: 'button', 'aria-label': 'Bild groß zeigen' }, on: { click: gross } }, [bild, bildText]);
            const reihe = el('div', { class: 'dsa-kopf-mit-bild' }, [box, liste]);
            let breite = 0;
            const passe = () => {
                const r = bild.naturalWidth / bild.naturalHeight;
                if (bild.hidden || !r || !reihe.clientWidth) return;
                const hoch = Math.max(liste.offsetHeight, 120);
                const w = Math.round(Math.min(hoch * r, reihe.clientWidth * (reihe.clientWidth < 500 ? 0.36 : 0.45)));
                if (Math.abs(w - breite) < 2) return;
                breite = w;
                box.style.width = w + 'px';
                box.style.height = Math.round(w / r) + 'px';
            };
            if ('ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(passe)).observe(liste);
            holeBild(bogen.bild)
                .then((adresse) => { bild.addEventListener('load', passe, { once: true }); bild.src = adresse; bild.hidden = false; bildText.remove(); })
                .catch((e) => { bildText.textContent = 'Bild nicht geladen: ' + e.message; });
            inhalt.push(reihe);
        } else {
            inhalt.push(liste);
        }
        // Ohne Überschrift „Kopf“ (Wunsch der Person, 31.10.2026): immer offen, ✎ unten rechts
        const stift = nurLesen ? null : el('button', { class: 'dsa-stift', text: '✎', attrs: { type: 'button', 'aria-label': 'Kopf bearbeiten' }, on: { click: () => zeigeBogenForm(bogen) } });
        if (bogen.notiz || stift) {
            inhalt.push(el('div', { class: 'dsa-kopf-fuss' }, [
                bogen.notiz ? el('p', { class: 'dsa-notiz', text: bogen.notiz }) : el('span'), stift
            ].filter(Boolean)));
        }
        return el('section', { class: 'dsa-abschnitt dsa-kopf-karte', attrs: { 'aria-label': 'Kopf' } }, inhalt);
    }

    function eigenschaftenKarte(bogen) {
        const zeile = (e) => el('div', { class: 'dsa-zeile' }, [
            el('span', { class: 'dsa-zeile-name', text: e.n || e.k }),
            el('span', { class: 'leise', text: e.n ? e.k : '' }),
            el('span', { class: 'dsa-zeile-wert', text: e.w || '–' })
        ]);
        const eig = bogen.eigenschaften.filter((e) => e.g !== 'b');
        const basis = bogen.eigenschaften.filter((e) => e.g === 'b');
        const inhalt = [];
        if (eig.length) inhalt.push(el('h3', { class: 'dsa-gruppe', text: 'Eigenschaften' }), ...eig.map(zeile));
        if (basis.length) inhalt.push(el('h3', { class: 'dsa-gruppe', text: 'Basiswerte' }), ...basis.map(zeile));
        if (bogen.zaehler.length) {
            inhalt.push(el('h3', { class: 'dsa-gruppe', text: 'Zähler oben' }), ...bogen.zaehler.map((z) => el('div', { class: 'dsa-zeile' }, [
                el('span', { class: 'dsa-zeile-name', text: symbol(z) + ' ' + (z.n || z.k) }),
                el('span', { class: 'leise', text: nurLesen ? (z.max != null && z.max !== '' ? 'höchstens ' + z.max : '') : 'Start ' + (z.art === 'geld' ? geldText(z.start) : z.start) + (z.max != null ? ', höchstens ' + z.max : '') }),
                el('span', { class: 'dsa-zeile-wert', text: z.art === 'geld' ? geldText(stand(bogen, z)) : String(stand(bogen, z)) })
            ])));
        }
        if (!inhalt.length) inhalt.push(el('p', { class: 'leise', text: leerText || 'Noch leer. Tippe auf ✎.' }));
        return karte('eigenschaften', 'Eigenschaften und Basiswerte', { zeichen: '✎', label: 'Eigenschaften bearbeiten', tun: () => zeigeEigenschaftenForm(bogen) }, inhalt);
    }

    // --- Verlauf (6.4): neueste Änderung oben, Filter je Zähler ---
    function verlaufKarte(bogen) {
        const liste = daten.verlauf.map((v, i) => ({ v, i })).filter(({ v }) => v.bogen_id === bogen.id)
            .sort((a, b) => (a.v.datum < b.v.datum ? 1 : a.v.datum > b.v.datum ? -1 : b.i - a.i)).map(({ v }) => v);
        const zaehlerVon = (k) => bogen.zaehler.find((z) => z.k === k);
        const filter = el('select', { attrs: { id: 'dsa-verlauf-filter', 'aria-label': 'Zähler wählen' } }, [
            el('option', { text: 'Alle Zähler', attrs: { value: '' } }),
            ...bogen.zaehler.map((z) => el('option', { text: symbol(z) + ' ' + (z.n || z.k), attrs: { value: z.k } }))
        ]);
        filter.value = verlaufFilter && bogen.zaehler.some((z) => z.k === verlaufFilter) ? verlaufFilter : '';
        const box = el('div', { class: 'dsa-verlauf' });
        function zeige() {
            leeren(box);
            const passend = liste.filter((v) => !filter.value || v.zaehler === filter.value);
            if (!passend.length) {
                box.append(el('p', { class: 'leise', text: liste.length ? 'Keine Änderung bei diesem Zähler.' : 'Noch keine Änderung. Tippe oben auf einen Zähler.' }));
                return;
            }
            const sichtbar = verlaufAlle ? passend : passend.slice(0, VERLAUF_ANFANG);
            box.append(el('ul', { class: 'dsa-verlauf-liste' }, sichtbar.map((v) => {
                const z = zaehlerVon(v.zaehler);
                return el('li', { class: 'dsa-verlauf-zeile' + (v.aenderung < 0 ? ' ist-minus' : '') }, [
                    el('span', { class: 'dsa-verlauf-wer', text: (z ? symbol(z) + ' ' : '') + v.zaehler }),
                    el('span', { class: 'dsa-verlauf-wert' }, istAusgegeben(z, v.aenderung)
                        ? [el('span', { text: '− ' + Math.abs(v.aenderung) }), el('small', { text: ' ausgegeben' })]
                        : [el('span', { text: aenderungText(z, v.aenderung) })]),
                    el('span', { class: 'leise dsa-verlauf-datum', text: datumText(v.datum) }),
                    v.notiz ? el('span', { class: 'dsa-verlauf-notiz', text: v.notiz }) : null
                ]);
            })));
            if (sichtbar.length < passend.length) {
                box.append(el('button', { class: 'knopf knopf-zweit', text: 'Alle ' + passend.length + ' zeigen', attrs: { type: 'button' }, on: { click: () => { verlaufAlle = true; zeige(); } } }));
            }
        }
        filter.addEventListener('change', () => { verlaufFilter = filter.value; zeige(); });
        zeige();
        const ersterZaehler = bogen.zaehler[0];
        const knopf = ersterZaehler ? { zeichen: '+', label: 'Zähler ändern', tun: () => zeigeZaehlerForm(bogen, bogen.zaehler.find((z) => z.k === filter.value) || ersterZaehler) }
            : { zeichen: '✎', label: 'Zähler einrichten', tun: () => zeigeEigenschaftenForm(bogen) };
        return karte('verlauf', 'Verlauf', knopf, [bogen.zaehler.length > 1 ? filter : null, box], liste.length);
    }

    // --- Zähler ändern (6.4): „+“ oder „−“, Betrag, Notiz ---
    function zeigeZaehlerForm(bogen, z) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const jetzt = stand(bogen, z);
        const max = z.max != null && z.max !== '' ? Number(z.max) : null;
        let richtung = 1;
        const ap = z.art === 'ap';
        const plus = el('button', { class: 'dsa-richtung', text: ap ? '+ gesammelt' : '+ dazu', attrs: { type: 'button', 'aria-pressed': 'true' }, on: { click: () => setzeRichtung(1) } });
        const minus = el('button', { class: 'dsa-richtung', text: ap ? '− ausgegeben' : '− weg', attrs: { type: 'button', 'aria-pressed': 'false' }, on: { click: () => setzeRichtung(-1) } });
        function setzeRichtung(r) {
            richtung = r;
            plus.setAttribute('aria-pressed', String(r === 1));
            minus.setAttribute('aria-pressed', String(r === -1));
        }
        const zahl = (id, label) => el('input', { attrs: { id, type: 'number', inputmode: 'numeric', min: '0', max: '1000000', step: '1', placeholder: '0', 'aria-label': label } });
        // Geld: ein Feld je Münze, die App rechnet in Kreuzer um
        const muenzen = z.art === 'geld' ? MUENZEN.map(([wert, kurz, name]) => [wert, zahl('dsa-z-' + kurz, name), kurz, name]) : null;
        const betrag = muenzen ? null : zahl('dsa-z-betrag', 'Betrag');
        const notiz = textFeld('dsa-z-notiz', '', 100, { placeholder: 'freiwillig, zum Beispiel Kampf mit Orks' });
        const voll = z.art === 'leben' && max != null ? el('button', {
            class: 'knopf knopf-zweit', text: 'Voll (' + max + ')', attrs: { type: 'button', disabled: jetzt >= max },
            on: { click: () => { setzeRichtung(1); betrag.value = String(max - jetzt); notiz.focus(); } }
        }) : null;
        const knoepfe = formKnoepfe(null);

        const leseBetrag = () => (muenzen
            ? muenzen.reduce((s, [wert, f]) => s + wert * (Number(f.value) || 0), 0)
            : Number(betrag.value));
        async function absenden(ev) {
            ev.preventDefault();
            const felder = muenzen ? muenzen.map(([, f]) => f) : [betrag];
            if (felder.some((f) => f.value !== '' && (!Number.isInteger(Number(f.value)) || Number(f.value) < 0))) { status.textContent = 'Bitte nur ganze Zahlen ab 0.'; return; }
            let b = leseBetrag();
            if (!(b > 0)) { status.textContent = 'Bitte einen Betrag angeben.'; return; }
            if (b > 1000000) { status.textContent = 'Der Betrag ist zu groß.'; return; }
            let hinweis = '';
            if (richtung === 1 && max != null && jetzt + b > max) {
                // Nicht über den Höchstwert: nur bis voll speichern
                b = max - jetzt;
                if (b <= 0) { status.textContent = 'Ist schon voll (' + max + ').'; return; }
                hinweis = 'bis zum Höchstwert';
            }
            if (richtung === -1 && z.art === 'geld' && b > jetzt) { status.textContent = 'So viel Geld ist nicht da (nur ' + geldText(jetzt) + ').'; return; }
            const antwort = await senden(status, knoepfe, 'verlauf_neu', { bogen_id: bogen.id, zaehler: z.k, aenderung: richtung * b, notiz: notiz.value.trim() });
            if (!antwort) return;
            dialog.close();
            zeigeAlles();
            zeigeGespeichert(aenderungText(z, richtung * b), hinweis);
        }

        const standText = ap
            ? 'Gesammelt ' + jetzt + ' · frei ' + summe(bogen, z)
            : 'Jetzt ' + wertText(z, jetzt) + (max != null ? ' von ' + max : '');
        oeffneDialog(symbol(z) + ' ' + (z.n || z.k), [
            el('form', { class: 'formular', on: { submit: absenden } }, [
                el('p', { class: 'dsa-z-stand', text: standText }),
                el('div', { class: 'dsa-richtungen', attrs: { role: 'group', 'aria-label': 'Richtung' } }, [plus, minus]),
                ...(muenzen
                    ? [el('span', { class: 'dsa-z-label', text: 'Betrag' }), el('div', { class: 'dsa-muenzen' }, muenzen.map(([, f, kurz, name]) => el('label', { attrs: { for: f.id, title: name } }, [f, el('span', { text: kurz })])))]
                    : feld('dsa-z-betrag', 'Betrag', betrag)),
                voll,
                ...feld('dsa-z-notiz', 'Notiz', notiz),
                status,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe)
            ].filter(Boolean))
        ]);
        (muenzen ? muenzen[0][1] : betrag).focus();
    }

    // Tipp auf einen Eintrag: Formular, im geteilten Bogen nur ansehen
    function oeffneEintrag(bogen, def, e) {
        if (nurLesen) zeigeEintrag(def, e); else zeigeEintragForm(bogen, def, e);
    }

    // Ein Eintrag nur zum Lesen (geteilter Bogen, 6.6)
    function zeigeEintrag(def, e) {
        const f = e.felder || {};
        const zeilen = [];
        if (e.gruppe) zeilen.push(['Gruppe', e.gruppe]);
        if (e.probe) zeilen.push(['Probe', e.probe]);
        if (e.wert && def.wert) zeilen.push([def.wert.replace(/ \(freiwillig\)$/, ''), e.wert]);
        (def.felder || []).forEach(([k, t, typ]) => {
            if (typ === 'liste' || typ === 'haken' || !f[k]) return;
            zeilen.push([t.replace(/ \(.*\)$/, ''), String(f[k])]);
        });
        const mods = Array.isArray(f.mods) ? f.mods : [];
        oeffneDialog(e.name, [
            zeilen.length ? el('dl', { class: 'dsa-felder' }, zeilen.flatMap(([t, w]) => [el('dt', { text: t }), el('dd', { text: w })])) : null,
            e.text ? el('p', { class: 'dsa-notiz', text: e.text }) : null,
            mods.length ? el('ul', { class: 'dsa-mods' }, mods.map((m) => el('li', { text: m }))) : null,
            !zeilen.length && !e.text && !mods.length ? el('p', { class: 'leise', text: 'Keine weiteren Angaben.' }) : null,
            el('div', { class: 'besitz-form-knoepfe' }, [el('button', { class: 'knopf knopf-zweit', text: 'Schließen', attrs: { type: 'button' }, on: { click: () => dialog.close() } })])
        ].filter(Boolean));
    }

    // --- Teilen (6.6): Link erstellen, kopieren, neu erstellen, nicht mehr teilen ---
    // Den Schlüssel gibt das Skript nur beim Erstellen heraus. Die App merkt ihn sich im Gerät (thetadex_dsa_links).
    function zeigeTeilen(b) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const kennung = (ADRESSE.exec((lesen('skripte', {}) || {}).dsa || '') || [])[1] || '';
        const links = lesen('dsa_links', {}) || {};
        // Nicht mehr geteilt (zum Beispiel an einem anderen Gerät beendet): gemerkten Link vergessen
        if (!b.geteilt && links[b.id]) { delete links[b.id]; schreiben('dsa_links', links); }
        const schluessel = b.geteilt && SCHLUESSEL.test(links[b.id] || '') ? links[b.id] : '';
        const link = schluessel && kennung ? location.origin + location.pathname + '#/bogen/' + kennung + '/' + schluessel : '';
        const inhalt = [];
        const knoepfe = [];

        async function freigabe(was) {
            const antwort = await senden(status, knoepfe, 'freigabe', { id: b.id, geaendert_am: b.geaendert_am, was });
            if (!antwort) return;
            const neu = lesen('dsa_links', {}) || {};
            if (was === 'neu' && SCHLUESSEL.test(antwort.schluessel || '')) neu[b.id] = antwort.schluessel; else delete neu[b.id];
            schreiben('dsa_links', neu);
            zeigeAlles();
            const jetzt = daten.boegen.find((x) => x.id === b.id);
            if (jetzt) zeigeTeilen(jetzt); else dialog.close();
            zeigeGespeichert(was === 'neu' ? 'Link erstellt' : 'Nicht mehr geteilt');
        }

        if (!kennung) {
            inhalt.push(el('p', { text: 'Die Script-Adresse von „dsa“ hat nicht die erwartete Form (https://script.google.com/macros/s/…/exec). Bitte in den Einstellungen prüfen.' }));
        } else if (!b.geteilt) {
            inhalt.push(el('p', { text: 'Dieser Bogen ist nicht geteilt.' }),
                el('p', { class: 'leise', text: 'Mit dem Link sehen andere den Bogen ohne Passwort: alle Werte und Listen, das Bild und die Würfel. Sie sehen keine Notiz, keinen Verlauf und können nichts ändern.' }));
            knoepfe.push(el('button', { class: 'knopf knopf-bereich', text: 'Link erstellen', attrs: { type: 'button' }, on: { click: () => freigabe('neu') } }));
        } else {
            if (link) {
                const feldLink = el('input', { attrs: { id: 'dsa-link', type: 'text', readonly: true, value: link } });
                feldLink.addEventListener('focus', () => feldLink.select());
                inhalt.push(el('p', { text: 'Dieser Bogen ist geteilt. Jeder mit diesem Link kann ihn ansehen:' }),
                    el('label', { class: 'reiter-name', text: 'Link', attrs: { for: 'dsa-link' } }), feldLink);
                knoepfe.push(el('button', {
                    class: 'knopf knopf-bereich', text: 'Link kopieren', attrs: { type: 'button' },
                    on: { click: async () => { try { await navigator.clipboard.writeText(link); status.textContent = 'Link kopiert.'; } catch (e) { feldLink.focus(); status.textContent = 'Bitte den Link oben markieren und kopieren.'; } } }
                }));
                if (navigator.share) {
                    knoepfe.push(el('button', { class: 'knopf knopf-zweit', text: 'Senden …', attrs: { type: 'button' }, on: { click: () => navigator.share({ title: b.name, url: link }).catch(() => {}) } }));
                }
            } else {
                inhalt.push(el('p', { text: 'Dieser Bogen ist geteilt. Der Link wurde auf einem anderen Gerät erstellt und ist hier nicht bekannt.' }),
                    el('p', { class: 'leise', text: 'Mit „Neuen Link erstellen“ bekommst du hier einen Link. Der alte gilt dann nicht mehr.' }));
            }
            knoepfe.push(
                el('button', { class: 'knopf knopf-zweit', text: 'Neuen Link erstellen', attrs: { type: 'button' }, on: { click: () => { if (confirm('Neuen Link erstellen? Der alte Link gilt dann sofort nicht mehr.')) freigabe('neu'); } } }),
                el('button', { class: 'knopf knopf-zweit', text: 'Nicht mehr teilen', attrs: { type: 'button' }, on: { click: () => { if (confirm('Nicht mehr teilen? Der Link gilt dann sofort nicht mehr.')) freigabe('aus'); } } })
            );
        }
        oeffneDialog('🔗 ' + b.name + ' teilen', [...inhalt, status, el('div', { class: 'besitz-form-knoepfe' }, knoepfe)]);
    }

    // --- Fenster und Senden ---

    function oeffneDialog(titel, inhalt) {
        leeren(dialog);
        dialog.append(el('div', { class: 'besitz-dialog-inhalt' }, [
            el('div', { class: 'form-kopf' }, [
                el('h2', { text: titel, attrs: { id: 'dsa-dialog-titel' } }),
                el('button', { class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Schließen' }, on: { click: () => dialog.close() } })
            ]),
            ...inhalt
        ]));
        if (!dialog.open) dialog.showModal();
    }

    // Sendet eine Aktion. Bei Erfolg kommen alle Daten frisch zurück.
    async function senden(status, knoepfe, action, werte) {
        if (sendet) return null;
        sendet = true;
        knoepfe.forEach((k) => { k.disabled = true; });
        status.textContent = 'Sende …';
        try {
            const antwort = await api('dsa', action, werte);
            setzeDaten(antwort);
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

    function formKnoepfe(loeschen, loeschenText = 'Bogen löschen') {
        const ok = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        const weg = loeschen ? el('button', { class: 'knopf knopf-zweit', text: loeschenText, attrs: { type: 'button' }, on: { click: loeschen } }) : null;
        return [ok, abbrechen, weg].filter(Boolean);
    }

    const textFeld = (id, wert, max, extra = {}) => el('input', { attrs: { id, type: 'text', maxlength: max, autocomplete: 'off', value: wert || '', ...extra } });
    const feld = (id, titel, eingabe) => [el('label', { text: titel, attrs: { for: id } }), eingabe];

    // Alle Werte eines Bogens zum Senden (die Teile, die das Formular nicht ändert, bleiben wie sie sind)
    const bogenWerte = (b) => ({ id: b.id, geaendert_am: b.geaendert_am, name: b.name, regelwerk: b.regelwerk, kopf: b.kopf, eigenschaften: b.eigenschaften, zaehler: b.zaehler, notiz: b.notiz });

    // --- Bogen anlegen (b = null) oder Kopf ändern ---
    function zeigeBogenForm(b) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const name = textFeld('dsa-name', b && b.name, 80);
        const regelwerk = el('select', { attrs: { id: 'dsa-regelwerk' } }, [
            el('option', { text: 'DSA', attrs: { value: 'dsa' } }), el('option', { text: 'DnD', attrs: { value: 'dnd' } })
        ]);
        regelwerk.value = b ? b.regelwerk : 'dsa';
        const kopfFelder = KOPF.map(([k, t]) => [k, t, textFeld('dsa-kopf-' + k, b && b.kopf[k], 80)]);
        const notiz = el('textarea', { attrs: { id: 'dsa-notiz', maxlength: 1000, rows: 3, placeholder: 'freiwillig' } });
        notiz.value = b ? b.notiz : '';
        const knoepfe = formKnoepfe(b ? () => loeschen(b, status, knoepfe) : null);

        // Bild (6.5): bildStand.id = gespeichertes Bild, bildStand.daten = neu gewähltes (verkleinert), bildLink = eingefügter Drive-Link.
        // Mitgeschickt wird es nur, wenn sich etwas geändert hat.
        let bildStand = { id: b ? b.bild || '' : '', daten: null };
        let bildGeaendert = false;
        const vorschau = el('img', { class: 'besitz-vorschau', attrs: { alt: 'Bild des Helden', hidden: true } });
        const bildText = el('p', { class: 'leise besitz-hinweis' });
        const bildEntfernen = el('button', { class: 'knopf knopf-zweit', text: 'Bild entfernen', attrs: { type: 'button', hidden: true }, on: { click: () => { bildGeaendert = true; bildStand = { id: '', daten: null }; bildDatei.value = ''; bildLink.value = ''; zeigeVorschau(null); } } });
        const bildDatei = el('input', { attrs: { id: 'dsa-bild', type: 'file', accept: 'image/*' }, on: { change: () => bildGewaehlt() } });
        const bildLink = el('input', {
            attrs: { id: 'dsa-bild-link', type: 'url', inputmode: 'url', autocomplete: 'off', spellcheck: 'false', placeholder: 'https://drive.google.com/…' },
            on: { input: () => { bildGeaendert = true; if (bildLink.value.trim()) { bildStand = { id: bildStand.id, daten: null }; zeigeVorschau(null, 'Das Bild aus dem Link erscheint nach dem Speichern.'); } } }
        });
        function zeigeVorschau(adresse, text = '') {
            vorschau.hidden = !adresse;
            if (adresse) vorschau.src = adresse; else vorschau.removeAttribute('src');
            bildText.textContent = text;
            bildEntfernen.hidden = !(adresse || bildStand.id || bildLink.value.trim());
        }
        async function bildGewaehlt() {
            const datei = bildDatei.files && bildDatei.files[0];
            if (!datei) return;
            zeigeVorschau(null, 'Bild wird verkleinert …');
            try {
                const daten = await verkleinereBild(datei);
                bildLink.value = '';
                bildStand = { id: bildStand.id, daten };
                bildGeaendert = true;
                zeigeVorschau(daten);
            } catch (e) {
                bildDatei.value = '';
                zeigeVorschau(null, e.message);
            }
        }
        if (bildStand.id) {
            const id = bildStand.id;
            zeigeVorschau(bilder.get(id) || null, bilder.has(id) ? '' : 'Bild lädt …');
            if (!bilder.has(id)) {
                holeBild(id).then((a) => { if (bildStand.id === id && !bildStand.daten && !bildLink.value.trim()) zeigeVorschau(a); })
                    .catch((e) => { if (bildStand.id === id) zeigeVorschau(null, 'Bild nicht geladen: ' + e.message); });
            }
        }

        async function absenden(ev) {
            ev.preventDefault();
            if (!name.value.trim()) { status.textContent = 'Bitte einen Namen angeben.'; return; }
            const kopf = {};
            kopfFelder.forEach(([k, , f]) => { if (f.value.trim()) kopf[k] = f.value.trim(); });
            const werte = b ? bogenWerte(b) : { eigenschaften: VORLAGE_EIGENSCHAFTEN, zaehler: VORLAGE_ZAEHLER };
            Object.assign(werte, { name: name.value.trim(), regelwerk: regelwerk.value, kopf, notiz: notiz.value.trim() });
            if (bildGeaendert) {
                if (bildStand.daten) werte.bild_daten = bildStand.daten.replace(/^data:image\/jpeg;base64,/, '');
                else werte.bild = bildLink.value.trim() || bildStand.id;
            }
            const antwort = await senden(status, knoepfe, 'bogen_speichern', { bogen: werte });
            if (!antwort) return;
            // Neu hochgeladenes Bild gleich merken, dann muss es nicht neu geladen werden
            const neu = antwort.boegen && antwort.boegen.find((x) => x.id === (b ? b.id : antwort.id));
            if (bildStand.daten && neu && neu.bild) bilder.set(neu.bild, bildStand.daten);
            dialog.close();
            if (antwort.id) { schreiben('dsa_bogen', antwort.id); auswahl.value = antwort.id; }
            zeigeAlles();
            zeigeGespeichert(b ? 'Gespeichert' : 'Bogen angelegt');
        }

        oeffneDialog(b ? 'Kopf bearbeiten' : 'Neuer Bogen', [
            el('form', { class: 'formular', on: { submit: absenden } }, [
                ...feld('dsa-name', 'Name', name),
                ...feld('dsa-regelwerk', 'Für', regelwerk),
                b ? null : el('p', { class: 'leise besitz-hinweis', text: 'Der Bogen startet mit den Eigenschaften und Zählern von DSA. Alles lässt sich danach ändern.' }),
                ...kopfFelder.flatMap(([k, t, f]) => feld('dsa-kopf-' + k, t, f)),
                ...feld('dsa-notiz', 'Notiz', notiz),
                el('label', { text: 'Bild (freiwillig): wählen oder aufnehmen', attrs: { for: 'dsa-bild' } }), bildDatei,
                el('label', { text: 'oder Google-Drive-Link', attrs: { for: 'dsa-bild-link' } }), bildLink,
                vorschau, bildText, bildEntfernen,
                el('p', { class: 'leise besitz-hinweis', text: 'Das Bild liegt in deinem Google Drive im Ordner „Thetadex DSA“.' }),
                status,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe)
            ])
        ]);
    }

    async function loeschen(b, status, knoepfe) {
        if (!confirm('Bogen „' + b.name + '“ mit allen Einträgen löschen? (Im Sheet zurückholbar)')) return;
        const antwort = await senden(status, knoepfe, 'bogen_loeschen', { id: b.id, geaendert_am: b.geaendert_am });
        if (!antwort) return;
        dialog.close();
        zeigeAlles();
        zeigeGespeichert('Gelöscht');
    }

    // --- Eigenschaften, Basiswerte und Zähler ändern ---
    function zeigeEigenschaftenForm(b) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        let nr = 0;
        const eigBox = el('div', { class: 'dsa-zeilen-form' });
        const basisBox = el('div', { class: 'dsa-zeilen-form' });
        const zaehlerBox = el('div', { class: 'dsa-zeilen-form' });

        // Eine Zeile mit Kürzel, Name und Wert; g = 'e' (Eigenschaft, oben in der Leiste) oder 'b' (Basiswert)
        function eigZeile(e, g) {
            const i = nr++;
            const k = textFeld('dsa-e-k-' + i, e.k, 8, { 'aria-label': 'Kürzel', placeholder: 'Kürzel' });
            const n = textFeld('dsa-e-n-' + i, e.n, 40, { 'aria-label': 'Name', placeholder: 'Name' });
            const w = textFeld('dsa-e-w-' + i, e.w, 20, { 'aria-label': 'Wert', placeholder: 'Wert', inputmode: 'text' });
            const zeile = el('div', { class: 'dsa-eig-zeile' }, [k, n, w,
                el('button', { class: 'dsa-stift', text: '×', attrs: { type: 'button', 'aria-label': 'Zeile entfernen' }, on: { click: () => zeile.remove() } })]);
            zeile.wert = () => ({ k: k.value.trim(), n: n.value.trim(), w: w.value.trim(), g });
            return zeile;
        }

        function zaehlerZeile(z) {
            const i = nr++;
            const k = textFeld('dsa-z-k-' + i, z.k, 8, { 'aria-label': 'Kürzel', placeholder: 'Kürzel' });
            const n = textFeld('dsa-z-n-' + i, z.n, 40, { 'aria-label': 'Name', placeholder: 'Name' });
            const art = el('select', { attrs: { 'aria-label': 'Art' } }, ARTEN.map(([w, t]) => el('option', { text: t, attrs: { value: w } })));
            art.value = z.art || 'zahl';
            const start = el('input', { attrs: { type: 'number', step: '1', 'aria-label': 'Startwert', placeholder: 'Start', value: z.start ?? 0 } });
            const max = el('input', { attrs: { type: 'number', step: '1', min: '0', 'aria-label': 'Höchstwert', placeholder: 'max', value: z.max ?? '' } });
            const zeile = el('div', { class: 'dsa-zaehler-zeile' }, [k, n, art, start, max,
                el('button', { class: 'dsa-stift', text: '×', attrs: { type: 'button', 'aria-label': 'Zähler entfernen' }, on: { click: () => zeile.remove() } })]);
            zeile.wert = () => ({ k: k.value.trim(), n: n.value.trim(), art: art.value, start: start.value.trim() === '' ? 0 : Number(start.value), max: max.value.trim() === '' ? null : Number(max.value) });
            return zeile;
        }

        b.eigenschaften.forEach((e) => (e.g === 'b' ? basisBox : eigBox).append(eigZeile(e, e.g === 'b' ? 'b' : 'e')));
        b.zaehler.forEach((z) => zaehlerBox.append(zaehlerZeile(z)));
        const knoepfe = formKnoepfe(null);

        async function absenden(ev) {
            ev.preventDefault();
            const eigenschaften = [...eigBox.children, ...basisBox.children].map((z) => z.wert()).filter((e) => e.k || e.n || e.w);
            const zaehler = [...zaehlerBox.children].map((z) => z.wert()).filter((z) => z.k || z.n);
            if (eigenschaften.some((e) => !e.k) || zaehler.some((z) => !z.k)) { status.textContent = 'Jede Zeile braucht ein Kürzel.'; return; }
            const werte = { ...bogenWerte(b), eigenschaften, zaehler };
            if (!await senden(status, knoepfe, 'bogen_speichern', { bogen: werte })) return;
            dialog.close();
            zeigeAlles();
            zeigeGespeichert();
        }

        oeffneDialog('Eigenschaften und Basiswerte', [
            el('form', { class: 'formular', on: { submit: absenden } }, [
                el('h3', { class: 'dsa-gruppe', text: 'Eigenschaften (oben in der Leiste)' }),
                el('p', { class: 'leise besitz-hinweis', text: 'Je Zeile Kürzel, Name und Wert.' }),
                eigBox,
                el('button', { class: 'knopf knopf-zweit', text: '+ Eigenschaft', attrs: { type: 'button' }, on: { click: () => eigBox.append(eigZeile({}, 'e')) } }),
                el('h3', { class: 'dsa-gruppe', text: 'Basiswerte' }),
                basisBox,
                el('button', { class: 'knopf knopf-zweit', text: '+ Basiswert', attrs: { type: 'button' }, on: { click: () => basisBox.append(eigZeile({}, 'b')) } }),
                el('h3', { class: 'dsa-gruppe', text: 'Zähler oben' }),
                el('p', { class: 'leise besitz-hinweis', text: 'Startwert ist der Stand vor dem Verlauf (Geld in Kreuzern: 1 D = 10 S = 100 H = 1000 K). Höchstwert zum Beispiel für LeP und AsP.' }),
                zaehlerBox,
                el('button', { class: 'knopf knopf-zweit', text: '+ Zähler', attrs: { type: 'button' }, on: { click: () => zaehlerBox.append(zaehlerZeile({ k: '', n: '', art: 'zahl', start: 0, max: null })) } }),
                status,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe)
            ])
        ]);
    }

    // --- Eintrag einer Liste anlegen (e = null) oder ändern ---
    function zeigeEintragForm(bogen, def, e, vorgabe = {}) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const eigene = daten.eintraege.filter((x) => x.bogen_id === bogen.id);
        const art = el('select', { attrs: { id: 'dsa-ein-art' } }, def.arten.map(([a, , einzel]) => el('option', { text: einzel, attrs: { value: a } })));
        art.value = e ? e.abschnitt : (vorgabe.abschnitt || def.arten[0][0]);
        const name = textFeld('dsa-ein-name', e && e.name, 80);
        const wert = textFeld('dsa-ein-wert', e && e.wert, 20);
        const probe = textFeld('dsa-ein-probe', e && e.probe, 30, { placeholder: def.probe || '' });
        let gruppe = null;
        if (def.art === 'gruppen') {
            gruppe = auswahlFeld({ id: 'dsa-ein-gruppe', maxlength: 40, placeholder: 'wählen oder eintippen' });
            gruppe.setzeEintraege(gruppenFolge([...TALENT_GRUPPEN, ...eigene.filter((x) => x.abschnitt === 'talent').map((x) => x.gruppe)], TALENT_GRUPPEN).filter(Boolean));
            gruppe.feld.value = e ? e.gruppe : (vorgabe.gruppe || '');
        }
        const zusatz = (def.felder || []).map(([k, t, typ]) => {
            const alt = e && e.felder ? e.felder[k] : null;
            if (typ === 'liste') {
                // Je Zeile ein Eintrag (zum Beispiel Modifikationen eines Zaubers)
                const f = el('textarea', { attrs: { id: 'dsa-ein-' + k, rows: 3, placeholder: 'freiwillig' } });
                f.value = Array.isArray(alt) ? alt.join('\n') : '';
                return { k, t, box: f, feld: f, wert: () => f.value.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 20) };
            }
            if (typ === 'haken') {
                const f = el('input', { attrs: { id: 'dsa-ein-' + k, type: 'checkbox', checked: alt === true } });
                return { k, t, haken: true, box: el('div', { class: 'uni-schalter' }, [f, el('label', { text: t, attrs: { for: f.id } })]), feld: f, wert: () => f.checked };
            }
            if (k === 'ort') {
                const a = auswahlFeld({ id: 'dsa-ein-ort', maxlength: 200, placeholder: 'wählen oder eintippen' });
                a.setzeEintraege(gruppenFolge(eigene.filter((x) => x.abschnitt === 'besitz').map((x) => String((x.felder && x.felder.ort) || ''))).filter(Boolean));
                a.feld.value = e ? ((e.felder && e.felder.ort) || '') : (vorgabe.ort || '');
                return { k, t, box: a.box, feld: a.feld, bleibt: true };
            }
            const f = textFeld('dsa-ein-' + k, e && e.felder && e.felder[k], 200);
            return { k, t, box: f, feld: f };
        });
        const text = el('textarea', { attrs: { id: 'dsa-ein-text', maxlength: 3000, rows: 3, placeholder: 'freiwillig' } });
        text.value = e ? e.text : '';
        const reihe = el('input', { attrs: { id: 'dsa-ein-reihe', type: 'number', inputmode: 'numeric', min: '1', max: '9999', step: '1', placeholder: 'leer = nach Name', value: e && e.reihenfolge ? e.reihenfolge : '' } });
        const knoepfe = formKnoepfe(e ? () => eintragLoeschen(e, status, knoepfe) : null, 'Löschen');
        // Beim Anlegen: speichern und gleich den nächsten eintragen (Gruppe, Ort und Art bleiben)
        let weiter = false;
        if (!e) knoepfe.splice(1, 0, el('button', { class: 'knopf knopf-zweit', text: 'Speichern und weiter', attrs: { type: 'submit' }, on: { click: () => { weiter = true; } } }));

        async function absenden(ev) {
            ev.preventDefault();
            const mitWeiter = weiter;
            weiter = false;
            if (!name.value.trim()) { status.textContent = 'Bitte einen Namen angeben.'; name.focus(); return; }
            const felder = {};
            zusatz.forEach((z) => {
                const v = z.wert ? z.wert() : z.feld.value.trim();
                if (Array.isArray(v) ? v.length : v) felder[z.k] = v;
            });
            if (e && e.felder) Object.keys(e.felder).forEach((k) => { if (!(def.felder || []).some(([x]) => x === k)) felder[k] = e.felder[k]; });
            const eintrag = {
                bogen_id: bogen.id, abschnitt: art.value, name: name.value.trim(), wert: def.wert ? wert.value.trim() : (e ? e.wert : ''),
                probe: def.probe ? probe.value.trim() : (e ? e.probe : ''), gruppe: gruppe ? gruppe.feld.value.trim() : (e ? e.gruppe : ''),
                felder, text: text.value.trim(), reihenfolge: reihe.value.trim() === '' ? 0 : Number(reihe.value)
            };
            if (e) Object.assign(eintrag, { id: e.id, geaendert_am: e.geaendert_am });
            if (!await senden(status, knoepfe, 'eintrag_speichern', { eintrag })) return;
            zeigeAlles();
            if (mitWeiter) {
                [name, wert, probe, text, reihe].forEach((f) => { f.value = ''; });
                zusatz.forEach((z) => { if (z.haken) z.feld.checked = false; else if (!z.bleibt) z.feld.value = ''; });
                status.textContent = 'Gespeichert: ' + eintrag.name + '. Jetzt den nächsten eintragen.';
                name.focus();
                return;
            }
            dialog.close();
            zeigeGespeichert();
        }

        const einzel = (def.arten.find(([a]) => a === art.value) || def.arten[0])[2];
        oeffneDialog(e ? einzel + ' bearbeiten' : 'Neu: ' + einzel, [
            el('form', { class: 'formular', on: { submit: absenden } }, [
                def.arten.length > 1 ? feld('dsa-ein-art', 'Art', art) : null,
                ...feld('dsa-ein-name', 'Name', name),
                ...(gruppe ? feld('dsa-ein-gruppe', 'Gruppe', gruppe.box) : []),
                ...(def.probe ? feld('dsa-ein-probe', 'Probe', probe) : []),
                ...(def.wert ? feld('dsa-ein-wert', def.wert, wert) : []),
                ...zusatz.flatMap((z) => (z.haken ? [z.box] : feld(z.feld.id, z.t, z.box))),
                ...feld('dsa-ein-text', def.text || 'Beschreibung', text),
                ...feld('dsa-ein-reihe', 'Reihenfolge (freiwillig)', reihe),
                status,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe)
            ].flat().filter(Boolean))
        ]);
        name.focus();
    }

    async function eintragLoeschen(e, status, knoepfe) {
        if (!confirm('„' + e.name + '“ löschen? (Im Sheet zurückholbar)')) return;
        if (!await senden(status, knoepfe, 'eintrag_loeschen', { id: e.id, geaendert_am: e.geaendert_am })) return;
        dialog.close();
        zeigeAlles();
        zeigeGespeichert('Gelöscht');
    }

    // --- Laden ---

    function setzeDaten(d) {
        daten = {
            boegen: Array.isArray(d.boegen) ? d.boegen : [],
            eintraege: Array.isArray(d.eintraege) ? d.eintraege : [],
            verlauf: Array.isArray(d.verlauf) ? d.verlauf : [],
            abenteuer: Array.isArray(d.abenteuer) ? d.abenteuer : [],
            sessions: Array.isArray(d.sessions) ? d.sessions : []
        };
        daten.boegen.forEach((b) => {
            b.kopf = b.kopf && typeof b.kopf === 'object' ? b.kopf : {};
            b.eigenschaften = Array.isArray(b.eigenschaften) ? b.eigenschaften : [];
            b.zaehler = Array.isArray(b.zaehler) ? b.zaehler : [];
        });
    }

    // Geteilter Bogen: das Skript schickt die aktuellen Werte. Sie werden zum Startwert, ein Verlauf fehlt.
    async function ladeGeteilt() {
        if (!KENNUNG.test(geteilt.kennung) || !SCHLUESSEL.test(geteilt.schluessel)) throw new Error('Dieser Link ist unvollständig. Bitte den ganzen Link öffnen.');
        const d = await apiOeffentlich('https://script.google.com/macros/s/' + geteilt.kennung + '/exec', 'geteilt', { schluessel: geteilt.schluessel });
        const b = d && d.bogen;
        if (!b || !b.id) throw new Error('Der Bogen kam nicht an.');
        b.zaehler = (Array.isArray(b.zaehler) ? b.zaehler : []).map((z) => ({ k: z.k, n: z.n, art: z.art, start: Number(z.stand) || 0, max: z.max }));
        const adresse = d.bild ? bildAdresse(d.bild) : null;
        b.bild = adresse ? 'geteilt-' + b.id : '';
        if (adresse) bilder.set(b.bild, adresse);
        return {
            boegen: [b], eintraege: (Array.isArray(d.eintraege) ? d.eintraege : []).map((e) => ({ ...e, bogen_id: b.id })), verlauf: [],
            abenteuer: (Array.isArray(d.abenteuer) ? d.abenteuer : []).map((a) => ({ ...a, art: 'spieler', bogen_id: b.id })),
            sessions: Array.isArray(d.sessions) ? d.sessions : []
        };
    }

    async function laden() {
        if (laedt) return;
        laedt = true;
        neuLaden.disabled = true;
        ladeStatus.textContent = daten ? 'Aktualisiere …' : 'Lade …';
        try {
            setzeDaten(nurLesen ? await ladeGeteilt() : await api('dsa', 'liste'));
            ladeStatus.textContent = '';
        } catch (e) {
            if (nurLesen) daten = null;
            ladeStatus.textContent = nurLesen ? e.message : e.code === 'aktion'
                ? 'Das Skript „dsa“ kennt diese Aktion nicht. Bitte die neue Fassung von Code.gs einfügen und eine neue Version bereitstellen.'
                : 'Laden fehlgeschlagen: ' + e.message;
        } finally {
            laedt = false;
            neuLaden.disabled = false;
            zeigeAlles();
        }
    }

    container.append(...[
        el('div', { class: 'dsa-titelzeile' }, [
            el('h1', { class: 'bereich-titel titel-mit-emoji' }, [
                el('img', { class: 'dsa-w20', attrs: { src: 'icons/w20.svg', alt: '', width: '44', height: '44' } }),
                el('span', { text: 'Pen & Paper' })
            ]),
            nurLesen ? null : neuKnopf
        ]),
        nurLesen ? el('p', { class: 'leise dsa-geteilt-hinweis', text: 'Geteilter Bogen, nur zum Ansehen.' }) : null,
        leiste,
        nameZeile,
        ladeStatus,
        oben,
        abschnitte,
        neuLaden,
        dialog,
        ...wuerfelKnopf()
    ].filter(Boolean));
    zeigeAlles();
    laden();
}
