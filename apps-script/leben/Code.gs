// =====================================================
// LEBEN – Apps Script (nur die Person, mit Passwort)
// Blatt „besitz“: Sachen mit Kategorie, Ort, Anzahl, Kaufpreis, Kaufdatum, Notiz.
// Zubehör (ab 3.4): Spalte „gehoert_zu“ mit der id der Hauptsache. Nur eine Ebene.
// Bild (ab 3.5): Spalte „bild“ mit der Kennung einer Datei im Google Drive der Person. Hochgeladene Bilder
// liegen im privaten Drive-Ordner „Thetadex Besitz“. Bilder gibt das Skript nur mit Passwort heraus.
// Ausgeliehen (ab 3.6): Spalte „ausgeliehen_an“, freier Text (an wen), leer = nicht ausgeliehen.
// Ausgeliehene Anzahl (ab 0.4.2): Spalte „ausgeliehen_anzahl“, wie viele Stück davon ausgeliehen sind; leer = alle.
// Unterorte (ab 1.3.20): „ort“ hat bis zu drei Ebenen, getrennt mit „ / “ (zum Beispiel „Zimmer / Regal / Kiste“), darum 130 Zeichen.
// Ausmisten (ab 1.3.20): Spalte „ausmisten“, leer = nein, sonst offen, verkaufen, verschenken oder entsorgen.
// Unklar (ab 1.3.25): Spalte „unklar“, nur im Sheet gepflegt. Leer = alles klar, sonst ein kurzer Text (was noch zu klären ist).
// Die App färbt die Kachel gelb und zeigt den Text; sie ändert die Spalte nie. Keine Pflichtspalte: Speichern geht auch ohne sie.
// Herbarium (ab 1.5.3, Etappe 13): Blätter „arten“ (eine Zeile je Pflanze, später auch Tiere: Spalte „reich“)
// und „karten“ (Karteikarten anderer Fachbereiche). Lernstand (Fach 1 bis 5) steht in derselben Zeile.
// Bilder im privaten Drive-Ordner „Thetadex Herbarium“ (Skripteigenschaft HERBAR_ORDNER).
// Packlisten (ab 1.7.0, Etappe 15): Blatt „packliste“, eine Zeile je Eintrag, die Liste steht als Name in „liste“.
// Nutzungen (ab 1.7.0): freiwillige Spalte „nutzungen“ im Blatt „besitz“ (Zähler, zum Beispiel beim Wasserfilter).
// Passwort steht NICHT hier, sondern in den Skripteigenschaften (APP_PIN).
// Siehe docs/STAND.md 4 „Besitz, Blatt ‚besitz‘ im Sheet ‚Leben‘“ und 4 „Herbarium, Sheet ‚Leben‘“.
// =====================================================

var BLATT_BESITZ_ = "besitz";
var KOPF_BESITZ_ = ["id", "name", "kategorie", "ort", "anzahl", "kaufpreis", "kaufdatum", "notiz", "erstellt_am", "geaendert_am", "geloescht", "gehoert_zu", "bild", "ausgeliehen_an", "ausgeliehen_anzahl", "ausmisten"];
var KANN_SPALTEN_ = ["unklar", "nutzungen"];   // legt „einrichten“ an, Speichern verlangt sie nicht
var TEXT_SPALTEN_ = ["id", "name", "kategorie", "ort", "notiz", "gehoert_zu", "bild", "ausgeliehen_an", "ausmisten", "unklar"];   // bleiben im Sheet reiner Text (kein Datum, keine Zahl)
var MAX_ = { name: 80, kategorie: 40, ort: 130, notiz: 300, ausgeliehen_an: 60 };       // Höchstlängen
var AUSMISTEN_ = ["offen", "verkaufen", "verschenken", "entsorgen"];   // erlaubte Werte, leer = nicht ausmisten
var MAX_ANZAHL_ = 9999;
var MAX_PREIS_ = 1000000;
var MAX_NUTZUNGEN_ = 1000000;     // Zähler „nutzungen“ (ab 1.7.0)
var BILD_ORDNER_NAME_ = "Thetadex Besitz";      // privater Ordner im Drive für hochgeladene Bilder
var MAX_BILD_TEXT_ = 4000000;                   // Höchstlänge eines hochgeladenen Bildes als Text (etwa 3 MB)
var MAX_BILD_SENDEN_ = 1500000;                 // größere Bilder schickt das Skript als Vorschau (Bytes)

// Herbarium (ab 1.5.3). Je Blatt die Felder, die die App schreiben darf:
// max = Höchstlänge (zu lang wird abgelehnt, nicht gekürzt), lang = Zeilenumbrüche bleiben, pflicht, art = haken / datum / wahl.
var HERBAR_ = {
  arten: {
    kopf: ["id", "reich", "name", "latein", "familie", "gruppen", "eigenschaften", "merkmale", "notiz", "bilder",
           "im_herbar", "herbar_nr", "gefunden_am", "fundort", "fach", "gelernt_am", "erstellt_am", "geaendert_am", "geloescht"],
    felder: {
      reich: { art: "wahl", werte: ["flora", "fauna"], titel: "Reich" },
      name: { max: 80, pflicht: true, titel: "Deutscher Name" },
      latein: { max: 80, titel: "Lateinischer Name" },
      familie: { max: 80, titel: "Familie" },
      gruppen: { max: 200, art: "liste", titel: "Gruppen" },
      eigenschaften: { max: 3000, lang: true, titel: "Eigenschaften" },
      merkmale: { max: 3000, lang: true, titel: "Bestimmungsmerkmale" },
      notiz: { max: 3000, lang: true, titel: "Notiz" },
      im_herbar: { art: "haken" },
      herbar_nr: { max: 20, titel: "Nummer im Herbarium" },
      gefunden_am: { art: "datum", titel: "Funddatum" },
      fundort: { max: 100, titel: "Fundort" }
    },
    pruefen: "name",           // Zeilen ohne dieses Feld zählen nicht
    wort: "Diese Pflanze"
  },
  karten: {
    kopf: ["id", "kategorie", "vorne", "hinten", "bilder", "fach", "gelernt_am", "erstellt_am", "geaendert_am", "geloescht"],
    felder: {
      kategorie: { max: 40, pflicht: true, titel: "Fachbereich" },
      vorne: { max: 300, pflicht: true, titel: "Vorderseite" },
      hinten: { max: 3000, lang: true, titel: "Rückseite" }
    },
    pruefen: "vorne",
    wort: "Diese Karte"
  }
};
var HERBAR_ZAHL_SPALTEN_ = ["im_herbar", "fach", "erstellt_am", "geaendert_am", "geloescht"];   // alle anderen bleiben reiner Text
var MAX_HERBAR_ZEILEN_ = 3000;      // je Blatt
var MAX_HERBAR_BILDER_ = 5;         // je Pflanze oder Karte
var HERBAR_ORDNER_NAME_ = "Thetadex Herbarium";

