// =====================================================
// DSA – Apps Script für den Reiter „Pen & Paper“ (DSA und DnD)
// Eigenes Sheet „DSA“, getrennt von allen anderen Daten (docs/STAND.md 2.2).
// Blätter: „boegen“ (ein Bogen je Zeile), „eintraege“ (eine Zeile je Vorteil, Talent, Zauber, Waffe, Gegenstand),
// „verlauf“ (jede Änderung an Geld, LeP, AsP, AP).
// Ab 0.6.8: „abenteuer“ (Abenteuer eines Charakters, Abenteuer als DM, Abenteuerideen) und „sessions“ (je Abenteuer eines Charakters).
// Mit Passwort (APP_PIN) darf die Person alles. Ohne Passwort gibt es nur die Aktion „geteilt“:
// genau ein Bogen mit seinem Freigabe-Schlüssel, nur lesen, ohne Verlauf.
// Bilder liegen im privaten Drive-Ordner „Thetadex DSA“, im Sheet steht nur ihre Kennung.
// Passwort steht NICHT hier, sondern in den Skripteigenschaften (APP_PIN).
// Siehe docs/STAND.md 4 „Pen & Paper, Sheet ‚DSA‘“.
// =====================================================

var STANDARD_ = ["id", "erstellt_am", "geaendert_am", "geloescht"];
var KOEPFE_ = {
  boegen: ["id", "name", "regelwerk", "kopf", "eigenschaften", "zaehler", "bild", "freigabe", "notiz", "erstellt_am", "geaendert_am", "geloescht"],
  eintraege: ["id", "bogen_id", "abschnitt", "gruppe", "name", "wert", "probe", "felder", "text", "reihenfolge", "erstellt_am", "geaendert_am", "geloescht"],
  verlauf: ["id", "bogen_id", "zaehler", "aenderung", "notiz", "datum", "erstellt_am", "geaendert_am", "geloescht"],
  abenteuer: ["id", "bogen_id", "art", "titel", "text", "abgeschlossen", "bilder", "erstellt_am", "geaendert_am", "geloescht"],
  sessions: ["id", "abenteuer_id", "datum", "text", "erstellt_am", "geaendert_am", "geloescht"]
};
// Diese Spalten bleiben im Sheet reiner Text (kein Datum, keine Zahl)
var TEXT_SPALTEN_ = {
  boegen: ["id", "name", "regelwerk", "kopf", "eigenschaften", "zaehler", "bild", "freigabe", "notiz"],
  eintraege: ["id", "bogen_id", "abschnitt", "gruppe", "name", "wert", "probe", "felder", "text"],
  verlauf: ["id", "bogen_id", "zaehler", "notiz", "datum"],
  abenteuer: ["id", "bogen_id", "art", "titel", "text", "bilder"],
  sessions: ["id", "abenteuer_id", "datum", "text"]
};
// Arten im Blatt „abenteuer“: spieler = Abenteuer eines Charakters (mit Sessions), dm = Abenteuer, das die Person leitet,
// ideen = das eine Textfeld „Abenteuerideen“. dm und ideen gehen nie über den geteilten Link hinaus.
var ABENTEUER_ARTEN_ = ["spieler", "dm", "ideen"];
var MAX_ATEXT_ = 10000;

var REGELWERKE_ = ["dsa", "dnd"];
var KOPF_FELDER_ = ["rasse", "kultur", "profession", "geschlecht", "alter", "groesse", "gewicht", "haare", "augen",
  "stand", "titel", "sozialstatus", "herkunft", "gp_basis"];
var ABSCHNITTE_ = ["vorteil", "nachteil", "sonderfertigkeit", "gabe", "talent", "zauber", "waffe", "besitz"];
// Weitere Felder je Abschnitt (Spalte „felder“, JSON). mods = Liste von Texten (Modifikationen), haus = ja/nein
var FELDER_ = {
  zauber: ["kosten", "zauberdauer", "wirkungsdauer", "reichweite", "technik", "merkmale", "haus", "mods"],
  waffe: ["art", "ini", "at", "pa", "tp", "be", "reichweite"],
  talent: ["be", "spez"],
  besitz: ["ort", "gewicht"]
};
var ZAEHLER_ARTEN_ = ["geld", "leben", "ap", "zahl"];

var MAX_ = { name: 80, kopf: 80, notiz: 1000, gruppe: 40, wert: 20, probe: 30, feld: 200, text: 3000, kuerzel: 8, ename: 40, ewert: 20, vnotiz: 100 };
var MAX_BOEGEN_ = 20;
var MAX_EIGENSCHAFTEN_ = 40;
var MAX_ZAEHLER_ = 6;
var MAX_MODS_ = 20;
var MAX_EINTRAEGE_ = 1000;
var MAX_ABENTEUER_ = 500;
var MAX_SESSIONS_ = 300;              // je Abenteuer
var MAX_AB_BILDER_ = 30;              // Bilder je gespieltem Abenteuer (ab 0.6.9)
var MAX_ZAHL_ = 1000000;              // Start, Höchstwert und Änderung eines Zählers
var BILD_ORDNER_NAME_ = "Thetadex DSA";
var MAX_BILD_TEXT_ = 4000000;
var MAX_BILD_SENDEN_ = 1500000;

// --- 1. EINRICHTEN (im Editor ausführen, auch nach einem Update) ---

