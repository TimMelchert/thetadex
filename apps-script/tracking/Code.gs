// =====================================================
// TRACKING – Apps Script
// Passwort steht NICHT hier, sondern in den Skripteigenschaften (APP_PIN)
// =====================================================

var BLATT_ = "Tabellenblatt1";
var KOPFZEILE_ = 4;          // In dieser Zeile stehen die Spaltennamen
var MAX_FELDER_ = 60;        // Höchstzahl Felder pro Eintrag
var MAX_TEXT_ = 100;         // Höchstlänge eines Textwerts
var BLATT_EINST_ = "Einstellungen";  // Felder des Formulars (siehe docs/STAND.md 7.2, Etappe 2)
var EINST_KOPF_ = ["feld", "gruppe", "art", "vorgabe", "optionen", "schritt", "farben"];
var ARTEN_ = ["haken", "zahl", "auswahl"];

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

// Macht aus Freitext einen sicheren Zellinhalt:
// Zeilenumbrüche weg, Länge begrenzt, keine Formeln (=, +, -, @ am Anfang)
function bereinigeText_(text, maxLaenge) {
  var t = String(text == null ? "" : text).replace(/[\r\n\t]+/g, " ").trim();
  if (t.length > maxLaenge) t = t.substring(0, maxLaenge);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

// --- 2. EINSTIEGSPUNKTE ---

// Direkter Aufruf der URL liefert keine Daten
function doGet() {
  return jsonOut_({ status: "Tracking API" });
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
    if (data.action === "ping") return jsonOut_({ ok: true });
    if (data.action === "einstellungen") return jsonOut_(einstellungenLesen_());
    if (data.action === "tabelle") return jsonOut_(tabelleLesen_(data.jahr));

    if (data.action === "eintragen") {
      // Sperre: Es kann immer nur ein Eintrag gleichzeitig laufen
      var lock = LockService.getScriptLock();
      if (!lock.tryLock(20000)) {
        return jsonOut_({ error: "ausgelastet", message: "Script ausgelastet. Bitte gleich nochmal versuchen." });
      }
      try {
        return jsonOut_(eintragSpeichern_(data));
      } finally {
        lock.releaseLock();
      }
    }

    return jsonOut_({ error: "aktion", message: "Unbekannte Aktion" });
  } catch (err) {
    return jsonOut_({ error: "server", message: String(err) });
  }
}

// --- 3. EINTRAG SPEICHERN ---

function eintragSpeichern_(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BLATT_);
  if (!sheet) return { error: "blatt", message: "Blatt '" + BLATT_ + "' nicht gefunden" };

  // Datum mit 12:00 Uhr (Fix gegen Zeitzonen-Fehler)
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(data.datum || ""));
  if (!m) return { error: "eingabe", message: "Ungültiges Datum" };
  var datum = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  if (datum.getMonth() !== Number(m[2]) - 1) return { error: "eingabe", message: "Ungültiges Datum" };

  var werte = data.values;
  if (!werte || typeof werte !== "object" || Array.isArray(werte)) {
    return { error: "eingabe", message: "Keine Werte übergeben" };
  }
  var namen = Object.keys(werte);
  if (namen.length === 0 || namen.length > MAX_FELDER_) {
    return { error: "eingabe", message: "Ungültige Anzahl Felder" };
  }

  // "Landkarte": Spaltennamen in der Kopfzeile suchen
  var lastCol = sheet.getLastColumn();
  var kopf = sheet.getRange(KOPFZEILE_, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  var datumSpalte = kopf.indexOf("Datum");
  if (datumSpalte === -1) return { error: "blatt", message: "Spalte 'Datum' nicht gefunden" };

  // Unbekannte Felder melden statt still zu verwerfen
  var unbekannt = namen.filter(function (n) { return kopf.indexOf(String(n).trim()) === -1; });
  if (unbekannt.length) {
    return { error: "eingabe", message: "Unbekannte Felder: " + unbekannt.join(", ") };
  }

  // Nur die Zellen der übergebenen Felder schreiben (wie bisher),
  // damit Formeln in anderen Spalten unberührt bleiben
  var zielZeile = Math.max(sheet.getLastRow() + 1, KOPFZEILE_ + 1);
  sheet.getRange(zielZeile, datumSpalte + 1).setValue(datum);
  namen.forEach(function (n) {
    var v = werte[n];
    var zahl = (typeof v === "number" || (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim()))) ? Number(v) : NaN;
    sheet.getRange(zielZeile, kopf.indexOf(String(n).trim()) + 1).setValue(isFinite(zahl) ? zahl : bereinigeText_(v, MAX_TEXT_));
  });
  SpreadsheetApp.flush();

  return { ok: true, datum: data.datum };
}

// --- 4. EINSTELLUNGEN (Felder des Formulars) ---