// Packlisten (ab 1.7.0). hin, zurueck: TRUE oder leer. reihenfolge: kleine Zahl = oben (je Liste).
// besitz_id: freiwillig, zeigt auf ein Item im Blatt „besitz“ (für dessen Zähler „nutzungen“).
var PACK_BLATT_ = "packliste";
var PACK_KOPF_ = ["id", "liste", "gruppe", "name", "anzahl", "hin", "zurueck", "reihenfolge", "besitz_id", "erstellt_am", "geaendert_am", "geloescht"];
var PACK_TEXT_ = ["id", "liste", "gruppe", "name", "besitz_id"];   // bleiben im Sheet reiner Text
var PACK_MAX_ = { liste: 40, gruppe: 40, name: 80 };
var PACK_MAX_ANZAHL_ = 999;
var PACK_MAX_LISTEN_ = 50;
var PACK_MAX_ZEILEN_ = 2000;

// --- 1. EINRICHTEN (im Editor ausführen, auch nach einem Update) ---

// Legt das Blatt an und ergänzt fehlende Spalten am Ende. Vorhandene Daten bleiben unverändert.
function einrichten() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(BLATT_BESITZ_) || ss.insertSheet(BLATT_BESITZ_);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, KOPF_BESITZ_.length + KANN_SPALTEN_.length).setValues([KOPF_BESITZ_.concat(KANN_SPALTEN_)]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    Logger.log("Blatt '" + BLATT_BESITZ_ + "' angelegt.");
  } else {
    var sp = spalten_(sheet);
    var fehlen = KOPF_BESITZ_.concat(KANN_SPALTEN_).filter(function (k) { return sp[k] == null; });
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
  // Herbarium (ab 1.5.3): Blätter „arten“ und „karten“
  Object.keys(HERBAR_).forEach(function (name) { einrichtenHerbar_(ss, name); });
  // Packlisten (ab 1.7.0): Blatt „packliste“
  einrichtenPack_(ss);
  // Drive-Ordner für Bilder anlegen (beim ersten Mal fragt Google nach der Erlaubnis für Drive)
  var ordner = bildOrdner_();
  Logger.log("Ordner für Bilder: '" + ordner.getName() + "'.");
  Logger.log("Ordner für Bilder im Herbarium: '" + herbarOrdner_().getName() + "'.");
  Logger.log("Fertig.");
}

// Legt ein Blatt des Herbariums an oder ergänzt fehlende Spalten am Ende. Vorhandene Daten bleiben unverändert.
function einrichtenHerbar_(ss, name) {
  var kopf = HERBAR_[name].kopf;
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, kopf.length).setValues([kopf]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    Logger.log("Blatt '" + name + "' angelegt.");
  } else {
    var sp = spalten_(sheet);
    var fehlen = kopf.filter(function (k) { return sp[k] == null; });
    if (fehlen.length) {
      sheet.getRange(1, sheet.getLastColumn() + 1, 1, fehlen.length).setValues([fehlen]).setFontWeight("bold");
      Logger.log("Blatt '" + name + "': Spalten ergänzt: " + fehlen.join(", "));
    } else {
      Logger.log("Blatt '" + name + "' ist vollständig.");
    }
  }
  var karte = spalten_(sheet);
  kopf.forEach(function (k) {
    if (HERBAR_ZAHL_SPALTEN_.indexOf(k) < 0) sheet.getRange(2, karte[k] + 1, sheet.getMaxRows() - 1, 1).setNumberFormat("@");
  });
}

// Legt das Blatt „packliste“ an oder ergänzt fehlende Spalten am Ende (ab 1.7.0). Vorhandene Daten bleiben.
function einrichtenPack_(ss) {
  var sheet = ss.getSheetByName(PACK_BLATT_) || ss.insertSheet(PACK_BLATT_);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, PACK_KOPF_.length).setValues([PACK_KOPF_]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    Logger.log("Blatt '" + PACK_BLATT_ + "' angelegt.");
  } else {
    var sp = spalten_(sheet);
    var fehlen = PACK_KOPF_.filter(function (k) { return sp[k] == null; });
    if (fehlen.length) {
      sheet.getRange(1, sheet.getLastColumn() + 1, 1, fehlen.length).setValues([fehlen]).setFontWeight("bold");
      Logger.log("Blatt '" + PACK_BLATT_ + "': Spalten ergänzt: " + fehlen.join(", "));
    } else {
      Logger.log("Blatt '" + PACK_BLATT_ + "' ist vollständig.");
    }
  }
  var karte = spalten_(sheet);
  PACK_TEXT_.forEach(function (k) { sheet.getRange(2, karte[k] + 1, sheet.getMaxRows() - 1, 1).setNumberFormat("@"); });
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

