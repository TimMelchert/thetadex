// Reiter Finanzen: Liste „Noch zuordnen“ mit den offenen Kontowecker-SMS (Etappe 9, docs/STAND.md Abschnitt 4 „Kontowecker“).
// Die SMS kommen vom Finanz-Skript (Aktion smsListe) und liegen nur im Arbeitsspeicher, nie im Gerät.
// Die App schlägt eine Buchung vor; gebucht wird erst, wenn die Person im Formular auf Ausgabe oder Einnahme tippt.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';

const euro = (v) => (Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

// Betragszeile der SMS: „<Gegenseite>: <Betrag> EUR“, Minus = Ausgabe. Die Zeile mit dem Saldo zählt nicht.
const BETRAG = /^(.*?):\s*([-−+]?)\s*(\d{1,3}(?:\.\d{3})+|\d+),(\d{2})\s*(?:EUR|€)/i;

// Liest aus dem SMS-Text einen Vorschlag. Zeilen trennt das Skript mit „ | “.
// woerter: Liste aus dem Blatt „Einstellungen“ (liste = sms): Suchwort → Zweck und Kategorie.
export function smsVorschlag(text, woerter = []) {
    const zeilen = String(text || '').split(' | ');
    for (const zeile of zeilen) {
        if (/saldo/i.test(zeile)) continue;
        const m = BETRAG.exec(zeile.trim());
        if (!m) continue;
        const betrag = Number(m[3].replace(/\./g, '') + '.' + m[4]);
        if (!isFinite(betrag) || betrag <= 0) continue;
        const gegenseite = m[1].trim();
        const klein = String(text).toLowerCase();
        const wort = woerter.find((w) => w && w.name && klein.includes(String(w.name).toLowerCase()));
        return {
            mode: (m[2] === '-' || m[2] === '−') ? 'aus' : 'ein',
            betrag,
            zweck: (wort && wort.zweck) || gegenseite,
            kategorie: (wort && wort.kategorie) || ''
        };
    }
    return null;
}

// Baut die Karte „Noch zuordnen“. beiAnzahl(n) meldet die Zahl offener SMS, uebernehmen(sms, vorschlag) füllt das Buchungsformular.
// Liefert { box, laden(woerter), entfernen(id) }.
export function smsBereich(beiAnzahl, uebernehmen) {
    const liste = el('ul', { class: 'sms-liste' });
    const titel = el('h2', { class: 'sms-titel', text: 'Noch zuordnen' });
    const meldung = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    const box = el('section', { class: 'karte sms-karte', attrs: { id: 'sms-karte', 'aria-labelledby': 'sms-titel', hidden: true } }, [titel, liste, meldung]);
    titel.id = 'sms-titel';
    let offen = [];
    let woerter = [];

    function zeigen() {
        leeren(liste);
        titel.textContent = 'Noch zuordnen (' + offen.length + ')';
        box.hidden = offen.length === 0 && !meldung.textContent;
        beiAnzahl(offen.length);
        for (const sms of offen) {
            const v = smsVorschlag(sms.text, woerter);
            const datum = sms.datum.split('-').reverse().join('.');
            const vorschlag = v
                ? (v.mode === 'aus' ? 'Ausgabe ' : 'Einnahme ') + euro(v.betrag) + ' · ' + v.zweck + (v.kategorie ? ' · ' + v.kategorie : '')
                : 'Kein Vorschlag (Betrag nicht erkannt)';
            const verwerfen = el('button', { class: 'knopf knopf-zweit', text: 'Verwerfen', attrs: { type: 'button' } });
            verwerfen.addEventListener('click', async () => {
                if (!confirm('Diese SMS verwerfen, ohne zu buchen? Der Text wird gelöscht.')) return;
                verwerfen.disabled = true;
                meldung.textContent = 'Verwerfe …';
                try {
                    await api('finanzen', 'smsErledigt', { id: sms.id });
                    meldung.textContent = '';
                    entfernen(sms.id);
                } catch (e) {
                    meldung.textContent = 'NICHT verworfen: ' + e.message;
                    verwerfen.disabled = false;
                }
            });
            liste.append(el('li', { class: 'sms-eintrag' }, [
                el('p', { class: 'sms-vorschlag', text: vorschlag }),
                el('p', { class: 'sms-text leise', text: datum + ' · ' + sms.text }),
                el('div', { class: 'sms-knoepfe' }, [
                    el('button', { class: 'knopf', text: 'Übernehmen', attrs: { type: 'button' }, on: { click: () => uebernehmen(sms, v) } }),
                    verwerfen
                ])
            ]));
        }
    }

    function entfernen(id) {
        offen = offen.filter((s) => s.id !== id);
        zeigen();
    }

    async function laden(neueWoerter) {
        if (Array.isArray(neueWoerter)) woerter = neueWoerter;
        try {
            const d = await api('finanzen', 'smsListe');
            offen = Array.isArray(d.offen) ? d.offen.filter((s) => s && typeof s.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.datum)) : [];
            meldung.textContent = '';
        } catch (e) {
            // Altes Skript ohne smsListe: Liste einfach nicht zeigen
            offen = [];
            meldung.textContent = e.code === 'aktion' ? '' : 'SMS laden fehlgeschlagen: ' + e.message;
        }
        zeigen();
    }

    return { box, laden, entfernen };
}
