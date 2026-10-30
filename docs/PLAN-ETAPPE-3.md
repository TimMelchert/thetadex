# Plan Etappe 3 „Besitz“ (0.3.x)

Ziel: Ein neuer Reiter Besitz mit einer Liste aller Sachen, Ort und Anzahl, bei neuen Sachen mit Kaufpreis und Kaufdatum.
Dazu ein neues Sheet „Leben“ mit eigenem Skript `leben`, nur für die Person. Regeln: STAND.md 1.2, 2.2, 4 und 7.2.
Vorher wird „Einrichtung“ zu „Einstellungen“ mit einem Schalter für das Aussehen (Wunsch der Person, 30.10.2026).
Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

Was gleich bleibt:
- Tracking, Finanzen und Döner bleiben unverändert. Ihre Sheets und Skripte werden in dieser Etappe nicht angefasst.
- Ein Passwort für alle Skripte (`APP_PIN`). Das neue Skript bekommt dasselbe Passwort.
- Besitz ist privat (STAND.md 4 „Besitz: keine Daten öffentlich“): keine Sachen, Orte oder Preise im Repo,
  auch nicht in Beispielen oder Pull-Request-Texten.

Was im Gerät liegt: nur die Wahl hell / dunkel / wie Gerät (neu, harmlos) und die Script-Adresse von `leben`.
Die Besitz-Liste hält die App nur im Arbeitsspeicher, solange die Seite offen ist. Sie wird **nicht** im Gerät gespeichert.

## Schritt 3.0 Plan (0.2.9 → 0.3.1)

- Dieser Plan. Sheet und Skript bleiben unverändert.
- 0.3.1: Antworten der Person eingearbeitet (30.10.2026): Orte ohne eigenes Blatt, neue Spalte `kategorie`, keine Summe der Kaufpreise.

## Schritt 3.1 Einstellungen statt Einrichtung, Aussehen hell / dunkel / Gerät (0.3.1 → 0.3.2) – erledigt

- Oben rechts heißt es „Einstellungen“ (Zahnrad-Symbol), Adresse `#/einstellungen`.
  Die alte Adresse `#/einrichtung` führt weiter dorthin, damit gespeicherte Lesezeichen nicht ins Leere gehen.
- Aus `js/views/einrichtung.js` wird `js/views/einstellungen.js` (alte Datei löschen, `sw.js` → `HUELLE` anpassen).
  Inhalt wie bisher (Passwort, Script-Adressen, „Verbindung prüfen“, „Abmelden“), dazu oben ein neuer Abschnitt **Aussehen**:
  drei Knöpfe nebeneinander „Hell“, „Dunkel“, „Wie Gerät“ (Vorgabe „Wie Gerät“). Die Wahl gilt sofort, ohne Speichern-Knopf.
- Gespeichert nur im Gerät unter `thetadex_aussehen` (`hell`, `dunkel` oder `geraet`). „Abmelden“ löscht sie mit (dann wieder „Wie Gerät“).
- Umsetzung: `js/app.js` setzt beim Start `data-aussehen` am `<html>`. `css/base.css`: Die dunklen Farben gelten bei
  „Dunkel“ immer, bei „Wie Gerät“ nur, wenn das Gerät dunkel ist; bei „Hell“ nie. Die Farbwerte bleiben genau dieselben.
  Mitziehen: `color-scheme` (Formularfelder, Kalender), `theme-color` (Farbe der Leiste am Handy) und die Farben der Diagramme in der Auswertung.
- Texte und STAND.md: überall „Einstellungen“ statt „Einrichtung“, auch in den Prüflisten.
- Sheet und Skript bleiben unverändert.

## Schritt 3.2 Sheet „Leben“, Skript `leben` und Reiter Besitz: anzeigen und hinzufügen (0.3.2 → 0.3.3) – erledigt

