// =====================================================
// Karte – Apps Script für die Visitenkarte (Etappe 10)
// Eigenes Sheet „Visitenkarte“, getrennt von allen anderen Daten (docs/STAND.md 2.2).
// Blätter: „angaben“ (eine Angabe je Zeile, die Person pflegt sie im Sheet) und „links“ (je Karte ein Schlüssel).
// Drei Karten: privat, arbeit, aktivismus. Ein Link zeigt genau eine Karte.
// Mit Passwort (KARTE_PIN, NICHT APP_PIN) darf die Person alles lesen und Links erstellen.
// Ohne Passwort gibt es nur „karte“, „kontakt“ und „bild“, immer nur mit dem Schlüssel einer Karte.
// Das Skript schreibt nie Angaben, nur Schlüssel und fehlende Kennungen.
// Passwort steht NICHT hier, sondern in den Skripteigenschaften (KARTE_PIN).
// Siehe docs/STAND.md 4 „Visitenkarte“.
// =====================================================

var KOEPFE_ = {
  angaben: ["id", "art", "titel", "wert", "link", "bild", "karten", "reihenfolge", "erstellt_am", "geaendert_am", "geloescht"],
  links: ["id", "karte", "schluessel", "erstellt_am", "geaendert_am"]
};
// Diese Spalten bleiben im Sheet reiner Text (zum Beispiel bleibt die führende 0 einer Telefonnummer)
var TEXT_SPALTEN_ = {
  angaben: ["id", "art", "titel", "wert", "link", "bild", "karten"],
  links: ["id", "karte", "schluessel"]
};
var KARTEN_ = ["privat", "arbeit", "aktivismus"];
var ARTEN_ = ["name", "status", "email", "telefon", "social", "veroeffentlichung", "text"];
var VERDECKT_ = ["email", "telefon"];            // kommen erst mit „kontakt“ heraus
var MAX_ = { titel: 60, wert: 200, link: 300 };
var MAX_ANGABEN_ = 100;
var MAX_ABRUFE_ = { karte: 300, kontakt: 60, bild: 300 };   // je Stunde, für alle zusammen
var MAX_FALSCHE_ = 20;                            // falsche Schlüssel in 15 Minuten
var MAX_BILD_SENDEN_ = 1500000;

// --- 1. EINRICHTEN (im Editor ausführen, auch nach einem Update) ---

// Legt die Blätter an, ergänzt fehlende Spalten am Ende, je Karte eine Zeile in „links“
// und fehlende Kennungen in „angaben“. Vorhandene Daten bleiben unverändert.
function einrichten() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(KOEPFE_).forEach(function (name) {
    var kopf = KOEPFE_[name];
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
    TEXT_SPALTEN_[name].forEach(function (k) {
      sheet.getRange(2, karte[k] + 1, sheet.getMaxRows() - 1, 1).setNumberFormat("@");
    });
  });

  var links = blatt_("links"), ls = spalten_(links);
  var da = {};
  zeilen_(links).forEach(function (z) { da[String(z[ls.karte]).trim()] = true; });
  KARTEN_.forEach(function (k) {
    if (da[k]) return;
    var zeile = leereZeile_(links);
    var t = new Date();
    zeile[ls.id] = Utilities.getUuid(); zeile[ls.karte] = k; zeile[ls.schluessel] = "";
    zeile[ls.erstellt_am] = t; zeile[ls.geaendert_am] = t;
    links.appendRow(zeile);
    Logger.log("Karte '" + k + "' in 'links' angelegt (noch ohne Link).");
  });

  var n = kennungenErgaenzen_();
  if (n) Logger.log(n + " Angaben haben eine Kennung bekommen.");

  // Prüft einmal den Zugriff auf Drive (beim ersten Mal fragt Google nach der Erlaubnis)
  Logger.log("Drive verbunden: " + DriveApp.getRootFolder().getName());
  var pin = PropertiesService.getScriptProperties().getProperty("KARTE_PIN");
  Logger.log(pin && pin.length >= 12 ? "KARTE_PIN ist eingetragen." : "Bitte noch KARTE_PIN (mindestens 12 Zeichen) in den Skripteigenschaften eintragen.");
  Logger.log("Fertig.");
}

