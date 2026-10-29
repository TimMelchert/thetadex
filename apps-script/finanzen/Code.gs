// =====================================================
// FINANZ-MANAGER – Apps Script (Stand: Paket 4)
// Passwort steht NICHT hier, sondern in den Skripteigenschaften (APP_PIN)
// =====================================================

var KONTEN_ = ["Konto", "Paypal", "Kreditkarte", "Portemonnaie", "Muenzglas", "Pfandbons"];
var MODI_ = ["ein", "aus", "umbuchung"];
var MONATE_ = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

// --- 1. HILFSFUNKTIONEN FÜR ANTWORTEN & PASSWORT ---

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Prüft das Passwort und sperrt nach 5 Fehlversuchen für 15 Minuten
function pruefePin_(pin) {
  var cache = CacheService.getScriptCache();
  var fehler = Number(cache.get('pin_fehler') || 0);
  if (fehler >= 5) return 'gesperrt';

  var soll = PropertiesService.getScriptProperties().getProperty('APP_PIN');
  if (!soll || String(pin) !== soll) {
    cache.put('pin_fehler', String(fehler + 1), 900);
    return 'falsch';
  }
  cache.remove('pin_fehler');
  return 'ok';
}

// --- 2. EINSTIEGSPUNKTE ---

// Direkter Aufruf der URL liefert keine Daten
function doGet() {
  return jsonOut_({ status: "Finanz-Manager API" });
}

// Alle Anfragen laufen über POST und brauchen das Passwort
function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ error: "anfrage", message: "Ungültige Anfrage" });
  }

  var status = pruefePin_(data.pin);
  if (status === 'gesperrt') {
    return jsonOut_({ error: "gesperrt", message: "Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen." });
  }
  if (status !== 'ok') {
    return jsonOut_({ error: "pin", message: "Passwort falsch" });
  }

  try {
    if (data.action === "stats")   return jsonOut_(getStats());
    if (data.action === "analyse") return jsonOut_(getAnalyseData());

    if (data.action === "buchen") {
      // Sperre: Es kann immer nur eine Buchung gleichzeitig laufen
      var lock = LockService.getScriptLock();
      if (!lock.tryLock(20000)) {
        return jsonOut_({ error: "ausgelastet", message: "Script ausgelastet. Bitte gleich nochmal versuchen." });
      }
      try {
        return jsonOut_(buchungSpeichern_(data));
      } finally {
        lock.releaseLock();
      }
    }

    return jsonOut_({ error: "aktion", message: "Unbekannte Aktion" });
  } catch (err) {
    return jsonOut_({ error: "server", message: String(err) });
  }
}

// --- 3. ANALYSE-DATEN ---