// Einmal im Editor ausführen: legt das Blatt "Einstellungen" an und trägt jede Spalte
// aus der Kopfzeile von Tabellenblatt1 als Feld ein (Art "zahl"). Ein vorhandenes Blatt bleibt unverändert.
function einrichten() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName(BLATT_EINST_)) {
    Logger.log("Blatt '" + BLATT_EINST_ + "' gibt es schon. Nichts geändert.");
    return;
  }
  var daten = ss.getSheetByName(BLATT_);
  if (!daten) throw new Error("Blatt '" + BLATT_ + "' nicht gefunden");
  var kopf = daten.getRange(KOPFZEILE_, 1, 1, daten.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h).trim(); })
    .filter(function (h) { return h && h !== "Datum"; });

  var blatt = ss.insertSheet(BLATT_EINST_);
  var zeilen = [EINST_KOPF_].concat(kopf.map(function (h) { return [h, "", "zahl", "", "", "", ""]; }));
  blatt.getRange(1, 1, zeilen.length, EINST_KOPF_.length).setNumberFormat("@").setValues(zeilen);
  blatt.setFrozenRows(1);
  Logger.log("Blatt '" + BLATT_EINST_ + "' angelegt mit " + kopf.length + " Feldern.");
}

// Liefert die Felder in der Reihenfolge des Blatts. Felder, die nicht in der Kopfzeile stehen, kommen als Hinweis zurück.
function einstellungenLesen_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var blatt = ss.getSheetByName(BLATT_EINST_);
  if (!blatt) return { error: "blatt", message: "Blatt '" + BLATT_EINST_ + "' fehlt. Bitte im Editor einmal 'einrichten' ausführen." };
  var daten = ss.getSheetByName(BLATT_);
  if (!daten) return { error: "blatt", message: "Blatt '" + BLATT_ + "' nicht gefunden" };

  var kopf = daten.getRange(KOPFZEILE_, 1, 1, daten.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
  var werte = blatt.getDataRange().getDisplayValues();
  var spalten = werte[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var sp = {};
  EINST_KOPF_.forEach(function (n) { sp[n] = spalten.indexOf(n); });
  if (sp.feld === -1) return { error: "blatt", message: "Im Blatt '" + BLATT_EINST_ + "' fehlt die Spalte 'feld' in Zeile 1." };
  var zelle = function (z, n) { return sp[n] === -1 ? "" : String(z[sp[n]]).trim(); };

  var felder = [];
  var fehlend = [];
  werte.slice(1).forEach(function (z) {
    var feld = zelle(z, "feld");
    if (!feld || felder.length >= MAX_FELDER_) return;
    if (kopf.indexOf(feld) === -1) { fehlend.push(feld); return; }
    var art = zelle(z, "art").toLowerCase();
    if (ARTEN_.indexOf(art) === -1) art = "zahl";
    var optionen = zelle(z, "optionen").split(";").map(function (o) {
      var t = o.trim().replace(/^'/, "");  // Hochkomma vor "-1=…" (damit Sheets keine Formel draus macht)
      var gleich = t.indexOf("=");
      return gleich === -1 ? { wert: t, text: t } : { wert: t.slice(0, gleich).trim(), text: t.slice(gleich + 1).trim() };
    }).filter(function (o) { return o.wert !== ""; });
    var schritt = Number(zelle(z, "schritt").replace(",", "."));
    felder.push({
      feld: feld,
      gruppe: zelle(z, "gruppe"),
      art: art,
      vorgabe: zelle(z, "vorgabe"),
      optionen: art === "auswahl" ? optionen : [],
      schritt: isFinite(schritt) && schritt > 0 ? schritt : null,
      farben: zelle(z, "farben").replace(/^'/, "")
    });
  });
  return { felder: felder, fehlend: fehlend };
}

// --- 5. TABELLE (Übersicht eines Jahres) ---

// Liefert alle Einträge eines Jahres für die Felder aus "Einstellungen", dazu alle Jahre mit Einträgen.
// Werte: Zahl, Text oder null (leer). WAHR/FALSCH wird 1/0.
function tabelleLesen_(jahrWunsch) {
  var einst = einstellungenLesen_();
  if (einst.error) return einst;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BLATT_);
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  var kopf = sheet.getRange(KOPFZEILE_, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  var datumSpalte = kopf.indexOf("Datum");
  if (datumSpalte === -1) return { error: "blatt", message: "Spalte 'Datum' nicht gefunden" };
  var spalten = einst.felder.map(function (f) { return kopf.indexOf(f.feld); });

  var daten = lastRow > KOPFZEILE_ ? sheet.getRange(KOPFZEILE_ + 1, 1, lastRow - KOPFZEILE_, lastCol).getValues() : [];
  var jahre = {};
  var gesucht = Number(jahrWunsch) || new Date().getFullYear();
  var zeilen = [];
  daten.forEach(function (z) {
    var d = z[datumSpalte];
    if (!(d instanceof Date)) return;
    var j = d.getFullYear();
    jahre[j] = true;
    if (j !== gesucht) return;
    var iso = Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
    zeilen.push({
      datum: iso,
      werte: spalten.map(function (i) {
        var v = z[i];
        if (v === "" || v === null) return null;
        if (v === true) return 1;
        if (v === false) return 0;
        return typeof v === "number" ? v : String(v).substring(0, MAX_TEXT_);
      })
    });
  });
  zeilen.sort(function (a, b) { return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0; });
  return {
    jahr: gesucht,
    jahre: Object.keys(jahre).map(Number).sort(function (a, b) { return b - a; }),
    felder: einst.felder,
    zeilen: zeilen
  };
}