// Legt die Blätter an und ergänzt fehlende Spalten am Ende. Vorhandene Daten bleiben unverändert.
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
  // Drive-Ordner für Bilder (beim ersten Mal fragt Google nach der Erlaubnis für Drive)
  var ordner = bildOrdner_();
  Logger.log("Ordner für Bilder: '" + ordner.getName() + "'.");
  Logger.log("Fertig.");
}

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

// Freitext für eine Zelle: Zeilenumbrüche weg, Länge begrenzt, keine Formeln (=, +, -, @ am Anfang)
function bereinigeText_(text, maxLaenge) {
  var t = String(text == null ? "" : text).replace(/[\r\n\t]+/g, " ").trim();
  if (t.length > maxLaenge) t = t.substring(0, maxLaenge);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

// Wie bereinigeText_, aber Zeilenumbrüche bleiben (für lange Beschreibungen von Zaubern)
function bereinigeLang_(text, maxLaenge) {
  var t = String(text == null ? "" : text).replace(/\r\n?/g, "\n").replace(/\t/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (t.length > maxLaenge) t = t.substring(0, maxLaenge);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

// Gegenstück beim Lesen: Das Hochkomma vor =, +, -, @ zeigt die App nicht
function ohneSchutz_(v) {
  var t = String(v == null ? "" : v);
  return /^'[=+\-@]/.test(t) ? t.substring(1) : t;
}

// Kurzer Text ohne Formel-Schutz (für Werte innerhalb von JSON, die nie allein in einer Zelle stehen)
function kurz_(v, max) {
  var t = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
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

// Blätter ab 0.6.8: fehlen sie noch (einrichten nicht ausgeführt), gibt es einfach nichts
function lebendeOptional_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 1) return { zeilen: [], sp: {} };
  var sp = spalten_(sheet);
  if (KOEPFE_[name].some(function (k) { return sp[k] == null; })) return { zeilen: [], sp: sp };
  return { zeilen: lebende_(sheet, sp), sp: sp };
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

function stempel_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  return String(v == null ? "" : v).trim();
}

function jetzt_(alt) {
  var t = Math.floor(Date.now() / 1000) * 1000;
  if (alt instanceof Date && !isNaN(alt) && t <= alt.getTime()) t = Math.floor(alt.getTime() / 1000) * 1000 + 1000;
  return new Date(t);
}

function json_(text, ersatz) {
  try {
    var v = JSON.parse(String(text == null ? "" : text) || "null");
    return v == null ? ersatz : v;
  } catch (e) {
    return ersatz;
  }
}

// Ganze Zahl in den Grenzen oder null
function ganzeZahl_(v, min, max) {
  if (v == null || String(v).trim() === "") return null;
  var n = Number(v);
  if (!isFinite(n) || Math.floor(n) !== n || n < min || n > max) return null;
  return n;
}

// Alle nicht gelöschten Zeilen eines Blatts als { nr, zeile }
function lebende_(sheet, sp) {
  var alle = zeilen_(sheet);
  var aus = [];
  for (var i = 0; i < alle.length; i++) {
    if (!istWahr_(alle[i][sp.geloescht]) && String(alle[i][sp.id]).trim()) aus.push({ nr: i + 2, zeile: alle[i] });
  }
  return aus;
}

function finde_(sheet, sp, id) {
  if (!id) return null;
  var alle = lebende_(sheet, sp);
  for (var i = 0; i < alle.length; i++) if (String(alle[i].zeile[sp.id]) === id) return alle[i];
  return null;
}

// --- 3. ZEILEN ALS OBJEKTE FÜR DIE APP ---

function bogenAus_(z, sp) {
  return {
    id: String(zelle_(z, sp, "id")),
    name: ohneSchutz_(zelle_(z, sp, "name")),
    regelwerk: REGELWERKE_.indexOf(String(zelle_(z, sp, "regelwerk"))) >= 0 ? String(zelle_(z, sp, "regelwerk")) : "dsa",
    kopf: json_(zelle_(z, sp, "kopf"), {}),
    eigenschaften: json_(zelle_(z, sp, "eigenschaften"), []),
    zaehler: json_(zelle_(z, sp, "zaehler"), []),
    bild: String(zelle_(z, sp, "bild")).trim(),
    geteilt: Boolean(String(zelle_(z, sp, "freigabe")).trim()),
    notiz: ohneSchutz_(zelle_(z, sp, "notiz")),
    geaendert_am: stempel_(zelle_(z, sp, "geaendert_am"))
  };
}

function abenteuerAus_(z, sp) {
  return {
    id: String(zelle_(z, sp, "id")),
    bogen_id: String(zelle_(z, sp, "bogen_id")),
    art: String(zelle_(z, sp, "art")),
    titel: ohneSchutz_(zelle_(z, sp, "titel")),
    text: ohneSchutz_(zelle_(z, sp, "text")),
    abgeschlossen: istWahr_(zelle_(z, sp, "abgeschlossen")),
    bilder: bilderListe_(zelle_(z, sp, "bilder")),
    geaendert_am: stempel_(zelle_(z, sp, "geaendert_am"))
  };
}

function sessionAus_(z, sp) {
  return {
    id: String(zelle_(z, sp, "id")),
    abenteuer_id: String(zelle_(z, sp, "abenteuer_id")),
    datum: String(zelle_(z, sp, "datum")).trim(),
    text: ohneSchutz_(zelle_(z, sp, "text")),
    geaendert_am: stempel_(zelle_(z, sp, "geaendert_am"))
  };
}

// Abenteuer und Sessions (ab 0.6.8). Abenteuer eines Charakters nur, wenn es den Bogen noch gibt.
function abenteuerListe_(ids) {
  var a = lebendeOptional_("abenteuer"), s = lebendeOptional_("sessions");
  var abenteuer = a.zeilen.map(function (r) { return abenteuerAus_(r.zeile, a.sp); }).filter(function (x) {
    if (ABENTEUER_ARTEN_.indexOf(x.art) < 0) return false;
    return x.art === "spieler" ? Boolean(ids[x.bogen_id]) : true;
  });
  var aids = {};
  abenteuer.forEach(function (x) { if (x.art === "spieler") aids[x.id] = true; });
  var sessions = s.zeilen.map(function (r) { return sessionAus_(r.zeile, s.sp); }).filter(function (x) { return aids[x.abenteuer_id]; });
  return { abenteuer: abenteuer, sessions: sessions };
}

function eintragAus_(z, sp) {
  return {
    id: String(zelle_(z, sp, "id")),
    bogen_id: String(zelle_(z, sp, "bogen_id")),
    abschnitt: String(zelle_(z, sp, "abschnitt")),
    gruppe: ohneSchutz_(zelle_(z, sp, "gruppe")),
    name: ohneSchutz_(zelle_(z, sp, "name")),
    wert: ohneSchutz_(zelle_(z, sp, "wert")),
    probe: ohneSchutz_(zelle_(z, sp, "probe")),
    felder: json_(zelle_(z, sp, "felder"), {}),
    text: ohneSchutz_(zelle_(z, sp, "text")),
    reihenfolge: Number(zelle_(z, sp, "reihenfolge")) || 0,
    geaendert_am: stempel_(zelle_(z, sp, "geaendert_am"))
  };
}

function verlaufAus_(z, sp) {
  return {
    id: String(zelle_(z, sp, "id")),
    bogen_id: String(zelle_(z, sp, "bogen_id")),
    zaehler: String(zelle_(z, sp, "zaehler")),
    aenderung: Number(zelle_(z, sp, "aenderung")) || 0,
    notiz: ohneSchutz_(zelle_(z, sp, "notiz")),
    datum: String(zelle_(z, sp, "datum"))
  };
}

// --- 4. EINSTIEGSPUNKTE ---

function doGet() {
  return jsonOut_({ status: "DSA API" });
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ error: "anfrage", message: "Ungültige Anfrage" });
  }

  // Ohne Passwort: nur ein geteilter Bogen, nur lesen
  if (data.action === "geteilt") {
    try { return jsonOut_(geteilt_(data)); } catch (err) {
      // Keine internen Fehlertexte nach außen, den genauen Text ins Protokoll
      console.error(err);
      return jsonOut_({ error: "server", message: "Fehler im Skript. Bitte später nochmal versuchen." });
    }
  }

  var status = pruefePin_(data.pin);
  if (status === 'gesperrt') {
    return jsonOut_({ error: "gesperrt", message: "Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen." });
  }
  if (status !== 'ok') {
    return jsonOut_({ error: "pin", message: "Passwort falsch" });
  }

  var schreibend = {
    bogen_speichern: bogenSpeichern_, bogen_loeschen: bogenLoeschen_,
    eintrag_speichern: eintragSpeichern_, eintrag_loeschen: eintragLoeschen_,
    verlauf_neu: verlaufNeu_, freigabe: freigabe_,
    abenteuer_speichern: abenteuerSpeichern_, abenteuer_loeschen: abenteuerLoeschen_,
    session_speichern: sessionSpeichern_, session_loeschen: sessionLoeschen_,
    abenteuer_bild: abenteuerBild_, abenteuer_bild_weg: abenteuerBildWeg_
  };
  try {
    if (data.action === "ping") return jsonOut_({ ok: true });
    if (data.action === "liste") return jsonOut_(liste_());
    if (data.action === "bild") return jsonOut_(bildLesen_(data));
    if (schreibend[data.action]) {
      // Sperre: Es kann immer nur ein Schreibzugriff gleichzeitig laufen
      var lock = LockService.getScriptLock();
      if (!lock.tryLock(20000)) {
        return jsonOut_({ error: "ausgelastet", message: "Script ausgelastet. Bitte gleich nochmal versuchen." });
      }
      try {
        var antwort = schreibend[data.action](data);
        if (antwort.error) return jsonOut_(antwort);
        SpreadsheetApp.flush();
        // Nach jedem Schreiben kommt alles frisch zurück, dazu was die Aktion selbst liefert (z. B. die neue id)
        var alles = liste_();
        Object.keys(antwort).forEach(function (k) { alles[k] = antwort[k]; });
        return jsonOut_(alles);
      } finally {
        lock.releaseLock();
      }
    }
    return jsonOut_({ error: "aktion", message: "Unbekannte Aktion" });
  } catch (err) {
    return jsonOut_({ error: "server", message: String(err) });
  }
}

