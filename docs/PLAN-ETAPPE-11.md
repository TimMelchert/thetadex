# Plan Etappe 11 „Rezepte“ (1.3.x)

Stand: 7.11.2026, Schritt 11.0. Grundlage: Wunsch der Person (7.11.2026) und ihre Antworten auf den ersten Entwurf
(Gerichte und Rezepte zusammenlegen, Personen umrechnen, Bilder aus Drive, nur mit Netz, keine Kategorien) und auf die Rückfragen dazu.
Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

## 1. Ziel

Aus den bisherigen **Gerichten werden Rezepte**. Ein Rezept hat wie bisher Zutaten mit Mengen und dazu neu einen Rezepttext,
eine Angabe „für wie viele Personen“ und/oder „ergibt“ (zum Beispiel „1 Blech“) und freiwillig Bilder aus Google Drive.
Beim Auswählen gibt man ein, für wie viele Personen man diesmal kocht; die Mengen für die Einkaufsliste rechnen sich um.
Die gespeicherten Mengen im Rezept bleiben dabei unverändert.

Was gleich bleibt:
- Einkaufsliste, Lebensmittel, Vorrat und Abhaken funktionieren wie bisher.
- Im Sheet bleibt das Blatt `gerichte` mit seinem Namen und seinen Spalten (Blätter werden nie umbenannt, STAND.md 1.6). Vorhandene Gerichte sind danach einfach Rezepte.
- Die Partnerin oder der Partner darf Rezepte lesen und ändern (wie alles im Einkauf).
- Tracking, Finanzen, Besitz, Uni, Pen & Paper, Döner und Visitenkarte werden nicht angefasst.

## 2. Festlegungen (Antworten der Person, 7.11.2026)

1. **Kein eigener Unterreiter Rezepte.** Unterreiter bleiben: Einkaufsliste · Lebensmittel. Der Unterreiter „Gerichte“ entfällt.
2. **Umschalter oben bei Lebensmitteln: „Einzeln | Rezepte“.** Ganz oben im Unterreiter Lebensmittel, über „Auf die Einkaufsliste“.
   „Einzeln“ zeigt alles wie heute, „Rezepte“ die Rezept-Liste. Die Auswahl angekreuzter Lebensmittel bleibt beim Umschalten erhalten.
3. **Rezepttext** steht im Rezept über den Zutaten und Mengen.
4. **Personen und Menge:** Ein Rezept hat freiwillig „für … Personen“ (Zahl) und/oder „ergibt“ (kurzer Text, zum Beispiel „1 Blech“, „12 Stück“).
5. **Umrechnen:** Beim Auswählen eines Rezepts steht oben „Personen diesmal“ mit den gespeicherten Personen als Vorgabe.
   Ändert man die Zahl, rechnen sich alle Mengen um. Jede Menge bleibt danach einzeln änderbar. Gespeichert wird dabei nichts.
6. **Bilder aus Google Drive:** mehrere Bilder je Rezept (höchstens 10), je als Drive-Link oder hochgeladen (wie bei Besitz).
   Lädt die Partnerin oder der Partner ein Bild hoch, liegt es im Drive der Person (bestätigt).
7. **Nur mit Netz.** Rezepte werden nicht im Gerät gespeichert.
8. **Keine Kategorien.** Die Suche reicht.
9. **Formatierung:** nur Text mit Zeilenumbrüchen (keine fette Schrift).
10. **Umrechnen** rundet auf halbe Einheiten, mindestens 0,5 (bestätigt).

## 3. Aufbau in der App

**Lebensmittel → „Rezepte“: Liste**
- Suche (in Titel, Text und Zutaten, ohne Groß- und Kleinschreibung), daneben „+ Neues Rezept“. Die Liste zeigt nur die Titel, A–Z.
- Ein Tipp öffnet das Rezept-Fenster (wie heute beim Gericht).

