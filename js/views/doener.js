// Reiter Döner Landau (öffentlich): Rangliste aller Läden, Einzelheiten je Laden, neue Bewertung.
// Ohne Passwort. Die Script-Adresse kommt aus der Einrichtung oder aus dem geteilten Link #/doener/<kennung>.

import { el, leeren } from '../ui/dom.js';
import { lesen, schreiben } from '../store.js';
import { apiOeffentlich } from '../api.js';

const TEILE = [['doener', 'Döner'], ['yufka', 'Yufka'], ['pommes', 'Pommes']];
// Für die ausführliche Bewertung; „laden“ (Service, Gemütlichkeit …) zählt nicht zu „Insgesamt“
const ALLE_TEILE = [...TEILE, ['laden', 'Laden']];
const NEU = '__neu__';
// Bei Fleisch heißt das Kriterium „Seitan“ „Fleisch“ (das Skript speichert es auch so)
const TAUSCH_FLEISCH = { Seitan: 'Fleisch' };
const kritName = (name, fleisch) => (fleisch && TAUSCH_FLEISCH[name]) || name;
const KENNUNG = /^[A-Za-z0-9_-]{20,120}$/;
const ADRESSE = /^https:\/\/script\.google\.com\/macros\/s\/([A-Za-z0-9_-]+)\/exec$/;

// Kennung des Skripts: geteilter Link zuerst (wird für Besucher gemerkt), dann Einrichtung, dann gemerkter Link.
function kennungFinden(teile) {
    const ausLink = teile[0] || '';
    if (KENNUNG.test(ausLink)) {
        const oeffentlich = lesen('oeffentlich', {}) || {};
        if (oeffentlich.doener !== ausLink) schreiben('oeffentlich', { ...oeffentlich, doener: ausLink });
        return ausLink;
    }
    const eigen = ADRESSE.exec((lesen('skripte', {}) || {}).doener || '');
    if (eigen) return eigen[1];
    const gemerkt = (lesen('oeffentlich', {}) || {}).doener || '';
    return KENNUNG.test(gemerkt) ? gemerkt : '';
}

// Bewertung mit 10 kleinen Dönern (🥙 per CSS). Antippen = ganzer Wert, nochmal antippen = halber Wert darunter.
// „×“ löscht den Wert (Kriterium nicht bewerten). Rechts steht die Zahl.
function sterneWahl(id, titel) {
    let wert = null;
    const zahlText = el('span', { class: 'wahl-zahl', attrs: { 'aria-hidden': 'true' } });
    const knoepfe = Array.from({ length: 10 }, (_, k) => el('button', {
        class: 'wahl-stern',
        attrs: { type: 'button', 'aria-label': titel + ': ' + (k + 1) + ' von 10' },
        on: { click: () => setze(wert === k + 1 ? k + 0.5 : k + 1) }
    }));
    const leer = el('button', {
        class: 'wahl-leer', text: '×',
        attrs: { type: 'button', 'aria-label': titel + ': nicht bewerten' },
        on: { click: () => setze(null) }
    });
    const status = el('span', { class: 'unsichtbar', attrs: { 'aria-live': 'polite' } });

    function setze(neu) {
        wert = neu;
        knoepfe.forEach((b, k) => {
            const n = k + 1;
            b.classList.toggle('voll', wert != null && wert >= n);
            b.classList.toggle('halb', wert === n - 0.5);
            b.setAttribute('aria-pressed', wert != null && wert >= n - 0.5 ? 'true' : 'false');
        });
        zahlText.textContent = wert == null ? '–' : zahl(wert).replace(',0', '');
        leer.hidden = wert == null;
        status.textContent = wert == null ? titel + ': nicht bewertet' : titel + ': ' + zahlText.textContent;
    }
    setze(null);

    const box = el('div', { class: 'wahl', attrs: { role: 'group', 'aria-labelledby': id } }, [
        el('span', { class: 'wahl-reihe' }, knoepfe), zahlText, leer, status
    ]);
    return { box, wert: () => wert, leeren: () => setze(null), fokus: () => knoepfe[0].focus() };
}

