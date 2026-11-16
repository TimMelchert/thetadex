// Kleine Helfer zum Bauen der Oberfläche.
// Texte immer über "text" (textContent), nie über innerHTML.

// el('button', { text: 'OK', class: 'knopf', attrs: { type: 'button' }, on: { click: fn } }, [kinder])
export function el(tag, optionen = {}, kinder = []) {
    const knoten = document.createElement(tag);
    if (optionen.text != null) knoten.textContent = String(optionen.text);
    if (optionen.class) knoten.className = optionen.class;
    if (optionen.attrs) {
        for (const [name, wert] of Object.entries(optionen.attrs)) {
            if (wert === false || wert == null) continue;
            knoten.setAttribute(name, wert === true ? '' : String(wert));
        }
    }
    if (optionen.on) {
        for (const [ereignis, fn] of Object.entries(optionen.on)) knoten.addEventListener(ereignis, fn);
    }
    for (const kind of kinder) {
        if (kind != null) knoten.append(kind);
    }
    return knoten;
}

export function leeren(knoten) {
    knoten.replaceChildren();
}

// Gibt die Adresse nur zurück, wenn sie mit https:// oder http:// beginnt, sonst null.
export function sichereUrl(text) {
    try {
        const url = new URL(String(text));
        return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : null;
    } catch (e) {
        return null;
    }
}

// Datumsfeld: Ein Klick irgendwo ins Feld öffnet den Kalender (nicht nur das kleine Symbol,
// das Erweiterungen wie KeePass verdecken können). Ältere Browser ohne showPicker behalten ihr normales Verhalten.
export function kalenderBeiKlick(feld) {
    feld.addEventListener('click', () => {
        try { if (feld.showPicker) feld.showPicker(); } catch (e) { /* z. B. schon offen */ }
    });
    return feld;
}

// Heutiges Datum in Ortszeit (nicht UTC) als JJJJ-MM-TT, also auch nachts richtig.
export function heute() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// --- Kleine Text-Helfer, in mehreren Reitern gleich ---
export const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
// Betrag in Euro mit zwei Stellen, zum Beispiel „1.234,50 €“
export const euro = (v) => (Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
// Sortieren nach dem Alphabet, ohne Groß und Klein, Zahlen der Größe nach („Teil 2“ vor „Teil 10“)
export const vergleiche = (a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true });
// JJJJ-MM-TT → TT.MM.JJJJ, sonst leer
export const datumText = (t) => (/^\d{4}-\d{2}-\d{2}$/.test(t) ? t.slice(8, 10) + '.' + t.slice(5, 7) + '.' + t.slice(0, 4) : '');
