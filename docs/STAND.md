# STAND – Thetadex

**Diese Datei ist die Haupt-Doku für den Agenten:** Arbeitsregeln, Aufbau, aktueller Stand, Festlegungen und Pläne.
Lies sie zuerst, bei jeder Aufgabe. Der Rückblick (was wann gebaut wurde) steht in `docs/GESCHICHTE.md`; die liest du nur bei Bedarf (Entscheidung der Person, 16.11.2026). `CLAUDE.md` im Hauptordner zeigt nur hierher.
Für eine neue Etappe kommt ein eigener Plan dazu (`docs/PLAN-ETAPPE-<n>.md`); am Ende der Etappe wird er hier eingearbeitet und gelöscht.

- Version der App: **1.3.30** (gleich in `js/config.js` und `sw.js`: beide Dateien prüfen; die Dateien gibt es ab Schritt 0.1)
- Repo: https://github.com/TimMelchert/thetadex (öffentlich)
- Seite (App): https://timmelchert.github.io/thetadex/
- Etappe 2 „Bestehendes umziehen“ ist fertig (30.10.2026). Der Umstieg von den alten Apps ist erledigt (1.11.2026).
- Etappe 3 „Besitz“ ist fertig (30.10.2026).
- Etappe 4 „Einkauf und Essen“ ist fertig (30.10.2026).
- Etappe 5 „Uni“ ist fertig (31.10.2026). Festlegungen in 4 („Uni, Sheet ‚Gemeinsam‘“).
- Etappe 6 „Pen & Paper“ (DSA und DnD) ist fertig (1.11.2026). Festlegungen in 4 („Pen & Paper, Sheet ‚DSA‘“).
- Etappe 7 „Umstieg und Aufräumen“ ist fertig (1.11.2026). Die alten Apps sind abgelöst.
- Etappe 8 „Prüfen und Version 1.0.0“ ist fertig (1.11.2026): Berichte in den Projektdateien (`pruefung/`), Version 1.0.0.
- Etappe 9 „Kontowecker“ ist fertig (1.11.2026): Kontowecker-SMS kommen von selbst ins Finanz-Sheet, Festlegungen in 4 („Kontowecker“).
- Etappe 10 „Visitenkarte“ ist fertig (4.11.2026): Festlegungen in 4 („Visitenkarte“).
- Etappe 11 „Rezepte“ ist fertig (7.11.2026): Festlegungen in 4 („Einkauf, Sheet ‚Gemeinsam‘“, Abschnitt Rezepte). 
- Etappe 12 „Entschlacken“ (1.3.28 bis 1.3.28, Abschluss ist 1.3.28: Entscheidung der Person, 16.11.2026) läuft: Bericht `pruefung/entschlacken-bericht.md` in den Projektdateien, Schritte 12.1 bis 12.4 (Pull Requests #105 bis #108).

Inhalt: 1 Arbeitsregeln · 2 Aufbau · 3 Aktueller Stand und Offen · 4 Festlegungen je Bereich · 5 Technik-Merkzettel ·
6 Dateiübersicht · 7 Pläne · 8 Geschichte (Verweis auf `docs/GESCHICHTE.md`)

---

## 1. Arbeitsregeln

### 1.1 Worum es geht und mit wem du arbeitest

Eine persönliche App (PWA) für eine Person, am Handy und am PC. Einkauf und Uni teilt sie mit ihrer Partnerin oder ihrem Partner, DSA-Bögen per Link. Sie führt zwei bestehende Apps zusammen
(Tracking Leben, Finanzmanager) und bekommt neue Reiter: Döner-Bewertung (öffentlich), DSA-Charakterbögen, Einkaufsliste und Essensideen,
Besitz-Inventar, Uni mit Kalender und Modulen. Die Daten liegen in Google Sheets der Person, nicht im Repo.

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
   Merkzettel (5), Dateiübersicht (6) und eine kurze Zeile unten in `docs/GESCHICHTE.md` (Teil 3); in Abschnitt 8 hier bleiben nur die letzten drei Versionen. Keine langen Berichte je Schritt:
   Einzelheiten stehen im Pull Request.
8. Prüfe deine Arbeit (1.7), dann öffne den Pull Request mit dem Text aus 1.8.

### 1.5 Harte Regeln

- **Version:** Bei jeder Änderung `VERSION` in `js/config.js` UND in `sw.js` gemeinsam hochzählen. Beide müssen am Ende exakt gleich sein.
  Vor 1.0: Etappe = mittlere Zahl (0.1.0, 0.2.0 …), Schritte und Nachbesserungen den letzten Teil (0.1.0 → 0.1.1).
  Ab 1.0.0 (1.11.2026): Etappe 9 = 1.1.x, Etappe 10 = 1.2.x und so weiter; Schritte und Nachbesserungen wie bisher den letzten Teil.
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
- Hash-Routing: `#/tracking`, `#/doener`, `#/finanzen`, `#/dsa`, `#/einkauf`, `#/besitz`, `#/uni`, `#/einstellungen`, `#/info`, ab 10.3 `#/visitenkarte` (Kachel auf der Startseite, am PC auch in der Seitenleiste, am Handy nicht in der Leiste: `nurBreit` in `BEREICHE`, CSS `.reiter-nur-breit`).
  Dazu ohne Anmeldung `#/bogen/<skript>/<schluessel>` (geteilter Charakterbogen, nur lesen, siehe 4 „DSA teilen“)
  und `#/doener/<skript>` (öffentliche Döner-Bewertung, siehe 4 „Döner öffentlich“)
  und `#/karte/<skript>/<schluessel>` (Visitenkarte, nur lesen, ohne Reiterleiste und Kopf-Links, ab 10.2, siehe 4 „Visitenkarte“).
  Unbekannte Adressen zeigen „Seite nicht gefunden“.
- Startseite: Karteikarte mit den farbigen Reitern (`icons/thetadex-karte.svg`, ohne dunklen Grund) und Kacheln aller sichtbaren Reiter. Eine Heute-Übersicht gibt es nicht (Entscheidung der Person, 1.11.2026).
- Eine Ansicht ist `js/views/<name>.js` mit `render(container, ctx)`. Welche Reiter es gibt, steht in `js/config.js` (`features`).
  Sichtbar ist ein Reiter nur, wenn die Adresse seines Skripts eingetragen ist (`BEREICHE[].skript`, ab 0.4.8): Tracking `tracking`, Finanzen `finanzen`,
  Pen & Paper (Kennung `dsa`) `dsa` (ab 6.1), Einkauf und Uni `gemeinsam`, Besitz `leben`. Döner ist immer da.
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
  | Visitenkarte | `apps-script/karte/Code.gs` | neues Sheet „Visitenkarte“ (ab Etappe 10), je Karte per Link lesbar, eigenes Passwort `KARTE_PIN` |
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
- **Ohne Passwort** gibt nur das Skript `dsa` etwas heraus (genau einen Bogen, nur lesen, nur mit seinem Freigabe-Schlüssel),
  das Skript `karte` (genau eine Visitenkarte, nur lesen, nur mit ihrem Schlüssel, ab 10.1) und das Skript `doener` (Bewertungen lesen und neue anlegen, nie ändern oder löschen).
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
  (Tracking: Felder mit Gruppe, Art und Vorgabewert; Finanzen: Zwecke, Kategorien, Rückzahlungs-Personen, ab 9.2 Suchwörter für Kontowecker-SMS; ab 1.3.26 Spalte F `monate` = Monate, in denen ein fester Zweck fällig ist, zum Beispiel `9`, leer = jeden Monat).
  Das Finanz-Sheet hat ab 11.11.2026 das Hilfsblatt `Alle Buchungen` (eine Formel holt Konto, PayPal, Kreditkarte, Portemonnaie zusammen; Spalten `Konto, Datum, Monat, Zweck, Kategorie, Einnahme, Ausgabe, Geteilt, Jahr, Ausgabe Anteil`). Die Spalten `-Out` und `-In` in `Analyse Monate` rechnen seitdem mit kurzen `SUMMEWENNS` daraus. Die Netto-Spalten und `Monatsnetto` bleiben wie vorher (Entscheidung der Person: alte Verrechnung gilt rückblickend weiter). Namen in Zeile 6 und 7 von `Analyse Monate` nie ändern, die App liest Zeile 7.
  Das Finanz-Sheet hat ab 9.1 zusätzlich das Blatt `SMS` (Kopfzeile 1: `id, empfangen_am, gesendet_am, absender, text, pruefsumme, status, erledigt_am`).
- **Neues Sheet** für die neuen Reiter: Kopfzeile in Zeile 1 (klein, ohne Umlaute). Alle Daten-Blätter haben zusätzlich
  `id, erstellt_am, geaendert_am, geloescht`. Die genauen Spalten legt der Plan der jeweiligen Etappe fest. Geplante Blätter:
  | Sheet | Blätter |
  | --- | --- |
  | Leben | `besitz` (Orte und Kategorien stehen als Text darin, kein Blatt `orte`, Entscheidung 30.10.2026) |
  | Gemeinsam | `lebensmittel`, `vorrat`, `gerichte`, `zutaten` (Gericht ↔ Lebensmittel mit Menge), `einkaufsliste`, ab 1.3.17 `laden_reihenfolge` (Spalten in 4 „Einkauf“); ab Etappe 5 `semester`, `module`, `kurse`, `termine`, `uni_einstellungen` (`stundenplan` nur noch alt und seit 0.7.3 nicht mehr im Skript; das Blatt darf die Person löschen) |
  | Döner | `bewertungen` (`laden, doener, yufka, pommes, ladennote, begruendung, fleisch` + Standardspalten), `laeden` (`name`),
    `kriterien` (`teil, name`, die Person pflegt sie), `details` (`bewertung_id, teil, kriterium, wert, begruendung`) |
  | DSA | `boegen` (ein Bogen je Zeile), `eintraege` (eine Zeile je Vorteil, Talent, Zauber, Waffe, Gegenstand), `verlauf` (Geld, AP, AsP, LeP), `abenteuer`, `sessions`; Spalten in 4 „Pen & Paper, Sheet ‚DSA‘“ |

---

## 3. Aktueller Stand und Offen

### 3.1 Stand

- Die zwei alten Apps (Repos `Tracking-Leben` und `App-Finazen-Tabelle`) sind abgelöst (Umstieg 1.11.2026): alte Bereitstellungen archiviert, Repos gelöscht.
- Die alten Sicherungen der Skripte (`apps-script-backup/` in den Projektdateien) sind seit 1.3.28 gelöscht (Entscheidung der Person, 16.11.2026): Jede Fassung steht in `apps-script/` und in der Geschichte des Repos. Die Skripte der alten Apps im Überblick:
  - Finanzen: Passwort in Skripteigenschaft `APP_PIN`, Sperre nach Fehlversuchen, `LockService`, Eingabeprüfung.
  - Tracking (ab 0.2): Passwort aus `APP_PIN`, Sperre, JSON-Antworten, `LockService`, Prüfung von Datum und Feldnamen.
    Aktionen: `ping` (nur prüfen), `einstellungen` (Felder aus Blatt `Einstellungen`, ab 2.1), `eintragen` (`datum` als JJJJ-MM-TT, `values` = Spaltenname → Wert).
    `tabelle` (`jahr`: Einträge eines Jahres und Liste der Jahre, ab 2.3).
    Funktion `einrichten` legt das Blatt `Einstellungen` an (Spalten `feld, gruppe, art, vorgabe, optionen, schritt, farben`).
  - Finanzen: Aktionen `stats`, `analyse` (ab 2.4 mit `kategorien` je Monat: `aus`, `ein`, `netto`), `buchen`, `einstellungen` (ab 2.2: Zwecke, Kategorien, Rückzahlungen, Eigenanteile
    aus Blatt `Einstellungen`, Spalten `liste, name, kategorie, betrag, zweck`). Funktion `einrichten` legt das Blatt an.
    Ab 9.1: Aktion `sms` (ohne Passwort, nur mit `SMS_SCHLUESSEL`, legt eine SMS im Blatt `SMS` als „offen“ ab, antwortet nur `ok`); `einrichten` legt auch das Blatt `SMS` an.
    Ab 1.3.12 liefert `analyse` auch `zweckAusgaben` (je Monat Ausgaben der festen Zwecke) und ab 1.3.14 `zweckEinnahmen` (je Monat Einnahmen der festen Zwecke, zum Beispiel Gehalt) und `rueckzahlungen` aus Konto, Paypal, Kreditkarte und Portemonnaie, nur für die Zwecke und Kategorien der Liste `rueckzahlung` (vorher nur Konto und nur Abos/Wohnen). Umbuchungen (Kategorie `Transfer`) zählen nicht, `GETEILT` halb.
    Ab 1.3.15: `buchungen` (`jahr`, optional `monat`): Buchungen aus dem Hilfsblatt `Alle Buchungen` (nur lesen, ohne `Transfer`, `aus` = eigener Anteil), für „Größte Ausgaben“ und „Letzte Buchungen“ in der Auswertung. Die App lädt sie erst beim Anzeigen und hält sie nur im Speicher.
    Ab 1.3.16 liefert `analyse` auch `vermoegen` (`verlauf`: Vermögen am Ende jedes Monats, rückwärts vom Gesamtstand in `Übersicht` gerechnet mit der Spalte `Haben aktuell` (Kopfzeile 7) jedes Konto-Blatts; `fehlend`: Blätter ohne diese Spalte).
    Ab 1.3.26: `analyse` liegt 10 Minuten im Zwischenspeicher des Skripts (CacheService, in Stücken); `buchen` löscht ihn, `frisch: true` (Knopf „Neu laden“) fragt am Speicher vorbei. Jedes Konto-Blatt wird je Aufruf nur einmal gelesen (`kontoDaten_`). `einstellungen` liefert bei Zwecken `monate`.
    Ab 9.2: `smsListe` (offene SMS), `smsErledigt` (`id`, verwerfen), `buchen` mit `sms_id` (bucht und setzt die SMS im selben Lauf auf „gebucht“; ist sie schon erledigt, Fehler `erledigt`). Nach der Zuordnung löscht das Skript Text und Absender. `einstellungen` liefert dazu `smsWoerter` (Liste `sms`: `name` = Suchwort, `zweck`, `kategorie`).
- Was in welcher Etappe gebaut wurde (Etappen 0 bis 11, jeweils fertig, siehe Kopf dieser Datei), steht ausführlich in `docs/GESCHICHTE.md` (Teil 1).
  Die gültigen Regeln je Bereich stehen in Abschnitt 4. Bei Widerspruch gilt Abschnitt 4.
### 3.2 Offen

- Alle sechs Skripte sind im Editor auf dem Stand des Repos (eingefügt und bereitgestellt nach 0.8.4, 1.11.2026). `finanzen` ist seit 9.2 (1.1.4) auf dem Stand des Repos; ab 1.3.16 neue Fassung (feste Einnahmen, Aktion `buchungen`, Vermögensverlauf) einfügen und als neue Version bereitstellen. Ab 1.3.26 wieder neue Fassung (Zwischenspeicher, Spalte `monate`) einfügen und als neue Version bereitstellen. `leben`: ab 1.3.25 neue Fassung (Spalte `unklar`) einfügen, `einrichten` ausführen, als neue Version bereitstellen. Ab 1.3.30: `karte` und `gemeinsam` neue Fassung einfügen und als neue Version bereitstellen (erst nachdem 1.3.29 auf den Geräten ist).
- **ToDo für die Person:** Beträge für feste Zwecke im Finanz-Sheet, Blatt `Einstellungen`, Spalte D (`betrag`) eintragen. Die Auswertung zeigt daraus „Feste Ausgaben“ (bezahlt, wenn im Monat eine Ausgabe mit diesem Zweck gebucht ist) und ab 1.3.14 „Feste Einnahmen“ (Zweck, dessen Kategorie es nur bei den Einnahmen gibt, zum Beispiel Job).

---

## 4. Festlegungen je Bereich

Diese Regeln gelten. Wer etwas daran ändert, ändert es hier mit. Ausnahmen von den Grundsätzen (1.2) stehen hier mit Grund.

- **Repo öffentlich** auf GitHub Pages, damit keine Kosten entstehen. Deshalb gelten die Regeln „Script-Adressen“ und „Persönliches“ in 1.5.
- **Finanzen: Die Rechnung bleibt im Sheet** (Entscheidung der Person, 9.11.2026). Summen je Monat und Kategorie kommen aus den Formeln im Blatt `Analyse Monate`, damit das Sheet auch ohne App funktioniert. Die App rechnet nur aus diesen Summen weiter (Vergleich, Summe, Durchschnitt, Sparquote); kein Rechnen aus den einzelnen Buchungen. Prüfbericht und Plan der Schritte A1–A5: Projektdateien `pruefung/finanz-auswertung-bericht.md`.
- **Finanzen: Kreditkarte gibt es nicht mehr** (Person, 9.11.2026). Die App zeigt sie nicht mehr bei den Ständen und beim Buchen. Das Blatt `Kreditkarte` bleibt mit den alten Buchungen im Sheet und zählt in `Analyse Monate` weiter mit; das Skript kennt es weiter (`KONTEN_`). Die Einnahme `Zuhause` (Zuschuss) kommt nicht mehr, `Netto-Essen` (= `Zuhause-In − Essen-Out`) zählt darum ab jetzt wie die volle Essen-Ausgabe.
- **Finanzen: keine Finanzdaten öffentlich** (Wunsch der Person, 29.10.2026). Das Finanz-Skript darf ins Repo, weil es keine Daten,
  Beträge oder Geheimnisse enthält. Beträge, Kontostände, Buchungen und Namen erscheinen nie im Repo, auch nicht in Kommentaren,
  Beispielen oder Pull-Request-Texten.
- **Daten bleiben in den bestehenden Sheets.** Kein Export oder Import. Die neue App spricht dieselben Sheets an.
- **Jedes Skript bekommt beim Umzug eine neue Bereitstellung** (neue Adresse). Die alten Bereitstellungen sind seit dem Umstieg (1.11.2026) archiviert.
- **QR Code Generator** (`qrcode-generator` 1.4.4, Kazuhiko Arase, MIT) als lokale Datei `vendor/qrcode.js`, nur in der Visitenkarte geladen (Entscheidung der Person, 4.11.2026: kostenlos und dauerhaft, kein fremder Dienst sieht den Link).
- **Chart.js** (Finanz-Auswertung) als lokale Datei in `vendor/`, feste Version 4.4.1, statt aus dem Internet. Grund: keine fremden Server. Bestätigt von der Person am 29.10.2026 (Ringe wie bisher statt CSS-Balken).
- **Icons** als eigene SVG-Dateien statt Google Fonts (Material Icons). Grund: keine fremden Server.
- **Erscheinungsbild** (entschieden am 29.10.2026):
  - Name Thetadex, Zeichen ϑ (kleines geschwungenes Theta, U+03D1), klassischer Serifenschnitt.
  - Icon: Karteikarte in Graphit mit weißem ϑ, sieben farbige Register-Reiter am rechten Rand, Hintergrund Kohle.
    Dateien `icons/thetadex-icon.svg` und `icons/thetadex-icon-512.png` (von der Person ins Repo kopiert).
  - Grundfarben: Kohle `#1C1B19` (Icon-Grund, Hintergrund dunkel), Graphit `#2A2826` (Kacheln dunkel), Karte im Icon `#3A3734`,
    Hintergrund hell `#F3F0EA`, Kacheln hell `#ECE8E1`, Linien hell `#D8D3CA` (seit 0.6.1 leicht beige-grau statt fast weiß, Wunsch der Person), Schrift auf Karte `#F4F2EE`.
  - Kopfzeile (Icon, Name, Einstellungen, Info) immer in Kohle `#1C1B19` mit heller Schrift, auch im hellen Modus (`--kopf-…` in `css/base.css`, Wunsch der Person, 31.10.2026).
    Die Leiste am Handy (`theme-color`) ist darum immer Kohle.
  - Pen & Paper zeigt einen W20 (`icons/w20.svg`, Flächen in Tönen der DSA-Farbe) vor der Überschrift (Wunsch der Person, wie 🥙 und 📦).
  - Bereichsfarben: Tracking `#E07A5F`, Finanzen `#8DB580`, DSA `#B5838D`, Einkauf/Essen `#D4B483`,
    Besitz `#7FA7A0`, Uni `#C9784A`, Döner `#E2A23B` (frühere Farbe von ToDos, der Reiter ist am 29.10.2026 entfallen). Kein Blau.
    Damit gibt es wieder sieben Reiter, passend zum Icon.
    Ausnahme Visitenkarte (Wunsch der Person, 4.11.2026): eigene Farbe Olivgrün `#A8AE6E` (`--farbe-visitenkarte`, Kontrast 7,3:1 zur Schrift), nur für die Kachel, den Reiter und die Karte, nicht im Icon.
    Zweite Ausnahme: Die Symbole für Instagram, LinkedIn und Signal (`icons/social/`, selbst gezeichnet) haben ihre Markenfarben, auch Blau (Wunsch der Person, 4.11.2026).
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
  | Visitenkarte | lesen, Links verwalten (eigenes Passwort `KARTE_PIN`); ändern nur im Sheet | – | eine Karte per Link, nur lesen; E-Mail und Telefon gleich sichtbar (ab 1.2.8) |
  | Döner | lesen, bewerten; löschen nur im Sheet | wie alle | lesen, bewerten |
- **Besitz: keine Daten öffentlich** (Wunsch der Person). Wie bei Finanzen: keine Gegenstände, Orte oder Preise im Repo.
  Auch die Namen bei „Ausgeliehen an“ stehen nur im Sheet „Leben“, nie im Repo, in Beispielen oder Pull-Request-Texten.
- **Besitz, Blatt `besitz` im Sheet „Leben“** (Etappe 3): Spalten `id, name, kategorie, ort, anzahl, kaufpreis, kaufdatum, notiz,
  erstellt_am, geaendert_am, geloescht, gehoert_zu, bild, ausgeliehen_an, ausgeliehen_anzahl, ausmisten`. Pflicht: Name (80), Kategorie (40), Ort (130, siehe Unterorte), Anzahl (0 bis 9999).
  Freiwillig: Kaufpreis (bis 1.000.000 €), Kaufdatum (nicht in der Zukunft), Notiz (300), Ausgeliehen an (60), davon ausgeliehen (ganze Zahl 1 bis Anzahl, leer = alle, nur mit „Ausgeliehen an“). `einrichten` ergänzt fehlende Spalten am Ende.
  Orte und Kategorien haben kein eigenes Blatt: Die Auswahl entsteht aus der Liste, Umbenennen im Sheet mit „Suchen und ersetzen“.
  Keine Summe der Kaufpreise (Wunsch der Person). Ändern schickt `geaendert_am` mit; ist die Zeile inzwischen anders, speichert das Skript nicht.
  Löschen ist weich (`geloescht = TRUE`, im Sheet zurückholbar); Zubehör einer gelöschten Hauptsache bleibt als eigene Sache.
  Unterorte (ab 1.3.20, Wunsch der Person, 15.11.2026): `ort` hat bis zu drei Ebenen, getrennt mit „ / “ (zum Beispiel „Zimmer / Regal / Kiste“).
  Im Formular drei Felder (Ort, Darin, Darin), je bis 40 Zeichen, die Auswahl zeigt nur Unterorte des gewählten Oberorts. Der Ort-Filter ist ein Baum:
  Ein Oberort zeigt auch alles in seinen Unterorten. Liste je Raum mit kleineren Überschriften je Unterort; Übersicht „Je Ort“ eingerückt.
  Ausmisten (ab 1.3.20): Spalte `ausmisten`, leer = nein, sonst `offen`, `verkaufen`, `verschenken`, `entsorgen` (prüft das Skript). Filter „Ausmisten“, Kachel und Tabelle in der Übersicht.
  Zubehör nur eine Ebene. Anzahl 0 heißt „nicht mehr da“: ausgeblendet, außer mit Zubehör oder mit dem Haken „Auch Items mit Anzahl 0 zeigen“.
  Liste kompakt (ab 1.3.21, Wunsch der Person): am Handy nur Name, rechts die Anzahl und die Zeile mit Zubehör, Bild, ausgeliehen, ausmisten; am PC Spalten Name, Anzahl, Kaufpreis, Kaufdatum.
  Ab 1.3.22 (Wunsch der Person, 16.11.2026): In der App heißen Sachen „Items“ (Spalten und Code bleiben `sachen`/`besitz`). Der Listenkopf (Titel, Unterreiter, Suche, Filter, Sortierzeile) scrollt mit (ab 1.3.27 wieder, Wunsch der Person: fest nahm er am PC zu viel Platz weg); nur die Kopfzeile der App bleibt angeheftet. Die Sortierzeile (Name, Anzahl, Kaufpreis, Kaufdatum) steht am PC einmal oben unter den Filtern, darunter die Orte als Überschriften.
  Zubehör bleibt aufklappbar, steht aber eingerückt in der Kachel der Hauptsache (am PC mit innerer Linie).
  Tipp auf ein Item zeigt erst seine Daten mit Bild; darin lassen sich Ausleihen (Haken und Name) und Ausmisten (Haken und Art) direkt ändern, „Übernehmen“ speichert. „Bearbeiten“ öffnet das Formular. Nach dem Speichern schließt es sich, der Ort bleibt stehen.
  Unklar (ab 1.3.25, Wunsch der Person, 16.11.2026): freiwillige Spalte `unklar` am Ende des Blatts, nur im Sheet gepflegt (die App ändert sie nie, Speichern verlangt sie nicht).
  Leer = klar, sonst ein kurzer Text, was zu klären ist. Die Kachel ist dann gelb (`--besitz-unklar`), das Fenster zeigt „Unklar“ mit dem Text, die Suche findet ihn.
  Übersicht zählt Items mit Anzahl über 0, Zubehör eingeschlossen, als Items und als Stück (ohne Hinweistext darunter).
  Bild-Kacheln (ab 1.3.23, Wunsch der Person, 16.11.2026): Items der Kategorien Filme, Bücher (auch „Bücher und Hefte“) und Spiele stehen je Ort als Kacheln nebeneinander (Handy zwei, PC vier je Reihe), ab 1.3.24 nur, wenn oben im Filter diese Kategorie gewählt ist (sonst Zeilen wie alle anderen), oben das Bild (ohne Bild ein Zeichen 🎬 📚 🎲), darunter der Name.
  Erkannt am Anfang der Kategorie (`GALERIE` in `js/views/besitz.js`). Bilder lädt die Liste erst, wenn die Kachel fast zu sehen ist, höchstens drei gleichzeitig, nur im Arbeitsspeicher.
- **DSA teilen:** Jeder Bogen hat einen zufälligen, langen Freigabe-Schlüssel (Spalte `freigabe` im Blatt `boegen`).
  Der Link enthält die Skript-Kennung und diesen Schlüssel, nie das Passwort. „Neuen Link erstellen“ macht alte Links ungültig.
  Die geteilte Ansicht zeigt den ganzen Bogen, aber keine Knöpfe zum Ändern. Grund: Bögen sollen ohne Passwort an andere gehen.
- **Pen & Paper, Sheet „DSA“** (Etappe 6, Plan eingearbeitet am 1.11.2026). Reiter heißt „Pen & Paper“; Kennung `dsa`, Adresse `#/dsa`, Skript `dsa`
  und Sheet „DSA“ heißen weiter so. Eigenes Sheet und eigenes Skript: Ein Fehler beim Teilen kann nie andere Bereiche verraten (2.2).
  Nur `APP_PIN` (Rolle Person), `PARTNER_PIN` kennt das Skript nicht. Ohne Passwort nur `geteilt`.
  - **Keine Bögen im Repo:** keine Namen von Helden, keine Werte, keine Zauber-Texte, auch nicht in Beispielen, Tests oder Pull-Request-Texten.
    Im Repo stehen nur allgemeine Spielbegriffe als Vorlage (Kürzel wie MU, KL, Namen der Talent-Gruppen). Tabellen zum Einfügen nur in den Projektdateien.
  - **DnD wie DSA** (Entscheidung der Person, 31.10.2026): eine Vorlage für beide; Spalte `regelwerk` (`dsa`, `dnd`) zeigt nur die Marke. Eigenschaften,
    Gruppen und Zähler sind frei änderbare Listen. Braucht DnD Anpassungen, meldet die Person sie.
  - Alle Blätter haben zusätzlich `id, erstellt_am, geaendert_am, geloescht`; Löschen ist weich, Ändern schickt `geaendert_am` (Schutz vor Überschreiben).
    | Blatt | Spalten (Grenzen) |
    | --- | --- |
    | `boegen` | `name` (Pflicht, 80), `regelwerk`, `kopf` (JSON, je Feld 80), `eigenschaften` (JSON-Liste Kürzel, Name, Wert, Gruppe; höchstens 40), `zaehler` (JSON-Liste Kürzel, Name, Art `geld`/`leben`/`ap`/`zahl`, Start, Höchstwert; höchstens 6), `bild` (Drive-Kennung), `freigabe` (Schlüssel, setzt das Skript), `notiz` (1000); höchstens 20 Bögen |
    | `eintraege` | `bogen_id`, `abschnitt` (`vorteil`, `nachteil`, `sonderfertigkeit`, `gabe`, `talent`, `zauber`, `waffe`, `besitz`), `gruppe` (40), `name` (Pflicht, 80), `wert` (Text, 20), `probe` (30), `felder` (JSON, je Feld 200), `text` (3000), `reihenfolge` (0 bis 9999); höchstens 1000 je Bogen |
    | `verlauf` | `bogen_id`, `zaehler` (muss es am Bogen geben), `aenderung` (ganze Zahl, ±1.000.000; Geld in Kreuzern), `notiz` (100), `datum` (setzt das Skript) |
    | `abenteuer` | `bogen_id`, `art`, `titel` (80), `text` (10000), `abgeschlossen`, `bilder` (siehe unten) |
    | `sessions` | `abenteuer_id`, `datum` (JJJJ-MM-TT), `text` (3000); höchstens 300 je Abenteuer |
  - Weitere Felder je Abschnitt (`felder`): Zauber Kosten, Zauberdauer, Wirkungsdauer, Reichweite, Technik, Merkmale, Hauszauber, Modifikationen (höchstens 20);
    Waffe Art, INI, AT, PA, TP, BE, Reichweite; Talent BE, Spezialisierung; Besitz Ort, Gewicht.
  - Warum eine Zeile je Eintrag statt JSON-Spalten: Eine Zelle fasst höchstens 50.000 Zeichen, lange Zauber-Texte kämen an die Grenze.
    So ist das Sheet lesbar, ein Eintrag lässt sich einzeln ändern, und Bögen lassen sich als Tabelle einfügen.
  - **Stand eines Zählers** = Startwert plus alle Änderungen; Leben und AsP nie über dem Höchstwert, Geld nie unter 0. Geld: 1 Dukaten = 10 Silbertaler
    = 100 Heller = 1000 Kreuzer. **AP** (Entscheidung der Person): „+“ gesammelt, „−“ ausgegeben; oben nur die gesammelten, im Verlauf beide.
    Verlauf löschen nur im Sheet (wie ein Kassenbuch).
  - **Geteilt:** nie `freigabe`, kein Verlauf (nur aktuelle Werte, Entscheidung der Person), nichts von anderen Bögen, nie DM oder Ideen.
    Falsche Schlüssel zählen für eine Sperre (20 in 15 Minuten).
  - Im Gerät nur die Wahl des Bogens (`thetadex_dsa_bogen`), die eigenen Links (`thetadex_dsa_links`) und die Ansicht (`thetadex_dsa_modus`).
    Kein Bogen ohne Netz (Entscheidung der Person: online reicht). Fenster schließen nur mit × oder Abbrechen.
  - Abenteuer (0.6.8): Blatt `abenteuer` (`id, bogen_id, art, titel, text, abgeschlossen` + Standard), `art` = `spieler` (gehört zu einem Bogen),
    `dm` (ohne Bogen, mit `abgeschlossen`) oder `ideen` (genau eine Zeile, das Textfeld „Abenteuerideen“). Text höchstens 10000 Zeichen.
    Spalte `bilder` (ab 0.6.9): JSON-Liste von Drive-Kennungen, höchstens 30, nur bei `spieler`; Dateien im Ordner „Thetadex DSA“.
    `bild` (mit Passwort) liefert auch diese Bilder; `geteilt` mit `bild` nur Bilder der Abenteuer dieses Bogens.
    Blatt `sessions` (`id, abenteuer_id, datum, text` + Standard), nur zu `spieler`-Abenteuern, Datum JJJJ-MM-TT, Text höchstens 3000 Zeichen.
    Löschen eines Bogens löscht seine Abenteuer und Sessions mit (weich), Löschen eines Abenteuers seine Sessions.
    `geteilt` gibt nur `spieler`-Abenteuer des Bogens und ihre Sessions heraus, nie `dm` oder `ideen`. Fehlen die Blätter noch, läuft `liste` trotzdem.
- **Visitenkarte, Sheet „Visitenkarte“** (Etappe 10, Plan eingearbeitet am 4.11.2026). Eigenes Sheet und Skript `karte`: Ein Fehler hier kann nie andere Bereiche verraten (2.2).
  Die Online-Karte ist nur der Notfall, wenn keine Papierkarte dabei ist (Person). Kein Impressum, keine Datenschutzerklärung, kein Foto (Entscheidung der Person, 4.11.2026).
  - **Drei Karten** `privat`, `arbeit`, `aktivismus`, jede mit eigenem Link `#/karte/<skript>/<schluessel>` (Schlüssel 64 Zeichen). **Ein Link zeigt nur seine Karte**, Besucher haben keinen Umschalter.
    „Neuen Link erstellen“ macht alten Link und alte QR-Codes ungültig. Die Script-Adresse steht im Link, weil Besucher nichts eingerichtet haben; ohne Schlüssel gibt sie nichts heraus.
  - **Eigenes Passwort `KARTE_PIN`** (Fund 4 der Prüfung, Entscheidung der Person): Das Skript kennt `APP_PIN` nicht, die App schickt ihm nur `KARTE_PIN` (`eigenesPasswort` in `SKRIPTE`). Grund: Seine Adresse geht an Fremde.
  - Blatt `angaben`: `id, art, titel, wert, link, bild, karten, reihenfolge, erstellt_am, geaendert_am, geloescht, zusatz`. `art` = `name`, `status`, `email`, `telefon`, `adresse` (ab 1.2.10, im Block Kontakt, Link zu OpenStreetMap erst beim Tipp), `social`, `veroeffentlichung`, `text`;
    `titel` 60, `wert` 200, `link` nur `https://` (300), `bild` Drive-Link bei Veröffentlichungen (Vorschaubild) und beim Status (Logo der Gruppe, ab 1.2.8), oder die Wörter `hut` (Studentenhut, `icons/reiter/uni.svg`, ab 1.2.9) und `stift` (Stift, `icons/symbole/stift.svg`, ab 1.2.11) bei jeder Art: Symbol links vor dem Text, `karten` zum Beispiel `privat, aktivismus`. Höchstens 100 Angaben. Pflege nur im Sheet; fehlende `id` ergänzt das Skript.
    `zusatz` (ab 1.2.10, 200, freiwillig bis zum nächsten `einrichten`): steht beim Status direkt nach `wert`, aussehend wie eine Beschriftung (normale Größe, nicht fett, leise Farbe, ab 1.2.11). Kleine PNG, GIF, WebP (bis 400 KB) schickt das Skript als Datei selbst, damit durchsichtige Hintergründe bleiben.
    Blatt `links`: `id, karte, schluessel, erstellt_am, geaendert_am`.
  - **Öffentlich nur, was passt:** leere oder unbekannte `karten` = auf keiner Karte (Fund 2); E-Mail nur `name@domain`, Telefon nur Ziffern, `+`, Leerzeichen, `/`, `-` (Fund 3).
    Was nicht passt, steht in der Vorschau der Person unter „Erscheint auf keiner Karte“ mit Grund.
  - **Reihenfolge** (ab 1.2.8): Name und Status stehen immer oben. Danach stehen die Blöcke (jeder Text einzeln, Kontakt, Social Media, Veröffentlichungen) dort, wo ihre erste Angabe nach `reihenfolge` steht. Text mit kleiner Zahl = oben, mit großer Zahl (z. B. 99) = unten.
  - **Aktionen:** mit `KARTE_PIN` `ping`, `angaben`, `link`, `link_weg`, `bild`; ohne Passwort nur mit Schlüssel `karte` (ab 1.2.8 mit E-Mail und Telefon, ohne zweiten Tipp: Wunsch der Person, der Tipp schützte kaum; die alte Aktion `kontakt` ist seit 1.3.30 weg), `bild_karte` (Vorschaubild oder Logo einer Angabe dieser Karte).
    Ein gültiger Schlüssel geht immer durch (Fund 1); 20 falsche in 15 Minuten geben nur „gesperrt“. Obergrenze je Stunde für alle: 300 Karten, 60 Kontakte, 600 Bilder (ab 1.2.8 wegen der Logos). Kein Captcha (fremde Dienste, Entscheidung der Person).
  - **App:** Besucher-Ansicht ohne Reiterleiste und Kopf-Links, im Gerät der Besucher nichts. „Kontakt speichern“ erzeugt im Gerät eine vCard mit dem Link der Karte.
    Für die Person `#/visitenkarte` als Kachel, am PC auch in der Seitenleiste (Olivgrün, Icon und Register bleiben): Umschalter, Vorschau, am PC der Link-Kasten rechts (ab 1200 px), Link erstellen, kopieren, QR-Code (im Gerät, `vendor/qrcode.js`) zeigen und speichern, erneuern, nicht mehr teilen.
  - Prüfungen: Plan (`pruefung/visitenkarte-plan-bericht.md`) und gebaut (`pruefung/etappe-10-visitenkarte-bericht.md`) in den Projektdateien, nichts offen.
- **Einkauf, Sheet „Gemeinsam“** (Etappe 4). Alle Blätter haben zusätzlich `id, erstellt_am, geaendert_am, geloescht`; Löschen ist weich.
  | Blatt | Spalten (Grenzen) |
  | --- | --- |
  | `lebensmittel` | `name` (Pflicht, 60, kein zweites Mal gleich), `abteilung` (40), `einheit` (20), `notiz` (200); ab 1.3.10 `packung` (Inhalt einer Packung als Text in g oder ml, zum Beispiel „1000 g“; Eingabe auch in kg oder l) |
  | `einkaufsliste` | `lebensmittel_id`, `anzahl` (0,01 bis 9999, bis zu zwei Stellen nach dem Komma; bis 1.3.7 halbe ab 0,5), `gericht_id` (leer = einzeln), `notiz` (100), `abgehakt_am` (setzt das Skript) |
  | `gerichte` (= Rezepte) | `name` (Pflicht, 60), `notiz` (300, alt, wird nicht mehr neu geschrieben), `link` (nur `https://`, 300); ab 1.3.4 `text` (20.000, Zeilenumbrüche bleiben), `personen` (ganze Zahl 1 bis 99 oder leer), `ergibt` (40), `bilder` (JSON-Liste von Drive-Kennungen, höchstens 10); höchstens 500 Rezepte |
  | `zutaten` | `gericht_id`, `lebensmittel_id`, `menge` (wie `anzahl`, bei Packung = Zahl der Packungen); ab 1.3.10 `rezept_menge` (g oder ml im Rezept, 0,01 bis 100.000, leer = keine); höchstens 50 je Gericht |
  | `vorrat` | `lebensmittel_id`, `ort` (Pflicht, 40), `menge` (0 bis 9999); eine Zeile je Lebensmittel und Ort, keine Zeile = nicht gepflegt |
  | `laden_reihenfolge` (ab 1.3.17, ohne Standardspalten) | `abteilung` (40); eine Zeile je Abteilung, oben = im Laden zuerst; `reihenfolge_speichern` ersetzt die ganze Liste (höchstens 100), auch im Sheet sortierbar |
  - Zwei Passwörter: `APP_PIN` (Rolle `person`) und `PARTNER_PIN` (Rolle `partner`, mindestens 12 Zeichen, anders als `APP_PIN`), gemeinsame Sperre
    nach 5 Fehlversuchen. Das Skript prüft je Aktion, was die Rolle darf (`ERLAUBT_`); in Einkauf dürfen beide alles. `PARTNER_PIN` kennt nur `gemeinsam`.
    Passwort ändern: neues `PARTNER_PIN` in den Skripteigenschaften, das alte gilt sofort nicht mehr.
  - `auf_liste` zählt zusammen, wenn dasselbe Lebensmittel für dasselbe Gericht (oder einzeln) schon offen draufsteht. Höchstens 100 Einträge je Anfrage.
  - **Abhaken erhöht den Vorrat** (Entscheidung der Person, 30.10.2026), wenn er gepflegt ist, an dem Ort mit der größten Menge. Doppelt abhaken schadet nicht.
  - **Zutaten mit genug Vorrat** sind bei einem Gericht nicht angehakt (Entscheidung der Person, 30.10.2026).
  - Ein Lebensmittel löschen nimmt es auch von der offenen Liste, aus Gerichten und aus dem Vorrat. Ein Gericht löschen lässt die Lebensmittel stehen.
  - Abteilungen in der **Reihenfolge im Laden** (ab 1.3.17, Wunsch der Person, 12.11.2026): kleine Pfeile ^ und v (mit CSS gezeichnet) an jeder Abteilungs-Überschrift der Einkaufsliste „Nach Abteilung“ und ab 1.3.18 auch bei Lebensmittel „Einzeln“ (kein eigener Knopf, kein Fenster; Entscheidung der Person). Ein Pfeil schiebt an der nächsten sichtbaren Abteilung vorbei. Verschieben wirkt sofort, gespeichert wird kurz nach dem letzten Tippen; klappt es nicht, bleibt die Reihenfolge stehen und „Nochmal speichern“ erscheint. Gilt für beide Zugänge und auch bei Lebensmittel „Einzeln“. Nicht eingeordnete Abteilungen danach A–Z, ohne Abteilung zuletzt. Kein „Ziehen nach unten“:
    Die Daten laden beim Öffnen, beim Zurückkehren in die App und mit „Neu laden“. Kein Knopf „Zufälliges Gericht“ (Entscheidung der Person).
  - Abgehakte bleiben grau und durchgestrichen stehen, bis „Einkauf fertig“ getippt wird; erst dann gehen sie ans Skript (Wunsch der Person, 30.10.2026).
  - Datenschutz: keine Preise, Läden oder Gesundheitsdaten. Über die Partnerin oder den Partner wird nichts gespeichert, auch nicht, wer etwas eingetragen hat.
    Das Sheet „Gemeinsam“ wird mit niemandem geteilt. Keine Lebensmittel, Gerichte oder Namen im Repo.
  - **Rezepte** (Etappe 11, Wunsch der Person, 7.11.2026; Plan eingearbeitet in 11.4). Gerichte heißen in der App „Rezepte“. Im Sheet und im Skript bleibt es bei
    `gerichte`, `gericht_id`, `gericht_speichern` und `gericht_loeschen` (Blätter und Spalten werden nie umbenannt).
    - Kein eigener Unterreiter: Unterreiter sind Einkaufsliste · Lebensmittel. Ganz oben bei Lebensmitteln der Umschalter „Einzeln | Rezepte“;
      die Auswahl angekreuzter Lebensmittel bleibt beim Umschalten erhalten. Die Einkaufsliste zeigt „Nach Abteilung | Nach Rezept“.
    - Rezept-Liste: Suche in Titel, Text und Zutaten (ohne Groß- und Kleinschreibung), „+ Neues Rezept“, nur Titel A–Z (📷 = hat Bilder). Keine Kategorien.
    - **Aufklappen** (1.3.7, Wunsch der Person vom 7.11.2026): Ein Tipp auf den Titel klappt das Rezept in der Liste auf, noch ein Tipp klappt es zu; immer nur eins offen.
      Nur „Bearbeiten“ öffnet ein Fenster. Nach dem Speichern ist das Rezept aufgeklappt, nach „Auf die Liste“ wieder zu.
    - Aufgeklapptes Rezept von oben: Bilder nebeneinander (Tipp zeigt groß), „für 4 Personen · ergibt 1 Blech“, alte Notiz (falls noch da), Rezepttext mit Zeilenumbrüchen, Link,
      „Personen diesmal“ (nur wenn Personen eingetragen), Zutaten mit Haken und Menge, „Auf die Liste“ und „Bearbeiten“.
    - **Umrechnen:** neue Menge = gespeicherte Menge × Personen diesmal ÷ Personen im Rezept, ab 1 gerundet auf halbe Einheiten (bestätigt), darunter auf zwei Stellen, mindestens 0,01 (ab 1.3.8).
      Ändert man die Personen, rechnen alle Mengen neu (auch von Hand geänderte). Der Vorrat-Haken prüft gegen die neue Menge. Gespeichert wird dabei nichts.
    - Bearbeiten: Titel, Bilder, für … Personen, ergibt, Rezepttext (nur Text mit Zeilenumbrüchen, keine fette Schrift), Link, Zutaten. Die alte Notiz steht beim Bearbeiten
      oben im Rezepttext und wandert beim Speichern dorthin (`notiz` danach leer). Bei „Inzwischen geändert“ bleibt alles im Fenster:
      „Inzwischen geändert. Text kopieren, neu laden, dann einfügen.“
    - **Bilder:** bis 10 je Rezept, hochgeladen (die App verkleinert auf höchstens 1600 px, JPEG) oder als Google-Drive-Link (nur drive.google.com oder docs.google.com).
      Hochgeladene liegen im privaten Drive-Ordner „Thetadex Rezepte“ der Person (Skripteigenschaft `BILD_ORDNER`), auch wenn die Partnerin oder der Partner hochlädt (bestätigt).
      × nimmt ein Bild vom Rezept, die Datei bleibt im Drive. Neue Bilder gehen nach dem Speichern einzeln über `rezept_bild` hoch; schlägt eins fehl, bleiben die übrigen im Fenster.
      Lesen über `bild` nur für Bilder, die bei einem nicht gelöschten Rezept stehen. Über `gericht_speichern` kann keine neue Kennung dazukommen (nur behaltene).
    - **Packung** (1.3.10, Wunsch der Person, 9.11.2026): Ein Lebensmittel kann eine Packung haben (zum Beispiel 1 kg). Im Rezept steht dann links die Menge in g oder ml,
      rechts die Packung (ändert sie beim Lebensmittel). Auf die Einkaufsliste kommt die Zahl der Packungen (1500 g bei 1 kg → 1,5), die Liste zeigt „1,5 Packung (1500 g)“.
      Vorrat zählt in Packungen. Umrechnen in g oder ml: ab 10 auf ganze, darunter auf zwei Stellen.
    - Nur mit Netz: Rezepte und Bilder nur im Arbeitsspeicher; die Einkaufsliste im Gerät hat nur den Namen des Rezepts.
    - Skript: Felder, die eine Anfrage nicht mitschickt (`notiz`, `text`, `personen`, `ergibt`, `bilder`), bleiben unverändert. Langer Text über `bereinigeLang_`
      (Zeilenumbrüche bleiben, höchstens zwei Leerzeilen, Formel-Schutz). Zu langer Text wird abgelehnt, nicht gekürzt. Höchstens 500 Rezepte.
- **Uni, Sheet „Gemeinsam“** (Etappe 5, Plan eingearbeitet am 31.10.2026). Alle Daten-Blätter haben zusätzlich `id, erstellt_am, geaendert_am, geloescht`;
  Löschen ist weich. Daten und Uhrzeiten stehen als Text (`JJJJ-MM-TT`, `HH:MM`, `TEXT_SPALTEN_`); hat das Sheet doch ein Datum daraus gemacht, wandelt das Skript es zurück.
  - `semester`: `name` (40, nicht doppelt), `beginn`, `ende` (höchstens ein Jahr), `vorlesung_beginn`, `vorlesung_ende` (im Semester).
    Semesterferien = Zeit im Semester außerhalb der Vorlesungszeit, berechnet, nicht eingetragen. Die Person trägt Semester in der App ein.
  - `module`: `name` (80), `kuerzel` (20), `bereich` (40), `pflicht` (`pflicht`, `wahlpflicht`, `auflage`), `ects` (0 bis 60, halbe), `status` (`offen`, `laeuft`, `bestanden` = „Fertig“),
    `semester_id` (belegt oder geplant), `notiz` (200). **Keine Noten** (stehen auf der Uni-Plattform).
  - `kurse`: `modul_id` (Pflicht), `name` (80), `ects`, `semester_id` (leer = wie das Modul), `tag` (1 = Montag … 7), `von`, `bis` (alle drei oder keins),
    `ort` (Raum, 60), `dozent` (60, freiwillig), `pruefungsleistung` (alt, nur noch zum Leeren sichtbar), `notiz`. Höchstens 300.
  - `termine`: `titel` (80), `art` (`vorlesung`, `pruefung`, `arbeit`, `zug`, `urlaub`, `hobby`, `sonstiges`; die alte Art `frei` gibt es nicht mehr, seit 0.7.2 kennt die App sie nicht), `beginn`, `ende` (leer = eintägig,
    höchstens 366 Tage), `von`, `bis` (beide oder keine = ganztägig), `tage` (Wochentage als Text, zum Beispiel `1,3`; dann ist `ende` Pflicht), `ort` (60),
    `modul_id`, `kurs_id` (der Kurs bestimmt das Modul), `stunde_id`, `bestanden` und `leistung` (Art der Prüfung, 80; beide nur bei Prüfungen), `notiz`. Höchstens 3000.
  - `uni_einstellungen` (`name`, `wert`): `ects_ziel`, `einrichten` legt 120 an; ändern im Sheet.
  - `stundenplan`: alt (bis 0.5.5), in 0.5.6 nach `termine` umgezogen. Seit 0.7.3 kennt das Skript das Blatt nicht mehr.
  - Aktionen: `uni` (beide Rollen, alles in einer Antwort), `uni_speichern` (`blatt` = `semester`, `module`, `kurse`, `termine`; ändern mit `geaendert_am`)
    und `uni_loeschen` (nur `person`). Modul löschen nimmt seine Kurse mit; Kurs oder wiederkehrender Termin seine Ausnahmen.
    Prüfungen und andere Termine bleiben, sie werden nur ausgetragen. Semester löschen trägt es bei Modulen und Kursen aus.
  - **Kalender:** Jede Woche gelten Kurse mit Tag und Zeit (in der Vorlesungszeit ihres Semesters, Art Vorlesung) und Termine mit `tage` (vom ersten bis zum letzten Tag).
    An Urlaubstagen fallen sie weg. „Einmal anders“: ein Termin mit `stunde_id` (Kurs oder wiederkehrender Termin) ersetzt ihn an seinem Tag,
    mit Uhrzeit = andere Zeit, ohne = fällt aus; „Wieder wie immer“ löscht ihn. Jeder Eintrag zeigt Zeit, Titel und Raum; im Raster wird zu Langes mit „…“ gekürzt
    (kurze Einträge nur Titel), ein Tipp zeigt alles. Eine rote Linie zeigt in der Woche die aktuelle Uhrzeit (Spalte heute). Start: Woche mit heute.
  - **Arbeitsstunden** rechnet die App aus allen Einträgen der Art Arbeit mit Uhrzeit (Woche, Monat, vier Wochen der Liste); nichts davon wird gespeichert.
  - **Fertig:** Ein Kurs ist fertig, wenn eine seiner Prüfungen bestanden ist (ein zweiter Versuch zählt). Ein Modul ist fertig, wenn jeder Kurs mit Prüfung
    fertig ist (und Prüfungen ohne Kurs bestanden sind), mindestens einer, oder wenn die Person „Fertig“ wählt. Fertige Module zählen zum Ziel;
    ohne ECTS am Modul die Summe seiner Kurse. **Auflagen vom Bachelor** zählen nicht zum Ziel, sie müssen nur bestanden sein (eigene Zeile).
  - Module als Karten mit Kursen und Prüfungen; je Modul, Kurs und Prüfung ein Knopf ✎, bei Prüfungen „bestanden?“. Ein Knopf „+ Prüfung“ je Modul
    (Kurs im Formular wählen). Beim Anlegen von Modul und Kurs kann gleich eine Prüfung mit (ohne Datum keine).
  - Fenster im Reiter Uni schließen nur mit × oder Abbrechen (kein Tipp daneben, keine Escape-Taste); in Einkauf und Besitz bleibt es wie es ist (Entscheidung der Person, 31.10.2026).
  - Partner*in sieht alles, auch die Module, aber ohne Knöpfe; das Skript lässt sie nicht schreiben. Dozent*in-Namen stehen nur im Sheet, nie im Repo.
- **Reiter nach Script-Adressen** (Entscheidung der Person, 30.10.2026): Ein Reiter erscheint nur mit der Adresse seines Skripts (siehe 2.1).
  Die App speichert keine Rolle; die Rechte prüft immer das Skript.
- **Farben der Arten im Uni-Kalender** (Wunsch der Person, Plan 7.2 und Etappe 5): Vorlesung, Prüfung, Arbeit, Zug, Urlaub, Hobby, Sonstiges und Semesterferien
  haben je eine Farbe (`--art-…` in `css/base.css`, hell und dunkel). Nur als Fläche, Streifen oder Punkt, Schrift darauf `--schrift-auf-farbe`.
  Die Farben sind nach Helligkeit gestaffelt, damit sie auch ohne Farbsehen unterscheidbar sind (Wunsch der Person, 31.10.2026):
  Prüfung (Dunkelrot) und Hobby (Dunkelgrün) dunkel mit heller Schrift (`--art-…-schrift`), dann Vorlesung, Zug, Arbeit, Sonstiges, Urlaub immer heller. Kästen haben einen feinen Rand.
  Knöpfe im Reiter Uni mindestens 44 px hoch, Schrift im Raster am Handy mindestens 0,7 rem. Linie „jetzt“ in Schriftfarbe (hell schwarz, dunkel weiß), nicht rot, damit sie auch ohne Farbsehen erkennbar ist (Wunsch der Person, 31.10.2026).
- **Uni-Daten im Gerät** (Wunsch der Person, 30.10.2026): Die zuletzt geladenen Uni-Daten liegen im Gerät (`thetadex_uni`, ohne Rolle),
  damit Kalender und Module ohne Netz da sind. Dann steht „Stand von …“ da und es gibt keine Knöpfe zum Ändern. Abmelden löscht sie.
  Folge: Wer das entsperrte Handy hat, sieht den Uni-Kalender ohne Passwort (auch bei Partner*in).
- **Ausnahme von „Keine Offline-Schreibzugriffe“ (1.5), nur Einkaufsliste:** Die Liste liegt zusätzlich im Gerät.
  Abhaken geht auch ohne Netz. Abgehakte Einträge werden gesendet, sobald wieder Netz da ist. Bis dahin zeigt die App „noch nicht gesendet“.
  Grund: Wunsch der Person, im Laden gibt es oft kein Netz. Abhaken ist harmlos: doppelt senden schadet nicht.
- **Im Gerät (Ergänzung zu 5):** die Einkaufsliste (`thetadex_einkaufsliste`), abgehakte vor „Einkauf fertig“ (`thetadex_einkauf_haken`)
  und die noch nicht gesendeten Haken (`thetadex_einkauf_offen`), die Uni-Daten (`thetadex_uni`); bei Besuchern die Kennung des
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
- **Bilder** (DSA, Entscheidung der Person, 31.10.2026): wie bei Besitz im Google Drive der Person (privater Ordner „Thetadex DSA“), im Sheet nur die Kennung.
  Ein geteilter Bogen zeigt sein Bild über das Skript als `data:`-Bild. Die Content-Security-Policy bleibt gleich (`img-src 'self' data:`).
- **Würfel** (W4, W6, W8, W10, W12, W20) rechnen nur im Gerät mit `crypto.getRandomValues`, ohne Verzerrung (passende Würfe werden neu gezogen). Nichts wird gespeichert.
- **Woche am Handy:** im Hochformat ein schmales Raster mit 7 Spalten (nur Titel), darunter die Liste je Tag; im Querformat und am PC nur das Raster (Wunsch der Person, 31.10.2026).
  Eine Web-App kann das Drehen nicht erzwingen, darum ein Hinweis „Für die Woche das Handy drehen“.
- **Kontowecker (Etappe 9, fertig 1.11.2026):** Eine Web-App kann keine SMS lesen, E-Mail geht beim Kontowecker nicht. Die Person nutzt Android.
  - **Weg:** Die Handy-App „SMS to URL Forwarder“ (offen, ohne Werbung und Tracker, über F-Droid; Entscheidung der Person) schickt jede SMS
    des Kontowecker-Absenders (nur dieser Absender, nie `*`) per HTTPS an die Adresse des Finanz-Skripts. Regel in der App: URL = Adresse des Finanz-Skripts
    (endet auf `/exec`), Header-Feld `{}` (leer lehnt die App ab), JSON-Vorlage
    `{"action":"sms","schluessel":"…","von":"%from%","text":"%text%","zeit":%sentStamp%}`, gerade Anführungszeichen. Akku: „Nicht eingeschränkt“.
  - **Schlüssel:** eigener `SMS_SCHLUESSEL` (64 Zeichen, `smsSchluesselErzeugen` im Editor; neuer Schlüssel = alter ungültig). Er kann nur eine SMS als „offen“ ablegen,
    nichts lesen, nichts buchen. Keine Sperre nach Fehlversuchen: nicht zu erraten, und eine Sperre ließe Fremde echte SMS blockieren.
    Kopfzeilen (`X-Signature`) liest Apps Script nicht, darum steht der Schlüssel im Inhalt.
  - **Skript:** Blatt `SMS` (siehe 2.3), doppelte SMS über Prüfsumme erkannt, höchstens 50 am Tag, Zeilen der SMS mit „ | “ getrennt.
    Enthält eine SMS mehrere Umsatz-Zeilen, legt das Skript je Umsatz eine eigene Zeile an („Teil 1/2 | …“, Prüfsumme mit „-1“, „-2“; ab 1.1.8).
    Die Weiterleitungs-App zeigt immer „erfolgreich“; ob das Skript angenommen hat, steht im Editor unter „Ausführungen“ („SMS angenommen“ / „SMS abgelehnt: <Grund>“).
  - **App:** Finanzen → „Noch zuordnen“: am Handy und unter 1200 px eigener Umschalter „SMS (n)“, ab 1200 px rechts neben dem Formular, ohne offene SMS unsichtbar
    (Wunsch der Person: „Buchen“ passt auf einen Bildschirm). „Übernehmen“ füllt das Formular, gebucht wird erst mit Ausgabe oder Einnahme (immer mit Prüfung, Entscheidung der Person).
    Die Liste lädt neu beim Öffnen des Reiters, beim Tippen auf „SMS“, wenn die Seite wieder sichtbar wird, und alle 5 Minuten (ab 1.1.7). „Verwerfen“ erledigt ohne Buchung. Nach Buchen oder Verwerfen löscht das Skript Text und Absender (Entscheidung der Person).
  - **Vorschlag:** erste Zeile `<Gegenseite>: <Betrag> EUR` ohne „Saldo“; Minus = Ausgabe, sonst Einnahme; Zweck = Gegenseite oder Suchwort-Treffer
    (Blatt `Einstellungen`, `liste` = `sms`); Datum der SMS; immer Konto `Konto` (nur Girokonto). Bankname und echte SMS stehen nie im Repo.
  - Prüfung Sicherheit und Datenschutz: Bericht `pruefung/etappe-9-kontowecker-bericht.md` in den Projektdateien, nichts zu bauen.

---

## 5. Technik-Merkzettel

- **Hilfsmodule** vor dem Neubauen suchen und wiederverwenden. Lies die Datei, bevor du sie benutzt. Rate keine Signaturen.
  Liste: `js/ui/dom.js` (`el`, `leeren`, `sichereUrl`, `heute`, `kalenderBeiKlick`, ab 1.3.29 `MONATE`, `euro`, `vergleiche`, `datumText`), `js/ui/kalender.js` (`plusTage`, `wochenStart`, `monatsRaster`, `eintraegeAm`, `tageListe`, `kursSemester`, `istFrei`, `spuren`, `arbeitsMinuten`, `stundenText` …), `js/ui/auswahl.js` (`auswahlFeld`), `js/ui/overlay.js` (`zeigeGespeichert`), `js/ui/farben.js` (`farbRegeln`), `js/ui/aussehen.js` (`wendeAussehenAn`, `setzeAussehen`), `js/ui/bild.js` (`verkleinereBild`, `bildAdresse`, ab 1.3.29 `bildSpeicher(skript)` mit `.hole(id)`), `js/ui/wuerfel.js` (`wurf`, `wuerfelKnopf`), `js/store.js` (`lesen`, `schreiben`, `abmelden`, `istEingerichtet`),
  `js/api.js` (`api(skript, action, daten)`, `apiOeffentlich(adresse, action, daten)` ohne Passwort, `ApiFehler` mit `code`; ab 1.3.29 bricht jede Anfrage nach 60 Sekunden ab, mit Bild nach 180, Code `zeit`).
- **GitHub Pages hängt** (Erfahrung 4.11.2026): Bleibt „pages build and deployment“ auf „Queued“ oder bricht mit „Timeout reached“ ab, liegt es an GitHub, nicht am Code.
  Erst „Re-run all jobs“; hilft das nicht, startet die nächste Änderung auf `main` einen neuen Lauf, der hängende wartende Läufe ersetzt.
- **Ein Syntaxfehler** in einer Datei lässt die Ansicht ausfallen. Dann zuerst die zuletzt geänderten Dateien auf fehlende oder doppelte Klammern prüfen.
- **Skript `gemeinsam`:** `tabelle_` liest jedes Blatt je Anfrage nur einmal (ab 1.3.30). Wer nicht über `neu_` oder `aendere_` ins Blatt schreibt, ruft danach `vergiss_(name)` auf.
- **Skript:** Keine `appsscript.json` im Repo. Bewährte Helfer aus dem Finanz-Skript wiederverwenden:
  `jsonOut_`, `pruefePin_`, `bereinigeText_`, `pruefeEingabe_`, `LockService`-Muster.
- **Skripteigenschaften** (nur im Editor, je Skript): `APP_PIN`; im Skript `gemeinsam` zusätzlich `PARTNER_PIN`; im Skript `karte` statt `APP_PIN` nur `KARTE_PIN` (eigenes Passwort, mindestens 12 Zeichen, ab 10.1; die App speichert es als `thetadex_karte_passwort` und schickt es nur an `karte`); im Skript `finanzen` zusätzlich `SMS_SCHLUESSEL` (nur für die Aktion `sms`, legt die Funktion `smsSchluesselErzeugen` an, ab 9.1); in den Skripten `leben`, `dsa` und `gemeinsam` (ab 1.3.4) legt `einrichten` selbst `BILD_ORDNER` an (Kennung des Bild-Ordners).
- **Im Gerät (localStorage):** nur Passwort, Script-Adressen, geladene Einstellungen, zuletzt bekannte Kontostände, die Wahl beim Aussehen (`thetadex_aussehen`),
  die offene Einkaufsliste (`thetadex_einkaufsliste`, nur Einträge mit Namen, Abteilung, Einheit), abgehakte Einträge vor „Einkauf fertig“ (`thetadex_einkauf_haken`)
  und noch nicht gesendete Haken (`thetadex_einkauf_offen`), die zuletzt geladenen Uni-Daten (`thetadex_uni`, ab 0.5.3), der gewählte Bogen bei Pen & Paper (`thetadex_dsa_bogen`, nur die Kennung, ab 0.6.1), die selbst erstellten Links zum Teilen (`thetadex_dsa_links`, Bogen-Kennung → Schlüssel, ab 0.6.6), die gewählte Ansicht bei Pen & Paper (`thetadex_dsa_modus`, ab 0.6.8), bei der Visitenkarte das eigene Passwort (`thetadex_karte_passwort`, ab 10.1), die selbst erstellten Schlüssel (`thetadex_karte_links`, Karte → Schlüssel) und die gewählte Karte (`thetadex_karte_wahl`, ab 10.3).
  Schlüssel mit Vorsilbe `thetadex_`. Keine Tracking-Einträge im Gerät speichern. Abmelden löscht alles.
  Die Tracking-Felder hält die App nur im Arbeitsspeicher (10 Minuten), damit das Formular schnell da ist.
- **Kopfzeile angeheftet** (ab 1.3.22, Wunsch der Person, 16.11.2026): `.kopf` ist `position: sticky`. `js/app.js` schreibt ihre Höhe in `--kopf-hoehe`; andere feste Leisten nutzen `top: var(--kopf-hoehe, 0px)`.
- **Fremder Rahmen** (ab 0.8.0): Läuft die Seite eingebettet in einer anderen Seite, zeigt `js/app.js` nur einen Hinweis (Schutz vor Klick-Fallen; `frame-ancestors` geht auf GitHub Pages nicht).
- **Neu laden** nach einem Update nur, wenn auf dieser Seite „Jetzt neu laden“ getippt wurde (`js/app.js`). Sonst lud die Seite
  beim ersten Besuch von selbst neu, weil der Service Worker die Seite übernimmt (`clients.claim`), und Formulare waren weg.
- **Service Worker** (`sw.js`): App-Dateien zwischenspeichern (`<name>-<VERSION>`, beim Installieren mit `cache: 'reload'` frisch vom Server, ab 0.8.2), Daten nicht im Service Worker,
  Anfragen an die Skripte nie aus dem Zwischenspeicher. Auf `#/karte/…` meldet `js/app.js` keinen Service Worker an (Besucher, ab 1.3.29). Jede geänderte Datei braucht eine neue VERSION, sonst bekommen Geräte sie nicht.
- **Barrierefreiheit beim Bauen:** genau eine `h1` je Seite, jedes Feld mit Beschriftung, Fenster mit `role="dialog"` und `aria-modal="true"`,
  Überschriften ohne Sprung.

---

## 6. Dateiübersicht

- Hauptordner: `CLAUDE.md` (zeigt nur hierher), `README.md`, `LIZENZEN.md` (Lizenztexte von Chart.js, @kurkle/color, Feather-Zahnrad; neue fremde Teile hier eintragen), `index.html`, `manifest.webmanifest`, `sw.js`, `.nojekyll` (GitHub Pages ohne Jekyll).
- `css/`: `base.css` (Farben, hell und dunkel), `layout.css` (Kopf, Reiterleiste unten am Handy, links am PC), `components.css`.
- `js/`: `app.js` (Routing, Reiterleiste, Update-Hinweis), `config.js` (VERSION, `features`, `BEREICHE`, `SKRIPTE`), `api.js`, `store.js`, `ui/dom.js`.
- `js/views/`: `start.js` (Kacheln), `einstellungen.js`, `info.js`, `nichtgefunden.js`, `doener.js`, `tracking.js`, `finanzen.js`, `finanzen-auswertung.js`, `finanzen-sms.js` (Noch zuordnen, Vorschlag aus der SMS, ab 9.2), `besitz.js`, `einkauf.js`, `uni.js`, `uni-kalender.js` (Kalender zeichnen), `dsa.js` (Pen & Paper), `dsa-abenteuer.js` (Ansichten Abenteuer und DM, ab 0.6.8), `karte.js` (Visitenkarte für Besucher und `zeichneKarte` für die Vorschau, ab 10.2), `visitenkarte.js` (Vorschau, Links und QR-Code für die Person, ab 10.3). `vendor/qrcode.js`: QR Code Generator 1.4.4. `icons/social/`: Symbole für Instagram, LinkedIn, Signal (ab 1.2.8). `js/ui/kalender.js`: Rechenhelfer für den Kalender. `vendor/chart.umd.js`: Chart.js 4.4.1, nur in der Auswertung geladen. `js/ui/auswahl.js`: Auswahlfeld mit Freitext (Zweck, Kategorie, Ort, ausgeliehen an); Tipp ins Feld öffnet die Liste. `js/ui/overlay.js`: Fenster „Gespeichert“. `js/ui/farben.js`: Farbregeln der Tracking-Übersicht. `js/ui/aussehen.js`: Hell, Dunkel, Wie Gerät. `js/ui/bild.js`: Bilder verkleinern. `js/ui/wuerfel.js`: Würfel (Pen & Paper und geteilter Bogen).
- `icons/`: `thetadex-icon.svg`, `thetadex-icon-512.png`, `-192.png`, `-180.png` (Apple), `thetadex-icon-maskable-512.png` (Android-Startbildschirm, füllt die Form aus). `icons/reiter/<id>.svg`: Symbole der Reiter (Farbe per CSS-Maske). `icons/einstellungen.svg`: Zahnrad in der Kopfzeile. `icons/thetadex-karte.svg`: Karteikarte ohne Grund (Startseite). `icons/w20.svg`: W20 bei Pen & Paper. `icons/reiter/visitenkarte.svg`: Kachel Visitenkarte (ab 10.3).
- `docs/`: `STAND.md` (diese Datei), `GESCHICHTE.md` (Rückblick, nur bei Bedarf lesen); während einer Etappe ihr Plan (`PLAN-ETAPPE-<n>.md`, zurzeit keiner).
- `apps-script/tracking/Code.gs` (ohne PIN), `apps-script/finanzen/Code.gs` (Passwort in den Skripteigenschaften),
  `apps-script/doener/Code.gs` (öffentlich, ohne Passwort, Funktion `einrichten`), `apps-script/leben/Code.gs` (Besitz, mit Passwort, Funktion `einrichten`),
  `apps-script/gemeinsam/Code.gs` (Einkauf und Uni, `APP_PIN` und `PARTNER_PIN`, Funktion `einrichten`), `apps-script/dsa/Code.gs` (Pen & Paper, mit Passwort, ohne nur `geteilt`, Funktion `einrichten`),
  `apps-script/karte/Code.gs` (Visitenkarte, mit `KARTE_PIN`, ohne nur `karte`, `bild_karte` mit Schlüssel, Funktion `einrichten`, ab 10.1).

---

## 7. Pläne

### 7.1 Etappe 0 „Start“ (0.0.x) – fertig

- 0.0 Sichern (Sheets kopiert, alte Repos als ZIP), 0.1 App-Gerüst, 0.2 Skripte vereinheitlicht (Passwort `APP_PIN`, neue Bereitstellungen),
  0.3 Plan Version 1 (7.2). Einzelheiten in `docs/GESCHICHTE.md` und in den Pull Requests #1 bis #6.


### 7.2 Plan Version 1 (alle Etappen fertig)

Der Plan Version 1 mit den Etappen 1 bis 11 ist ganz umgesetzt. Sein Text steht in `docs/GESCHICHTE.md` (Teil 2, früher hier als 7.2).
Hinweise im Code wie „STAND.md 7.2, Etappe 2“ meinen diesen Teil. Neue Etappen bekommen wieder einen eigenen Plan (`docs/PLAN-ETAPPE-<n>.md`).

---

## 8. Geschichte

Die Geschichte aller Versionen steht in `docs/GESCHICHTE.md` (Teil 3). Nach jedem Schritt kommt dort unten eine kurze Zeile dazu.
Letzte Versionen:

- **Etappe 12** Entschlacken (Abschluss = 1.4.0). **1.3.28** Schritt 12.1: Rückblick aus `docs/STAND.md` nach `docs/GESCHICHTE.md` verschoben, veraltete Projektdateien gelöscht.
- **1.3.29** Schritt 12.2: Zeitgrenze für Anfragen, Übergangs-Code für alte Skripte in Einkauf weg, gemeinsame Helfer (`euro`, `datumText`, `bildSpeicher` …), kein Service Worker auf Visitenkarten-Links, kleine Reste weg.
- **1.3.30** Schritt 12.3: Skript `karte` ohne alte Aktion `kontakt`, Skript `gemeinsam` liest jedes Blatt je Anfrage nur einmal und ohne Merker für alte App-Fassungen. Skripte `karte` und `gemeinsam` neu einfügen.
