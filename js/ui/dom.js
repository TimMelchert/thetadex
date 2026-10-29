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

// Heutiges Datum in Ortszeit (nicht UTC) als JJJJ-MM-TT, also auch nachts richtig.
export function heute() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
