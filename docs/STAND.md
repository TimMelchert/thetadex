# STAND – Thetadex

**Diese Datei ist die einzige Doku-Datei für den Agenten:** Arbeitsregeln, Aufbau, aktueller Stand, Festlegungen und Pläne.
Lies sie zuerst, bei jeder Aufgabe. `CLAUDE.md` im Hauptordner zeigt nur hierher.
Für eine neue Etappe kommt ein eigener Plan dazu (`docs/PLAN-ETAPPE-<n>.md`); am Ende der Etappe wird er hier eingearbeitet und gelöscht.

- Version der App: **0.5.1** (gleich in `js/config.js` und `sw.js`: beide Dateien prüfen; die Dateien gibt es ab Schritt 0.1)
- Repo: https://github.com/TimMelchert/thetadex (öffentlich)
- Seite (App): https://timmelchert.github.io/thetadex/
- Etappe 2 „Bestehendes umziehen“ ist fertig (30.10.2026). Offen ist nur der Umstieg von Hand (3.2).
- Etappe 3 „Besitz“ ist fertig (30.10.2026).
- Etappe 4 „Einkauf und Essen“ ist fertig (30.10.2026).
- Etappe 5 „Uni“ läuft: Plan `docs/PLAN-ETAPPE-5.md` (Schritt 5.0).
- Nächster Schritt: Schritt 5.1 (Blätter, Skript, Semester und Stundenplan).

Inhalt: 1 Arbeitsregeln · 2 Aufbau · 3 Aktueller Stand und Offen · 4 Festlegungen je Bereich · 5 Technik-Merkzettel ·
6 Dateiübersicht · 7 Pläne · 8 Geschichte · Anhang A CLAUDE.md · Anhang B Projektanweisungen

---

## 1. Arbeitsregeln

### 1.1 Worum es geht und mit wem du arbeitest

Eine persönliche App (PWA) für eine Person, am Handy und am PC. Einkauf und Uni teilt sie mit ihrer Partnerin oder ihrem Partner, DSA-Bögen per Link. Sie führt zwei bestehende Apps zusammen
(Tracking Leben, Finanzmanager) und bekommt neue Reiter: Döner-Bewertung (öffentlich), DSA-Charakterbögen, Einkaufsliste und Essensideen,
Besitz-Inventar, Uni mit Stundenplan. Die Daten liegen in Google Sheets der Person, nicht im Repo.

Die Person, die mit dir arbeitet, ist keine Programmiererin und kein Programmierer. Sie arbeitet im Browser
(GitHub-Webseite, Google Sheet, Apps-Script-Editor). Die Browser-Konsole ist bei ihr gesperrt: Fehler müssen in der App selbst sichtbar sein.
Sie prüft jede Änderung auf Handy und PC und übernimmt Änderungen am Google-Skript von Hand.

### 1.2 Grundsätze (gelten bei jeder Entscheidung)

1. **Datenschutz zuerst.** So wenig Daten wie möglich speichern, nur was die App wirklich braucht.
   Keine Tracker, keine Cookies, keine fremden Dienste ohne Grund. Das Repo ist öffentlich: Darin steht nichts Persönliches.
   Die Tracking-Daten sind sehr privat (Gesundheit, Beziehung). Neue Daten über andere Personen nur mit Begründung im Plan.
2. **Sicherheit immer mitdenken.** Jede neue Funktion: Wer darf das sehen? Wer darf das ändern? Was passiert mit bösen Eingaben?
   Die Regeln in 1.5 und 2.2 gelten immer.
3. **Effektiv statt kompliziert.** Die einfachste Lösung, die das Ziel erreicht. Lieber wenige Dateien und wenig Code,
   als viele Schalter und Sonderfälle. Bestehende Bausteine wiederverwenden, bevor du neue baust.
   Wenn zwei Wege gleich gut sind: der mit weniger Code und weniger Arbeit für die Person.
4. **Nichts geht verloren.** Bestehende Sheets, Blätter und Spalten werden nicht umbenannt, verschoben oder gelöscht,
   solange der Plan es nicht ausdrücklich verlangt. Alte Apps und alte Script-Adressen werden erst abgeschaltet,
   wenn die Person mit der neuen App zufrieden ist.
5. **Ausnahmen** gibt es nur, wenn die Person sie entschieden hat. Jede Ausnahme steht in Abschnitt 4 mit Grund.
   Siehst du einen Konflikt zwischen den Grundsätzen und einem Wunsch, schreibe ihn unter „Rückfragen“ und baue den sicheren Weg.

### 1.3 Sprache und Ton

- Schreibe alles auf Deutsch in einfachen Worten: Antworten, Commit-Nachrichten, Pull-Request-Texte, Kommentare im Code.
- Kurze Sätze. Keine Fachwörter ohne Erklärung.
- Nenne immer Dateipfade und die Schrittnummer (zum Beispiel „1.4a“).
- Sage kurz, wo die Person klicken muss (zum Beispiel „GitHub → Settings → Pages“).
- Stelle alle Rückfragen gesammelt am Ende deiner Antwort, nicht zwischendurch.
- Am Ende jedes Schritts steht eine Prüfliste für die Person.
- Anmerkungen zur Anzeige (Aussehen, Texte) sammelt die Person selbst und meldet sie gesammelt. Frage dazu nicht nach.

### 1.4 So arbeitest du an einer Aufgabe

1. Lies diese Datei, dann (solange es ihn gibt) den Plan der laufenden Etappe, dann genau die Dateien, die du für den Schritt brauchst.
2. Rate nie. Fehlt eine Datei, widersprechen sich Stand und Code, oder wirkt der Stand veraltet: Schreibe es klar in den
   Pull-Request-Text und arbeite nur an dem weiter, was sicher ist.
3. Prüfe zuerst `js/config.js` (VERSION) gegen den Kopf dieser Datei. Weichen sie ab, melde es.
4. Arbeite auf einem eigenen Zweig. **Ein Schritt = ein Zweig = ein Pull Request.** Nie direkt auf `main`.
5. Ändere nur, was der Schritt verlangt. Keine Aufräumaktionen nebenbei, keine Umbenennungen, kein Umformatieren.
6. Bestehende Dateien bearbeitest du gezielt, du schreibst sie nicht komplett neu.
   Ganze Dateien nur, wenn sie neu sind oder mehr als etwa die Hälfte neu ist.
7. Aktualisiere am Ende diese Datei: Version im Kopf, nächster Schritt, Abschnitt 3 (Stand und Offen), bei Bedarf Festlegungen (4),
   Merkzettel (5), Dateiübersicht (6) und eine kurze Zeile in der Geschichte (8). Keine langen Berichte je Schritt:
   Einzelheiten stehen im Pull Request.
8. Prüfe deine Arbeit (1.7), dann öffne den Pull Request mit dem Text aus 1.8.

### 1.5 Harte Regeln

- **Version:** Bei jeder Änderung `VERSION` in `js/config.js` UND in `sw.js` gemeinsam hochzählen. Beide müssen am Ende exakt gleich sein.
  Vor 1.0: Etappe = mittlere Zahl (0.1.0, 0.2.0 …), Schritte und Nachbesserungen den letzten Teil (0.1.0 → 0.1.1).
  Die erste Zahl ändert sich nur, wenn die Person es sagt. Jede Nachbesserung zählt hoch, auch in einem noch offenen Pull Request.
- **Script-Adressen nie im Repo.** Die Adressen der Apps Scripts gibt die Person bei der Ersteinrichtung in der App ein.
  Die App speichert sie nur im Gerät (localStorage). `js/config.js` enthält nur VERSION und `features`, keine Adressen.
- **Persönliches nie im Repo:** keine Namen von Personen, keine Tracking-Felder, keine Zwecke oder Kategorien mit Namen.
  Solche Listen stehen im Blatt `Einstellungen` des jeweiligen Sheets. Die App lädt sie nach der Anmeldung.
- **Keine Geheimnisse im Repo:** keine PINs, kein Passwort, keine Hashes, keine Sheet-Links, keine privaten Links.
  Das Passwort steht nur in den Skripteigenschaften (`APP_PIN`). Das Repo ist öffentlich lesbar: Alles darin gilt als veröffentlicht.
- **Neue Dateien** (JS, CSS, Bilder), die zur App-Hülle gehören, trägst du in `sw.js` in die Liste `HUELLE` ein.
  Gelöschte Dateien trägst du dort wieder aus. Prüfe am Ende, dass jede Datei in `HUELLE` existiert.
- **Texte aus Daten nur mit `textContent`** (oder einem `el()`-Helfer mit `text:`) anzeigen. Nie `innerHTML` mit Daten.
- **Links aus Daten** nur öffnen, wenn sie mit `https://` (oder `http://`) beginnen (Helfer `sichereUrl`).
- **Kein Build, keine Pakete, kein Framework.** Reines HTML, CSS und JavaScript mit ES-Modulen. Relative Pfade.
  Keine externen Skripte oder Schriften laden. Ausnahmen nur nach Abschnitt 4 (Chart.js als lokale Datei).
- **Content-Security-Policy** als `<meta>` in `index.html` von Anfang an. Kein Inline-Skript, kein `style="…"` im HTML.
- **Farben** nur über Variablen in `css/base.css`. Hell- und Dunkelmodus (`prefers-color-scheme` oder Wahl unter Einstellungen, `data-aussehen` am `<html>`): Jede Farbe braucht einen hellen und einen dunklen Wert. Die dunklen Werte stehen in `css/base.css` zweimal (für „Dunkel“ und für „Wie Gerät“); beide Blöcke gleich halten. Die Oberfläche ist schwarz-weiß,
  Farbe gibt es nur als Bereichsfarbe der sieben Reiter. Werte siehe Abschnitt 4 „Erscheinungsbild“.
- **Keine Offline-Schreibzugriffe.** Schreiben geht nur mit Verbindung. Schlägt ein Senden fehl, bleibt die Eingabe im Formular
  stehen und eine Meldung erscheint. Erfolg wird nur angezeigt, wenn das Skript ihn bestätigt hat.