function getAnalyseData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Analyse Monate");
  const bafoegSheet = ss.getSheetByName("Bafoeg");
  if (!sheet) return { error: "blatt", message: "Blatt 'Analyse Monate' nicht gefunden" };

  const lastCol = sheet.getLastColumn();

  // "Landkarte": Spaltennamen in Zeile 7 suchen
  const headerRow = sheet.getRange(7, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  const fehlend = [];

  const getIdx = (name) => {
    const idx = headerRow.indexOf(name);
    if (idx === -1) {
      fehlend.push(name);
      return null;
    }
    return idx;
  };

  const cols = {
    jahr: getIdx("Jahr"),
    monat: getIdx("Monat"),
    ausGesamt: getIdx("Gesamtausgaben"),
    einGesamt: getIdx("Gesamteinnahmen"),
    bilanz: getIdx("Monatsbilanz"),
    budgetMonat: getIdx("Budget-Monat"),

    // Ausgaben-Kategorien (-Out)
    ausAllg: getIdx("Allgemein-Out"),
    ausEssen: getIdx("Essen-Out"),
    ausFreizeit: getIdx("Freizeit-Out"),
    ausHygiene: getIdx("Hygiene-Out"),
    ausSpenden: getIdx("Spenden-Out"),
    ausStyle: getIdx("Style-Out"),
    ausTechnik: getIdx("Technik-Out"),
    ausWohnen: getIdx("Wohnen-Out"),
    ausAbos: getIdx("Abos-Out"),
    ausMobil: getIdx("Fortbewegung-Out"),
    ausGeschenk: getIdx("Geschenke-Out"),
    ausAktiv: getIdx("Aktivismus-Out"),
    ausUrlaub: getIdx("Urlaub-Out"),
    ausStudium: getIdx("Studium-Out"),
    ausBank: getIdx("Bank-Out"),

    // Einnahmen-Kategorien (-In)
    einAllg: getIdx("Allgemein-In"),
    einZuhause: getIdx("Zuhause-In"),
    einStaat: getIdx("Staat-In"),
    einTip: getIdx("Trinkgeld-In"),
    einBank: getIdx("Bank-In"),
    einOma: getIdx("Großeltern-In"),
    einAbos: getIdx("Abos-In"),
    einWohnen: getIdx("Wohnen-In"),
    einMobil: getIdx("Fortbewegung-In"),
    einJob: getIdx("Job-In"),

    // Netto-Spalten
    nAbos: getIdx("Netto-Abos"),
    nWohnen: getIdx("Netto-Wohnen"),
    nAllg: getIdx("Netto-Allgemein"),
    nMobil: getIdx("Netto-Fortbewegung"),
    nBank: getIdx("Netto-Bank"),
    nEssen: getIdx("Netto-Essen"),
    nMonatsNetto: getIdx("Monatsnetto")
  };

  // Sichere Zugriffe: fehlende Spalte oder Fehlerwert im Sheet ergibt 0 statt Absturz
  const num = (v, i) => (i === null ? 0 : (Number(v[i]) || 0));
  const roh = (v, i) => (i === null ? "" : v[i]);

  // Macht aus einer Sheet-Zeile ein Objekt mit allen Werten (gleich für Zeile 2 und alle Monatszeilen)
  const baueWerte = (v) => ({
    jahr: roh(v, cols.jahr),
    monat: roh(v, cols.monat),

    // Ausgaben Brutto (für Diagramme)
    aus_Allg: num(v, cols.ausAllg),
    aus_Essen: num(v, cols.ausEssen),
    aus_Freizeit: num(v, cols.ausFreizeit),
    aus_Hygiene: num(v, cols.ausHygiene),
    aus_Spenden: num(v, cols.ausSpenden),
    aus_Style: num(v, cols.ausStyle),
    aus_Technik: num(v, cols.ausTechnik),
    aus_Wohnen: num(v, cols.ausWohnen),
    aus_Abos: num(v, cols.ausAbos),
    aus_Mobil: num(v, cols.ausMobil),
    aus_Geschenk: num(v, cols.ausGeschenk),
    aus_Aktivismus: num(v, cols.ausAktiv),
    aus_Urlaub: num(v, cols.ausUrlaub),
    aus_Studium: num(v, cols.ausStudium),
    aus_Bank: num(v, cols.ausBank),
    ausgabenGesamt: num(v, cols.ausGesamt),
    einnahmenGesamt: num(v, cols.einGesamt),

    // Einnahmen
    einAllg: num(v, cols.einAllg),
    einZuhause: num(v, cols.einZuhause),
    einStaat: num(v, cols.einStaat),
    einTrinkgeld: num(v, cols.einTip),
    einBank: num(v, cols.einBank),
    einOma: num(v, cols.einOma),
    einAbos: num(v, cols.einAbos),
    einWohnen: num(v, cols.einWohnen),
    einMobil: num(v, cols.einMobil),
    einJob: num(v, cols.einJob),

    // Bilanz & Budget
    bilanz: num(v, cols.bilanz),
    budgetMonat: num(v, cols.budgetMonat),

    // Netto-Werte (für Balken und Kacheln)
    nettoAbos: num(v, cols.nAbos),
    nettoWohnen: num(v, cols.nWohnen),
    nettoAllgemein: num(v, cols.nAllg),
    nettoMobil: num(v, cols.nMobil),
    nettoBank: num(v, cols.nBank),
    nettoEssen: num(v, cols.nEssen),
    nettoGesamt: Math.abs(num(v, cols.nMonatsNetto))
  });

  // Zeile 2 = aktueller Monat
  const aktuell = baueWerte(sheet.getRange(2, 1, 1, lastCol).getValues()[0]);
  const aktuellJahr = Number(aktuell.jahr) || 0;
  const aktuellMonat = String(aktuell.monat).trim().toLowerCase();

  // Alle Monatszeilen ab Zeile 8 (auch die Blöcke für spätere Jahre darunter)
  const lastRow = sheet.getLastRow();
  const tabelle = lastRow >= 8 ? sheet.getRange(8, 1, lastRow - 7, lastCol).getValues() : [];

  const monate = [];
  let aktuellGefunden = false;
  tabelle.forEach(r => {
    const jahr = Number(roh(r, cols.jahr));
    const name = String(roh(r, cols.monat)).trim();
    if (!jahr || jahr < 2000 || !name) return;

    const istAktuell = (jahr === aktuellJahr && name.toLowerCase() === aktuellMonat);
    if (istAktuell) aktuellGefunden = true;
    // Für den aktuellen Monat gelten die Werte aus Zeile 2 (wie bisher)
    const w = istAktuell ? aktuell : baueWerte(r);
    monate.push(Object.assign({}, w, { jahr: jahr, monat: name }));
  });

  // Notlösung: aktueller Monat steht nicht in der Tabelle
  if (!aktuellGefunden) {
    monate.push(Object.assign({}, aktuell, {
      jahr: aktuellJahr || new Date().getFullYear(),
      monat: String(aktuell.monat).trim() || MONATE_[new Date().getMonth()]
    }));
  }

  // Jahrestabelle: die 12 Monate des aktuellen Jahres
  const tabellenJahr = aktuellJahr || (monate.length ? monate[monate.length - 1].jahr : 0);
  const jahresUebersicht = monate
    .filter(m => m.jahr === tabellenJahr)
    .map(m => ({ monat: m.monat, ausgaben: m.ausgabenGesamt, einnahmen: m.einnahmenGesamt, bilanz: m.bilanz }));

  // Bafög-Daten (Zellen I4, J4, K4)
  let bafoegData = { zahlung: 0, darlehen: 0, rueckzahlung: 0 };
  if (bafoegSheet) {
    const bValues = bafoegSheet.getRange("I4:K4").getValues()[0];
    bafoegData = {
      zahlung: Number(bValues[0]) || 0,
      darlehen: Number(bValues[1]) || 0,
      rueckzahlung: Number(bValues[2]) || 0
    };
  }

  // Oberste Ebene = aktueller Monat (wie bisher), dazu alle Monate und die Rückzahlungen
  return Object.assign({}, aktuell, {
    jahresUebersicht: jahresUebersicht,
    tabellenJahr: tabellenJahr,
    monate: monate,
    rueckzahlungen: getRueckzahlungen_(),
    bafoeg: bafoegData,
    fehlendeSpalten: fehlend
  });
}

