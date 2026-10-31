// Pen & Paper, ab 0.6.8 (Wunsch der Person, 31.10.2026): Ansichten „Abenteuer“ und „DM“.
// Abenteuer: gehören zu genau einem Charakter, darin Sessions mit Datum und kurzem Text. Der geteilte Link zeigt sie (nur lesen).
// DM: ein Textfeld „Abenteuerideen“ und Abenteuer, die die Person leitet (Titel, Text, Haken „abgeschlossen“).
// DM-Inhalte gibt das Skript nie über den geteilten Link heraus.
// h = Helfer aus js/views/dsa.js: daten, nurLesen, karte, oeffneDialog, senden, formKnoepfe, textFeld, feld, dialog, zeigeAlles, datumText

import { el, heute, kalenderBeiKlick } from '../ui/dom.js';
import { zeigeGespeichert } from '../ui/overlay.js';

const MAX_ATEXT = 10000;
const MAX_STEXT = 3000;

const status = () => el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });

// --- Abenteuer eines Charakters ---
export function abenteuerAnsicht(h, bogen) {
    const { daten, nurLesen } = h;
    const sessionsVon = (a) => daten.sessions.filter((s) => s.abenteuer_id === a.id)
        .sort((x, y) => (x.datum < y.datum ? 1 : x.datum > y.datum ? -1 : 0));
    // Neueste zuerst: nach der letzten Session, Abenteuer ohne Session ganz oben
    const zuletzt = (a) => (sessionsVon(a)[0] || { datum: '9999' }).datum;
    const liste = daten.abenteuer.filter((a) => a.art === 'spieler' && a.bogen_id === bogen.id)
        .sort((x, y) => (zuletzt(x) < zuletzt(y) ? 1 : zuletzt(x) > zuletzt(y) ? -1 : x.titel.localeCompare(y.titel, 'de')));

    const teile = [];
    if (!nurLesen) {
        teile.push(el('div', { class: 'dsa-ab-kopf' }, [
            el('button', { class: 'knopf knopf-bereich', text: '+ Abenteuer', attrs: { type: 'button' }, on: { click: () => zeigeAbenteuerForm(h, bogen, null) } })
        ]));
    }
    if (!liste.length) {
        teile.push(el('p', { class: 'leise', text: nurLesen ? 'Noch keine Abenteuer.' : 'Noch kein Abenteuer. Lege mit „+ Abenteuer“ das erste an.' }));
    }
    liste.forEach((a) => {
        const sessions = sessionsVon(a);
        const inhalt = [];
        if (a.text) inhalt.push(el('p', { class: 'dsa-notiz dsa-ab-text', text: a.text }));
        if (sessions.length) {
            inhalt.push(el('ol', { class: 'dsa-sessions' }, sessions.map((s) => {
                const kinder = [el('span', { class: 'dsa-session-datum', text: h.datumText(s.datum, true) }), el('span', { class: 'dsa-notiz dsa-session-text', text: s.text || '–' })];
                return el('li', {}, [nurLesen ? el('div', { class: 'dsa-session' }, kinder)
                    : el('button', { class: 'dsa-session dsa-session-knopf', attrs: { type: 'button', 'aria-label': 'Session vom ' + h.datumText(s.datum, true) + ' bearbeiten' }, on: { click: () => zeigeSessionForm(h, a, s) } }, kinder)]);
            })));
        } else {
            inhalt.push(el('p', { class: 'leise', text: nurLesen ? 'Noch keine Session.' : 'Noch keine Session. Tippe auf +.' }));
        }
        if (!nurLesen) {
            inhalt.push(el('button', { class: 'knopf knopf-zweit dsa-klein', text: '✎ Abenteuer bearbeiten', attrs: { type: 'button' }, on: { click: () => zeigeAbenteuerForm(h, bogen, a) } }));
        }
        teile.push(h.karte('ab-' + a.id, a.titel, { zeichen: '+', label: 'Neue Session bei ' + a.titel, tun: () => zeigeSessionForm(h, a, null) }, inhalt, sessions.length));
    });
    return teile;
}

