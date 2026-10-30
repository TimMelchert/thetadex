// =====================================================
// LEBEN – Apps Script (nur die Person, mit Passwort)
// Blatt „besitz“: Sachen mit Kategorie, Ort, Anzahl, Kaufpreis, Kaufdatum, Notiz.
// Zubehör (ab 3.4): Spalte „gehoert_zu“ mit der id der Hauptsache. Nur eine Ebene.
// Bild (ab 3.5): Spalte „bild“ mit der Kennung einer Datei im Google Drive der Person. Hochgeladene Bilder
// liegen im privaten Drive-Ordner „Thetadex Besitz“. Bilder gibt das Skript nur mit Passwort heraus.
// Ausgeliehen (ab 3.6): Spalte „ausgeliehen_an“, freier Text (an wen), leer = nicht ausgeliehen.
// Ausgeliehene Anzahl (ab 0.4.2): Spalte „ausgeliehen_anzahl“, wie viele Stück davon ausgeliehen sind; leer = alle.
// Passwort steht NICHT hier, sondern in den Skripteigenschaften (APP_PIN).
// Siehe docs/PLAN-ETAPPE-3.md, Schritte 3.2 bis 3.6.
// =====================================================

var BLATT_BESITZ_ = "besitz";
var KOPF_BESITZ_ = ["id", "name", "kategorie", "ort", "anzahl", "kaufpreis", "kaufdatum", "notiz", "erstellt_am", "geaendert_am", "geloescht", "gehoert_zu", "bild", "ausgeliehen_an", "ausgeliehen_anzahl"];
var TEXT_SPALTEN_ = ["id", "name", "kategorie", "ort", "notiz", "gehoert_zu", "bild", "ausgeliehen_an"];   // bleiben im Sheet reiner Text (kein Datum, keine Zahl)
var MAX_ = { name: 80, kategorie: 40, ort: 60, notiz: 300, ausgeliehen_an: 60 };       // Höchstlängen
var MAX_ANZAHL_ = 9999;
var MAX_PREIS_ = 1000000;
var BILD_ORDNER_NAME_ = "Thetadex Besitz";      // privater Ordner im Drive für hochgeladene Bilder
var MAX_BILD_TEXT_ = 4000000;                   // Höchstlänge eines hochgeladenen Bildes als Text (etwa 3 MB)
var MAX_BILD_SENDEN_ = 1500000;                 // größere Bilder schickt das Skript als Vorschau (Bytes)

// --- 1. EINRICHTEN (im Editor ausführen, auch nach einem Update) ---

// Legt das Blatt an und ergänzt fehlende Spalten am Ende. Vorhandene Daten bleiben unverändert.
function einrichten() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(BLATT_BESITZ_) || ss.insertSheet(BLATT_BESITZ_);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, KOPF_BESITZ_.length).setValues([KOPF_BESITZ_]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    Logger.log("Blatt '" + BLATT_BESITZ_ + "' angelegt.");
  } else {
    var sp = spalten_(sheet);
    var fehlen = KOPF_BESITZ_.filter(function (k) { return sp[k] == null; });
    if (fehlen.length) {
      sheet.getRange(1, sheet.getLastColumn() + 1, 1, fehlen.length).setValues([fehlen]).setFontWeight("bold");
      Logger.log("Spalten ergänzt: " + fehlen.join(", "));
    } else {
      Logger.log("Blatt '" + BLATT_BESITZ_ + "' ist vollständig.");
    }
  }
  // Textspalten als reinen Text formatieren, damit z. B. „1/2“ kein Datum wird
  var karte = spalten_(sheet);
  TEXT_SPALTEN_.forEach(function (k) {
    sheet.getRange(2, karte[k] + 1, sheet.getMaxRows() - 1, 1).setNumberFormat("@");
  });
  // Drive-Ordner für Bilder anlegen (beim ersten Mal fragt Google nach der Erlaubnis für Drive)
  var ordner = bildOrdner_();
  Logger.log("Ordner für Bilder: '" + ordner.getName() + "'.");
  Logger.log("Fertig.");
}

