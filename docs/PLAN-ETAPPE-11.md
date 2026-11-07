# Plan Etappe 11 „Rezepte“ (1.3.x)

Stand: 7.11.2026, Schritt 11.0. Grundlage: Wunsch der Person (7.11.2026). Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

## 1. Ziel

Im Reiter Einkauf wird der Unterreiter „Gerichte“ zu einem Umschalter im Unterreiter „Lebensmittel“.
An seine Stelle kommt ein neuer Unterreiter **„Rezepte“**: Rezepte als Text schreiben, suchen, ändern und löschen.
Die Liste zeigt nur die Titel, ein Tipp klappt ein Rezept auf. Die Partnerin oder der Partner darf Rezepte lesen und ändern (wie alles im Einkauf).

Was gleich bleibt:
- Einkaufsliste, Lebensmittel, Vorrat und Gerichte funktionieren wie bisher. Gerichte behalten Notiz, Rezept-Link und Zutaten.
- Die Einkaufsliste „Nach Gericht“ bleibt.
- Tracking, Finanzen, Besitz, Uni, Pen & Paper, Döner und Visitenkarte werden nicht angefasst.

## 2. Aufbau (Vorschlag)

**Unterreiter:** Einkaufsliste · Lebensmittel · Rezepte. Der Unterreiter „Gerichte“ entfällt.

**Lebensmittel mit Umschalter „Einzeln | Gerichte“**
- Ganz oben im Unterreiter Lebensmittel, über dem Knopf „Auf die Einkaufsliste“, ein Umschalter mit zwei Teilen: **Einzeln** (Vorgabe) und **Gerichte**.
  Er sieht aus wie „Nach Abteilung | Nach Gericht“ in der Einkaufsliste.
- Grund für den Platz: Neben „Auf die Einkaufsliste“ ist am Handy kein Platz mehr (dort steht schon „Auswahl aufheben“).
  Und beide Wege enden auf der Einkaufsliste: einzelne Lebensmittel ankreuzen oder ein Gericht mit seinen Zutaten wählen.
- „Einzeln“ zeigt alles wie heute (Suche, Vorrat, Abteilung, ankreuzen).
  „Gerichte“ zeigt die heutige Gerichte-Liste (Suche, „+ Neues Gericht“, Gericht antippen → Zutaten → „Auf die Liste“).
- Die Auswahl angekreuzter Lebensmittel bleibt beim Umschalten erhalten.
- Andere Möglichkeit (nicht vorgeschlagen): Gerichte als Knopf im Unterreiter Rezepte. Dann wäre der Weg zur Einkaufsliste länger.

**Rezepte**
- Oben eine Suche (sucht in Titel und Text, ohne Groß- und Kleinschreibung, „apf“ findet „Äpfel“), daneben „+ Neues Rezept“ und „Neu laden“.
- Die Liste zeigt nur die **Titel**, A–Z. Ein Tipp klappt das Rezept auf: der ganze Text mit seinen Zeilenumbrüchen,
  der Link (wenn eingetragen) und der Knopf „Bearbeiten“. Ein zweiter Tipp klappt es wieder zu. Mehrere Rezepte dürfen gleichzeitig offen sein.
- Bei einer Suche zeigt die Liste nur passende Rezepte.
- „Bearbeiten“ und „+ Neues Rezept“ öffnen ein Fenster: **Titel** (Pflicht), **Text** (großes Feld), **Link** (freiwillig, nur `https://`).
  Im Fenster auch „Löschen“ (mit Rückfrage).
- **Nichts geht verloren:** Hat die Partnerin oder der Partner dasselbe Rezept inzwischen geändert, speichert das Skript nicht
  (Schutz über `geaendert_am`, wie bei Lebensmitteln). Dann bleibt der Text im Fenster stehen, und eine Meldung sagt:
  „Inzwischen geändert. Text kopieren, neu laden, dann einfügen.“ Schlägt das Senden fehl, bleibt der Text ebenso stehen.

## 3. Sheet „Gemeinsam“, neues Blatt `rezepte`

