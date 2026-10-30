// Thetadex – Einstellungen im Code
// Hier stehen KEINE Script-Adressen und KEIN Passwort. Die gibt die Person in der Ersteinrichtung ein.

// Muss exakt gleich sein wie VERSION in sw.js.
export const VERSION = '0.5.1';

// Welche Reiter sichtbar sind. false = Reiter wird ausgeblendet.
export const features = {
    tracking: true,
    finanzen: true,
    dsa: true,
    einkauf: true,
    besitz: true,
    uni: true,
    doener: true
};

// Die sieben Bereiche in der Reihenfolge der Reiterleiste.
// etappe = in welcher Etappe der Reiter Inhalt bekommt (siehe docs/STAND.md, Abschnitt 7).
// oeffentlich = immer sichtbar, auch ohne Einrichtung. Symbol: icons/reiter/<id>.svg
// skript = der Reiter erscheint nur, wenn die Adresse dieses Skripts eingetragen ist (Schritt 4.5).
// So sieht die Partnerin oder der Partner mit nur `gemeinsam` nur Einkauf, Uni und Döner. Die Rechte prüft trotzdem das Skript.
export const BEREICHE = [
    { id: 'tracking', titel: 'Tracking', etappe: 2, oeffentlich: false, skript: 'tracking' },
    { id: 'finanzen', titel: 'Finanzen', etappe: 2, oeffentlich: false, skript: 'finanzen' },
    { id: 'dsa',      titel: 'DSA',      etappe: 6, oeffentlich: false, skript: 'dsa' },
    { id: 'einkauf',  titel: 'Einkauf',  etappe: 4, oeffentlich: false, skript: 'gemeinsam' },
    { id: 'besitz',   titel: 'Besitz',   etappe: 3, oeffentlich: false, skript: 'leben' },
    { id: 'uni',      titel: 'Uni',      etappe: 5, oeffentlich: false, skript: 'gemeinsam' },
    { id: 'doener',   titel: 'Döner',    etappe: 1, oeffentlich: true }
];

// Skripte, deren Adresse in der Ersteinrichtung eingetragen wird.
// test = Aktion, die nur liest und zum Prüfen der Verbindung dient.
export const SKRIPTE = [
    { id: 'tracking', titel: 'Tracking', test: 'einstellungen' },
    { id: 'finanzen', titel: 'Finanzen', test: 'einstellungen' },
    { id: 'doener',   titel: 'Döner',    test: 'liste' },
    { id: 'leben',    titel: 'Besitz',   test: 'liste' },
    { id: 'gemeinsam', titel: 'Einkauf und Uni', test: 'ping' }
];
