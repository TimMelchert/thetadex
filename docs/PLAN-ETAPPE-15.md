# Plan Etappe 15 „Packlisten“ (1.7.x)

Stand: 23.11.2026, Schritt 15.1. Grundlage: Wünsche und Antworten der Person (23.11.2026). Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

## 1. Ziel

Ein neuer Reiter **„Packlisten“**: feste Listen je Anlass. Keine Vorlagen, keine Kopien je Reise. Die Namen der Listen stehen nur im Sheet.

- Ein Eintrag hat **Name** (Pflicht), **Gruppe** (zum Beispiel Kleidung, Hygiene, Technik) und **Anzahl** (freiwillig). Keine Notiz.
- **Zwei Haken** je Eintrag: „Hin“ (eingepackt) und „Zurück“ (wieder eingepackt, damit nichts liegen bleibt).
- Je Liste ein Knopf **„Alle Haken weg“** (mit Rückfrage), damit die Liste für das nächste Mal wieder leer ist.
- Gruppen und Einträge lassen sich mit Pfeilen ^ v sortieren (wie bei der Bucket List). Neue Einträge stehen am Ende ihrer Gruppe.
- Sonst keine Verbindung zum Besitz, mit einer Ausnahme: dem **Nutzungszähler** (siehe unten).
- Grenzen: Name 80 Zeichen, Gruppe 40, Listenname 40, Anzahl 1 bis 999, höchstens 50 Listen und 2000 Einträge insgesamt.

**Nutzungszähler (Wunsch der Person, vorerst nur für einen Wasserfilter gebraucht; geht aber bei jedem Item):**
- Ein Item im Besitz kann einen Zähler „Nutzungen“ haben (neue freiwillige Spalte `nutzungen` im Blatt `besitz`, ganze Zahl 0 bis 1.000.000).
- Ein Eintrag einer Packliste kann auf ein Item im Besitz zeigen (Spalte `besitz_id`, im Formular „Item aus dem Besitz“ wählen).
- Ist der Eintrag bei „Hin“ abgehakt (ab 1.7.3, Wunsch der Person), steht der Zähler des Items **oben über der Packliste**: „Wasserfilter · Nutzungen 24“ mit Knöpfen − und +. Jeder Tipp speichert sofort im Besitz.
- Im Besitz zeigt das Fenster des Items „Nutzungen 24“; im Formular lässt sich die Zahl setzen (leer = kein Zähler).

## 2. Aufbau in der App (Schritt 15.2)

- Name „Packlisten“, Adresse `#/packlisten`, Kennung `packlisten`, Skript `leben` (nur die Person, wie Besitz und Herbarium).
- Kachel auf der Startseite und am PC in der Seitenleiste, am Handy nicht in der Leiste unten (`nurBreit`).
- Farbe **Flieder `#A99AC6`** (`--farbe-packlisten`, Kontrast 6,7:1 zur dunklen Schrift), grüner Wanderrucksack vor der Überschrift (`icons/rucksack.svg`, ab 1.7.3, vorher 🧳), Symbol Rucksack `icons/reiter/packlisten.svg`.
  Ausnahme von den sieben Farben wie Visitenkarte, Herbarium und Bucket List: nur Kachel, Reiter und Marken, nicht im Icon.
- Oben je Liste ein **Unterreiter** (Namen nur im Sheet), dazu „+ Neue Liste“.
- Darunter die Nutzungszähler (falls vorhanden), dann „Hin 12 / 30 · Zurück 0 / 30“, dann die Einträge nach Gruppe in eigener Reihenfolge. Je Zeile: Haken Hin, Haken Zurück, Name, Anzahl („2×“), rechts ^ v. Jede Gruppe hat in ihrer Überschrift ^ v.
- Verschieben wirkt sofort, gespeichert wird kurz nach dem letzten Tippen (wie Bucket List).
- Ein Tipp auf einen Haken speichert sofort. Klappt es nicht, springt der Haken zurück und eine Meldung erscheint.
- „+ Neuer Eintrag“ und Tipp auf den Namen öffnen das Formular: Name, Gruppe (Auswahl aus den vorhandenen oder neu), Anzahl, Item aus dem Besitz (freiwillig), Löschen.
- Nur mit Netz (1.5): Die Listen liegen nur im Arbeitsspeicher.

## 3. Sheet „Leben“, Blatt `packliste` (Schritt 15.1)

Spalten: `id, liste, gruppe, name, anzahl, hin, zurueck, reihenfolge, besitz_id, erstellt_am, geaendert_am, geloescht`. `einrichten` legt das Blatt an. Löschen ist weich.

- Die Listen haben kein eigenes Blatt: Der Name steht als Text in `liste` (wie Orte im Besitz). Umbenennen im Sheet mit „Suchen und ersetzen“.
  Eine neue Liste entsteht mit ihrem ersten Eintrag.
- `hin`, `zurueck`: `TRUE` oder leer. `anzahl`: leer oder ganze Zahl.
- `reihenfolge`: kleine Zahl = oben, in der ganzen Liste; die Gruppen stehen in der Reihenfolge ihres ersten Eintrags.
- Blatt `besitz`: neue freiwillige Spalte `nutzungen` am Ende (`einrichten` ergänzt sie).
- Aktionen (nur `APP_PIN`): `packliste` (lesen, mit den Zählern der verknüpften Items), `pack_speichern`, `pack_haken` (`id`, `art` = `hin` oder `zurueck`, `wert`), `pack_loeschen`, `pack_zuruecksetzen` (`liste`: alle Haken der Liste weg), `pack_reihenfolge`, `besitz_nutzung` (`id`, `schritt` = +1 oder −1, nie unter 0). `besitz` und `besitz_speichern` kennen `nutzungen`.
- Texte über `bereinigeText_`, jeder Schreibzugriff mit `LockService`.

## 4. Datenschutz

- Neue Daten: nur Packlisten (Name, Gruppe, Anzahl, Haken) im Sheet „Leben“, das mit niemandem geteilt wird. Kein Partner-Zugang, kein Teilen.
- Keine Listennamen oder Einträge im Repo. Keine neuen Adressen nach außen.

## 5. Schritte

- **15.1** Skript `leben`: Blatt `packliste`, Spalte `nutzungen`, Aktionen; Plan ins Repo (1.7.0).
- **15.2** Reiter Packlisten in der App, mit Nutzungszähler (1.7.1).
- **15.3** Besitz zeigt und ändert `nutzungen` (1.7.2).
- Die Listen der Person liegen aufbereitet in den Projektdateien (`packlisten/packliste-import.csv`, Spalten wie das Blatt, ohne Kopfzeile). Sie kommen nach 15.1 ab Zeile 2 ins Blatt.
- **15.4** Abschluss: Prüfung, Plan in `docs/STAND.md` einarbeiten, diese Datei löschen.