- Tippflächen am Handy mindestens 44 px hoch. Am Handy Karten statt Tabellen.

### 1.6 Google-Skripte (`apps-script/<bereich>/*.gs`)

Es gibt mehrere Skripte, jedes an sein eigenes Sheet gebunden (Abschnitt 2.2).
Du kannst die Skripte nicht ausführen und die Sheets nicht ändern. Das macht die Person von Hand. Darum gilt:

- Ändere `.gs`-Dateien im Repo nur, wenn der Schritt es verlangt.
- Die Skripte suchen Spalten über ihre Namen in einer Kopfzeile. Neue Spalten im Sheet müssen **vor** dem Skript da sein.
  Bestehende Blätter und Spaltennamen nie umbenennen (1.2, Punkt 4).
- Beim Schreiben ins Sheet werden Texte mit `bereinigeText_` geschützt (Zeilenumbrüche weg, Länge begrenzt,
  führendes `=`, `+`, `-`, `@` mit Hochkomma). Jeder Schreibzugriff läuft mit `LockService`.
- **Wenn sich eine `.gs`-Datei oder ein Sheet ändert, schreibst du in den Pull-Request-Text einen Abschnitt
  „Von Hand zu erledigen“** mit genau diesen Punkten, in dieser Reihenfolge:
  1. Welches Sheet betroffen ist und welche Spalten oder Tabs neu angelegt werden (Namen zum Abtippen, in welcher Zeile, Reihenfolge).
  2. Welche `.gs`-Dateien sich geändert haben. Die Person kopiert dann die **ganze Datei** aus dem Repo in den
     Apps-Script-Editor des richtigen Sheets (Datei im Repo öffnen → „Raw“ → alles kopieren → im Editor ersetzen).
  3. Welche Funktion im Editor einmal ausgeführt wird und was im Protokoll stehen soll.
  4. Danach: Bereitstellen → Bereitstellungen verwalten → Stift → „Neue Version“ → Bereitstellen.
     (Eine **neue Bereitstellung** mit neuer Adresse nur, wenn der Plan es verlangt.)
- Gibt es keine Änderung an Sheet oder Skript, schreibe ausdrücklich: „Sheet und Skript bleiben unverändert.“
- Erfahrung: Kennt die App eine neue Aktion nicht („Unbekannte Aktion“), ist meist eine alte Fassung von `Code.gs` bereitgestellt.
  Dann `Code.gs` ersetzen und eine neue Version bereitstellen.

### 1.7 Prüfen vor dem Pull Request

Du hast keinen Browser auf dem Gerät der Person. Prüfe darum, was du kannst, und sage, was du nicht prüfen konntest.

1. Syntax: Für jede geänderte oder neue `.js`-Datei eine temporäre Kopie mit Endung `.mjs` anlegen und
   `node --check <datei>.mjs` ausführen. Für `.gs`-Dateien eine Kopie mit Endung `.js` prüfen. Die Kopien nicht einchecken.
2. Importe: Jeder `import`-Pfad zeigt auf eine vorhandene Datei, und jeder importierte Name wird dort auch exportiert.
3. `sw.js`: Jede Datei in `HUELLE` existiert. Jede neue JS- oder CSS-Datei steht in `HUELLE`.
4. Version: `js/config.js` und `sw.js` haben dieselbe VERSION.
5. Keine Reste: Suche nach `innerHTML`, `console.log`, `debugger`, `TODO` in deinen Änderungen.
6. Keine Geheimnisse und nichts Persönliches: Suche in deinen Änderungen nach `script.google.com`, PIN-artigen Zahlen und Personennamen.
7. Datenschutz und Sicherheit: Neue Daten, neue Aktionen, neue Adressen nach außen? Dann kurz im Pull Request begründen (1.2).
8. Diese Datei ist aktualisiert.
9. Bei sichtbaren Änderungen: im Testbrowser die betroffenen Seiten bei Handy- (390 px) und PC-Breite (1280 px).

### 1.8 Pull-Request-Text (immer so aufbauen)

```
## Schritt <Nummer>: <Titel>
Version: <alt> → <neu>

### Was ist neu
- (einfache Sätze)

### Geänderte Dateien
- Pfad: kurz, was sich ändert

### Datenschutz und Sicherheit
- (neue Daten, neue Rechte, neue Adressen nach außen; oder: „Keine Änderung.“)

### Sheet und Skript
Sheet und Skript bleiben unverändert.   (oder: Abschnitt „Von Hand zu erledigen“, siehe 1.6)

### Prüfen (Liste für die Person, am Handy und am PC)
1. ...

### Nicht geprüft / unsicher
- (ehrlich auflisten)

### Rückfragen
1. ...
```

Hinweis für die Person in jeder Prüfliste: Nach dem Merge etwa eine Minute warten, bis GitHub Pages fertig ist
(GitHub → Actions: grüner Haken), die Seite neu laden (bei „Neue Version da“ auf „Jetzt neu laden“ tippen, sobald es das gibt),
unter „Info“ die Version prüfen.

### 1.9 Was du nicht tust

- Nicht auf `main` pushen, keinen Pull Request selbst mergen.
- Keine Dateien löschen, die der Plan nicht ausdrücklich nennt.
- Keine Daten, PINs oder Geheimnisse erfinden, abfragen oder einchecken.
- Keine neuen Bibliotheken, keinen Build, keine Tracker, keine Cookies.
- Keine Funktionen bauen, die nicht im Plan stehen. Ideen schreibst du unter „Rückfragen“.
- Keine echten Personennamen oder Fotos mit Personen in Beispieldaten.
- Die alten Repos (`Tracking-Leben`, `App-Finazen-Tabelle`) nicht ändern. Sie laufen bis zum Umstieg weiter.

### 1.10 Prüfungen

- **Erst Bericht, dann bauen.** Eine Prüfung (Sicherheit, Datenschutz, Geschwindigkeit, Ungenutztes, Barrierefreiheit) ändert die App nicht.
  Der Bericht kommt als Datei in die Projektdateien im Chat (`pruefung/<thema>-bericht.md`), nie ins Repo. Je Fund: Ort, wie schlimm,
  wer betroffen ist, Vorschlag, Aufwand. Die Person gibt frei, was gebaut wird. Sicherheitsfunde stehen nur im Bericht, bis sie behoben sind.
- **Maßstäbe:** Barrierefreiheit nach WCAG 2.2, Stufe AA. Die Content-Security-Policy darf keine Funktion blockieren.
- **Tests gegen das echte Skript** nur nach Absprache: wenige Anfragen, nie nach PINs fragen, nichts löschen oder überschreiben,
  was nicht vom Test stammt. Testeinträge löscht die Person danach. Finanz-Buchungen nie testweise anlegen.
- **Nicht vom Agenten prüfbar:** echte Ladezeiten am Handy, Freigaben in Google und GitHub, Bildschirmleser auf echten Geräten,
  Icon auf dem echten Startbildschirm. Das prüft die Person.

---

## 2. Aufbau

### 2.1 Oberfläche

- Statische PWA auf GitHub Pages (öffentliches Repo, kostenlos; Quelle: Zweig `main`, Ordner `/`).
  Repo-Bereiche: `index.html`, `manifest.webmanifest`, `sw.js`, `docs/`, `icons/`,
  `css/` (base, layout, components), `js/` (app, config, api, store, ui/, views/), `vendor/` (lokale Bibliotheken, siehe 4),
  `apps-script/` (Code aller Google-Skripte, je Bereich ein Ordner).
- Hash-Routing: `#/tracking`, `#/doener`, `#/finanzen`, `#/dsa`, `#/einkauf`, `#/besitz`, `#/uni`, `#/einstellungen`, `#/info` (die alte Adresse `#/einrichtung` leitet weiter).
  Dazu ohne Anmeldung `#/bogen/<skript>/<schluessel>` (geteilter Charakterbogen, nur lesen, siehe 4 „DSA teilen“)
  und `#/doener/<skript>` (öffentliche Döner-Bewertung, siehe 4 „Döner öffentlich“).
  Unbekannte Adressen zeigen „Seite nicht gefunden“.
- Startseite: Kacheln aller sichtbaren Reiter. Eine Heute-Übersicht (Termine, Einkauf) kommt in Etappe 7.
- Eine Ansicht ist `js/views/<name>.js` mit `render(container, ctx)`. Welche Reiter es gibt, steht in `js/config.js` (`features`).
  Sichtbar ist ein Reiter nur, wenn die Adresse seines Skripts eingetragen ist (`BEREICHE[].skript`, ab 0.4.8): Tracking `tracking`, Finanzen `finanzen`,
  DSA `dsa` (gibt es erst ab Etappe 6), Einkauf und Uni `gemeinsam`, Besitz `leben`. Döner ist immer da.
- PC und Handy: Reiterleiste unten am Handy, Seitenleiste links am PC (ab 768 px). Einstellungen (Zahnrad, am Handy ohne Text) und Info in der Kopfzeile.
- Name, Icon und Farben: Thetadex, siehe Abschnitt 4 „Erscheinungsbild“. Die Kopfzeile zeigt immer das vollständige Icon (Karte mit Reitern).
- **Einstellungen** (`#/einstellungen`, bis 0.3.1 „Einrichtung“): Aussehen (Hell, Dunkel, Wie Gerät), Passwort und die Script-Adressen je Bereich. Gespeichert nur im Gerät.
  Ein Knopf „Abmelden“ löscht alles wieder aus dem Gerät.

### 2.2 Schnittstelle, Zugang und Sicherheit

