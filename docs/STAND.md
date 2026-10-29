# STAND – Thetadex

**Diese Datei ist die einzige Doku-Datei für den Agenten:** Arbeitsregeln, Aufbau, aktueller Stand, Festlegungen und Pläne.
Lies sie zuerst, bei jeder Aufgabe. `CLAUDE.md` im Hauptordner zeigt nur hierher.
Für eine neue Etappe kommt ein eigener Plan dazu (`docs/PLAN-ETAPPE-<n>.md`); am Ende der Etappe wird er hier eingearbeitet und gelöscht.

- Version der App: **0.0.1** (gleich in `js/config.js` und `sw.js`: beide Dateien prüfen; die Dateien gibt es ab Schritt 0.1)
- Repo: https://github.com/TimMelchert/thetadex (öffentlich)
- Seite (App): https://timmelchert.github.io/thetadex/
- Laufende Etappe: **Etappe 0 „Start“** (Grundstruktur, Skripte prüfen, Plan Version 1).
- Nächster Schritt: **0.2 Skripte vereinheitlichen** (Abschnitt 7).

Inhalt: 1 Arbeitsregeln · 2 Aufbau · 3 Aktueller Stand und Offen · 4 Festlegungen je Bereich · 5 Technik-Merkzettel ·
6 Dateiübersicht · 7 Pläne · 8 Geschichte · Anhang A CLAUDE.md · Anhang B Projektanweisungen

---

## 1. Arbeitsregeln

### 1.1 Worum es geht und mit wem du arbeitest

Eine persönliche App (PWA) für eine einzige Person, am Handy und am PC. Sie führt zwei bestehende Apps zusammen
(Tracking Leben, Finanzmanager) und bekommt neue Reiter: ToDos, DSA-Charakterbögen, Einkaufsliste und Essensideen,
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
- **Farben** nur über Variablen in `css/base.css`. Hell- und Dunkelmodus (`prefers-color-scheme`): Jede Farbe braucht einen hellen und einen dunklen Wert. Die Oberfläche ist schwarz-weiß,
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
- Hash-Routing: `#/todos`, `#/tracking`, `#/finanzen`, `#/dsa`, `#/einkauf`, `#/besitz`, `#/uni`, `#/einrichtung`, `#/info`.
  Unbekannte Adressen zeigen „Seite nicht gefunden“. [OFFEN: Startseite – welcher Reiter oder später eine Heute-Übersicht?]
- Eine Ansicht ist `js/views/<name>.js` mit `render(container, ctx)`. Welche Reiter sichtbar sind, steht in `js/config.js` (`features`).
- PC und Handy: Reiterleiste unten am Handy, Seitenleiste links am PC (ab 768 px). Einrichtung und Info in der Kopfzeile.
- Name, Icon und Farben: Thetadex, siehe Abschnitt 4 „Erscheinungsbild“. Die Kopfzeile zeigt immer das vollständige Icon (Karte mit Reitern).
- **Ersteinrichtung** (`#/einrichtung`): Passwort und die Script-Adressen je Bereich eingeben. Gespeichert nur im Gerät.
  Ein Knopf „Abmelden“ löscht alles wieder aus dem Gerät.

### 2.2 Schnittstelle, Zugang und Sicherheit

- Je Bereich ein Google Apps Script als Web-App (Ausführen als Besitzer, Zugriff: Jeder), an sein Sheet gebunden:
  | Bereich | Skript | Sheet |
  | --- | --- | --- |
  | Tracking | `apps-script/tracking/Code.gs` | bestehendes Tracking-Sheet, Blatt `Tabellenblatt1`, Kopfzeile 4 |
  | Finanzen | `apps-script/finanzen/Code.gs` | bestehendes Finanz-Sheet (Blätter je Konto, `Übersicht`, `Analyse Monate`), Daten ab Zeile 8 |
  | Alle neuen Reiter | `apps-script/leben/*.gs` | neues Sheet, ein Blatt je Reiter (ab Etappe 2) |
- Aufruf per POST mit JSON als `text/plain`. Das Feld für die Aktion heißt `action` (wie im bestehenden Finanz-Skript).
  Antwort immer JSON: bei Erfolg die Daten, bei Fehler `{error: "<code>", message: "<Text für die Person>"}`.
  Die App zeigt Erfolg nur, wenn eine Antwort ohne `error` kam.
