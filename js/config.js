// Thetadex – Einstellungen im Code
// Hier stehen KEINE Script-Adressen und KEIN Passwort. Die gibt die Person in der Ersteinrichtung ein.

// Muss exakt gleich sein wie VERSION in sw.js.
export const VERSION = '0.1.2';

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
export const BEREICHE = [
    { id: 'tracking', titel: 'Tracking', etappe: 1 },
    { id: 'finanzen', titel: 'Finanzen', etappe: 1 },
    { id: 'dsa',      titel: 'DSA',      etappe: 6 },
    { id: 'einkauf',  titel: 'Einkauf',  etappe: 4 },
    { id: 'besitz',   titel: 'Besitz',   etappe: 3 },
    { id: 'uni',      titel: 'Uni',      etappe: 5 },
    { id: 'doener',   titel: 'Döner',    etappe: 2 }
];

// Skripte, deren Adresse in der Ersteinrichtung eingetragen wird.
// test = Aktion, die nur liest und zum Prüfen der Verbindung dient.
export const SKRIPTE = [
    { id: 'tracking', titel: 'Tracking', test: 'ping' },
    { id: 'finanzen', titel: 'Finanzen', test: 'stats' }
];
