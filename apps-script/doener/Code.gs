// =====================================================
// DÖNER LANDAU – Apps Script (öffentlich, ohne Passwort)
// Jede Person mit dem Link darf Bewertungen lesen und neue anlegen.
// Ändern und Löschen nur im Sheet. Dieses Skript kennt keine anderen Daten.
// =====================================================

var BLATT_BEW_ = "bewertungen";
var BLATT_LAEDEN_ = "laeden";
var BLATT_KRIT_ = "kriterien";
var BLATT_DETAILS_ = "details";
var KOPF_BEW_ = ["id", "erstellt_am", "laden", "doener", "yufka", "pommes", "ladennote", "begruendung", "geloescht"];
var KOPF_LAEDEN_ = ["name"];
var KOPF_KRIT_ = ["teil", "name"];
var KOPF_DETAILS_ = ["bewertung_id", "teil", "kriterium", "wert", "begruendung"];
var TEILE_ = ["doener", "yufka", "pommes"];       // zählen für „Insgesamt“
var ALLE_TEILE_ = ["doener", "yufka", "pommes", "laden"];  // „laden“ = Service, Gemütlichkeit …
var SPALTE_JE_TEIL_ = { doener: "doener", yufka: "yufka", pommes: "pommes", laden: "ladennote" };
var MAX_LADEN_ = 60;          // Höchstlänge Name des Ladens
var MAX_BEGRUENDUNG_ = 300;   // Höchstlänge Begründung
var MAX_KRIT_BEGR_ = 200;     // Höchstlänge Begründung je Kriterium
var MAX_DETAILS_ = 60;        // Höchstzahl Kriterien je Bewertung
var MAX_PRO_STUNDE_ = 30;     // Höchstzahl neuer Bewertungen pro Stunde, für alle zusammen
var LISTE_SEKUNDEN_ = 60;     // So lange wird die Liste zwischengespeichert

// Vorgabe für das Blatt „kriterien“ (die Person kann es im Sheet ändern)
var KRITERIEN_VORGABE_ = [
  ["pommes", "Crunchyness"], ["pommes", "Gewürz"], ["pommes", "Wärme"], ["pommes", "Preis-Leistung"],
  ["doener", "Optik"], ["doener", "Füllgrad"], ["doener", "Wärme"], ["doener", "Seitan"], ["doener", "Salatmischung"],
  ["doener", "Brötchen"], ["doener", "Eatability"], ["doener", "Vegane Joghurtsauce"], ["doener", "Bei leerem Magen"],
  ["doener", "In Kombi mit Pommes"],
  ["yufka", "Optik"], ["yufka", "Füllgrad"], ["yufka", "Wärme"], ["yufka", "Seitan"], ["yufka", "Salatmischung"],
  ["yufka", "Brot"], ["yufka", "Eatability"], ["yufka", "Vegane Joghurtsauce"], ["yufka", "Bei leerem Magen"],
  ["yufka", "In Kombi mit Pommes"],
  ["laden", "Service"], ["laden", "Gemütlichkeit"]
];

// --- 1. EINRICHTEN (im Editor ausführen, auch nach einem Update) ---

// Legt fehlende Blätter an und ergänzt fehlende Spalten am Ende. Vorhandene Daten bleiben unverändert.
function einrichten() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [[BLATT_BEW_, KOPF_BEW_], [BLATT_LAEDEN_, KOPF_LAEDEN_], [BLATT_KRIT_, KOPF_KRIT_], [BLATT_DETAILS_, KOPF_DETAILS_]].forEach(function (b) {
    var sheet = ss.getSheetByName(b[0]) || ss.insertSheet(b[0]);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, b[1].length).setValues([b[1]]).setFontWeight("bold");
      sheet.setFrozenRows(1);
      Logger.log("Blatt '" + b[0] + "' angelegt.");
      if (b[0] === BLATT_KRIT_) {
        sheet.getRange(2, 1, KRITERIEN_VORGABE_.length, 2).setValues(KRITERIEN_VORGABE_);
        Logger.log("Kriterien eingetragen: " + KRITERIEN_VORGABE_.length);
      }
      return;
    }
    var sp = spalten_(sheet);
    var fehlen = b[1].filter(function (k) { return sp[k] == null; });
    if (fehlen.length) {
      sheet.getRange(1, sheet.getLastColumn() + 1, 1, fehlen.length).setValues([fehlen]).setFontWeight("bold");
      Logger.log("Blatt '" + b[0] + "': Spalten ergänzt: " + fehlen.join(", "));
    } else {
      Logger.log("Blatt '" + b[0] + "' ist vollständig.");
    }
  });
  CacheService.getScriptCache().remove("liste");
  Logger.log("Fertig.");
}

