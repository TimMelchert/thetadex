// =====================================================
// GEMEINSAM – Apps Script (Person und Partner*in, mit Passwort)
// Einkauf und Essen (Etappe 4) und Uni (Etappe 5).
// Blätter: lebensmittel, einkaufsliste, gerichte, zutaten, vorrat;
// Uni: semester, stundenplan, termine, module, uni_einstellungen.
// Zwei Passwörter in den Skripteigenschaften: APP_PIN (Person) und PARTNER_PIN (Partner*in).
// Kein Passwort steht hier. Über die Partnerin oder den Partner wird nichts gespeichert.
// Siehe docs/STAND.md (Einkauf) und docs/PLAN-ETAPPE-5.md (Uni).
// =====================================================

var STANDARD_ = ["id", "erstellt_am", "geaendert_am", "geloescht"];
var BLAETTER_ = {
  lebensmittel: ["id", "name", "abteilung", "einheit", "notiz", "erstellt_am", "geaendert_am", "geloescht"],
  einkaufsliste: ["id", "lebensmittel_id", "anzahl", "gericht_id", "notiz", "abgehakt_am", "erstellt_am", "geaendert_am", "geloescht"],
  gerichte: ["id", "name", "notiz", "link", "erstellt_am", "geaendert_am", "geloescht"],
  zutaten: ["id", "gericht_id", "lebensmittel_id", "menge", "erstellt_am", "geaendert_am", "geloescht"],
  vorrat: ["id", "lebensmittel_id", "ort", "menge", "erstellt_am", "geaendert_am", "geloescht"],
  semester: ["id", "name", "beginn", "ende", "vorlesung_beginn", "vorlesung_ende", "erstellt_am", "geaendert_am", "geloescht"],
  stundenplan: ["id", "semester_id", "tag", "von", "bis", "titel", "art", "ort", "modul_id", "notiz", "erstellt_am", "geaendert_am", "geloescht"],
  termine: ["id", "titel", "art", "beginn", "ende", "von", "bis", "ort", "modul_id", "stunde_id", "notiz", "erstellt_am", "geaendert_am", "geloescht"],
  module: ["id", "name", "kuerzel", "bereich", "ects", "status", "semester_id", "notiz", "erstellt_am", "geaendert_am", "geloescht"],
  uni_einstellungen: ["name", "wert"]   // ohne Standardspalten, eine Zeile je Wert (ects_ziel)
};
// Spalten, die im Sheet reiner Text bleiben (kein Datum, keine Zahl)
var TEXT_SPALTEN_ = ["id", "name", "abteilung", "einheit", "notiz", "lebensmittel_id", "gericht_id", "link", "ort",
  "semester_id", "modul_id", "stunde_id", "titel", "art", "kuerzel", "bereich", "status",
  "beginn", "ende", "vorlesung_beginn", "vorlesung_ende", "von", "bis"];
var MAX_ = { name: 60, abteilung: 40, einheit: 20, notiz_lm: 200, notiz_liste: 100, notiz_gericht: 300, link: 300, ort: 40 };
var MAX_ZAHL_ = 9999;
var MAX_AUF_EINMAL_ = 100;     // höchstens so viele Einträge je Anfrage (auf_liste, abhaken)
var MAX_ZUTATEN_ = 50;
var MIN_PIN_ = 12;             // ein kürzeres Passwort wird nicht angenommen
// Uni (Etappe 5)
var UNI_MAX_ = { semester: 40, titel: 80, ort: 60, notiz: 200, modul: 80, kuerzel: 20, bereich: 40 };
var UNI_ARTEN_STUNDE_ = ["vorlesung", "arbeit", "zug"];
var UNI_ARTEN_TERMIN_ = ["vorlesung", "pruefung", "arbeit", "zug", "urlaub", "frei", "sonstiges"];
var UNI_STATUS_ = ["offen", "laeuft", "bestanden"];
var UNI_MAX_STUNDEN_ = 200;    // höchstens so viele Stundenplan-Einträge je Semester
var ECTS_ZIEL_ = 120;          // Vorgabe für uni_einstellungen, ändern im Sheet

// Was jede Rolle darf. Das Skript prüft das bei jeder Aktion, nicht die App.
// Uni (Etappe 5): Partner*in darf nur lesen.
var LESEN_ = ["ping", "alles", "uni"];
var UNI_SCHREIBEN_ = ["uni_speichern", "uni_loeschen"];
var EINKAUF_SCHREIBEN_ = ["lebensmittel_speichern", "lebensmittel_loeschen", "auf_liste", "liste_aendern", "abhaken",
  "gericht_speichern", "gericht_loeschen", "vorrat_speichern", "vorrat_loeschen"];
var ERLAUBT_ = {
  person: LESEN_.concat(EINKAUF_SCHREIBEN_, UNI_SCHREIBEN_),
  partner: LESEN_.concat(EINKAUF_SCHREIBEN_)
};

// --- 1. EINRICHTEN (im Editor ausführen, auch nach einem Update) ---

// Legt die Blätter an und ergänzt fehlende Spalten am Ende. Vorhandene Daten bleiben unverändert.
function einrichten() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(BLAETTER_).forEach(function (name) {
    var kopf = BLAETTER_[name];
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
    TEXT_SPALTEN_.forEach(function (k) {
      if (karte[k] != null) sheet.getRange(2, karte[k] + 1, sheet.getMaxRows() - 1, 1).setNumberFormat("@");
    });
  });
  // Uni: Ziel in ECTS anlegen, wenn die Zeile fehlt (der Wert wird im Sheet geändert)
  var ue = ss.getSheetByName("uni_einstellungen");
  var hatZiel = ue.getLastRow() > 1 && ue.getRange(2, 1, ue.getLastRow() - 1, 1).getValues()
    .some(function (z) { return String(z[0]).trim() === "ects_ziel"; });
  if (!hatZiel) {
    ue.appendRow(["ects_ziel", ECTS_ZIEL_]);
    Logger.log("Blatt 'uni_einstellungen': ects_ziel = " + ECTS_ZIEL_ + " angelegt.");
  }

  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("APP_PIN")) Logger.log("ACHTUNG: Skripteigenschaft APP_PIN fehlt.");
  var partner = props.getProperty("PARTNER_PIN");
  if (!partner) Logger.log("Hinweis: PARTNER_PIN fehlt noch. Ohne geht nur der Zugang der Person.");
  else if (partner.length < MIN_PIN_) Logger.log("ACHTUNG: PARTNER_PIN ist kürzer als " + MIN_PIN_ + " Zeichen und wird nicht angenommen.");
  else if (partner === props.getProperty("APP_PIN")) Logger.log("ACHTUNG: PARTNER_PIN ist gleich APP_PIN. Bitte ein anderes Passwort wählen.");
  Logger.log("Fertig.");
}

