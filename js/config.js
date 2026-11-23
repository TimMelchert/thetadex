// Thetadex – Einstellungen im Code
// Hier stehen KEINE Script-Adressen und KEIN Passwort. Die gibt die Person in der Ersteinrichtung ein.

// Muss exakt gleich sein wie VERSION in sw.js.
export const VERSION = '1.7.1';

// Welche Reiter sichtbar sind. false = Reiter wird ausgeblendet.
export const features = {
    tracking: true,
    finanzen: true,
    dsa: true,
    einkauf: true,
    besitz: true,
    uni: true,
    doener: true,
    visitenkarte: true,
    herbarium: true,
    bucketlist: true,
    packlisten: true
};

// Die sieben Bereiche in der Reihenfolge der Reiterleiste, dazu die Visitenkarte: am Handy nur als Kachel, am PC auch in der Seitenleiste (nurBreit).
// oeffentlich = immer sichtbar, auch ohne Einrichtung. Symbol: icons/reiter/<id>.svg
// skript = der Reiter erscheint nur, wenn die Adresse dieses Skripts eingetragen ist (Schritt 4.5).
// So sieht die Partnerin oder der Partner mit nur `gemeinsam` nur Einkauf, Uni und Döner. Die Rechte prüft trotzdem das Skript.
export const BEREICHE = [
    { id: 'tracking', titel: 'Tracking', oeffentlich: false, skript: 'tracking' },
    { id: 'finanzen', titel: 'Finanzen', oeffentlich: false, skript: 'finanzen' },
    { id: 'dsa',      titel: 'Pen & Paper', oeffentlich: false, skript: 'dsa' },
    { id: 'einkauf',  titel: 'Einkauf',  oeffentlich: false, skript: 'gemeinsam' },
    { id: 'besitz',   titel: 'Besitz',   oeffentlich: false, skript: 'leben' },
    { id: 'uni',      titel: 'Uni',      oeffentlich: false, skript: 'gemeinsam' },
    { id: 'doener',   titel: 'Döner',    oeffentlich: true },
    // Visitenkarte (10.3): nur Kachel auf der Startseite, kein Reiter in der Leiste (Wunsch der Person, 4.11.2026)
    { id: 'visitenkarte', titel: 'Visitenkarte', oeffentlich: false, skript: 'karte', nurBreit: true },
    // Herbarium (13.2): wie die Visitenkarte am Handy nur als Kachel (Entscheidung der Person, 22.11.2026). Daten im Sheet „Leben“.
    { id: 'herbarium', titel: 'Herbarium', oeffentlich: false, skript: 'leben', nurBreit: true },
    // Bucket List (14.2): wie das Herbarium am Handy nur als Kachel (Wunsch der Person, 23.11.2026). Daten im Sheet „Gemeinsam“, Partner*in nur lesen.
    { id: 'bucketlist', titel: 'Bucket List', oeffentlich: false, skript: 'gemeinsam', nurBreit: true },
    // Packlisten (15.2): am Handy nur als Kachel (Wunsch der Person, 23.11.2026). Daten im Sheet „Leben“, nur die Person.
    { id: 'packlisten', titel: 'Packlisten', oeffentlich: false, skript: 'leben', nurBreit: true }
];

// Skripte, deren Adresse in der Ersteinrichtung eingetragen wird.
// test = Aktion, die nur liest und zum Prüfen der Verbindung dient.
export const SKRIPTE = [
    { id: 'tracking', titel: 'Tracking', test: 'einstellungen' },
    { id: 'finanzen', titel: 'Finanzen', test: 'einstellungen' },
    { id: 'doener',   titel: 'Döner',    test: 'liste' },
    { id: 'leben',    titel: 'Besitz',   test: 'liste' },
    { id: 'gemeinsam', titel: 'Einkauf, Uni und Bucket List', test: 'ping' },
    { id: 'dsa',      titel: 'Pen & Paper', test: 'ping' },
    // Visitenkarte (ab 10.1): eigenes Passwort KARTE_PIN, die App schickt diesem Skript nie das Hauptpasswort
    { id: 'karte',    titel: 'Visitenkarte', test: 'ping', eigenesPasswort: 'karte_passwort' }
];