// Der private Ordner für Bilder im Herbarium (Skripteigenschaft HERBAR_ORDNER), ab 1.5.3
function herbarOrdner_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("HERBAR_ORDNER");
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* gelöscht: neu anlegen */ }
  }
  var ordner = DriveApp.createFolder(HERBAR_ORDNER_NAME_);
  props.setProperty("HERBAR_ORDNER", ordner.getId());
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
    ausmisten: String(zelle_(z, sp, "ausmisten")).trim(),
    unklar: ohneSchutz_(zelle_(z, sp, "unklar")).trim().substring(0, 300),
    nutzungen: nutzungen_(zelle_(z, sp, "nutzungen")),
    geaendert_am: stempel_(zelle_(z, sp, "geaendert_am"))
  };
}

// Zähler „nutzungen“ aus einer Zelle: leer = kein Zähler (null), sonst ganze Zahl ab 0
function nutzungen_(v) {
  if (String(v == null ? "" : v).trim() === "") return null;
  var n = Number(v);
  return isFinite(n) && n >= 0 ? Math.floor(n) : null;
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

    // Herbarium (ab 1.5.3). Laden liest ohne Sperre (ab 1.5.8) und sperrt nur,
    // wenn von Hand eingefügte Zeilen noch keine id haben.
    if (data.action === "herbar") {
      var ohneSperre = herbarListe_(false);
      if (ohneSperre) return jsonOut_(ohneSperre);
    }
    var HERBAR_AKTIONEN_ = { herbar: function () { return herbarListe_(true); }, herbar_speichern: herbarSpeichern_,
                             herbar_loeschen: herbarLoeschen_, herbar_bild: herbarBild_, herbar_gelernt: herbarGelernt_ };
    // Nur eigene Einträge (ab 1.5.8): sonst fände z. B. "constructor" eine eingebaute Funktion
    if (Object.prototype.hasOwnProperty.call(HERBAR_AKTIONEN_, String(data.action))) {
      var sperre = LockService.getScriptLock();
      if (!sperre.tryLock(20000)) {
        return jsonOut_({ error: "ausgelastet", message: "Script ausgelastet. Bitte gleich nochmal versuchen." });
      }
      try {
        return jsonOut_(HERBAR_AKTIONEN_[data.action](data));
      } finally {
        sperre.releaseLock();
      }
    }

    // Packlisten (ab 1.7.0). Laden liest ohne Sperre, außer eingefügte Zeilen haben noch keine id.
    if (data.action === "packliste") {
      var packOhne = packListe_(false);
      if (packOhne) return jsonOut_(packOhne);
    }
    var PACK_AKTIONEN_ = { packliste: function () { return packListe_(true); }, pack_speichern: packSpeichern_,
                           pack_haken: packHaken_, pack_loeschen: packLoeschen_, pack_zuruecksetzen: packZuruecksetzen_,
                           pack_reihenfolge: packReihenfolge_, besitz_nutzung: besitzNutzung_ };
    if (Object.prototype.hasOwnProperty.call(PACK_AKTIONEN_, String(data.action))) {
      var packSperre = LockService.getScriptLock();
      if (!packSperre.tryLock(20000)) {
        return jsonOut_({ error: "ausgelastet", message: "Script ausgelastet. Bitte gleich nochmal versuchen." });
      }
      try {
        return jsonOut_(PACK_AKTIONEN_[data.action](data));
      } finally {
        packSperre.releaseLock();
      }
    }

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
  var mist = String(data.ausmisten == null ? "" : data.ausmisten).trim();
  if (mist && AUSMISTEN_.indexOf(mist) < 0) return { fehler: "Ungültiger Wert bei Ausmisten." };
  w.ausmisten = mist;

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

  // Nutzungen (ab 1.7.0): nur wenn die App sie mitschickt; leer = kein Zähler
  if ("nutzungen" in data) {
    var nz = data.nutzungen == null ? "" : String(data.nutzungen).trim();
    if (nz !== "") {
      var nzahl = Number(nz);
      if (!isFinite(nzahl) || Math.floor(nzahl) !== nzahl || nzahl < 0 || nzahl > MAX_NUTZUNGEN_) {
        return { fehler: "Nutzungen bitte als ganze Zahl von 0 bis " + MAX_NUTZUNGEN_ + " (oder leer)." };
      }
      nz = nzahl;
    }
    w.nutzungen = nz;
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
  if ("nutzungen" in p.werte && sp.nutzungen == null) {
    return { error: "blatt", message: "Spalte nutzungen fehlt. Bitte im Editor 'einrichten' ausführen." };
  }

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

// Prüft das Bild einer Sache und liefert { id } (leer = kein Bild) oder { fehler }.
// ordner: wohin hochgeladene Bilder kommen (leer = „Thetadex Besitz“, ab 1.5.3 auch „Thetadex Herbarium“)
function bildAus_(data, ordner) {
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
    var datei = (ordner || bildOrdner_()).createFile(Utilities.newBlob(bytes, jpeg ? "image/jpeg" : "image/png", name + (jpeg ? ".jpg" : ".png")));
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
  }) || herbarKenntBild_(id);
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


// --- 7. HERBARIUM (ab 1.5.3, Etappe 13) ---
// Blätter „arten“ und „karten“ im selben Sheet. Siehe docs/STAND.md 4 „Herbarium, Sheet ‚Leben‘“.

// Wie bereinigeText_, aber Zeilenumbrüche bleiben (höchstens eine Leerzeile). Für lange Texte.
function bereinigeLang_(text, maxLaenge) {
  var t = String(text == null ? "" : text).replace(/\r\n?/g, "\n").replace(/\t/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (t.length > maxLaenge) t = t.substring(0, maxLaenge);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

// Liste von Drive-Kennungen aus einer Zelle (JSON-Liste)
function bilderListe_(v) {
  var liste;
  try { liste = JSON.parse(String(v == null || v === "" ? "[]" : v)); } catch (e) { liste = []; }
  return Array.isArray(liste) ? liste.map(function (x) { return String(x); }).filter(function (x) { return /^[A-Za-z0-9_-]{20,}$/.test(x); }) : [];
}

// Blatt mit Spalten; fehlt eine Spalte, Hinweis auf „einrichten“
function herbarBlatt_(name) {
  if (!Object.prototype.hasOwnProperty.call(HERBAR_, String(name))) throw new Error("Unbekanntes Blatt.");
  var sheet = blatt_(name);
  var sp = spalten_(sheet);
  var fehlen = HERBAR_[name].kopf.filter(function (k) { return sp[k] == null; });
  if (fehlen.length) throw new Error("Im Blatt '" + name + "' fehlen Spalten: " + fehlen.join(", ") + ". Bitte im Editor 'einrichten' ausführen.");
  return { name: name, sheet: sheet, sp: sp, breite: sheet.getLastColumn() };
}

// Fach 1 bis 5 aus einer Zelle (leer oder Unsinn = 1)
function fach_(v) {
  var n = Number(v);
  return isFinite(n) && Math.floor(n) === n && n >= 1 && n <= 5 ? n : 1;
}

// Eine Zeile als Objekt für die App
function herbarAus_(b, z) {
  var e = { id: String(zelle_(z, b.sp, "id")).trim() };
  Object.keys(HERBAR_[b.name].felder).forEach(function (k) {
    var f = HERBAR_[b.name].felder[k];
    if (f.art === "haken") e[k] = istWahr_(zelle_(z, b.sp, k));
    else if (f.art === "datum") e[k] = tag_(zelle_(z, b.sp, k));
    else e[k] = ohneSchutz_(zelle_(z, b.sp, k));
  });
  if (b.name === "arten" && !e.reich) e.reich = "flora";
  e.bilder = bilderListe_(zelle_(z, b.sp, "bilder"));
  e.fach = fach_(zelle_(z, b.sp, "fach"));
  e.gelernt_am = tag_(zelle_(z, b.sp, "gelernt_am"));
  e.geaendert_am = stempel_(zelle_(z, b.sp, "geaendert_am"));
  return e;
}

// Zählt eine Zeile? (nicht gelöscht, Pflichtfeld da)
function herbarAktiv_(b, z) {
  return !istWahr_(zelle_(z, b.sp, "geloescht")) && String(zelle_(z, b.sp, HERBAR_[b.name].pruefen)).trim() !== "";
}

// Alle Pflanzen und Karten. Eingefügte Zeilen ohne id bekommen hier eine (darum läuft „herbar“ mit Sperre).
// schreiben = false: liest nur und liefert null, sobald eine id fehlt (dann neu mit Sperre und schreiben = true).
function herbarListe_(schreiben) {
  var antwort = {};
  var namen = Object.keys(HERBAR_);
  for (var n = 0; n < namen.length; n++) {
    var name = namen[n];
    var b = herbarBlatt_(name);
    var alle = zeilen_(b.sheet);
    var liste = [];
    for (var i = 0; i < alle.length; i++) {
      var z = alle[i];
      if (!herbarAktiv_(b, z)) continue;
      if (!String(z[b.sp.id]).trim()) {
        if (!schreiben) return null;
        z[b.sp.id] = Utilities.getUuid();
        b.sheet.getRange(i + 2, b.sp.id + 1).setValue(z[b.sp.id]);
      }
      liste.push(herbarAus_(b, z));
    }
    antwort[name] = liste;
  }
  return antwort;
}

// Sucht eine nicht gelöschte Zeile nach id. Liefert { nr, zeile } oder null.
function herbarFinde_(b, id) {
  if (!id) return null;
  var alle = zeilen_(b.sheet);
  for (var i = 0; i < alle.length; i++) {
    if (String(alle[i][b.sp.id]).trim() === id && !istWahr_(alle[i][b.sp.geloescht])) return { nr: i + 2, zeile: alle[i] };
  }
  return null;
}

// Prüft die mitgeschickten Felder. Felder, die nicht mitkommen, bleiben unverändert (bei neuen: leer).
function herbarPruefe_(name, data, neu) {
  var felder = HERBAR_[name].felder;
  var w = {};
  var namen = Object.keys(felder);
  for (var i = 0; i < namen.length; i++) {
    var k = namen[i], f = felder[k];
    if (data[k] === undefined && !neu) continue;
    var roh = data[k] == null ? "" : data[k];
    if (f.art === "haken") { w[k] = roh === true || istWahr_(roh); continue; }
    var t = f.lang ? String(roh).replace(/\r\n?/g, "\n").trim() : String(roh).replace(/\s+/g, " ").trim();
    if (f.art === "wahl") {
      if (!t && neu) t = f.werte[0];
      if (f.werte.indexOf(t) < 0) return { fehler: "Ungültiger Wert bei " + f.titel + "." };
      w[k] = t; continue;
    }
    if (f.art === "datum") {
      if (t && (!/^\d{4}-\d{2}-\d{2}$/.test(t) || isNaN(new Date(t + "T12:00:00")) || new Date(t + "T12:00:00").toISOString().substring(0, 10) !== t)) {
        return { fehler: "Ungültiges " + f.titel + "." };
      }
      if (t && t > tag_(new Date())) return { fehler: "Das " + f.titel + " liegt in der Zukunft." };
      w[k] = t; continue;
    }
    if (f.art === "liste") {
      // „Frühblüher,  Heilpflanze, frühblüher“ → „Frühblüher, Heilpflanze“
      var gesehen = {};
      t = t.split(",").map(function (x) { return x.trim(); }).filter(function (x) {
        var key = x.toLowerCase();
        if (!x || gesehen[key]) return false;
        gesehen[key] = true;
        return true;
      }).join(", ");
    }
    if (!t && f.pflicht) return { fehler: "Bitte " + f.titel + " angeben." };
    if (t.length > f.max) return { fehler: f.titel + " ist zu lang (höchstens " + f.max + " Zeichen)." };
    w[k] = f.lang ? bereinigeLang_(t, f.max) : bereinigeText_(t, f.max);
  }
  return { werte: w };
}

// Neu (ohne id) oder ändern (mit id und geaendert_am). „bilder“ = Liste der behaltenen Bilder; neue kommen über herbar_bild.
function herbarSpeichern_(data) {
  var b = herbarBlatt_(String(data.blatt || ""));
  var neu = data.id == null || data.id === "";
  var p = herbarPruefe_(b.name, data, neu);
  if (p.fehler) return { error: "eingabe", message: p.fehler };

  var zeile, nr;
  if (neu) {
    var anzahl = zeilen_(b.sheet).filter(function (z) { return herbarAktiv_(b, z); }).length;
    if (anzahl >= MAX_HERBAR_ZEILEN_) return { error: "eingabe", message: "Höchstens " + MAX_HERBAR_ZEILEN_ + " Einträge." };
    zeile = new Array(b.breite).fill("");
    zeile[b.sp.id] = Utilities.getUuid();
    zeile[b.sp.geloescht] = false;
    zeile[b.sp.fach] = 1;
    nr = b.sheet.getLastRow() + 1;
  } else {
    var gefunden = herbarFinde_(b, String(data.id));
    if (!gefunden) return { error: "fehlt", message: HERBAR_[b.name].wort + " gibt es nicht mehr. Bitte neu laden." };
    if (stempel_(gefunden.zeile[b.sp.geaendert_am]) !== String(data.geaendert_am || "")) {
      return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Gerät). Bitte neu laden." };
    }
    zeile = gefunden.zeile;
    nr = gefunden.nr;
  }

  // Bilder: nur behaltene Kennungen, die schon beim Eintrag stehen (so kommt hier keine fremde Datei dazu)
  if (Array.isArray(data.bilder)) {
    var alt = bilderListe_(zeile[b.sp.bilder]);
    var behalten = data.bilder.map(function (x) { return String(x); }).filter(function (x, i, liste) {
      return alt.indexOf(x) >= 0 && liste.indexOf(x) === i;
    });
    p.werte.bilder = behalten.length ? JSON.stringify(behalten) : "";
  }

  var jetzt = jetzt_(zeile[b.sp.geaendert_am]);
  if (!zeile[b.sp.erstellt_am]) zeile[b.sp.erstellt_am] = jetzt;
  Object.keys(p.werte).forEach(function (k) { zeile[b.sp[k]] = p.werte[k]; });
  zeile[b.sp.geaendert_am] = jetzt;
  b.sheet.getRange(nr, 1, 1, b.breite).setValues([zeile]);
  return { eintrag: herbarAus_(b, b.sheet.getRange(nr, 1, 1, b.breite).getValues()[0]) };
}

// Weich löschen (geloescht = TRUE, im Sheet zurückholbar)
function herbarLoeschen_(data) {
  var b = herbarBlatt_(String(data.blatt || ""));
  var gefunden = herbarFinde_(b, String(data.id || ""));
  if (!gefunden) return { error: "fehlt", message: HERBAR_[b.name].wort + " gibt es nicht mehr. Bitte neu laden." };
  if (stempel_(gefunden.zeile[b.sp.geaendert_am]) !== String(data.geaendert_am || "")) {
    return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Gerät). Bitte neu laden." };
  }
  b.sheet.getRange(gefunden.nr, b.sp.geloescht + 1).setValue(true);
  b.sheet.getRange(gefunden.nr, b.sp.geaendert_am + 1).setValue(jetzt_(gefunden.zeile[b.sp.geaendert_am]));
  return { ok: true };
}

// Ein neues Bild hinten anhängen: hochgeladen (bild_daten) oder als Drive-Link (bild). Schutz über geaendert_am.
function herbarBild_(data) {
  var b = herbarBlatt_(String(data.blatt || ""));
  var gefunden = herbarFinde_(b, String(data.id || ""));
  if (!gefunden) return { error: "fehlt", message: HERBAR_[b.name].wort + " gibt es nicht mehr. Bitte neu laden." };
  if (stempel_(gefunden.zeile[b.sp.geaendert_am]) !== String(data.geaendert_am || "")) {
    return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Gerät). Bitte neu laden." };
  }
  var bilder = bilderListe_(gefunden.zeile[b.sp.bilder]);
  if (bilder.length >= MAX_HERBAR_BILDER_) return { error: "eingabe", message: "Höchstens " + MAX_HERBAR_BILDER_ + " Bilder." };
  if (!data.bild_daten && !String(data.bild == null ? "" : data.bild).trim()) return { error: "eingabe", message: "Bitte ein Bild wählen oder einen Drive-Link einfügen." };
  var titel = ohneSchutz_(gefunden.zeile[b.sp[HERBAR_[b.name].pruefen]]);
  var bild = bildAus_({ bild_daten: data.bild_daten, bild: data.bild, name: titel }, herbarOrdner_());
  if (bild.fehler) return { error: "eingabe", message: bild.fehler };
  if (bilder.indexOf(bild.id) >= 0) return { error: "eingabe", message: "Dieses Bild ist schon dabei." };
  bilder.push(bild.id);
  var z = gefunden.zeile;
  z[b.sp.bilder] = JSON.stringify(bilder);
  z[b.sp.geaendert_am] = jetzt_(z[b.sp.geaendert_am]);
  b.sheet.getRange(gefunden.nr, 1, 1, b.breite).setValues([z]);
  return { eintrag: herbarAus_(b, b.sheet.getRange(gefunden.nr, 1, 1, b.breite).getValues()[0]) };
}