// --- 2. HILFSFUNKTIONEN ---

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Prüft das Passwort und liefert die Rolle ("person" oder "partner"), "falsch" oder "gesperrt".
// Gemeinsame Sperre nach 5 Fehlversuchen für 15 Minuten.
function pruefePin_(pin) {
  var cache = CacheService.getScriptCache();
  var fehler = Number(cache.get('pin_fehler') || 0);
  if (fehler >= 5) return 'gesperrt';

  var props = PropertiesService.getScriptProperties();
  var person = props.getProperty('APP_PIN');
  var partner = props.getProperty('PARTNER_PIN');
  var p = String(pin == null ? "" : pin);
  var rolle = null;
  if (person && p === person) rolle = 'person';
  else if (partner && partner.length >= MIN_PIN_ && partner !== person && p === partner) rolle = 'partner';
  if (!rolle) {
    cache.put('pin_fehler', String(fehler + 1), 900);
    return 'falsch';
  }
  cache.remove('pin_fehler');
  return rolle;
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

// Ein Blatt mit Spalten und allen Zeilen. Fehlt das Blatt oder eine Spalte, kommt eine klare Meldung.
function tabelle_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error("Blatt '" + name + "' fehlt. Bitte im Editor einmal 'einrichten' ausführen.");
  var sp = spalten_(sheet);
  var fehlen = BLAETTER_[name].filter(function (k) { return sp[k] == null; });
  if (fehlen.length) throw new Error("Im Blatt '" + name + "' fehlen Spalten: " + fehlen.join(", ") + ". Bitte im Editor 'einrichten' ausführen.");
  var breite = sheet.getLastColumn();
  var zeilen = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, breite).getValues() : [];
  return { sheet: sheet, sp: sp, breite: breite, zeilen: zeilen };
}

function zelle_(z, sp, name) {
  return sp[name] != null && z[sp[name]] != null ? z[sp[name]] : "";
}

function text_(z, sp, name) {
  return ohneSchutz_(zelle_(z, sp, name));
}

function istWahr_(v) {
  return v === true || /^(true|wahr|ja|x)$/i.test(String(v).trim());
}

// Zeile ist nicht gelöscht und hat eine id
function aktiv_(t, z) {
  return String(zelle_(z, t.sp, "id")) !== "" && !istWahr_(zelle_(z, t.sp, "geloescht"));
}

// Zeitstempel aus dem Sheet als Text auf die Sekunde. Dient beim Ändern als Schutz vor Überschreiben.
function stempel_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  return String(v == null ? "" : v).trim();
}

// Jetzt, auf ganze Sekunden gekürzt, mindestens eine Sekunde nach dem alten Stempel
function jetzt_(alt) {
  var t = Math.floor(Date.now() / 1000) * 1000;
  if (alt instanceof Date && !isNaN(alt) && t <= alt.getTime()) t = Math.floor(alt.getTime() / 1000) * 1000 + 1000;
  return new Date(t);
}

// Sucht eine nicht gelöschte Zeile nach id. Liefert den Index in t.zeilen oder -1.
function index_(t, id) {
  if (!id) return -1;
  for (var i = 0; i < t.zeilen.length; i++) {
    if (String(t.zeilen[i][t.sp.id]) === String(id) && aktiv_(t, t.zeilen[i])) return i;
  }
  return -1;
}

// Schreibt eine geänderte Zeile zurück (i = Index in t.zeilen)
function schreibe_(t, i) {
  t.sheet.getRange(i + 2, 1, 1, t.breite).setValues([t.zeilen[i]]);
}

// Legt eine neue Zeile an und liefert ihren Index in t.zeilen
function neu_(t, werte) {
  var z = new Array(t.breite).fill("");
  var jetzt = jetzt_();
  z[t.sp.id] = Utilities.getUuid();
  z[t.sp.erstellt_am] = jetzt;
  z[t.sp.geaendert_am] = jetzt;
  z[t.sp.geloescht] = false;
  Object.keys(werte).forEach(function (k) { z[t.sp[k]] = werte[k]; });
  t.zeilen.push(z);
  var i = t.zeilen.length - 1;
  schreibe_(t, i);
  return i;
}

// Setzt Werte in einer vorhandenen Zeile und schreibt sie
function aendere_(t, i, werte) {
  var z = t.zeilen[i];
  Object.keys(werte).forEach(function (k) { z[t.sp[k]] = werte[k]; });
  z[t.sp.geaendert_am] = jetzt_(z[t.sp.geaendert_am]);
  schreibe_(t, i);
}

// Weich löschen
function weg_(t, i) {
  aendere_(t, i, { geloescht: true });
}

// Prüft den Schutz vor Überschreiben: die App schickt das geaendert_am, das sie kennt
function veraltet_(t, i, data) {
  return stempel_(t.zeilen[i][t.sp.geaendert_am]) !== String(data.geaendert_am || "");
}

// Text prüfen: Pflicht, Länge, Schutz vor Formeln. Liefert { wert } oder { fehler }.
function pruefeText_(roh, max, titel, pflicht) {
  var t = String(roh == null ? "" : roh).replace(/\s+/g, " ").trim();
  if (!t && pflicht) return { fehler: "Bitte " + titel + " angeben." };
  if (t.length > max) return { fehler: titel + " ist zu lang (höchstens " + max + " Zeichen)." };
  return { wert: bereinigeText_(t, max) };
}