// --- 2. HILFSFUNKTIONEN ---

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Macht aus Freitext einen sicheren Zellinhalt:
// Zeilenumbrüche weg, Länge begrenzt, keine Formeln (=, +, -, @ am Anfang)
function bereinigeText_(text, maxLaenge) {
  var t = String(text == null ? "" : text).replace(/[\r\n\t]+/g, " ").trim();
  if (t.length > maxLaenge) t = t.substring(0, maxLaenge);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
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

// Sterne aus dem Sheet: Zahl über 0 bis 10, sonst leer (auch Kommazahlen)
function sternAusSheet_(v) {
  var n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return (String(v).trim() !== "" && isFinite(n) && n > 0 && n <= 10) ? n : null;
}

// Sterne aus der App: 1 bis 10, ganze oder halbe Zahlen
function sternGueltig_(v) {
  var n = Number(v);
  return n >= 1 && n <= 10 && Math.round(n * 2) === n * 2;
}

function runde_(n) {
  return Math.round(n * 10) / 10;
}

// --- 3. EINSTIEGSPUNKTE ---

function doGet() {
  return jsonOut_({ status: "Döner API" });
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ error: "anfrage", message: "Ungültige Anfrage" });
  }

  try {
    if (data.action === "ping") return jsonOut_({ ok: true });
    if (data.action === "liste") return jsonOut_(liste_());

    if (data.action === "bewerten") {
      var lock = LockService.getScriptLock();
      if (!lock.tryLock(20000)) {
        return jsonOut_({ error: "ausgelastet", message: "Gerade ist viel los. Bitte gleich nochmal versuchen." });
      }
      try {
        return jsonOut_(bewerten_(data));
      } finally {
        lock.releaseLock();
      }
    }

    return jsonOut_({ error: "aktion", message: "Unbekannte Aktion" });
  } catch (err) {
    return jsonOut_({ error: "server", message: String(err.message || err) });
  }
}

// --- 4. LISTE (ohne id, ohne gelöschte) ---

function liste_() {
  var cache = CacheService.getScriptCache();
  var gemerkt = cache.get("liste");
  if (gemerkt) return JSON.parse(gemerkt);

  var zone = Session.getScriptTimeZone();

  // Kriterien-Begründungen je Bewertung
  var detailsJe = {};
  var ds = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BLATT_DETAILS_);
  if (ds) {
    var dsp = spalten_(ds);
    zeilen_(ds).forEach(function (z) {
      var bid = String(zelle_(z, dsp, "bewertung_id"));
      var wert = sternAusSheet_(zelle_(z, dsp, "wert"));
      if (!bid || wert == null) return;
      (detailsJe[bid] = detailsJe[bid] || []).push({
        teil: String(zelle_(z, dsp, "teil")),
        name: String(zelle_(z, dsp, "kriterium")),
        wert: wert,
        begruendung: String(zelle_(z, dsp, "begruendung"))
      });
    });
  }

  var bew = blatt_(BLATT_BEW_);
  var sp = spalten_(bew);
  var bewertungen = [];
  zeilen_(bew).forEach(function (z) {
    var laden = String(zelle_(z, sp, "laden")).trim();
    if (!laden) return;
    if (istWahr_(zelle_(z, sp, "geloescht"))) return;
    var b = { laden: laden, begruendung: String(zelle_(z, sp, "begruendung")), datum: "" };
    TEILE_.forEach(function (t) { b[t] = sternAusSheet_(zelle_(z, sp, t)); });
    b.laden_note = sternAusSheet_(zelle_(z, sp, "ladennote"));
    if (b.doener == null && b.yufka == null && b.pommes == null && b.laden_note == null) return;
    var d = zelle_(z, sp, "erstellt_am");
    if (d instanceof Date && !isNaN(d)) b.datum = Utilities.formatDate(d, zone, "yyyy-MM-dd");
    var bid = String(zelle_(z, sp, "id"));
    b.kriterien = (bid && detailsJe[bid]) || [];
    bewertungen.push(b);
  });

  var ergebnis = { laeden: laedenNamen_(), kriterien: kriterien_(), bewertungen: bewertungen };
  var text = JSON.stringify(ergebnis);
  if (text.length < 90000) cache.put("liste", text, LISTE_SEKUNDEN_);
  return ergebnis;
}

