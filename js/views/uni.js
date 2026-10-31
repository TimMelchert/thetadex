// Reiter Uni (Etappe 5, Regeln in docs/STAND.md 4 „Uni, Sheet ‚Gemeinsam‘“).
// Schritt 5.1: Semester wählen, anlegen und ändern; Stundenplan je Wochentag (jede Woche gleich).
// Schritt 5.2: Kalender (Woche, Monat, Liste, Filter nach Art), Termine, „einmal anders“ und „fällt aus“, Uni-Daten ohne Netz.
// Schritt 5.3: Arbeitsstunden. Schritt 5.4: Module mit Master-Übersicht (… von 120 ECTS, Ziel aus dem Blatt uni_einstellungen).
// Schritt 5.5: Kein Stundenplan mehr. Module haben Kurse (jede Woche in der Vorlesungszeit), Prüfungen hängen an einem Kurs
// und können bestanden sein. Termine können jede Woche an bestimmten Tagen gelten. Fenster gehen nur mit × oder Abbrechen zu.
// Daten aus dem Skript „gemeinsam“ (Sheet „Gemeinsam“). Die Person darf ändern, Partner*in nur lesen.
// Die Rolle kommt mit jeder Antwort des Skripts; die App speichert sie nicht. Die Rechte prüft immer das Skript.
// Ohne Netz (Ausnahme in docs/STAND.md 4): Die zuletzt geladenen Uni-Daten liegen im Gerät (thetadex_uni), ohne Rolle.
// Dann gibt es keine Knöpfe zum Ändern; Ändern geht nur mit Netz.

import { el, leeren, heute, kalenderBeiKlick } from '../ui/dom.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { api } from '../api.js';
import { lesen, schreiben } from '../store.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { zeichneKalender, eintragKnopf, ART_NAME, langDatum, zeitText } from './uni-kalender.js';
import { eintraegeAm, tageListe } from '../ui/kalender.js';

// Zuletzt geladene Daten { semester, module, kurse, termine, ects_ziel, rolle }, im Arbeitsspeicher
let daten = null;
// Gewähltes Semester (id). Bleibt, solange die Seite offen ist.
let semesterId = '';
// Kalender oder Module. Bleibt, solange die Seite offen ist.
let teil = 'kalender';
// Kalender: Ansicht, Bezugstag und abgeschaltete Arten. Start mit der aktuellen Woche (Entscheidung der Person).
const kalender = { ansicht: 'woche', datum: heute(), aus: new Set() };
// true, wenn die Daten aus dem Gerät stammen (keine Verbindung)
let ohneNetz = false;

