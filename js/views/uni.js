// Reiter Uni (Etappe 5, Plan docs/PLAN-ETAPPE-5.md).
// Schritt 5.1: Semester wählen, anlegen und ändern; Stundenplan je Wochentag (jede Woche gleich).
// Schritt 5.2: Kalender (Woche, Monat, Liste, Filter nach Art), Termine, „einmal anders“ und „fällt aus“, Uni-Daten ohne Netz.
// Module (5.4) kommen später.
// Daten aus dem Skript „gemeinsam“ (Sheet „Gemeinsam“). Die Person darf ändern, Partner*in nur lesen.
// Die Rolle kommt mit jeder Antwort des Skripts; die App speichert sie nicht. Die Rechte prüft immer das Skript.
// Ohne Netz (Ausnahme in docs/STAND.md 4): Die zuletzt geladenen Uni-Daten liegen im Gerät (thetadex_uni), ohne Rolle.
// Dann gibt es keine Knöpfe zum Ändern; Ändern geht nur mit Netz.

import { el, leeren, heute, kalenderBeiKlick } from '../ui/dom.js';
import { api } from '../api.js';
import { lesen, schreiben } from '../store.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { zeichneKalender, eintragKnopf, ART_NAME, langDatum, zeitText } from './uni-kalender.js';
import { eintraegeAm, minuten, stundenText } from '../ui/kalender.js';

// Zuletzt geladene Daten { semester, stundenplan, termine, module, ects_ziel, rolle }, im Arbeitsspeicher
let daten = null;
// Gewähltes Semester (id). Bleibt, solange die Seite offen ist.
let semesterId = '';
// Kalender, Stundenplan oder Module. Bleibt, solange die Seite offen ist.
let teil = 'kalender';
// Kalender: Ansicht, Bezugstag und abgeschaltete Arten. Start mit der aktuellen Woche (Entscheidung der Person).
const kalender = { ansicht: 'woche', datum: heute(), aus: new Set() };
// true, wenn die Daten aus dem Gerät stammen (keine Verbindung)
let ohneNetz = false;

const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const ARTEN_STUNDE = [['vorlesung', 'Vorlesung, Übung, Seminar'], ['arbeit', 'Arbeit'], ['zug', 'Zug']];
const ARTEN_TERMIN = [['vorlesung', 'Vorlesung'], ['pruefung', 'Prüfung'], ['arbeit', 'Arbeit'], ['zug', 'Zug'],
    ['urlaub', 'Urlaub'], ['frei', 'Feiertag, vorlesungsfrei'], ['sonstiges', 'Sonstiges']];

const vergleiche = (a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true });
const datumText = (t) => (/^\d{4}-\d{2}-\d{2}$/.test(t) ? t.slice(8, 10) + '.' + t.slice(5, 7) + '.' + t.slice(0, 4) : '');
const liste = (x) => (Array.isArray(x) ? x : []);
const standText = (ms) => new Date(ms).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// Das Semester, in dem heute liegt, sonst das neueste
function vorgabeSemester() {
    const alle = daten ? daten.semester : [];
    const h = heute();
    const jetzt = alle.find((s) => s.beginn <= h && h <= s.ende);
    if (jetzt) return jetzt.id;
    const neuestes = [...alle].sort((a, b) => b.beginn.localeCompare(a.beginn))[0];
    return neuestes ? neuestes.id : '';
}

