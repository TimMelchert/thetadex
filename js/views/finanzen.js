// Reiter Finanzen: Kontostände und Buchen (Ausgabe, Einnahme, Umbuchung).
// Zwecke und Kategorien kommen aus dem Blatt „Einstellungen“ des Finanz-Sheets und werden nicht im Gerät gespeichert.
// Im Gerät liegen nur die zuletzt bekannten Kontostände (docs/STAND.md, Abschnitt 5).

import { el, heute } from '../ui/dom.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { lesen, schreiben } from '../store.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';

// Konten wie im Finanz-Skript (KONTEN_). [Wert fürs Skript, Name in der Auswahl, Schlüssel in den Ständen, kurzer Name]
const KONTEN = [
    ['Konto', 'Konto (EC)', 'konto', 'Konto'],
    ['Paypal', 'PayPal', 'paypal', 'PayPal'],
    ['Kreditkarte', 'Kreditkarte', 'kreditkarte', 'Kreditkarte'],
    ['Portemonnaie', 'Portemonnaie (Bar)', 'portemonnaie', 'Bar'],
    ['Muenzglas', 'Münzglas', 'muenzglas', 'Münzen'],
    ['Pfandbons', 'Pfandbons', 'pfandbons', 'Pfand']
];

const euro = (v) => (Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const norm = (t) => String(t == null ? '' : t).trim().toLowerCase();

export function render(container, ctx) {
    const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    let zwecke = [];

    // --- Kontostände ---
    const gesamt = el('span', { class: 'finanz-gesamt-wert', text: '…' });
    const werte = {};
    const staende = el('div', { class: 'karte finanz-staende' }, [
        el('p', { class: 'finanz-gesamt' }, [gesamt, el('span', { class: 'leise', text: 'Vermögen aktuell' })]),
        el('dl', { class: 'finanz-konten' }, KONTEN.flatMap(([, , schl, kurz]) => {
            werte[schl] = el('dd', { text: '…' });
            return [el('div', {}, [el('dt', { text: kurz }), werte[schl]])];
        }))
    ]);

    function zeigeStaende(s) {
        if (!s || typeof s !== 'object') return;
        gesamt.textContent = euro(s.gesamt);
        for (const [, , schl] of KONTEN) werte[schl].textContent = euro(s[schl]);
    }

    // --- Formular ---
    const konto = el('select', { attrs: { id: 'finanz-konto' } }, KONTEN.map(([wert, name]) => el('option', { text: name, attrs: { value: wert } })));
    const ziel = el('select', { attrs: { id: 'finanz-ziel' } }, KONTEN.map(([wert, name]) => el('option', { text: name, attrs: { value: wert } })));

    let datumManuell = false;
    const datum = el('input', { attrs: { id: 'finanz-datum', type: 'date', value: heute() }, on: { change: () => { datumManuell = true; } } });
    const wiederDa = () => {
        if (!datum.isConnected) { document.removeEventListener('visibilitychange', wiederDa); return; }
        if (!document.hidden && !datumManuell) datum.value = heute();
    };
    document.addEventListener('visibilitychange', wiederDa);

    const betrag = el('input', { attrs: { id: 'finanz-betrag', type: 'number', inputmode: 'decimal', step: '0.01', min: '0', placeholder: '0,00' } });
    const split = el('input', { attrs: { id: 'finanz-split', type: 'checkbox' } });

    const kategorie = auswahlFeld({ id: 'finanz-kategorie', maxlength: 40, placeholder: 'wählen oder eintippen' });
    // Zweck gewählt: Kategorie und Betrag setzen. Aus der Liste gewählt = überschreiben, getippt = nur leere Felder füllen.
    function zweckAnwenden(text, ueberschreiben) {
        const z = zwecke.find((x) => norm(x.name) === norm(text));
        if (!z) return;
        if (z.kategorie && (ueberschreiben || !kategorie.feld.value.trim())) kategorie.feld.value = z.kategorie;
        if (z.betrag != null && (ueberschreiben || betrag.value === '')) betrag.value = String(z.betrag);
    }
    const zweck = auswahlFeld({ id: 'finanz-zweck', maxlength: 100, placeholder: 'wählen oder eintippen', beiWahl: (t) => zweckAnwenden(t, true) });
    zweck.feld.addEventListener('change', () => zweckAnwenden(zweck.feld.value, false));

    const knopfAus = el('button', { class: 'knopf', text: 'Ausgabe', attrs: { type: 'button' }, on: { click: () => senden('aus') } });
    const knopfEin = el('button', { class: 'knopf', text: 'Einnahme', attrs: { type: 'button' }, on: { click: () => senden('ein') } });
    const knopfUmb = el('button', { class: 'knopf knopf-zweit', text: 'Umbuchung bestätigen', attrs: { type: 'button' }, on: { click: () => senden('umbuchung') } });
    const knoepfe = [knopfAus, knopfEin, knopfUmb];

    let sendet = false; // gegen Doppelbuchungen durch mehrfaches Tippen
    async function senden(mode) {
        if (sendet) return;
        const wert = Number(betrag.value);
        if (!isFinite(wert) || wert <= 0) {
            status.textContent = 'Bitte einen Betrag größer 0 eingeben.';
            betrag.focus();
            return;
        }
        if (mode === 'umbuchung' && konto.value === ziel.value) {
            status.textContent = 'Konto und Ziel sind gleich.';
            ziel.focus();
            return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datum.value)) {
            status.textContent = 'Bitte ein Datum wählen.';
            datum.focus();
            return;
        }

        sendet = true;
        knoepfe.forEach((k) => { k.disabled = true; });
        status.textContent = 'Speichere …';
        try {
            const s = await api('finanzen', 'buchen', {
                mode,
                reiter: konto.value,
                ziel: ziel.value,
                betrag: wert,
                zweck: zweck.feld.value.trim() || 'Transfer',
                kategorie: kategorie.feld.value.trim() || 'Allgemein',
                datum: datum.value,
                split: split.checked
            });
            zeigeStaende(s);
            schreiben('kontostaende', s);
            // Felder leeren; Konto und Datum bleiben
            zweck.feld.value = '';
            kategorie.feld.value = '';
            betrag.value = '';
            split.checked = false;
            const art = mode === 'aus' ? 'Ausgabe' : mode === 'ein' ? 'Einnahme' : 'Umbuchung';
            status.textContent = art + ' über ' + euro(wert) + ' gespeichert.';
            zeigeGespeichert('Gespeichert', art + ' ' + euro(wert));
        } catch (e) {
            status.textContent = 'NICHT gespeichert: ' + e.message;
        } finally {
            sendet = false;
            knoepfe.forEach((k) => { k.disabled = false; });
        }
    }

    const formular = el('form', { class: 'formular finanz-formular', attrs: { novalidate: true }, on: { submit: (ev) => ev.preventDefault() } }, [
        el('label', { text: 'Konto', attrs: { for: 'finanz-konto' } }), konto,
        el('label', { text: 'Datum', attrs: { for: 'finanz-datum' } }), datum,
        el('label', { text: 'Zweck', attrs: { for: 'finanz-zweck' } }), zweck.box,
        el('label', { text: 'Kategorie', attrs: { for: 'finanz-kategorie' } }), kategorie.box,
        el('label', { text: 'Betrag (€)', attrs: { for: 'finanz-betrag' } }),
        el('div', { class: 'finanz-betrag-zeile' }, [
            betrag,
            el('label', { class: 'finanz-split', attrs: { for: 'finanz-split' } }, [split, el('span', { text: 'Split' })])
        ]),
        el('div', { class: 'finanz-knoepfe' }, [knopfAus, knopfEin]),
        status,
        el('div', { class: 'karte finanz-umbuchung' }, [
            el('label', { text: 'Umbuchung nach', attrs: { for: 'finanz-ziel' } }), ziel, knopfUmb
        ])
    ]);

    const neuLaden = el('button', { class: 'knopf knopf-zweit', text: 'Erneut laden', attrs: { type: 'button' }, on: { click: () => laden() } });
    neuLaden.hidden = true;

    container.append(el('h1', { class: 'bereich-titel', text: ctx.bereich.titel }), staende, formular, neuLaden);

    // Zuletzt bekannte Stände sofort zeigen, dann frisch laden
    zeigeStaende(lesen('kontostaende'));

    async function laden() {
        try {
            const [s, e] = await Promise.all([api('finanzen', 'stats'), api('finanzen', 'einstellungen')]);
            zeigeStaende(s);
            schreiben('kontostaende', s);
            zwecke = Array.isArray(e.zwecke) ? e.zwecke : [];
            zweck.setzeEintraege(zwecke.map((z) => z.name));
            kategorie.setzeEintraege(Array.isArray(e.kategorien) ? e.kategorien : []);
            if (!neuLaden.hidden) { neuLaden.hidden = true; status.textContent = ''; }
        } catch (err) {
            status.textContent = 'Laden fehlgeschlagen: ' + err.message;
            neuLaden.hidden = false;
        }
    }
    laden();
}