// Summe aller Einnahmen mit Kategorie Abos/Wohnen im Blatt "Konto",
// sortiert nach Monat und Zweck. Daraus entstehen in der Seite die grünen Haken.
// Aufbau: { "2026-10": { "internet wg sarah|wohnen": 12.5, ... }, ... }
function getRueckzahlungen_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Konto");
  var out = {};
  if (!sheet) return out;
  var last = sheet.getLastRow();
  if (last < 8) return out;

  var rows = sheet.getRange(8, 1, last - 7, 6).getValues(); // A=Datum, C=Zweck, D=Kategorie, E=Einnahme
  rows.forEach(function (r) {
    var datum = r[0];
    if (!(datum instanceof Date)) return;
    var kat = String(r[3]).trim().toLowerCase();
    var ein = Number(r[4]) || 0;
    if (ein <= 0 || (kat !== "abos" && kat !== "wohnen")) return;

    var monatKey = datum.getFullYear() + "-" + (datum.getMonth() + 1);
    var key = String(r[2]).trim().toLowerCase() + "|" + kat;
    if (!out[monatKey]) out[monatKey] = {};
    out[monatKey][key] = (out[monatKey][key] || 0) + ein;
  });
  return out;
}

// --- 4. BUCHUNGEN ---

// Macht aus Freitext einen sicheren Zellinhalt:
// Zeilenumbrüche weg, Länge begrenzt, keine Formeln (=, +, -, @ am Anfang)
function bereinigeText_(text, maxLaenge) {
  var t = String(text == null ? "" : text).replace(/[\r\n\t]+/g, " ").trim();
  if (t.length > maxLaenge) t = t.substring(0, maxLaenge);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

// Prüft alle Eingaben und liefert saubere Werte oder eine Fehlermeldung
function pruefeEingabe_(data) {
  var mode = String(data.mode || "");
  if (MODI_.indexOf(mode) === -1) return { fehler: "Ungültiger Buchungstyp" };

  var reiter = String(data.reiter || "").trim();
  if (KONTEN_.indexOf(reiter) === -1) return { fehler: "Ungültiges Konto" };

  var ziel = "";
  if (mode === "umbuchung") {
    ziel = String(data.ziel || "").trim();
    if (KONTEN_.indexOf(ziel) === -1) return { fehler: "Ungültiges Zielkonto" };
    if (ziel === reiter) return { fehler: "Quelle und Ziel sind gleich" };
  }

  var betrag = Number(data.betrag);
  if (!isFinite(betrag) || betrag <= 0 || betrag > 1000000) return { fehler: "Ungültiger Betrag" };
  betrag = Math.round(betrag * 100) / 100;

  // Datum mit 12:00 Uhr (Fix gegen Zeitzonen-Fehler)
  var datum = new Date();
  if (data.datum) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(data.datum));
    if (!m) return { fehler: "Ungültiges Datum" };
    datum = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
    if (datum.getMonth() !== Number(m[2]) - 1) return { fehler: "Ungültiges Datum" };
  }

  return {
    ok: {
      mode: mode,
      reiter: reiter,
      ziel: ziel,
      betrag: betrag,
      datum: datum,
      zweck: bereinigeText_(data.zweck || "Transfer", 100),
      kategorie: bereinigeText_(data.kategorie || "Allgemein", 40),
      split: data.split === true
    }
  };
}