// --- 2. HILFSFUNKTIONEN ---

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Prüft das Passwort KARTE_PIN und sperrt nach 5 Fehlversuchen für 15 Minuten.
// Eigenes Passwort: Die Adresse dieses Skripts steht in jedem Link, hier darf nie APP_PIN zu erraten sein.
function pruefePin_(pin) {
  var soll = PropertiesService.getScriptProperties().getProperty("KARTE_PIN");
  if (!soll || soll.length < 12) return "fehlt";
  var cache = CacheService.getScriptCache();
  var fehler = Number(cache.get("pin_fehler") || 0);
  if (fehler >= 5) return "gesperrt";
  if (String(pin) !== soll) {
    cache.put("pin_fehler", String(fehler + 1), 900);
    return "falsch";
  }
  cache.remove("pin_fehler");
  return "ok";
}

// Gegenstück zum Formel-Schutz im Sheet: Das Hochkomma vor =, +, -, @ zeigt die App nicht
function ohneSchutz_(v) {
  var t = String(v == null ? "" : v);
  return /^'[=+\-@]/.test(t) ? t.substring(1) : t;
}

// Einzeiliger Text, gekürzt
function kurz_(v, max) {
  var t = ohneSchutz_(v).replace(/\s+/g, " ").trim();
  return t.length > max ? t.substring(0, max) : t;
}

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
  var sp = spalten_(sheet);
  var fehlen = KOEPFE_[name].filter(function (k) { return sp[k] == null; });
  if (fehlen.length) throw new Error("Im Blatt '" + name + "' fehlen Spalten: " + fehlen.join(", ") + ". Bitte 'einrichten' ausführen.");
  return sheet;
}

function zeilen_(sheet) {
  return sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues() : [];
}

function leereZeile_(sheet) {
  var z = [];
  for (var i = 0; i < sheet.getLastColumn(); i++) z.push("");
  return z;
}

function istWahr_(v) {
  return v === true || /^(true|wahr|ja|x)$/i.test(String(v).trim());
}

// Kennung einer Drive-Datei aus einem Link oder der Kennung selbst
function driveKennung_(text) {
  var t = String(text == null ? "" : text).trim();
  var m = /\/d\/([A-Za-z0-9_-]{20,})/.exec(t) || /[?&]id=([A-Za-z0-9_-]{20,})/.exec(t) || /^([A-Za-z0-9_-]{20,})$/.exec(t);
  return m ? m[1] : "";
}

// Zählt Abrufe je Stunde für alle zusammen. Ohne Lock: Bei gleichzeitigen Abrufen zählt es
// höchstens etwas zu wenig, das reicht als Schutz des Google-Kontingents.
function nochErlaubt_(art) {
  var cache = CacheService.getScriptCache();
  var name = "abrufe_" + art + "_" + Math.floor(Date.now() / 3600000);
  var n = Number(cache.get(name) || 0);
  if (n >= MAX_ABRUFE_[art]) return false;
  cache.put(name, String(n + 1), 3600);
  return true;
}

// --- 3. ANGABEN LESEN UND PRÜFEN ---

// Spalte „karten“: Kommas, Leerzeichen und Groß- und Kleinschreibung egal, unbekannte Namen zählen nicht.
// Leer = auf keiner Karte (Fund 2 der Prüfung).
function kartenListe_(v) {
  var aus = [];
  String(v == null ? "" : v).toLowerCase().split(/[,;\s]+/).forEach(function (k) {
    if (KARTEN_.indexOf(k) >= 0 && aus.indexOf(k) < 0) aus.push(k);
  });
  return aus;
}