const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const TAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
// „Urlaub“ steht auch für Feiertage und vorlesungsfreie Tage (frühere Art „frei“)
const ARTEN_TERMIN = [['vorlesung', 'Vorlesung, Übung, Seminar'], ['pruefung', 'Prüfung'], ['arbeit', 'Arbeit'], ['zug', 'Zug'],
    ['urlaub', 'Urlaub, Feiertag, frei'], ['hobby', 'Hobby'], ['sonstiges', 'Sonstiges']];

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
    const moduleBox = el('div', { attrs: { id: 'uni-teil-module', hidden: true } });
    const semesterLeiste = el('div', { class: 'uni-leiste' });
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'uni-dialog-titel' } });
    // Nur × und Abbrechen schließen (kein Tipp daneben, keine Escape-Taste), damit nichts Eingetipptes verloren geht
    dialog.addEventListener('cancel', (ev) => ev.preventDefault());
    let sendet = false; // gegen doppeltes Senden durch mehrfaches Tippen

    const darfAendern = () => Boolean(daten) && daten.rolle === 'person' && !ohneNetz;
    const semesterVon = (id) => (daten ? daten.semester.find((s) => s.id === id) : null);
    const modulVon = (id) => (daten && id ? daten.module.find((m) => m.id === id) : null);

    function setzeDaten(d) {
        daten = {
            semester: liste(d.semester),
            module: liste(d.module),
            kurse: liste(d.kurse),
            termine: liste(d.termine),
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
            if (!confirm('„' + s.name + '“ löschen? Module und Kurse bleiben, sie werden nur aus dem Semester ausgetragen.')) return;
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

    // Auswahl der Semester, neueste zuerst; leer = erste Zeile
    const semesterWahl = (id, gewaehlt, leerText) => el('select', { attrs: { id } }, [
        el('option', { text: leerText, attrs: { value: '' } }),
        ...[...daten.semester].sort((a, b) => b.beginn.localeCompare(a.beginn))
            .map((x) => el('option', { text: x.name, attrs: { value: x.id, selected: gewaehlt === x.id } }))
    ]);
    const ectsPasst = (t) => { const n = Number(t); return t === '' || (Number.isFinite(n) && n >= 0 && n <= 60 && Math.round(n * 2) === n * 2); };
    const ectsFeld = (id, wert) => el('input', { attrs: { id, type: 'text', inputmode: 'decimal', maxlength: 4, autocomplete: 'off', value: wert != null ? String(wert).replace('.', ',') : '' } });

    // Beim Anlegen eines Moduls oder Kurses gleich eine Prüfung eintragen (freiwillig; leer = keine).
    // id = Vorsilbe der Feld-ids. Liefert { box, werte(), fehler() }.
    function pruefungGleich(id) {
        const leistung = el('input', { attrs: { id: id + '-leistung', type: 'text', maxlength: 80, autocomplete: 'off', placeholder: 'zum Beispiel Klausur 90 Minuten' } });
        const datum = datumFeld(id + '-datum', '');
        const von = el('input', { attrs: { id: id + '-von', type: 'time' } });
        const bis = el('input', { attrs: { id: id + '-bis', type: 'time' } });
        const ort = el('input', { attrs: { id: id + '-ort', type: 'text', maxlength: 60, autocomplete: 'off', placeholder: 'freiwillig' } });
        const box = el('fieldset', { class: 'uni-wiederholen' }, [
            el('legend', { text: 'Prüfung gleich eintragen (freiwillig)' }),
            el('div', { class: 'formular uni-ohne-rand' }, [
                el('label', { text: 'Art der Prüfung', attrs: { for: id + '-leistung' } }), leistung,
                el('label', { text: 'Datum (oder Abgabetag)', attrs: { for: id + '-datum' } }), datum,
                el('div', { class: 'uni-zeiten' }, [
                    el('div', {}, [el('label', { text: 'Von', attrs: { for: id + '-von' } }), von]),
                    el('div', {}, [el('label', { text: 'Bis', attrs: { for: id + '-bis' } }), bis])
                ]),
                el('label', { text: 'Raum', attrs: { for: id + '-ort' } }), ort,
                el('p', { class: 'leise besitz-hinweis', text: 'Ohne Datum wird keine Prüfung angelegt. Weitere Prüfungen später mit „+ Prüfung“.' })
            ])
        ]);
        const werte = () => ({ leistung: leistung.value.trim(), beginn: datum.value, von: von.value, bis: bis.value, ort: ort.value.trim() });
        function fehler() {
            const w = werte();
            if (!w.beginn) return (w.leistung || w.von || w.bis || w.ort) ? 'Für die Prüfung bitte ein Datum angeben (oder die Felder leeren).' : '';
            if (Boolean(w.von) !== Boolean(w.bis)) return 'Prüfung: bitte beide Uhrzeiten angeben oder keine.';
            if (w.von && w.bis <= w.von) return 'Prüfung: die Endzeit muss nach der Anfangszeit liegen.';
            return '';
        }
        return { box, werte, fehler };
    }

    // Nach dem Speichern eines neuen Moduls oder Kurses: die Prüfung dazu anlegen.
    // vorher = ids vor dem Speichern; zu = { modul_id } oder { kurs_id }. Klappt es nicht, öffnet sich das Prüfungs-Formular vorbefüllt.
    async function pruefungNachAnlegen(p, liste, vorher, titel, zuSchluessel, status, knoepfe) {
        const w = p.werte();
        if (!w.beginn) return;
        const neu = liste().find((x) => !vorher.has(x.id));
        if (!neu) return;
        const eintrag = {
            titel, art: 'pruefung', beginn: w.beginn, ende: '', von: w.von, bis: w.bis, tage: '', ort: w.ort,
            modul_id: '', kurs_id: '', stunde_id: '', bestanden: false, leistung: w.leistung, notiz: ''
        };
        eintrag[zuSchluessel] = neu.id;
        if (await senden(status, knoepfe, 'uni_speichern', { blatt: 'termine', eintrag })) return;
        const grund = status.textContent;
        zeigeAlles();
        zeigeTerminForm(null, { ...eintrag, hinweis: titel + ' ist gespeichert, die Prüfung noch nicht (' + grund + '). Bitte hier noch einmal speichern.' });
        return 'offen';
    }

    // --- Kurs anlegen oder ändern (k = null: neu, vorgabe = { modul_id }) ---
    // Ein Kurs gehört zu einem Modul. Mit Tag und Uhrzeit steht er jede Woche in der Vorlesungszeit im Kalender.
    function zeigeKursForm(k, vorgabe = {}) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const modulId = k ? k.modul_id : vorgabe.modul_id;
        const modul = el('select', { attrs: { id: 'uni-ku-modul' } }, [...daten.module].sort((a, b) => vergleiche(a.name, b.name))
            .map((m) => el('option', { text: m.name, attrs: { value: m.id, selected: m.id === modulId } })));
        const name = el('input', { attrs: { id: 'uni-ku-name', type: 'text', maxlength: 80, autocomplete: 'off', placeholder: 'zum Beispiel Vorlesung oder Übung', value: k ? k.name : '' } });
        const ects = ectsFeld('uni-ku-ects', k ? k.ects : null);
        const semester = semesterWahl('uni-ku-semester', k ? k.semester_id : '', 'wie das Modul');
        const tag = el('select', { attrs: { id: 'uni-ku-tag' } }, [
            el('option', { text: '– kein fester Tag –', attrs: { value: '' } }),
            ...TAGE.map((t, i) => el('option', { text: t, attrs: { value: i + 1, selected: k ? k.tag === i + 1 : false } }))
        ]);
        const von = el('input', { attrs: { id: 'uni-ku-von', type: 'time', value: k ? k.von : '' } });
        const bis = el('input', { attrs: { id: 'uni-ku-bis', type: 'time', value: k ? k.bis : '' } });
        const ort = el('input', { attrs: { id: 'uni-ku-ort', type: 'text', maxlength: 60, autocomplete: 'off', placeholder: 'freiwillig', value: k ? k.ort : '' } });
        const dozent = el('input', { attrs: { id: 'uni-ku-dozent', type: 'text', maxlength: 60, autocomplete: 'off', placeholder: 'freiwillig', value: k ? k.dozent : '' } });
        // Die Art der Prüfung steht seit 0.5.7 bei der Prüfung. Ein alter Eintrag hier bleibt sichtbar, bis er geleert ist.
        const altLeistung = k && k.pruefungsleistung ? el('input', { attrs: { id: 'uni-ku-leistung', type: 'text', maxlength: 80, autocomplete: 'off', value: k.pruefungsleistung } }) : null;
        const pruefung = k ? null : pruefungGleich('uni-ku-pr');
        const notiz = el('input', { attrs: { id: 'uni-ku-notiz', type: 'text', maxlength: 200, autocomplete: 'off', placeholder: 'freiwillig', value: k ? k.notiz : '' } });
        const knoepfe = formKnoepfe(k ? loeschen : null);

        async function absenden(ev) {
            ev.preventDefault();
            const eintrag = {
                modul_id: modul.value, name: name.value.trim(), ects: ects.value.trim().replace(',', '.'), semester_id: semester.value,
                tag: tag.value, von: von.value, bis: bis.value, ort: ort.value.trim(), dozent: dozent.value.trim(),
                pruefungsleistung: altLeistung ? altLeistung.value.trim() : '', notiz: notiz.value.trim()
            };
            if (!eintrag.name) { status.textContent = 'Bitte einen Namen angeben.'; name.focus(); return; }
            if (pruefung && pruefung.fehler()) { status.textContent = pruefung.fehler(); return; }
            if (!ectsPasst(eintrag.ects)) { status.textContent = 'ECTS bitte als Zahl von 0 bis 60 (halbe erlaubt).'; ects.focus(); return; }
            const mitZeit = [eintrag.tag, eintrag.von, eintrag.bis].filter(Boolean).length;
            if (mitZeit !== 0 && mitZeit !== 3) { status.textContent = 'Bitte Tag, Anfang und Ende angeben oder alle drei leer lassen.'; return; }
            if (eintrag.von && eintrag.bis <= eintrag.von) { status.textContent = 'Die Endzeit muss nach der Anfangszeit liegen.'; return; }
            if (k) Object.assign(eintrag, { id: k.id, geaendert_am: k.geaendert_am });
            const vorher = new Set(daten.kurse.map((x) => x.id));
            if (!await senden(status, knoepfe, 'uni_speichern', { blatt: 'kurse', eintrag })) return;
            if (pruefung) {
                const m = modulVon(eintrag.modul_id);
                const titel = (m ? m.name + ' – ' : '') + eintrag.name;
                if (await pruefungNachAnlegen(pruefung, () => daten.kurse, vorher, titel, 'kurs_id', status, knoepfe)) return;
            }
            dialog.close();
            zeigeGespeichert(k ? 'Geändert' : 'Gespeichert', eintrag.name);
            zeigeAlles();
        }

        async function loeschen() {
            if (!confirm('„' + k.name + '“ löschen? Prüfungen bleiben, sie werden nur vom Kurs ausgetragen.')) return;
            if (!await senden(status, knoepfe, 'uni_loeschen', { blatt: 'kurse', id: k.id, geaendert_am: k.geaendert_am })) return;
            dialog.close();
            zeigeGespeichert('Gelöscht', k.name);
            zeigeAlles();
        }

        oeffneDialog(k ? 'Kurs ändern' : 'Neuer Kurs', [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden } }, [
                el('label', { text: 'Modul', attrs: { for: 'uni-ku-modul' } }), modul,
                el('label', { text: 'Name des Kurses', attrs: { for: 'uni-ku-name' } }), name,
                el('div', { class: 'uni-zeiten' }, [
                    el('div', {}, [el('label', { text: 'ECTS', attrs: { for: 'uni-ku-ects' } }), ects]),
                    el('div', {}, [el('label', { text: 'Semester', attrs: { for: 'uni-ku-semester' } }), semester])
                ]),
                el('label', { text: 'Tag (jede Woche in der Vorlesungszeit)', attrs: { for: 'uni-ku-tag' } }), tag,
                el('div', { class: 'uni-zeiten' }, [
                    el('div', {}, [el('label', { text: 'Von', attrs: { for: 'uni-ku-von' } }), von]),
                    el('div', {}, [el('label', { text: 'Bis', attrs: { for: 'uni-ku-bis' } }), bis])
                ]),
                el('label', { text: 'Raum', attrs: { for: 'uni-ku-ort' } }), ort,
                el('label', { text: 'Dozent*in', attrs: { for: 'uni-ku-dozent' } }), dozent,
                altLeistung ? el('label', { text: 'Prüfungsleistung (alt: steht jetzt bei der Prüfung, hier bitte leeren)', attrs: { for: 'uni-ku-leistung' } }) : null, altLeistung,
                el('label', { text: 'Notiz', attrs: { for: 'uni-ku-notiz' } }), notiz,
                pruefung ? pruefung.box : null,
                el('p', { class: 'leise besitz-hinweis', text: 'Ist eine Prüfung des Kurses bestanden, ist der Kurs fertig.' }),
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        name.focus();
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

    // Der wöchentliche Eintrag (Kurs oder wiederkehrender Termin) zu einer stunde_id
    const wocheVon = (id) => (id ? daten.kurse.find((k) => k.id === id) || daten.termine.find((t) => t.id === id && t.tage) || null : null);
    const kursVon = (id) => (id ? daten.kurse.find((k) => k.id === id) || null : null);
    const wocheTitel = (w) => w.titel || w.name;
    const tageText = (tage) => tageListe(tage).map((n) => TAGE_KURZ[n - 1]).join(', ');

    // --- Termin anlegen oder ändern ---
    // x = Termin oder null (neu). vorgabe = { beginn } für einen neuen Termin an einem Tag,
    // oder { art, modul_id, kurs_id, titel, … } für „+ Prüfung“ bei einem Modul (dazu leistung, von, bis, ort und hinweis,
    // wenn die Prüfung beim Anlegen eines Moduls oder Kurses nicht gespeichert werden konnte),
    // oder { beginn, woche } für „Nur an diesem Tag ändern“ (Termin mit stunde_id, nur Uhrzeit, Titel, Raum, Notiz).
    function zeigeTerminForm(x, vorgabe = {}) {
        const woche = x && x.stunde_id ? wocheVon(x.stunde_id) : vorgabe.woche;
        const anders = Boolean(woche);
        const quelle = x || (woche
            ? { titel: wocheTitel(woche), ort: woche.ort, von: woche.von, bis: woche.bis, beginn: vorgabe.beginn }
            : { beginn: vorgabe.beginn || heute(), art: vorgabe.art, modul_id: vorgabe.modul_id, kurs_id: vorgabe.kurs_id, titel: vorgabe.titel,
                leistung: vorgabe.leistung, von: vorgabe.von, bis: vorgabe.bis, ort: vorgabe.ort });
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const titel = el('input', { attrs: { id: 'uni-te-titel', type: 'text', maxlength: 80, autocomplete: 'off', value: quelle.titel || '' } });
        const artWert = quelle.art === 'frei' ? 'urlaub' : (quelle.art || 'sonstiges');
        const art = el('select', { attrs: { id: 'uni-te-art' } },
            ARTEN_TERMIN.map(([k, t]) => el('option', { text: t, attrs: { value: k, selected: artWert === k } })));
        const beginn = datumFeld('uni-te-beginn', quelle.beginn);
        const ende = datumFeld('uni-te-ende', quelle.ende);
        const von = el('input', { attrs: { id: 'uni-te-von', type: 'time', value: quelle.von || '' } });
        const bis = el('input', { attrs: { id: 'uni-te-bis', type: 'time', value: quelle.bis || '' } });
        const ort = el('input', { attrs: { id: 'uni-te-ort', type: 'text', maxlength: 60, autocomplete: 'off', placeholder: 'Raum, bei Zug die Strecke', value: quelle.ort || '' } });
        const notiz = el('input', { attrs: { id: 'uni-te-notiz', type: 'text', maxlength: 200, autocomplete: 'off', placeholder: 'freiwillig', value: quelle.notiz || '' } });

        // Gehört zu: ein Modul oder einer seiner Kurse (der Kurs bestimmt das Modul)
        const module = [...daten.module].sort((a, b) => vergleiche(a.name, b.name));
        const zuWert = quelle.kurs_id ? 'k:' + quelle.kurs_id : (quelle.modul_id ? 'm:' + quelle.modul_id : '');
        const zu = module.length && !anders ? el('select', { attrs: { id: 'uni-te-zu' } }, [
            el('option', { text: '– nichts –', attrs: { value: '' } }),
            ...module.map((m) => el('optgroup', { attrs: { label: m.name } }, [
                el('option', { text: m.name + ' (ganzes Modul)', attrs: { value: 'm:' + m.id, selected: zuWert === 'm:' + m.id } }),
                ...daten.kurse.filter((k) => k.modul_id === m.id).sort((a, b) => vergleiche(a.name, b.name))
                    .map((k) => el('option', { text: k.name, attrs: { value: 'k:' + k.id, selected: zuWert === 'k:' + k.id } }))
            ]))
        ]) : null;
        if (zu) zu.addEventListener('change', () => {
            if (titel.value.trim()) return;
            const [typ, id] = zu.value.split(':');
            const k = typ === 'k' ? kursVon(id) : null;
            const m = modulVon(k ? k.modul_id : id);
            if (m) titel.value = k ? m.name + ' – ' + k.name : m.name;
        });

        // Nur bei Prüfungen: Art der Prüfung und Bestanden
        const leistung = el('input', { attrs: { id: 'uni-te-leistung', type: 'text', maxlength: 80, autocomplete: 'off', placeholder: 'zum Beispiel Klausur 90 Minuten, Hausarbeit', value: quelle.leistung || '' } });
        const bestanden = el('input', { attrs: { id: 'uni-te-bestanden', type: 'checkbox', checked: Boolean(quelle.bestanden) } });
        const bestandenBox = el('div', { class: 'uni-pruefung-felder' }, [
            el('label', { text: 'Art der Prüfung', attrs: { for: 'uni-te-leistung' } }), leistung,
            el('div', { class: 'uni-schalter' }, [bestanden, el('label', { text: 'Bestanden', attrs: { for: 'uni-te-bestanden' } })])
        ]);
        const artGeaendert = () => { bestandenBox.hidden = art.value !== 'pruefung'; };
        art.addEventListener('change', artGeaendert);
        artGeaendert();

        // Jede Woche an bestimmten Tagen, zwischen erstem und letztem Tag
        const gewaehlt = tageListe(quelle.tage);
        const tagBoxen = TAGE_KURZ.map((t, i) => el('input', { attrs: { id: 'uni-te-tag' + (i + 1), type: 'checkbox', value: i + 1, checked: gewaehlt.includes(i + 1) } }));
        const s = semesterVon(semesterId);
        const zeitraum = (a, b) => el('button', { class: 'knopf knopf-zweit uni-klein', text: a, attrs: { type: 'button' }, on: { click: () => { beginn.value = b[0]; ende.value = b[1]; } } });
        const wiederholen = el('fieldset', { class: 'uni-wiederholen' }, [
            el('legend', { text: 'Jede Woche an (freiwillig)' }),
            el('div', { class: 'uni-tage' }, tagBoxen.map((b, i) => el('label', { class: 'uni-tag-wahl', attrs: { for: b.id } }, [b, el('span', { text: TAGE_KURZ[i] })]))),
            el('p', { class: 'leise besitz-hinweis', text: 'Mit Tagen gilt der Termin jede Woche an diesen Tagen, vom ersten bis zum letzten Tag. Einzelne Tage kannst du danach im Kalender ausfallen lassen; an Urlaubstagen fällt er von selbst weg.' }),
            s ? el('div', { class: 'uni-zeitraum-knoepfe' }, [
                zeitraum('Vorlesungszeit', [s.vorlesung_beginn, s.vorlesung_ende]),
                zeitraum('Ganzes Semester', [s.beginn, s.ende])
            ]) : null
        ]);
        const knoepfe = formKnoepfe(x ? loeschen : null);

        async function absenden(ev) {
            ev.preventDefault();
            const [typ, zuId] = zu ? zu.value.split(':') : ['', ''];
            const tage = anders ? '' : tagBoxen.filter((b) => b.checked).map((b) => b.value).join(',');
            const eintrag = {
                titel: titel.value.trim(), art: anders ? (woche.art || 'vorlesung') : art.value,
                beginn: anders ? quelle.beginn : beginn.value, ende: anders ? '' : ende.value,
                von: von.value, bis: bis.value, tage, ort: ort.value.trim(),
                modul_id: anders ? '' : (zu ? (typ === 'm' ? zuId : '') : (quelle.modul_id || '')),
                kurs_id: anders ? '' : (zu ? (typ === 'k' ? zuId : '') : (quelle.kurs_id || '')),
                stunde_id: anders ? woche.id : '',
                bestanden: !anders && art.value === 'pruefung' && bestanden.checked,
                leistung: !anders && art.value === 'pruefung' ? leistung.value.trim() : '',
                notiz: notiz.value.trim()
            };
            if (!eintrag.titel) { status.textContent = 'Bitte einen Titel angeben.'; titel.focus(); return; }
            if (!eintrag.beginn) { status.textContent = 'Bitte den ersten Tag angeben.'; return; }
            if (eintrag.ende && eintrag.ende < eintrag.beginn) { status.textContent = 'Der letzte Tag darf nicht vor dem ersten liegen.'; return; }
            if (tage && (!eintrag.ende || eintrag.ende === eintrag.beginn)) { status.textContent = 'Für „jede Woche“ bitte auch den letzten Tag angeben.'; return; }
            if (anders && (!eintrag.von || !eintrag.bis)) { status.textContent = 'Bitte die Zeit an diesem Tag angeben.'; return; }
            if (Boolean(eintrag.von) !== Boolean(eintrag.bis)) { status.textContent = 'Bitte beide Uhrzeiten angeben oder keine (ganztägig).'; return; }
            const proTag = tage || !eintrag.ende || eintrag.ende === eintrag.beginn;
            if (eintrag.von && proTag && eintrag.bis <= eintrag.von) { status.textContent = 'Die Endzeit muss nach der Anfangszeit liegen.'; return; }
            if (x) Object.assign(eintrag, { id: x.id, geaendert_am: x.geaendert_am });
            if (!await senden(status, knoepfe, 'uni_speichern', { blatt: 'termine', eintrag })) return;
            dialog.close();
            zeigeGespeichert(x ? 'Geändert' : 'Gespeichert', eintrag.titel);
            zeigeAlles();
        }

        async function loeschen() {
            const frage = anders ? 'Wieder wie immer? „' + x.titel + '“ gilt dann an diesem Tag wieder wie jede Woche.'
                : '„' + x.titel + '“ löschen?' + (x.tage ? ' Das ist der Termin für alle Wochen.' : '');
            if (!confirm(frage)) return;
            if (!await senden(status, knoepfe, 'uni_loeschen', { blatt: 'termine', id: x.id, geaendert_am: x.geaendert_am })) return;
            dialog.close();
            zeigeGespeichert(anders ? 'Wie immer' : 'Gelöscht', x.titel);
            zeigeAlles();
        }

        oeffneDialog(anders ? 'Nur am ' + langDatum(quelle.beginn) : (x ? 'Termin ändern' : 'Neuer Termin'), [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden } }, [
                anders ? el('p', { class: 'leise besitz-hinweis', text: 'Gilt nur an diesem Tag. Jede andere Woche bleibt, wie sie ist.' }) : null,
                vorgabe.hinweis ? el('p', { class: 'meldung', text: vorgabe.hinweis }) : null,
                anders ? null : el('label', { text: 'Art', attrs: { for: 'uni-te-art' } }), anders ? null : art,
                zu ? el('label', { text: 'Gehört zu Modul oder Kurs', attrs: { for: 'uni-te-zu' } }) : null, zu,
                el('label', { text: 'Titel', attrs: { for: 'uni-te-titel' } }), titel,
                anders ? null : bestandenBox,
                anders ? null : el('div', { class: 'uni-zeiten' }, [
                    el('div', {}, [el('label', { text: 'Erster Tag', attrs: { for: 'uni-te-beginn' } }), beginn]),
                    el('div', {}, [el('label', { text: 'Letzter Tag (freiwillig)', attrs: { for: 'uni-te-ende' } }), ende])
                ]),
                anders ? null : wiederholen,
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
    async function ausfallen(woche, tag, status, knoepfe) {
        const name = wocheTitel(woche);
        if (!confirm('„' + name + '“ fällt am ' + langDatum(tag) + ' aus?')) return;
        const eintrag = { titel: name, art: woche.art || 'vorlesung', beginn: tag, ende: '', von: '', bis: '', tage: '', ort: '', modul_id: '', kurs_id: '', stunde_id: woche.id, bestanden: false, leistung: '', notiz: '' };
        if (!await senden(status, knoepfe, 'uni_speichern', { blatt: 'termine', eintrag })) return;
        dialog.close();
        zeigeGespeichert('Fällt aus', name);
        zeigeAlles();
    }

    // „Einmal anders“ oder „fällt aus“ zurücknehmen
    async function wieImmer(termin, status, knoepfe) {
        if (!await senden(status, knoepfe, 'uni_loeschen', { blatt: 'termine', id: termin.id, geaendert_am: termin.geaendert_am })) return;
        dialog.close();
        zeigeGespeichert('Wie immer', termin.titel);
        zeigeAlles();
    }

    // Prüfung bestanden an oder aus (ein Tipp). Danach neu zeichnen; nach = Fenster, das wieder aufgehen soll.
    async function bestandenUmschalten(p, status, knoepfe, nach) {
        const eintrag = { ...p, bestanden: !p.bestanden };
        if (!await senden(status, knoepfe, 'uni_speichern', { blatt: 'termine', eintrag })) return;
        zeigeGespeichert(eintrag.bestanden ? 'Bestanden' : 'Nicht mehr bestanden', p.titel);
        zeigeAlles();
        if (nach) nach();
    }

    // --- Ein Eintrag aus dem Kalender (an Tag t) ---
    function zeigeKalenderEintrag(e, t) {
        const m = modulVon(e.modul_id);
        const termin = e.termin;
        const pk = termin && termin.kurs_id ? kursVon(termin.kurs_id) : null;
        let wann = langDatum(t) + ', ' + zeitText(e);
        if (termin && termin.ende && termin.ende !== termin.beginn && !termin.tage) wann = langDatum(termin.beginn) + ' bis ' + langDatum(termin.ende) + (termin.von ? ', ' + termin.von + '–' + termin.bis + ' Uhr' : '');
        // Woher der Eintrag kommt
        const serie = e.woche || (termin && termin.tage ? termin : null);
        let hinweis = '';
        if (e.ausfall) hinweis = 'Fällt an diesem Tag aus.';
        else if (e.einmalig) hinweis = 'Nur an diesem Tag geändert. Sonst ' + e.woche.von + '–' + e.woche.bis + '.';
        else if (e.kurs) hinweis = 'Jede Woche am ' + TAGE[e.kurs.tag - 1] + ' in der Vorlesungszeit (Kurs).';
        else if (serie) hinweis = 'Jede Woche am ' + tageText(serie.tage) + ', vom ' + datumText(serie.beginn) + ' bis ' + datumText(serie.ende) + '.';
        const angaben = [
            ['Wann', wann],
            ['Art', ART_NAME[e.art] || e.art],
            [e.art === 'zug' ? 'Strecke' : 'Raum', e.ort],
            ['Modul', m ? m.name : ''],
            ['Kurs', pk ? pk.name : ''],
            ['Dozent*in', e.kurs ? e.kurs.dozent : ''],
            ['Art der Prüfung', termin && termin.art === 'pruefung' ? termin.leistung : ''],
            ['Bestanden', termin && termin.art === 'pruefung' && !e.woche ? (termin.bestanden ? 'ja' : 'noch nicht') : ''],
            ['Notiz', termin ? termin.notiz : (e.woche ? e.woche.notiz : '')],
            ['Hinweis', hinweis]
        ].filter(([, w]) => w);
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const knoepfe = [];
        if (darfAendern()) {
            const k = (text, fn, haupt = false) => knoepfe.push(el('button', { class: 'knopf ' + (haupt ? 'knopf-bereich' : 'knopf-zweit'), text, attrs: { type: 'button' }, on: { click: fn } }));
            const jedeWoche = () => (e.kurs ? zeigeKursForm(e.kurs) : zeigeTerminForm(e.woche));
            if (e.woche && (e.einmalig || e.ausfall)) {
                if (e.einmalig) k('Zeit ändern', () => zeigeTerminForm(termin), true);
                k('Wieder wie immer', () => wieImmer(termin, status, knoepfe));
            } else if (e.woche) {
                k('Nur an diesem Tag ändern', () => zeigeTerminForm(null, { beginn: t, woche: e.woche }), true);
                k('Fällt an diesem Tag aus', () => ausfallen(e.woche, t, status, knoepfe));
                k('Jede Woche ändern', jedeWoche);
            } else {
                k('Bearbeiten', () => zeigeTerminForm(termin), true);
                if (termin.art === 'pruefung') k(termin.bestanden ? 'Doch nicht bestanden' : 'Bestanden ✓', () => bestandenUmschalten(termin, status, knoepfe, () => dialog.close()));
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

    // --- Module mit Kursen und Prüfungen (5.4, umgebaut in 5.5) ---
    const STATUS = [['offen', 'Offen'], ['laeuft', 'Läuft'], ['bestanden', 'Fertig']];
    const STATUS_NAME = Object.fromEntries(STATUS);
    const PFLICHT = [['pflicht', 'Pflicht'], ['wahlpflicht', 'Wahlpflicht'], ['auflage', 'Auflage vom Bachelor']];
    const PFLICHT_NAME = Object.fromEntries(PFLICHT);
    const zahlText = (n) => String(n).replace('.', ',');
    const ectsText = (n) => zahlText(n) + ' ECTS';
    const nachDatum = (a, b) => (a.beginn + a.von).localeCompare(b.beginn + b.von);
    const istPruefung = (t) => t.art === 'pruefung' && !t.stunde_id;
    const kurseVon = (m) => daten.kurse.filter((k) => k.modul_id === m.id).sort((a, b) => vergleiche(a.name, b.name));
    const pruefungenVonKurs = (k) => daten.termine.filter((t) => istPruefung(t) && t.kurs_id === k.id).sort(nachDatum);
    // Prüfungen, die zum ganzen Modul gehören (ohne Kurs)
    const pruefungenOhneKurs = (m) => daten.termine.filter((t) => istPruefung(t) && !t.kurs_id && t.modul_id === m.id).sort(nachDatum);
    const pruefungenVon = (m) => [...kurseVon(m).flatMap(pruefungenVonKurs), ...pruefungenOhneKurs(m)].sort(nachDatum);
    // Ein Kurs ist fertig, wenn eine seiner Prüfungen bestanden ist (auch ein zweiter Versuch)
    const kursFertig = (k) => pruefungenVonKurs(k).some((t) => t.bestanden);
    const kursMitPruefung = (k) => Boolean(k.pruefungsleistung) || pruefungenVonKurs(k).length > 0;
    // Fertig von selbst: jeder Kurs mit Prüfung bestanden (und Prüfungen ohne Kurs, wenn es welche gibt), mindestens eine
    function vonSelbstFertig(m) {
        const teile = kurseVon(m).filter(kursMitPruefung).map(kursFertig);
        const ohneKurs = pruefungenOhneKurs(m);
        if (ohneKurs.length) teile.push(ohneKurs.some((t) => t.bestanden));
        return teile.length > 0 && teile.every(Boolean);
    }
    // Stand: fertig von selbst oder von Hand, sonst der eingetragene
    const standVon = (m) => (m.status === 'bestanden' || vonSelbstFertig(m) ? 'bestanden' : m.status);
    // ECTS des Moduls; ohne Eintrag die Summe seiner Kurse
    function ectsVon(m) {
        if (typeof m.ects === 'number') return m.ects;
        return kurseVon(m).reduce((n, k) => n + (typeof k.ects === 'number' ? k.ects : 0), 0);
    }
    const zaehlt = (m) => m.pflicht !== 'auflage';
    // Die nächste Prüfung ab heute, sonst keine
    const naechstePruefung = (m) => pruefungenVon(m).find((t) => !t.bestanden && (t.ende || t.beginn) >= heute()) || null;
    const pruefungText = (t) => langDatum(t.beginn) + (t.von ? ', ' + t.von + ' Uhr' : '') + (t.ort ? ', ' + t.ort : '');
    const kursZeit = (k) => (k.tag && k.von ? TAGE_KURZ[k.tag - 1] + ' ' + k.von + '–' + k.bis : '');
    // Status-Filter. Bleibt, solange die Seite offen ist.
    let statusFilter = '';

    function zeigeModulForm(m) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const name = el('input', { attrs: { id: 'uni-mo-name', type: 'text', maxlength: 80, autocomplete: 'off', value: m ? m.name : '' } });
        const kuerzel = el('input', { attrs: { id: 'uni-mo-kuerzel', type: 'text', maxlength: 20, autocomplete: 'off', placeholder: 'freiwillig', value: m ? m.kuerzel : '' } });
        const bereich = auswahlFeld({ id: 'uni-mo-bereich', maxlength: 40, placeholder: 'freiwillig' });
        bereich.setzeEintraege(daten.module.map((x) => x.bereich).filter(Boolean));
        if (m) bereich.feld.value = m.bereich;
        const pflicht = el('select', { attrs: { id: 'uni-mo-pflicht' } },
            PFLICHT.map(([k, t]) => el('option', { text: t, attrs: { value: k, selected: (m ? m.pflicht : 'pflicht') === k } })));
        const ects = ectsFeld('uni-mo-ects', m ? m.ects : null);
        const stand = el('select', { attrs: { id: 'uni-mo-status' } },
            STATUS.map(([k, t]) => el('option', { text: t, attrs: { value: k, selected: (m ? m.status : 'offen') === k } })));
        const semester = semesterWahl('uni-mo-semester', m ? m.semester_id : '', '– kein Semester –');
        const notiz = el('input', { attrs: { id: 'uni-mo-notiz', type: 'text', maxlength: 200, autocomplete: 'off', placeholder: 'freiwillig', value: m ? m.notiz : '' } });
        const pruefung = m ? null : pruefungGleich('uni-mo-pr');
        const knoepfe = formKnoepfe(m ? loeschen : null);

        async function absenden(ev) {
            ev.preventDefault();
            const eintrag = {
                name: name.value.trim(), kuerzel: kuerzel.value.trim(), bereich: bereich.feld.value.trim(), pflicht: pflicht.value,
                ects: ects.value.trim().replace(',', '.'), status: stand.value, semester_id: semester.value, notiz: notiz.value.trim()
            };
            if (!eintrag.name) { status.textContent = 'Bitte einen Namen angeben.'; name.focus(); return; }
            if (!ectsPasst(eintrag.ects)) { status.textContent = 'ECTS bitte als Zahl von 0 bis 60 (halbe erlaubt).'; ects.focus(); return; }
            if (pruefung && pruefung.fehler()) { status.textContent = pruefung.fehler(); return; }
            if (m) Object.assign(eintrag, { id: m.id, geaendert_am: m.geaendert_am });
            const vorher = new Set(daten.module.map((x) => x.id));
            if (!await senden(status, knoepfe, 'uni_speichern', { blatt: 'module', eintrag })) return;
            if (pruefung && await pruefungNachAnlegen(pruefung, () => daten.module, vorher, eintrag.name, 'modul_id', status, knoepfe)) return;
            dialog.close();
            zeigeGespeichert(m ? 'Geändert' : 'Gespeichert', eintrag.name);
            zeigeAlles();
        }

        async function loeschen() {
            const n = kurseVon(m).length;
            const frage = '„' + m.name + '“ löschen?' + (n ? ' Seine Kurse (' + n + ') werden mit gelöscht.' : '') + ' Prüfungen und Termine bleiben, sie werden nur ausgetragen.';
            if (!confirm(frage)) return;
            if (!await senden(status, knoepfe, 'uni_loeschen', { blatt: 'module', id: m.id, geaendert_am: m.geaendert_am })) return;
            dialog.close();
            zeigeGespeichert('Gelöscht', m.name);
            zeigeAlles();
        }

        oeffneDialog(m ? 'Modul ändern' : 'Neues Modul', [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden } }, [
                el('label', { text: 'Name', attrs: { for: 'uni-mo-name' } }), name,
                el('label', { text: 'Kürzel oder Modulnummer', attrs: { for: 'uni-mo-kuerzel' } }), kuerzel,
                el('label', { text: 'Bereich', attrs: { for: 'uni-mo-bereich' } }), bereich.box,
                el('label', { text: 'Pflicht, Wahlpflicht oder Auflage', attrs: { for: 'uni-mo-pflicht' } }), pflicht,
                el('div', { class: 'uni-zeiten' }, [
                    el('div', {}, [el('label', { text: 'ECTS', attrs: { for: 'uni-mo-ects' } }), ects]),
                    el('div', {}, [el('label', { text: 'Stand', attrs: { for: 'uni-mo-status' } }), stand])
                ]),
                el('p', { class: 'leise besitz-hinweis', text: 'Ohne ECTS zählt die Summe der Kurse. Sind alle Prüfungen bestanden, ist das Modul von selbst fertig.' }),
                el('label', { text: 'Semester (belegt oder geplant)', attrs: { for: 'uni-mo-semester' } }), semester,
                el('label', { text: 'Notiz', attrs: { for: 'uni-mo-notiz' } }), notiz,
                pruefung ? pruefung.box : null,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        name.focus();
    }

    // Kleiner Knopf „✎“ zum Bearbeiten
    const stift = (was, fn) => el('button', { class: 'knopf knopf-zweit uni-stift', text: '✎', attrs: { type: 'button', 'aria-label': was + ' bearbeiten', title: 'Bearbeiten' }, on: { click: fn } });

    // Eine Prüfung als Zeile: Datum, bestanden, Knöpfe
    function pruefungZeile(t, titelWeg) {
        const status = el('span', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const knoepfe = [];
        if (darfAendern()) {
            knoepfe.push(el('button', {
                class: 'knopf knopf-zweit uni-klein uni-bestanden', text: t.bestanden ? '✓ bestanden' : 'bestanden?',
                attrs: { type: 'button', 'aria-pressed': t.bestanden ? 'true' : 'false', title: t.bestanden ? 'Antippen: doch nicht bestanden' : 'Antippen: bestanden' },
                on: { click: () => bestandenUmschalten(t, status, knoepfe) }
            }));
            knoepfe.push(stift('Prüfung', () => zeigeTerminForm(t)));
        }
        const zusatz = t.titel && t.titel !== titelWeg ? ' – ' + t.titel : '';
        return el('li', { class: 'uni-pruefung' + (t.bestanden ? ' uni-ist-bestanden' : '') }, [
            el('span', { class: 'uni-pruefung-text', text: (darfAendern() ? '' : (t.bestanden ? '✓ ' : '')) + (t.leistung || 'Prüfung') + ': ' + pruefungText(t) + zusatz }),
            knoepfe.length ? el('span', { class: 'uni-pruefung-knoepfe' }, knoepfe) : null,
            status
        ]);
    }

    // Eine Karte je Modul: Kopf, Kurse mit ihren Prüfungen, Prüfungen ohne Kurs, Knöpfe
    function modulKarte(m) {
        const stand = standVon(m);
        const s = semesterVon(m.semester_id);
        const p = naechstePruefung(m);
        const darf = darfAendern();
        const ects = ectsVon(m);
        const kurse = kurseVon(m);
        const ohneKurs = pruefungenOhneKurs(m);
        return el('li', { class: 'uni-modul-karte', attrs: { 'data-status': stand } }, [
            el('div', { class: 'uni-modul-kopf' }, [
                el('span', { class: 'uni-modul-stand', text: STATUS_NAME[stand] || stand }),
                el('span', { class: 'uni-was' }, [
                    el('span', { class: 'uni-titel', text: m.name + (m.kuerzel ? ' (' + m.kuerzel + ')' : '') }),
                    el('span', { class: 'leise einkauf-klein', text: [PFLICHT_NAME[m.pflicht] || '', ects ? ectsText(ects) : '', s ? s.name : ''].filter(Boolean).join(' · ') }),
                    stand === 'bestanden' && m.status !== 'bestanden' ? el('span', { class: 'leise einkauf-klein', text: 'Alle Prüfungen bestanden' }) : null,
                    p ? el('span', { class: 'einkauf-klein', text: 'Nächste Prüfung: ' + pruefungText(p) }) : null,
                    m.notiz ? el('span', { class: 'leise einkauf-klein', text: m.notiz }) : null
                ]),
                darf ? stift('Modul „' + m.name + '“', () => zeigeModulForm(m)) : null
            ]),
            kurse.length ? el('ul', { class: 'uni-kurse' }, kurse.map((k) => el('li', { class: 'uni-kurs' + (kursFertig(k) ? ' uni-ist-bestanden' : '') }, [
                el('div', { class: 'uni-kurs-kopf' }, [
                    el('span', { class: 'uni-was' }, [
                        el('span', { class: 'uni-kurs-name', text: (kursFertig(k) ? '✓ ' : '') + k.name }),
                        el('span', { class: 'leise einkauf-klein', text: [k.ects != null ? ectsText(k.ects) : '', kursZeit(k), k.ort, k.dozent].filter(Boolean).join(' · ') }),
                        k.pruefungsleistung && !pruefungenVonKurs(k).length ? el('span', { class: 'leise einkauf-klein', text: 'Prüfungsleistung: ' + k.pruefungsleistung }) : null
                    ]),
                    darf ? stift('Kurs „' + k.name + '“', () => zeigeKursForm(k)) : null
                ]),
                pruefungenVonKurs(k).length ? el('ul', { class: 'uni-pruefungen' }, pruefungenVonKurs(k).map((t) => pruefungZeile(t, m.name + ' – ' + k.name))) : null
            ]))) : el('p', { class: 'leise einkauf-klein uni-kurse-leer', text: 'Noch keine Kurse.' }),
            ohneKurs.length ? el('ul', { class: 'uni-pruefungen uni-ohne-kurs' }, ohneKurs.map((t) => pruefungZeile(t, m.name))) : null,
            darf ? el('div', { class: 'uni-modul-knoepfe' }, [
                el('button', { class: 'knopf knopf-zweit uni-klein', text: '+ Kurs', attrs: { type: 'button' }, on: { click: () => zeigeKursForm(null, { modul_id: m.id }) } }),
                el('button', { class: 'knopf knopf-zweit uni-klein', text: '+ Prüfung', attrs: { type: 'button', 'aria-label': 'Prüfung für ' + m.name + ' eintragen' }, on: { click: () => zeigeTerminForm(null, { art: 'pruefung', modul_id: m.id, titel: m.name }) } })
            ]) : null
        ]);
    }

    function zeigeModule() {
        leeren(moduleBox);
        if (!daten) return;
        const alle = daten.module;
        const imZiel = alle.filter(zaehlt);
        const summe = (liste, st) => liste.filter((m) => standVon(m) === st).reduce((n, m) => n + ectsVon(m), 0);
        const ziel = daten.ects_ziel || 0;
        const fertig = summe(imZiel, 'bestanden');
        const eingetragen = imZiel.reduce((n, m) => n + ectsVon(m), 0);

        // Fortschritt: fertige ECTS vom Ziel (ohne Auflagen)
        if (ziel) {
            const balken = el('div', { class: 'uni-fortschritt-fuell' });
            balken.style.width = Math.min(100, fertig / ziel * 100) + '%';
            moduleBox.append(el('div', { class: 'uni-fortschritt' }, [
                el('p', { class: 'uni-fortschritt-text', text: zahlText(fertig) + ' von ' + zahlText(ziel) + ' ECTS fertig' }),
                el('div', { class: 'uni-fortschritt-balken', attrs: { role: 'img', 'aria-label': Math.round(fertig / ziel * 100) + ' Prozent' } }, [balken])
            ]));
        }
        moduleBox.append(el('div', { class: 'besitz-zahlen' }, STATUS.slice().reverse().map(([k, t]) => el('div', { class: 'besitz-zahl-kachel' }, [
            el('span', { class: 'besitz-zahl-wert', text: String(imZiel.filter((m) => standVon(m) === k).length) }),
            el('span', { class: 'leise', text: t + ' · ' + ectsText(summe(imZiel, k)) })
        ]))));
        if (ziel && eingetragen < ziel) {
            moduleBox.append(el('p', { class: 'leise besitz-hinweis uni-noch', text: 'Noch ohne Modul: ' + ectsText(ziel - eingetragen) + ' bis zum Ziel.' }));
        }
        const auflagen = alle.filter((m) => !zaehlt(m));
        if (auflagen.length) {
            const n = auflagen.filter((m) => standVon(m) === 'bestanden').length;
            moduleBox.append(el('p', { class: 'leise besitz-hinweis uni-noch', text: 'Auflagen vom Bachelor: ' + n + ' von ' + auflagen.length + ' fertig (zählen nicht zu den ' + zahlText(ziel) + ' ECTS).' }));
        }

        // Filter nach Stand und „+ Modul“
        const filter = el('select', { attrs: { id: 'uni-mo-filter', 'aria-label': 'Nach Stand filtern' }, on: { change: () => { statusFilter = filter.value; zeigeModule(); } } }, [
            el('option', { text: 'Alle Module', attrs: { value: '' } }),
            ...STATUS.map(([k, t]) => el('option', { text: t, attrs: { value: k, selected: statusFilter === k } }))
        ]);
        moduleBox.append(el('div', { class: 'uni-leiste' }, [
            filter,
            darfAendern() ? el('button', { class: 'knopf knopf-bereich', text: '+ Modul', attrs: { type: 'button' }, on: { click: () => zeigeModulForm(null) } }) : null
        ]));

        const gezeigt = alle.filter((m) => !statusFilter || standVon(m) === statusFilter);
        if (!gezeigt.length) {
            moduleBox.append(el('p', { class: 'leise', text: alle.length ? 'Keine Module mit diesem Stand.' : 'Noch keine Module eingetragen.' }));
            return;
        }
        // Nach Bereich (A–Z, ohne Bereich zuletzt), darin nach Name
        const bereiche = [...new Set(gezeigt.map((m) => m.bereich))].sort((a, b) => (!a) - (!b) || vergleiche(a, b));
        bereiche.forEach((b) => {
            const drin = gezeigt.filter((m) => m.bereich === b).sort((x, y) => vergleiche(x.name, y.name));
            moduleBox.append(el('section', { class: 'uni-tag' }, [
                el('h2', { class: 'besitz-ort' }, [
                    el('span', { text: b || 'Ohne Bereich' }),
                    el('span', { class: 'besitz-zahl', text: ectsText(drin.reduce((n, m) => n + ectsVon(m), 0)) })
                ]),
                el('ul', { class: 'uni-module' }, drin.map(modulKarte))
            ]));
        });
    }

    function zeigeAlles() {
        zeigeSemesterLeiste();
        zeigeKalender();
        zeigeModule();
    }

    // --- Unterreiter ---
    const teile = [['kalender', 'Kalender', kalenderBox], ['module', 'Module', moduleBox]].map(([id, text, box]) => [
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