- Je Bereich ein Google Apps Script als Web-App (Ausführen als Besitzer, Zugriff: Jeder), an sein Sheet gebunden:
  | Bereich | Skript | Sheet |
  | --- | --- | --- |
  | Tracking | `apps-script/tracking/Code.gs` | bestehendes Tracking-Sheet, Blatt `Tabellenblatt1`, Kopfzeile 4 |
  | Finanzen | `apps-script/finanzen/Code.gs` | bestehendes Finanz-Sheet (Blätter je Konto, `Übersicht`, `Analyse Monate`), Daten ab Zeile 8 |
  | Besitz | `apps-script/leben/Code.gs` | neues Sheet „Leben“ (ab Etappe 3), nur die Person |
  | Einkauf und Essen, Uni | `apps-script/gemeinsam/Code.gs` | neues Sheet „Gemeinsam“ (ab Etappe 4), Person und Partner*in |
  | DSA und DnD | `apps-script/dsa/Code.gs` | neues Sheet „DSA“ (ab Etappe 6), Bögen per Link lesbar |
  | Döner | `apps-script/doener/Code.gs` | neues Sheet „Döner“ (ab Etappe 1), öffentlich lesen und bewerten |
- **Warum eigene Sheets statt einem:** Die Sheets sind nach „Wer darf das sehen?“ getrennt. Ein Fehler in der Freigabe
  eines Bogens, beim öffentlichen Bewerten oder im Partner-Zugang kann so nie Besitz, Tracking oder Finanzen verraten.
- Aufruf per POST mit JSON als `text/plain`. Das Feld für die Aktion heißt `action` (wie im bestehenden Finanz-Skript).
  Antwort immer JSON: bei Erfolg die Daten, bei Fehler `{error: "<code>", message: "<Text für die Person>"}`.
  Die App zeigt Erfolg nur, wenn eine Antwort ohne `error` kam.
- **Zugang:** Eine Person, ein Passwort für alle Skripte (mindestens 12 Zeichen, besser ein Satz aus mehreren Wörtern).
  Jedes Skript liest es aus der Skripteigenschaft `APP_PIN` und vergleicht es bei jedem Aufruf (`pruefePin_`).
  Nach 5 Fehlversuchen 15 Minuten Sperre (`CacheService`). Kein Token, keine Einzelkonten (1.2, Punkt 3).
- **Partner-Zugang** (nur Skript `gemeinsam`): ein zweites Passwort in der Skripteigenschaft `PARTNER_PIN`.
  Damit darf die Partnerin oder der Partner Einkauf und Essen lesen und ändern und Uni nur lesen. Alle anderen Skripte kennen `PARTNER_PIN` nicht.
  Die Aktion `ping` antwortet mit der Rolle (`person` oder `partner`). Die App zeigt danach nur die erlaubten Reiter.
  Die Rechte prüft immer das Skript, nie nur die App.
- **Ohne Passwort** gibt nur das Skript `dsa` etwas heraus (genau einen Bogen, nur lesen, nur mit seinem Freigabe-Schlüssel)
  und das Skript `doener` (Bewertungen lesen und neue anlegen, nie ändern oder löschen).
- **Sonst liefert ohne Passwort kein Skript Daten.** `doGet` antwortet nur mit dem Namen der Schnittstelle.
- **Freigabe der Sheets:** Die Sheets werden mit niemandem geteilt. Wer ein Sheet bearbeiten darf, sieht auch das Skript
  und seine Skripteigenschaften (also die Passwörter). Geteilt wird nur über die App.
- **Schutz vor Formeln und bösen Eingaben:** Jeder Text, der ins Sheet geht, läuft durch `bereinigeText_`.
  Das Skript prüft Art, Länge und erlaubte Werte jedes Felds (Beispiel: `pruefeEingabe_` im Finanz-Skript).
- **Content-Security-Policy:** Skripte und Stile nur von der eigenen Seite. Verbindungen nur zu
  `https://script.google.com` und `https://script.googleusercontent.com` (Weiterleitung der Skript-Antwort).
  Neue Adressen nach außen hier eintragen und begründen.
- Löschen in neuen Blättern ist weich (`geloescht = TRUE`). Bestehende Sheets bleiben in ihrem Aufbau.

### 2.3 Google Sheets (Tabs)

- **Bestehende Sheets** (Tracking, Finanzen) behalten ihren Aufbau. Neu kommt je ein Blatt `Einstellungen` dazu
  (Tracking: Felder mit Gruppe, Art und Vorgabewert; Finanzen: Zwecke, Kategorien, Rückzahlungs-Personen).
- **Neues Sheet** für die neuen Reiter: Kopfzeile in Zeile 1 (klein, ohne Umlaute). Alle Daten-Blätter haben zusätzlich
  `id, erstellt_am, geaendert_am, geloescht`. Die genauen Spalten legt der Plan der jeweiligen Etappe fest. Geplante Blätter:
  | Sheet | Blätter |
  | --- | --- |
  | Leben | `besitz` (Orte und Kategorien stehen als Text darin, kein Blatt `orte`, Entscheidung 30.10.2026) |
  | Gemeinsam | `lebensmittel`, `vorrat`, `gerichte`, `zutaten` (Gericht ↔ Lebensmittel mit Menge), `einkaufsliste` (Spalten in 4 „Einkauf“); ab Etappe 5 `semester`, `stundenplan`, `termine`, `module`, `uni_einstellungen` |
  | Döner | `bewertungen` (`laden, doener, yufka, pommes, ladennote, begruendung` + Standardspalten), `laeden` (`name`),
    `kriterien` (`teil, name`, die Person pflegt sie), `details` (`bewertung_id, teil, kriterium, wert, begruendung`) |
  | DSA | `boegen` (ein Bogen je Zeile, Abschnitte als JSON-Spalten), `verlauf` (Geld, AP, AsP, LeP), `gegenstaende`, `bilder` |

---

## 3. Aktueller Stand und Offen

### 3.1 Stand

- Zwei alte Apps laufen noch weiter, bis zum Umstieg (3.2): Repos `TimMelchert/Tracking-Leben` und `TimMelchert/App-Finazen-Tabelle` (öffentlich, GitHub Pages).
- Skript-Code beider Apps liegt als Sicherung in den Projektdateien (`apps-script-backup/`).
  - Finanzen: Passwort in Skripteigenschaft `APP_PIN`, Sperre nach Fehlversuchen, `LockService`, Eingabeprüfung.
  - Tracking (ab 0.2): Passwort aus `APP_PIN`, Sperre, JSON-Antworten, `LockService`, Prüfung von Datum und Feldnamen.
    Aktionen: `ping` (nur prüfen), `einstellungen` (Felder aus Blatt `Einstellungen`, ab 2.1), `eintragen` (`datum` als JJJJ-MM-TT, `values` = Spaltenname → Wert).
    `tabelle` (`jahr`: Einträge eines Jahres und Liste der Jahre, ab 2.3).
    Funktion `einrichten` legt das Blatt `Einstellungen` an (Spalten `feld, gruppe, art, vorgabe, optionen, schritt, farben`).
  - Finanzen: Aktionen `stats`, `analyse` (ab 2.4 mit `kategorien` je Monat: `aus`, `ein`, `netto`), `buchen`, `einstellungen` (ab 2.2: Zwecke, Kategorien, Rückzahlungen, Eigenanteile
    aus Blatt `Einstellungen`, Spalten `liste, name, kategorie, betrag, zweck`). Funktion `einrichten` legt das Blatt an.
- Neues Repo `thetadex` angelegt. Schritt 0.0 erledigt (Sheets kopiert, alte Repos als ZIP gesichert).
- Schritt 0.1: leeres App-Gerüst mit Reiterleiste (Platzhalter), Ersteinrichtung, Info, Hell- und Dunkelmodus, Hinweis „Neue Version da“.
- Etappe 1: Symbole für alle Reiter (1.1). Döner-Skript und Reiter mit Rangliste, Einzelheiten, Bewerten und Teilen-Link (1.2).
  Döner-Skript: Aktionen `liste`, `bewerten`, `ping`, ohne Passwort. Schnell (drei Werte) oder ausführlich nach Kriterien (1.3).
- Etappe 2: Reiter Tracking (Eingabe und Übersicht je Jahr und Monat mit farbigen Zellen) und Finanzen (Kontostände, Buchen,
  Auswertung mit Chart.js). Felder, Zwecke, Kategorien, Rückzahlungen und Farbregeln stehen im Blatt `Einstellungen` des jeweiligen Sheets.
- Etappe 3 (fertig): Einstellungen mit Aussehen (3.1). Sheet „Leben“ mit Skript `leben` (3.2): Blatt `besitz`, Aktionen `ping`, `liste`,
  `speichern` (neu ohne `id`, ändern mit `id` und `geaendert_am` als Schutz vor Überschreiben), `loeschen` (weich). Funktion `einrichten`.
  Reiter Besitz: Liste je Ort (PC Tabelle, Handy Karten), Hinzufügen; Ändern und Löschen per Tipp auf eine Sache, Suche, Filter nach Ort und Kategorie, Sortieren am PC (3.3).
  Zubehör (3.4): Spalte `gehoert_zu`, eine Ebene, eingerückt und aufklappbar unter der Hauptsache.
  Bild (3.5): Spalte `bild` (Drive-Datei-Kennung), Aktion `bild` (nur Bilder, die bei einer Sache stehen), Ordner „Thetadex Besitz“.
  Nachbesserungen (3.6): Tipp auf eine Sache zeigt erst ihre Daten mit Bild, „Bearbeiten“ öffnet das Formular; Formular schließt nach dem Speichern.
  Anzahl 0 ist ausgeblendet (außer mit Zubehör, Haken „Auch Sachen mit Anzahl 0 zeigen“). Spalte `ausgeliehen_an` mit Filter.
  Ab 0.4.2: Spalte `ausgeliehen_anzahl` (wie viele Stück ausgeliehen sind, leer = alle); die Übersicht zeigt keine Balken mehr.
  Unterreiter „Liste“ und „Übersicht“ (Sachen, Stück, ausgeliehen; je Kategorie, je Ort, an wen). Auswahlfelder öffnen die Liste beim Tipp ins Feld.