// Der private Ordner für hochgeladene Bilder. Seine Kennung steht in den Skripteigenschaften (BILD_ORDNER).
function bildOrdner_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("BILD_ORDNER");
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* gelöscht: neu anlegen */ }
  }
  var ordner = DriveApp.createFolder(BILD_ORDNER_NAME_);
  props.setProperty("BILD_ORDNER", ordner.getId());
  return ordner;
}

// --- 2. HILFSFUNKTIONEN ---

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

// Gegenstück zu bereinigeText_ beim Lesen: Das Hochkomma vor =, +, -, @ zeigt die App nicht
function ohneSchutz_(v) {
  var t = String(v == null ? "" : v);
  return /^'[=+\-@]/.test(t) ? t.substring(1) : t;
}

// Spaltennummer (ab 0) je Name aus der Kopfzeile
function spalten_(sheet) {
  var lastCol = sheet.getLastColumn();
  var kopf = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var karte = {};
  kopf.forEach(function (h, i) { karte[String(h).trim().toLowerCase()] = i; });
  return karte;
}

function blatt_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error("Blatt '" + name + "' fehlt. Bitte im Editor einmal 'einrichten' ausführen.");
  return sheet;
}

function zeilen_(sheet) {
  return sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues() : [];
}

function zelle_(z, sp, name) {
  return sp[name] != null && z[sp[name]] != null ? z[sp[name]] : "";
}

function istWahr_(v) {
  return v === true || /^(true|wahr|ja|x)$/i.test(String(v).trim());
}

// Datum aus dem Sheet als JJJJ-MM-TT (oder leer)
function tag_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var t = String(v == null ? "" : v).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : "";
}

// Zeitstempel aus dem Sheet als Text auf die Sekunde. Dient beim Ändern als Schutz vor Überschreiben.
function stempel_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  return String(v == null ? "" : v).trim();
}

// Jetzt, auf ganze Sekunden gekürzt (so liest das Sheet denselben Wert zurück).
// Mindestens eine Sekunde nach dem alten Stempel, damit sich der Stempel bei jedem Schreiben ändert.
function jetzt_(alt) {
  var t = Math.floor(Date.now() / 1000) * 1000;
  if (alt instanceof Date && !isNaN(alt) && t <= alt.getTime()) t = Math.floor(alt.getTime() / 1000) * 1000 + 1000;
  return new Date(t);
}

// Eine Zeile als Objekt für die App
function sacheAus_(z, sp) {
  var preis = zelle_(z, sp, "kaufpreis");
  var n = typeof preis === "number" ? preis : Number(String(preis).replace(",", "."));
  return {
    id: String(zelle_(z, sp, "id")),
    name: ohneSchutz_(zelle_(z, sp, "name")),
    kategorie: ohneSchutz_(zelle_(z, sp, "kategorie")),
    ort: ohneSchutz_(zelle_(z, sp, "ort")),
    anzahl: Number(zelle_(z, sp, "anzahl")) || 0,
    kaufpreis: String(preis).trim() !== "" && isFinite(n) ? n : null,
    kaufdatum: tag_(zelle_(z, sp, "kaufdatum")),
    notiz: ohneSchutz_(zelle_(z, sp, "notiz")),
    gehoert_zu: String(zelle_(z, sp, "gehoert_zu")).trim(),
    bild: String(zelle_(z, sp, "bild")).trim(),
    ausgeliehen_an: ohneSchutz_(zelle_(z, sp, "ausgeliehen_an")),
    ausgeliehen_anzahl: Number(zelle_(z, sp, "ausgeliehen_anzahl")) || null,
    geaendert_am: stempel_(zelle_(z, sp, "geaendert_am"))
  };
}

// --- 3. EINSTIEGSPUNKTE ---

// Direkter Aufruf der URL liefert keine Daten
function doGet() {
  return jsonOut_({ status: "Leben API" });
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
    if (data.action === "liste") return jsonOut_(liste_());
    if (data.action === "bild") return jsonOut_(bildLesen_(data));

    if (data.action === "speichern" || data.action === "loeschen") {
      // Sperre: Es kann immer nur ein Schreibzugriff gleichzeitig laufen
      var lock = LockService.getScriptLock();
      if (!lock.tryLock(20000)) {
        return jsonOut_({ error: "ausgelastet", message: "Script ausgelastet. Bitte gleich nochmal versuchen." });
      }
      try {
        return jsonOut_(data.action === "speichern" ? speichern_(data) : loeschen_(data));
      } finally {
        lock.releaseLock();
      }
    }

    return jsonOut_({ error: "aktion", message: "Unbekannte Aktion" });
  } catch (err) {
    return jsonOut_({ error: "server", message: String(err) });
  }
}

