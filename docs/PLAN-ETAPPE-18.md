# Plan Etappe 18 „Widget“ (1.10.x)

Stand: 26.11.2026. Grundlage: Antworten der Person (26.11.2026).
Am Ende der Etappe wird er in `docs/STAND.md` eingearbeitet und gelöscht.

## 1. Ziel

Eine kleine, eigene Android-App („Widget-App“) zeigt auf dem Startbildschirm und am Abend:

- **Tracking Leben:** Ist heute eingetragen? Ist gestern eingetragen? (je ja oder nein, nie Werte)
- **Finanzen:** Wie viele Kontowecker-SMS warten insgesamt auf „Noch zuordnen“? (eine Zahl)

Die Widget-App holt **nur diese Antworten**: keine Werte, keine Beträge, keinen SMS-Text.
Ein Tipp aufs Widget öffnet Thetadex im Browser (`#/tracking` bzw. `#/finanzen`).
Die Erinnerung am Abend zeigt die Widget-App selbst als Overlay über allen Apps (Abschnitt 5).
Die Skripte schicken nichts von sich aus: keine E-Mail, kein Kalender (Entscheidung der Person, 5.11.2026).
Eine echte Web-App (PWA) kann unter Android keine Widgets und keine verlässlichen Erinnerungen zu einer Uhrzeit. Darum eine eigene App.

## 2. Zugang: eigener Widget-Schlüssel

Die Widget-App bekommt **nicht** das Passwort der App. Sie bekommt einen eigenen Schlüssel, der nur die Fragen aus 1 beantworten darf.
Vorbild ist der `SMS_SCHLUESSEL` aus Etappe 9 (STAND.md 4 „Kontowecker“).

- Neue Skripteigenschaft `WIDGET_SCHLUESSEL` im Tracking-Skript und im Finanz-Skript, je 64 Zeichen, zufällig.
  Im Repo steht nur der Name der Eigenschaft, nie ihr Inhalt.
- Neue Funktion `widgetSchluesselErzeugen` in beiden Skripten: einmal im Editor ausführen, das Protokoll zeigt den Schlüssel,
  die Person trägt ihn in die Widget-App ein. Ein neuer Schlüssel macht den alten ungültig.
- Der Schlüssel kann nur lesen, ob heute und gestern eingetragen ist bzw. wie viele SMS offen sind. Nichts anderes, nichts schreiben.
- Keine Sperre nach Fehlversuchen: Der Schlüssel ist nicht zu erraten, und eine Sperre ließe Fremde das Widget blockieren.
  Ein falscher Widget-Schlüssel zählt nie als Fehlversuch beim Passwort.
- Fehlt die Eigenschaft `WIDGET_SCHLUESSEL`, antwortet die Aktion mit einem Fehler. Abschalten = Eigenschaft löschen.
- Warum nicht das Passwort: Ginge das Handy oder die Widget-App verloren, gäbe das Passwort Zugang zu allem.
  Der Widget-Schlüssel verrät nur „heute/gestern eingetragen ja/nein“ und eine Zahl.

## 3. Aktion `widget` (Schritt 18.1)

Aufruf wie bei der SMS: POST, `{"action":"widget","schluessel":"…"}`. Das Skript prüft sie in `doPost` **vor** dem Passwort, wie `sms`.

- **Tracking-Skript** (`apps-script/tracking/Code.gs`): liest im Blatt `Tabellenblatt1` nur die Spalte `Datum` der letzten 14 Zeilen.
  Antwort: `{"ok":true,"datum":"2026-11-26","heute":true,"gestern":false}`. `datum` = heutiger Tag laut Skript-Zeitzone.
  „Eingetragen“ heißt: Es gibt eine Zeile mit diesem Datum, egal welche Felder gefüllt sind (Antwort der Person, 26.11.2026). Werte werden nie gelesen.