- Etappe 4 (fertig): Sheet „Gemeinsam“ mit Skript `gemeinsam` (4.1): Blätter `lebensmittel`, `einkaufsliste`, `gerichte`, `zutaten`, `vorrat`.
  Zwei Passwörter (`APP_PIN` = Rolle `person`, `PARTNER_PIN` = Rolle `partner`, mindestens 12 Zeichen); das Skript prüft je Aktion, was die Rolle darf.
  Aktionen: `ping` (mit Rolle), `alles`, `lebensmittel_speichern`, `lebensmittel_loeschen`, `auf_liste`, `liste_aendern`, `abhaken` (erhöht gepflegten Vorrat),
  `gericht_speichern`, `gericht_loeschen`, `vorrat_speichern`, `vorrat_loeschen`. Funktion `einrichten`.
  Reiter Einkauf (4.1): Unterreiter „Einkaufsliste“ (nach Abteilung, großer Haken) und „Lebensmittel“ (Suche, antippen → Anzahl → auf die Liste, neu anlegen aus der Suche).
  Ohne Netz (4.2): Einkaufsliste im Gerät (`thetadex_einkaufsliste`), Abhaken geht immer, wartende Haken in `thetadex_einkauf_offen`,
  gesendet beim Öffnen, beim Zurückkehren in die App und bei „wieder online“.
  Nachbesserung 0.4.5 (Wunsch der Person): Start im Unterreiter „Lebensmittel“; Lebensmittel ankreuzen (bleibt bei Suche), oben „Auf die Einkaufsliste“
  öffnet ein Fenster mit allen angekreuzten und je einer Menge; Tipp auf den Namen ändert das Lebensmittel. Auf der Liste steht die Menge rechts in der Zeile.
  Abgehakte bleiben grau und durchgestrichen (wieder lösbar, im Gerät `thetadex_einkauf_haken`), bis „Einkauf fertig“ sie sendet.
  Gerichte (4.3): Unterreiter „Gerichte“ mit Suche; Gericht mit Name, Notiz, Rezept-Link (nur https) und Zutaten (Suche, neue Lebensmittel gleich anlegen).
  Gericht antippen → Zutaten angehakt, Menge änderbar → „Auf die Liste“ (mit `gericht_id`). Einkaufsliste „Nach Abteilung“ oder „Nach Gericht“
  (Gruppe „Einzeln“ für alles ohne Gericht, „Gericht von der Liste nehmen“).
  Vorrat (4.4, freiwillig): im Formular des Lebensmittels „Zuhause“ mit je Ort einer Zeile (Ort, Menge ab 0, ×, „+ Ort“).
  Hinweis „zuhause: 2 Keller, 1 Kühlschrank“ auf der Einkaufsliste, bei Lebensmitteln und bei Zutaten. Zutaten mit genug Vorrat sind nicht angehakt.
  Haken „Vorrat“ bei Lebensmitteln: nur was zuhause ist, nach Ort. Abhaken erhöht gepflegten Vorrat (macht das Skript).
  Ab 0.4.11 (Wunsch der Person): Auswahl „Alle Abteilungen“ links von „+ Neues Lebensmittel“ filtert nach Abteilung (aus den vorhandenen, dazu „Ohne Abteilung“).
  Nachbesserung 0.4.9 (Wunsch der Person): bei Lebensmitteln Haken „Vorrat“ rechts neben der Suche, „+ Neues Lebensmittel“ und „Neu laden“
  gleich unter der Suche; im Gericht-Formular „+ Neues Lebensmittel“ mit Name, Abteilung und Einheit, kommt gleich als Zutat dazu.
  Gemeinsam nutzen (4.5): Reiter erscheinen nach eingetragenen Script-Adressen. „Verbindung prüfen“ zeigt bei `gemeinsam`, ob als Hauptperson oder Partner*in angemeldet.

### 3.2 Offen

- **ToDo für die Person (Umstieg, Tor von Etappe 2):** Nach etwa zwei Wochen nur mit Thetadex, wenn alles passt:
  1. Im Apps-Script-Editor je Sheet (Tracking, Finanzen): Bereitstellen → Bereitstellungen verwalten → **alte** Bereitstellung → Archivieren.
  2. Alte Apps vom Startbildschirm entfernen.
  3. Alte Repos `Tracking-Leben` und `App-Finazen-Tabelle` löschen: GitHub → Repo → Settings → ganz unten „Delete this repository“
     (die ZIP-Sicherung aus Schritt 0.0 bleibt).
- **ToDo für die Person:** Beträge für feste Zwecke im Finanz-Sheet, Blatt `Einstellungen`, Spalte D (`betrag`) eintragen.
- Ein Beispiel-Charakterbogen zum Verständnis (kommt nicht ins Repo).
- Später als eigener Schritt (Entscheidung der Person, 30.10.2026): Kommentare in den Skripten, die auf gelöschte Plan-Dateien zeigen, aufräumen
  (`apps-script/leben`, `gemeinsam`, `finanzen`, `tracking`). Dann müssen die Skripte neu eingefügt werden.

---

## 4. Festlegungen je Bereich

Diese Regeln gelten. Wer etwas daran ändert, ändert es hier mit. Ausnahmen von den Grundsätzen (1.2) stehen hier mit Grund.

- **Repo öffentlich** auf GitHub Pages, damit keine Kosten entstehen. Deshalb gelten die Regeln „Script-Adressen“ und „Persönliches“ in 1.5.
- **Finanzen: keine Finanzdaten öffentlich** (Wunsch der Person, 29.10.2026). Das Finanz-Skript darf ins Repo, weil es keine Daten,
  Beträge oder Geheimnisse enthält. Beträge, Kontostände, Buchungen und Namen erscheinen nie im Repo, auch nicht in Kommentaren,
  Beispielen oder Pull-Request-Texten.
- **Daten bleiben in den bestehenden Sheets.** Kein Export oder Import. Die neue App spricht dieselben Sheets an.
- **Jedes Skript bekommt beim Umzug eine neue Bereitstellung** (neue Adresse). Die alten Bereitstellungen werden erst nach dem Umstieg archiviert.
- **Chart.js** (Finanz-Auswertung) als lokale Datei in `vendor/`, feste Version 4.4.1, statt aus dem Internet. Grund: keine fremden Server. Bestätigt von der Person am 29.10.2026 (Ringe wie bisher statt CSS-Balken).
- **Icons** als eigene SVG-Dateien statt Google Fonts (Material Icons). Grund: keine fremden Server.
- **Erscheinungsbild** (entschieden am 29.10.2026):
  - Name Thetadex, Zeichen ϑ (kleines geschwungenes Theta, U+03D1), klassischer Serifenschnitt.
  - Icon: Karteikarte in Graphit mit weißem ϑ, sieben farbige Register-Reiter am rechten Rand, Hintergrund Kohle.
    Dateien `icons/thetadex-icon.svg` und `icons/thetadex-icon-512.png` (von der Person ins Repo kopiert).
  - Grundfarben: Kohle `#1C1B19` (Icon-Grund, Hintergrund dunkel), Graphit `#2A2826` (Kacheln dunkel), Karte im Icon `#3A3734`,
    Hintergrund hell `#FAF9F7`, Kacheln hell `#EEECE8`, Schrift auf Karte `#F4F2EE`.
  - Bereichsfarben: Tracking `#E07A5F`, Finanzen `#8DB580`, DSA `#B5838D`, Einkauf/Essen `#D4B483`,
    Besitz `#7FA7A0`, Uni `#C9784A`, Döner `#E2A23B` (frühere Farbe von ToDos, der Reiter ist am 29.10.2026 entfallen). Kein Blau.
    Damit gibt es wieder sieben Reiter, passend zum Icon.
  - Bereichsfarben auf hellem Grund nur als Fläche oder Marke, nicht als Schriftfarbe (zu wenig Kontrast nach WCAG AA).
  - Ausnahme (Wunsch der Person, 29.10.2026): Nach dem Speichern erscheint kurz ein Fenster mit grünem Haken (`--erfolg`).
    Die Tracking-Übersicht färbt Zellen mit eigenen Zellfarben (`--zelle-…` in `css/base.css`, hell und dunkel) nach Regeln
    aus dem Blatt `Einstellungen`, Spalte `farben`. Zahlen zeigt die Übersicht nicht.
  - Ausnahme (Wunsch der Person, 29.10.2026): Tracking zeigt 📊 vor der Überschrift. Finanzen zeigt 💶 vor der Überschrift, das Vermögen grün (positiv) oder rot (negativ),
    den Knopf „Ausgabe“ rot und „Einnahme“ grün (`--plus-schrift`, `--minus-schrift`, `--knopf-rot`, `--knopf-gruen`).
  - Ausnahme (Wunsch der Person, 29.10.2026): Der Reiter Döner zeigt das Emoji 🥙 vor der Überschrift und bewertet mit 10 kleinen 🥙
    statt einer Auswahlliste. Seine Knöpfe sind in der Döner-Farbe mit dunkler Schrift (`--schrift-auf-farbe`).
- **Wer sieht was** (Plan Version 1, 29.10.2026):
  | Bereich | Person | Partner*in | Ohne Passwort |
  | --- | --- | --- | --- |
  | Tracking, Finanzen, Besitz | lesen, ändern | – | – |
  | Einkauf und Essen | lesen, ändern | lesen, ändern | – |
  | Uni (alle Zeiten, auch Arbeit und Zug) | lesen, ändern | nur lesen | – |
  | DSA-Bögen | lesen, ändern | – | ein Bogen per Link, nur lesen |
  | Döner | lesen, bewerten; löschen nur im Sheet | wie alle | lesen, bewerten |
- **Besitz: keine Daten öffentlich** (Wunsch der Person). Wie bei Finanzen: keine Gegenstände, Orte oder Preise im Repo.
  Auch die Namen bei „Ausgeliehen an“ stehen nur im Sheet „Leben“, nie im Repo, in Beispielen oder Pull-Request-Texten.