- **Sheet „Leben“** (neu, von der Person angelegt, mit niemandem geteilt). Blatt `besitz`, Kopfzeile in Zeile 1:
  `id, name, kategorie, ort, anzahl, kaufpreis, kaufdatum, notiz, erstellt_am, geaendert_am, geloescht`
  | Spalte | Inhalt | Pflicht | Grenze |
  | --- | --- | --- | --- |
  | `id` | vom Skript vergeben (zufällig) | – | – |
  | `name` | was es ist | ja | 80 Zeichen |
  | `kategorie` | zum Beispiel „Technik“ oder „Kleidung“ | ja | 40 Zeichen |
  | `ort` | wo es liegt, zum Beispiel „Keller / Regal 2“ | ja | 60 Zeichen |
  | `anzahl` | ganze Zahl | ja, Vorgabe 1 | 0 bis 9999 |
  | `kaufpreis` | Euro, zwei Nachkommastellen | nein | 0 bis 1.000.000 |
  | `kaufdatum` | JJJJ-MM-TT, nicht in der Zukunft | nein | – |
  | `notiz` | freier Text | nein | 300 Zeichen |
  | `erstellt_am`, `geaendert_am`, `geloescht` | setzt das Skript | – | – |
- **Orte und Kategorien ohne eigenes Blatt** (entschieden von der Person, 30.10.2026): Die Auswahl bildet die App aus den Orten
  und Kategorien, die schon in der Liste stehen (Auswahlfeld mit Freitext `js/ui/auswahl.js`, wie Zweck bei Finanzen). Ein neuer Ort
  oder eine neue Kategorie entsteht einfach durch Eintippen. Umbenennen geht im Sheet mit „Bearbeiten → Suchen und ersetzen“
  in Spalte `ort` oder `kategorie`. Das früher geplante Blatt `orte` entfällt.
- **Keine Summe der Kaufpreise** (entschieden von der Person, 30.10.2026).
- **Skript `apps-script/leben/Code.gs`** (neu, gleicher Aufbau wie Finanz- und Döner-Skript):
  - Funktion `einrichten` legt das Blatt `besitz` mit Kopfzeile an und ergänzt fehlende Spalten am Ende. Vorhandenes bleibt.
  - Jede Aktion nur mit Passwort (`pruefePin_` mit Sperre nach 5 Fehlversuchen). `doGet` nennt nur den Namen der Schnittstelle.
  - Aktionen: `ping` (prüfen), `liste` (alle Sachen ohne `geloescht`), `speichern` (neu, wenn keine `id` kommt).
  - Gebaut: Das Skript kann schon ändern und löschen (3.3), damit die Person `Code.gs` nur einmal einfügen muss. Die App nutzt das ab 3.3.
  - Jede Eingabe wird geprüft (Art, Länge, erlaubte Werte) und mit `bereinigeText_` geschützt. Schreiben mit `LockService`.
- `js/config.js`: `SKRIPTE` bekommt `leben` (Titel „Besitz“, Test `liste`). Die Adresse trägt die Person unter Einstellungen ein.
- **Reiter Besitz** `js/views/besitz.js` (ersetzt den Platzhalter):
  - Überschrift „Besitz“, rechts oben „+ Hinzufügen“ klappt das Formular auf (wie „+ Bewerten“ bei Döner, × schließt).
  - Formular: Name, Kategorie und Ort (je Auswahl mit Freitext), Anzahl, darunter freiwillig Kaufpreis, Kaufdatum (Vorgabe leer), Notiz.
    „Speichern“ in der Besitz-Farbe, gesperrt während des Sendens. Erfolg nur nach Antwort des Skripts (Fenster „Gespeichert“).
    Bei Fehler bleibt alles stehen. Nach Erfolg bleibt der Ort stehen (praktisch beim Einräumen eines Schranks), der Rest leert sich (auch die Kategorie).
  - Liste nach Ort gruppiert, je Ort eine Überschrift mit der Zahl der Sachen (der Ort steht darum nicht als Spalte in der Tabelle). Am Handy Karten (Name groß, Kategorie, Anzahl),
    am PC eine Tabelle (Name, Kategorie, Ort, Anzahl, Kaufpreis, Kaufdatum).
  - Knopf „Neu laden“. Ohne Verbindung eine klare Meldung in der App.

