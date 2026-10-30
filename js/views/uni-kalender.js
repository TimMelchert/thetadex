// Uni-Kalender (Schritt 5.2): Ansichten Woche, Monat und Liste, Filter nach Art.
// Woche: am PC und im Querformat ein Raster mit Uhrzeiten, im Hochformat am Handy eine Liste je Tag (STAND.md 4).
// Zeichnet nur; Fenster und Formulare stehen in uni.js (beiEintrag, beiTag).

import { el, heute } from '../ui/dom.js';
import { alsDate, alsText, plusTage, wochenStart, kalenderwoche, monatsRaster, minuten, eintraegeAm, spuren, arbeitsMinuten, stundenText } from '../ui/kalender.js';

// Alle Arten mit Namen. Die Farben stehen in css/base.css (--art-…).
export const ARTEN = [
    ['vorlesung', 'Vorlesung'], ['pruefung', 'Prüfung'], ['arbeit', 'Arbeit'], ['zug', 'Zug'],
    ['urlaub', 'Urlaub'], ['frei', 'Frei'], ['sonstiges', 'Sonstiges'], ['ferien', 'Semesterferien']
];
export const ART_NAME = Object.fromEntries(ARTEN);

const TAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const TAGE_LANG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const LISTE_TAGE = 28;
const PX_JE_MINUTE = 0.8; // 48 px je Stunde im Wochenraster

export const kurzDatum = (t) => t.slice(8, 10) + '.' + t.slice(5, 7) + '.';
export const langDatum = (t) => TAGE_LANG[(alsDate(t).getDay() + 6) % 7] + ', ' + kurzDatum(t) + t.slice(0, 4);
export const zeitText = (e) => (e.ganztags ? (e.von ? e.von + '–' + e.bis + ' Uhr' : 'ganztägig') : e.von + '–' + e.bis);

// Einträge eines Tages ohne die abgeschalteten Arten
function tagInfo(t, daten, aus) {
    const info = eintraegeAm(t, daten);
    return { eintraege: info.eintraege.filter((e) => !aus.has(e.art)), ferien: info.ferien && !aus.has('ferien') };
}

// Ein Eintrag als Knopf (Liste je Tag, Liste, Fenster eines Tages)
export function eintragKnopf(e, beiKlick) {
    const merkmale = [ART_NAME[e.art] || e.art, e.ort].filter(Boolean).join(' · ');
    return el('button', { class: 'uni-eintrag' + (e.ausfall ? ' uni-ausfall' : ''), attrs: { type: 'button', 'data-art': e.art }, on: { click: beiKlick } }, [
        el('span', { class: 'uni-zeit', text: zeitText(e) }),
        el('span', { class: 'uni-was' }, [
            el('span', { class: 'uni-titel', text: e.titel }),
            el('span', { class: 'leise einkauf-klein', text: merkmale }),
            e.ausfall ? el('span', { class: 'uni-marke', text: 'fällt an diesem Tag aus' }) : null,
            e.einmalig ? el('span', { class: 'uni-marke', text: 'einmalig geändert' }) : null
        ])
    ]);
}