- **Besitz, Blatt `besitz` im Sheet „Leben“** (Etappe 3): Spalten `id, name, kategorie, ort, anzahl, kaufpreis, kaufdatum, notiz,
  erstellt_am, geaendert_am, geloescht, gehoert_zu, bild, ausgeliehen_an, ausgeliehen_anzahl`. Pflicht: Name (80), Kategorie (40), Ort (60), Anzahl (0 bis 9999).
  Freiwillig: Kaufpreis (bis 1.000.000 €), Kaufdatum (nicht in der Zukunft), Notiz (300), Ausgeliehen an (60), davon ausgeliehen (ganze Zahl 1 bis Anzahl, leer = alle, nur mit „Ausgeliehen an“). `einrichten` ergänzt fehlende Spalten am Ende.
  Orte und Kategorien haben kein eigenes Blatt: Die Auswahl entsteht aus der Liste, Umbenennen im Sheet mit „Suchen und ersetzen“.
  Keine Summe der Kaufpreise (Wunsch der Person). Ändern schickt `geaendert_am` mit; ist die Zeile inzwischen anders, speichert das Skript nicht.
  Löschen ist weich (`geloescht = TRUE`, im Sheet zurückholbar); Zubehör einer gelöschten Hauptsache bleibt als eigene Sache.
  Zubehör nur eine Ebene. Anzahl 0 heißt „nicht mehr da“: ausgeblendet, außer mit Zubehör oder mit dem Haken „Auch Sachen mit Anzahl 0 zeigen“.
  Tipp auf eine Sache zeigt erst ihre Daten mit Bild, „Bearbeiten“ öffnet das Formular. Nach dem Speichern schließt es sich, der Ort bleibt stehen.
  Übersicht zählt Sachen mit Anzahl über 0, Zubehör eingeschlossen, als Sachen und als Stück.
- **DSA teilen:** Jeder Bogen hat einen zufälligen, langen Freigabe-Schlüssel (Spalte `freigabe` im Blatt `boegen`).
  Der Link enthält die Skript-Kennung und diesen Schlüssel, nie das Passwort. „Neuen Link erstellen“ macht alte Links ungültig.
  Die geteilte Ansicht zeigt den ganzen Bogen, aber keine Knöpfe zum Ändern. Grund: Bögen sollen ohne Passwort an andere gehen.
- **Einkauf, Sheet „Gemeinsam“** (Etappe 4). Alle Blätter haben zusätzlich `id, erstellt_am, geaendert_am, geloescht`; Löschen ist weich.
  | Blatt | Spalten (Grenzen) |
  | --- | --- |
  | `lebensmittel` | `name` (Pflicht, 60, kein zweites Mal gleich), `abteilung` (40), `einheit` (20), `notiz` (200) |
  | `einkaufsliste` | `lebensmittel_id`, `anzahl` (0,5 bis 9999, halbe erlaubt), `gericht_id` (leer = einzeln), `notiz` (100), `abgehakt_am` (setzt das Skript) |
  | `gerichte` | `name` (Pflicht, 60), `notiz` (300), `link` (nur `https://`, 300) |
  | `zutaten` | `gericht_id`, `lebensmittel_id`, `menge` (wie `anzahl`); höchstens 50 je Gericht |
  | `vorrat` | `lebensmittel_id`, `ort` (Pflicht, 40), `menge` (0 bis 9999); eine Zeile je Lebensmittel und Ort, keine Zeile = nicht gepflegt |
  - Zwei Passwörter: `APP_PIN` (Rolle `person`) und `PARTNER_PIN` (Rolle `partner`, mindestens 12 Zeichen, anders als `APP_PIN`), gemeinsame Sperre
    nach 5 Fehlversuchen. Das Skript prüft je Aktion, was die Rolle darf (`ERLAUBT_`); in Einkauf dürfen beide alles. `PARTNER_PIN` kennt nur `gemeinsam`.
    Passwort ändern: neues `PARTNER_PIN` in den Skripteigenschaften, das alte gilt sofort nicht mehr.
  - `auf_liste` zählt zusammen, wenn dasselbe Lebensmittel für dasselbe Gericht (oder einzeln) schon offen draufsteht. Höchstens 100 Einträge je Anfrage.
  - **Abhaken erhöht den Vorrat** (Entscheidung der Person, 30.10.2026), wenn er gepflegt ist, an dem Ort mit der größten Menge. Doppelt abhaken schadet nicht.
  - **Zutaten mit genug Vorrat** sind bei einem Gericht nicht angehakt (Entscheidung der Person, 30.10.2026).
  - Ein Lebensmittel löschen nimmt es auch von der offenen Liste, aus Gerichten und aus dem Vorrat. Ein Gericht löschen lässt die Lebensmittel stehen.
  - Abteilungen sortiert A–Z, ohne Abteilung zuletzt (eine feste Laden-Reihenfolge kann später kommen). Kein „Ziehen nach unten“:
    Die Daten laden beim Öffnen, beim Zurückkehren in die App und mit „Neu laden“. Kein Knopf „Zufälliges Gericht“ (Entscheidung der Person).
  - Abgehakte bleiben grau und durchgestrichen stehen, bis „Einkauf fertig“ getippt wird; erst dann gehen sie ans Skript (Wunsch der Person, 30.10.2026).
  - Datenschutz: keine Preise, Läden oder Gesundheitsdaten. Über die Partnerin oder den Partner wird nichts gespeichert, auch nicht, wer etwas eingetragen hat.
    Das Sheet „Gemeinsam“ wird mit niemandem geteilt. Keine Lebensmittel, Gerichte oder Namen im Repo.
- **Reiter nach Script-Adressen** (Entscheidung der Person, 30.10.2026): Ein Reiter erscheint nur mit der Adresse seines Skripts (siehe 2.1).
  Die App speichert keine Rolle; die Rechte prüft immer das Skript.
- **Ausnahme von „Keine Offline-Schreibzugriffe“ (1.5), nur Einkaufsliste:** Die Liste liegt zusätzlich im Gerät.
  Abhaken geht auch ohne Netz. Abgehakte Einträge werden gesendet, sobald wieder Netz da ist. Bis dahin zeigt die App „noch nicht gesendet“.
  Grund: Wunsch der Person, im Laden gibt es oft kein Netz. Abhaken ist harmlos: doppelt senden schadet nicht.
- **Im Gerät (Ergänzung zu 5):** die Einkaufsliste (`thetadex_einkaufsliste`), abgehakte vor „Einkauf fertig“ (`thetadex_einkauf_haken`)
  und die noch nicht gesendeten Haken (`thetadex_einkauf_offen`); bei Besuchern die Kennung des
  geteilten Döner-Skripts (`thetadex_oeffentlich`). Sonst nichts Neues.
- **Döner öffentlich** (Wunsch der Person, 29.10.2026): Jede Person mit dem Link kann Bewertungen sehen und abgeben.
  Ändern und Löschen geht nur im Sheet durch die Person. Es werden keine Namen von Bewertenden gespeichert.
  Schutz gegen Spam und böse Eingaben im Skript: feste Längen (Laden 60, Begründung 300 Zeichen), Sterne nur ganze Zahlen 1 bis 10 oder leer,
  Datum setzt das Skript selbst, `bereinigeText_`, höchstens 30 neue Bewertungen pro Stunde für alle zusammen (`CacheService`),
  ein verstecktes Lockfeld gegen Bots, `LockService`. Die App zeigt alle Texte nur mit `textContent`.
  Ehrlich: Apps Script kennt keine IP-Adressen. Wer es darauf anlegt, kann im Rahmen der Grenze Unsinn eintragen. Die Person löscht das dann im Sheet.
- **Bilder bei Besitz** (Entscheidung der Person, 30.10.2026): Bild hochladen (die App verkleinert auf höchstens 1600 px, JPEG) oder
  Google-Drive-Link einfügen. Die Datei liegt im Drive der Person (hochgeladene im privaten Ordner „Thetadex Besitz“), im Sheet nur ihre Kennung.
  Das Skript liest sie als die Person und gibt sie nur mit Passwort und nur für eingetragene Bilder als Text heraus (`data:`-Bild).
  Nichts wird öffentlich geteilt, die Content-Security-Policy bleibt gleich. Das Skript `leben` braucht dafür einmal die Drive-Erlaubnis.
- **Bilder** (DSA): Die App verkleinert ein Bild vor dem Senden (etwa 400 px, JPEG) und schickt es als Text.
  Es liegt im Blatt `bilder`. Keine fremden Bild-Server, die Content-Security-Policy bleibt gleich (`img-src 'self' data:`).
- **Würfel** (W4, W6, W20) rechnen nur im Gerät mit `crypto.getRandomValues`. Nichts wird gespeichert.
- **Stundenplan am Handy:** im Hochformat eine Liste je Tag, im Querformat automatisch die Wochenansicht.
  Eine Web-App kann das Drehen nicht erzwingen, darum ein Hinweis „Für die Woche das Handy drehen“.
- **Kontowecker (Etappe 7):** Eine Web-App kann keine SMS lesen, E-Mail geht beim Kontowecker nicht. Die Person nutzt Android.
  Vorschlag: Eine Automations-App auf dem Handy (zum Beispiel MacroDroid) schickt jede Kontowecker-SMS direkt an das Finanz-Skript (Aktion `sms`).
  Dafür gibt es einen eigenen Schlüssel `SMS_SCHLUESSEL` in den Skripteigenschaften. Er darf nur eine SMS als „offen“ ablegen,
  nichts lesen und nichts buchen. Liegt der Schlüssel in der fremden App, verrät er also keine Daten.
  Die App zeigt die offenen SMS im Reiter Finanzen, die Person ordnet sie zu. Die Wahl der Automations-App trifft die Person in Etappe 7.

---

## 5. Technik-Merkzettel

