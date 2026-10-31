// Rechenhelfer für den Uni-Kalender (Schritt 5.2, Kurse und wiederkehrende Termine seit 5.5). Idee nach dem Kalender im AktionsDeck, selbst und einfacher geschrieben.
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

// Urlaub nimmt alle wöchentlichen Einträge des Tages weg. „frei“ (bis 0.5.5) zählt wie Urlaub.
export function istFrei(art) {
    return art === 'urlaub' || art === 'frei';
}

// „1,3“ → [1, 3]. Liest nur die Ziffern 1 bis 7.
export function tageListe(tage) {
    return [...new Set(String(tage || '').match(/[1-7]/g) || [])].map(Number).sort();
}

// Das Semester eines Kurses: das eigene oder das des Moduls
export function kursSemester(kurs, daten) {
    const modul = (daten.module || []).find((m) => m.id === kurs.modul_id);
    const id = kurs.semester_id || (modul ? modul.semester_id : '');
    return daten.semester.find((s) => s.id === id) || null;
}

// Alle Einträge eines Tages aus { semester, module, kurse, termine }.
// Jede Woche: Kurse mit Tag und Uhrzeit (in der Vorlesungszeit ihres Semesters) und Termine mit „tage“ (zwischen erstem und letztem Tag).
// An Urlaubstagen fallen sie weg. Ein Termin mit stunde_id ersetzt den wöchentlichen Eintrag an seinem Tag:
// mit Uhrzeit = andere Zeit, ohne = fällt aus.
// Antwort: { eintraege, ferien }. Ein Eintrag: { schluessel, art, titel, ort, von, bis, ganztags, modul_id,
// woche (Kurs oder wiederkehrender Termin), kurs, termin (Ausnahme oder einzelner Termin), einmalig, ausfall }.
export function eintraegeAm(t, daten) {
    const semester = daten.semester.filter((s) => s.beginn <= t && t <= s.ende);
    const tag = wochentag(t);
    const anders = new Map(daten.termine.filter((x) => x.stunde_id && x.beginn === t).map((x) => [x.stunde_id, x]));
    const einzeln = daten.termine.filter((x) => !x.stunde_id && !x.tage && x.beginn <= t && t <= (x.ende || x.beginn));
    const serien = daten.termine.filter((x) => !x.stunde_id && x.tage && x.beginn <= t && t <= (x.ende || x.beginn) && tageListe(x.tage).includes(tag));
    const frei = einzeln.some((x) => istFrei(x.art)) || serien.some((x) => istFrei(x.art));
    const liste = [];

    // Ein wöchentlicher Eintrag mit seiner Ausnahme an diesem Tag
    const woechentlich = (schluessel, quelle, werte) => {
        const a = anders.get(quelle.id);
        const e = { schluessel, ...werte, ganztags: !werte.von, woche: quelle, termin: null, einmalig: false, ausfall: false };
        if (a && a.von) Object.assign(e, { titel: a.titel || e.titel, ort: a.ort, von: a.von, bis: a.bis, ganztags: false, termin: a, einmalig: true });
        else if (a) Object.assign(e, { termin: a, ausfall: true });
        liste.push(e);
    };

    if (!frei) {
        (daten.kurse || []).filter((k) => k.tag === tag && k.von).forEach((k) => {
            const s = kursSemester(k, daten);
            if (!s || t < s.vorlesung_beginn || t > s.vorlesung_ende) return;
            woechentlich('k' + k.id, k, { art: 'vorlesung', titel: k.name, ort: k.ort, von: k.von, bis: k.bis, modul_id: k.modul_id, kurs: k });
        });
    }
    serien.forEach((x) => {
        const werte = { art: x.art, titel: x.titel, ort: x.ort, von: x.von, bis: x.bis, modul_id: x.modul_id, kurs: null };
        if (istFrei(x.art)) liste.push({ schluessel: 'w' + x.id, ...werte, ganztags: !x.von, woche: null, termin: x, einmalig: false, ausfall: false });
        else if (!frei) woechentlich('w' + x.id, x, werte);
    });
    einzeln.forEach((x) => {
        const mehrtaegig = Boolean(x.ende && x.ende !== x.beginn);
        liste.push({
            schluessel: 't' + x.id, art: x.art, titel: x.titel, ort: x.ort, von: x.von, bis: x.bis,
            ganztags: !x.von || mehrtaegig, modul_id: x.modul_id, woche: null, kurs: null, termin: x, einmalig: false, ausfall: false,
            erster: x.beginn === t, letzter: (x.ende || x.beginn) === t
        });
    });
    liste.forEach((e) => { if (e.art === 'frei') e.art = 'urlaub'; });
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

// Arbeitsminuten von Tag a bis Tag b (beide eingeschlossen): alle Einträge der Art „arbeit“ mit Uhrzeit,
// wöchentlich mit „einmal anders“, ohne ausfallende und ohne Urlaubstage (Schritt 5.3).
export function arbeitsMinuten(a, b, daten) {
    let summe = 0;
    for (let t = a; t <= b; t = plusTage(t, 1)) {
        eintraegeAm(t, daten).eintraege
            .filter((e) => e.art === 'arbeit' && !e.ganztags && !e.ausfall)
            .forEach((e) => { summe += minuten(e.bis) - minuten(e.von); });
    }
    return summe;
}

// 750 → „12 h 30 min“, 720 → „12 h“
export function stundenText(min) {
    const h = Math.floor(min / 60), m = min % 60;
    return h + ' h' + (m ? ' ' + m + ' min' : '');
}
