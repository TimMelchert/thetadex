// Thetadex – Einstellungen im Code
// Hier stehen KEINE Script-Adressen und KEIN Passwort. Die gibt die Person in der Ersteinrichtung ein.

// Muss exakt gleich sein wie VERSION in sw.js.
export const VERSION = '0.0.1';

// Welche Reiter sichtbar sind. false = Reiter wird ausgeblendet.
export const features = {
    todos: true,
    tracking: true,
    finanzen: true,
    dsa: true,
    einkauf: true,
    besitz: true,
    uni: true
};

// Die sieben Bereiche in der Reihenfolge der Reiterleiste.
// etappe = in welcher Etappe der Reiter Inhalt bekommt (siehe docs/STAND.md, Abschnitt 7).
export const BEREICHE = [
    { id: 'todos',    titel: 'ToDos',    etappe: 2 },
    { id: 'tracking', titel: 'Tracking', etappe: 1 },
    { id: 'finanzen', titel: 'Finanzen', etappe: 1 },
    { id: 'dsa',      titel: 'DSA',      etappe: 3 },
    { id: 'einkauf',  titel: 'Einkauf',  etappe: 2 },
    { id: 'besitz',   titel: 'Besitz',   etappe: 2 },
    { id: 'uni',      titel: 'Uni',      etappe: 3 }
];

// Skripte, deren Adresse in der Ersteinrichtung eingetragen wird.
export const SKRIPTE = [
    { id: 'tracking', titel: 'Tracking' },
    { id: 'finanzen', titel: 'Finanzen' }
];