// --- 5. LESEN ---

// Alle Bögen (ohne Freigabe-Schlüssel), ihre Einträge und der Verlauf
function liste_() {
  var b = blatt_("boegen"), bs = spalten_(b);
  var e = blatt_("eintraege"), es = spalten_(e);
  var v = blatt_("verlauf"), vs = spalten_(v);
  var boegen = lebende_(b, bs).map(function (r) { return bogenAus_(r.zeile, bs); }).filter(function (x) { return x.name; });
  var ids = {};
  boegen.forEach(function (x) { ids[x.id] = true; });
  var ab = abenteuerListe_(ids);
  return {
    boegen: boegen,
    eintraege: lebende_(e, es).map(function (r) { return eintragAus_(r.zeile, es); }).filter(function (x) { return ids[x.bogen_id] && x.name; }),
    verlauf: lebende_(v, vs).map(function (r) { return verlaufAus_(r.zeile, vs); }).filter(function (x) { return ids[x.bogen_id]; }),
    abenteuer: ab.abenteuer,
    sessions: ab.sessions
  };
}

// Ohne Passwort: genau ein Bogen mit seinem Schlüssel. Ohne Verlauf, ohne Notiz, ohne Schlüssel, ohne DM-Inhalte.
// Aktuelle Werte der Zähler rechnet das Skript selbst. Falsche Schlüssel sperren nach 20 Versuchen
// für 15 Minuten (eigener Zähler, damit Fremde nicht die Person aussperren können).
function geteilt_(data) {
  var cache = CacheService.getScriptCache();
  var fehler = Number(cache.get('teil_fehler') || 0);
  if (fehler >= 20) return { error: "gesperrt", message: "Zu viele falsche Links. Bitte in 15 Minuten erneut versuchen." };
  var schluessel = String(data.schluessel == null ? "" : data.schluessel);
  var b = blatt_("boegen"), bs = spalten_(b);
  var treffer = null;
  if (/^[a-f0-9]{64}$/.test(schluessel)) {
    lebende_(b, bs).forEach(function (r) {
      if (String(r.zeile[bs.freigabe]).trim() === schluessel) treffer = r.zeile;
    });
  }
  if (!treffer) {
    cache.put('teil_fehler', String(fehler + 1), 900);
    return { error: "link", message: "Dieser Link gilt nicht (mehr). Bitte nach einem neuen fragen." };
  }
  var bogen = bogenAus_(treffer, bs);
  delete bogen.notiz;
  delete bogen.geteilt;
  delete bogen.geaendert_am;

  var e = blatt_("eintraege"), es = spalten_(e);
  var eintraege = lebende_(e, es).map(function (r) { return eintragAus_(r.zeile, es); })
    .filter(function (x) { return x.bogen_id === bogen.id && x.name; })
    .map(function (x) { delete x.geaendert_am; return x; });

  // Aktueller Stand je Zähler: Startwert plus Änderungen (AP: nur gesammelte), Höchstwert beachtet
  var v = blatt_("verlauf"), vs = spalten_(v);
  var summe = {}, plus = {};
  lebende_(v, vs).forEach(function (r) {
    var x = verlaufAus_(r.zeile, vs);
    if (x.bogen_id !== bogen.id) return;
    summe[x.zaehler] = (summe[x.zaehler] || 0) + x.aenderung;
    if (x.aenderung > 0) plus[x.zaehler] = (plus[x.zaehler] || 0) + x.aenderung;
  });
  bogen.zaehler = (bogen.zaehler || []).map(function (z) {
    var stand = (Number(z.start) || 0) + (z.art === "ap" ? (plus[z.k] || 0) : (summe[z.k] || 0));
    if (z.max != null && z.max !== "" && stand > Number(z.max)) stand = Number(z.max);
    return { k: z.k, n: z.n, art: z.art, stand: stand, max: z.max };
  });

  // Abenteuer dieses Charakters mit Sessions (ab 0.6.8). Nie die Abenteuer als DM und nie die Ideen.
  var ids = {};
  ids[bogen.id] = true;
  var ab = abenteuerListe_(ids);
  var abenteuer = ab.abenteuer.filter(function (x) { return x.art === "spieler" && x.bogen_id === bogen.id; })
    .map(function (x) { return { id: x.id, bogen_id: x.bogen_id, art: x.art, titel: x.titel, text: x.text, bilder: x.bilder }; });
  // Ein Bild eines gespielten Abenteuers dieses Bogens nachladen (ab 0.6.9): nur Bilder, die dort eingetragen sind
  if (data.bild != null) {
    var bid = driveKennung_(data.bild);
    if (!bid || !abenteuer.some(function (x) { return x.bilder.indexOf(bid) >= 0; })) return { error: "eingabe", message: "Unbekanntes Bild." };
    return bildDaten_(bid);
  }
  var aids = {};
  abenteuer.forEach(function (x) { aids[x.id] = true; });
  var sessions = ab.sessions.filter(function (x) { return aids[x.abenteuer_id]; })
    .map(function (x) { return { id: x.id, abenteuer_id: x.abenteuer_id, datum: x.datum, text: x.text }; });
  var antwort = { bogen: bogen, eintraege: eintraege, abenteuer: abenteuer, sessions: sessions };
  if (bogen.bild) {
    var bild = bildDaten_(bogen.bild);
    if (bild.daten) antwort.bild = bild;
  }
  delete bogen.bild;
  return antwort;
}

