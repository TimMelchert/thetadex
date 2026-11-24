# Plan Etappe 17 „Bingo“ (1.9.x)

Stand: 24.11.2026. Grundlage: Antworten der Person (24.11.2026).
Am Ende der Etappe wird er in `docs/STAND.md` eingearbeitet und gelöscht.

## 1. Ziel

Ein Jahres-Vorsatz-Bingo im Reiter Projekte. Ziel ist, in einem Jahr so viele Felder wie möglich abzuhaken.

- Der Reiter Projekte bekommt zwei **Unterreiter: „Projekte“** (die Liste wie bisher) **und „Bingo“**.
- **Jedes Jahr ein eigenes Bingo** mit 5 × 5 = 25 Feldern. Die Mitte ist ein normales Feld (kein Freifeld).
- **Alte Jahre bleiben** und lassen sich mit Pfeilen ‹ 2026 › ansehen. Sie lassen sich auch noch ändern, das ist weniger Code als eine Sperre.
- **Ein Feld** hat ein Bild, darunter eine kurze Textzeile (das Ziel, höchstens 40 Zeichen) und unten rechts ein kleines Kästchen zum Abhaken.
  Ein abgehaktes Feld wird grau (Bild in Graustufen, Fläche grau, Haken bleibt sichtbar).
- Über dem Raster steht „12 von 25 geschafft“. Volle Reihen werden nicht hervorgehoben (nicht gewünscht).
- **Verknüpfung:** Jedes Feld kann mit einem Projekt verknüpft werden (nicht mit einem Abschnitt), muss aber nicht.
  Steht das Projekt auf „Fertig“, ist das Feld abgehakt. Siehe Rückfrage 1.
- **Partnerin oder Partner** darf das Bingo sehen und bearbeiten, wie die Projekte (Entscheidung der Person, 24.11.2026).

## 2. Bilder, die sofort da sind (Wunsch der Person)

In der Bucket List lädt jedes Bild einzeln aus dem Drive (etwa 1 bis 2 Sekunden je Bild). Beim Bingo deshalb anders:

1. **Kleine Bilder direkt im Sheet.** Beim Hochladen schneidet die App das Bild quadratisch zu und verkleinert es auf 240 × 240 Pixel (JPEG, etwa 15 bis 25 KB).
   Es steht als Text in der Spalte `bild` (eine Zelle fasst 50.000 Zeichen, das Skript prüft die Länge). Kein Drive, kein Ordner.
   Das ganze Jahr kommt mit allen 25 Bildern in **einer** Anfrage (höchstens etwa 0,8 MB).
2. **Im Gerät behalten** (Wunsch der Person, 24.11.2026): Das zuletzt gezeigte Jahr liegt im Gerät (`thetadex_bingo`).
   Beim Öffnen steht das Bingo sofort da, die App lädt im Hintergrund neu und tauscht es aus. Ohne Netz steht „Stand von …“ da und es gibt keine Knöpfe zum Ändern (wie Uni).
   Abmelden löscht es. Folge: Wer das entsperrte Handy hat, sieht das Bingo ohne Passwort.
- Ein Feld ohne Bild zeigt eine Fläche in Taupe mit der Textzeile.

## 3. Aufbau in der App

- Adresse bleibt `#/projekte`, der Unterreiter wird sich gemerkt, solange die Seite offen ist (wie Herbarium).
- **Raster:** am Handy 5 Spalten über die ganze Breite (je etwa 66 px), Textzeile klein (0,7 rem) und höchstens zwei Zeilen, längere Texte enden mit „…“.
  Am PC höchstens etwa 640 px breit. Das Kästchen ist klein gezeichnet, die Tippfläche ist trotzdem 44 px groß (die untere rechte Ecke des Feldes).
- **Tipp auf ein Feld** (nicht auf das Kästchen) öffnet ein Fenster: großes Bild, ganzer Text, verknüpftes Projekt mit Status, „Bearbeiten“.
  Ein leeres Feld zeigt „+“ und öffnet gleich das Formular.
