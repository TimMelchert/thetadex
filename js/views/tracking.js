// Reiter Tracking: ein Eintrag pro Tag, dazu eine Übersicht je Jahr als Tabelle mit farbigen Zellen.
// Eingabe: Die Felder kommen aus dem Blatt „Einstellungen“ des Tracking-Sheets
// und werden bei jedem Öffnen neu geladen, nie im Gerät gespeichert (sie verraten, was getrackt wird).

import { el, leeren, heute, kalenderBeiKlick } from '../ui/dom.js';
import { api } from '../api.js';
import { lesen } from '../store.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { farbRegeln } from '../ui/farben.js';

function datumText(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '.' + m[2] + '.' + m[1] : iso;
}

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// Die Felder bleiben nur im Arbeitsspeicher (nie im Gerät gespeichert) und gelten 10 Minuten.
// So öffnet sich das Formular sofort, wenn die App sie beim Start schon geholt hat.
let vorrat = null;
function felderHolen(neu = false) {
    if (!neu && vorrat && Date.now() - vorrat.zeit < 10 * 60 * 1000) return vorrat.anfrage;
    const anfrage = api('tracking', 'einstellungen');
    vorrat = { zeit: Date.now(), anfrage };
    anfrage.catch(() => { if (vorrat && vorrat.anfrage === anfrage) vorrat = null; });
    return anfrage;
}

// Beim Start der App aufgerufen: holt die Felder schon im Hintergrund, wenn Tracking eingerichtet ist.
export function vorladen() {
    if ((lesen('skripte', {}) || {}).tracking && lesen('passwort')) felderHolen().catch(() => {});
}

const istJa = (text) => /^(wahr|true|ja|x|1)$/i.test(String(text).trim());
const alsZahl = (text) => String(text).trim().replace(',', '.');

// Baut ein Feld und gibt { box, lesen, zuruecksetzen } zurück.
function baueFeld(f, nr) {
    const id = 'tracking-feld-' + nr;

    if (f.art === 'haken') {
        const box = el('input', { attrs: { id, type: 'checkbox' } });
        const zurueck = () => { box.checked = istJa(f.vorgabe); };
        zurueck();
        return {
            box: el('label', { class: 'tracking-feld tracking-haken', attrs: { for: id } }, [box, el('span', { text: f.feld })]),
            lesen: () => (box.checked ? 1 : 0),
            zuruecksetzen: zurueck
        };
    }

    let eingabe;
    if (f.art === 'auswahl') {
        eingabe = el('select', { attrs: { id } }, f.optionen.map((o) => el('option', { text: o.text, attrs: { value: o.wert } })));
    } else {
        eingabe = el('input', {
            attrs: { id, type: 'number', inputmode: 'decimal', step: f.schritt ? String(f.schritt) : '1' }
        });
    }
    const zurueck = () => {
        const v = f.art === 'auswahl' ? String(f.vorgabe).trim() : alsZahl(f.vorgabe);
        if (f.art === 'auswahl') {
            eingabe.value = f.optionen.some((o) => o.wert === v) ? v : (f.optionen[0] ? f.optionen[0].wert : '');
        } else {
            eingabe.value = v;
        }
    };
    zurueck();
    return {
        box: el('div', { class: 'tracking-feld' }, [el('label', { text: f.feld, attrs: { for: id } }), eingabe]),
        lesen: () => eingabe.value,
        zuruecksetzen: zurueck
    };
}

