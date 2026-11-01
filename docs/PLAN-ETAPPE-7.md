# Plan Etappe 7 „Umstieg und Aufräumen“ (0.7.x)

Ziel: Thetadex ersetzt die alten Apps ganz, und der Code ist sauber, bevor Etappe 8 ihn prüft.
Drei Teile: **Ungenutztes** löschen, **Kommentare und Verweise** richtigstellen, **Umstieg** von den alten Apps.
Regeln: STAND.md 1.2, 1.6, 1.10, 3.2 und 7.2 (Etappe 7).
Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

Antworten der Person (1.11.2026, eingearbeitet in 0.7.1):
- Der Umstieg (7.4) kommt zuerst, die Person macht ihn am 1.11.2026. Die alten Apps nutzt nur noch das Handy (installiert) und ein Lesezeichen,
  keine Automation und keine anderen Menschen.
- Der Bericht (7.1) liegt nur in den privaten Projektdateien, nie im Repo, damit niemand Schwachstellen öffentlich sieht.
- Alte, schon gemergte Zweige im Repo `thetadex` werden gelöscht. Das macht Claude direkt auf GitHub (geht nicht in einem Pull Request),
  nach Zusage der Person. Gemergte Zweige lassen sich im alten Pull Request mit „Restore branch“ zurückholen.
- Freigabe nach dem Bericht (1.11.2026): A1 bis A5 löschen (auch `#/einrichtung`), A6 bleibt. B1 löschen (die zwei Einträge im Blatt `stundenplan`
  legt die Person neu an). B2: Es gibt keine Einträge mit Art „frei“, darum fällt „frei“ in App (7.2) und Skript (7.3) ganz weg. C1 bis C7 machen.
- In 7.5 wird auch `docs/STAND.md` selbst aufgeräumt: veralteter Abschnitt 7.1 „Etappe 0 (jetzt)“ kürzen, Geschichte (8) in die richtige Reihenfolge.

Was gleich bleibt:
- Keine neuen Funktionen, kein neues Aussehen, keine neuen Daten, keine neuen Blätter oder Spalten.
- Sheets bleiben, wie sie sind. Keine Script-Adresse ändert sich (nur „Neue Version“ der Thetadex-Bereitstellung, keine neue Bereitstellung).
- Gelöscht wird nur, was die Person nach dem Bericht (7.1) freigibt (STAND.md 1.9, 1.10).

## Was „nichts geht verloren“ hier heißt

- Gelöschter Code bleibt in der Geschichte des Repos (GitHub → Commits) und lässt sich zurückholen.
- Die alten Bereitstellungen laufen auf einer festen alten Fassung ihres Skripts. Änderungen am Skript-Code in 7.3 ändern sie nicht.
  Darum dürfen in 7.3 auch Aktionen weg, die nur die alten Apps nutzten: Die alten Apps laufen trotzdem bis zum Umstieg weiter.
- Archivieren einer Bereitstellung (7.4) ändert nichts am Sheet. Die Daten bleiben, wo sie sind.
- Vor dem Löschen der alten Repos gibt es zwei Sicherungen: die ZIP-Dateien aus Schritt 0.0 und die Skripte in den Projektdateien (`apps-script-backup/`).
  Claude prüft in 7.4, dass in den alten Repos nichts steht, was Thetadex noch braucht.

## Schritte

Jeder Schritt mit Änderung im Repo ist ein eigener Zweig und ein eigener Pull Request. Nach jedem Schritt prüft die Person.

- **7.0 Plan** (0.6.12 → 0.7.0, Antworten 0.7.1): diese Datei. Sheet und Skript bleiben unverändert.

- **7.1 Bericht „Ungenutztes und Verweise“** (ohne Pull Request, ohne neue Version)
  - Datei `pruefung/ungenutztes-bericht.md` in den Projektdateien, nie im Repo (STAND.md 1.10).
  - App: Funktionen und Exporte, die nichts aufruft; CSS-Regeln ohne passendes Element; Dateien und Symbole, die nichts lädt;
    Einträge in `HUELLE` (`sw.js`); Schlüssel im Gerät (`thetadex_…`), die nichts mehr liest.
  - Skripte (`doener`, `finanzen`, `tracking`, `leben`, `gemeinsam`, `dsa`): je Aktion, wer sie aufruft (Thetadex, nur alte App, niemand);
    Hilfsfunktionen, die nichts aufruft; Reste aus der Zeit vor dem Umbau (zum Beispiel Stundenplan in `gemeinsam`).
  - Kommentare und Verweise: Hinweise auf gelöschte Pläne (`PLAN-ETAPPE-2.md`, `-3`, `-5`, `-6`), falsche Abschnittsnummern von STAND.md,
    Links, `README.md`.
  - Je Fund: Ort, was es ist, Vorschlag (löschen, behalten, Kommentar ändern), Risiko. Die Person kreuzt an, was weg darf.
  - Etwas, das sicher noch gebraucht wird (zum Beispiel alte Spalten für Daten im Sheet), bleibt und steht im Bericht mit Grund.

