// Rechenhelfer für den Uni-Kalender (Schritt 5.2). Idee nach dem Kalender im AktionsDeck, selbst und einfacher geschrieben.
// Ein Datum ist hier immer Text JJJJ-MM-TT (Ortszeit), eine Uhrzeit Text HH:MM.

// Text → Date um 12 Uhr Ortszeit (so verschiebt die Sommerzeit nie den Tag)
export function alsDate(t) {
    const [j, m, d] = t.split('-').map(Number);
    return new Date(j, m - 1, d, 12);
}

export function alsText(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function plusTage(t, n) {
    const d = alsDate(t);
    d.setDate(d.getDate() + n);
    return alsText(d);
}

// 1 = Montag … 7 = Sonntag
export function wochentag(t) {
    return alsDate(t).getDay() || 7;
}

// Montag der Woche, in der t liegt
export function wochenStart(t) {
    return plusTage(t, 1 - wochentag(t));
}

// Kalenderwoche nach ISO 8601 (die Woche mit dem ersten Donnerstag des Jahres ist KW 1)
export function kalenderwoche(t) {
    const donnerstag = alsDate(plusTage(t, 4 - wochentag(t)));
    const jan1 = new Date(donnerstag.getFullYear(), 0, 1, 12);
    return Math.floor(Math.round((donnerstag - jan1) / 86400000) / 7) + 1;
}

// Monatsraster: Wochen (Montag zuerst) mit je 7 Daten, vom Montag vor dem 1. bis zum Sonntag nach dem Letzten
export function monatsRaster(jahr, monat) {
    const erster = alsText(new Date(jahr, monat, 1, 12));
    const letzter = alsText(new Date(jahr, monat + 1, 0, 12));
    const wochen = [];
    for (let t = wochenStart(erster); t <= letzter; t = plusTage(t, 7)) {
        wochen.push(Array.from({ length: 7 }, (_, i) => plusTage(t, i)));
    }
    return wochen;
}

// Minuten seit Mitternacht aus HH:MM
export function minuten(u) {
    const [h, m] = String(u).split(':').map(Number);
    return h * 60 + m;
}

const FREIE_ARTEN = ['urlaub', 'frei'];
// Wöchentliche Arten, die nur in der Vorlesungszeit gelten. Arbeit und Zug gelten im ganzen Semester.
const NUR_VORLESUNGSZEIT = ['vorlesung'];

// Alle Einträge eines Tages aus { semester, stundenplan, termine }.
// Wöchentliche Einträge gelten im Semester (Vorlesungen nur in der Vorlesungszeit), an Urlaubs- und freien Tagen fallen sie weg.
// Ein Termin mit stunde_id ersetzt den wöchentlichen Eintrag an seinem Tag: mit Uhrzeit = andere Zeit, ohne = fällt aus.
// Antwort: { eintraege, ferien }. Ein Eintrag: { schluessel, art, titel, ort, von, bis, ganztags, modul_id, stunde, termin, einmalig, ausfall }.
export function eintraegeAm(t, daten) {
    const semester = daten.semester.filter((s) => s.beginn <= t && t <= s.ende);
    const termine = daten.termine.filter((x) => x.beginn <= t && t <= (x.ende || x.beginn));
    const anders = new Map(termine.filter((x) => x.stunde_id).map((x) => [x.stunde_id, x]));
    const einzeln = termine.filter((x) => !x.stunde_id);
    const frei = einzeln.some((x) => FREIE_ARTEN.includes(x.art));
    const tag = wochentag(t);
    const liste = [];

    if (!frei) {
        semester.forEach((s) => {
            const vorlesungszeit = s.vorlesung_beginn <= t && t <= s.vorlesung_ende;
            daten.stundenplan
                .filter((x) => x.semester_id === s.id && x.tag === tag && (vorlesungszeit || !NUR_VORLESUNGSZEIT.includes(x.art)))
                .forEach((x) => {
                    const a = anders.get(x.id);
                    const e = { schluessel: 's' + x.id, art: x.art, titel: x.titel, ort: x.ort, von: x.von, bis: x.bis, ganztags: false, modul_id: x.modul_id, stunde: x, termin: null, einmalig: false, ausfall: false };
                    if (a && a.von) Object.assign(e, { titel: a.titel || x.titel, ort: a.ort, von: a.von, bis: a.bis, termin: a, einmalig: true });
                    else if (a) Object.assign(e, { termin: a, ausfall: true });
                    liste.push(e);
                });
        });
    }
    einzeln.forEach((x) => {
        const mehrtaegig = Boolean(x.ende && x.ende !== x.beginn);
        liste.push({
            schluessel: 't' + x.id, art: x.art, titel: x.titel, ort: x.ort, von: x.von, bis: x.bis,
            ganztags: !x.von || mehrtaegig, modul_id: x.modul_id, stunde: null, termin: x, einmalig: false, ausfall: false,
            erster: x.beginn === t, letzter: (x.ende || x.beginn) === t
        });
    });
    liste.sort((a, b) => (b.ganztags - a.ganztags) || (a.von || '').localeCompare(b.von || '') || a.titel.localeCompare(b.titel, 'de'));
    const ferien = semester.length > 0 && !semester.some((s) => s.vorlesung_beginn <= t && t <= s.vorlesung_ende);
    return { eintraege: liste, ferien };
}

// Verteilt Einträge mit Uhrzeit eines Tages auf Spuren (ohne ausfallende), damit sich überlappende nebeneinander stehen.
// Liefert je Eintrag { e, spur, spuren }.
export function spuren(eintraege) {
    const mitZeit = eintraege.filter((e) => !e.ganztags && !e.ausfall).sort((a, b) => a.von.localeCompare(b.von));
    const ergebnis = [];
    let gruppe = [];
    let gruppenEnde = '';
    const schliessen = () => {
        const n = Math.max(1, ...gruppe.map((g) => g.spur + 1));
        gruppe.forEach((g) => { g.spuren = n; ergebnis.push(g); });
        gruppe = [];
    };
    mitZeit.forEach((e) => {
        if (gruppe.length && e.von >= gruppenEnde) schliessen();
        const belegt = new Set(gruppe.filter((g) => g.e.bis > e.von).map((g) => g.spur));
        let spur = 0;
        while (belegt.has(spur)) spur++;
        gruppe.push({ e, spur, spuren: 1 });
        if (gruppe.length === 1 || e.bis > gruppenEnde) gruppenEnde = e.bis;
    });
    if (gruppe.length) schliessen();
    return ergebnis;
}