// Menge oder Anzahl: Zahl in halben Schritten von min bis 9999
function pruefeZahl_(roh, min, titel) {
  var n = Number(String(roh == null ? "" : roh).replace(",", "."));
  if (String(roh == null ? "" : roh).trim() === "" || !isFinite(n) || n < min || n > MAX_ZAHL_ || Math.round(n * 2) !== n * 2) {
    return { fehler: titel + " bitte als Zahl von " + String(min).replace(".", ",") + " bis " + MAX_ZAHL_ + " (halbe erlaubt)." };
  }
  return { wert: n };
}

function zahl_(v) {
  var n = Number(v);
  return isFinite(n) ? n : 0;
}

// --- 3. EINSTIEGSPUNKTE ---

// Direkter Aufruf der URL liefert keine Daten
function doGet() {
  return jsonOut_({ status: "Gemeinsam API" });
}

// Alle Anfragen laufen über POST und brauchen ein Passwort
function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ error: "anfrage", message: "Ungültige Anfrage" });
  }

  var rolle = pruefePin_(data.pin);
  if (rolle === 'gesperrt') {
    return jsonOut_({ error: "gesperrt", message: "Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen." });
  }
  if (rolle === 'falsch') {
    return jsonOut_({ error: "pin", message: "Passwort falsch" });
  }

  var aktion = String(data.action || "");
  if ((ERLAUBT_[rolle] || []).indexOf(aktion) < 0) {
    var bekannt = Object.keys(ERLAUBT_).some(function (r) { return ERLAUBT_[r].indexOf(aktion) >= 0; });
    return jsonOut_(bekannt
      ? { error: "recht", message: "Das darfst du mit diesem Zugang nicht." }
      : { error: "aktion", message: "Unbekannte Aktion" });
  }

  try {
    if (aktion === "ping") return jsonOut_({ ok: true, rolle: rolle });
    if (aktion === "alles" || aktion === "uni") {
      var d = aktion === "uni" ? uni_() : alles_();
      d.rolle = rolle;
      return jsonOut_(d);
    }

    // Schreiben: Es kann immer nur ein Schreibzugriff gleichzeitig laufen
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) {
      return jsonOut_({ error: "ausgelastet", message: "Script ausgelastet. Bitte gleich nochmal versuchen." });
    }
    try {
      var f = {
        lebensmittel_speichern: lebensmittelSpeichern_,
        lebensmittel_loeschen: lebensmittelLoeschen_,
        auf_liste: aufListe_,
        liste_aendern: listeAendern_,
        abhaken: abhaken_,
        gericht_speichern: gerichtSpeichern_,
        gericht_loeschen: gerichtLoeschen_,
        vorrat_speichern: vorratSpeichern_,
        vorrat_loeschen: vorratLoeschen_,
        uni_speichern: uniSpeichern_,
        uni_loeschen: uniLoeschen_
      }[aktion];
      return jsonOut_(f(data));
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return jsonOut_({ error: "server", message: String(err && err.message || err) });
  }
}

// --- 4. LESEN ---

function lebensmittelAus_(t, z) {
  return {
    id: String(zelle_(z, t.sp, "id")),
    name: text_(z, t.sp, "name"),
    abteilung: text_(z, t.sp, "abteilung"),
    einheit: text_(z, t.sp, "einheit"),
    notiz: text_(z, t.sp, "notiz"),
    geaendert_am: stempel_(zelle_(z, t.sp, "geaendert_am"))
  };
}

function eintragAus_(t, z) {
  return {
    id: String(zelle_(z, t.sp, "id")),
    lebensmittel_id: String(zelle_(z, t.sp, "lebensmittel_id")),
    anzahl: zahl_(zelle_(z, t.sp, "anzahl")),
    gericht_id: String(zelle_(z, t.sp, "gericht_id")),
    notiz: text_(z, t.sp, "notiz")
  };
}

function vorratAus_(t, z) {
  return {
    id: String(zelle_(z, t.sp, "id")),
    lebensmittel_id: String(zelle_(z, t.sp, "lebensmittel_id")),
    ort: text_(z, t.sp, "ort"),
    menge: zahl_(zelle_(z, t.sp, "menge"))
  };
}

// Offene Einträge der Einkaufsliste (nicht gelöscht, nicht abgehakt)
function offeneListe_(t) {
  t = t || tabelle_("einkaufsliste");
  return t.zeilen.filter(function (z) {
    return aktiv_(t, z) && String(zelle_(z, t.sp, "abgehakt_am")) === "";
  }).map(function (z) { return eintragAus_(t, z); });
}

function alleVorraete_(t) {
  t = t || tabelle_("vorrat");
  return t.zeilen.filter(function (z) { return aktiv_(t, z); }).map(function (z) { return vorratAus_(t, z); });
}

function alleGerichte_() {
  var g = tabelle_("gerichte");
  var zt = tabelle_("zutaten");
  var zutaten = {};
  zt.zeilen.forEach(function (z) {
    if (!aktiv_(zt, z)) return;
    var gid = String(zelle_(z, zt.sp, "gericht_id"));
    (zutaten[gid] = zutaten[gid] || []).push({
      lebensmittel_id: String(zelle_(z, zt.sp, "lebensmittel_id")),
      menge: zahl_(zelle_(z, zt.sp, "menge"))
    });
  });
  return g.zeilen.filter(function (z) { return aktiv_(g, z); }).map(function (z) {
    var id = String(zelle_(z, g.sp, "id"));
    return {
      id: id,
      name: text_(z, g.sp, "name"),
      notiz: text_(z, g.sp, "notiz"),
      link: text_(z, g.sp, "link"),
      zutaten: zutaten[id] || [],
      geaendert_am: stempel_(zelle_(z, g.sp, "geaendert_am"))
    };
  });
}

// Alles für den Reiter Einkauf in einer Antwort
function alles_() {
  var lm = tabelle_("lebensmittel");
  return {
    lebensmittel: lm.zeilen.filter(function (z) { return aktiv_(lm, z); }).map(function (z) { return lebensmittelAus_(lm, z); }),
    liste: offeneListe_(),
    gerichte: alleGerichte_(),
    vorrat: alleVorraete_()
  };
}

// --- 5. LEBENSMITTEL ---