function laedenNamen_() {
  var sheet = blatt_(BLATT_LAEDEN_);
  var sp = spalten_(sheet);
  return zeilen_(sheet)
    .map(function (z) { return String(zelle_(z, sp, "name")).trim(); })
    .filter(function (n) { return n; });
}

// Kriterien je Teil aus dem Blatt „kriterien“; fehlt es, gibt es keine ausführliche Bewertung
function kriterien_() {
  var k = { doener: [], yufka: [], pommes: [], laden: [] };
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BLATT_KRIT_);
  if (!sheet) return k;
  var sp = spalten_(sheet);
  zeilen_(sheet).forEach(function (z) {
    var teil = String(zelle_(z, sp, "teil")).trim().toLowerCase();
    var name = String(zelle_(z, sp, "name")).trim();
    if (k[teil] && name && k[teil].indexOf(name) === -1) k[teil].push(name);
  });
  return k;
}

// --- 5. BEWERTEN ---

function bewerten_(data) {
  // Lockfeld: Menschen sehen es nicht und lassen es leer. Bots füllen es aus.
  if (data.web) return { ok: true };

  var cache = CacheService.getScriptCache();
  var stunde = "anzahl_" + Math.floor(Date.now() / 3600000);
  var anzahl = Number(cache.get(stunde) || 0);
  if (anzahl >= MAX_PRO_STUNDE_) {
    return { error: "zu_viele", message: "Gerade kamen sehr viele Bewertungen. Bitte in einer Stunde nochmal versuchen." };
  }

  var ladenText = String(data.laden == null ? "" : data.laden).replace(/\s+/g, " ").trim();
  if (!ladenText) return { error: "eingabe", message: "Bitte einen Laden angeben." };
  if (ladenText.length > MAX_LADEN_) return { error: "eingabe", message: "Der Name des Ladens ist zu lang (höchstens " + MAX_LADEN_ + " Zeichen)." };

  // Schnelle Werte je Teil
  var werte = { doener: "", yufka: "", pommes: "", laden: "" };
  for (var i = 0; i < TEILE_.length; i++) {
    var v = data[TEILE_[i]];
    if (v === null || v === undefined || v === "") continue;
    if (!sternGueltig_(v)) return { error: "eingabe", message: "Sterne bitte von 1 bis 10." };
    werte[TEILE_[i]] = Number(v);
  }

  // Ausführliche Werte je Kriterium: ersetzen den schnellen Wert des Teils durch ihren Durchschnitt
  var details = [];
  if (data.details != null) {
    if (!Array.isArray(data.details) || data.details.length > MAX_DETAILS_) {
      return { error: "eingabe", message: "Ungültige Kriterien." };
    }
    var erlaubt = kriterien_();
    var gesehen = {};
    for (var j = 0; j < data.details.length; j++) {
      var d = data.details[j] || {};
      var teil = String(d.teil || "");
      var name = String(d.kriterium || "");
      if (!erlaubt[teil] || erlaubt[teil].indexOf(name) === -1) {
        return { error: "eingabe", message: "Unbekanntes Kriterium: " + bereinigeText_(name, 40) };
      }
      if (gesehen[teil + "|" + name]) continue;
      gesehen[teil + "|" + name] = true;
      if (d.wert === null || d.wert === undefined || d.wert === "") continue;
      if (!sternGueltig_(d.wert)) return { error: "eingabe", message: "Sterne bitte von 1 bis 10." };
      var kb = String(d.begruendung == null ? "" : d.begruendung);
      if (kb.length > MAX_KRIT_BEGR_) return { error: "eingabe", message: "Eine Begründung ist zu lang (höchstens " + MAX_KRIT_BEGR_ + " Zeichen)." };
      details.push({ teil: teil, kriterium: name, wert: Number(d.wert), begruendung: bereinigeText_(kb, MAX_KRIT_BEGR_) });
    }
    ALLE_TEILE_.forEach(function (t) {
      var w = details.filter(function (x) { return x.teil === t; }).map(function (x) { return x.wert; });
      if (w.length) werte[t] = runde_(w.reduce(function (a, b) { return a + b; }, 0) / w.length);
    });
  }

  if (werte.doener === "" && werte.yufka === "" && werte.pommes === "") {
    return { error: "eingabe", message: "Bitte mindestens Döner, Yufka oder Pommes bewerten." };
  }

  var begruendung = String(data.begruendung == null ? "" : data.begruendung);
  if (begruendung.length > MAX_BEGRUENDUNG_) {
    return { error: "eingabe", message: "Die Begründung ist zu lang (höchstens " + MAX_BEGRUENDUNG_ + " Zeichen)." };
  }

  // Laden: gleicher Name (ohne Groß- und Kleinschreibung) = derselbe Laden
  var laeden = laedenNamen_();
  var gleich = laeden.filter(function (n) { return n.toLowerCase() === ladenText.toLowerCase(); })[0];
  var laden = bereinigeText_(gleich || ladenText, MAX_LADEN_);
  if (!gleich) {
    var ls = blatt_(BLATT_LAEDEN_);
    var lsp = spalten_(ls);
    var lzeile = new Array(Math.max(ls.getLastColumn(), 1)).fill("");
    lzeile[lsp.name != null ? lsp.name : 0] = laden;
    ls.appendRow(lzeile);
  }

  var bew = blatt_(BLATT_BEW_);
  var sp = spalten_(bew);
  var id = Utilities.getUuid();
  var zeilenWerte = {
    id: id,
    erstellt_am: new Date(),
    laden: laden,
    doener: werte.doener,
    yufka: werte.yufka,
    pommes: werte.pommes,
    ladennote: werte.laden,
    begruendung: bereinigeText_(begruendung, MAX_BEGRUENDUNG_),
    geloescht: false
  };
  var zeile = new Array(bew.getLastColumn()).fill("");
  Object.keys(zeilenWerte).forEach(function (k) { if (sp[k] != null) zeile[sp[k]] = zeilenWerte[k]; });
  bew.appendRow(zeile);

  if (details.length) {
    var ds = blatt_(BLATT_DETAILS_);
    var dsp = spalten_(ds);
    var breite = ds.getLastColumn();
    var neu = details.map(function (x) {
      var z = new Array(breite).fill("");
      var w = { bewertung_id: id, teil: x.teil, kriterium: bereinigeText_(x.kriterium, 60), wert: x.wert, begruendung: x.begruendung };
      Object.keys(w).forEach(function (k) { if (dsp[k] != null) z[dsp[k]] = w[k]; });
      return z;
    });
    ds.getRange(ds.getLastRow() + 1, 1, neu.length, breite).setValues(neu);
  }

  cache.put(stunde, String(anzahl + 1), 3700);
  cache.remove("liste");
  return { ok: true };
}