export function render(container, ctx) {
    const ladeStatus = el('p', { class: 'meldung besitz-lade', attrs: { role: 'status', 'aria-live': 'polite' } });
    const kalenderBox = el('div', { attrs: { id: 'uni-teil-kalender', hidden: true } });
    const planBox = el('div', { attrs: { id: 'uni-teil-stundenplan', hidden: true } });
    const moduleBox = el('div', { attrs: { id: 'uni-teil-module', hidden: true } }, [
        el('p', { class: 'leise', text: 'Die Module kommen mit Schritt 5.4.' })
    ]);
    const semesterLeiste = el('div', { class: 'uni-leiste' });
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'uni-dialog-titel' } });
    dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
    let sendet = false; // gegen doppeltes Senden durch mehrfaches Tippen

    const darfAendern = () => Boolean(daten) && daten.rolle === 'person' && !ohneNetz;
    const semesterVon = (id) => (daten ? daten.semester.find((s) => s.id === id) : null);
    const modulVon = (id) => (daten && id ? daten.module.find((m) => m.id === id) : null);

    function setzeDaten(d) {
        daten = {
            semester: liste(d.semester),
            stundenplan: liste(d.stundenplan),
            termine: liste(d.termine),
            module: liste(d.module),
            ects_ziel: Number(d.ects_ziel) || 0,
            rolle: d.rolle || (daten ? daten.rolle : '')
        };
        if (!semesterVon(semesterId)) semesterId = vorgabeSemester();
    }

    // Frische Daten vom Skript: annehmen und ohne Rolle im Gerät ablegen (für ohne Netz)
    function setzeFrisch(d) {
        setzeDaten(d);
        ohneNetz = false;
        const ohneRolle = { ...daten };
        delete ohneRolle.rolle;
        schreiben('uni', { stand: Date.now(), daten: ohneRolle });
    }

    // Ein Fenster mit Titel, Inhalt und Knöpfen
    function oeffneDialog(titel, inhalt) {
        leeren(dialog);
        dialog.append(el('div', { class: 'besitz-dialog-inhalt' }, [
            el('div', { class: 'form-kopf' }, [
                el('h2', { text: titel, attrs: { id: 'uni-dialog-titel' } }),
                el('button', { class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Schließen' }, on: { click: () => dialog.close() } })
            ]),
            ...inhalt
        ]));
        if (!dialog.open) dialog.showModal();
    }

    // Speichern oder Löschen: sperrt die Knöpfe, zeigt Fehler in status. Bei Erfolg kommen alle Uni-Daten zurück.
    async function senden(status, knoepfe, action, werte) {
        if (sendet) return false;
        sendet = true;
        knoepfe.forEach((k) => { k.disabled = true; });
        status.textContent = 'Sende …';
        try {
            setzeFrisch(await api('gemeinsam', action, werte));
            status.textContent = '';
            return true;
        } catch (e) {
            status.textContent = 'NICHT gespeichert: ' + e.message;
            return false;
        } finally {
            sendet = false;
            knoepfe.forEach((k) => { k.disabled = false; });
        }
    }

    // Formular-Knöpfe: Speichern, Abbrechen und (beim Ändern) Löschen
    function formKnoepfe(loeschen) {
        const ok = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        const weg = loeschen ? el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button' }, on: { click: loeschen } }) : null;
        return [ok, abbrechen, weg].filter(Boolean);
    }

    const datumFeld = (id, wert) => kalenderBeiKlick(el('input', { attrs: { id, type: 'date', value: wert || '' } }));

    // --- Semester anlegen oder ändern (s = null: neu) ---
    function zeigeSemesterForm(s) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const name = el('input', { attrs: { id: 'uni-sem-name', type: 'text', maxlength: 40, autocomplete: 'off', placeholder: 'zum Beispiel WiSe 26/27', value: s ? s.name : '' } });
        const beginn = datumFeld('uni-sem-beginn', s && s.beginn);
        const ende = datumFeld('uni-sem-ende', s && s.ende);
        const vBeginn = datumFeld('uni-sem-vbeginn', s && s.vorlesung_beginn);
        const vEnde = datumFeld('uni-sem-vende', s && s.vorlesung_ende);
        const knoepfe = formKnoepfe(s ? loeschen : null);

        async function absenden(ev) {
            ev.preventDefault();
            const eintrag = {
                name: name.value.trim(), beginn: beginn.value, ende: ende.value,
                vorlesung_beginn: vBeginn.value, vorlesung_ende: vEnde.value
            };
            if (!eintrag.name || !eintrag.beginn || !eintrag.ende || !eintrag.vorlesung_beginn || !eintrag.vorlesung_ende) {
                status.textContent = 'Bitte Name und alle vier Daten angeben.';
                return;
            }
            if (s) Object.assign(eintrag, { id: s.id, geaendert_am: s.geaendert_am });
            if (!await senden(status, knoepfe, 'uni_speichern', { blatt: 'semester', eintrag })) return;
            // Neues Semester gleich auswählen
            if (!s) {
                const neu = daten.semester.find((x) => x.name === eintrag.name);
                if (neu) semesterId = neu.id;
            }
            dialog.close();
            zeigeGespeichert(s ? 'Geändert' : 'Gespeichert', eintrag.name);
            zeigeAlles();
        }

        async function loeschen() {
            const n = daten.stundenplan.filter((x) => x.semester_id === s.id).length;
            const frage = '„' + s.name + '“ löschen?' + (n ? ' Der Stundenplan dieses Semesters (' + n + (n === 1 ? ' Eintrag' : ' Einträge') + ') wird mit gelöscht.' : '');
            if (!confirm(frage)) return;
            if (!await senden(status, knoepfe, 'uni_loeschen', { blatt: 'semester', id: s.id, geaendert_am: s.geaendert_am })) return;
            dialog.close();
            zeigeGespeichert('Gelöscht', s.name);
            zeigeAlles();
        }

        oeffneDialog(s ? 'Semester ändern' : 'Neues Semester', [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden } }, [
                el('label', { text: 'Name', attrs: { for: 'uni-sem-name' } }), name,
                el('label', { text: 'Semesterbeginn', attrs: { for: 'uni-sem-beginn' } }), beginn,
                el('label', { text: 'Semesterende', attrs: { for: 'uni-sem-ende' } }), ende,
                el('label', { text: 'Erster Vorlesungstag', attrs: { for: 'uni-sem-vbeginn' } }), vBeginn,
                el('label', { text: 'Letzter Vorlesungstag', attrs: { for: 'uni-sem-vende' } }), vEnde,
                el('p', { class: 'leise besitz-hinweis', text: 'Die Zeit im Semester außerhalb der Vorlesungen gilt als Semesterferien.' }),
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        name.focus();
    }

    // --- Eintrag im Stundenplan anlegen oder ändern (x = null: neu) ---
    function zeigeStundeForm(x) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const tag = el('select', { attrs: { id: 'uni-st-tag' } },
            TAGE.map((t, i) => el('option', { text: t, attrs: { value: i + 1, selected: x ? x.tag === i + 1 : i === 0 } })));
        const von = el('input', { attrs: { id: 'uni-st-von', type: 'time', value: x ? x.von : '' } });
        const bis = el('input', { attrs: { id: 'uni-st-bis', type: 'time', value: x ? x.bis : '' } });
        const titel = el('input', { attrs: { id: 'uni-st-titel', type: 'text', maxlength: 80, autocomplete: 'off', value: x ? x.titel : '' } });
        const art = el('select', { attrs: { id: 'uni-st-art' } },
            ARTEN_STUNDE.map(([k, t]) => el('option', { text: t, attrs: { value: k, selected: x ? x.art === k : k === 'vorlesung' } })));
        const ort = el('input', { attrs: { id: 'uni-st-ort', type: 'text', maxlength: 60, autocomplete: 'off', placeholder: 'Raum, bei Zug die Strecke', value: x ? x.ort : '' } });
        const notiz = el('input', { attrs: { id: 'uni-st-notiz', type: 'text', maxlength: 200, autocomplete: 'off', placeholder: 'freiwillig', value: x ? x.notiz : '' } });
        // Modul nur, wenn es schon Module gibt (Module kommen mit Schritt 5.4)
        const module = [...daten.module].sort((a, b) => vergleiche(a.name, b.name));
        const modul = module.length ? el('select', { attrs: { id: 'uni-st-modul' } }, [
            el('option', { text: '– kein Modul –', attrs: { value: '' } }),
            ...module.map((m) => el('option', { text: m.name, attrs: { value: m.id, selected: x ? x.modul_id === m.id : false } }))
        ]) : null;
        // Mit Modul und leerem Titel: der Modulname als Vorschlag
        if (modul) modul.addEventListener('change', () => { const m = modulVon(modul.value); if (m && !titel.value.trim()) titel.value = m.name; });
        const knoepfe = formKnoepfe(x ? loeschen : null);

        async function absenden(ev) {
            ev.preventDefault();
            const eintrag = {
                semester_id: x ? x.semester_id : semesterId, tag: Number(tag.value), von: von.value, bis: bis.value,
                titel: titel.value.trim(), art: art.value, ort: ort.value.trim(), modul_id: modul ? modul.value : (x ? x.modul_id : ''), notiz: notiz.value.trim()
            };
            if (!eintrag.von || !eintrag.bis) { status.textContent = 'Bitte Anfangs- und Endzeit angeben.'; return; }
            if (eintrag.bis <= eintrag.von) { status.textContent = 'Die Endzeit muss nach der Anfangszeit liegen.'; return; }
            if (!eintrag.titel) { status.textContent = 'Bitte einen Titel angeben.'; titel.focus(); return; }
            if (x) Object.assign(eintrag, { id: x.id, geaendert_am: x.geaendert_am });
            if (!await senden(status, knoepfe, 'uni_speichern', { blatt: 'stundenplan', eintrag })) return;
            dialog.close();
            zeigeGespeichert(x ? 'Geändert' : 'Gespeichert', eintrag.titel);
            zeigeAlles();
        }

        async function loeschen() {
            if (!confirm('„' + x.titel + '“ (' + TAGE[x.tag - 1] + ') aus dem Stundenplan löschen?')) return;
            if (!await senden(status, knoepfe, 'uni_loeschen', { blatt: 'stundenplan', id: x.id, geaendert_am: x.geaendert_am })) return;
            dialog.close();
            zeigeGespeichert('Gelöscht', x.titel);
            zeigeAlles();
        }

        oeffneDialog(x ? 'Eintrag ändern' : 'Neuer Eintrag', [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden } }, [
                el('label', { text: 'Wochentag', attrs: { for: 'uni-st-tag' } }), tag,
                el('div', { class: 'uni-zeiten' }, [
                    el('div', {}, [el('label', { text: 'Von', attrs: { for: 'uni-st-von' } }), von]),
                    el('div', {}, [el('label', { text: 'Bis', attrs: { for: 'uni-st-bis' } }), bis])
                ]),
                el('label', { text: 'Art', attrs: { for: 'uni-st-art' } }), art,
                modul ? el('label', { text: 'Modul', attrs: { for: 'uni-st-modul' } }) : null, modul,
                el('label', { text: 'Titel', attrs: { for: 'uni-st-titel' } }), titel,
                el('label', { text: 'Raum oder Strecke', attrs: { for: 'uni-st-ort' } }), ort,
                el('label', { text: 'Notiz', attrs: { for: 'uni-st-notiz' } }), notiz,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        (x ? titel : von).focus();
    }

    // --- Ein Eintrag zum Lesen; die Person hat „Bearbeiten“ ---
    function zeigeStunde(x) {
        const m = modulVon(x.modul_id);
        const angaben = [
            ['Wann', TAGE[x.tag - 1] + ', ' + x.von + '–' + x.bis + ' Uhr'],
            ['Art', ART_NAME[x.art] || x.art],
            [x.art === 'zug' ? 'Strecke' : 'Raum', x.ort],
            ['Modul', m ? m.name : ''],
            ['Notiz', x.notiz]
        ].filter(([, w]) => w);
        oeffneDialog(x.titel, [
            el('dl', { class: 'besitz-angaben' }, angaben.flatMap(([k, w]) => [el('dt', { text: k }), el('dd', { text: w })])),
            darfAendern() ? el('div', { class: 'besitz-form-knoepfe' }, [
                el('button', { class: 'knopf knopf-bereich', text: 'Bearbeiten', attrs: { type: 'button' }, on: { click: () => zeigeStundeForm(x) } })
            ]) : null
        ]);
    }

    // --- Semester-Auswahl oben ---
    function zeigeSemesterLeiste() {
        leeren(semesterLeiste);
        if (!daten) return;
        const alle = [...daten.semester].sort((a, b) => b.beginn.localeCompare(a.beginn));
        if (alle.length) {
            const wahl = el('select', { attrs: { id: 'uni-semester', 'aria-label': 'Semester wählen' }, on: { change: () => { semesterId = wahl.value; zeigeAlles(); } } },
                alle.map((s) => el('option', { text: s.name, attrs: { value: s.id, selected: s.id === semesterId } })));
            semesterLeiste.append(wahl);
            const s = semesterVon(semesterId);
            if (s) {
                semesterLeiste.append(el('span', { class: 'leise uni-zeitraum', text: 'Vorlesungen ' + datumText(s.vorlesung_beginn) + ' bis ' + datumText(s.vorlesung_ende) }));
            }
        }
        if (darfAendern()) {
            const s = semesterVon(semesterId);
            if (s) semesterLeiste.append(el('button', { class: 'knopf knopf-zweit', text: 'Bearbeiten', attrs: { type: 'button' }, on: { click: () => zeigeSemesterForm(s) } }));
            semesterLeiste.append(el('button', { class: 'knopf knopf-zweit', text: '+ Semester', attrs: { type: 'button' }, on: { click: () => zeigeSemesterForm(null) } }));
        }
    }

    // --- Stundenplan: je Wochentag eine Karte ---
    function zeigePlan() {
        leeren(planBox);
        if (!daten) return;
        if (!semesterVon(semesterId)) {
            planBox.append(el('p', { class: 'leise', text: darfAendern() ? 'Noch kein Semester. Lege mit „+ Semester“ das erste an.' : 'Noch kein Semester eingetragen.' }));
            return;
        }
        if (darfAendern()) {
            planBox.append(el('button', { class: 'knopf knopf-bereich uni-neu', text: '+ Eintrag', attrs: { type: 'button' }, on: { click: () => zeigeStundeForm(null) } }));
        }
        const eintraege = daten.stundenplan.filter((x) => x.semester_id === semesterId);
        if (!eintraege.length) {
            planBox.append(el('p', { class: 'leise', text: 'Noch keine Einträge in diesem Semester.' }));
            return;
        }
        // Arbeit je Woche laut Stundenplan (ohne „einmal anders“ und Urlaub; das zeigt der Kalender)
        const arbeit = eintraege.filter((x) => x.art === 'arbeit').reduce((n, x) => n + minuten(x.bis) - minuten(x.von), 0);
        if (arbeit) planBox.append(el('p', { class: 'uni-stunden', text: 'Arbeit: ' + stundenText(arbeit) + ' je Woche' }));
        TAGE.forEach((name, i) => {
            const amTag = eintraege.filter((x) => x.tag === i + 1).sort((a, b) => a.von.localeCompare(b.von) || vergleiche(a.titel, b.titel));
            if (!amTag.length) return;
            planBox.append(el('section', { class: 'uni-tag' }, [
                el('h2', { class: 'besitz-ort', text: name }),
                el('ul', { class: 'einkauf-liste' }, amTag.map((x) => el('li', {}, [
                    el('button', { class: 'uni-eintrag', attrs: { type: 'button', 'data-art': x.art }, on: { click: () => zeigeStunde(x) } }, [
                        el('span', { class: 'uni-zeit', text: x.von + '–' + x.bis }),
                        el('span', { class: 'uni-was' }, [
                            el('span', { class: 'uni-titel', text: x.titel }),
                            el('span', { class: 'leise einkauf-klein', text: [ART_NAME[x.art] || x.art, x.ort].filter(Boolean).join(' · ') })
                        ])
                    ])
                ])))
            ]));
        });
    }

    // --- Termin anlegen oder ändern ---
    // x = Termin oder null (neu). vorgabe = { beginn } für einen neuen Termin an einem Tag,
    // oder { beginn, stunde } für „Nur an diesem Tag ändern“ (Termin mit stunde_id, nur Uhrzeit, Titel, Raum, Notiz).
    function zeigeTerminForm(x, vorgabe = {}) {
        const stunde = x && x.stunde_id ? daten.stundenplan.find((s) => s.id === x.stunde_id) : vorgabe.stunde;
        const anders = Boolean(stunde);
        const quelle = x || (stunde ? { ...stunde, beginn: vorgabe.beginn, ende: '' } : { beginn: vorgabe.beginn || heute() });
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const titel = el('input', { attrs: { id: 'uni-te-titel', type: 'text', maxlength: 80, autocomplete: 'off', value: quelle.titel || '' } });
        const art = el('select', { attrs: { id: 'uni-te-art' } },
            ARTEN_TERMIN.map(([k, t]) => el('option', { text: t, attrs: { value: k, selected: (quelle.art || 'sonstiges') === k } })));
        const beginn = datumFeld('uni-te-beginn', quelle.beginn);
        const ende = datumFeld('uni-te-ende', quelle.ende);
        const von = el('input', { attrs: { id: 'uni-te-von', type: 'time', value: quelle.von || '' } });
        const bis = el('input', { attrs: { id: 'uni-te-bis', type: 'time', value: quelle.bis || '' } });
        const ort = el('input', { attrs: { id: 'uni-te-ort', type: 'text', maxlength: 60, autocomplete: 'off', placeholder: 'Raum, bei Zug die Strecke', value: quelle.ort || '' } });
        const notiz = el('input', { attrs: { id: 'uni-te-notiz', type: 'text', maxlength: 200, autocomplete: 'off', placeholder: 'freiwillig', value: quelle.notiz || '' } });
        const module = [...daten.module].sort((a, b) => vergleiche(a.name, b.name));
        const modul = module.length && !anders ? el('select', { attrs: { id: 'uni-te-modul' } }, [
            el('option', { text: '– kein Modul –', attrs: { value: '' } }),
            ...module.map((m) => el('option', { text: m.name, attrs: { value: m.id, selected: quelle.modul_id === m.id } }))
        ]) : null;
        const knoepfe = formKnoepfe(x ? loeschen : null);

        async function absenden(ev) {
            ev.preventDefault();
            const eintrag = {
                titel: titel.value.trim(), art: anders ? stunde.art : art.value, beginn: anders ? quelle.beginn : beginn.value,
                ende: anders ? '' : ende.value, von: von.value, bis: bis.value, ort: ort.value.trim(),
                modul_id: modul ? modul.value : (quelle.modul_id || ''), stunde_id: anders ? stunde.id : '', notiz: notiz.value.trim()
            };
            if (!eintrag.titel) { status.textContent = 'Bitte einen Titel angeben.'; titel.focus(); return; }
            if (!eintrag.beginn) { status.textContent = 'Bitte den ersten Tag angeben.'; return; }
            if (eintrag.ende && eintrag.ende < eintrag.beginn) { status.textContent = 'Der letzte Tag darf nicht vor dem ersten liegen.'; return; }
            if (anders && (!eintrag.von || !eintrag.bis)) { status.textContent = 'Bitte die Zeit an diesem Tag angeben.'; return; }
            if (Boolean(eintrag.von) !== Boolean(eintrag.bis)) { status.textContent = 'Bitte beide Uhrzeiten angeben oder keine (ganztägig).'; return; }
            if (eintrag.von && (!eintrag.ende || eintrag.ende === eintrag.beginn) && eintrag.bis <= eintrag.von) { status.textContent = 'Die Endzeit muss nach der Anfangszeit liegen.'; return; }
            if (x) Object.assign(eintrag, { id: x.id, geaendert_am: x.geaendert_am });
            if (!await senden(status, knoepfe, 'uni_speichern', { blatt: 'termine', eintrag })) return;
            dialog.close();
            zeigeGespeichert(x ? 'Geändert' : 'Gespeichert', eintrag.titel);
            zeigeAlles();
        }

        async function loeschen() {
            const frage = anders ? 'Wieder wie immer? „' + x.titel + '“ gilt dann an diesem Tag wieder wie im Stundenplan.' : '„' + x.titel + '“ löschen?';
            if (!confirm(frage)) return;
            if (!await senden(status, knoepfe, 'uni_loeschen', { blatt: 'termine', id: x.id, geaendert_am: x.geaendert_am })) return;
            dialog.close();
            zeigeGespeichert(anders ? 'Wie immer' : 'Gelöscht', x.titel);
            zeigeAlles();
        }

        oeffneDialog(anders ? 'Nur am ' + langDatum(quelle.beginn) : (x ? 'Termin ändern' : 'Neuer Termin'), [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden } }, [
                anders ? el('p', { class: 'leise besitz-hinweis', text: 'Gilt nur an diesem Tag. Der Stundenplan bleibt, wie er ist.' }) : null,
                anders ? null : el('label', { text: 'Art', attrs: { for: 'uni-te-art' } }), anders ? null : art,
                modul ? el('label', { text: 'Modul', attrs: { for: 'uni-te-modul' } }) : null, modul,
                el('label', { text: 'Titel', attrs: { for: 'uni-te-titel' } }), titel,
                anders ? null : el('div', { class: 'uni-zeiten' }, [
                    el('div', {}, [el('label', { text: 'Erster Tag', attrs: { for: 'uni-te-beginn' } }), beginn]),
                    el('div', {}, [el('label', { text: 'Letzter Tag (freiwillig)', attrs: { for: 'uni-te-ende' } }), ende])
                ]),
                el('div', { class: 'uni-zeiten' }, [
                    el('div', {}, [el('label', { text: 'Von', attrs: { for: 'uni-te-von' } }), von]),
                    el('div', {}, [el('label', { text: 'Bis', attrs: { for: 'uni-te-bis' } }), bis])
                ]),
                anders ? null : el('p', { class: 'leise besitz-hinweis', text: 'Ohne Uhrzeit gilt der Termin den ganzen Tag.' }),
                el('label', { text: 'Raum oder Strecke', attrs: { for: 'uni-te-ort' } }), ort,
                el('label', { text: 'Notiz', attrs: { for: 'uni-te-notiz' } }), notiz,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        if (x && anders) knoepfe[knoepfe.length - 1].textContent = 'Wieder wie immer';
        (anders ? von : titel).focus();
    }

    // Wöchentlichen Eintrag an einem Tag ausfallen lassen (Termin mit stunde_id ohne Uhrzeit)
    async function ausfallen(stunde, tag, status, knoepfe) {
        if (!confirm('„' + stunde.titel + '“ fällt am ' + langDatum(tag) + ' aus?')) return;
        const eintrag = { titel: stunde.titel, art: stunde.art, beginn: tag, ende: '', von: '', bis: '', ort: '', modul_id: '', stunde_id: stunde.id, notiz: '' };
        if (!await senden(status, knoepfe, 'uni_speichern', { blatt: 'termine', eintrag })) return;
        dialog.close();
        zeigeGespeichert('Fällt aus', stunde.titel);
        zeigeAlles();
    }

    // „Einmal anders“ oder „fällt aus“ zurücknehmen
    async function wieImmer(termin, status, knoepfe) {
        if (!await senden(status, knoepfe, 'uni_loeschen', { blatt: 'termine', id: termin.id, geaendert_am: termin.geaendert_am })) return;
        dialog.close();
        zeigeGespeichert('Wie immer', termin.titel);
        zeigeAlles();
    }

    // --- Ein Eintrag aus dem Kalender (an Tag t) ---
    function zeigeKalenderEintrag(e, t) {
        const m = modulVon(e.modul_id);
        const termin = e.termin;
        let wann = langDatum(t) + ', ' + zeitText(e);
        if (termin && termin.ende && termin.ende !== termin.beginn) wann = langDatum(termin.beginn) + ' bis ' + langDatum(termin.ende) + (termin.von ? ', ' + termin.von + '–' + termin.bis + ' Uhr' : '');
        const angaben = [
            ['Wann', wann],
            ['Art', ART_NAME[e.art] || e.art],
            [e.art === 'zug' ? 'Strecke' : 'Raum', e.ort],
            ['Modul', m ? m.name : ''],
            ['Notiz', termin ? termin.notiz : (e.stunde ? e.stunde.notiz : '')],
            ['Hinweis', e.ausfall ? 'Fällt an diesem Tag aus.' : (e.einmalig ? 'Nur an diesem Tag geändert. Sonst ' + e.stunde.von + '–' + e.stunde.bis + '.' : (e.stunde ? 'Jede Woche (Stundenplan).' : ''))]
        ].filter(([, w]) => w);
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const knoepfe = [];
        if (darfAendern()) {
            const k = (text, fn, haupt = false) => knoepfe.push(el('button', { class: 'knopf ' + (haupt ? 'knopf-bereich' : 'knopf-zweit'), text, attrs: { type: 'button' }, on: { click: fn } }));
            if (e.stunde && (e.einmalig || e.ausfall)) {
                if (e.einmalig) k('Zeit ändern', () => zeigeTerminForm(termin), true);
                k('Wieder wie immer', () => wieImmer(termin, status, knoepfe));
            } else if (e.stunde) {
                k('Nur an diesem Tag ändern', () => zeigeTerminForm(null, { beginn: t, stunde: e.stunde }), true);
                k('Fällt an diesem Tag aus', () => ausfallen(e.stunde, t, status, knoepfe));
                k('Jede Woche ändern', () => zeigeStundeForm(e.stunde));
            } else {
                k('Bearbeiten', () => zeigeTerminForm(termin), true);
            }
        }
        oeffneDialog(e.titel, [
            el('dl', { class: 'besitz-angaben' }, angaben.flatMap(([k, w]) => [el('dt', { text: k }), el('dd', { text: w })])),
            knoepfe.length ? el('div', { class: 'besitz-form-knoepfe' }, knoepfe) : null,
            status
        ]);
    }

    // --- Alle Einträge eines Tages (Tipp im Monat) ---
    function zeigeTag(t) {
        const info = eintraegeAm(t, daten);
        oeffneDialog(langDatum(t), [
            info.ferien ? el('p', { class: 'leise besitz-hinweis', text: 'Semesterferien' }) : null,
            info.eintraege.length
                ? el('ul', { class: 'einkauf-liste' }, info.eintraege.map((e) => el('li', {}, [eintragKnopf(e, () => zeigeKalenderEintrag(e, t))])))
                : el('p', { class: 'leise', text: 'Nichts eingetragen.' }),
            darfAendern() ? el('div', { class: 'besitz-form-knoepfe' }, [
                el('button', { class: 'knopf knopf-bereich', text: '+ Termin an diesem Tag', attrs: { type: 'button' }, on: { click: () => zeigeTerminForm(null, { beginn: t }) } })
            ]) : null
        ]);
    }

    function zeigeKalender() {
        leeren(kalenderBox);
        if (!daten) return;
        const knoepfe = darfAendern()
            ? [el('button', { class: 'knopf knopf-bereich', text: '+ Termin', attrs: { type: 'button' }, on: { click: () => zeigeTerminForm(null, { beginn: kalender.ansicht === 'woche' && kalender.datum < heute() ? heute() : kalender.datum }) } })]
            : [];
        zeichneKalender(kalenderBox, {
            daten, zustand: kalender, knoepfe,
            beiEintrag: zeigeKalenderEintrag, beiTag: zeigeTag, neuZeichnen: zeigeKalender
        });
    }

    function zeigeAlles() {
        zeigeSemesterLeiste();
        zeigePlan();
        zeigeKalender();
    }

    // --- Unterreiter ---
    const teile = [['kalender', 'Kalender', kalenderBox], ['stundenplan', 'Stundenplan', planBox], ['module', 'Module', moduleBox]].map(([id, text, box]) => [
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
    }

    // --- Laden: beim Öffnen und mit „Neu laden“ ---
    const neuLaden = el('button', { class: 'knopf knopf-zweit besitz-neu', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => laden() } });
    let laedt = false;
    async function laden() {
        if (laedt || !container.isConnected) return;
        laedt = true;
        neuLaden.disabled = true;
        ladeStatus.textContent = daten ? 'Aktualisiere …' : 'Lädt …';
        try {
            setzeFrisch(await api('gemeinsam', 'uni'));
            ladeStatus.textContent = '';
        } catch (e) {
            // Ohne Netz: die Uni-Daten aus dem Gerät zeigen, ohne Knöpfe zum Ändern
            const im = lesen('uni', null);
            if (e.code === 'netz' && im && im.daten) {
                if (!daten || ohneNetz) setzeDaten(im.daten);
                ohneNetz = true;
                ladeStatus.textContent = 'Ohne Verbindung: Stand von ' + standText(im.stand) + ' Uhr. Ändern geht nur mit Netz.';
            } else {
                ladeStatus.textContent = e.code === 'aktion'
                    ? 'Das Skript „gemeinsam“ kennt Uni noch nicht. Bitte die neue Fassung von Code.gs einfügen und eine neue Version bereitstellen.'
                    : 'Laden fehlgeschlagen: ' + e.message;
            }
        } finally {
            laedt = false;
            neuLaden.disabled = false;
            zeigeAlles();
        }
    }

    container.append(
        el('h1', { class: 'bereich-titel titel-mit-emoji' }, [
            el('span', { class: 'titel-emoji', text: '🎓', attrs: { 'aria-hidden': 'true' } }),
            el('span', { text: ctx.bereich.titel })
        ]),
        semesterLeiste,
        el('div', { class: 'ansichten' }, teile.map(([, knopf]) => knopf)),
        ladeStatus,
        kalenderBox,
        planBox,
        moduleBox,
        neuLaden,
        dialog
    );
    // Gleich zeigen, was im Gerät liegt (ohne Knöpfe), dann frisch laden
    const imGeraet = lesen('uni', null);
    if (!daten && imGeraet && imGeraet.daten) { setzeDaten(imGeraet.daten); ohneNetz = true; }
    zeigeTeil(teil);
    zeigeAlles();
    laden();
}