// Neu (ohne id) oder ändern (mit id und geaendert_am). Der Name kommt nur einmal vor.
function lebensmittelSpeichern_(data) {
  var name = pruefeText_(data.name, MAX_.name, "einen Namen", true);
  var abt = pruefeText_(data.abteilung, MAX_.abteilung, "Abteilung", false);
  var einheit = pruefeText_(data.einheit, MAX_.einheit, "Einheit", false);
  var notiz = pruefeText_(data.notiz, MAX_.notiz_lm, "Notiz", false);
  var fehler = [name, abt, einheit, notiz].filter(function (p) { return p.fehler; })[0];
  if (fehler) return { error: "eingabe", message: fehler.fehler };

  var t = tabelle_("lebensmittel");
  var id = String(data.id || "");
  var klein = ohneSchutz_(name.wert).toLowerCase();
  var doppelt = t.zeilen.some(function (z) {
    return aktiv_(t, z) && String(zelle_(z, t.sp, "id")) !== id && text_(z, t.sp, "name").toLowerCase() === klein;
  });
  if (doppelt) return { error: "doppelt", message: "Ein Lebensmittel mit diesem Namen gibt es schon." };

  var werte = { name: name.wert, abteilung: abt.wert, einheit: einheit.wert, notiz: notiz.wert };
  var i;
  if (!id) {
    i = neu_(t, werte);
  } else {
    i = index_(t, id);
    if (i < 0) return { error: "fehlt", message: "Dieses Lebensmittel gibt es nicht mehr. Bitte neu laden." };
    if (veraltet_(t, i, data)) return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Handy). Bitte neu laden." };
    aendere_(t, i, werte);
  }
  return { lebensmittel: lebensmittelAus_(t, t.zeilen[i]) };
}

// Weich löschen. Offene Einträge auf der Liste, Zutaten und Vorrat dazu werden mit gelöscht.
function lebensmittelLoeschen_(data) {
  var t = tabelle_("lebensmittel");
  var i = index_(t, data.id);
  if (i < 0) return { error: "fehlt", message: "Dieses Lebensmittel gibt es nicht mehr. Bitte neu laden." };
  if (veraltet_(t, i, data)) return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Handy). Bitte neu laden." };
  var id = String(data.id);
  weg_(t, i);
  ["einkaufsliste", "zutaten", "vorrat"].forEach(function (name) {
    var b = tabelle_(name);
    b.zeilen.forEach(function (z, k) {
      if (!aktiv_(b, z) || String(zelle_(z, b.sp, "lebensmittel_id")) !== id) return;
      if (name === "einkaufsliste" && String(zelle_(z, b.sp, "abgehakt_am")) !== "") return;
      weg_(b, k);
    });
  });
  return { ok: true };
}

// Gibt es dieses Lebensmittel (nicht gelöscht)?
function lebensmittelIds_() {
  var t = tabelle_("lebensmittel");
  var ids = {};
  t.zeilen.forEach(function (z) { if (aktiv_(t, z)) ids[String(zelle_(z, t.sp, "id"))] = true; });
  return ids;
}

// --- 6. EINKAUFSLISTE ---

// Setzt Lebensmittel auf die Liste: eintraege = [{ lebensmittel_id, anzahl, gericht_id, notiz }].
// Steht dasselbe Lebensmittel für dasselbe Gericht (oder einzeln) schon offen darauf, steigt die Anzahl.
function aufListe_(data) {
  var liste = Array.isArray(data.eintraege) ? data.eintraege : [];
  if (!liste.length) return { error: "eingabe", message: "Nichts zum Hinzufügen gewählt." };
  if (liste.length > MAX_AUF_EINMAL_) return { error: "eingabe", message: "Zu viele Einträge auf einmal." };
  var lm = lebensmittelIds_();
  var g = tabelle_("gerichte");
  var sauber = [];
  for (var k = 0; k < liste.length; k++) {
    var e = liste[k] || {};
    var lid = String(e.lebensmittel_id || "");
    if (!lm[lid]) return { error: "fehlt", message: "Ein Lebensmittel gibt es nicht mehr. Bitte neu laden." };
    var anzahl = pruefeZahl_(e.anzahl, 0.5, "Anzahl");
    if (anzahl.fehler) return { error: "eingabe", message: anzahl.fehler };
    var gid = String(e.gericht_id || "");
    if (gid && index_(g, gid) < 0) return { error: "fehlt", message: "Das Gericht gibt es nicht mehr. Bitte neu laden." };
    var notiz = pruefeText_(e.notiz, MAX_.notiz_liste, "Notiz", false);
    if (notiz.fehler) return { error: "eingabe", message: notiz.fehler };
    sauber.push({ lid: lid, anzahl: anzahl.wert, gid: gid, notiz: notiz.wert });
  }

  var t = tabelle_("einkaufsliste");
  sauber.forEach(function (e) {
    var vorhanden = -1;
    t.zeilen.forEach(function (z, i) {
      if (vorhanden < 0 && aktiv_(t, z) && String(zelle_(z, t.sp, "abgehakt_am")) === ""
        && String(zelle_(z, t.sp, "lebensmittel_id")) === e.lid && String(zelle_(z, t.sp, "gericht_id")) === e.gid) vorhanden = i;
    });
    if (vorhanden >= 0) {
      var werte = { anzahl: Math.min(MAX_ZAHL_, zahl_(zelle_(t.zeilen[vorhanden], t.sp, "anzahl")) + e.anzahl) };
      if (e.notiz) werte.notiz = e.notiz;
      aendere_(t, vorhanden, werte);
    } else {
      neu_(t, { lebensmittel_id: e.lid, anzahl: e.anzahl, gericht_id: e.gid, notiz: e.notiz, abgehakt_am: "" });
    }
  });
  return { liste: offeneListe_(t) };
}

// Anzahl oder Notiz eines offenen Eintrags ändern, oder ihn entfernen (entfernen = true)
function listeAendern_(data) {
  var t = tabelle_("einkaufsliste");
  var i = index_(t, data.id);
  if (i < 0 || String(zelle_(t.zeilen[i], t.sp, "abgehakt_am")) !== "") {
    return { error: "fehlt", message: "Dieser Eintrag ist nicht mehr auf der Liste. Bitte neu laden." };
  }
  if (data.entfernen === true) {
    weg_(t, i);
  } else {
    var anzahl = pruefeZahl_(data.anzahl, 0.5, "Anzahl");
    if (anzahl.fehler) return { error: "eingabe", message: anzahl.fehler };
    var notiz = pruefeText_(data.notiz, MAX_.notiz_liste, "Notiz", false);
    if (notiz.fehler) return { error: "eingabe", message: notiz.fehler };
    aendere_(t, i, { anzahl: anzahl.wert, notiz: notiz.wert });
  }
  return { liste: offeneListe_(t) };
}