// --- 4. LESEN ---

function liste_() {
  var sheet = blatt_(BLATT_BESITZ_);
  var sp = spalten_(sheet);
  var sachen = [];
  zeilen_(sheet).forEach(function (z) {
    if (istWahr_(zelle_(z, sp, "geloescht"))) return;
    var s = sacheAus_(z, sp);
    if (s.id && s.name) sachen.push(s);
  });
  return { sachen: sachen };
}

// --- 5. SCHREIBEN ---

// Prüft alle Eingaben und liefert saubere Werte oder eine Fehlermeldung
function pruefeSache_(data) {
  var w = {};
  var namen = { name: "Name", kategorie: "Kategorie", ort: "Ort" };
  var felder = ["name", "kategorie", "ort", "notiz", "ausgeliehen_an"];
  var titel = { notiz: "Notiz", ausgeliehen_an: "Ausgeliehen an" };
  for (var i = 0; i < felder.length; i++) {
    var f = felder[i];
    var t = String(data[f] == null ? "" : data[f]).replace(/\s+/g, " ").trim();
    if (!t && namen[f]) return { fehler: "Bitte " + namen[f] + " angeben." };
    if (t.length > MAX_[f]) return { fehler: (namen[f] || titel[f]) + " ist zu lang (höchstens " + MAX_[f] + " Zeichen)." };
    w[f] = bereinigeText_(t, MAX_[f]);
  }

  var anzahl = Number(data.anzahl);
  if (String(data.anzahl).trim() === "" || !isFinite(anzahl) || Math.floor(anzahl) !== anzahl || anzahl < 0 || anzahl > MAX_ANZAHL_) {
    return { fehler: "Anzahl bitte als ganze Zahl von 0 bis " + MAX_ANZAHL_ + "." };
  }
  w.anzahl = anzahl;

  // Ausgeliehene Anzahl: nur mit „Ausgeliehen an“, ganze Zahl von 1 bis zur Anzahl; leer = alle
  w.ausgeliehen_anzahl = "";
  if (w.ausgeliehen_an && data.ausgeliehen_anzahl != null && String(data.ausgeliehen_anzahl).trim() !== "") {
    var leih = Number(data.ausgeliehen_anzahl);
    if (!isFinite(leih) || Math.floor(leih) !== leih || leih < 1 || leih > anzahl) {
      return { fehler: "Ausgeliehene Anzahl bitte als ganze Zahl von 1 bis " + anzahl + " (oder leer = alle)." };
    }
    w.ausgeliehen_anzahl = leih;
  }

  w.kaufpreis = "";
  if (data.kaufpreis != null && String(data.kaufpreis).trim() !== "") {
    var preis = Number(data.kaufpreis);
    if (!isFinite(preis) || preis < 0 || preis > MAX_PREIS_) return { fehler: "Ungültiger Kaufpreis." };
    w.kaufpreis = Math.round(preis * 100) / 100;
  }

  // Kaufdatum mit 12:00 Uhr (Fix gegen Zeitzonen-Fehler), nicht in der Zukunft
  w.kaufdatum = "";
  if (data.kaufdatum != null && String(data.kaufdatum).trim() !== "") {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(data.kaufdatum));
    if (!m) return { fehler: "Ungültiges Kaufdatum." };
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
    if (d.getMonth() !== Number(m[2]) - 1) return { fehler: "Ungültiges Kaufdatum." };
    if (String(data.kaufdatum) > tag_(new Date())) return { fehler: "Das Kaufdatum liegt in der Zukunft." };
    w.kaufdatum = d;
  }
  return { werte: w };
}