// Eine Antwort beim Lernen: gewusst = ein Fach weiter (höchstens 5), nicht gewusst = zurück in Fach 1.
// Ändert nur fach und gelernt_am, nicht geaendert_am (sonst schlüge danach „Bearbeiten“ fehl).
function herbarGelernt_(data) {
  var b = herbarBlatt_(String(data.blatt || ""));
  var gefunden = herbarFinde_(b, String(data.id || ""));
  if (!gefunden) return { error: "fehlt", message: HERBAR_[b.name].wort + " gibt es nicht mehr. Bitte neu laden." };
  var fach = data.gewusst === true ? Math.min(5, fach_(gefunden.zeile[b.sp.fach]) + 1) : 1;
  var heute = tag_(new Date());
  b.sheet.getRange(gefunden.nr, b.sp.fach + 1).setValue(fach);
  b.sheet.getRange(gefunden.nr, b.sp.gelernt_am + 1).setValue(heute);
  return { id: String(data.id), fach: fach, gelernt_am: heute };
}

// Steht ein Bild bei einer nicht gelöschten Pflanze oder Karte? (für die Aktion „bild“)
function herbarKenntBild_(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return Object.keys(HERBAR_).some(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return false;
    var b = { name: name, sheet: sheet, sp: spalten_(sheet) };
    if (b.sp.bilder == null) return false;
    return zeilen_(sheet).some(function (z) {
      return herbarAktiv_(b, z) && bilderListe_(zelle_(z, b.sp, "bilder")).indexOf(id) >= 0;
    });
  });
}