// Hakt Einträge ab (ids = Liste von ids). Schon abgehakte oder unbekannte bleiben unverändert,
// darum schadet doppeltes Senden nicht. Ist der Vorrat eines Lebensmittels gepflegt, steigt er
// um die Anzahl, und zwar an dem Ort, an dem schon am meisten liegt.
function abhaken_(data) {
  var ids = Array.isArray(data.ids) ? data.ids.map(String) : [];
  if (!ids.length) return { error: "eingabe", message: "Nichts zum Abhaken gewählt." };
  if (ids.length > MAX_AUF_EINMAL_) return { error: "eingabe", message: "Zu viele Einträge auf einmal." };
  var t = tabelle_("einkaufsliste");
  var v = tabelle_("vorrat");
  var abgehakt = 0;
  ids.forEach(function (id) {
    var i = index_(t, id);
    if (i < 0 || String(zelle_(t.zeilen[i], t.sp, "abgehakt_am")) !== "") return;
    aendere_(t, i, { abgehakt_am: jetzt_() });
    abgehakt++;
    var lid = String(zelle_(t.zeilen[i], t.sp, "lebensmittel_id"));
    var bester = -1;
    v.zeilen.forEach(function (z, k) {
      if (!aktiv_(v, z) || String(zelle_(z, v.sp, "lebensmittel_id")) !== lid) return;
      if (bester < 0 || zahl_(zelle_(z, v.sp, "menge")) > zahl_(zelle_(v.zeilen[bester], v.sp, "menge"))) bester = k;
    });
    if (bester >= 0) {
      var neu = zahl_(zelle_(v.zeilen[bester], v.sp, "menge")) + zahl_(zelle_(t.zeilen[i], t.sp, "anzahl"));
      aendere_(v, bester, { menge: Math.min(MAX_ZAHL_, neu) });
    }
  });
  return { abgehakt: abgehakt, liste: offeneListe_(t), vorrat: alleVorraete_(v) };
}

// --- 7. GERICHTE ---

// Gericht mit allen Zutaten auf einmal. Beim Ändern werden die alten Zutaten ersetzt.
function gerichtSpeichern_(data) {
  var name = pruefeText_(data.name, MAX_.name, "einen Namen", true);
  var notiz = pruefeText_(data.notiz, MAX_.notiz_gericht, "Notiz", false);
  var link = pruefeText_(data.link, MAX_.link, "Link", false);
  var fehler = [name, notiz, link].filter(function (p) { return p.fehler; })[0];
  if (fehler) return { error: "eingabe", message: fehler.fehler };
  if (link.wert && !/^https:\/\//i.test(link.wert)) return { error: "eingabe", message: "Der Link muss mit https:// beginnen." };

  var zut = Array.isArray(data.zutaten) ? data.zutaten : [];
  if (zut.length > MAX_ZUTATEN_) return { error: "eingabe", message: "Höchstens " + MAX_ZUTATEN_ + " Zutaten." };
  var lm = lebensmittelIds_();
  var sauber = [];
  var schon = {};
  for (var k = 0; k < zut.length; k++) {
    var lid = String((zut[k] || {}).lebensmittel_id || "");
    if (!lm[lid]) return { error: "fehlt", message: "Eine Zutat gibt es nicht mehr als Lebensmittel. Bitte neu laden." };
    if (schon[lid]) return { error: "eingabe", message: "Eine Zutat steht doppelt da." };
    schon[lid] = true;
    var menge = pruefeZahl_(zut[k].menge, 0.5, "Menge");
    if (menge.fehler) return { error: "eingabe", message: menge.fehler };
    sauber.push({ lebensmittel_id: lid, menge: menge.wert });
  }

  var g = tabelle_("gerichte");
  var id = String(data.id || "");
  var werte = { name: name.wert, notiz: notiz.wert, link: link.wert };
  var i;
  if (!id) {
    i = neu_(g, werte);
    id = String(g.zeilen[i][g.sp.id]);
  } else {
    i = index_(g, id);
    if (i < 0) return { error: "fehlt", message: "Dieses Gericht gibt es nicht mehr. Bitte neu laden." };
    if (veraltet_(g, i, data)) return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Handy). Bitte neu laden." };
    aendere_(g, i, werte);
  }
  var zt = tabelle_("zutaten");
  zt.zeilen.forEach(function (z, k) {
    if (aktiv_(zt, z) && String(zelle_(z, zt.sp, "gericht_id")) === id) weg_(zt, k);
  });
  sauber.forEach(function (s) { neu_(zt, { gericht_id: id, lebensmittel_id: s.lebensmittel_id, menge: s.menge }); });
  var gericht = alleGerichte_().filter(function (x) { return x.id === id; })[0];
  return { gericht: gericht };
}

// Weich löschen mit seinen Zutaten. Lebensmittel bleiben. Offene Einträge auf der Liste bleiben (dann „einzeln“).
function gerichtLoeschen_(data) {
  var g = tabelle_("gerichte");
  var i = index_(g, data.id);
  if (i < 0) return { error: "fehlt", message: "Dieses Gericht gibt es nicht mehr. Bitte neu laden." };
  if (veraltet_(g, i, data)) return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Handy). Bitte neu laden." };
  var id = String(data.id);
  weg_(g, i);
  var zt = tabelle_("zutaten");
  zt.zeilen.forEach(function (z, k) {
    if (aktiv_(zt, z) && String(zelle_(z, zt.sp, "gericht_id")) === id) weg_(zt, k);
  });
  return { ok: true };
}

// --- 8. VORRAT ---