function buchungSpeichern_(data) {
  var pruefung = pruefeEingabe_(data);
  if (pruefung.fehler) return { error: "eingabe", message: pruefung.fehler };
  var b = pruefung.ok;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var buchungsDatum = b.datum;
  var monatName = MONATE_[buchungsDatum.getMonth()];
  var vonName = b.reiter;
  var zielName = b.ziel;
  var betrag = b.betrag;

  var vonIstSpeziell = (vonName === "Muenzglas" || vonName === "Pfandbons");

  // --- LOGIK A: UMBUCHUNGEN ---
  if (b.mode === "umbuchung") {
    var vonSheet = ss.getSheetByName(vonName);
    var zielSheet = ss.getSheetByName(zielName);
    if (!vonSheet || !zielSheet) return { error: "blatt", message: "Blatt nicht gefunden" };

    var zielIstSpeziell = (zielName === "Muenzglas" || zielName === "Pfandbons");

    // 1. ABGANG (Quell-Reiter)
    var rowVon = getNextRow_(vonSheet);
    if (vonName === "Portemonnaie") {
      var rowDataV = [buchungsDatum, monatName, "Umbuchung -> " + zielName, "Transfer", 0, 0, zielIstSpeziell ? 0 : -betrag, zielIstSpeziell ? -betrag : 0];
      vonSheet.getRange(rowVon, 1, 1, 8).setValues([rowDataV]);
    } else if (vonIstSpeziell) {
      vonSheet.getRange(rowVon, 1, 1, 4).setValues([[buchungsDatum, monatName, 0, betrag]]);
    } else {
      vonSheet.getRange(rowVon, 1, 1, 7).setValues([[buchungsDatum, monatName, "Umbuchung -> " + zielName, "Transfer", 0, 0, -betrag]]);
    }

    // 2. ZUGANG (Ziel-Reiter)
    var rowZiel = getNextRow_(zielSheet);
    if (zielIstSpeziell) {
      zielSheet.getRange(rowZiel, 1, 1, 3).setValues([[buchungsDatum, monatName, betrag]]);
    } else if (zielName === "Portemonnaie") {
      var rowDataZ = [buchungsDatum, monatName, "Umbuchung von " + vonName, "Transfer", 0, 0, vonIstSpeziell ? 0 : betrag, vonIstSpeziell ? betrag : 0];
      zielSheet.getRange(rowZiel, 1, 1, 8).setValues([rowDataZ]);
    } else {
      zielSheet.getRange(rowZiel, 1, 1, 7).setValues([[buchungsDatum, monatName, "Umbuchung von " + vonName, "Transfer", 0, 0, betrag]]);
    }
  }

  // --- LOGIK B: NORMALE BUCHUNG (Ein/Aus) ---
  else {
    var targetSheet = ss.getSheetByName(vonName);
    if (!targetSheet) return { error: "blatt", message: "Blatt nicht gefunden" };

    var rowN = getNextRow_(targetSheet);
    if (vonIstSpeziell) {
      targetSheet.getRange(rowN, 1, 1, 4).setValues([[buchungsDatum, monatName, b.mode === "ein" ? betrag : 0, b.mode === "aus" ? betrag : 0]]);
    } else {
      // Grunddaten (A-F)
      targetSheet.getRange(rowN, 1, 1, 6).setValues([[buchungsDatum, monatName, b.zweck, b.kategorie, b.mode === "ein" ? betrag : 0, b.mode === "aus" ? betrag : 0]]);

      // Split-Markierung in die passende Spalte (Portemonnaie: J, sonst: I)
      if (b.split) {
        var targetCol = (vonName === "Portemonnaie") ? 10 : 9;
        targetSheet.getRange(rowN, targetCol).setValue("GETEILT");
      }
    }
  }

  // Änderungen sofort schreiben, damit die Stände stimmen
  SpreadsheetApp.flush();
  return getStats();
}

// --- 5. HILFSFUNKTIONEN FÜRS SHEET ---

// Nächste freie Zeile (Daten beginnen ab Zeile 8)
function getNextRow_(sheet) {
  var last = sheet.getLastRow();
  if (last < 8) return 8;
  var vals = sheet.getRange(1, 1, last, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (vals[i][0] !== "") return Math.max(i + 2, 8);
  }
  return 8;
}

// Alle Kontostände in einem Rutsch lesen
function getStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetUeber = ss.getSheetByName('Übersicht');
  if (!sheetUeber) throw new Error("Blatt 'Übersicht' nicht gefunden");
  var v = sheetUeber.getRange("B4:B10").getValues();
  return {
    gesamt: v[0][0] || 0,
    konto: v[1][0] || 0,
    paypal: v[2][0] || 0,
    kreditkarte: v[3][0] || 0,
    portemonnaie: v[4][0] || 0,
    muenzglas: v[5][0] || 0,
    pfandbons: v[6][0] || 0
  };
}