**Rezept-Fenster (Auswählen)**, von oben nach unten:
1. Bilder (wenn eingetragen; mehrere nebeneinander, Tipp vergrößert), darunter „für 4 Personen · ergibt 1 Blech“ (was eingetragen ist).
2. Rezepttext (mit Zeilenumbrüchen) und Link (wenn eingetragen).
3. **„Personen diesmal“** mit − und + (nur wenn „für … Personen“ eingetragen ist).
4. Zutaten wie heute: Haken, Menge änderbar, „zuhause: …“. Zutaten mit genug Vorrat sind nicht angehakt (wie bisher).
5. Knöpfe „Auf die Liste“ und „Bearbeiten“.

**Umrechnen:** neue Menge = gespeicherte Menge × Personen diesmal ÷ Personen im Rezept, gerundet auf halbe Einheiten, mindestens 0,5.
Beispiel: Rezept für 4 Personen mit 3 Zwiebeln, diesmal 2 Personen → 1,5 Zwiebeln. Hat man eine Menge von Hand geändert und ändert danach die Personen,
wird sie wieder neu gerechnet (die Personen gelten für alle). Der Vorrat-Haken prüft gegen die umgerechnete Menge.

**Rezept bearbeiten** (bisher „Gericht ändern“), von oben nach unten: Titel, Bilder (Drive-Link einfügen oder Bild hochladen, je Bild × zum Entfernen),
für … Personen, ergibt, Rezepttext (großes Feld), Link, Zutaten mit Mengen (wie heute, auch „+ Neues Lebensmittel“), Speichern, Löschen.
- **Nichts geht verloren:** Hat die Partnerin oder der Partner das Rezept inzwischen geändert, speichert das Skript nicht (Schutz über `geaendert_am`).
  Der Text bleibt im Fenster stehen, mit der Meldung „Inzwischen geändert. Text kopieren, neu laden, dann einfügen.“ Schlägt das Senden fehl, bleibt ebenfalls alles stehen.

**Andere Stellen:** Die Einkaufsliste heißt dann „Nach Abteilung | Nach Rezept“, die Gruppe „Einzeln“ bleibt, „Gericht von der Liste nehmen“ heißt „Rezept von der Liste nehmen“.

## 4. Sheet „Gemeinsam“, Blatt `gerichte` (neue Spalten am Ende)

`einrichten` ergänzt die Spalten von selbst, vorhandene Daten bleiben.

| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `text` | Rezepttext | nein | 20.000 Zeichen, **Zeilenumbrüche bleiben** |
| `personen` | für wie viele Personen | nein | ganze Zahl 1 bis 99, leer = keine Angabe |
| `ergibt` | Menge, zum Beispiel „1 Blech“ | nein | 40 Zeichen |
| `bilder` | Liste der Kennungen von Bild-Dateien im Google Drive der Person (JSON, wie `bilder` bei Pen & Paper) | nein | höchstens 10, setzt das Skript |

Die bisherige Spalte `notiz` (300 Zeichen) bleibt. Die App zeigt sie im Fenster über dem Rezepttext an, solange sie gefüllt ist. Beim Bearbeiten steht sie oben im Rezepttext und wird beim Speichern dorthin verschoben (danach ist `notiz` leer).
Höchstens 500 Rezepte.

## 5. Skript `gemeinsam` (Änderungen)

- `gericht_speichern` nimmt zusätzlich `text`, `personen`, `ergibt` und `bilder` (Liste der behaltenen Kennungen) an. Felder, die nicht mitkommen, bleiben unverändert.
  Neue Bilder kommen über die Aktion **`rezept_bild`** dazu: als Drive-Link oder Kennung (`bild`) oder hochgeladen (`bild_daten`), eines je Anfrage, mit Schutz über `geaendert_am`.
- **Langer Text:** neuer Helfer `bereinigeLang_` wie im Skript `dsa`: Zeilenumbrüche bleiben, Tabulatoren werden Leerzeichen, höchstens zwei Leerzeilen hintereinander,
  Länge begrenzt, vor ein führendes `=`, `+`, `-` oder `@` kommt ein Hochkomma (Schutz vor Formeln). Alle anderen Felder bleiben bei `bereinigeText_`.