function zahl(n) {
    return n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function datumText(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '.' + m[2] + '.' + m[1] : '';
}

function schnitt(werte) {
    return werte.length ? werte.reduce((a, b) => a + b, 0) / werte.length : null;
}

// Fasst die Bewertungen je Laden zusammen. Insgesamt = Durchschnitt der Teile, die Bewertungen haben.
export function rangliste(bewertungen) {
    const je = new Map();
    for (const b of bewertungen) {
        const name = String(b.laden || '').trim();
        if (!name) continue;
        const schluessel = name.toLowerCase();
        if (!je.has(schluessel)) je.set(schluessel, { name, liste: [] });
        je.get(schluessel).liste.push(b);
    }
    const laeden = [...je.values()].map((l) => {
        const teile = {};
        for (const [t] of TEILE) {
            teile[t] = schnitt(l.liste.map((b) => b[t]).filter((v) => typeof v === 'number'));
        }
        const vorhanden = TEILE.map(([t]) => teile[t]).filter((v) => v != null);
        teile.laden = schnitt(l.liste.map((b) => b.laden_note).filter((v) => typeof v === 'number'));
        const liste = l.liste.slice().sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
        // Durchschnitt je Kriterium (Schlüssel „teil|name“) für den Vergleich
        const sammeln = {};
        for (const b of l.liste) {
            for (const k of Array.isArray(b.kriterien) ? b.kriterien : []) {
                if (typeof k.wert !== 'number') continue;
                (sammeln[k.teil + '|' + k.name] = sammeln[k.teil + '|' + k.name] || []).push(k.wert);
            }
        }
        const kriterien = {};
        for (const [schl, werte] of Object.entries(sammeln)) kriterien[schl] = schnitt(werte);
        return { name: l.name, teile, insgesamt: schnitt(vorhanden), liste, kriterien };
    });
    return laeden.sort((a, b) => (b.insgesamt || 0) - (a.insgesamt || 0) || a.name.localeCompare(b.name, 'de'));
}

export function render(container, ctx) {
    const kennung = kennungFinden(ctx.teile || []);
    const eigeneAdresse = Boolean(ADRESSE.exec((lesen('skripte', {}) || {}).doener || ''));

    const TITEL = { vegan: 'Veganes Döner-Rating Landau', fleisch: 'Fleisch-Döner-Rating Landau' };
    const titelText = el('span', { text: TITEL.vegan });
    container.append(el('h1', { class: 'bereich-titel doener-titel' }, [
        el('span', { class: 'doener-emoji', text: '🥙', attrs: { 'aria-hidden': 'true' } }),
        titelText
    ]));

    if (!kennung) {
        container.append(el('div', { class: 'karte' }, [
            el('p', { text: 'Für diesen Reiter brauchst du den Link von der Person, die ihn mit dir teilt.' }),
            el('p', { class: 'leise', text: 'Wenn das deine Bewertung ist: Trage die Script-Adresse „Döner“ unter Einstellungen ein.' })
        ]));
        return;
    }

    const adresse = 'https://script.google.com/macros/s/' + kennung + '/exec';
    const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const listeBox = el('div', { class: 'doener-liste' });
    let laedenNamen = [];
    let kriterien = {};
    let alleBewertungen = [];
    let sorte = 'vegan';   // Ranglisten getrennt: 'vegan' oder 'fleisch'

    async function laden() {
        try {
            const d = await apiOeffentlich(adresse, 'liste');
            laedenNamen = Array.isArray(d.laeden) ? d.laeden : [];
            kriterien = d.kriterien && typeof d.kriterien === 'object' ? d.kriterien : {};
            baueLadenAuswahl();
            baueAusfuehrlich();
            alleBewertungen = Array.isArray(d.bewertungen) ? d.bewertungen : [];
            zeige();
            if (status.textContent === 'Lädt …') status.textContent = '';
        } catch (e) {
            status.textContent = e.message;
            leeren(listeBox);
            listeBox.append(el('button', { class: 'knopf knopf-zweit', text: 'Erneut versuchen', attrs: { type: 'button' }, on: { click: laden } }));
        }
    }

    // Zeigt Rangliste und Vergleich nur für die gewählte Sorte (ohne Häkchen „Fleisch“ = vegan)
    function zeige() {
        const laeden = rangliste(alleBewertungen.filter((b) => (b.fleisch === true) === (sorte === 'fleisch')));
        titelText.textContent = TITEL[sorte];
        zeigeListe(laeden);
        zeigeVergleich(laeden);
    }

    // Vergleich: je Teil und je Kriterium alle Läden nebeneinander, Gewinner mit 🏆
    function zeigeVergleich(laeden) {
        leeren(vergleichBox);
        if (!laeden.length) {
            vergleichBox.append(el('p', { text: 'Noch keine Bewertungen.' }));
            return;
        }
        const gruppen = [['gesamt', 'Gesamt', [['', 'Insgesamt'], ...ALLE_TEILE]]];
        for (const [t, titel] of ALLE_TEILE) {
            const namen = Array.isArray(kriterien[t]) ? kriterien[t] : [];
            const fleisch = sorte === 'fleisch';
            if (namen.length) gruppen.push([t, titel, namen.map((n) => [kritName(n, fleisch), kritName(n, fleisch)])]);
        }
        gruppen.forEach(([gruppe, titel, zeilen], gi) => {
            const wert = (l, schl) => {
                if (gruppe !== 'gesamt') return l.kriterien[gruppe + '|' + schl];
                return schl === '' ? l.insgesamt : l.teile[schl];
            };
            const karten = zeilen.map(([schl, name]) => {
                const mit = laeden.map((l) => ({ name: l.name, w: wert(l, schl) }))
                    .filter((x) => typeof x.w === 'number')
                    .sort((a, b) => b.w - a.w || a.name.localeCompare(b.name, 'de'));
                if (!mit.length) return null;
                const best = mit[0].w;
                return el('div', { class: 'vergleich-kriterium' }, [
                    el('p', { class: 'vergleich-titel', text: name }),
                    el('ul', {}, mit.map((x) => {
                        const balken = el('span', { class: 'doener-balken' });
                        balken.style.setProperty('--anteil', String(x.w / 10));
                        const sieger = x.w === best;
                        return el('li', { class: sieger ? 'vergleich-zeile sieger' : 'vergleich-zeile' }, [
                            el('span', { class: 'vergleich-laden' }, [
                                el('span', { class: 'vergleich-pokal', text: sieger ? '🏆' : '' }),
                                el('span', { text: x.name })
                            ]),
                            el('span', { class: 'doener-leiste', attrs: { 'aria-hidden': 'true' } }, [balken]),
                            el('span', { class: 'doener-wert', text: zahl(x.w) })
                        ]);
                    }))
                ]);
            }).filter(Boolean);
            if (!karten.length) return;
            vergleichBox.append(el('details', { class: 'vergleich-gruppe', attrs: { open: gi === 0 } }, [
                el('summary', { text: titel }),
                ...karten
            ]));
        });
    }

    function zeigeListe(laeden) {
        leeren(listeBox);
        if (!laeden.length) {
            listeBox.append(el('p', { text: 'Noch keine Bewertungen. Sei die erste Person!' }));
            return;
        }
        listeBox.append(el('ol', { class: 'doener-rangliste' }, laeden.map(zeigeLaden)));
    }

    // Klappt einen Bereich auf und zu und hält aria-expanded aktuell
    function klapper(knopf, bereich) {
        knopf.addEventListener('click', () => {
            const auf = knopf.getAttribute('aria-expanded') === 'true';
            knopf.setAttribute('aria-expanded', auf ? 'false' : 'true');
            bereich.hidden = auf;
        });
    }

    function zeigeLaden(l, i) {
        const balken = el('span', { class: 'doener-balken' });
        balken.style.setProperty('--anteil', String((l.insgesamt || 0) / 10));
        const details = el('div', { class: 'doener-details', attrs: { id: 'doener-details-' + i, hidden: true } }, [
            el('dl', { class: 'doener-teile' }, ALLE_TEILE.filter(([t]) => t !== 'laden' || l.teile.laden != null).flatMap(([t, titel]) => [
                el('dt', { text: titel }),
                el('dd', { text: l.teile[t] == null ? '–' : zahl(l.teile[t]) })
            ])),
            el('ul', { class: 'doener-bewertungen' }, l.liste.map((b, j) => zeigeBewertung(b, i + '-' + j)))
        ]);
        const anzahl = l.liste.length === 1 ? '1 Bewertung' : l.liste.length + ' Bewertungen';
        const knopf = el('button', {
            class: 'doener-laden',
            attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'doener-details-' + i }
        }, [
            el('span', { class: 'doener-kopf' }, [
                el('span', { class: 'doener-name' }, [
                    el('span', { text: (i + 1) + '. ' + l.name }),
                    el('span', { class: 'doener-anzahl', text: anzahl })
                ]),
                el('span', { class: 'doener-wert', text: zahl(l.insgesamt || 0) })
            ]),
            el('span', { class: 'doener-leiste', attrs: { 'aria-hidden': 'true' } }, [balken])
        ]);
        klapper(knopf, details);
        return el('li', {}, [knopf, details]);
    }

    // Eine Bewertung: Werte, rechts daneben der Knopf für alle Kriterien
    function zeigeBewertung(b, nr) {
        const werte = ALLE_TEILE.map(([t, titel]) => [titel, t === 'laden' ? b.laden_note : b[t]])
            .filter(([, w]) => typeof w === 'number').map(([titel, w]) => titel + ' ' + zahl(w)).join(' · ');
        const liste = Array.isArray(b.kriterien) ? b.kriterien : [];
        let kriterienBox = null;
        let kriterienKnopf = null;
        if (liste.length) {
            kriterienBox = el('div', { class: 'doener-kriterien', attrs: { id: 'doener-krit-' + nr, hidden: true } },
                ALLE_TEILE.filter(([t]) => liste.some((k) => k.teil === t)).map(([t, titel]) => el('div', {}, [
                    el('p', { class: 'doener-krit-titel', text: titel }),
                    el('ul', {}, liste.filter((k) => k.teil === t).map((k) => el('li', {}, [
                        el('span', { class: 'doener-krit-kopf' }, [el('span', { text: k.name }), el('span', { text: zahl(k.wert) })]),
                        k.begruendung ? el('span', { class: 'leise', text: k.begruendung }) : null
                    ])))
                ])));
            kriterienKnopf = el('button', {
                class: 'doener-krit-knopf', text: 'Kriterien (' + liste.length + ')',
                attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'doener-krit-' + nr }
            });
            klapper(kriterienKnopf, kriterienBox);
        }
        return el('li', {}, [
            el('div', { class: 'doener-bew-zeile' }, [el('p', { class: 'doener-sterne', text: werte }), kriterienKnopf]),
            b.begruendung ? el('p', { text: b.begruendung }) : null,
            b.datum ? el('p', { class: 'leise', text: datumText(b.datum) }) : null,
            kriterienBox
        ]);
    }

    // --- Formular „Bewerten“ ---
    const formMeldung = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const ladenWahl = el('select', { attrs: { id: 'doener-laden' } });
    const ladenNeu = el('input', { attrs: { id: 'doener-laden-neu', type: 'text', maxlength: 60, autocomplete: 'off', 'aria-label': 'Name des neuen Ladens', placeholder: 'Name des neuen Ladens', hidden: true } });
    ladenWahl.addEventListener('change', () => {
        ladenNeu.hidden = ladenWahl.value !== NEU;
        if (!ladenNeu.hidden) ladenNeu.focus();
    });

    function baueLadenAuswahl() {
        const vorher = ladenWahl.value;
        leeren(ladenWahl);
        ladenWahl.append(
            el('option', { text: 'Laden wählen …', attrs: { value: '' } }),
            ...laedenNamen.slice().sort((a, b) => a.localeCompare(b, 'de')).map((n) => el('option', { text: n, attrs: { value: n } })),
            el('option', { text: '+ Neuer Laden …', attrs: { value: NEU } })
        );
        if ([...ladenWahl.options].some((o) => o.value === vorher)) ladenWahl.value = vorher;
    }
    baueLadenAuswahl();

    const fleischSchalter = el('input', { attrs: { id: 'doener-fleisch', type: 'checkbox' } });
    const schnellWahl = TEILE.map(([t, titel]) => ({ t, titel, wahl: sterneWahl('doener-titel-' + t, titel) }));

    // Ausführlich: je Kriterium ein Wert (halbe erlaubt) und eine Begründung
    const ausfuehrlichSchalter = el('input', { attrs: { id: 'doener-ausfuehrlich', type: 'checkbox' } });
    const schnellBox = el('div', { class: 'doener-schnell' }, schnellWahl.map((s) => el('div', { class: 'doener-krit-zeile' }, [
        el('span', { class: 'doener-wahl-titel', text: s.titel, attrs: { id: 'doener-titel-' + s.t } }),
        s.wahl.box
    ])));
    const ausfuehrlichBox = el('div', { class: 'doener-ausfuehrlich', attrs: { hidden: true } });
    let kriterienFelder = [];

    function baueAusfuehrlich() {
        leeren(ausfuehrlichBox);
        kriterienFelder = [];
        let nr = 0;
        for (const [t, titel] of ALLE_TEILE) {
            const namen = Array.isArray(kriterien[t]) ? kriterien[t] : [];
            if (!namen.length) continue;
            const zeilen = namen.map((name) => {
                nr += 1;
                const wahl = sterneWahl('doener-k' + nr, name);
                const begr = el('input', { attrs: { type: 'text', maxlength: 200, placeholder: 'Begründung (freiwillig)', 'aria-label': 'Begründung ' + name } });
                const titelEl = el('span', { class: 'doener-wahl-titel', text: kritName(name, fleischSchalter.checked), attrs: { id: 'doener-k' + nr } });
                kriterienFelder.push({ teil: t, kriterium: name, wahl, begr, titelEl });
                return el('div', { class: 'doener-krit-zeile' }, [titelEl, wahl.box, begr]);
            });
            ausfuehrlichBox.append(el('details', { class: 'doener-krit-gruppe' }, [
                el('summary', { text: titel + ' (' + namen.length + (namen.length === 1 ? ' Kriterium)' : ' Kriterien)') }),
                ...zeilen
            ]));
        }
        ausfuehrlichSchalter.disabled = !kriterienFelder.length;
    }

    // Fleisch-Häkchen benennt die getauschten Kriterien im Formular um
    function kriterienBenennen() {
        kriterienFelder.forEach((k) => { k.titelEl.textContent = kritName(k.kriterium, fleischSchalter.checked); });
    }
    fleischSchalter.addEventListener('change', kriterienBenennen);

    ausfuehrlichSchalter.addEventListener('change', () => {
        schnellBox.hidden = ausfuehrlichSchalter.checked;
        ausfuehrlichBox.hidden = !ausfuehrlichSchalter.checked;
    });

    const begruendungFeld = el('textarea', { attrs: { id: 'doener-begruendung', maxlength: 300, rows: 3 } });
    // Lockfeld gegen Bots: für Menschen unsichtbar und nicht erreichbar
    const lockFeld = el('input', { attrs: { name: 'web', type: 'text', tabindex: '-1', autocomplete: 'off' } });
    const sendenKnopf = el('button', { class: 'knopf', text: 'Bewertung senden', attrs: { type: 'submit' } });

    function formularLeeren() {
        formular.reset();
        kriterienBenennen();
        ladenNeu.hidden = true;
        schnellWahl.forEach((s) => s.wahl.leeren());
        kriterienFelder.forEach((k) => k.wahl.leeren());
        schnellBox.hidden = false;
        ausfuehrlichBox.hidden = true;
        formMeldung.textContent = '';
    }

    async function senden(ev) {
        ev.preventDefault();
        const ladenName = ladenWahl.value === NEU ? ladenNeu.value.trim() : ladenWahl.value;
        const daten = { laden: ladenName, fleisch: fleischSchalter.checked, begruendung: begruendungFeld.value.trim(), web: lockFeld.value };
        const ausfuehrlich = ausfuehrlichSchalter.checked;
        if (ausfuehrlich) {
            daten.details = kriterienFelder.filter((k) => k.wahl.wert() != null).map((k) => ({
                teil: k.teil, kriterium: k.kriterium, wert: k.wahl.wert(), begruendung: k.begr.value.trim()
            }));
        } else {
            for (const s of schnellWahl) daten[s.t] = s.wahl.wert() == null ? '' : s.wahl.wert();
        }
        if (!daten.laden) {
            formMeldung.textContent = ladenWahl.value === NEU ? 'Bitte den Namen des neuen Ladens eintragen.' : 'Bitte einen Laden wählen.';
            (ladenWahl.value === NEU ? ladenNeu : ladenWahl).focus();
            return;
        }
        const essenBewertet = ausfuehrlich
            ? daten.details.some((k) => k.teil !== 'laden')
            : schnellWahl.some((s) => s.wahl.wert() != null);
        if (!essenBewertet) {
            formMeldung.textContent = 'Bitte mindestens Döner, Yufka oder Pommes bewerten.';
            if (ausfuehrlich) ausfuehrlichSchalter.focus(); else schnellWahl[0].wahl.fokus();
            return;
        }
        sendenKnopf.disabled = true;
        formMeldung.textContent = 'Wird gesendet …';
        try {
            await apiOeffentlich(adresse, 'bewerten', daten);
            waehleSorte(daten.fleisch ? 'fleisch' : 'vegan');
            formularLeeren();
            zeigeFormular(false);
            const danke = 'Danke! Deine Bewertung ist gespeichert.';
            status.textContent = danke;
            // Nach ein paar Sekunden wieder ausblenden, wenn nichts anderes dort steht
            setTimeout(() => { if (status.textContent === danke) status.textContent = ''; }, 6000);
            laden();
        } catch (e) {
            formMeldung.textContent = e.message;
        } finally {
            sendenKnopf.disabled = false;
        }
    }

    const formular = el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: senden } }, [
        el('label', { text: 'Laden', attrs: { for: 'doener-laden' } }),
        ladenWahl,
        ladenNeu,
        el('div', { class: 'doener-schalter' }, [
            fleischSchalter,
            el('label', { text: 'Fleisch (leer lassen = vegan)', attrs: { for: 'doener-fleisch' } })
        ]),
        el('div', { class: 'doener-schalter' }, [
            ausfuehrlichSchalter,
            el('label', { text: 'Ausführlich bewerten (alle Kriterien)', attrs: { for: 'doener-ausfuehrlich' } })
        ]),
        el('p', { class: 'leise klein', text: 'Antippen = ganze Zahl, nochmal antippen = halbe. × = nicht bewerten.' }),
        schnellBox,
        ausfuehrlichBox,
        el('label', { text: 'Begründung (freiwillig)', attrs: { for: 'doener-begruendung' } }),
        begruendungFeld,
        el('div', { class: 'lockfeld', attrs: { 'aria-hidden': 'true' } }, [lockFeld]),
        el('div', { class: 'doener-form-knoepfe' }, [
            sendenKnopf,
            el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: abbrechen } })
        ]),
        formMeldung
    ]);

    // × schließt nur (Eingaben bleiben), „Abbrechen“ verwirft die Eingaben
    function abbrechen() {
        formularLeeren();
        zeigeFormular(false);
    }

    const formBox = el('div', { class: 'karte doener-bewerten', attrs: { id: 'doener-formular', hidden: true } }, [
        el('div', { class: 'doener-form-kopf' }, [
            el('h2', { text: 'Bewerten' }),
            el('button', { class: 'doener-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Formular schließen' }, on: { click: () => zeigeFormular(false) } })
        ]),
        formular
    ]);
    const bewertenKnopf = el('button', {
        class: 'knopf', text: '+ Bewerten',
        attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'doener-formular' },
        on: { click: () => zeigeFormular(formBox.hidden) }
    });

    function zeigeFormular(auf) {
        formBox.hidden = !auf;
        bewertenKnopf.setAttribute('aria-expanded', auf ? 'true' : 'false');
        if (auf) status.textContent = '';
        else bewertenKnopf.focus();
    }

    // Umschalter Rangliste / Vergleich
    const vergleichBox = el('div', { class: 'doener-vergleich', attrs: { id: 'doener-vergleich', hidden: true } });
    listeBox.id = 'doener-rangliste';
    const ansichtKnoepfe = [['Rangliste', listeBox], ['Vergleich', vergleichBox]].map(([text, box], i) => {
        const b = el('button', {
            class: 'doener-ansicht', text,
            attrs: { type: 'button', 'aria-pressed': i === 0 ? 'true' : 'false', 'aria-controls': box.id },
            on: {
                click: () => {
                    ansichtKnoepfe.forEach(([k, kb]) => {
                        const an = k === b;
                        k.setAttribute('aria-pressed', an ? 'true' : 'false');
                        kb.hidden = !an;
                    });
                }
            }
        });
        return [b, box];
    });

    // Umschalter Vegan / Fleisch
    const sorteKnoepfe = [['vegan', 'Vegan'], ['fleisch', 'Fleisch']].map(([wert, text]) => el('button', {
        class: 'doener-ansicht', text,
        attrs: { type: 'button', 'aria-pressed': wert === sorte ? 'true' : 'false', 'data-sorte': wert },
        on: { click: () => waehleSorte(wert) }
    }));
    function waehleSorte(neu) {
        sorte = neu;
        sorteKnoepfe.forEach((k) => k.setAttribute('aria-pressed', k.dataset.sorte === sorte ? 'true' : 'false'));
        zeige();
    }

    status.textContent = 'Lädt …';
    container.append(
        el('div', { class: 'doener-aktionen' }, [bewertenKnopf]),
        formBox,
        status,
        el('div', { class: 'doener-umschalter' }, [
            el('div', { class: 'doener-ansichten', attrs: { role: 'group', 'aria-label': 'Sorte' } }, sorteKnoepfe),
            el('div', { class: 'doener-ansichten', attrs: { role: 'group', 'aria-label': 'Ansicht' } }, ansichtKnoepfe.map(([b]) => b))
        ]),
        listeBox,
        vergleichBox
    );

    // Nur für die Person mit eigener Einrichtung: Link zum Teilen
    if (eigeneAdresse) {
        const teilenMeldung = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const link = location.origin + location.pathname + '#/doener/' + kennung;
        container.append(el('h2', { text: 'Teilen' }),
            el('p', { class: 'leise', text: 'Mit diesem Link können andere bewerten, ohne Passwort. Sie sehen nur diesen Reiter.' }),
            el('button', {
                class: 'knopf knopf-zweit', text: 'Link zum Teilen kopieren', attrs: { type: 'button' },
                on: {
                    click: async () => {
                        try {
                            await navigator.clipboard.writeText(link);
                            teilenMeldung.textContent = 'Link kopiert.';
                        } catch (e) {
                            teilenMeldung.textContent = link;
                        }
                    }
                }
            }),
            teilenMeldung);
    }

    laden();
}
