// Speicher im Gerät (localStorage): Passwort, Script-Adressen, Einstellungen, letzte Kontostände,
// Einkaufsliste, Uni-Daten für ohne Netz, Teilen-Links (Liste in docs/STAND.md 5).
// Alle Schlüssel beginnen mit "thetadex_". Abmelden löscht alle.

const VORSILBE = 'thetadex_';

export function lesen(name, ersatz = null) {
    try {
        const wert = localStorage.getItem(VORSILBE + name);
        return wert === null ? ersatz : JSON.parse(wert);
    } catch (e) {
        return ersatz;
    }
}

export function schreiben(name, wert) {
    try {
        localStorage.setItem(VORSILBE + name, JSON.stringify(wert));
        return true;
    } catch (e) {
        return false;
    }
}

// Löscht alles, was Thetadex in diesem Gerät gespeichert hat.
export function abmelden() {
    try {
        Object.keys(localStorage)
            .filter((k) => k.startsWith(VORSILBE))
            .forEach((k) => localStorage.removeItem(k));
        return true;
    } catch (e) {
        return false;
    }
}

export function istEingerichtet() {
    return Boolean(lesen('passwort')) && Object.keys(lesen('skripte', {})).length > 0;
}