- **Formular:** Bild (Datei oder Foto), Text, Projekt (Auswahl aus den Projekten, „kein Projekt“), Löschen (leert das Feld).
- **Neues Jahr:** Gibt es für das laufende Jahr noch kein Bingo, zeigt der Unterreiter ein leeres Raster. Felder entstehen beim ersten Speichern.
- Felder verschieben: nicht geplant (siehe Rückfrage 2).

## 4. Sheet „Gemeinsam“, Blatt `bingo` (Schritt 17.1)

Spalten: `id, jahr, feld, text, bild, projekt, erledigt, erstellt_am, geaendert_am, geloescht`. `einrichten` legt das Blatt an. Löschen ist weich.

- `jahr`: vierstellig. `feld`: 0 bis 24 (Zeile für Zeile von links oben). Je Jahr und Feld höchstens ein Eintrag.
- `text`: Pflicht, 40 Zeichen, durch `pruefeText_`. `bild`: leer oder `data:image/jpeg;base64,…`, höchstens 50.000 Zeichen, das Skript prüft den Anfang.
- `projekt`: leer oder die `id` eines Projekts (nicht eines Abschnitts). `erledigt`: TRUE oder leer, nur für Felder ohne Projekt.
- Aktionen (beide Rollen, `person` und `partner`, Rechte in `ERLAUBT_`): `bingo` (ein Jahr lesen, dazu die Liste der Jahre), `bingo_speichern`, `bingo_haken`, `bingo_loeschen`.
- Grenzen: höchstens 25 Felder je Jahr, höchstens 50 Jahre.
- `bingo` liefert das Jahr (leer = dieses Jahr), die Liste der Jahre und die Projekte (ohne Abschnitte) mit Titel und Status, damit die App verknüpfte Felder abhaken kann. Alles in einer Antwort.
- `bingo_speichern`: ohne `id` mit `jahr` und `feld` (das Feld muss frei sein), sonst mit `id` und `geaendert_am`. `bild` fehlt = bleibt, leer = weg.
- `bingo_haken` schreibt nur `erledigt` und ändert `geaendert_am` nicht (doppelt senden schadet nicht). `bingo_loeschen` leert das Feld (weich).

## 5. Datenschutz

- Neue Daten: Bingo-Felder (Text, kleines Bild, Haken) im Sheet „Gemeinsam“, das mit niemandem geteilt wird. Über die Partnerin oder den Partner wird nichts gespeichert.
- Bilder liegen im Sheet statt im Drive. Wer das Sheet öffnen kann, sieht sie als langen Text. Das Sheet teilt die Person mit niemandem.
- Neu im Gerät: `thetadex_bingo` (ein Jahr mit Bildern). In `docs/STAND.md` 4 „Im Gerät“ nachtragen.
- Keine Ziele oder Bilder im Repo, auch nicht in Beispielen oder Pull-Request-Texten. Keine neuen Adressen nach außen, Content-Security-Policy bleibt (`img-src data:` gibt es schon).

## 6. Schritte

- **17.1** Skript `gemeinsam`: Blatt `bingo`, Aktionen; dieser Plan (1.9.0).
- **17.2** App: Unterreiter Projekte · Bingo, Raster, Fenster, Formular mit Bild, Abhaken, Verknüpfung (1.9.1).
- **17.3** App: Bingo im Gerät behalten (1.9.2).
- **17.4** Abschluss: Prüfung, Plan in `docs/STAND.md` einarbeiten, diese Datei löschen.

## 7. Rückfragen

1. **Abhaken bei verknüpften Feldern:** Mein Vorschlag: Das Feld folgt immer dem Projekt. Steht das Projekt auf „Fertig“, ist es abgehakt, sonst nicht. Das Kästchen ist dann nicht antippbar, das Fenster sagt „hakt sich ab, wenn das Projekt fertig ist“. Passt das?
2. **Felder umsortieren:** Brauchst du das (zum Beispiel zwei Felder tauschen), oder reicht es, ein Feld neu zu befüllen?