// Neu (ohne id) oder ändern (mit id und dem geaendert_am, das die App kennt)
function speichern_(data) {
  var p = pruefeSache_(data);
  if (p.fehler) return { error: "eingabe", message: p.fehler };

  var sheet = blatt_(BLATT_BESITZ_);
  var sp = spalten_(sheet);
  var fehlen = KOPF_BESITZ_.filter(function (k) { return sp[k] == null; });
  if (fehlen.length) return { error: "blatt", message: "Spalten fehlen: " + fehlen.join(", ") + ". Bitte im Editor 'einrichten' ausführen." };

  var breite = sheet.getLastColumn();
  var zeile, nr;

  // Zubehör: Die Hauptsache muss es geben, sie darf selbst kein Zubehör sein, und eine Sache mit Zubehör
  // kann nicht selbst Zubehör werden (nur eine Ebene, damit die Liste übersichtlich bleibt)
  var haupt = String(data.gehoert_zu == null ? "" : data.gehoert_zu).trim();
  if (haupt) {
    if (haupt === String(data.id || "")) return { error: "eingabe", message: "Eine Sache kann nicht zu sich selbst gehören." };
    var h = finde_(sheet, sp, haupt);
    if (!h) return { error: "eingabe", message: "Die Hauptsache gibt es nicht mehr. Bitte neu laden." };
    if (String(h.zeile[sp.gehoert_zu]).trim()) return { error: "eingabe", message: "Zubehör kann kein eigenes Zubehör haben." };
    if (data.id && hatZubehoer_(sheet, sp, String(data.id))) {
      return { error: "eingabe", message: "Diese Sache hat selbst Zubehör und kann darum nicht zu einer anderen gehören." };
    }
  }
  p.werte.gehoert_zu = haupt;

  // Bild: neu hochgeladen (bild_daten), als Drive-Link oder Kennung (bild), oder leer = kein Bild
  var b = bildAus_(data);
  if (b.fehler) return { error: "eingabe", message: b.fehler };
  p.werte.bild = b.id;

  if (data.id == null || data.id === "") {
    zeile = new Array(breite).fill("");
    zeile[sp.id] = Utilities.getUuid();
    zeile[sp.geloescht] = false;
    nr = sheet.getLastRow() + 1;
  } else {
    var gefunden = finde_(sheet, sp, String(data.id));
    if (!gefunden) return { error: "fehlt", message: "Diese Sache gibt es nicht mehr. Bitte neu laden." };
    zeile = gefunden.zeile;
    nr = gefunden.nr;
    if (stempel_(zeile[sp.geaendert_am]) !== String(data.geaendert_am || "")) {
      return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Gerät). Bitte neu laden." };
    }
  }

  var jetzt = jetzt_(zeile[sp.geaendert_am]);
  if (!zeile[sp.erstellt_am]) zeile[sp.erstellt_am] = jetzt;
  Object.keys(p.werte).forEach(function (k) { zeile[sp[k]] = p.werte[k]; });
  zeile[sp.geaendert_am] = jetzt;
  sheet.getRange(nr, 1, 1, breite).setValues([zeile]);

  return { sache: sacheAus_(sheet.getRange(nr, 1, 1, breite).getValues()[0], sp) };
}

// Weich löschen: setzt nur geloescht = TRUE. Im Sheet zurückholbar (Häkchen wieder auf FALSE).
function loeschen_(data) {
  var sheet = blatt_(BLATT_BESITZ_);
  var sp = spalten_(sheet);
  var gefunden = finde_(sheet, sp, String(data.id || ""));
  if (!gefunden) return { error: "fehlt", message: "Diese Sache gibt es nicht mehr. Bitte neu laden." };
  if (stempel_(gefunden.zeile[sp.geaendert_am]) !== String(data.geaendert_am || "")) {
    return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Gerät). Bitte neu laden." };
  }
  sheet.getRange(gefunden.nr, sp.geloescht + 1).setValue(true);
  sheet.getRange(gefunden.nr, sp.geaendert_am + 1).setValue(jetzt_(gefunden.zeile[sp.geaendert_am]));
  return { ok: true };
}

// Hat eine Sache (nicht gelöschtes) Zubehör?
function hatZubehoer_(sheet, sp, id) {
  return zeilen_(sheet).some(function (z) {
    return String(z[sp.gehoert_zu]).trim() === id && !istWahr_(z[sp.geloescht]);
  });
}