- **Finanz-Skript** (`apps-script/finanzen/Code.gs`): zählt im Blatt `SMS` die Zeilen mit Status `offen` (über `smsSpalten_`, wie `smsListe_`).
  Antwort: `{"ok":true,"offen":3}`.
- **Beide:** falscher Schlüssel → `{"error":"schluessel","message":"Schlüssel falsch"}`. Im Protokoll nur „Widget abgelehnt“, nie der Schlüssel.
  Nur lesen, darum kein `LockService`. `doGet` bleibt, wie es ist.

### Von Hand zu erledigen (Vorschau für 18.1)

1. Sheets bleiben im Aufbau gleich, keine neuen Spalten oder Blätter.
2. `apps-script/tracking/Code.gs` und `apps-script/finanzen/Code.gs` je ganz in den richtigen Editor kopieren.
3. In beiden Editoren einmal `widgetSchluesselErzeugen` ausführen und den Schlüssel aus dem Protokoll für die Widget-App notieren.
4. Editor → Zahnrad „Projekteinstellungen“: Zeitzone „(GMT+01:00) Berlin“ prüfen, sonst stimmt „heute“ nicht.
5. Bereitstellen → Bereitstellungen verwalten → Stift → „Neue Version“ → Bereitstellen (beide Skripte, Adresse bleibt gleich).

## 4. Datenschutz und Sicherheit

- Neu nach außen: nur „heute/gestern eingetragen ja/nein“ und eine Zahl, nur mit Schlüssel.
- Script-Adressen und Schlüssel trägt die Person nur in die Widget-App ein (dort verschlüsselt im Handy), nie ins Repo.
- Die Thetadex-Web-App ändert sich nicht. Die Content-Security-Policy bleibt gleich.

## 5. Widget-App (Schritt 18.2, wird vor dem Bauen genauer geplant)

- **Eigene App**, damit später weitere Widgets dazukommen können (Entscheidung der Person, 26.11.2026).
- **Widget** mit drei Zeilen: Tracking heute, Tracking gestern, SMS offen. Tipp öffnet Thetadex.
- **Overlay über allen Apps** (Wunsch der Person, 26.11.2026): Standard 23:50 Uhr, Uhrzeit in der App änderbar, ganz abschaltbar.
  - Erinnerung **Tracking** nur, wenn heute noch nicht eingetragen ist, mit Knopf „Thetadex öffnen“.
  - Erinnerung **Essen eintragen** immer, mit Knopf, der die Essens-App der Person öffnet (in der Widget-App einstellbar, steht nicht im Repo).
  - Knopf „Schließen“. Kurz vor dem Overlay fragt die App die Skripte frisch ab.
- **Einstellungen** in der App: zwei Script-Adressen, zwei Widget-Schlüssel, Uhrzeit, Overlay an/aus, Essens-App.
- **Android-Erlaubnisse**, die die Person einmal von Hand gibt: „Über anderen Apps einblenden“, „Wecker und Erinnerungen“ (genaue Uhrzeit), Akku „Nicht eingeschränkt“.
- Hintergrund-Abrufe fürs Widget begrenzt Android (etwa alle 30 bis 60 Minuten).
- **Bauen und Ablage:** offen. Die APK wird außerhalb des Play Stores von Hand installiert. Der Agent kann die Android-Werkzeuge
  in seiner Umgebung zurzeit nicht laden; entweder die Person gibt die Adresse in den Umgebungs-Einstellungen frei, oder gebaut wird über GitHub Actions.
  Ob der Code der Widget-App ins Repo kommt, entscheidet die Person vor 18.2.

## 6. Schritte

- **18.0** dieser Plan (1.10.0).
- **18.1** Aktion `widget` in beiden Skripten (Abschnitt 3).
- **18.2** Widget-App (Abschnitt 5).
- **18.3** Abschluss: Prüfung Sicherheit und Datenschutz, Plan in STAND.md einarbeiten.