function zeigeAbenteuerForm(h, bogen, a) {
    const st = status();
    const titel = h.textFeld('dsa-ab-titel', a && a.titel, 80);
    const text = el('textarea', { attrs: { id: 'dsa-ab-text', maxlength: MAX_ATEXT, rows: 4, placeholder: 'freiwillig, worum es geht' } });
    text.value = a ? a.text : '';
    const knoepfe = h.formKnoepfe(a ? () => loesche(h, a, st, knoepfe, 'Abenteuer „' + a.titel + '“ mit allen Sessions löschen? (Im Sheet zurückholbar)') : null, 'Löschen');
    async function absenden(ev) {
        ev.preventDefault();
        if (!titel.value.trim()) { st.textContent = 'Bitte einen Titel angeben.'; titel.focus(); return; }
        const werte = { art: 'spieler', bogen_id: bogen.id, titel: titel.value.trim(), text: text.value.trim() };
        if (a) Object.assign(werte, { id: a.id, geaendert_am: a.geaendert_am });
        if (!await h.senden(st, knoepfe, 'abenteuer_speichern', { abenteuer: werte })) return;
        h.dialog.close();
        h.zeigeAlles();
        zeigeGespeichert(a ? 'Gespeichert' : 'Abenteuer angelegt');
    }
    h.oeffneDialog(a ? 'Abenteuer bearbeiten' : 'Neues Abenteuer', [
        el('form', { class: 'formular', on: { submit: absenden } }, [
            ...h.feld('dsa-ab-titel', 'Titel', titel),
            ...h.feld('dsa-ab-text', 'Beschreibung', text),
            st,
            el('div', { class: 'besitz-form-knoepfe' }, knoepfe)
        ])
    ]);
    titel.focus();
}

function zeigeSessionForm(h, a, s) {
    const st = status();
    const datum = kalenderBeiKlick(el('input', { attrs: { id: 'dsa-se-datum', type: 'date', value: s ? s.datum : heute() } }));
    const text = el('textarea', { attrs: { id: 'dsa-se-text', maxlength: MAX_STEXT, rows: 5, placeholder: 'Was ist passiert?' } });
    text.value = s ? s.text : '';
    const knoepfe = h.formKnoepfe(s ? () => loesche(h, s, st, knoepfe, 'Session vom ' + h.datumText(s.datum, true) + ' löschen? (Im Sheet zurückholbar)', 'session_loeschen') : null, 'Löschen');
    async function absenden(ev) {
        ev.preventDefault();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datum.value)) { st.textContent = 'Bitte ein Datum angeben.'; return; }
        const werte = { abenteuer_id: a.id, datum: datum.value, text: text.value.trim() };
        if (s) Object.assign(werte, { id: s.id, geaendert_am: s.geaendert_am });
        if (!await h.senden(st, knoepfe, 'session_speichern', { session: werte })) return;
        h.offen.add('ab-' + a.id);
        h.dialog.close();
        h.zeigeAlles();
        zeigeGespeichert(s ? 'Gespeichert' : 'Session gespeichert');
    }
    h.oeffneDialog((s ? 'Session' : 'Neue Session') + ': ' + a.titel, [
        el('form', { class: 'formular', on: { submit: absenden } }, [
            ...h.feld('dsa-se-datum', 'Wann', datum),
            ...h.feld('dsa-se-text', 'Was ist passiert', text),
            st,
            el('div', { class: 'besitz-form-knoepfe' }, knoepfe)
        ])
    ]);
    text.focus();
}

async function loesche(h, x, st, knoepfe, frage, action = 'abenteuer_loeschen') {
    if (!confirm(frage)) return;
    if (!await h.senden(st, knoepfe, action, { id: x.id, geaendert_am: x.geaendert_am })) return;
    h.dialog.close();
    h.zeigeAlles();
    zeigeGespeichert('Gelöscht');
}

// --- DM: Abenteuerideen und Abenteuer, die die Person leitet ---
export function dmAnsicht(h) {
    const { daten } = h;
    const ideen = daten.abenteuer.find((a) => a.art === 'ideen') || null;
    const dm = daten.abenteuer.filter((a) => a.art === 'dm').sort((x, y) => x.titel.localeCompare(y.titel, 'de'));
    const offen = dm.filter((a) => !a.abgeschlossen);
    const fertig = dm.filter((a) => a.abgeschlossen);

    const teile = [];
    // Abenteuerideen: ein Textfeld, das direkt bearbeitet wird
    teile.push(el('section', { class: 'dsa-abschnitt dsa-dm-box' }, [
        el('h2', { class: 'dsa-dm-titel', text: 'Abenteuerideen' }),
        ...textBox(h, 'dsa-dm-ideen', ideen ? ideen.text : '', 8, 'Ideen, Orte, Gegner, Wendungen …', async (wert, st, knoepfe) => {
            const werte = { art: 'ideen', text: wert };
            if (ideen) Object.assign(werte, { id: ideen.id, geaendert_am: ideen.geaendert_am });
            return h.senden(st, knoepfe, 'abenteuer_speichern', { abenteuer: werte });
        })
    ]));
    teile.push(el('div', { class: 'dsa-ab-kopf' }, [
        el('h2', { class: 'dsa-dm-titel', text: 'Abenteuer, die ich leite' }),
        el('button', { class: 'knopf knopf-bereich', text: '+ Abenteuer', attrs: { type: 'button' }, on: { click: () => zeigeDmForm(h, null) } })
    ]));
    if (!offen.length) teile.push(el('p', { class: 'leise', text: fertig.length ? 'Alle Abenteuer sind abgeschlossen.' : 'Noch keins. Lege mit „+ Abenteuer“ eins an.' }));
    offen.forEach((a) => teile.push(dmKarte(h, a)));
    if (fertig.length) {
        teile.push(h.karte('dm-fertig', 'Abgeschlossene Abenteuer', null, fertig.map((a) => dmKarte(h, a)), fertig.length));
    }
    return teile;
}