// Menge an einem Ort setzen. Mit id: diese Zeile ändern. Ohne id: gibt es den Ort beim Lebensmittel schon,
// wird seine Menge gesetzt, sonst kommt eine neue Zeile dazu. Menge 0 heißt „gepflegt, gerade nichts da“.
function vorratSpeichern_(data) {
  var lid = String(data.lebensmittel_id || "");
  if (!lebensmittelIds_()[lid]) return { error: "fehlt", message: "Dieses Lebensmittel gibt es nicht mehr. Bitte neu laden." };
  var ort = pruefeText_(data.ort, MAX_.ort, "einen Ort", true);
  if (ort.fehler) return { error: "eingabe", message: ort.fehler };
  var menge = pruefeZahl_(data.menge, 0, "Menge");
  if (menge.fehler) return { error: "eingabe", message: menge.fehler };

  var v = tabelle_("vorrat");
  var i = -1;
  if (data.id) {
    i = index_(v, data.id);
    if (i < 0) return { error: "fehlt", message: "Diesen Vorrat gibt es nicht mehr. Bitte neu laden." };
  } else {
    var klein = ohneSchutz_(ort.wert).toLowerCase();
    v.zeilen.forEach(function (z, k) {
      if (i < 0 && aktiv_(v, z) && String(zelle_(z, v.sp, "lebensmittel_id")) === lid && text_(z, v.sp, "ort").toLowerCase() === klein) i = k;
    });
  }
  if (i >= 0) aendere_(v, i, { ort: ort.wert, menge: menge.wert, lebensmittel_id: lid });
  else neu_(v, { lebensmittel_id: lid, ort: ort.wert, menge: menge.wert });
  return { vorrat: alleVorraete_(v) };
}

function vorratLoeschen_(data) {
  var v = tabelle_("vorrat");
  var i = index_(v, data.id);
  if (i >= 0) weg_(v, i);
  return { vorrat: alleVorraete_(v) };
}

// --- 9. UNI (Etappe 5) ---
// Semester, Stundenplan (jede Woche gleich), Termine (einmalig, mehrtägig oder „einmal anders“), Module.
// Daten und Uhrzeiten stehen als Text (JJJJ-MM-TT, HH:MM). Hat das Sheet doch ein Datum daraus gemacht, wird es hier zurückgewandelt.

// Datum als JJJJ-MM-TT (leer, wenn keins)
function datum_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var t = ohneSchutz_(v).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : "";
}

// Uhrzeit als HH:MM (leer, wenn keine)
function uhr_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, Session.getScriptTimeZone(), "HH:mm");
  var t = ohneSchutz_(v).trim();
  var m = /^(\d{1,2}):(\d{2})/.exec(t);
  return m ? ("0" + m[1]).slice(-2) + ":" + m[2] : "";
}

// Prüft ein Datum aus der App. Liefert { wert } oder { fehler }; leer nur, wenn nicht Pflicht.
function pruefeDatum_(roh, titel, pflicht) {
  var t = String(roh == null ? "" : roh).trim();
  if (!t) return pflicht ? { fehler: "Bitte " + titel + " angeben." } : { wert: "" };
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  var d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  if (!d || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3]) || Number(m[1]) < 2000 || Number(m[1]) > 2100) {
    return { fehler: titel + ": bitte ein gültiges Datum." };
  }
  return { wert: t };
}

// Prüft eine Uhrzeit aus der App (HH:MM, 00:00 bis 23:59)
function pruefeUhr_(roh, titel, pflicht) {
  var t = String(roh == null ? "" : roh).trim();
  if (!t) return pflicht ? { fehler: "Bitte " + titel + " angeben." } : { wert: "" };
  var m = /^(\d{2}):(\d{2})$/.exec(t);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return { fehler: titel + ": bitte als Uhrzeit (zum Beispiel 08:30)." };
  return { wert: t };
}

// Tage zwischen zwei Daten (JJJJ-MM-TT)
function tageZwischen_(a, b) {
  var x = a.split("-"), y = b.split("-");
  return Math.round((Date.UTC(y[0], y[1] - 1, y[2]) - Date.UTC(x[0], x[1] - 1, x[2])) / 86400000);
}

// Ein Wert aus einer festen Liste
function pruefeListe_(roh, liste, titel, vorgabe) {
  var t = String(roh == null ? "" : roh).trim() || vorgabe || "";
  if (liste.indexOf(t) < 0) return { fehler: "Bitte " + titel + " wählen." };
  return { wert: t };
}

// Gibt es diese id (nicht gelöscht) im Blatt? Leer ist erlaubt.
function pruefeVerweis_(t, roh, titel) {
  var id = String(roh == null ? "" : roh).trim();
  if (id && index_(t, id) < 0) return { fehler: titel + " gibt es nicht mehr. Bitte neu laden." };
  return { wert: id };
}

function semesterAus_(t, z) {
  return {
    id: String(zelle_(z, t.sp, "id")),
    name: text_(z, t.sp, "name"),
    beginn: datum_(zelle_(z, t.sp, "beginn")),
    ende: datum_(zelle_(z, t.sp, "ende")),
    vorlesung_beginn: datum_(zelle_(z, t.sp, "vorlesung_beginn")),
    vorlesung_ende: datum_(zelle_(z, t.sp, "vorlesung_ende")),
    geaendert_am: stempel_(zelle_(z, t.sp, "geaendert_am"))
  };
}

function stundeAus_(t, z) {
  return {
    id: String(zelle_(z, t.sp, "id")),
    semester_id: String(zelle_(z, t.sp, "semester_id")),
    tag: zahl_(zelle_(z, t.sp, "tag")),
    von: uhr_(zelle_(z, t.sp, "von")),
    bis: uhr_(zelle_(z, t.sp, "bis")),
    titel: text_(z, t.sp, "titel"),
    art: text_(z, t.sp, "art"),
    ort: text_(z, t.sp, "ort"),
    modul_id: String(zelle_(z, t.sp, "modul_id")),
    notiz: text_(z, t.sp, "notiz"),
    geaendert_am: stempel_(zelle_(z, t.sp, "geaendert_am"))
  };
}