// Nur einfache Formen, damit kein Mail-Link weitere Empfänger oder Inhalte mitbringt (Fund 3 der Prüfung)
function emailOk_(t) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(t) && t.length <= 120;
}
function telefonOk_(t) {
  return /^\+?[0-9][0-9 \/-]{3,30}$/.test(t);
}
function linkOk_(t) {
  return /^https:\/\/[^\s"<>]+$/.test(t) && t.length <= MAX_.link;
}

// Eine Zeile als Angabe mit Prüfergebnis. fehler = Grund, warum die Angabe nie öffentlich erscheint.
function angabeAus_(z, sp, nr) {
  var a = {
    id: String(z[sp.id] == null ? "" : z[sp.id]).trim(),
    zeile: nr,
    art: String(z[sp.art] == null ? "" : z[sp.art]).trim().toLowerCase(),
    titel: kurz_(z[sp.titel], MAX_.titel),
    wert: kurz_(z[sp.wert], MAX_.wert),
    link: String(z[sp.link] == null ? "" : z[sp.link]).trim(),
    bild: driveKennung_(z[sp.bild]),
    karten: kartenListe_(z[sp.karten]),
    reihenfolge: Number(z[sp.reihenfolge]) || 0,
    fehler: ""
  };
  if (ARTEN_.indexOf(a.art) < 0) a.fehler = "Art unbekannt";
  else if (a.art === "email" && !emailOk_(a.wert)) a.fehler = "Form passt nicht";
  else if (a.art === "telefon" && !telefonOk_(a.wert)) a.fehler = "Form passt nicht";
  else if (a.link && !linkOk_(a.link)) a.fehler = "Link muss mit https:// beginnen";
  else if ((a.art === "social" || a.art === "veroeffentlichung") && !a.link) a.fehler = "Link fehlt";
  else if (!a.wert && !a.titel) a.fehler = "Leer";
  else if (!a.karten.length) a.fehler = "Auf keiner Karte";
  if (a.art !== "veroeffentlichung") a.bild = "";
  if (a.art === "email" || a.art === "telefon") a.link = "";
  return a;
}

// Alle nicht gelöschten Angaben (höchstens MAX_ANGABEN_), sortiert nach Reihenfolge, sonst wie im Sheet
function alleAngaben_() {
  var sheet = blatt_("angaben"), sp = spalten_(sheet);
  var aus = [];
  zeilen_(sheet).forEach(function (z, i) {
    if (aus.length >= MAX_ANGABEN_) return;
    if (istWahr_(z[sp.geloescht])) return;
    if (!String(z[sp.art]).trim() && !String(z[sp.wert]).trim() && !String(z[sp.titel]).trim()) return;
    aus.push(angabeAus_(z, sp, i + 2));
  });
  aus.sort(function (a, b) { return a.reihenfolge - b.reihenfolge || a.zeile - b.zeile; });
  return aus;
}

// Angaben, die öffentlich auf dieser Karte stehen dürfen
function angabenDerKarte_(karte) {
  return alleAngaben_().filter(function (a) { return !a.fehler && a.karten.indexOf(karte) >= 0; });
}

// Von Hand eingetragene Zeilen haben noch keine Kennung. Braucht sie für Vorschaubilder.
function kennungenErgaenzen_() {
  var sheet = blatt_("angaben"), sp = spalten_(sheet);
  var alle = zeilen_(sheet), n = 0;
  alle.forEach(function (z, i) {
    var belegt = String(z[sp.art]).trim() || String(z[sp.wert]).trim() || String(z[sp.titel]).trim();
    if (!belegt || String(z[sp.id]).trim()) return;
    var t = new Date();
    sheet.getRange(i + 2, sp.id + 1).setValue(Utilities.getUuid());
    if (!z[sp.erstellt_am]) sheet.getRange(i + 2, sp.erstellt_am + 1).setValue(t);
    n++;
  });
  return n;
}

// --- 4. SCHLÜSSEL ---

function linkZeilen_() {
  var sheet = blatt_("links"), sp = spalten_(sheet);
  return { sheet: sheet, sp: sp, zeilen: zeilen_(sheet) };
}

// Welche Karte öffnet dieser Schlüssel? Ein gültiger Schlüssel geht immer durch (Fund 1 der Prüfung):
// Fremde können mit falschen Schlüsseln keine Karte sperren. Nach MAX_FALSCHE_ falschen in 15 Minuten
// bekommen weitere falsche nur die Meldung „gesperrt“. Raten ist bei 64 Zeichen ohnehin aussichtslos.
function karteFuer_(schluessel) {
  var s = String(schluessel == null ? "" : schluessel);
  if (/^[a-f0-9]{64}$/.test(s)) {
    var l = linkZeilen_();
    for (var i = 0; i < l.zeilen.length; i++) {
      var k = String(l.zeilen[i][l.sp.karte]).trim();
      if (KARTEN_.indexOf(k) >= 0 && String(l.zeilen[i][l.sp.schluessel]).trim() === s) return { karte: k };
    }
  }
  var cache = CacheService.getScriptCache();
  var fehler = Number(cache.get("link_fehler") || 0);
  cache.put("link_fehler", String(fehler + 1), 900);
  if (fehler >= MAX_FALSCHE_) return { error: "gesperrt", message: "Zu viele falsche Links. Bitte in 15 Minuten erneut versuchen." };
  return { error: "link", message: "Dieser Link gilt nicht (mehr). Bitte nach einem neuen fragen." };
}

// --- 5. OHNE PASSWORT ---

function karte_(data) {
  var k = karteFuer_(data.schluessel);
  if (k.error) return k;
  if (!nochErlaubt_("karte")) return zuViele_();
  return {
    karte: k.karte,
    angaben: angabenDerKarte_(k.karte).map(function (a) {
      var verdeckt = VERDECKT_.indexOf(a.art) >= 0;
      return { id: a.id, art: a.art, titel: a.titel, wert: verdeckt ? "" : a.wert, link: a.link, bild: Boolean(a.bild && a.id), verdeckt: verdeckt };
    })
  };
}

// E-Mail und Telefon dieser Karte (für „zeigen“ und „Kontakt speichern“)
function kontakt_(data) {
  var k = karteFuer_(data.schluessel);
  if (k.error) return k;
  if (!nochErlaubt_("kontakt")) return zuViele_();
  return {
    karte: k.karte,
    kontakt: angabenDerKarte_(k.karte).filter(function (a) { return VERDECKT_.indexOf(a.art) >= 0; })
      .map(function (a) { return { id: a.id, art: a.art, titel: a.titel, wert: a.wert }; })
  };
}

// Vorschaubild einer Angabe dieser Karte. Der Besucher schickt nur die Kennung der Angabe, nie eine Drive-Kennung.
function bildOeffentlich_(data) {
  var k = karteFuer_(data.schluessel);
  if (k.error) return k;
  if (!nochErlaubt_("bild")) return zuViele_();
  var id = String(data.id == null ? "" : data.id);
  var a = id ? angabenDerKarte_(k.karte).filter(function (x) { return x.id === id && x.bild; })[0] : null;
  if (!a) return { error: "eingabe", message: "Unbekanntes Bild." };
  return bildDaten_(a.bild);
}

function zuViele_() {
  return { error: "viele", message: "Gerade zu viele Abrufe. Bitte später nochmal versuchen." };
}

// Immer ein kleines Vorschaubild aus Drive; nur bei kleinen Bildern ohne Vorschau die Datei selbst. Nur Bilddateien.
function bildDaten_(driveId) {
  var blob;
  try {
    var f = DriveApp.getFileById(driveId);
    if (!/^image\//.test(f.getMimeType())) return { error: "eingabe", message: "Die Datei ist kein Bild." };
    blob = f.getThumbnail();
    if (!blob && f.getSize() <= MAX_BILD_SENDEN_) blob = f.getBlob();
  } catch (e) {
    return { error: "fehlt", message: "Das Bild ist nicht mehr da." };
  }
  if (!blob) return { error: "gross", message: "Für dieses Bild gibt es keine Vorschau." };
  return { typ: blob.getContentType(), daten: Utilities.base64Encode(blob.getBytes()) };
}

// --- 6. MIT PASSWORT ---

// Alles für die Vorschau der Person, mit Prüfergebnis je Angabe und welche Karten einen Link haben (ohne Schlüssel)
function angaben_() {
  var lock = LockService.getScriptLock();
  if (lock.tryLock(20000)) {
    try { if (kennungenErgaenzen_()) SpreadsheetApp.flush(); } finally { lock.releaseLock(); }
  }
  var l = linkZeilen_();
  var geteilt = {};
  KARTEN_.forEach(function (k) { geteilt[k] = false; });
  l.zeilen.forEach(function (z) {
    var k = String(z[l.sp.karte]).trim();
    if (KARTEN_.indexOf(k) >= 0 && String(z[l.sp.schluessel]).trim()) geteilt[k] = true;
  });
  return {
    karten: KARTEN_,
    geteilt: geteilt,
    angaben: alleAngaben_().map(function (a) {
      return { id: a.id, zeile: a.zeile, art: a.art, titel: a.titel, wert: a.wert, link: a.link, bild: Boolean(a.bild && a.id), karten: a.karten, fehler: a.fehler };
    })
  };
}

// Neuer Schlüssel für eine Karte (alter Link gilt sofort nicht mehr) oder Karte nicht mehr teilen
function linkSetzen_(data, neu) {
  var karte = String(data.karte == null ? "" : data.karte);
  if (KARTEN_.indexOf(karte) < 0) return { error: "eingabe", message: "Welche Karte?" };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: "ausgelastet", message: "Script ausgelastet. Bitte gleich nochmal versuchen." };
  try {
    var l = linkZeilen_();
    var nr = -1;
    for (var i = 0; i < l.zeilen.length; i++) if (String(l.zeilen[i][l.sp.karte]).trim() === karte) { nr = i + 2; break; }
    if (nr < 0) return { error: "eingabe", message: "Die Karte fehlt im Blatt 'links'. Bitte 'einrichten' ausführen." };
    var schluessel = neu ? (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "").toLowerCase() : "";
    l.sheet.getRange(nr, l.sp.schluessel + 1).setValue(schluessel);
    l.sheet.getRange(nr, l.sp.geaendert_am + 1).setValue(new Date());
    SpreadsheetApp.flush();
    return { karte: karte, schluessel: schluessel };
  } finally {
    lock.releaseLock();
  }
}

// Vorschaubild für die Vorschau der Person (jede Angabe mit Bild)
function bildPerson_(data) {
  var id = String(data.id == null ? "" : data.id);
  var a = id ? alleAngaben_().filter(function (x) { return x.id === id && x.bild; })[0] : null;
  if (!a) return { error: "eingabe", message: "Unbekanntes Bild." };
  return bildDaten_(a.bild);
}

// --- 7. EINSTIEGSPUNKTE ---

function doGet() {
  return jsonOut_({ status: "Karte API" });
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ error: "anfrage", message: "Ungültige Anfrage" });
  }
  if (!data || typeof data !== "object") return jsonOut_({ error: "anfrage", message: "Ungültige Anfrage" });

  // Ohne Passwort: nur mit dem Schlüssel einer Karte, nur lesen
  var oeffentlich = { karte: karte_, kontakt: kontakt_, bild_karte: bildOeffentlich_ };
  if (oeffentlich[data.action]) {
    try { return jsonOut_(oeffentlich[data.action](data)); } catch (err) {
      // Keine internen Fehlertexte nach außen, den genauen Text ins Protokoll
      console.error(err);
      return jsonOut_({ error: "server", message: "Fehler im Skript. Bitte später nochmal versuchen." });
    }
  }

  var status = pruefePin_(data.pin);
  if (status === "fehlt") {
    return jsonOut_({ error: "einrichtung", message: "Im Skript fehlt KARTE_PIN (mindestens 12 Zeichen) in den Skripteigenschaften." });
  }
  if (status === "gesperrt") {
    return jsonOut_({ error: "gesperrt", message: "Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen." });
  }
  if (status !== "ok") {
    return jsonOut_({ error: "pin", message: "Passwort Visitenkarte falsch" });
  }

  try {
    if (data.action === "ping") return jsonOut_({ ok: true });
    if (data.action === "angaben") return jsonOut_(angaben_());
    if (data.action === "link") return jsonOut_(linkSetzen_(data, true));
    if (data.action === "link_weg") return jsonOut_(linkSetzen_(data, false));
    if (data.action === "bild") return jsonOut_(bildPerson_(data));
    return jsonOut_({ error: "aktion", message: "Unbekannte Aktion" });
  } catch (err) {
    return jsonOut_({ error: "server", message: String(err) });
  }
}