// --- 8. PACKLISTEN (ab 1.7.0, Etappe 15) ---
// Feste Listen je Anlass. Eine Zeile je Eintrag; die Liste hat kein eigenes Blatt, ihr Name steht in „liste“
// (neue Liste = erster Eintrag mit neuem Namen; umbenennen im Sheet mit „Suchen und ersetzen“).
// Zwei Haken: „hin“ (eingepackt) und „zurueck“ (wieder eingepackt). Haken ändern geaendert_am nicht,
// damit ein offenes Formular am anderen Gerät gültig bleibt.
// Zähler: Ein Eintrag mit besitz_id zeigt die „nutzungen“ dieses Items; besitz_nutzung zählt dort +1 oder −1.
// Siehe docs/PLAN-ETAPPE-15.md.

// Blatt mit Spalten und Zeilen; fehlt eine Spalte, Hinweis auf „einrichten“
function packBlatt_() {
  var sheet = blatt_(PACK_BLATT_);
  var sp = spalten_(sheet);
  var fehlen = PACK_KOPF_.filter(function (k) { return sp[k] == null; });
  if (fehlen.length) throw new Error("Im Blatt '" + PACK_BLATT_ + "' fehlen Spalten: " + fehlen.join(", ") + ". Bitte im Editor 'einrichten' ausführen.");
  return { sheet: sheet, sp: sp, breite: sheet.getLastColumn(), zeilen: zeilen_(sheet) };
}