- **Hilfsmodule** vor dem Neubauen suchen und wiederverwenden. Lies die Datei, bevor du sie benutzt. Rate keine Signaturen.
  Liste: `js/ui/dom.js` (`el`, `leeren`, `sichereUrl`, `heute`, `kalenderBeiKlick`), `js/ui/auswahl.js` (`auswahlFeld`), `js/ui/overlay.js` (`zeigeGespeichert`), `js/ui/farben.js` (`farbRegeln`), `js/ui/aussehen.js` (`wendeAussehenAn`, `setzeAussehen`), `js/ui/bild.js` (`verkleinereBild`, `bildAdresse`), `js/store.js` (`lesen`, `schreiben`, `abmelden`, `istEingerichtet`),
  `js/api.js` (`api(skript, action, daten)`, `apiOeffentlich(adresse, action, daten)` ohne Passwort, `ApiFehler` mit `code`).
- **Ein Syntaxfehler** in einer Datei lässt die Ansicht ausfallen. Dann zuerst die zuletzt geänderten Dateien auf fehlende oder doppelte Klammern prüfen.
- **Skript:** Keine `appsscript.json` im Repo. Bewährte Helfer aus dem Finanz-Skript wiederverwenden:
  `jsonOut_`, `pruefePin_`, `bereinigeText_`, `pruefeEingabe_`, `LockService`-Muster.
- **Skripteigenschaften** (nur im Editor, je Skript): `APP_PIN`; im Skript `gemeinsam` zusätzlich `PARTNER_PIN`; im Skript `leben` legt `einrichten` selbst `BILD_ORDNER` an (Kennung des Bild-Ordners).
- **Im Gerät (localStorage):** nur Passwort, Script-Adressen, geladene Einstellungen, zuletzt bekannte Kontostände, die Wahl beim Aussehen (`thetadex_aussehen`),
  die offene Einkaufsliste (`thetadex_einkaufsliste`, nur Einträge mit Namen, Abteilung, Einheit), abgehakte Einträge vor „Einkauf fertig“ (`thetadex_einkauf_haken`)
  und noch nicht gesendete Haken (`thetadex_einkauf_offen`).
  Schlüssel mit Vorsilbe `thetadex_`. Keine Tracking-Einträge im Gerät speichern. Abmelden löscht alles.
  Die Tracking-Felder hält die App nur im Arbeitsspeicher (10 Minuten), damit das Formular schnell da ist.
- **Neu laden** nach einem Update nur, wenn auf dieser Seite „Jetzt neu laden“ getippt wurde (`js/app.js`). Sonst lud die Seite
  beim ersten Besuch von selbst neu, weil der Service Worker die Seite übernimmt (`clients.claim`), und Formulare waren weg.
- **Service Worker** (`sw.js`): App-Dateien zwischenspeichern (`<name>-<VERSION>`), Daten nicht im Service Worker,
  Anfragen an die Skripte nie aus dem Zwischenspeicher. Jede geänderte Datei braucht eine neue VERSION, sonst bekommen Geräte sie nicht.
- **Barrierefreiheit beim Bauen:** genau eine `h1` je Seite, jedes Feld mit Beschriftung, Fenster mit `role="dialog"` und `aria-modal="true"`,
  Überschriften ohne Sprung.

---

## 6. Dateiübersicht

- Hauptordner: `CLAUDE.md` (zeigt nur hierher), `README.md`, `index.html`, `manifest.webmanifest`, `sw.js`, `.nojekyll` (GitHub Pages ohne Jekyll).
- `css/`: `base.css` (Farben, hell und dunkel), `layout.css` (Kopf, Reiterleiste unten am Handy, links am PC), `components.css`.
- `js/`: `app.js` (Routing, Reiterleiste, Update-Hinweis), `config.js` (VERSION, `features`, `BEREICHE`, `SKRIPTE`), `api.js`, `store.js`, `ui/dom.js`.
- `js/views/`: `start.js` (Kacheln), `platzhalter.js` (Reiter ohne Inhalt), `einstellungen.js`, `info.js`, `nichtgefunden.js`, `doener.js`, `tracking.js`, `finanzen.js`, `finanzen-auswertung.js`, `besitz.js`, `einkauf.js`. `vendor/chart.umd.js`: Chart.js 4.4.1, nur in der Auswertung geladen. `js/ui/auswahl.js`: Auswahlfeld mit Freitext (Zweck, Kategorie, Ort, ausgeliehen an); Tipp ins Feld öffnet die Liste. `js/ui/overlay.js`: Fenster „Gespeichert“. `js/ui/farben.js`: Farbregeln der Tracking-Übersicht. `js/ui/aussehen.js`: Hell, Dunkel, Wie Gerät. `js/ui/bild.js`: Bilder verkleinern.
- `icons/`: `thetadex-icon.svg`, `thetadex-icon-512.png`, `-192.png`, `-180.png` (Apple), `thetadex-icon-maskable-512.png` (Android-Startbildschirm, füllt die Form aus). `icons/reiter/<id>.svg`: Symbole der Reiter (Farbe per CSS-Maske). `icons/einstellungen.svg`: Zahnrad in der Kopfzeile.
- `docs/`: `STAND.md` (diese Datei); während einer Etappe ihr Plan (`PLAN-ETAPPE-<n>.md`, zurzeit `PLAN-ETAPPE-5.md`).
- `apps-script/tracking/Code.gs` (ohne PIN), `apps-script/finanzen/Code.gs` (Passwort in den Skripteigenschaften),
  `apps-script/doener/Code.gs` (öffentlich, ohne Passwort, Funktion `einrichten`), `apps-script/leben/Code.gs` (Besitz, mit Passwort, Funktion `einrichten`),
  `apps-script/gemeinsam/Code.gs` (Einkauf und später Uni, `APP_PIN` und `PARTNER_PIN`, Funktion `einrichten`).

---

## 7. Pläne

### 7.1 Etappe 0 „Start“ (jetzt)

Jeder Schritt ist ein eigener Zweig und ein eigener Pull Request. Nach jedem Schritt prüft die Person.

- **0.0 Sichern (Person, ohne Pull Request)**
  - Beide Sheets kopieren (Datei → Kopie erstellen). Kopien bleiben im Google Drive.
  - Neues öffentliches Repo anlegen, `docs/STAND.md` und `CLAUDE.md` hineinkopieren.
  - Beide Skripte kommen per Pull Request ins Repo (Tracking ohne PIN). Icons kommen mit Schritt 0.1.
  - Alte Repos als ZIP herunterladen (Code → Download ZIP).
- **0.1 Grundstruktur im Repo** (Version 0.0.0 → 0.0.1)
  - Leeres App-Gerüst nach 2.1: `index.html` mit Content-Security-Policy, `manifest.webmanifest`, `sw.js` mit `HUELLE`,
    `js/config.js` (VERSION, `features`), `js/app.js` (Routing, „Seite nicht gefunden“), `js/api.js`, `js/store.js`,
    `js/ui/dom.js`, `css/base.css`, `css/layout.css`, `css/components.css`, Icons aus `icons/` (Manifest-Größen daraus ableiten), Ansicht `#/einrichtung` und `#/info`.
  - Nur Startseite mit Name und Version und die Ersteinrichtung. Noch keine Reiter mit Daten.
  - Von Hand (Person): GitHub → Settings → Pages → Source „Deploy from a branch“, `main`, `/ (root)`.
  - Wiederverwenden, was in den bestehenden Apps gut war (Finanz-`app.js`: `api()`, Combo-Feld, Doppelbuchungs-Sperre).
- **0.2 Skripte vereinheitlichen** (0.0.1 → 0.0.2)
  - Tracking-Skript auf den Stand des Finanz-Skripts bringen: Passwort aus `APP_PIN`, `pruefePin_` mit Sperre, `doGet`,
    JSON-Antworten, `LockService`, `bereinigeText_` bzw. Prüfung der Werte gegen die Spaltennamen.
  - Finanz-Skript nur prüfen; ändern nur, was für die neue App nötig ist (z. B. Aktion `einstellungen`).
  - Ergebnis im Pull Request: Liste „übernommen / angepasst / entfernt“ und Abschnitt „Von Hand zu erledigen“
    (neues Passwort in beiden Skripten als `APP_PIN`, Skript einfügen, **neue Bereitstellung** je Skript, Adressen in der App eintragen).
  - Die alten Apps laufen mit den alten Bereitstellungen weiter. Achtung: Die alte Tracking-App sendet die alte PIN;
    darum bleibt die alte Tracking-Bereitstellung auf der alten Fassung, bis zum Umstieg.
- **0.3 Plan Version 1 fertigstellen** (0.0.2 → 0.1.0)
  - Die Person beschreibt alle Reiter genauer.
  - Claude füllt alle **[OFFEN: …]** in dieser Datei, schreibt 7.2 als Plan Version 1 (Etappen mit Ziel, Schritten, Tabs, Datenschutz je Etappe)
    und stellt Rückfragen gesammelt am Ende.
  - Prüfung je Etappe gegen die Grundsätze 1.2: Welche Daten? Wer sieht sie? Geht es einfacher?

### 7.2 Plan Version 1 (29.10.2026)

Jede Etappe bekommt vor dem ersten Schritt ihren eigenen Plan `docs/PLAN-ETAPPE-<n>.md` mit Schritten, genauen Spalten und Prüflisten.
Die Etappen bauen nacheinander auf. Nichts davon ist dringend (Person, 29.10.2026). Die Reihenfolge der Etappen 3 bis 6 kann die Person tauschen. Döner kam auf Wunsch der Person vor den Umzug (29.10.2026).