- **Zugang:** Eine Person, ein Passwort für alle Skripte (mindestens 12 Zeichen, besser ein Satz aus mehreren Wörtern).
  Jedes Skript liest es aus der Skripteigenschaft `APP_PIN` und vergleicht es bei jedem Aufruf (`pruefePin_`).
  Nach 5 Fehlversuchen 15 Minuten Sperre (`CacheService`). Kein Token, keine Einzelkonten (1.2, Punkt 3).
- **Ohne Passwort** liefert kein Skript Daten. `doGet` antwortet nur mit dem Namen der Schnittstelle.
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
  `id, erstellt_am, geaendert_am, geloescht`. Blätter: [OFFEN, kommt aus Plan Version 1]

---

## 3. Aktueller Stand und Offen

### 3.1 Stand

- Zwei alte Apps laufen weiter: Repos `TimMelchert/Tracking-Leben` und `TimMelchert/App-Finazen-Tabelle` (öffentlich, GitHub Pages).
- Skript-Code beider Apps liegt als Sicherung in den Projektdateien (`apps-script-backup/`).
  - Finanzen: Passwort in Skripteigenschaft `APP_PIN`, Sperre nach Fehlversuchen, `LockService`, Eingabeprüfung.
  - Tracking: PIN stand im Code (in der Sicherung durch `HIER_PASSWORT` ersetzt), keine Sperre, Antwort als Text, kein `LockService`.
- Neues Repo `thetadex` angelegt. Schritt 0.0 erledigt (Sheets kopiert, alte Repos als ZIP gesichert).
- Schritt 0.1: leeres App-Gerüst mit Reiterleiste (Platzhalter), Ersteinrichtung, Info, Hell- und Dunkelmodus, Hinweis „Neue Version da“.

### 3.2 Offen

- Genaue Beschreibung aller Reiter durch die Person (für Plan Version 1).
- Neues Passwort festlegen und in beiden Skripten als `APP_PIN` eintragen (Schritt 0.2).

---

## 4. Festlegungen je Bereich

Diese Regeln gelten. Wer etwas daran ändert, ändert es hier mit. Ausnahmen von den Grundsätzen (1.2) stehen hier mit Grund.

- **Repo öffentlich** auf GitHub Pages, damit keine Kosten entstehen. Deshalb gelten die Regeln „Script-Adressen“ und „Persönliches“ in 1.5.
- **Finanzen: keine Finanzdaten öffentlich** (Wunsch der Person, 29.10.2026). Das Finanz-Skript darf ins Repo, weil es keine Daten,
  Beträge oder Geheimnisse enthält. Beträge, Kontostände, Buchungen und Namen erscheinen nie im Repo, auch nicht in Kommentaren,
  Beispielen oder Pull-Request-Texten.
- **Daten bleiben in den bestehenden Sheets.** Kein Export oder Import. Die neue App spricht dieselben Sheets an.
- **Jedes Skript bekommt beim Umzug eine neue Bereitstellung** (neue Adresse). Die alten Bereitstellungen werden erst nach dem Umstieg archiviert.
- **Chart.js** (Finanz-Auswertung) als lokale Datei in `vendor/`, feste Version 4.4.1, statt aus dem Internet. Grund: keine fremden Server.
- **Icons** als eigene SVG-Dateien statt Google Fonts (Material Icons). Grund: keine fremden Server.
- **Erscheinungsbild** (entschieden am 29.10.2026):
  - Name Thetadex, Zeichen ϑ (kleines geschwungenes Theta, U+03D1), klassischer Serifenschnitt.
  - Icon: Karteikarte in Graphit mit weißem ϑ, sieben farbige Register-Reiter am rechten Rand, Hintergrund Kohle.
    Dateien `icons/thetadex-icon.svg` und `icons/thetadex-icon-512.png` (von der Person ins Repo kopiert).
  - Grundfarben: Kohle `#1C1B19` (Icon-Grund, Hintergrund dunkel), Graphit `#2A2826` (Kacheln dunkel), Karte im Icon `#3A3734`,
    Hintergrund hell `#FAF9F7`, Kacheln hell `#EEECE8`, Schrift auf Karte `#F4F2EE`.
  - Bereichsfarben: ToDos `#E2A23B`, Tracking `#E07A5F`, Finanzen `#8DB580`, DSA `#B5838D`, Einkauf/Essen `#D4B483`,
    Besitz `#7FA7A0`, Uni `#C9784A`. Kein Blau.
  - Bereichsfarben auf hellem Grund nur als Fläche oder Marke, nicht als Schriftfarbe (zu wenig Kontrast nach WCAG AA).