// --- 6. PRÜFEN ---

function pruefeKopf_(kopf) {
  var aus = {};
  var k = kopf && typeof kopf === "object" ? kopf : {};
  KOPF_FELDER_.forEach(function (f) {
    var t = kurz_(k[f], MAX_.kopf + 1);
    if (t.length > MAX_.kopf) throw new Eingabe_("Ein Feld im Kopf ist zu lang (höchstens " + MAX_.kopf + " Zeichen).");
    if (t) aus[f] = t;
  });
  return aus;
}

function pruefeEigenschaften_(liste) {
  if (!Array.isArray(liste)) liste = [];
  if (liste.length > MAX_EIGENSCHAFTEN_) throw new Eingabe_("Höchstens " + MAX_EIGENSCHAFTEN_ + " Eigenschaften und Basiswerte.");
  return liste.map(function (x) {
    x = x || {};
    var e = { k: kurz_(x.k, MAX_.kuerzel), n: kurz_(x.n, MAX_.ename), w: kurz_(x.w, MAX_.ewert), g: x.g === "b" ? "b" : "e" };
    if (!e.k) throw new Eingabe_("Jede Eigenschaft braucht ein Kürzel.");
    return e;
  });
}

function pruefeZaehler_(liste) {
  if (!Array.isArray(liste)) liste = [];
  if (liste.length > MAX_ZAEHLER_) throw new Eingabe_("Höchstens " + MAX_ZAEHLER_ + " Zähler.");
  var gesehen = {};
  return liste.map(function (x) {
    x = x || {};
    var z = { k: kurz_(x.k, MAX_.kuerzel), n: kurz_(x.n, MAX_.ename), art: ZAEHLER_ARTEN_.indexOf(x.art) >= 0 ? x.art : "zahl" };
    if (!z.k) throw new Eingabe_("Jeder Zähler braucht ein Kürzel.");
    if (gesehen[z.k]) throw new Eingabe_("Das Kürzel „" + z.k + "“ gibt es zweimal.");
    gesehen[z.k] = true;
    var start = ganzeZahl_(x.start == null || x.start === "" ? 0 : x.start, -MAX_ZAHL_, MAX_ZAHL_);
    if (start == null) throw new Eingabe_("Startwert von " + z.k + " bitte als ganze Zahl.");
    z.start = start;
    z.max = null;
    if (x.max != null && String(x.max).trim() !== "") {
      var max = ganzeZahl_(x.max, 0, MAX_ZAHL_);
      if (max == null) throw new Eingabe_("Höchstwert von " + z.k + " bitte als ganze Zahl ab 0.");
      z.max = max;
    }
    return z;
  });
}