// Zählt eine Zeile? (nicht gelöscht, Name und Liste da)
function packAktiv_(t, z) {
  return !istWahr_(zelle_(z, t.sp, "geloescht")) && String(zelle_(z, t.sp, "name")).trim() !== "" && String(zelle_(z, t.sp, "liste")).trim() !== "";
}

function packZahl_(v) {
  var n = Number(v);
  return String(v == null ? "" : v).trim() !== "" && isFinite(n) ? n : 0;
}

// Eine Zeile als Objekt für die App
function packAus_(t, z) {
  var anzahl = Number(zelle_(z, t.sp, "anzahl"));
  return {
    id: String(zelle_(z, t.sp, "id")).trim(),
    liste: ohneSchutz_(zelle_(z, t.sp, "liste")).trim(),
    gruppe: ohneSchutz_(zelle_(z, t.sp, "gruppe")).trim(),
    name: ohneSchutz_(zelle_(z, t.sp, "name")).trim(),
    anzahl: isFinite(anzahl) && anzahl >= 1 ? Math.floor(anzahl) : null,
    hin: istWahr_(zelle_(z, t.sp, "hin")),
    zurueck: istWahr_(zelle_(z, t.sp, "zurueck")),
    reihenfolge: packZahl_(zelle_(z, t.sp, "reihenfolge")),
    besitz_id: String(zelle_(z, t.sp, "besitz_id")).trim(),
    geaendert_am: stempel_(zelle_(z, t.sp, "geaendert_am"))
  };
}

// Index einer nicht gelöschten Zeile nach id, sonst -1
function packIndex_(t, id) {
  id = String(id || "");
  if (!id) return -1;
  for (var i = 0; i < t.zeilen.length; i++) {
    if (String(t.zeilen[i][t.sp.id]).trim() === id && !istWahr_(t.zeilen[i][t.sp.geloescht])) return i;
  }
  return -1;
}

// Die Items im Besitz, auf die Einträge zeigen: { <id>: { name, nutzungen } }. Fehlt ein Item, fehlt es hier.
function packZaehler_(eintraege) {
  var gesucht = {};
  eintraege.forEach(function (e) { if (e.besitz_id) gesucht[e.besitz_id] = true; });
  var antwort = {};
  if (!Object.keys(gesucht).length) return antwort;
  var sheet = blatt_(BLATT_BESITZ_);
  var sp = spalten_(sheet);
  zeilen_(sheet).forEach(function (z) {
    var id = String(zelle_(z, sp, "id")).trim();
    if (!gesucht[id] || istWahr_(zelle_(z, sp, "geloescht"))) return;
    antwort[id] = { name: ohneSchutz_(zelle_(z, sp, "name")), nutzungen: nutzungen_(zelle_(z, sp, "nutzungen")) || 0 };
  });
  return antwort;
}

