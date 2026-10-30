// Finanzen → Auswertung: Monats- oder Jahresbilanz, Ringe für Ausgaben und Einnahmen, Säulen mit Budget-Linie,
// Budget-Balken, Netto-Kacheln mit Haken für Rückzahlungen, Jahrestabelle und Bafög.
// Die Kategorien kommen allgemein vom Skript (Aktion „analyse“, Feld „kategorien“), keine Namen im Code.
// Chart.js liegt als lokale Datei in vendor/ und wird erst hier geladen (docs/STAND.md, Abschnitt 4).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
// Farben der Diagramme, in Hell und Dunkel gut zu unterscheiden
const FARBEN = ['#E07A5F', '#8DB580', '#E2A23B', '#B5838D', '#7FA7A0', '#C9784A', '#D4B483', '#6D9DC5', '#A5668B',
    '#5B8E7D', '#F2CC8F', '#9C6644', '#81B29A', '#BC4749', '#8E9AAF', '#C08497', '#6A994E', '#DDA15E'];

const euro = (v) => (Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const norm = (t) => String(t == null ? '' : t).trim().toLowerCase();
const monatNr = (name) => MONATE.findIndex((m) => m.slice(0, 3).toLowerCase() === norm(name).slice(0, 3)) + 1;

// Chart.js einmal nachladen (klassisches Skript aus vendor/, setzt window.Chart)
let chartLaden = null;
function ladeChart() {
    if (window.Chart) return Promise.resolve(window.Chart);
    if (!chartLaden) {
        chartLaden = new Promise((ok, fehler) => {
            const s = document.createElement('script');
            s.src = 'vendor/chart.umd.js';
            s.onload = () => ok(window.Chart);
            s.onerror = () => { chartLaden = null; fehler(new Error('Diagramme konnten nicht geladen werden.')); };
            document.head.append(s);
        });
    }
    return chartLaden;
}

// Summe aller Monate eines Jahres, auch in den Kategorien
function jahresSumme(liste, jahr) {
    const summe = { jahr, monat: 'Ganzes Jahr', istJahr: true, kategorien: { aus: {}, ein: {}, netto: {} } };
    for (const m of liste) {
        for (const [k, v] of Object.entries(m)) {
            if (typeof v === 'number' && k !== 'jahr') summe[k] = (summe[k] || 0) + v;
        }
        for (const art of ['aus', 'ein', 'netto']) {
            for (const [name, v] of Object.entries((m.kategorien || {})[art] || {})) {
                summe.kategorien[art][name] = (summe.kategorien[art][name] || 0) + v;
            }
        }
    }
    return summe;
}

// box: Behälter der Ansicht. einstellungen(): liefert die zuletzt geladenen Einstellungen (Rückzahlungen, Eigenanteile).
export function auswertung(box, einstellungen) {
    let daten = null;
    let wahl = null;        // „M|2026|Oktober“ oder „J|2026“
    let tabellenJahr = null;
    const charts = {};

    const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const monatWahl = el('select', { attrs: { id: 'finanz-monat', 'aria-label': 'Monat wählen' }, on: { change: () => { wahl = monatWahl.value; zeige(); } } });
    const bilanzTitel = el('span', { class: 'leise' });
    const bilanzWert = el('span', { class: 'finanz-gesamt-wert' });
    const ringAus = el('canvas', { attrs: { 'aria-label': 'Ausgaben nach Kategorie', role: 'img' } });
    const ringEin = el('canvas', { attrs: { 'aria-label': 'Einnahmen nach Kategorie', role: 'img' } });
    const saeulen = el('canvas', { attrs: { 'aria-label': 'Ausgaben netto nach Kategorie mit Budget', role: 'img' } });
    const saeulenHinweis = el('p', { class: 'leise klein' });
    const budgetText = el('span');
    const budgetTitel = el('span');
    const budgetFuell = el('div', { class: 'finanz-budget-fuell' });
    const kacheln = el('div', { class: 'finanz-netto' });
    const jahrWahl = el('select', { attrs: { id: 'finanz-tabellenjahr', 'aria-label': 'Jahr der Tabelle' }, on: { change: () => { tabellenJahr = Number(jahrWahl.value); zeigeTabelle(); } } });
    const tabelle = el('tbody');
    const bafoeg = el('dl', { class: 'finanz-konten finanz-bafoeg' });

    leeren(box);
    box.append(
        el('div', { class: 'karte finanz-staende' }, [
            el('p', { class: 'finanz-gesamt' }, [bilanzWert, bilanzTitel]),
            el('div', { class: 'finanz-monat-zeile' }, [monatWahl])
        ]),
        el('div', { class: 'finanz-ringe' }, [
            el('figure', { class: 'karte finanz-ring' }, [el('figcaption', { text: 'Ausgaben' }), el('div', { class: 'finanz-diagramm' }, [ringAus])]),
            el('figure', { class: 'karte finanz-ring' }, [el('figcaption', { text: 'Einnahmen' }), el('div', { class: 'finanz-diagramm' }, [ringEin])])
        ]),
        el('figure', { class: 'karte finanz-ring' }, [
            el('figcaption', { text: 'Ausgaben netto' }), el('div', { class: 'finanz-diagramm finanz-diagramm-breit' }, [saeulen]), saeulenHinweis
        ]),
        el('div', { class: 'karte' }, [
            el('p', { class: 'finanz-budget-kopf' }, [budgetTitel, budgetText]),
            el('div', { class: 'finanz-budget' }, [budgetFuell])
        ]),
        kacheln,
        el('div', { class: 'finanz-tabelle-kopf' }, [el('h2', { text: 'Jahresübersicht' }), jahrWahl]),
        el('div', { class: 'finanz-tabelle-box' }, [el('table', { class: 'finanz-tabelle' }, [
            el('thead', {}, [el('tr', {}, ['Monat', 'Ausgaben', 'Einnahmen', 'Bilanz'].map((t) => el('th', { text: t, attrs: { scope: 'col' } })))]),
            tabelle
        ])]),
        el('h2', { text: 'Bafög' }),
        el('div', { class: 'karte' }, [bafoeg]),
        el('button', { class: 'knopf knopf-zweit finanz-neu', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => laden() } }),
        status
    );

    const istAktuell = (m) => Number(m.jahr) === Number(daten.jahr) && norm(m.monat) === norm(daten.monat);
    const schluessel = (m) => 'M|' + m.jahr + '|' + m.monat;

    function werte() {
        const monate = daten.monate || [];
        if (wahl && wahl.startsWith('J|')) {
            const jahr = Number(wahl.slice(2));
            return jahresSumme(monate.filter((m) => m.jahr === jahr), jahr);
        }
        return monate.find((m) => schluessel(m) === wahl) || daten;
    }

    function baueAuswahl() {
        const sichtbar = (daten.monate || []).filter((m) => istAktuell(m) || Math.abs(m.ausgabenGesamt) + Math.abs(m.einnahmenGesamt) > 0.005);
        const jahre = [...new Set(sichtbar.map((m) => m.jahr))].sort((a, b) => b - a);
        leeren(monatWahl);
        for (const j of jahre) {
            const gruppe = el('optgroup', { attrs: { label: String(j) } }, [el('option', { text: 'Ganzes Jahr ' + j, attrs: { value: 'J|' + j } })]);
            sichtbar.filter((m) => m.jahr === j).sort((a, b) => monatNr(b.monat) - monatNr(a.monat)).forEach((m) => {
                gruppe.append(el('option', { text: m.monat + ' ' + j + (istAktuell(m) ? ' (aktuell)' : ''), attrs: { value: schluessel(m) } }));
            });
            monatWahl.append(gruppe);
        }
        const werteListe = [...monatWahl.options].map((o) => o.value);
        const aktuell = (daten.monate || []).filter(istAktuell).map(schluessel)[0];
        if (!werteListe.includes(wahl)) wahl = aktuell || werteListe[0] || null;
        if (wahl) monatWahl.value = wahl;

        leeren(jahrWahl);
        jahre.forEach((j) => jahrWahl.append(el('option', { text: String(j), attrs: { value: String(j) } })));
        if (!jahre.includes(tabellenJahr)) tabellenJahr = jahre.includes(Number(daten.tabellenJahr)) ? Number(daten.tabellenJahr) : (jahre[0] || null);
        if (tabellenJahr != null) jahrWahl.value = String(tabellenJahr);
    }

    function zeigeTabelle() {
        leeren(tabelle);
        for (const m of (daten.monate || []).filter((x) => x.jahr === tabellenJahr)) {
            const s = schluessel(m);
            const waehlbar = [...monatWahl.options].some((o) => o.value === s);
            const zeile = el('tr', { class: (waehlbar ? 'klickbar' : '') + (s === wahl ? ' gewaehlt' : '') }, [
                el('th', { text: m.monat, attrs: { scope: 'row' } }),
                el('td', { text: euro(m.ausgabenGesamt) }),
                el('td', { text: euro(m.einnahmenGesamt) }),
                el('td', { class: m.bilanz >= 1 ? 'finanz-plus' : m.bilanz <= -1 ? 'finanz-minus' : '', text: euro(m.bilanz) })
            ]);
            if (waehlbar) {
                zeile.tabIndex = 0;
                const waehle = () => { wahl = s; monatWahl.value = s; zeige(); };
                zeile.addEventListener('click', waehle);
                zeile.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); waehle(); } });
            }
            tabelle.append(zeile);
        }
    }

    // Netto-Kacheln. Für Kategorien mit Rückzahlungen (Blatt „Einstellungen“): Haken je Person und Rest.
    function zeigeKacheln(w) {
        leeren(kacheln);
        const e = einstellungen() || {};
        const rueck = Array.isArray(e.rueckzahlungen) ? e.rueckzahlungen : [];
        const eigen = e.eigenanteile || {};
        for (const [name, netto] of Object.entries((w.kategorien || {}).netto || {})) {
            const personen = rueck.filter((r) => norm(r.kategorie) === norm(name));
            const kachel = el('div', { class: 'finanz-kachel' }, [el('p', { class: 'finanz-kachel-name', text: name })]);
            const wert = el('p', { class: 'finanz-kachel-wert' });
            kachel.append(wert);
            if (!personen.length || w.istJahr) {
                wert.textContent = euro(netto);
            } else {
                const monatsDaten = (daten.rueckzahlungen || {})[w.jahr + '-' + monatNr(w.monat)] || {};
                const eigenAnteil = Number(Object.entries(eigen).find(([k]) => norm(k) === norm(name))?.[1]) || 0;
                let rest = Math.round(Math.max(0, Math.abs(netto) - eigenAnteil) * 100) / 100;
                if (netto < 0) rest = -rest;
                wert.textContent = euro(rest);
                const liste = el('ul', { class: 'finanz-haken' });
                let alle = true;
                for (const p of personen) {
                    const betrag = monatsDaten[norm(p.zweck) + '|' + norm(name)] || 0;
                    if (!(betrag > 0)) alle = false;
                    liste.append(el('li', { class: betrag > 0 ? 'ok' : '' }, [
                        el('span', { class: 'finanz-haken-box', text: betrag > 0 ? '✓' : '', attrs: { 'aria-hidden': 'true' } }),
                        el('span', { text: p.name + (betrag > 0 ? '' : ' (offen)') }),
                        el('span', { class: 'finanz-haken-betrag', text: betrag > 0 ? euro(betrag) : '' })
                    ]));
                }
                if (eigenAnteil > 0) {
                    liste.append(el('li', { class: 'ok' }, [
                        el('span', { class: 'finanz-haken-box', text: '✓', attrs: { 'aria-hidden': 'true' } }),
                        el('span', { text: 'Ich' }), el('span', { class: 'finanz-haken-betrag', text: euro(eigenAnteil) })
                    ]));
                }
                kachel.append(liste);
                if (rest === 0 && alle) kachel.classList.add('erledigt');
            }
            kacheln.append(kachel);
        }
    }

    async function zeigeDiagramme(w) {
        let Chart;
        try {
            Chart = await ladeChart();
        } catch (e) {
            status.textContent = e.message;
            return;
        }
        const stil = getComputedStyle(document.documentElement);
        Chart.defaults.color = stil.getPropertyValue('--schrift-leise').trim() || '#5C5853';
        Chart.defaults.borderColor = stil.getPropertyValue('--linie').trim() || '#D9D6D0';
        Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;

        const kat = w.kategorien || { aus: {}, ein: {}, netto: {} };
        // Farbe je Kategorie fest nach ihrer Stelle in der Ausgaben-Liste, damit Ring und Säulen gleich aussehen
        const ausNamen = Object.keys(kat.aus || {});
        const farbe = (name, i) => FARBEN[(ausNamen.includes(name) ? ausNamen.indexOf(name) : i) % FARBEN.length];
        const ohneNull = (obj) => Object.entries(obj || {}).filter(([, v]) => Math.abs(v) > 0.1).map(([n, v], i) => [n, Math.abs(v), farbe(n, i)]);

        const ring = (canvas, alt, liste) => {
            if (alt) alt.destroy();
            return new Chart(canvas, {
                type: 'doughnut',
                data: { labels: liste.map((x) => x[0]), datasets: [{ data: liste.map((x) => x[1]), backgroundColor: liste.map((x) => x[2]), borderWidth: 1 }] },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '65%',
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } } }
                }
            });
        };
        charts.aus = ring(ringAus, charts.aus, ohneNull(kat.aus));
        // Einnahmen: eigene Farbreihe ab der Mitte, damit sie sich von den Ausgaben abheben
        charts.ein = ring(ringEin, charts.ein, Object.entries(kat.ein || {}).filter(([, v]) => Math.abs(v) > 0.1).map(([n, v], i) => [n, Math.abs(v), FARBEN[(i + 7) % FARBEN.length]]));

        // Säulen: netto, wo es eine Netto-Spalte gibt, sonst brutto
        const nettoNamen = Object.keys(kat.netto || {}).map(norm);
        const saeulenDaten = ausNamen.map((n, i) => {
            const nettoName = Object.keys(kat.netto || {}).find((x) => norm(x) === norm(n));
            const v = nettoNamen.includes(norm(n)) ? kat.netto[nettoName] : kat.aus[n];
            return [n, Math.abs(v || 0), farbe(n, i)];
        }).filter((x) => x[1] > 0.1);
        const budget = Number(w.budgetMonat) || 0;
        if (charts.saeulen) charts.saeulen.destroy();
        const datasets = [{ type: 'bar', label: 'Ausgaben', data: saeulenDaten.map((x) => x[1]), backgroundColor: saeulenDaten.map((x) => x[2]), borderWidth: 0 }];
        if (budget > 0) {
            datasets.push({
                type: 'line', label: 'Budget', data: saeulenDaten.map(() => budget),
                borderColor: stil.getPropertyValue('--knopf-rot').trim() || '#B3261E', borderDash: [6, 4], borderWidth: 2, pointRadius: 0, fill: false
            });
        }
        charts.saeulen = new Chart(saeulen, {
            data: { labels: saeulenDaten.map((x) => x[0]), datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { font: { size: 10 }, maxRotation: 60 }, grid: { display: false } }, y: { beginAtZero: true } }
            }
        });
        saeulenHinweis.textContent = budget > 0 ? 'Gestrichelte Linie = Budget (' + euro(budget) + ')' : 'Kein Budget eingetragen (Spalte „Budget-Monat“).';
    }

    function zeige() {
        const w = werte();
        bilanzTitel.textContent = w.istJahr ? 'Jahresbilanz' : 'Monatsbilanz';
        bilanzWert.textContent = euro(w.bilanz);
        bilanzWert.classList.toggle('finanz-plus', Number(w.bilanz) > 0);
        bilanzWert.classList.toggle('finanz-minus', Number(w.bilanz) < 0);

        const netto = Number(w.nettoGesamt) || 0;
        const budget = Number(w.budgetMonat) || 0;
        const prozent = budget > 0 ? Math.min((netto / budget) * 100, 100) : 0;
        budgetFuell.style.width = Math.max(0, prozent) + '%';
        budgetFuell.classList.toggle('warnung', prozent >= 80);
        budgetTitel.textContent = w.istJahr ? 'Budget (Summe Jahr)' : 'Monatsbudget';
        budgetText.textContent = Math.round(netto) + ' / ' + Math.round(budget) + ' €';

        zeigeKacheln(w);
        zeigeTabelle();

        leeren(bafoeg);
        const b = daten.bafoeg || {};
        [['Gesamt erhalten', b.zahlung], ['Darlehen', b.darlehen], ['Rückzahlung', b.rueckzahlung]].forEach(([t, v]) => {
            bafoeg.append(el('div', {}, [el('dt', { text: t }), el('dd', { text: euro(v) })]));
        });

        status.textContent = (daten.fehlendeSpalten && daten.fehlendeSpalten.length)
            ? 'Hinweis: Diese Spalten fehlen in „Analyse Monate“, Zeile 7: ' + daten.fehlendeSpalten.join(', ')
            : '';
        zeigeDiagramme(w);
    }

    async function laden() {
        status.textContent = 'Auswertung wird geladen …';
        try {
            daten = await api('finanzen', 'analyse');
            if (!daten.monate) daten.monate = [];
            baueAuswahl();
            zeige();
            if (!daten.kategorien) status.textContent = 'Das Finanz-Skript ist noch die alte Fassung: Bitte die neue Code.gs bereitstellen, dann erscheinen die Kategorien.';
        } catch (e) {
            status.textContent = 'Laden fehlgeschlagen: ' + e.message;
        }
    }

    laden();
    return { neuLaden: laden };
}