function pruefeFelder_(abschnitt, felder) {
  var erlaubt = FELDER_[abschnitt] || [];
  var f = felder && typeof felder === "object" ? felder : {};
  var aus = {};
  erlaubt.forEach(function (k) {
    if (k === "haus") { if (f.haus === true) aus.haus = true; return; }
    if (k === "mods") {
      var mods = Array.isArray(f.mods) ? f.mods : [];
      if (mods.length > MAX_MODS_) throw new Eingabe_("Höchstens " + MAX_MODS_ + " Modifikationen.");
      mods = mods.map(function (m) { return kurz_(m, MAX_.feld); }).filter(Boolean);
      if (mods.length) aus.mods = mods;
      return;
    }
    var t = kurz_(f[k], MAX_.feld + 1);
    if (t.length > MAX_.feld) throw new Eingabe_("Ein Feld ist zu lang (höchstens " + MAX_.feld + " Zeichen).");
    if (t) aus[k] = t;
  });
  return aus;
}

// Fehler in einer Eingabe (wird als Meldung an die App geschickt)
function Eingabe_(text) { this.text = text; }

function mitPruefung_(fn) {
  try {
    return fn();
  } catch (e) {
    if (e instanceof Eingabe_) return { error: "eingabe", message: e.text };
    throw e;
  }
}

function pflichtText_(v, max, titel) {
  var t = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
  if (!t) throw new Eingabe_("Bitte " + titel + " angeben.");
  if (t.length > max) throw new Eingabe_(titel + " ist zu lang (höchstens " + max + " Zeichen).");
  return t;
}

function freiText_(v, max, titel) {
  var t = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
  if (t.length > max) throw new Eingabe_(titel + " ist zu lang (höchstens " + max + " Zeichen).");
  return t;
}

function langText_(v) {
  var t = String(v == null ? "" : v);
  if (t.length > MAX_.text) throw new Eingabe_("Der Text ist zu lang (höchstens " + MAX_.text + " Zeichen).");
  return t;
}

// Neu: id leer. Ändern: Zeile suchen und geaendert_am vergleichen (Schutz vor Überschreiben)
function zeileFuer_(sheet, sp, data) {
  if (data.id == null || data.id === "") {
    var zeile = new Array(sheet.getLastColumn()).fill("");
    zeile[sp.id] = Utilities.getUuid();
    zeile[sp.geloescht] = false;
    return { nr: sheet.getLastRow() + 1, zeile: zeile, neu: true };
  }
  var g = finde_(sheet, sp, String(data.id));
  if (!g) throw new Eingabe_("Das gibt es nicht mehr. Bitte neu laden.");
  if (stempel_(g.zeile[sp.geaendert_am]) !== String(data.geaendert_am || "")) {
    throw new Eingabe_("Wurde inzwischen geändert (zum Beispiel am anderen Gerät). Bitte neu laden.");
  }
  return g;
}

function schreibeZeile_(sheet, sp, z, werte) {
  var jetzt = jetzt_(z.zeile[sp.geaendert_am]);
  if (!z.zeile[sp.erstellt_am]) z.zeile[sp.erstellt_am] = jetzt;
  Object.keys(werte).forEach(function (k) { z.zeile[sp[k]] = werte[k]; });
  z.zeile[sp.geaendert_am] = jetzt;
  sheet.getRange(z.nr, 1, 1, z.zeile.length).setValues([z.zeile]);
}

// --- 7. SCHREIBEN ---