// Alle Einträge und die Zähler. Eingefügte Zeilen ohne id bekommen hier eine (darum mit Sperre).
// schreiben = false: liest nur und liefert null, sobald eine id fehlt.
function packListe_(schreiben) {
  var t = packBlatt_();
  var eintraege = [];
  for (var i = 0; i < t.zeilen.length; i++) {
    var z = t.zeilen[i];
    if (!packAktiv_(t, z)) continue;
    if (!String(z[t.sp.id]).trim()) {
      if (!schreiben) return null;
      z[t.sp.id] = Utilities.getUuid();
      t.sheet.getRange(i + 2, t.sp.id + 1).setValue(z[t.sp.id]);
    }
    eintraege.push(packAus_(t, z));
  }
  return { eintraege: eintraege, zaehler: packZaehler_(eintraege) };
}

// Größte reihenfolge in einer Liste plus 1: so steht ein neuer Eintrag am Ende seiner Gruppe
// (die App ordnet die Gruppen nach ihrem ersten Eintrag).
function packUnten_(t, liste, ohneId) {
  var max = 0;
  var name = String(liste).toLowerCase();
  t.zeilen.forEach(function (z) {
    if (!packAktiv_(t, z) || String(z[t.sp.id]).trim() === ohneId) return;
    if (ohneSchutz_(z[t.sp.liste]).trim().toLowerCase() !== name) return;
    max = Math.max(max, packZahl_(z[t.sp.reihenfolge]));
  });
  return Math.floor(max) + 1;
}

// Text prüfen: Leerzeichen zusammenfassen, Länge, Pflicht
function packText_(v, max, titel, pflicht) {
  var t = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
  if (!t && pflicht) return { fehler: "Bitte " + titel + " angeben." };
  if (t.length > max) return { fehler: titel + " ist zu lang (höchstens " + max + " Zeichen)." };
  return { roh: t, wert: bereinigeText_(t, max) };
}

// Neu (ohne id) oder ändern (mit id und geaendert_am). data = { liste, gruppe, name, anzahl, besitz_id }.
function packSpeichern_(data) {
  var liste = packText_(data.liste, PACK_MAX_.liste, "eine Liste", true);
  if (liste.fehler) return { error: "eingabe", message: liste.fehler };
  var gruppe = packText_(data.gruppe, PACK_MAX_.gruppe, "Gruppe", false);
  if (gruppe.fehler) return { error: "eingabe", message: gruppe.fehler };
  var name = packText_(data.name, PACK_MAX_.name, "einen Namen", true);
  if (name.fehler) return { error: "eingabe", message: name.fehler };
  var anzahl = "";
  if (data.anzahl != null && String(data.anzahl).trim() !== "") {
    anzahl = Number(data.anzahl);
    if (!isFinite(anzahl) || Math.floor(anzahl) !== anzahl || anzahl < 1 || anzahl > PACK_MAX_ANZAHL_) {
      return { error: "eingabe", message: "Anzahl bitte als ganze Zahl von 1 bis " + PACK_MAX_ANZAHL_ + " (oder leer)." };
    }
  }
  // Item im Besitz: muss es geben (nicht gelöscht)
  var besitzId = String(data.besitz_id == null ? "" : data.besitz_id).trim();
  if (besitzId) {
    var bs = blatt_(BLATT_BESITZ_);
    if (!finde_(bs, spalten_(bs), besitzId)) return { error: "eingabe", message: "Dieses Item gibt es im Besitz nicht mehr. Bitte neu laden." };
  }

  var t = packBlatt_();
  var id = String(data.id || "");
  var werte = { liste: liste.wert, gruppe: gruppe.wert, name: name.wert, anzahl: anzahl, besitz_id: besitzId };
  var zeile, nr;
  if (!id) {
    var aktive = t.zeilen.filter(function (z) { return packAktiv_(t, z); });
    if (aktive.length >= PACK_MAX_ZEILEN_) return { error: "eingabe", message: "Höchstens " + PACK_MAX_ZEILEN_ + " Einträge." };
    var listen = {};
    aktive.forEach(function (z) { listen[ohneSchutz_(z[t.sp.liste]).trim().toLowerCase()] = true; });
    if (!listen[liste.roh.toLowerCase()] && Object.keys(listen).length >= PACK_MAX_LISTEN_) {
      return { error: "eingabe", message: "Höchstens " + PACK_MAX_LISTEN_ + " Listen." };
    }
    zeile = new Array(t.breite).fill("");
    zeile[t.sp.id] = Utilities.getUuid();
    zeile[t.sp.geloescht] = false;
    werte.reihenfolge = packUnten_(t, liste.roh, "");
    nr = t.sheet.getLastRow() + 1;
  } else {
    var i = packIndex_(t, id);
    if (i < 0) return { error: "fehlt", message: "Diesen Eintrag gibt es nicht mehr. Bitte neu laden." };
    zeile = t.zeilen[i];
    if (stempel_(zeile[t.sp.geaendert_am]) !== String(data.geaendert_am || "")) {
      return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Gerät). Bitte neu laden." };
    }
    // Wechselt der Eintrag die Liste oder die Gruppe, steht er dort am Ende
    var alteListe = ohneSchutz_(zeile[t.sp.liste]).trim().toLowerCase();
    var alteGruppe = ohneSchutz_(zeile[t.sp.gruppe]).trim().toLowerCase();
    if (alteListe !== liste.roh.toLowerCase() || alteGruppe !== gruppe.roh.toLowerCase()) {
      werte.reihenfolge = packUnten_(t, liste.roh, id);
    }
    nr = i + 2;
  }
  var jetzt = jetzt_(zeile[t.sp.geaendert_am]);
  if (!zeile[t.sp.erstellt_am]) zeile[t.sp.erstellt_am] = jetzt;
  Object.keys(werte).forEach(function (k) { zeile[t.sp[k]] = werte[k]; });
  zeile[t.sp.geaendert_am] = jetzt;
  t.sheet.getRange(nr, 1, 1, t.breite).setValues([zeile]);
  var neu = t.sheet.getRange(nr, 1, 1, t.breite).getValues()[0];
  var e = packAus_(t, neu);
  return { eintrag: e, zaehler: packZaehler_([e]) };
}

