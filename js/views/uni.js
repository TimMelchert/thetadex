// Reiter Uni (Etappe 5, Plan docs/PLAN-ETAPPE-5.md).
// Schritt 5.1: Semester wählen, anlegen und ändern; Stundenplan je Wochentag (jede Woche gleich).
// Kalender (5.2) und Module (5.4) kommen später.
// Daten aus dem Skript „gemeinsam“ (Sheet „Gemeinsam“). Die Person darf ändern, Partner*in nur lesen.
// Die Rolle kommt mit jeder Antwort des Skripts; die App speichert sie nicht. Die Rechte prüft immer das Skript.
// Die Daten liegen in 5.1 nur im Arbeitsspeicher, solange die Seite offen ist.

import { el, leeren, heute, kalenderBeiKlick } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';

// Zuletzt geladene Daten { semester, stundenplan, termine, module, ects_ziel, rolle }, im Arbeitsspeicher
let daten = null;
// Gewähltes Semester (id). Bleibt, solange die Seite offen ist.
let semesterId = '';
// Kalender, Stundenplan oder Module. Bleibt, solange die Seite offen ist. (Vorgabe Kalender ab Schritt 5.2.)
let teil = 'stundenplan';

const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const ARTEN_STUNDE = [['vorlesung', 'Vorlesung, Übung, Seminar'], ['arbeit', 'Arbeit'], ['zug', 'Zug']];
const ART_NAME = { vorlesung: 'Vorlesung', arbeit: 'Arbeit', zug: 'Zug' };

const vergleiche = (a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true });
const datumText = (t) => (/^\d{4}-\d{2}-\d{2}$/.test(t) ? t.slice(8, 10) + '.' + t.slice(5, 7) + '.' + t.slice(0, 4) : '');
const liste = (x) => (Array.isArray(x) ? x : []);

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
    const kalenderBox = el('div', { attrs: { id: 'uni-teil-kalender', hidden: true } }, [
        el('p', { class: 'leise', text: 'Der Kalender kommt mit Schritt 5.2.' })
    ]);
    const planBox = el('div', { attrs: { id: 'uni-teil-stundenplan', hidden: true } });
    const moduleBox = el('div', { attrs: { id: 'uni-teil-module', hidden: true } }, [
        el('p', { class: 'leise', text: 'Die Module kommen mit Schritt 5.4.' })
    ]);
    const semesterLeiste = el('div', { class: 'uni-leiste' });
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'uni-dialog-titel' } });
    dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
    let sendet = false; // gegen doppeltes Senden durch mehrfaches Tippen

    const darfAendern = () => Boolean(daten) && daten.rolle === 'person';
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
            setzeDaten(await api('gemeinsam', action, werte));
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

    function zeigeAlles() {
        zeigeSemesterLeiste();
        zeigePlan();
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
            setzeDaten(await api('gemeinsam', 'uni'));
            ladeStatus.textContent = '';
        } catch (e) {
            ladeStatus.textContent = e.code === 'aktion'
                ? 'Das Skript „gemeinsam“ kennt Uni noch nicht. Bitte die neue Fassung von Code.gs einfügen und eine neue Version bereitstellen.'
                : 'Laden fehlgeschlagen: ' + e.message;
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
    zeigeTeil(teil);
    zeigeAlles();
    laden();
}