## Schritt 3.3 Besitz: ändern, löschen, suchen, filtern (0.3.3 → 0.3.4) – erledigt

- Skript: Aktion `speichern` ändert eine vorhandene Zeile, wenn eine `id` kommt. Neue Aktion `loeschen` setzt nur `geloescht = TRUE` (weich, im Sheet zurückholbar).
- **Schutz vor Überschreiben:** Die App schickt beim Ändern das `geaendert_am`, das sie kennt. Hat sich die Zeile inzwischen
  geändert (zum Beispiel am anderen Gerät), speichert das Skript nicht und die App sagt: „Wurde inzwischen geändert. Bitte neu laden.“
- App: Antippen einer Sache öffnet sie im Formular zum Ändern; dort auch „Löschen“ mit Rückfrage.
- Suchleiste oben: sucht in Name, Kategorie, Ort und Notiz, schon beim Tippen, ohne Groß- und Kleinschreibung.
- Filter nach Ort („Alle Orte“ oder ein Ort) und nach Kategorie („Alle Kategorien“ oder eine). Suche und Filter rechnen nur im Gerät, ohne neue Anfrage.
- Sortieren am PC durch Tippen auf den Spaltenkopf (Name, Kategorie, Anzahl, Kaufpreis, Kaufdatum; zweiter Tipp umgekehrt). Gilt für alle Orte. Am Handy nach Name.
- Gebaut: Die Skript-Seite (Ändern, Löschen, Schutz vor Überschreiben) kam schon mit 3.2. Sheet und Skript bleiben in 3.3 unverändert.

## Schritt 3.4 Nachbesserungen und Abschluss (0.3.5 …)

- Anmerkungen der Person aus dem Testen, gesammelt in einem oder mehreren Schritten.
- Danach Etappe 3 abschließen: Plan in STAND.md einarbeiten, diese Datei löschen.

## Datenschutz und Sicherheit (für die ganze Etappe)

- Neue Daten: nur Sachen der Person mit Kategorie, Ort, Anzahl, Preis, Datum, Notiz. Keine Daten über andere Personen.
- Wer sieht sie: nur die Person mit Passwort. Eigenes Sheet und eigenes Skript, getrennt von allem, was geteilt wird (STAND.md 2.2).
  Das Skript kennt kein `PARTNER_PIN` und gibt ohne Passwort nichts heraus.
- Im Gerät: nur `thetadex_aussehen` und die Script-Adresse. Die Liste nur im Arbeitsspeicher.
- Keine neuen Adressen nach außen; die Content-Security-Policy bleibt gleich (das Skript liegt wie die anderen auf `script.google.com`).
- Alle Texte aus dem Sheet zeigt die App nur mit `textContent`.
- Böse Eingaben: Längen und Werte prüft das Skript, Formeln verhindert `bereinigeText_`, Schreiben nur mit `LockService`.

## Von Hand (Person, in Schritt 3.2, steht dann genau im Pull Request)

1. Google Drive → Neu → Google Tabellen, Name „Leben“. Mit niemandem teilen.
2. Erweiterungen → Apps Script, `apps-script/leben/Code.gs` aus dem Repo hineinkopieren.
3. Projekteinstellungen → Skripteigenschaften: `APP_PIN` mit demselben Passwort wie bei den anderen Skripten.
4. Funktion `einrichten` einmal ausführen.
5. Bereitstellen → Neue Bereitstellung → Web-App (Ausführen als: ich, Zugriff: Jeder). Adresse in Thetadex unter Einstellungen eintragen.