function bogenSpeichern_(data) {
  return mitPruefung_(function () {
    var b = data.bogen || {};
    var sheet = blatt_("boegen"), sp = spalten_(sheet);
    var werte = {
      name: bereinigeText_(pflichtText_(b.name, MAX_.name, "einen Namen"), MAX_.name),
      regelwerk: REGELWERKE_.indexOf(b.regelwerk) >= 0 ? b.regelwerk : "dsa",
      kopf: JSON.stringify(pruefeKopf_(b.kopf)),
      eigenschaften: JSON.stringify(pruefeEigenschaften_(b.eigenschaften)),
      zaehler: JSON.stringify(pruefeZaehler_(b.zaehler)),
      notiz: bereinigeLang_(freiText_(b.notiz, MAX_.notiz, "Die Notiz"), MAX_.notiz)
    };
    var neu = b.id == null || b.id === "";
    if (neu && lebende_(sheet, sp).length >= MAX_BOEGEN_) throw new Eingabe_("Höchstens " + MAX_BOEGEN_ + " Bögen.");
    // Bild nur, wenn die App es mitschickt (bild_daten = neu hochgeladen, bild = Link/Kennung oder leer)
    if (b.bild_daten != null || b.bild != null) {
      var bild = bildAus_(b);
      if (bild.fehler) throw new Eingabe_(bild.fehler);
      werte.bild = bild.id;
    }
    var z = zeileFuer_(sheet, sp, b);
    schreibeZeile_(sheet, sp, z, werte);
    return { id: String(z.zeile[sp.id]) };
  });
}

// Weich löschen, mit allen Einträgen und dem Verlauf des Bogens
function bogenLoeschen_(data) {
  return mitPruefung_(function () {
    var sheet = blatt_("boegen"), sp = spalten_(sheet);
    var z = zeileFuer_(sheet, sp, { id: data.id, geaendert_am: data.geaendert_am });
    if (z.neu) throw new Eingabe_("Welcher Bogen?");
    schreibeZeile_(sheet, sp, z, { geloescht: true });
    ["eintraege", "verlauf"].forEach(function (name) {
      var s = blatt_(name), ss = spalten_(s);
      lebende_(s, ss).forEach(function (r) {
        if (String(r.zeile[ss.bogen_id]) === String(data.id)) schreibeZeile_(s, ss, r, { geloescht: true });
      });
    });
    // Abenteuer des Charakters mit ihren Sessions (wenn es die Blätter schon gibt)
    var abs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("abenteuer");
    if (abs) {
      var asp = spalten_(abs);
      lebende_(abs, asp).forEach(function (r) {
        if (String(r.zeile[asp.art]) === "spieler" && String(r.zeile[asp.bogen_id]) === String(data.id)) {
          schreibeZeile_(abs, asp, r, { geloescht: true });
          sessionsLoeschen_(String(r.zeile[asp.id]));
        }
      });
    }
    return { ok: true };
  });
}

function eintragSpeichern_(data) {
  return mitPruefung_(function () {
    var x = data.eintrag || {};
    var bogenId = String(x.bogen_id || "");
    if (!finde_(blatt_("boegen"), spalten_(blatt_("boegen")), bogenId)) throw new Eingabe_("Den Bogen gibt es nicht mehr. Bitte neu laden.");
    if (ABSCHNITTE_.indexOf(x.abschnitt) < 0) throw new Eingabe_("Unbekannter Abschnitt.");
    var sheet = blatt_("eintraege"), sp = spalten_(sheet);
    if (x.id == null || x.id === "") {
      var anzahl = lebende_(sheet, sp).filter(function (r) { return String(r.zeile[sp.bogen_id]) === bogenId; }).length;
      if (anzahl >= MAX_EINTRAEGE_) throw new Eingabe_("Höchstens " + MAX_EINTRAEGE_ + " Einträge je Bogen.");
    }
    var reihe = ganzeZahl_(x.reihenfolge == null || x.reihenfolge === "" ? 0 : x.reihenfolge, 0, 9999);
    if (reihe == null) throw new Eingabe_("Reihenfolge bitte als ganze Zahl von 0 bis 9999.");
    var werte = {
      bogen_id: bogenId,
      abschnitt: x.abschnitt,
      gruppe: bereinigeText_(freiText_(x.gruppe, MAX_.gruppe, "Die Gruppe"), MAX_.gruppe),
      name: bereinigeText_(pflichtText_(x.name, MAX_.name, "einen Namen"), MAX_.name),
      wert: bereinigeText_(freiText_(x.wert, MAX_.wert, "Der Wert"), MAX_.wert),
      probe: bereinigeText_(freiText_(x.probe, MAX_.probe, "Die Probe"), MAX_.probe),
      felder: JSON.stringify(pruefeFelder_(x.abschnitt, x.felder)),
      text: bereinigeLang_(langText_(x.text), MAX_.text),
      reihenfolge: reihe
    };
    var z = zeileFuer_(sheet, sp, x);
    if (!z.neu && String(z.zeile[sp.bogen_id]) !== bogenId) throw new Eingabe_("Der Eintrag gehört zu einem anderen Bogen.");
    schreibeZeile_(sheet, sp, z, werte);
    return { id: String(z.zeile[sp.id]) };
  });
}

function eintragLoeschen_(data) {
  return mitPruefung_(function () {
    var sheet = blatt_("eintraege"), sp = spalten_(sheet);
    var z = zeileFuer_(sheet, sp, { id: data.id, geaendert_am: data.geaendert_am });
    if (z.neu) throw new Eingabe_("Welcher Eintrag?");
    schreibeZeile_(sheet, sp, z, { geloescht: true });
    return { ok: true };
  });
}

// --- Abenteuer und Sessions (ab 0.6.8) ---