// zustand = { ansicht, datum, aus } (bleibt in uni.js); neuZeichnen() nach jeder Änderung des Zustands
export function zeichneKalender(box, { daten, zustand, beiEintrag, beiTag, neuZeichnen, knoepfe = [] }) {
    const h = heute();
    const z = zustand;

    // --- Woche, Monat, Liste und Blättern ---
    const ansichten = el('div', { class: 'ansichten uni-ansichten' }, [['woche', 'Woche'], ['monat', 'Monat'], ['liste', 'Liste']].map(([k, t]) =>
        el('button', { class: 'ansicht', text: t, attrs: { type: 'button', 'aria-pressed': z.ansicht === k ? 'true' : 'false' }, on: { click: () => { z.ansicht = k; neuZeichnen(); } } })));
    const schritt = (n) => {
        if (z.ansicht === 'woche') z.datum = plusTage(z.datum, 7 * n);
        else if (z.ansicht === 'liste') z.datum = plusTage(z.datum, LISTE_TAGE * n);
        else { const d = alsDate(z.datum); z.datum = alsText(new Date(d.getFullYear(), d.getMonth() + n, 1, 12)); }
        neuZeichnen();
    };
    let titel;
    if (z.ansicht === 'woche') {
        const s = wochenStart(z.datum);
        titel = 'KW ' + kalenderwoche(s) + ' · ' + kurzDatum(s) + ' – ' + kurzDatum(plusTage(s, 6)) + plusTage(s, 6).slice(0, 4);
    } else if (z.ansicht === 'monat') {
        const d = alsDate(z.datum);
        titel = MONATE[d.getMonth()] + ' ' + d.getFullYear();
    } else {
        titel = kurzDatum(z.datum) + ' – ' + kurzDatum(plusTage(z.datum, LISTE_TAGE - 1)) + plusTage(z.datum, LISTE_TAGE - 1).slice(0, 4);
    }
    const blaettern = el('div', { class: 'uni-blaettern' }, [
        el('button', { class: 'knopf knopf-zweit', text: '‹', attrs: { type: 'button', 'aria-label': 'Zurück' }, on: { click: () => schritt(-1) } }),
        el('h2', { class: 'uni-kal-titel', text: titel, attrs: { 'aria-live': 'polite' } }),
        el('button', { class: 'knopf knopf-zweit', text: '›', attrs: { type: 'button', 'aria-label': 'Weiter' }, on: { click: () => schritt(1) } }),
        el('button', { class: 'knopf knopf-zweit', text: 'Heute', attrs: { type: 'button' }, on: { click: () => { z.datum = h; neuZeichnen(); } } })
    ]);

    // --- Filter nach Art: Tipp schaltet an und aus ---
    const filter = el('div', { class: 'uni-filter', attrs: { role: 'group', 'aria-label': 'Arten zeigen' } }, ARTEN.map(([k, t]) =>
        el('button', {
            class: 'uni-filter-knopf', attrs: { type: 'button', 'data-art': k, 'aria-pressed': z.aus.has(k) ? 'false' : 'true' },
            on: { click: () => { if (z.aus.has(k)) z.aus.delete(k); else z.aus.add(k); neuZeichnen(); } }
        }, [el('span', { class: 'uni-punkt', attrs: { 'aria-hidden': 'true' } }), el('span', { text: t })])));

    // Arbeitsstunden im gezeigten Zeitraum (5.3). Nur gerechnet, nichts gespeichert. Unabhängig vom Filter.
    let von, bis, wo;
    if (z.ansicht === 'woche') { von = wochenStart(z.datum); bis = plusTage(von, 6); wo = 'in dieser Woche'; }
    else if (z.ansicht === 'monat') { const d = alsDate(z.datum); von = alsText(new Date(d.getFullYear(), d.getMonth(), 1, 12)); bis = alsText(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12)); wo = 'im ' + MONATE[d.getMonth()]; }
    else { von = z.datum; bis = plusTage(z.datum, LISTE_TAGE - 1); wo = 'in diesen vier Wochen'; }
    const arbeit = el('p', { class: 'uni-stunden', text: 'Arbeit ' + wo + ': ' + stundenText(arbeitsMinuten(von, bis, daten)) });

    box.append(el('div', { class: 'uni-kal-kopf' }, [ansichten, ...knoepfe]), blaettern, arbeit, filter);
    if (z.ansicht === 'woche') zeichneWoche(box, daten, z, beiEintrag, h);
    else if (z.ansicht === 'monat') zeichneMonat(box, daten, z, beiTag, h);
    else zeichneListe(box, daten, z, beiEintrag, h);
}

// Liste je Tag (Woche im Hochformat und Ansicht „Liste“)
function tagesListe(tage, daten, z, beiEintrag, h, leereZeigen) {
    const teile = [];
    tage.forEach((t) => {
        const info = tagInfo(t, daten, z.aus);
        if (!leereZeigen && !info.eintraege.length) return;
        teile.push(el('section', { class: 'uni-tag' + (t === h ? ' uni-heute' : '') + (info.ferien ? ' uni-ferien' : '') }, [
            el('h3', { class: 'besitz-ort' }, [
                el('span', { text: langDatum(t) + (t === h ? ' (heute)' : '') }),
                info.ferien ? el('span', { class: 'besitz-zahl', text: 'Semesterferien' }) : null
            ]),
            info.eintraege.length
                ? el('ul', { class: 'einkauf-liste' }, info.eintraege.map((e) => el('li', {}, [eintragKnopf(e, () => beiEintrag(e, t))])))
                : el('p', { class: 'leise uni-leer', text: 'Nichts eingetragen.' })
        ]));
    });
    return teile;
}