function terminAus_(t, z) {
  return {
    id: String(zelle_(z, t.sp, "id")),
    titel: text_(z, t.sp, "titel"),
    art: text_(z, t.sp, "art"),
    beginn: datum_(zelle_(z, t.sp, "beginn")),
    ende: datum_(zelle_(z, t.sp, "ende")),
    von: uhr_(zelle_(z, t.sp, "von")),
    bis: uhr_(zelle_(z, t.sp, "bis")),
    ort: text_(z, t.sp, "ort"),
    modul_id: String(zelle_(z, t.sp, "modul_id")),
    stunde_id: String(zelle_(z, t.sp, "stunde_id")),
    notiz: text_(z, t.sp, "notiz"),
    geaendert_am: stempel_(zelle_(z, t.sp, "geaendert_am"))
  };
}

function modulAus_(t, z) {
  var ects = String(zelle_(z, t.sp, "ects")).trim();
  return {
    id: String(zelle_(z, t.sp, "id")),
    name: text_(z, t.sp, "name"),
    kuerzel: text_(z, t.sp, "kuerzel"),
    bereich: text_(z, t.sp, "bereich"),
    ects: ects === "" ? null : zahl_(ects),
    status: text_(z, t.sp, "status") || "offen",
    semester_id: String(zelle_(z, t.sp, "semester_id")),
    notiz: text_(z, t.sp, "notiz"),
    geaendert_am: stempel_(zelle_(z, t.sp, "geaendert_am"))
  };
}

var UNI_LESEN_ = { semester: semesterAus_, stundenplan: stundeAus_, termine: terminAus_, module: modulAus_ };

// Alles für den Reiter Uni in einer Antwort
function uni_() {
  var d = {};
  Object.keys(UNI_LESEN_).forEach(function (name) {
    var t = tabelle_(name);
    d[name] = t.zeilen.filter(function (z) { return aktiv_(t, z); }).map(function (z) { return UNI_LESEN_[name](t, z); });
  });
  var ue = tabelle_("uni_einstellungen");
  var ziel = ECTS_ZIEL_;
  ue.zeilen.forEach(function (z) {
    if (String(zelle_(z, ue.sp, "name")).trim() === "ects_ziel" && zahl_(zelle_(z, ue.sp, "wert")) > 0) ziel = zahl_(zelle_(z, ue.sp, "wert"));
  });
  d.ects_ziel = ziel;
  return d;
}

// Prüft einen Eintrag je Blatt. Liefert { werte } oder { fehler }.
function pruefeUni_(blatt, e, id) {
  var p = {}, fehler;
  var erster = function (liste) { return liste.filter(function (x) { return x.fehler; })[0]; };
  if (blatt === "semester") {
    p.name = pruefeText_(e.name, UNI_MAX_.semester, "einen Namen", true);
    p.beginn = pruefeDatum_(e.beginn, "den Semesterbeginn", true);
    p.ende = pruefeDatum_(e.ende, "das Semesterende", true);
    p.vorlesung_beginn = pruefeDatum_(e.vorlesung_beginn, "den Vorlesungsbeginn", true);
    p.vorlesung_ende = pruefeDatum_(e.vorlesung_ende, "das Vorlesungsende", true);
    fehler = erster([p.name, p.beginn, p.ende, p.vorlesung_beginn, p.vorlesung_ende]);
    if (fehler) return fehler;
    var dauer = tageZwischen_(p.beginn.wert, p.ende.wert);
    if (dauer < 1 || dauer > 366) return { fehler: "Das Semesterende muss nach dem Beginn liegen (höchstens ein Jahr)." };
    if (p.vorlesung_beginn.wert < p.beginn.wert || p.vorlesung_ende.wert > p.ende.wert || p.vorlesung_ende.wert < p.vorlesung_beginn.wert) {
      return { fehler: "Die Vorlesungszeit muss im Semester liegen und darf nicht vor ihrem Beginn enden." };
    }
    var t = tabelle_("semester");
    var klein = ohneSchutz_(p.name.wert).toLowerCase();
    var doppelt = t.zeilen.some(function (z) {
      return aktiv_(t, z) && String(zelle_(z, t.sp, "id")) !== id && text_(z, t.sp, "name").toLowerCase() === klein;
    });
    if (doppelt) return { fehler: "Ein Semester mit diesem Namen gibt es schon." };
  } else if (blatt === "stundenplan") {
    p.semester_id = pruefeVerweis_(tabelle_("semester"), e.semester_id, "Das Semester");
    if (!p.semester_id.fehler && !p.semester_id.wert) p.semester_id = { fehler: "Bitte ein Semester wählen." };
    var tag = Number(e.tag);
    p.tag = Math.floor(tag) === tag && tag >= 1 && tag <= 7 ? { wert: tag } : { fehler: "Bitte einen Wochentag wählen." };
    p.von = pruefeUhr_(e.von, "die Anfangszeit", true);
    p.bis = pruefeUhr_(e.bis, "die Endzeit", true);
    p.titel = pruefeText_(e.titel, UNI_MAX_.titel, "einen Titel", true);
    p.art = pruefeListe_(e.art, UNI_ARTEN_STUNDE_, "eine Art");
    p.ort = pruefeText_(e.ort, UNI_MAX_.ort, "Raum oder Strecke", false);
    p.modul_id = pruefeVerweis_(tabelle_("module"), e.modul_id, "Das Modul");
    p.notiz = pruefeText_(e.notiz, UNI_MAX_.notiz, "Notiz", false);
    fehler = erster([p.semester_id, p.tag, p.von, p.bis, p.titel, p.art, p.ort, p.modul_id, p.notiz]);
    if (fehler) return fehler;
    if (p.bis.wert <= p.von.wert) return { fehler: "Die Endzeit muss nach der Anfangszeit liegen." };
    if (!id) {
      var sp = tabelle_("stundenplan");
      var anzahl = sp.zeilen.filter(function (z) { return aktiv_(sp, z) && String(zelle_(z, sp.sp, "semester_id")) === p.semester_id.wert; }).length;
      if (anzahl >= UNI_MAX_STUNDEN_) return { fehler: "Höchstens " + UNI_MAX_STUNDEN_ + " Einträge je Semester." };
    }
  } else if (blatt === "termine") {
    p.titel = pruefeText_(e.titel, UNI_MAX_.titel, "einen Titel", true);
    p.art = pruefeListe_(e.art, UNI_ARTEN_TERMIN_, "eine Art");
    p.beginn = pruefeDatum_(e.beginn, "den ersten Tag", true);
    p.ende = pruefeDatum_(e.ende, "Bis", false);
    p.von = pruefeUhr_(e.von, "Von", false);
    p.bis = pruefeUhr_(e.bis, "Bis (Uhrzeit)", false);
    p.ort = pruefeText_(e.ort, UNI_MAX_.ort, "Raum oder Strecke", false);
    p.modul_id = pruefeVerweis_(tabelle_("module"), e.modul_id, "Das Modul");
    p.stunde_id = pruefeVerweis_(tabelle_("stundenplan"), e.stunde_id, "Der Eintrag im Stundenplan");
    p.notiz = pruefeText_(e.notiz, UNI_MAX_.notiz, "Notiz", false);
    fehler = erster([p.titel, p.art, p.beginn, p.ende, p.von, p.bis, p.ort, p.modul_id, p.stunde_id, p.notiz]);
    if (fehler) return fehler;
    if (p.ende.wert === p.beginn.wert) p.ende.wert = "";
    if (p.ende.wert) {
      var tage = tageZwischen_(p.beginn.wert, p.ende.wert);
      if (tage < 0 || tage > 366) return { fehler: "Der letzte Tag darf nicht vor dem ersten liegen (höchstens ein Jahr)." };
    }
    if (Boolean(p.von.wert) !== Boolean(p.bis.wert)) return { fehler: "Bitte beide Uhrzeiten angeben oder keine (ganztägig)." };
    if (p.von.wert && !p.ende.wert && p.bis.wert <= p.von.wert) return { fehler: "Die Endzeit muss nach der Anfangszeit liegen." };
    if (p.stunde_id.wert && p.ende.wert) return { fehler: "„Einmal anders“ gilt nur für einen Tag." };
  } else if (blatt === "module") {
    p.name = pruefeText_(e.name, UNI_MAX_.modul, "einen Namen", true);
    p.kuerzel = pruefeText_(e.kuerzel, UNI_MAX_.kuerzel, "Kürzel", false);
    p.bereich = pruefeText_(e.bereich, UNI_MAX_.bereich, "Bereich", false);
    var roh = String(e.ects == null ? "" : e.ects).trim();
    var n = Number(roh.replace(",", "."));
    p.ects = roh === "" ? { wert: "" } : (isFinite(n) && n >= 0 && n <= 60 && Math.round(n * 2) === n * 2
      ? { wert: n } : { fehler: "ECTS bitte als Zahl von 0 bis 60 (halbe erlaubt)." });
    p.status = pruefeListe_(e.status, UNI_STATUS_, "einen Stand", "offen");
    p.semester_id = pruefeVerweis_(tabelle_("semester"), e.semester_id, "Das Semester");
    p.notiz = pruefeText_(e.notiz, UNI_MAX_.notiz, "Notiz", false);
    fehler = erster([p.name, p.kuerzel, p.bereich, p.ects, p.status, p.semester_id, p.notiz]);
    if (fehler) return fehler;
  } else {
    return { fehler: "Unbekanntes Blatt." };
  }
  var werte = {};
  Object.keys(p).forEach(function (k) { werte[k] = p[k].wert; });
  return { werte: werte };
}