function abenteuerSpeichern_(data) {
  return mitPruefung_(function () {
    var x = data.abenteuer || {};
    var art = String(x.art || "");
    if (ABENTEUER_ARTEN_.indexOf(art) < 0) throw new Eingabe_("Unbekannte Art.");
    var sheet = blatt_("abenteuer"), sp = spalten_(sheet);
    var bogenId = "";
    if (art === "spieler") {
      bogenId = String(x.bogen_id || "");
      if (!finde_(blatt_("boegen"), spalten_(blatt_("boegen")), bogenId)) throw new Eingabe_("Den Bogen gibt es nicht mehr. Bitte neu laden.");
    }
    var neu = x.id == null || x.id === "";
    if (neu && art === "ideen" && lebende_(sheet, sp).some(function (r) { return String(r.zeile[sp.art]) === "ideen"; })) {
      throw new Eingabe_("Die Abenteuerideen gibt es schon. Bitte neu laden.");
    }
    if (neu && lebende_(sheet, sp).length >= MAX_ABENTEUER_) throw new Eingabe_("Höchstens " + MAX_ABENTEUER_ + " Abenteuer.");
    var werte = {
      bogen_id: bogenId,
      art: art,
      titel: art === "ideen" ? "Abenteuerideen" : bereinigeText_(pflichtText_(x.titel, MAX_.name, "einen Titel"), MAX_.name),
      text: bereinigeLang_(freiLang_(x.text, MAX_ATEXT_), MAX_ATEXT_),
      abgeschlossen: art === "dm" && x.abgeschlossen === true
    };
    var z = zeileFuer_(sheet, sp, x);
    if (!z.neu && String(z.zeile[sp.art]) !== art) throw new Eingabe_("Die Art lässt sich nicht ändern.");
    if (!z.neu && art === "spieler" && String(z.zeile[sp.bogen_id]) !== bogenId) throw new Eingabe_("Das Abenteuer gehört zu einem anderen Charakter.");
    schreibeZeile_(sheet, sp, z, werte);
    return { id: String(z.zeile[sp.id]) };
  });
}

function abenteuerLoeschen_(data) {
  return mitPruefung_(function () {
    var sheet = blatt_("abenteuer"), sp = spalten_(sheet);
    var z = zeileFuer_(sheet, sp, { id: data.id, geaendert_am: data.geaendert_am });
    if (z.neu) throw new Eingabe_("Welches Abenteuer?");
    schreibeZeile_(sheet, sp, z, { geloescht: true });
    sessionsLoeschen_(String(data.id));
    return { ok: true };
  });
}

function sessionsLoeschen_(abenteuerId) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("sessions");
  if (!s) return;
  var ss = spalten_(s);
  lebende_(s, ss).forEach(function (r) {
    if (String(r.zeile[ss.abenteuer_id]) === abenteuerId) schreibeZeile_(s, ss, r, { geloescht: true });
  });
}

