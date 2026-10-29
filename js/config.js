// Thetadex – Einstellungen im Code
// Hier stehen KEINE Script-Adressen und KEIN Passwort. Die gibt die Person in der Ersteinrichtung ein.

// Muss exakt gleich sein wie VERSION in sw.js.
export const VERSION = '0.2.2';

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
// oeffentlich = auch ohne Einrichtung sichtbar. Symbol: icons/reiter/<id>.svg
export const BEREICHE = [
    { id: 'tracking', titel: 'Tracking', etappe: 2, oeffentlich: false },
    { id: 'finanzen', titel: 'Finanzen', etappe: 2, oeffentlich: false },
    { id: 'dsa',      titel: 'DSA',      etappe: 6, oeffentlich: false },
    { id: 'einkauf',  titel: 'Einkauf',  etappe: 4, oeffentlich: false },
    { id: 'besitz',   titel: 'Besitz',   etappe: 3, oeffentlich: false },
    { id: 'uni',      titel: 'Uni',      etappe: 5, oeffentlich: false },
    { id: 'doener',   titel: 'Döner',    etappe: 1, oeffentlich: true }
];

// Skripte, deren Adresse in der Ersteinrichtung eingetragen wird.
// test = Aktion, die nur liest und zum Prüfen der Verbindung dient.
export const SKRIPTE = [
    { id: 'tracking', titel: 'Tracking', test: 'einstellungen' },
    { id: 'finanzen', titel: 'Finanzen', test: 'stats' },
    { id: 'doener',   titel: 'Döner',    test: 'liste' }
];