- [OFFEN: weitere Festlegungen kommen mit Plan Version 1 und den Etappen]

---

## 5. Technik-Merkzettel

- **Hilfsmodule** vor dem Neubauen suchen und wiederverwenden. Lies die Datei, bevor du sie benutzt. Rate keine Signaturen.
  Liste: `js/ui/dom.js` (`el`, `leeren`, `sichereUrl`), `js/store.js` (`lesen`, `schreiben`, `abmelden`, `istEingerichtet`),
  `js/api.js` (`api(skript, action, daten)`, `ApiFehler` mit `code`).
- **Ein Syntaxfehler** in einer Datei lässt die Ansicht ausfallen. Dann zuerst die zuletzt geänderten Dateien auf fehlende oder doppelte Klammern prüfen.
- **Skript:** Keine `appsscript.json` im Repo. Bewährte Helfer aus dem Finanz-Skript wiederverwenden:
  `jsonOut_`, `pruefePin_`, `bereinigeText_`, `pruefeEingabe_`, `LockService`-Muster.
- **Skripteigenschaften** (nur im Editor, je Skript): `APP_PIN`.
- **Im Gerät (localStorage):** nur Passwort, Script-Adressen, geladene Einstellungen und zuletzt bekannte Kontostände.
  Schlüssel mit Vorsilbe `thetadex_`. Keine Tracking-Einträge im Gerät speichern. Abmelden löscht alles.
- **Service Worker** (`sw.js`): App-Dateien zwischenspeichern (`<name>-<VERSION>`), Daten nicht im Service Worker,
  Anfragen an die Skripte nie aus dem Zwischenspeicher. Jede geänderte Datei braucht eine neue VERSION, sonst bekommen Geräte sie nicht.
- **Barrierefreiheit beim Bauen:** genau eine `h1` je Seite, jedes Feld mit Beschriftung, Fenster mit `role="dialog"` und `aria-modal="true"`,
  Überschriften ohne Sprung.

---

## 6. Dateiübersicht

- Hauptordner: `CLAUDE.md` (zeigt nur hierher), `README.md`, `index.html`, `manifest.webmanifest`, `sw.js`, `.nojekyll` (GitHub Pages ohne Jekyll).
- `css/`: `base.css` (Farben, hell und dunkel), `layout.css` (Kopf, Reiterleiste unten am Handy, links am PC), `components.css`.
- `js/`: `app.js` (Routing, Reiterleiste, Update-Hinweis), `config.js` (VERSION, `features`, `BEREICHE`, `SKRIPTE`), `api.js`, `store.js`, `ui/dom.js`.
- `js/views/`: `start.js`, `platzhalter.js` (Reiter ohne Inhalt), `einrichtung.js`, `info.js`, `nichtgefunden.js`.
- `icons/`: `thetadex-icon.svg`, `thetadex-icon-512.png`, `-192.png`, `-180.png` (Apple).
- `docs/`: `STAND.md` (diese Datei); während einer Etappe ihr Plan.
- `apps-script/tracking/Code.gs` (ohne PIN), `apps-script/finanzen/Code.gs` (Passwort in den Skripteigenschaften).

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

### 7.2 Plan Version 1 (Grobfassung, wird in 0.3 ausgearbeitet)

- **Etappe 1 „Bestehendes umziehen“:** Reiter Tracking und Finanzen mit denselben Sheets. Blatt `Einstellungen` je Sheet.
  Fehler werden angezeigt, Eingaben bleiben bei Fehlern stehen.
  **Tor:** Die Person ist mit der neuen App zufrieden (Richtwert 2 Wochen). Dann alte Bereitstellungen archivieren und alte Repos löschen.
- **Etappe 2 „Einfache neue Reiter“:** neues Sheet und Skript `leben`; Einkaufsliste und Essensideen, ToDos, Besitz – einer nach dem anderen.
- **Etappe 3 „Komplexe Reiter“:** Uni (Stundenplan, Module, Termine), DSA-Charakterbögen.
- **Etappe 4 „Ausbau“ (optional):** Startseite mit Heute-Übersicht, Eingabe ohne Netz, evtl. Datenbank statt Sheets.

---

## 8. Geschichte (kurz)

- **Etappe 0** (ab 0.0.0): Repo angelegt, Start-Datei `docs/STAND.md` übernommen.
- **0.0.1** Schritt 0.1: App-Gerüst, Ersteinrichtung, Icons.