function sessionSpeichern_(data) {
  return mitPruefung_(function () {
    var x = data.session || {};
    var aid = String(x.abenteuer_id || "");
    var a = finde_(blatt_("abenteuer"), spalten_(blatt_("abenteuer")), aid);
    if (!a || String(a.zeile[spalten_(blatt_("abenteuer")).art]) !== "spieler") throw new Eingabe_("Das Abenteuer gibt es nicht mehr. Bitte neu laden.");
    var datum = String(x.datum || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new Eingabe_("Bitte ein Datum angeben.");
    var sheet = blatt_("sessions"), sp = spalten_(sheet);
    if (x.id == null || x.id === "") {
      var anzahl = lebende_(sheet, sp).filter(function (r) { return String(r.zeile[sp.abenteuer_id]) === aid; }).length;
      if (anzahl >= MAX_SESSIONS_) throw new Eingabe_("Höchstens " + MAX_SESSIONS_ + " Sessions je Abenteuer.");
    }
    var z = zeileFuer_(sheet, sp, x);
    if (!z.neu && String(z.zeile[sp.abenteuer_id]) !== aid) throw new Eingabe_("Die Session gehört zu einem anderen Abenteuer.");
    schreibeZeile_(sheet, sp, z, { abenteuer_id: aid, datum: datum, text: bereinigeLang_(freiLang_(x.text, MAX_.text), MAX_.text) });
    return { id: String(z.zeile[sp.id]) };
  });
}

function sessionLoeschen_(data) {
  return mitPruefung_(function () {
    var sheet = blatt_("sessions"), sp = spalten_(sheet);
    var z = zeileFuer_(sheet, sp, { id: data.id, geaendert_am: data.geaendert_am });
    if (z.neu) throw new Eingabe_("Welche Session?");
    schreibeZeile_(sheet, sp, z, { geloescht: true });
    return { ok: true };
  });
}

// Bilder eines gespielten Abenteuers (ab 0.6.9): Spalte „bilder“ = JSON-Liste von Drive-Kennungen, Dateien im Ordner „Thetadex DSA“
function bilderListe_(v) {
  var liste = json_(v, []);
  return Array.isArray(liste) ? liste.map(function (x) { return String(x); }).filter(function (x) { return /^[A-Za-z0-9_-]{20,}$/.test(x); }) : [];
}

function spielerAbenteuer_(data) {
  var sheet = blatt_("abenteuer"), sp = spalten_(sheet);
  var z = zeileFuer_(sheet, sp, { id: data.abenteuer_id, geaendert_am: data.geaendert_am });
  if (z.neu) throw new Eingabe_("Welches Abenteuer?");
  if (String(z.zeile[sp.art]) !== "spieler") throw new Eingabe_("Bilder gibt es nur bei gespielten Abenteuern.");
  return { sheet: sheet, sp: sp, z: z, bilder: bilderListe_(z.zeile[sp.bilder]) };
}

// Neues Bild hochladen und hinten anhängen
function abenteuerBild_(data) {
  return mitPruefung_(function () {
    var a = spielerAbenteuer_(data);
    if (a.bilder.length >= MAX_AB_BILDER_) throw new Eingabe_("Höchstens " + MAX_AB_BILDER_ + " Bilder je Abenteuer.");
    if (!data.bild_daten) throw new Eingabe_("Bitte ein Bild wählen.");
    var bild = bildAus_({ bild_daten: data.bild_daten, name: data.name || "Abenteuer" });
    if (bild.fehler) throw new Eingabe_(bild.fehler);
    a.bilder.push(bild.id);
    schreibeZeile_(a.sheet, a.sp, a.z, { bilder: JSON.stringify(a.bilder) });
    return { bild: bild.id };
  });
}

// Bild vom Abenteuer abnehmen. Die Datei bleibt im Drive-Ordner (zurückholbar).
function abenteuerBildWeg_(data) {
  return mitPruefung_(function () {
    var a = spielerAbenteuer_(data);
    var id = String(data.bild || "");
    if (a.bilder.indexOf(id) < 0) throw new Eingabe_("Das Bild gehört nicht (mehr) zu diesem Abenteuer. Bitte neu laden.");
    schreibeZeile_(a.sheet, a.sp, a.z, { bilder: JSON.stringify(a.bilder.filter(function (x) { return x !== id; })) });
    return { ok: true };
  });
}

// Langer Text mit eigener Grenze (Zeilenumbrüche bleiben)
function freiLang_(v, max) {
  var t = String(v == null ? "" : v);
  if (t.length > max) throw new Eingabe_("Der Text ist zu lang (höchstens " + max + " Zeichen).");
  return t;
}

// Eine Änderung an einem Zähler. Wie ein Kassenbuch: Löschen nur im Sheet.
function verlaufNeu_(data) {
  return mitPruefung_(function () {
    var bsheet = blatt_("boegen"), bsp = spalten_(bsheet);
    var b = finde_(bsheet, bsp, String(data.bogen_id || ""));
    if (!b) throw new Eingabe_("Den Bogen gibt es nicht mehr. Bitte neu laden.");
    var zaehler = json_(b.zeile[bsp.zaehler], []);
    var k = String(data.zaehler || "");
    if (!zaehler.some(function (z) { return z && z.k === k; })) throw new Eingabe_("Diesen Zähler gibt es am Bogen nicht.");
    var aenderung = ganzeZahl_(data.aenderung, -MAX_ZAHL_, MAX_ZAHL_);
    if (aenderung == null || aenderung === 0) throw new Eingabe_("Bitte eine ganze Zahl angeben (nicht 0).");
    var sheet = blatt_("verlauf"), sp = spalten_(sheet);
    var z = zeileFuer_(sheet, sp, {});
    schreibeZeile_(sheet, sp, z, {
      bogen_id: String(data.bogen_id),
      zaehler: k,
      aenderung: aenderung,
      notiz: bereinigeText_(freiText_(data.notiz, MAX_.vnotiz, "Die Notiz"), MAX_.vnotiz),
      datum: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm")
    });
    return { ok: true };
  });
}

// Teilen: neu = neuer Schlüssel (alter Link gilt sofort nicht mehr), aus = nicht mehr teilen
function freigabe_(data) {
  return mitPruefung_(function () {
    var sheet = blatt_("boegen"), sp = spalten_(sheet);
    var z = zeileFuer_(sheet, sp, { id: data.id, geaendert_am: data.geaendert_am });
    if (z.neu) throw new Eingabe_("Welcher Bogen?");
    var schluessel = data.was === "neu" ? (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "").toLowerCase() : "";
    schreibeZeile_(sheet, sp, z, { freigabe: schluessel });
    return { schluessel: schluessel };
  });
}

// --- 8. BILDER ---

function driveKennung_(text) {
  var t = String(text == null ? "" : text).trim();
  var m = /\/d\/([A-Za-z0-9_-]{20,})/.exec(t) || /[?&]id=([A-Za-z0-9_-]{20,})/.exec(t) || /^([A-Za-z0-9_-]{20,})$/.exec(t);
  return m ? m[1] : "";
}

function bildAus_(data) {
  if (data.bild_daten) {
    var text = String(data.bild_daten);
    if (text.length > MAX_BILD_TEXT_) return { fehler: "Das Bild ist zu groß." };
    var bytes;
    try { bytes = Utilities.base64Decode(text); } catch (e) { return { fehler: "Das Bild ist beschädigt." }; }
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

// Mit Passwort: nur Bilder, die bei einem (nicht gelöschten) Bogen eingetragen sind
function bildLesen_(data) {
  var id = driveKennung_(data.bild);
  var sheet = blatt_("boegen"), sp = spalten_(sheet);
  var bekannt = id && lebende_(sheet, sp).some(function (r) { return String(r.zeile[sp.bild]).trim() === id; });
  if (id && !bekannt) {
    var ids = {};
    lebende_(sheet, sp).forEach(function (r) { ids[String(r.zeile[sp.id])] = true; });
    bekannt = abenteuerListe_(ids).abenteuer.some(function (a) { return a.art === "spieler" && a.bilder.indexOf(id) >= 0; });
  }
  if (!bekannt) return { error: "eingabe", message: "Unbekanntes Bild." };
  return bildDaten_(id);
}

function bildDaten_(id) {
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