// Sucht eine nicht gelöschte Zeile nach id. Liefert { nr, zeile } oder null.
function finde_(sheet, sp, id) {
  if (!id) return null;
  var alle = zeilen_(sheet);
  for (var i = 0; i < alle.length; i++) {
    if (String(alle[i][sp.id]) === id && !istWahr_(alle[i][sp.geloescht])) return { nr: i + 2, zeile: alle[i] };
  }
  return null;
}

// --- 6. BILDER ---

// Kennung einer Drive-Datei aus einem Link („…/file/d/<id>/…“, „…?id=<id>“) oder die Kennung selbst
function driveKennung_(text) {
  var t = String(text == null ? "" : text).trim();
  var m = /\/d\/([A-Za-z0-9_-]{20,})/.exec(t) || /[?&]id=([A-Za-z0-9_-]{20,})/.exec(t) || /^([A-Za-z0-9_-]{20,})$/.exec(t);
  return m ? m[1] : "";
}

// Prüft das Bild einer Sache und liefert { id } (leer = kein Bild) oder { fehler }
function bildAus_(data) {
  if (data.bild_daten) {
    var text = String(data.bild_daten);
    if (text.length > MAX_BILD_TEXT_) return { fehler: "Das Bild ist zu groß." };
    var bytes;
    try { bytes = Utilities.base64Decode(text); } catch (e) { return { fehler: "Das Bild ist beschädigt." }; }
    // Nur JPEG oder PNG (an den ersten Bytes erkannt, nicht am Namen)
    var jpeg = bytes.length > 3 && (bytes[0] & 255) === 0xFF && (bytes[1] & 255) === 0xD8;
    var png = bytes.length > 4 && (bytes[0] & 255) === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    if (!jpeg && !png) return { fehler: "Bitte ein Bild (JPEG oder PNG) wählen." };
    var name = bereinigeText_(data.name, 60) || "Bild";
    var datei = bildOrdner_().createFile(Utilities.newBlob(bytes, jpeg ? "image/jpeg" : "image/png", name + (jpeg ? ".jpg" : ".png")));
    return { id: datei.getId() };
  }
  var roh = String(data.bild == null ? "" : data.bild).trim();
  if (!roh) return { id: "" };
  var id = driveKennung_(roh);
  if (!id) return { fehler: "Der Drive-Link sieht nicht richtig aus. Bitte in Drive „Link kopieren“ nutzen." };
  try {
    var f = DriveApp.getFileById(id);
    if (!/^image\//.test(f.getMimeType())) return { fehler: "Der Drive-Link zeigt nicht auf ein Bild." };
  } catch (e) {
    return { fehler: "Das Bild im Drive wurde nicht gefunden." };
  }
  return { id: id };
}

// Liefert ein Bild als Text. Nur Bilder, die bei einer (nicht gelöschten) Sache eingetragen sind,
// damit niemand über das Skript beliebige Dateien aus dem Drive lesen kann.
function bildLesen_(data) {
  var id = driveKennung_(data.bild);
  if (!id) return { error: "eingabe", message: "Unbekanntes Bild." };
  var sheet = blatt_(BLATT_BESITZ_);
  var sp = spalten_(sheet);
  var bekannt = zeilen_(sheet).some(function (z) {
    return String(zelle_(z, sp, "bild")).trim() === id && !istWahr_(zelle_(z, sp, "geloescht"));
  });
  if (!bekannt) return { error: "eingabe", message: "Unbekanntes Bild." };
  var blob;
  try {
    var f = DriveApp.getFileById(id);
    if (!/^image\//.test(f.getMimeType())) return { error: "eingabe", message: "Die Datei ist kein Bild." };
    blob = f.getSize() > MAX_BILD_SENDEN_ ? f.getThumbnail() : f.getBlob();
  } catch (e) {
    return { error: "fehlt", message: "Das Bild ist nicht mehr im Drive." };
  }
  if (!blob) return { error: "gross", message: "Das Bild ist zu groß für eine Vorschau. Bitte kleiner hochladen." };
  return { typ: blob.getContentType(), daten: Utilities.base64Encode(blob.getBytes()) };
}