- **Bilder wie bei Besitz:** Hochgeladene Bilder (die App verkleinert vorher auf höchstens 1600 px, JPEG) legt das Skript in den privaten Drive-Ordner
  **„Thetadex Rezepte“** (Kennung in der Skripteigenschaft `BILD_ORDNER`, legt `einrichten` an). Ein Drive-Link muss auf ein Bild zeigen.
- Neue Aktion **`bild`**: gibt ein Bild nur mit Passwort und nur heraus, wenn es bei einem nicht gelöschten Rezept steht (niemand kann so andere Dateien aus dem Drive lesen).
  Erlaubt für beide Rollen.
- Beim ersten `einrichten` fragt Google nach der Erlaubnis für Drive (wie beim Skript `leben`).
- Alles Neue kommt in einem Schritt (11.2), damit `Code.gs` nur einmal eingefügt werden muss.

## 6. Datenschutz und Sicherheit

- Neue Daten: Rezepttexte, Personen, „ergibt“, Bilder (bis 10 je Rezept). Keine Namen, keine Gesundheitsdaten. Wer etwas geschrieben hat, wird nicht gespeichert.
- Wer sieht sie: die Person (`APP_PIN`) und die Partnerin oder der Partner (`PARTNER_PIN`), beide nur mit Passwort. Das Sheet bleibt mit niemandem geteilt.
- **Bilder** liegen im Drive der Person. Lädt die Partnerin oder der Partner ein Bild hoch, landet es ebenfalls dort (das Skript läuft als die Person).
  Nichts wird öffentlich geteilt. Das Skript liest nur Bilder, die bei einem Rezept stehen. Die Content-Security-Policy bleibt gleich (`img-src 'self' data:`).
- **Nicht im Gerät:** Rezepte und Bilder liegen nur im Arbeitsspeicher, solange die Seite offen ist. Die Einkaufsliste im Gerät speichert wie bisher nur den Namen des Rezepts.
- Texte zeigt die App nur mit `textContent` (Zeilenumbrüche über CSS `white-space: pre-wrap`). Links öffnen nur mit `https://` (`sichereUrl`).

## 7. Schritte

| Schritt | Version | Was | Sheet und Skript |
| --- | --- | --- | --- |
| 11.0 | 1.3.0 bis 1.3.2 | dieser Plan (1.3.1 und 1.3.2: Antworten der Person eingearbeitet) | unverändert |
| 11.1 – erledigt | 1.3.3 | Umschalter „Einzeln \| Rezepte“ bei Lebensmitteln, Unterreiter „Gerichte“ entfällt, überall „Rezept“ statt „Gericht“ | unverändert |
| 11.2 – erledigt | 1.3.4 | Skript: neue Spalten, Langtext, Bilder (auch mehrere), Aktion `bild`. App: Rezepttext, Personen, ergibt, Umrechnen | **Von Hand:** `Code.gs` ersetzen, `einrichten` ausführen (Drive erlauben), neue Version bereitstellen |
| 11.3 – erledigt | 1.3.5 | Bilder im Rezept: anzeigen, Drive-Link einfügen, hochladen, entfernen | unverändert (kann schon alles seit 11.2) |
| 11.4 | 1.3.6 | Abschluss: kurze Prüfung Sicherheit und Datenschutz (nur Bericht), Plan in STAND.md einarbeiten, diese Datei löschen | unverändert |

Steht nach 11.2 noch die alte Fassung von `Code.gs` im Editor, gehen Rezepttext und Personen beim Speichern verloren. Darum prüft die App in 11.2,
ob das Skript die neuen Spalten kennt (Antwort von `alles`), und zeigt sonst den Hinweis „Bitte zuerst `Code.gs` ersetzen“ statt der neuen Felder.
