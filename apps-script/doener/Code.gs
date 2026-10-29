// =====================================================
// DÖNER LANDAU – Apps Script (öffentlich, ohne Passwort)
// Jede Person mit dem Link darf Bewertungen lesen und neue anlegen.
// Ändern und Löschen nur im Sheet. Dieses Skript kennt keine anderen Daten.
// =====================================================

var BLATT_BEW_ = "bewertungen";
var BLATT_LAEDEN_ = "laeden";
var KOPF_BEW_ = ["id", "erstellt_am", "laden", "doener", "yufka", "pommes", "begruendung", "geloescht"];
var KOPF_LAEDEN_ = ["name"];
var TEILE_ = ["doener", "yufka", "pommes"];
var MAX_LADEN_ = 60;          // Höchstlänge Name des Ladens
var MAX_BEGRUENDUNG_ = 300;   // Höchstlänge Begründung
var MAX_PRO_STUNDE_ = 30;     // Höchstzahl neuer Bewertungen pro Stunde, für alle zusammen
var LISTE_SEKUNDEN_ = 60;     // So lange wird die Liste zwischengespeichert

// --- 1. EINRICHTEN (einmal im Editor ausführen) ---

// Legt die Blätter mit Kopfzeile an. Bestehende Blätter mit Inhalt bleiben unverändert.
function einrichten() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [[BLATT_BEW_, KOPF_BEW_], [BLATT_LAEDEN_, KOPF_LAEDEN_]].forEach(function (b) {
    var sheet = ss.getSheetByName(b[0]) || ss.insertSheet(b[0]);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, b[1].length).setValues([b[1]]).setFontWeight("bold");
      sheet.setFrozenRows(1);
      Logger.log("Blatt '" + b[0] + "' angelegt.");
    } else {
      Logger.log("Blatt '" + b[0] + "' gibt es schon, bleibt unverändert.");
    }
  });
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

function istWahr_(v) {
  return v === true || /^(true|wahr|ja|x)$/i.test(String(v).trim());
}

// Sterne aus dem Sheet: Zahl über 0 bis 10, sonst leer (auch Kommazahlen der Startwerte)
function sternAusSheet_(v) {
  var n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return (String(v).trim() !== "" && isFinite(n) && n > 0 && n <= 10) ? n : null;
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

  var bew = blatt_(BLATT_BEW_);
  var sp = spalten_(bew);
  var zeilen = bew.getLastRow() > 1 ? bew.getRange(2, 1, bew.getLastRow() - 1, bew.getLastColumn()).getValues() : [];
  var zone = Session.getScriptTimeZone();

  var bewertungen = [];
  zeilen.forEach(function (z) {
    var laden = String(z[sp.laden] == null ? "" : z[sp.laden]).trim();
    if (!laden) return;
    if (sp.geloescht != null && istWahr_(z[sp.geloescht])) return;
    var b = { laden: laden, begruendung: sp.begruendung != null ? String(z[sp.begruendung] || "") : "", datum: "" };
    TEILE_.forEach(function (t) { b[t] = sp[t] != null ? sternAusSheet_(z[sp[t]]) : null; });
    if (b.doener == null && b.yufka == null && b.pommes == null) return;
    var d = sp.erstellt_am != null ? z[sp.erstellt_am] : "";
    if (d instanceof Date && !isNaN(d)) b.datum = Utilities.formatDate(d, zone, "yyyy-MM-dd");
    bewertungen.push(b);
  });

  var ergebnis = { laeden: laedenNamen_(), bewertungen: bewertungen };
  var text = JSON.stringify(ergebnis);
  if (text.length < 90000) cache.put("liste", text, LISTE_SEKUNDEN_);
  return ergebnis;
}

function laedenNamen_() {
  var sheet = blatt_(BLATT_LAEDEN_);
  if (sheet.getLastRow() < 2) return [];
  var sp = spalten_(sheet);
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
    .map(function (z) { return String(z[sp.name] == null ? "" : z[sp.name]).trim(); })
    .filter(function (n) { return n; });
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

  var sterne = {};
  for (var i = 0; i < TEILE_.length; i++) {
    var t = TEILE_[i];
    var v = data[t];
    if (v === null || v === undefined || v === "") { sterne[t] = ""; continue; }
    var n = Number(v);
    if (!(n >= 1 && n <= 10 && Math.floor(n) === n)) {
      return { error: "eingabe", message: "Sterne bitte als ganze Zahl von 1 bis 10." };
    }
    sterne[t] = n;
  }
  if (sterne.doener === "" && sterne.yufka === "" && sterne.pommes === "") {
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
  var werte = {
    id: Utilities.getUuid(),
    erstellt_am: new Date(),
    laden: laden,
    doener: sterne.doener,
    yufka: sterne.yufka,
    pommes: sterne.pommes,
    begruendung: bereinigeText_(begruendung, MAX_BEGRUENDUNG_),
    geloescht: false
  };
  var zeile = new Array(bew.getLastColumn()).fill("");
  Object.keys(werte).forEach(function (k) { if (sp[k] != null) zeile[sp[k]] = werte[k]; });
  bew.appendRow(zeile);

  cache.put(stunde, String(anzahl + 1), 3700);
  cache.remove("liste");
  return { ok: true };
}