- **Etappe 1 „Döner Landau“ (0.1.x) – fertig.** So ist es gebaut (Schritte 1.1 bis 1.6, Pull Requests #7 bis #12):
  - Überschrift „Veganes Döner-Rating Landau“ mit 🥙. Knöpfe in der Döner-Farbe, „+ Bewerten“ rechts oben klappt das Formular auf
    (× schließt, Eingaben bleiben; „Abbrechen“ verwirft). Bewerten mit 10 kleinen 🥙 (antippen = ganz, nochmal = halb, × = nicht bewerten).
    Laden als Auswahlliste mit „+ Neuer Laden …“.
  - Umschalter „Rangliste / Vergleich“. Rangliste: Kachel je Laden mit Zahl der Bewertungen, eingerückte Einzelheiten,
    „Kriterien“-Knopf je Bewertung. Vergleich: je Teil und je Kriterium alle Läden als Balken, Gewinner mit 🏆, Gruppen als Kacheln
    mit gelbem Dreieck zum Aufklappen.
  - Ziel: öffentlicher Reiter mit neuem Sheet „Döner“ und eigenem Skript `doener`. Ohne Passwort, aber getrennt von allem anderen.
    Das alte Döner-Sheet (nur Durchschnitte) bleibt als Sicherung. Das Skript hat eine Funktion `einrichten`, die die Blätter
    und Kopfzeilen selbst anlegt. Die bisherigen Werte trägt die Person als je eine Start-Bewertung pro Laden ein.
  - Bewerten: Laden aus einer Auswahl der bisherigen Läden oder neu als Freitext. Sterne 1 bis 10 getrennt für Döner, Yufka und Pommes,
    jedes Feld freiwillig, mindestens eins (Entscheidung der Person, 29.10.2026). Begründung freiwillig, Datum automatisch.
  - Wahlweise „ausführlich“ (Entscheidung der Person, 29.10.2026): je Kriterium 1 bis 10 in halben Schritten mit eigener Begründung.
    Die Kriterien stehen im Blatt `kriterien` (Vorgabe aus dem alten Döner-Sheet). Der Wert eines Teils ist dann der Durchschnitt
    seiner Kriterien. Dazu kommt der Teil „Laden“ (Service, Gemütlichkeit); er zählt nicht zu „Insgesamt“.
  - Anzeige: Balken-Grafik aller Läden mit „Insgesamt“ und der Zahl der Bewertungen. Je Teil (Döner, Yufka, Pommes) zählt der
    Durchschnitt aller Bewertungen; „Insgesamt“ ist der Durchschnitt der Teile, die schon Bewertungen haben.
    Antippen eines Ladens zeigt die drei Teile und alle Begründungen mit Sternen und Datum. Die Balken baut die App selbst mit CSS, ohne Bibliothek.
  - Teilen: Link `#/doener/<skript>` ohne Einrichtung. Für dich steht der Reiter normal in der Reiterleiste.
  - Reiter-Symbole (Wunsch der Person): jeder Reiter hat ein Symbol, am Handy nur das Symbol, am PC Symbol und Name.
    Ohne Einrichtung zeigt die Reiterleiste nur öffentliche Reiter.
  - Datenschutz: Nur Laden, Sterne, Begründung und Datum. Keine Namen, keine Geräte-Kennung.
- **Etappe 2 „Bestehendes umziehen“ (0.2.x) – fertig bis auf den Umstieg (3.2).** So ist es gebaut (Schritte 2.0 bis 2.5, Pull Requests #14 bis #21):
  - Daten bleiben in den bestehenden Sheets, kein Export oder Import. Je Sheet kam nur ein Blatt `Einstellungen` dazu.
    Skript-Änderungen gehen nur in die Thetadex-Bereitstellung, die alten Apps laufen mit ihrer alten Bereitstellung weiter.
    Die Werte der alten Apps lagen als Tabellen zum Einfügen in den Projektdateien (`etappe-2/`), nie im Repo.
  - Tracking: Blatt `Einstellungen` (`feld, gruppe, art, vorgabe, optionen, schritt, farben`); `einrichten` füllt `feld` aus der Kopfzeile.
    Arten `haken`, `zahl`, `auswahl` (`wert=Text; …`, Hochkomma vor `-1=…`). Formular je Gruppe als Karte, „Speichern“ in der Tracking-Farbe.
    Die Felder holt die App beim Start im Hintergrund und hält sie nur im Arbeitsspeicher (10 Minuten).
    Übersicht: Jahr und Monat wählen, je Monat eine Tabelle mit allen Tagen, Zellen farbig ohne Zahlen. Farbregeln in Spalte `farben`:
    `1=grün`, `7-10=grün`, `<7=rot`, `>10=gelb`, `<=`, `>=`, `sonst=rot`, `skala 1-10`; Farben grün, hellgrün, dunkelgrün, rot, dunkelrot, gelb, blau, rosa, grau.
  - Finanzen: Blatt `Einstellungen` (`liste, name, kategorie, betrag, zweck`; Listen `zweck`, `kategorie`, `rueckzahlung`, `eigenanteil`).
    Umschalter „Buchen / Auswertung“. Buchen wie bisher mit Auswahlfeld für Zweck und Kategorie, Doppelbuchungs-Sperre, Fenster „Gespeichert“.
    Auswertung mit Chart.js (lokal): Monat oder Jahr, Ringe, Säulen mit Budget, Budget-Balken, Netto-Kacheln mit Haken, Jahrestabelle, Bafög.
    Die Kategorien kommen allgemein aus `Analyse Monate` (Spalten `-Out`, `-In`, `Netto-`).
  - Ziel: Tracking und Finanzen funktionieren in Thetadex „wie bisher“.
  - Schritte: Blatt `Einstellungen` je Sheet (Tracking-Felder; Zwecke, Kategorien, Personen für Rückzahlungen) und Aktion `einstellungen`;
    Reiter Tracking (Eingabe wie bisher); Reiter Finanzen (Übersicht, Buchen, Auswertung mit Chart.js aus `vendor/`).
  - Datenschutz: Finanz- und Tracking-Daten nur nach Passwort, nichts im Gerät außer den letzten Kontoständen (5).
  - **Tor:** Die Person ist mit der neuen App zufrieden (Richtwert 2 Wochen). Dann alte Bereitstellungen archivieren und alte Repos löschen.
- **Etappe 3 „Besitz“ (0.3.x)** – fertig (30.10.2026), Plan eingearbeitet (3.1 und 4).
  - Gebaut: „Einstellungen“ statt „Einrichtung“ mit Aussehen Hell, Dunkel, Wie Gerät. Neues Sheet „Leben“ mit Skript `leben` (nur die Person).
  - Reiter Besitz mit Unterreitern „Liste“ und „Übersicht“: Liste je Ort (PC Tabelle mit Strich je Sache, Handy Karten), Suche,
    Filter nach Ort, Kategorie und ausgeliehen, Sortieren am PC, Zubehör aufklappbar, Bild je Sache aus Google Drive.
  - Datenschutz: nur mit Passwort; die Liste nur im Arbeitsspeicher, nichts davon im Gerät. Bilder bleiben privat im Drive der Person.
- **Etappe 4 „Einkauf und Essen“ (0.4.x)** – fertig (30.10.2026), Plan eingearbeitet (2.3, 3.1 und 4).
  - Gebaut: neues Sheet „Gemeinsam“ mit Skript `gemeinsam` und zweitem Passwort `PARTNER_PIN` für die Partnerin oder den Partner.
  - Reiter Einkauf mit Unterreitern „Einkaufsliste“ (nach Abteilung oder nach Gericht, abhaken auch ohne Netz, „Einkauf fertig“),
    „Lebensmittel“ (Suche, ankreuzen, zusammen auf die Liste, Vorrat je Ort) und „Gerichte“ (Zutaten mit Menge, Zutaten mit genug Vorrat nicht angehakt).
  - Reiter erscheinen nach eingetragenen Script-Adressen; so sieht die Partnerin oder der Partner nur Einkauf, Uni und Döner.
  - Datenschutz: nur mit Passwort; im Gerät nur die Einkaufsliste und die noch nicht gesendeten Haken. Über die Partnerin oder den Partner wird nichts gespeichert.
- **Etappe 5 „Uni“ (0.5.x)**, im Sheet „Gemeinsam“
  - Semester auswählen, je Semester ein Stundenplan (Tag, von, bis, Veranstaltung, Ort, Art).
  - Zusätzlich eintragen: Arbeitszeiten (Stunden je Woche und Monat werden berechnet) und Zugfahrten.
  - Kalender mit Vorlesungen, Prüfungen, Urlaub, Semesterferien, Arbeit und Zug. Jede Art hat ihre eigene Farbe.
    Vorbild ist der Kalender im AktionsDeck (öffentliches Repo `fridaysforfuture-landau-pfalz/aktionsdeck-landau`, `js/views/kalender.js`):
    Ansichten Liste, Monat und Woche, mehrtägige Termine, Filter nach Art. Die Rechenhelfer aus `kalender-rechnen.js`
    (Monatsraster, Woche, Tage zählen, Schriftfarbe auf Farbfläche) werden vereinfacht übernommen.
  - Master-Übersicht: welche Module erledigt sind, welche noch fehlen, wann und welche Prüfung dazu gehört.
  - Partner*in sieht Uni mit allen Zeiten, nur lesend (Rechte in 4).
- **Etappe 6 „DSA und DnD“ (0.6.x)**
  - Ziel: neues Sheet „DSA“ mit Skript `dsa`. Vier Bögen (drei DSA, ein DnD), jeder einzeln wählbar, alle Daten in der App bearbeitbar.
  - Bogen zeigt: Kopf (Name, GP-Basis, Rasse, Kultur, Profession, Geschlecht, Alter, Größe, Gewicht, Haar- und Augenfarbe, Bild,
    Stand, Titel, Sozialstatus, Herkunft); Vor- und Nachteile; Eigenschaften und Basiswerte (MU, KL, IN, FF, GE, KO, KK zusätzlich
    immer sichtbar als Leiste); Sonderfertigkeiten und Talente in Gruppen (Sonderfertigkeiten, Gaben, Kampftechniken, Körperliche,
    Gesellschaftliche, Natur-, Wissens-, Handwerkliche Talente, Sprachen und Schriften); Zauber (Name, Probe, Kosten, Dauer, Spruch,
    Wirkungsdauer, ZfW, Modifikationen); Waffen mit Werten; Besitz-Liste.
  - Verlauf für Geld, AP, AsP und Leben: schnell „+“ oder „−“ mit Notiz; aktueller Stand wird daraus berechnet.
    Geld und Leben stehen mit Icon immer sichtbar oben.
  - Würfel W4, W6, W20.
  - Die Eigenschaften sind eine Liste aus Kürzel, Name und Wert. So passt auch der DnD-Bogen (STR, DEX …) ohne Sonderbau.
  - Teilen per Link ohne Passwort, nur lesen (4 „DSA teilen“).
- **Etappe 7 „Ausbau“ (optional)**
  - Startseite mit Heute-Übersicht (heutige Termine, Einkaufsliste).
  - Kontowecker automatisch auslesen (Vorschlag in 4), danach im Reiter Finanzen eine Übersicht „Noch zuordnen“.

Prüfung gegen die Grundsätze (1.2):
- Welche Daten? Nur was die Person beschrieben hat. Über die Partnerin oder den Partner werden keine Daten gespeichert.
- Wer sieht sie? Siehe Tabelle „Wer sieht was“ in 4. Jede Rolle prüft das Skript.
- Geht es einfacher? Ein Sheet für alles wäre weniger Einrichtung, aber dann hinge die Sicherheit von Besitz und Tracking
  an der Rechteprüfung für Partner*in und geteilte Bögen. Drei kleine Skripte mit demselben Aufbau sind sicherer und kaum mehr Arbeit.

---

## 8. Geschichte (kurz)

- **Etappe 0** (ab 0.0.0): Repo angelegt, Start-Datei `docs/STAND.md` übernommen.
- **0.0.1** Schritt 0.1: App-Gerüst, Ersteinrichtung, Icons.
- **0.0.2** Schritt 0.2: Tracking-Skript auf Finanz-Stand, ein Passwort für alle Skripte, neue Bereitstellungen, „Verbindung prüfen“ in der Einrichtung.
- **0.1.0** Schritt 0.3: Plan Version 1 (7.2), Rechte je Bereich, drei neue Sheets geplant. Etappe 0 fertig.
- **0.1.1** Antworten auf die Rückfragen: Reiter ToDos entfällt, Uni-Kalender nach Vorbild AktionsDeck, Vorrat, Kontowecker per SMS-Weiterleitung.
- **0.1.2–0.1.3** Neuer öffentlicher Reiter Döner Landau als Etappe 2 (neues Sheet, Sterne für Döner, Yufka, Pommes), die übrigen Etappen rücken eins nach hinten.
- **Etappe 1** Döner Landau (vor dem Umzug, Wunsch der Person). **0.1.4** Schritt 1.1: Symbole für alle Reiter, ohne Einrichtung nur öffentliche Reiter.
- **0.1.5** Schritt 1.2: Döner-Skript (`apps-script/doener/Code.gs`) und Reiter Döner.
- **0.1.6** Schritt 1.3: ausführliche Bewertung nach Kriterien (Blatt `kriterien`, `details`), Laden-Note (Service, Gemütlichkeit).
- **0.1.10** Etappe 1 abgeschlossen, Plan eingearbeitet, `docs/PLAN-ETAPPE-1.md` gelöscht.
- **Etappe 2** Bestehendes umziehen. **0.2.0–0.2.1** Schritt 2.0: Plan `docs/PLAN-ETAPPE-2.md`, Diagramme mit Chart.js.
- **0.2.2** Schritt 2.1: Reiter Tracking, Felder aus dem Blatt `Einstellungen`, Aktion `einstellungen`.
- **0.2.3** Schritt 2.2: Reiter Finanzen mit Kontoständen und Buchen, Zwecke und Kategorien aus dem Blatt `Einstellungen`.
- **0.2.4** Schritt 2.3: Tracking-Übersicht (Tabelle mit farbigen Zellen je Jahr), Fenster „Gespeichert“ mit grünem Haken, Döner-Haken gelb.
- **0.2.5** Nachbesserung 2.3: Finanzen mit 💶, Vermögen grün/rot, Knöpfe rot/grün, Kalender öffnet bei Klick ins Datumsfeld.
- **0.2.6** Nachbesserung 2.3: Tracking mit 📊, Übersicht mit allen Tagen, je Monat eine Tabelle, Filter nach Monat.
- **0.2.7** Schritt 2.4: Finanzen → Auswertung mit Chart.js (lokal), Kategorien allgemein aus dem Skript, Haken für Rückzahlungen.
- **0.2.8** Schritt 2.5: Überschrift „Tracking Leben“, Tracking-Felder werden beim Start im Hintergrund geholt (nur Arbeitsspeicher, 10 Minuten), Bafög-Kacheln schmal.
- **0.2.9** Etappe 2 abgeschlossen, Plan eingearbeitet, `docs/PLAN-ETAPPE-2.md` gelöscht. Dazu: Logo groß auf der Startseite,
  Icon füllt am Android-Startbildschirm die Form, Tracking-„Speichern“ in der Tracking-Farbe, Bafög drei gleich breite Kacheln.
- **Etappe 3** Besitz. **0.3.0** Schritt 3.0: Plan `docs/PLAN-ETAPPE-3.md` (Einstellungen mit hell/dunkel, Sheet „Leben“, Reiter Besitz).
- **0.3.1** Antworten zum Plan: Orte ohne eigenes Blatt, Spalte `kategorie`, keine Summe der Kaufpreise.
- **0.3.2** Schritt 3.1: „Einrichtung“ heißt „Einstellungen“ (Zahnrad), Aussehen Hell, Dunkel oder Wie Gerät.
- **0.3.3** Schritt 3.2: Sheet „Leben“, Skript `leben`, Reiter Besitz mit Liste je Ort und Hinzufügen.
- **0.3.4** Schritt 3.3: Besitz ändern, weich löschen, suchen, filtern nach Ort und Kategorie, sortieren.
- **0.3.5** Schritt 3.4: Zubehör unter einer Hauptsache (Spalte `gehoert_zu`), eingerückt und aufklappbar.
- **0.3.6** Schritt 3.5: Bild je Sache aus Google Drive (hochladen oder Link), Spalte `bild`.
- **0.3.7** Schritt 3.6: 📦 im Titel, Ansicht vor dem Bearbeiten, Anzahl 0 ausgeblendet, „Ausgeliehen an“ mit Filter, Übersicht, Strich je Sache am PC.
- **0.3.8** Schritt 3.7: Besitz-Übersicht mit Farbstrich oben an den Zahlen, Haken „Anzahl 0 zeigen“ immer sichtbar.
- **0.3.9** Etappe 3 abgeschlossen, Plan eingearbeitet, `docs/PLAN-ETAPPE-3.md` gelöscht. Dazu: Startseite mit Logo neben dem Namen, beides größer.
- **Etappe 4** Einkauf und Essen. **0.4.0** Schritt 4.0: Plan `docs/PLAN-ETAPPE-4.md` (Sheet „Gemeinsam“, Skript `gemeinsam` mit `PARTNER_PIN`, Lebensmittel, Einkaufsliste offline, Gerichte, Vorrat).
- **0.4.1** Antworten zum Plan: Vorrat als eigenes Blatt mit mehreren Orten, Abhaken erhöht den Vorrat, Einkaufsliste auch nach Gericht, Reiter nach Script-Adressen.
- **0.4.2** Wunsch der Person zu Besitz: ausgeliehene Anzahl (Spalte `ausgeliehen_anzahl`), Balken in der Übersicht entfernt.
- **0.4.3** Schritt 4.1: Sheet „Gemeinsam“, Skript `gemeinsam` (alle Aktionen der Etappe), Reiter Einkauf mit Einkaufsliste und Lebensmitteln.
- **0.4.4** Schritt 4.2: Einkaufsliste ohne Netz, Haken werden später gesendet.
- **0.4.5** Nachbesserung 4.2: Lebensmittel ankreuzen und zusammen auf die Liste, Menge rechts, Abgehakte bleiben bis „Einkauf fertig“, Start bei Lebensmittel.
- **0.4.6** Schritt 4.3: Gerichte mit Zutaten, Einkaufsliste nach Gericht.
- **0.4.7** Schritt 4.4: Vorrat je Ort am Lebensmittel, Hinweis „zuhause“, Zutaten mit genug Vorrat nicht angehakt, Filter „Nur was zuhause ist“.
- **0.4.8** Schritt 4.5: Reiter nach eingetragenen Script-Adressen (DSA-Platzhalter verschwindet), Rolle bei „Verbindung prüfen“.
- **0.4.9** Nachbesserung: Haken „Vorrat“ neben der Suche, Knöpfe unter der Suche, neues Lebensmittel im Gericht mit Abteilung und Einheit.
- **0.4.10** Etappe 4 abgeschlossen, Plan eingearbeitet, `docs/PLAN-ETAPPE-4.md` gelöscht.
- **0.4.11** Nachbesserung: Lebensmittel nach Abteilung filtern.
- **Etappe 5** Uni. **0.5.0** Schritt 5.0: Plan `docs/PLAN-ETAPPE-5.md` (vier Blätter im Sheet „Gemeinsam“, Kalender mit Arten, Arbeitsstunden, Module).
- **0.5.1** Antworten zum Plan: keine Noten, Ziel 120 ECTS, Arbeitszeiten „einmal anders“, Uni auch ohne Netz, Partner*in sieht auch Module, Raum im Kalender.
- **0.1.9** Schritt 1.6: Feinschliff Döner (Titel „Veganes Döner-Rating Landau“, Danke verschwindet, Pokal-Spalte, gelbe Dreiecke, Gruppen als Kacheln).
- **0.1.8** Schritt 1.5: 🥙 statt Bild, „Döner-Rating Landau“, gelbe Knöpfe, Kriterium in einer Zeile, × und Abbrechen,
  Vergleich aller Kriterien mit Gewinnern; Seite lädt nicht mehr von selbst neu.
- **0.1.7** Schritt 1.4: Döner-Optik nach Rückmeldung (bunter Döner, Bewerten mit kleinen Dönern, „+ Bewerten“, Laden-Auswahl, Einrückung).