// Neu (ohne id) oder ändern (mit id und geaendert_am). data = { blatt, eintrag }. Antwort: alle Uni-Daten.
function uniSpeichern_(data) {
  var blatt = String(data.blatt || "");
  if (!UNI_LESEN_[blatt]) return { error: "eingabe", message: "Unbekanntes Blatt." };
  var e = data.eintrag || {};
  var id = String(e.id || "");
  var g = pruefeUni_(blatt, e, id);
  if (g.fehler) return { error: "eingabe", message: g.fehler };
  var t = tabelle_(blatt);
  if (!id) {
    neu_(t, g.werte);
  } else {
    var i = index_(t, id);
    if (i < 0) return { error: "fehlt", message: "Diesen Eintrag gibt es nicht mehr. Bitte neu laden." };
    if (veraltet_(t, i, e)) return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Gerät). Bitte neu laden." };
    aendere_(t, i, g.werte);
  }
  return uni_();
}

// Weich löschen. Ein Semester nimmt seinen Stundenplan mit, ein Stundenplan-Eintrag seine Termine „einmal anders“.
// Ein Modul oder Semester wird bei den anderen Einträgen nur ausgetragen. data = { blatt, id, geaendert_am }.
function uniLoeschen_(data) {
  var blatt = String(data.blatt || "");
  if (!UNI_LESEN_[blatt]) return { error: "eingabe", message: "Unbekanntes Blatt." };
  var t = tabelle_(blatt);
  var i = index_(t, data.id);
  if (i < 0) return { error: "fehlt", message: "Diesen Eintrag gibt es nicht mehr. Bitte neu laden." };
  if (veraltet_(t, i, data)) return { error: "geaendert", message: "Wurde inzwischen geändert (zum Beispiel am anderen Gerät). Bitte neu laden." };
  var id = String(data.id);
  weg_(t, i);

  // In einem Blatt alle aktiven Zeilen mit spalte = wert: löschen oder die Spalte leeren
  function jeZeile(name, spalte, werte, loeschen) {
    var b = tabelle_(name);
    var weg = [];
    b.zeilen.forEach(function (z, k) {
      if (!aktiv_(b, z) || !werte[String(zelle_(z, b.sp, spalte))]) return;
      if (loeschen) { weg.push(String(zelle_(z, b.sp, "id"))); weg_(b, k); }
      else { var w = {}; w[spalte] = ""; aendere_(b, k, w); }
    });
    return weg;
  }
  var eins = {};
  eins[id] = true;
  if (blatt === "semester") {
    var stunden = {};
    jeZeile("stundenplan", "semester_id", eins, true).forEach(function (s) { stunden[s] = true; });
    jeZeile("termine", "stunde_id", stunden, true);
    jeZeile("module", "semester_id", eins, false);
  } else if (blatt === "stundenplan") {
    jeZeile("termine", "stunde_id", eins, true);
  } else if (blatt === "module") {
    jeZeile("stundenplan", "modul_id", eins, false);
    jeZeile("termine", "modul_id", eins, false);
  }
  return uni_();
}
