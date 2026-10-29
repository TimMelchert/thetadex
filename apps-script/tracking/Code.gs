// =====================================================
// TRACKING – Apps Script
// Passwort steht NICHT hier, sondern in den Skripteigenschaften (APP_PIN)
// =====================================================

var BLATT_ = "Tabellenblatt1";
var KOPFZEILE_ = 4;          // In dieser Zeile stehen die Spaltennamen
var MAX_FELDER_ = 60;        // Höchstzahl Felder pro Eintrag
var MAX_TEXT_ = 100;         // Höchstlänge eines Textwerts

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
