// Verbindung zu den Google-Skripten.
// Jede Anfrage: POST, JSON als text/plain, mit Passwort im Körper (nie in der Adresse).
// Erfolg gibt es nur, wenn das Skript eine Antwort ohne "error" schickt.

import { lesen } from './store.js';
import { SKRIPTE } from './config.js';

export class ApiFehler extends Error {
    constructor(code, text) {
        super(text);
        this.code = code;
    }
}

// skript = 'tracking' | 'finanzen' | ...; action = Name der Aktion im Skript
export async function api(skript, action, daten = {}) {
    const adresse = (lesen('skripte', {}) || {})[skript];
    // Skripte mit eigenem Passwort (Visitenkarte, ab 10.1) bekommen nur dieses, nie das Hauptpasswort
    const eigenes = (SKRIPTE.find((s) => s.id === skript) || {}).eigenesPasswort;
    const passwort = lesen(eigenes || 'passwort');
    if (!adresse || !passwort) {
        throw new ApiFehler('einrichtung', eigenes
            ? 'Bitte zuerst unter „Einstellungen“ das eigene Passwort und die Script-Adresse eintragen.'
            : 'Bitte zuerst unter „Einstellungen“ Passwort und Script-Adresse eintragen.');
    }
    return senden(adresse, { ...daten, pin: passwort, action });
}

// Für öffentliche Skripte (Döner): ohne Passwort, Adresse wird übergeben.
export async function apiOeffentlich(adresse, action, daten = {}) {
    return senden(adresse, { ...daten, action });
}

async function senden(adresse, koerper) {
    let antwort;
    try {
        antwort = await fetch(adresse, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(koerper)
        });
    } catch (e) {
        throw new ApiFehler('netz', 'Keine Verbindung. Bitte Internet prüfen und erneut versuchen.');
    }

    let d;
    try {
        d = await antwort.json();
    } catch (e) {
        throw new ApiFehler('antwort', 'Das Skript hat keine lesbare Antwort geschickt. Ist die richtige Version bereitgestellt?');
    }

    if (d && d.error) throw new ApiFehler(d.error, d.message || 'Unbekannter Fehler');
    return d;
}