// Einen Haken setzen oder abnehmen. data = { id, art: "hin" oder "zurueck", wert: true oder false }.
function packHaken_(data) {
  var art = String(data.art || "");
  if (art !== "hin" && art !== "zurueck") return { error: "eingabe", message: "Unbekannter Haken." };
  var t = packBlatt_();
  var i = packIndex_(t, data.id);
  if (i < 0) return { error: "fehlt", message: "Diesen Eintrag gibt es nicht mehr. Bitte neu laden." };
  t.sheet.getRange(i + 2, t.sp[art] + 1).setValue(data.wert === true ? true : "");
  return { id: String(data.id), art: art, wert: data.wert === true };
}

// Alle Haken (hin und zurück) einer Liste weg. data = { liste }.
function packZuruecksetzen_(data) {
  var name = String(data.liste == null ? "" : data.liste).trim().toLowerCase();
  if (!name) return { error: "eingabe", message: "Bitte eine Liste angeben." };
  var t = packBlatt_();
  var zahl = 0;
  t.zeilen.forEach(function (z) {
    if (!packAktiv_(t, z) || ohneSchutz_(z[t.sp.liste]).trim().toLowerCase() !== name) return;
    if (istWahr_(z[t.sp.hin])) { z[t.sp.hin] = ""; zahl++; }
    if (istWahr_(z[t.sp.zurueck])) { z[t.sp.zurueck] = ""; zahl++; }
  });
  // Jede Spalte in einem Zug schreiben (schneller als Zelle für Zelle), nur wenn sich etwas geändert hat
  if (zahl > 0) {
    ["hin", "zurueck"].forEach(function (art) {
      t.sheet.getRange(2, t.sp[art] + 1, t.zeilen.length, 1).setValues(t.zeilen.map(function (z) { return [z[t.sp[art]]]; }));
    });
  }
  return { ok: true, geaendert: zahl };
}

// Weich löschen (geloescht = TRUE, im Sheet zurückholbar)
function packLoeschen_(data) {
  var t = packBlatt_();
  var i = packIndex_(t, data.id);
  if (i < 0) return { error: "fehlt", message: "Diesen Eintrag gibt es nicht mehr. Bitte neu laden." };
  if (stempel_(t.zeilen[i][t.sp.geaendert_am]) !== String(data.geaendert_am || "")) {
    return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Gerät). Bitte neu laden." };
  }
  t.sheet.getRange(i + 2, t.sp.geloescht + 1).setValue(true);
  t.sheet.getRange(i + 2, t.sp.geaendert_am + 1).setValue(jetzt_(t.zeilen[i][t.sp.geaendert_am]));
  return { ok: true };
}

// Neue Reihenfolge einer Liste. data = { liste, ids } (alle Einträge der Liste in der gewünschten Folge).
// Genannte bekommen 1, 2, 3 …; nicht genannte derselben Liste kommen dahinter in ihrer alten Folge.
// Andere Listen bleiben unberührt. Ändert geaendert_am nicht. Schreibt nur die eine Spalte.
function packReihenfolge_(data) {
  var name = String(data.liste == null ? "" : data.liste).trim().toLowerCase();
  var ids = Array.isArray(data.ids) ? data.ids.map(String) : null;
  if (!name || !ids || ids.length > PACK_MAX_ZEILEN_) return { error: "eingabe", message: "Ungültige Reihenfolge." };
  var t = packBlatt_();
  var inListe = function (z) { return packAktiv_(t, z) && ohneSchutz_(z[t.sp.liste]).trim().toLowerCase() === name; };
  var platz = {};
  var hat = function (id) { return Object.prototype.hasOwnProperty.call(platz, id); };
  ids.forEach(function (id, k) { if (!hat(id)) platz[id] = k + 1; });
  var rest = [];
  t.zeilen.forEach(function (z, k) { if (inListe(z) && !hat(String(z[t.sp.id]).trim())) rest.push(k); });
  rest.sort(function (a, b) { return packZahl_(t.zeilen[a][t.sp.reihenfolge]) - packZahl_(t.zeilen[b][t.sp.reihenfolge]); });
  var weiter = ids.length;
  rest.forEach(function (k) { t.zeilen[k][t.sp.reihenfolge] = ++weiter; });
  t.zeilen.forEach(function (z) {
    var id = String(z[t.sp.id]).trim();
    if (inListe(z) && hat(id)) z[t.sp.reihenfolge] = platz[id];
  });
  if (t.zeilen.length) {
    t.sheet.getRange(2, t.sp.reihenfolge + 1, t.zeilen.length, 1).setValues(t.zeilen.map(function (z) { return [z[t.sp.reihenfolge]]; }));
  }
  return { ok: true };
}

// Zähler „nutzungen“ eines Items im Besitz um 1 hoch oder runter (nie unter 0). data = { id, schritt: 1 oder -1 }.
// Ändert geaendert_am nicht, damit ein offenes Formular im Besitz gültig bleibt.
function besitzNutzung_(data) {
  var schritt = Number(data.schritt);
  if (schritt !== 1 && schritt !== -1) return { error: "eingabe", message: "Ungültiger Schritt." };
  var sheet = blatt_(BLATT_BESITZ_);
  var sp = spalten_(sheet);
  if (sp.nutzungen == null) return { error: "blatt", message: "Spalte nutzungen fehlt. Bitte im Editor 'einrichten' ausführen." };
  var gefunden = finde_(sheet, sp, String(data.id || ""));
  if (!gefunden) return { error: "fehlt", message: "Dieses Item gibt es im Besitz nicht mehr. Bitte neu laden." };
  var n = Math.min(MAX_NUTZUNGEN_, Math.max(0, (nutzungen_(gefunden.zeile[sp.nutzungen]) || 0) + schritt));
  sheet.getRange(gefunden.nr, sp.nutzungen + 1).setValue(n);
  return { id: String(data.id), nutzungen: n };
}