// Ein Abenteuer als DM: Titel (✎ ändert ihn), Text direkt bearbeiten, Haken „abgeschlossen“ speichert sofort
function dmKarte(h, a) {
    const st = status();
    const haken = el('input', { attrs: { id: 'dsa-dm-fertig-' + a.id, type: 'checkbox', checked: a.abgeschlossen } });
    let text = null;
    const speichere = (wert, s, knoepfe) => h.senden(s, knoepfe, 'abenteuer_speichern', {
        abenteuer: { id: a.id, geaendert_am: a.geaendert_am, art: 'dm', titel: a.titel, text: wert, abgeschlossen: haken.checked }
    });
    const box = textBox(h, 'dsa-dm-text-' + a.id, a.text, 6, 'Worum geht es, was ist vorbereitet …', speichere);
    text = box[1];
    haken.addEventListener('change', async () => {
        if (await speichere(text.value.trim(), st, [haken])) {
            h.zeigeAlles();
            zeigeGespeichert(haken.checked ? 'Abgeschlossen' : 'Wieder offen');
        } else {
            haken.checked = !haken.checked;
        }
    });
    return h.karte('dm-' + a.id, a.titel, { zeichen: '✎', label: 'Titel von ' + a.titel + ' ändern', tun: () => zeigeDmForm(h, a) }, [
        ...box,
        el('div', { class: 'uni-schalter' }, [haken, el('label', { text: 'Abenteuer abgeschlossen', attrs: { for: haken.id } })]),
        st
    ]);
}

// Textfeld mit Knopf „Speichern“, der erst nach einer Änderung aktiv wird
function textBox(h, id, wert, zeilen, platzhalter, speichern) {
    const st = status();
    const feld = el('textarea', { class: 'dsa-dm-feld', attrs: { id, maxlength: MAX_ATEXT, rows: zeilen, placeholder: platzhalter, 'aria-label': platzhalter } });
    feld.value = wert || '';
    const knopf = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'button', disabled: true } });
    feld.addEventListener('input', () => { knopf.disabled = feld.value === (wert || ''); st.textContent = knopf.disabled ? '' : 'Noch nicht gespeichert.'; });
    knopf.addEventListener('click', async () => {
        if (await speichern(feld.value.trim(), st, [knopf, feld])) {
            h.zeigeAlles();
            zeigeGespeichert();
        }
    });
    return [el('label', { class: 'unsichtbar', text: platzhalter, attrs: { for: id } }), feld, el('div', { class: 'dsa-dm-knoepfe' }, [knopf, st])];
}

function zeigeDmForm(h, a) {
    const st = status();
    const titel = h.textFeld('dsa-dm-titel', a && a.titel, 80);
    const knoepfe = h.formKnoepfe(a ? () => loesche(h, a, st, knoepfe, 'Abenteuer „' + a.titel + '“ löschen? (Im Sheet zurückholbar)') : null, 'Löschen');
    async function absenden(ev) {
        ev.preventDefault();
        if (!titel.value.trim()) { st.textContent = 'Bitte einen Titel angeben.'; titel.focus(); return; }
        const werte = a ? { id: a.id, geaendert_am: a.geaendert_am, art: 'dm', titel: titel.value.trim(), text: a.text, abgeschlossen: a.abgeschlossen }
            : { art: 'dm', titel: titel.value.trim(), text: '', abgeschlossen: false };
        const antwort = await h.senden(st, knoepfe, 'abenteuer_speichern', { abenteuer: werte });
        if (!antwort) return;
        if (antwort.id) h.offen.add('dm-' + antwort.id);
        h.dialog.close();
        h.zeigeAlles();
        zeigeGespeichert(a ? 'Gespeichert' : 'Abenteuer angelegt');
    }
    h.oeffneDialog(a ? 'Abenteuer bearbeiten' : 'Neues Abenteuer (DM)', [
        el('form', { class: 'formular', on: { submit: absenden } }, [
            ...h.feld('dsa-dm-titel', 'Titel', titel),
            a ? null : el('p', { class: 'leise besitz-hinweis', text: 'Den Text schreibst du danach direkt in der Karte.' }),
            st,
            el('div', { class: 'besitz-form-knoepfe' }, knoepfe)
        ].filter(Boolean))
    ]);
    titel.focus();
}
