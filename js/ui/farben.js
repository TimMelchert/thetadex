// Farbregeln für die Tracking-Übersicht. Die Regeln stehen im Blatt „Einstellungen“ (Spalte „farben“), nie im Repo.
// Schreibweise, mit „;“ getrennt, die erste passende Regel zählt:
//   1=grün        genau dieser Wert
//   7-10=grün     von bis (beide eingeschlossen)
//   <7=rot  >10=gelb  <=2  >=2
//   sonst=rot     alles andere (nicht bei leeren Zellen)
//   skala 1-10    Farbverlauf rot → weiß → grün (ohne Zahlen: von Auswahl-Optionen oder 1 bis 10)
// Farben: grün, hellgrün, dunkelgrün, rot, dunkelrot, gelb, blau, rosa, grau. Ohne Regel bleibt die Zelle farblos.

const FARBEN = {
    gruen: 'gruen', 'grün': 'gruen', hellgruen: 'hellgruen', 'hellgrün': 'hellgruen', dunkelgruen: 'dunkelgruen', 'dunkelgrün': 'dunkelgruen',
    rot: 'rot', dunkelrot: 'dunkelrot', gelb: 'gelb', blau: 'blau', rosa: 'rosa', grau: 'grau'
};
const ZAHL = '(-?\\d+(?:[.,]\\d+)?)';
const zahl = (t) => Number(String(t).trim().replace(',', '.'));

// Gibt eine Funktion zurück: wert → { klasse } | { farbe } | null
export function farbRegeln(text, optionen = []) {
    const regeln = [];
    for (const teil of String(text || '').split(';')) {
        const t = teil.trim().toLowerCase();
        if (!t) continue;
        let m = new RegExp('^skala(?:\\s+' + ZAHL + '\\s*-\\s*' + ZAHL + ')?$').exec(t);
        if (m) {
            let von = m[1] != null ? zahl(m[1]) : NaN;
            let bis = m[2] != null ? zahl(m[2]) : NaN;
            if (!isFinite(von) || !isFinite(bis)) {
                const werte = optionen.map((o) => zahl(o.wert)).filter(isFinite);
                von = werte.length ? Math.min(...werte) : 1;
                bis = werte.length ? Math.max(...werte) : 10;
            }
            regeln.push({ passt: (v) => isFinite(v), skala: [von, bis] });
            continue;
        }
        const gleich = t.lastIndexOf('=');
        if (gleich === -1) continue;
        // Das letzte „=“ trennt die Farbe ab, „<=2=rot“ geht also auch
        const bed = t.slice(0, gleich).trim();
        const klasse = FARBEN[t.slice(gleich + 1).trim()];
        if (!klasse) continue;
        let passt = null;
        if (bed === 'sonst') passt = () => true;
        else if ((m = new RegExp('^(<=|>=|<|>)\\s*' + ZAHL + '$').exec(bed))) {
            const g = zahl(m[2]);
            passt = { '<': (v) => v < g, '>': (v) => v > g, '<=': (v) => v <= g, '>=': (v) => v >= g }[m[1]];
        } else if ((m = new RegExp('^' + ZAHL + '\\s*-\\s*' + ZAHL + '$').exec(bed))) {
            const a = zahl(m[1]), b = zahl(m[2]);
            passt = (v) => v >= a && v <= b;
        } else {
            const soll = bed;
            passt = (v, roh) => String(roh).trim().toLowerCase() === soll || (isFinite(zahl(soll)) && v === zahl(soll));
        }
        regeln.push({ passt, klasse });
    }

    return (roh) => {
        if (roh == null || roh === '') return null;
        const v = zahl(roh);
        for (const r of regeln) {
            if (!r.passt(v, roh)) continue;
            if (r.skala) return { farbe: skalaFarbe(v, r.skala[0], r.skala[1]) };
            return { klasse: r.klasse };
        }
        return null;
    };
}

// rot (niedrig) → weiß (Mitte) → grün (hoch)
function skalaFarbe(v, von, bis) {
    const t = bis > von ? Math.min(1, Math.max(0, (v - von) / (bis - von))) : 0.5;
    const rot = [214, 69, 65], weiss = [255, 255, 255], gruen = [76, 153, 82];
    const [a, b, f] = t < 0.5 ? [rot, weiss, t * 2] : [weiss, gruen, (t - 0.5) * 2];
    return 'rgb(' + a.map((x, i) => Math.round(x + (b[i] - x) * f)).join(', ') + ')';
}
