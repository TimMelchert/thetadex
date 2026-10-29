// Reiter Döner Landau (öffentlich): Rangliste aller Läden, Einzelheiten je Laden, neue Bewertung.
// Ohne Passwort. Die Script-Adresse kommt aus der Einrichtung oder aus dem geteilten Link #/doener/<kennung>.

import { el, leeren } from '../ui/dom.js';
import { lesen, schreiben } from '../store.js';
import { apiOeffentlich } from '../api.js';

const TEILE = [['doener', 'Döner'], ['yufka', 'Yufka'], ['pommes', 'Pommes']];
// Für die ausführliche Bewertung; „laden“ (Service, Gemütlichkeit …) zählt nicht zu „Insgesamt“
const ALLE_TEILE = [...TEILE, ['laden', 'Laden']];
const HALBE = Array.from({ length: 19 }, (_, k) => 1 + k / 2);
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
        return { name: l.name, teile, insgesamt: schnitt(vorhanden), liste };
    });
    return laeden.sort((a, b) => (b.insgesamt || 0) - (a.insgesamt || 0) || a.name.localeCompare(b.name, 'de'));
}

export function render(container, ctx) {
    const kennung = kennungFinden(ctx.teile || []);
    const eigeneAdresse = Boolean(ADRESSE.exec((lesen('skripte', {}) || {}).doener || ''));

    container.append(el('h1', { class: 'bereich-titel', text: 'Döner Landau' }));

    if (!kennung) {
        container.append(el('div', { class: 'karte' }, [
            el('p', { text: 'Für diesen Reiter brauchst du den Link von der Person, die ihn mit dir teilt.' }),
            el('p', { class: 'leise', text: 'Wenn das deine Bewertung ist: Trage die Script-Adresse „Döner“ unter Einrichtung ein.' })
        ]));
        return;
    }

    const adresse = 'https://script.google.com/macros/s/' + kennung + '/exec';
    const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const listeBox = el('div', { class: 'doener-liste' });
    let laedenNamen = [];
    let kriterien = {};

    async function laden() {
        status.textContent = 'Lädt …';
        try {
            const d = await apiOeffentlich(adresse, 'liste');
            laedenNamen = Array.isArray(d.laeden) ? d.laeden : [];
            kriterien = d.kriterien && typeof d.kriterien === 'object' ? d.kriterien : {};
            baueAusfuehrlich();
            zeigeListe(rangliste(Array.isArray(d.bewertungen) ? d.bewertungen : []));
            status.textContent = '';
        } catch (e) {
            status.textContent = e.message;
            leeren(listeBox);
            listeBox.append(el('button', { class: 'knopf knopf-zweit', text: 'Erneut versuchen', attrs: { type: 'button' }, on: { click: laden } }));
        }
    }

    function zeigeListe(laeden) {
        leeren(listeBox);
        if (!laeden.length) {
            listeBox.append(el('p', { text: 'Noch keine Bewertungen. Sei die erste Person!' }));
            return;
        }
        listeBox.append(el('ol', { class: 'doener-rangliste' }, laeden.map(zeigeLaden)));
    }

    function zeigeLaden(l, i) {
        const balken = el('span', { class: 'doener-balken' });
        balken.style.setProperty('--anteil', String((l.insgesamt || 0) / 10));
        const details = el('div', { class: 'doener-details', attrs: { id: 'doener-details-' + i, hidden: true } }, [
            el('dl', { class: 'doener-teile' }, ALLE_TEILE.filter(([t]) => t !== 'laden' || l.teile.laden != null).flatMap(([t, titel]) => [
                el('dt', { text: titel }),
                el('dd', { text: l.teile[t] == null ? '–' : zahl(l.teile[t]) })
            ])),
            el('ul', { class: 'doener-bewertungen' }, l.liste.map((b) => el('li', {}, [
                el('p', { class: 'doener-sterne', text: ALLE_TEILE.map(([t, titel]) => [titel, t === 'laden' ? b.laden_note : b[t]]).filter(([, w]) => typeof w === 'number').map(([titel, w]) => titel + ' ' + zahl(w)).join(' · ') }),
                b.begruendung ? el('p', { text: b.begruendung }) : null,
                b.datum ? el('p', { class: 'leise', text: datumText(b.datum) }) : null,
                zeigeKriterien(b.kriterien)
            ])))
        ]);
        const knopf = el('button', {
            class: 'doener-laden',
            attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'doener-details-' + i },
            on: {
                click: () => {
                    const auf = knopf.getAttribute('aria-expanded') === 'true';
                    knopf.setAttribute('aria-expanded', auf ? 'false' : 'true');
                    details.hidden = auf;
                }
            }
        }, [
            el('span', { class: 'doener-kopf' }, [
                el('span', { class: 'doener-name', text: (i + 1) + '. ' + l.name }),
                el('span', { class: 'doener-wert', text: zahl(l.insgesamt || 0) })
            ]),
            el('span', { class: 'doener-leiste', attrs: { 'aria-hidden': 'true' } }, [balken]),
            el('span', { class: 'leise doener-anzahl', text: l.liste.length === 1 ? '1 Bewertung' : l.liste.length + ' Bewertungen' })
        ]);
        return el('li', {}, [knopf, details]);
    }

    // Kriterien einer ausführlichen Bewertung, aufklappbar
    function zeigeKriterien(liste) {
        if (!Array.isArray(liste) || !liste.length) return null;
        return el('details', { class: 'doener-kriterien' }, [
            el('summary', { text: 'Alle Kriterien (' + liste.length + ')' }),
            ...ALLE_TEILE.filter(([t]) => liste.some((k) => k.teil === t)).map(([t, titel]) => el('div', {}, [
                el('p', { class: 'doener-krit-titel', text: titel }),
                el('ul', {}, liste.filter((k) => k.teil === t).map((k) => el('li', {}, [
                    el('span', { class: 'doener-krit-kopf' }, [el('span', { text: k.name }), el('span', { text: zahl(k.wert) })]),
                    k.begruendung ? el('span', { class: 'leise', text: k.begruendung }) : null
                ])))
            ]))
        ]);
    }

    // --- Formular „Bewerten“ ---
    const formMeldung = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const ladenFeld = el('input', { attrs: { id: 'doener-laden', list: 'doener-laeden', maxlength: 60, autocomplete: 'off', required: true } });
    const ladenListe = el('datalist', { attrs: { id: 'doener-laeden' } });
    const sterneFelder = TEILE.map(([t, titel]) => ({
        t,
        titel,
        feld: el('select', { attrs: { id: 'doener-' + t } }, [
            el('option', { text: '–', attrs: { value: '' } }),
            ...Array.from({ length: 10 }, (_, k) => el('option', { text: String(k + 1), attrs: { value: String(k + 1) } }))
        ])
    }));
    // Ausführlich: je Kriterium ein Wert (halbe Sterne erlaubt) und eine Begründung
    const ausfuehrlichSchalter = el('input', { attrs: { id: 'doener-ausfuehrlich', type: 'checkbox' } });
    const schnellBox = el('div', { class: 'doener-sterne-felder' });
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
                const wert = el('select', { attrs: { id: 'doener-k' + nr } }, [
                    el('option', { text: '–', attrs: { value: '' } }),
                    ...HALBE.map((h) => el('option', { text: zahl(h).replace(',0', ''), attrs: { value: String(h) } }))
                ]);
                const begr = el('input', { attrs: { id: 'doener-kb' + nr, type: 'text', maxlength: 200, placeholder: 'Begründung (freiwillig)', 'aria-label': 'Begründung ' + name } });
                kriterienFelder.push({ teil: t, kriterium: name, wert, begr });
                return el('div', { class: 'doener-krit-zeile' }, [
                    el('label', { text: name, attrs: { for: 'doener-k' + nr } }), wert, begr
                ]);
            });
            ausfuehrlichBox.append(el('details', { class: 'doener-krit-gruppe' }, [
                el('summary', { text: titel + ' (' + namen.length + (namen.length === 1 ? ' Kriterium)' : ' Kriterien)') }),
                ...zeilen
            ]));
        }
        ausfuehrlichSchalter.disabled = !kriterienFelder.length;
    }

    ausfuehrlichSchalter.addEventListener('change', () => {
        schnellBox.hidden = ausfuehrlichSchalter.checked;
        ausfuehrlichBox.hidden = !ausfuehrlichSchalter.checked;
    });

    const begruendungFeld = el('textarea', { attrs: { id: 'doener-begruendung', maxlength: 300, rows: 3 } });
    // Lockfeld gegen Bots: für Menschen unsichtbar und nicht erreichbar
    const lockFeld = el('input', { attrs: { name: 'web', type: 'text', tabindex: '-1', autocomplete: 'off' } });
    const sendenKnopf = el('button', { class: 'knopf', text: 'Bewertung senden', attrs: { type: 'submit' } });

    async function senden(ev) {
        ev.preventDefault();
        const daten = { laden: ladenFeld.value.trim(), begruendung: begruendungFeld.value.trim(), web: lockFeld.value };
        const ausfuehrlich = ausfuehrlichSchalter.checked;
        if (ausfuehrlich) {
            daten.details = kriterienFelder.filter((k) => k.wert.value).map((k) => ({
                teil: k.teil, kriterium: k.kriterium, wert: Number(k.wert.value), begruendung: k.begr.value.trim()
            }));
        } else {
            for (const s of sterneFelder) daten[s.t] = s.feld.value ? Number(s.feld.value) : '';
        }
        if (!daten.laden) {
            formMeldung.textContent = 'Bitte einen Laden angeben.';
            ladenFeld.focus();
            return;
        }
        const essenBewertet = ausfuehrlich
            ? daten.details.some((k) => k.teil !== 'laden')
            : sterneFelder.some((s) => s.feld.value);
        if (!essenBewertet) {
            formMeldung.textContent = 'Bitte mindestens Döner, Yufka oder Pommes bewerten.';
            (ausfuehrlich ? ausfuehrlichSchalter : sterneFelder[0].feld).focus();
            return;
        }
        sendenKnopf.disabled = true;
        formMeldung.textContent = 'Wird gesendet …';
        try {
            await apiOeffentlich(adresse, 'bewerten', daten);
            formular.reset();
            schnellBox.hidden = false;
            ausfuehrlichBox.hidden = true;
            formMeldung.textContent = 'Danke! Deine Bewertung ist gespeichert.';
            laden();
        } catch (e) {
            formMeldung.textContent = e.message;
        } finally {
            sendenKnopf.disabled = false;
        }
    }

    const formular = el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: senden } }, [
        el('label', { text: 'Laden', attrs: { for: 'doener-laden' } }),
        ladenFeld,
        ladenListe,
        el('p', { class: 'leise klein', text: 'Aus der Liste wählen oder einen neuen Laden eintippen.' }),
        el('div', { class: 'doener-schalter' }, [
            ausfuehrlichSchalter,
            el('label', { text: 'Ausführlich bewerten (alle Kriterien)', attrs: { for: 'doener-ausfuehrlich' } })
        ]),
        schnellBox,
        ausfuehrlichBox,
        el('label', { text: 'Begründung (freiwillig)', attrs: { for: 'doener-begruendung' } }),
        begruendungFeld,
        el('div', { class: 'lockfeld', attrs: { 'aria-hidden': 'true' } }, [lockFeld]),
        sendenKnopf,
        formMeldung
    ]);

    schnellBox.append(...sterneFelder.map((s) => el('div', {}, [
        el('label', { text: s.titel + ' (1–10)', attrs: { for: 'doener-' + s.t } }),
        s.feld
    ])));

    const bewertenBox = el('details', { class: 'karte doener-bewerten' }, [
        el('summary', { text: 'Bewerten' }),
        formular
    ]);
    bewertenBox.addEventListener('toggle', () => {
        if (!bewertenBox.open) return;
        leeren(ladenListe);
        laedenNamen.forEach((n) => ladenListe.append(el('option', { attrs: { value: n } })));
    });

    container.append(bewertenBox, status, listeBox);

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