Kopfzeile in Zeile 1, dazu wie immer `id, erstellt_am, geaendert_am, geloescht`. Löschen ist weich (im Sheet zurückholbar).

| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `titel` | Name des Rezepts | ja | 100 Zeichen |
| `text` | das Rezept: Zutaten, Schritte, Notizen | nein | 20.000 Zeichen, **Zeilenumbrüche bleiben** |
| `link` | Quelle im Internet | nein | nur `https://`, 300 Zeichen |

- Höchstens 500 Rezepte. Ein Titel darf doppelt vorkommen (zwei Varianten eines Rezepts sind erlaubt).
- `einrichten` legt das Blatt `rezepte` an. Vorhandene Blätter bleiben unverändert.

## 4. Skript `gemeinsam` (Änderungen)

- Neue Aktionen, erlaubt für beide Rollen (`person` und `partner`):
  | Aktion | Was sie tut |
  | --- | --- |
  | `rezepte` | alle Rezepte (wird erst geladen, wenn der Unterreiter Rezepte geöffnet wird, damit die Einkaufsliste schnell bleibt) |
  | `rezept_speichern` | neu (ohne `id`) oder ändern (mit `id` und `geaendert_am` als Schutz vor Überschreiben) |
  | `rezept_loeschen` | weich löschen (mit `geaendert_am`) |
- **Ausnahme für Zeilenumbrüche:** Sonst nimmt `bereinigeText_` alle Zeilenumbrüche heraus (STAND.md 1.6). Für `text` kommt ein eigener Helfer
  `bereinigeLangtext_` dazu: Er behält Zeilenumbrüche, macht Tabulatoren zu Leerzeichen, kürzt auf 20.000 Zeichen und setzt vor ein führendes
  `=`, `+`, `-` oder `@` ein Hochkomma (Schutz vor Formeln wie bisher). Alle anderen Felder bleiben bei `bereinigeText_`.
- Schreiben wie immer mit `LockService`, jede Eingabe wird geprüft.

## 5. Datenschutz und Sicherheit

- Neue Daten: Rezepttexte und Links. Keine Namen, keine Gesundheitsdaten. Wer etwas geschrieben hat, wird nicht gespeichert.
- Wer sieht sie: die Person (`APP_PIN`) und die Partnerin oder der Partner (`PARTNER_PIN`), beide nur mit Passwort. Das Sheet bleibt mit niemandem geteilt.
- **Nicht im Gerät:** Rezepte liegen nur im Arbeitsspeicher, solange die Seite offen ist (wie Lebensmittel und Gerichte).
- Texte zeigt die App nur mit `textContent` (Zeilenumbrüche über CSS `white-space: pre-wrap`). Links öffnen nur mit `https://` (`sichereUrl`).
- Keine neuen Adressen nach außen, die Content-Security-Policy bleibt gleich.

## 6. Schritte

| Schritt | Version | Was | Sheet und Skript |
| --- | --- | --- | --- |
| 11.0 | 1.3.0 | dieser Plan | unverändert |
| 11.1 | 1.3.1 | Gerichte als Umschalter „Einzeln \| Gerichte“ im Unterreiter Lebensmittel, Unterreiter „Gerichte“ entfällt | unverändert |
| 11.2 | 1.3.2 | Blatt `rezepte`, Aktionen im Skript, Unterreiter „Rezepte“ mit Suche, Aufklappen, Bearbeiten | **Von Hand:** `Code.gs` ersetzen, `einrichten` ausführen, neue Version bereitstellen |
| 11.3 | 1.3.3 | Abschluss: kurze Prüfung Sicherheit und Datenschutz (nur Bericht), Plan in STAND.md einarbeiten, diese Datei löschen | unverändert |

Nach 11.1 gibt es kurz nur zwei Unterreiter (Einkaufsliste, Lebensmittel); „Rezepte“ kommt mit 11.2. Steht nach 11.2 noch die alte Fassung von `Code.gs`
im Editor, zeigt der Unterreiter Rezepte „Unbekannte Aktion“ mit dem Hinweis, das Skript zu ersetzen (STAND.md 1.6).