export function render(container, ctx) {
    const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const inhalt = el('div', { attrs: { id: 'tracking-eingabe' } }, [el('p', { class: 'leise', text: 'Lädt …' })]);
    const uebersicht = el('div', { attrs: { id: 'tracking-uebersicht', hidden: true } });
    let uebersichtGeladen = false;

    // Umschalter Eingabe / Übersicht (wie Rangliste / Vergleich bei Döner)
    const ansichtKnoepfe = [['Eingabe', inhalt], ['Übersicht', uebersicht]].map(([text, box], i) => {
        const b = el('button', {
            class: 'ansicht', text,
            attrs: { type: 'button', 'aria-pressed': i === 0 ? 'true' : 'false', 'aria-controls': box.id },
            on: {
                click: () => {
                    ansichtKnoepfe.forEach(([k, kb]) => {
                        const an = k === b;
                        k.setAttribute('aria-pressed', an ? 'true' : 'false');
                        kb.hidden = !an;
                    });
                    status.hidden = box !== inhalt;
                    if (box === uebersicht && !uebersichtGeladen) ladeTabelle();
                }
            }
        });
        return [b, box];
    });

    container.append(
        el('h1', { class: 'bereich-titel titel-mit-emoji' }, [
            el('span', { class: 'titel-emoji', text: '📊', attrs: { 'aria-hidden': 'true' } }),
            el('span', { text: 'Tracking Leben' })
        ]),
        el('div', { class: 'ansichten' }, ansichtKnoepfe.map(([b]) => b)),
        inhalt, status, uebersicht
    );

    // --- Übersicht: ein Jahr als Tabelle, Zeile = Tag, Spalte = Feld, Farbe nach Regel aus „Einstellungen“ ---
    async function ladeTabelle(jahr) {
        uebersichtGeladen = true;
        leeren(uebersicht);
        uebersicht.append(el('p', { class: 'leise', text: 'Lädt …' }));
        try {
            const d = await api('tracking', 'tabelle', jahr ? { jahr } : {});
            zeigeTabelle(d);
        } catch (e) {
            uebersichtGeladen = false;
            leeren(uebersicht);
            uebersicht.append(
                el('p', { text: e.message }),
                el('button', { class: 'knopf knopf-zweit', text: 'Erneut versuchen', attrs: { type: 'button' }, on: { click: () => ladeTabelle(jahr) } })
            );
        }
    }

    function zeigeTabelle(d) {
        leeren(uebersicht);
        const felder = Array.isArray(d.felder) ? d.felder : [];
        const zeilen = Array.isArray(d.zeilen) ? d.zeilen : [];
        const jahre = Array.isArray(d.jahre) && d.jahre.length ? d.jahre : [d.jahr];

        const wahl = el('select', { attrs: { id: 'tracking-jahr' }, on: { change: () => ladeTabelle(Number(wahl.value)) } },
            jahre.map((j) => el('option', { text: String(j), attrs: { value: String(j) } })));
        wahl.value = String(d.jahr);
        const neu = el('button', { class: 'knopf knopf-zweit', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => ladeTabelle(Number(wahl.value)) } });
        const auswahlZeile = el('div', { class: 'formular tracking-jahr-zeile' }, [
            el('label', { text: 'Jahr', attrs: { for: 'tracking-jahr' } }), wahl
        ]);
        uebersicht.append(auswahlZeile);

        if (!felder.length) {
            uebersicht.append(el('p', { text: 'Im Blatt „Einstellungen“ stehen noch keine Felder.' }));
            return;
        }

        // Alle Tage des Jahres (im laufenden Jahr bis heute). Tage ohne Eintrag bleiben farblos.
        const jeTag = new Map();
        for (const z of zeilen) {
            if (!jeTag.has(z.datum)) jeTag.set(z.datum, []);
            jeTag.get(z.datum).push(z);
        }
        const bis = String(d.jahr) === heute().slice(0, 4) ? heute() : d.jahr + '-12-31';
        const monate = [];
        for (let t = new Date(d.jahr, 0, 1, 12); ; t.setDate(t.getDate() + 1)) {
            const iso = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
            if (t.getFullYear() !== d.jahr || iso > bis) break;
            if (!monate[t.getMonth()]) monate[t.getMonth()] = [];
            for (const z of jeTag.get(iso) || [{ datum: iso, werte: [] }]) monate[t.getMonth()].push({ ...z, tag: t.getDay() });
        }

        const regeln = felder.map((f) => farbRegeln(f.farben, f.optionen));
        const kopf = () => el('tr', {}, [
            el('th', { class: 'tracking-tab-datum', text: 'Tag', attrs: { scope: 'col' } }),
            ...felder.map((f) => el('th', { class: 'tracking-tab-feld', attrs: { scope: 'col' } }, [el('span', { text: f.feld })]))
        ]);
        // Zahlen werden nicht gezeigt, nur Farben. Für Bildschirmleser und beim Drüberfahren steht der Wert im Titel.
        const zeile = (z) => el('tr', {}, [
            el('th', { class: 'tracking-tab-datum', text: z.datum.slice(8) + '. ' + WOCHENTAGE[z.tag], attrs: { scope: 'row' } }),
            ...felder.map((f, i) => {
                const roh = Array.isArray(z.werte) && z.werte[i] != null ? z.werte[i] : null;
                const farbe = regeln[i](roh);
                const zelle = el('td', {
                    class: farbe && farbe.klasse ? 'zelle-' + farbe.klasse : '',
                    attrs: { title: f.feld + ': ' + (roh == null ? '–' : roh) }
                }, [el('span', { class: 'unsichtbar', text: roh == null ? '–' : String(roh) })]);
                if (farbe && farbe.farbe) zelle.style.backgroundColor = farbe.farbe;
                return zelle;
            })
        ]);

        // Je Monat eine eigene Tabelle untereinander; der Filter zeigt nur einen Monat
        const abschnitte = [];
        monate.forEach((tage, m) => {
            if (!tage) return;
            abschnitte.push([m, el('section', { class: 'tracking-monat' }, [
                el('h2', { class: 'tracking-monat-titel', text: MONATE[m] + ' ' + d.jahr }),
                el('div', { class: 'tracking-tabelle-box', attrs: { tabindex: '0', role: 'region', 'aria-label': MONATE[m] + ' ' + d.jahr } }, [
                    el('table', { class: 'tracking-tabelle' }, [el('thead', {}, [kopf()]), el('tbody', {}, tage.map(zeile))])
                ])
            ])]);
        });
        if (!abschnitte.length) {
            uebersicht.append(el('p', { text: 'Keine Tage in ' + d.jahr + '.' }));
            return;
        }

        const filter = el('select', {
            attrs: { id: 'tracking-monat' },
            on: { change: () => abschnitte.forEach(([m, a]) => { a.hidden = filter.value !== '' && Number(filter.value) !== m; }) }
        }, [el('option', { text: 'Alle Monate', attrs: { value: '' } }), ...abschnitte.map(([m]) => el('option', { text: MONATE[m], attrs: { value: String(m) } }))]);
        auswahlZeile.append(el('label', { text: 'Monat', attrs: { for: 'tracking-monat' } }), filter);

        auswahlZeile.append(neu);
        uebersicht.append(
            el('p', { class: 'leise klein', text: zeilen.length + ' Einträge. Die Farben stehen im Blatt „Einstellungen“, Spalte „farben“.' }),
            ...abschnitte.map(([, a]) => a)
        );
    }

    async function laden() {
        try {
            const d = await felderHolen();
            zeigeFormular(Array.isArray(d.felder) ? d.felder : [], Array.isArray(d.fehlend) ? d.fehlend : []);
        } catch (e) {
            leeren(inhalt);
            inhalt.append(
                el('p', { text: e.message }),
                el('button', { class: 'knopf knopf-zweit', text: 'Erneut versuchen', attrs: { type: 'button' }, on: { click: laden } })
            );
        }
    }

    function zeigeFormular(felder, fehlend) {
        leeren(inhalt);
        if (!felder.length) {
            inhalt.append(el('div', { class: 'karte' }, [
                el('p', { text: 'Im Blatt „Einstellungen“ des Tracking-Sheets stehen noch keine Felder.' })
            ]));
            return;
        }

        // Datum: heute, nach Mitternacht wieder heute, solange es nicht von Hand geändert wurde
        let datumManuell = false;
        const datum = kalenderBeiKlick(el('input', {
            attrs: { id: 'tracking-datum', type: 'date', value: heute(), required: true, autocomplete: 'off' },
            on: { change: () => { datumManuell = true; } }
        }));
        const wiederDa = () => {
            if (!datum.isConnected) { document.removeEventListener('visibilitychange', wiederDa); return; }
            if (!document.hidden && !datumManuell) datum.value = heute();
        };
        document.addEventListener('visibilitychange', wiederDa);

        // Felder nach Gruppe, in der Reihenfolge des Blatts
        const gebaut = felder.map((f, i) => ({ f, ...baueFeld(f, i) }));
        const gruppen = [];
        for (const g of gebaut) {
            const name = g.f.gruppe || 'Weiteres';
            let gruppe = gruppen.find((x) => x.name === name);
            if (!gruppe) gruppen.push(gruppe = { name, felder: [] });
            gruppe.felder.push(g);
        }

        const knopf = el('button', { class: 'knopf', text: 'Speichern', attrs: { type: 'submit' } });
        let sendet = false;

        async function speichern(ev) {
            ev.preventDefault();
            if (sendet) return;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(datum.value)) {
                status.textContent = 'Bitte ein Datum wählen.';
                datum.focus();
                return;
            }
            const values = {};
            for (const g of gebaut) values[g.f.feld] = g.lesen();

            sendet = true;
            knopf.disabled = true;
            status.textContent = 'Speichere …';
            try {
                const d = await api('tracking', 'eintragen', { datum: datum.value, values });
                status.textContent = '';
                zeigeGespeichert('Gespeichert', 'für ' + datumText(d.datum || datum.value));
                uebersichtGeladen = false; // Übersicht beim nächsten Öffnen neu laden
                gebaut.forEach((g) => g.zuruecksetzen());
                datumManuell = false;
                datum.value = heute();
            } catch (e) {
                status.textContent = 'Nicht gespeichert: ' + e.message;
            } finally {
                sendet = false;
                knopf.disabled = false;
            }
        }

        const formular = el('form', { class: 'formular tracking-formular', attrs: { novalidate: true }, on: { submit: speichern } }, [
            el('label', { text: 'Datum', attrs: { for: 'tracking-datum' } }),
            datum,
            ...gruppen.map((g) => el('fieldset', { class: 'karte tracking-gruppe' }, [
                el('legend', { text: g.name }),
                el('div', { class: 'tracking-raster' }, g.felder.map((x) => x.box))
            ])),
            knopf
        ]);
        inhalt.append(formular);

        if (fehlend.length) {
            inhalt.append(el('p', { class: 'leise', text: 'Hinweis: Diese Felder aus „Einstellungen“ fehlen in der Kopfzeile des Sheets und werden nicht gezeigt: ' + fehlend.join(', ') }));
        }
    }

    laden();
}