function zeichneWoche(box, daten, z, beiEintrag, h) {
    const start = wochenStart(z.datum);
    const tage = Array.from({ length: 7 }, (_, i) => plusTage(start, i));
    const infos = tage.map((t) => tagInfo(t, daten, z.aus));

    // Hochformat am Handy: Liste je Tag
    box.append(el('div', { class: 'uni-woche-liste' }, [
        el('p', { class: 'leise besitz-hinweis uni-drehen', text: 'Für die Woche als Raster das Handy drehen.' }),
        ...tagesListe(tage, daten, z, beiEintrag, h, true)
    ]));

    // PC und Querformat: Raster mit Uhrzeiten. Sichtbar sind mindestens 8 bis 18 Uhr, sonst so viel wie nötig.
    const mitZeit = infos.flatMap((i) => i.eintraege.filter((e) => !e.ganztags && !e.ausfall));
    let vonH = 8, bisH = 18;
    mitZeit.forEach((e) => { vonH = Math.min(vonH, Math.floor(minuten(e.von) / 60)); bisH = Math.max(bisH, Math.ceil(minuten(e.bis) / 60)); });
    const hoehe = (bisH - vonH) * 60 * PX_JE_MINUTE;
    const raster = el('div', { class: 'uni-woche-raster' });
    // Kopf: Wochentag und Datum, darunter ganztägige Einträge
    raster.append(el('div', { class: 'uni-raster-ecke' }));
    tage.forEach((t, i) => raster.append(el('div', { class: 'uni-raster-kopf' + (t === h ? ' uni-heute' : '') }, [
        el('span', { text: TAGE_KURZ[i] + ' ' + kurzDatum(t) })
    ])));
    raster.append(el('div', { class: 'uni-raster-ecke' }));
    infos.forEach((info, i) => raster.append(el('div', { class: 'uni-raster-ganztags' + (info.ferien ? ' uni-ferien' : '') },
        [
            info.ferien ? el('span', { class: 'uni-ferien-text', text: 'Ferien' }) : null,
            // Ganztägige oben, dazu was an diesem Tag ausfällt (gestrichelt), damit es die Spalte nicht verengt
            ...info.eintraege.filter((e) => e.ganztags || e.ausfall).map((e) => el('button', {
                class: 'uni-block uni-block-ganz' + (e.ausfall ? ' uni-ausfall' : ''), text: (e.ausfall ? 'fällt aus: ' : '') + e.titel, attrs: { type: 'button', 'data-art': e.art },
                on: { click: () => beiEintrag(e, tage[i]) }
            }))
        ])));
    // Uhrzeiten links, dann je Tag eine Spalte mit den Einträgen an ihrer Zeit
    raster.append(el('div', { class: 'uni-raster-zeiten' }, Array.from({ length: bisH - vonH }, (_, k) =>
        el('span', { text: String(vonH + k).padStart(2, '0') + ':00' }))));
    infos.forEach((info, i) => {
        const spalte = el('div', { class: 'uni-raster-tag' + (tage[i] === h ? ' uni-heute' : '') + (info.ferien ? ' uni-ferien' : '') });
        spalte.style.height = hoehe + 'px';
        spuren(info.eintraege).forEach(({ e, spur, spuren: n }) => {
            const block = el('button', {
                class: 'uni-block' + (e.ausfall ? ' uni-ausfall' : ''), attrs: { type: 'button', 'data-art': e.art },
                on: { click: () => beiEintrag(e, tage[i]) }
            }, [
                el('span', { class: 'uni-block-zeit', text: e.von + '–' + e.bis }),
                el('span', { class: 'uni-block-titel', text: e.titel }),
                e.ort ? el('span', { class: 'uni-block-ort', text: e.ort }) : null
            ]);
            block.style.top = (minuten(e.von) - vonH * 60) * PX_JE_MINUTE + 'px';
            block.style.height = Math.max(22, (minuten(e.bis) - minuten(e.von)) * PX_JE_MINUTE - 2) + 'px';
            block.style.left = (spur / n * 100) + '%';
            block.style.width = 'calc(' + (100 / n) + '% - 2px)';
            spalte.append(block);
        });
        raster.append(spalte);
    });
    raster.style.setProperty('--stunden', String(bisH - vonH));
    box.append(raster);
}

function zeichneMonat(box, daten, z, beiTag, h) {
    const d = alsDate(z.datum);
    const monat = d.getMonth();
    const gitter = el('div', { class: 'uni-monat' });
    TAGE_KURZ.forEach((t) => gitter.append(el('div', { class: 'uni-monat-kopf', text: t })));
    monatsRaster(d.getFullYear(), monat).flat().forEach((t) => {
        const info = tagInfo(t, daten, z.aus);
        const zeigen = info.eintraege.slice(0, 3);
        const mehr = info.eintraege.length - zeigen.length;
        gitter.append(el('button', {
            class: 'uni-monat-tag' + (alsDate(t).getMonth() !== monat ? ' uni-anderer' : '') + (t === h ? ' uni-heute' : '') + (info.ferien ? ' uni-ferien' : ''),
            attrs: { type: 'button', 'aria-label': langDatum(t) + ': ' + (info.eintraege.length ? info.eintraege.length + ' Einträge' : 'nichts eingetragen') },
            on: { click: () => beiTag(t) }
        }, [
            el('span', { class: 'uni-monat-zahl', text: String(alsDate(t).getDate()) }),
            ...zeigen.map((e) => el('span', {
                class: 'uni-monat-eintrag' + (e.ausfall ? ' uni-ausfall' : '') + (e.ganztags && e.termin && !e.erster ? ' uni-weiter' : ''),
                text: (e.ganztags ? '' : e.von + ' ') + e.titel, attrs: { 'data-art': e.art }
            })),
            mehr > 0 ? el('span', { class: 'uni-monat-mehr', text: '+' + mehr }) : null
        ]));
    });
    box.append(gitter);
}

function zeichneListe(box, daten, z, beiEintrag, h) {
    const tage = Array.from({ length: LISTE_TAGE }, (_, i) => plusTage(z.datum, i));
    const teile = tagesListe(tage, daten, z, beiEintrag, h, false);
    box.append(...(teile.length ? teile : [el('p', { class: 'leise', text: 'In diesen vier Wochen ist nichts eingetragen.' })]));
}