- **7.2 App aufräumen** (0.7.1 → 0.7.2)
  - Löschen, was die Person in 7.1 freigegeben hat (JS, CSS, Dateien, `HUELLE`).
  - Kommentare und Verweise in `js/`, `css/`, `index.html`, `sw.js` und `README.md` richtigstellen.
  - Die App sieht danach genauso aus und tut dasselbe. Sheet und Skript bleiben unverändert.
  - Prüfliste: jeder Reiter einmal öffnen, je eine Sache speichern, die man ohnehin speichern wollte.

- **7.3 Skripte aufräumen** (0.7.2 → 0.7.3)
  - Alle Änderungen an `.gs`-Dateien in einem Schritt, damit die Person jedes Skript nur einmal neu einfügt.
  - Freigegebene Aktionen und Hilfsfunktionen löschen, Kommentare richtigstellen (STAND.md 3.2).
  - Nur Skripte, die sich wirklich ändern, kommen in „Von Hand zu erledigen“ (STAND.md 1.6): Datei ersetzen,
    dann Bereitstellen → Bereitstellungen verwalten → die **Thetadex**-Bereitstellung → Stift → „Neue Version“. Nicht die alte Bereitstellung.
  - Danach je Skript „Verbindung prüfen“ unter Einstellungen.

- **7.4 Umstieg** (ohne Pull Request; die Person macht es von Hand)
  - Wann: am 1.11.2026, vor 7.1 (Entscheidung der Person; der Richtwert zwei Wochen aus STAND.md 7.2 entfällt).
  - Vorher prüft Claude: In Thetadex steht keine alte Adresse (Thetadex speichert Adressen nur im Gerät, die Person trägt die neuen ein).
    In den alten Repos steht nichts, was Thetadex noch fehlt. Die Sicherung der Skripte in den Projektdateien ist aktuell.
  - Claude schreibt die Anleitung `etappe-7/umstieg-anleitung.md` in die Projektdateien, mit allen Klicks (dazu: alte Lesezeichen löschen):
    1. Tracking-Sheet und Finanz-Sheet: Erweiterungen → Apps Script → Bereitstellen → Bereitstellungen verwalten → die **alte** Bereitstellung → Archivieren.
       Woran man die alte erkennt (Datum, Beschreibung) steht in der Anleitung.
    2. Danach in Thetadex: Tracking und Finanzen einmal öffnen und speichern (die neue Bereitstellung läuft weiter).
    3. Alte Apps vom Startbildschirm entfernen (Android: lange drücken → Entfernen oder Deinstallieren).
    4. Alte Repos `Tracking-Leben` und `App-Finazen-Tabelle` löschen: GitHub → Repo → Settings → ganz unten „Delete this repository“.
       Grund: Die alten Repos zeigen öffentlich die alten Script-Adressen. Nach Schritt 1 antworten diese Adressen nicht mehr.
  - Die Person meldet im Chat, wenn sie fertig ist.

- **7.5 Abschluss** (0.7.3 → 0.7.4)
  - Plan in `docs/STAND.md` einarbeiten und löschen. In STAND.md 3.2 den Umstieg und das Aufräumen als erledigt streichen.
  - Abschnittsnummern und Verweise in STAND.md selbst prüfen. Abschnitt 7.1 „Etappe 0“ kürzen, Geschichte (8) ordnen.
  - Sheet und Skript bleiben unverändert.

## Datenschutz und Sicherheit

- Neue Daten, neue Rechte, neue Adressen nach außen: keine.
- Weniger öffentlich: Nach dem Umstieg gibt es die alten Repos mit den alten Script-Adressen nicht mehr, und die alten Bereitstellungen antworten nicht mehr.
- Weniger Code heißt weniger, was Etappe 8 prüfen muss und was Fehler haben kann.
