# Plan Etappe 2 „Bestehendes umziehen“ (0.2.x)

Ziel: Tracking und Finanzen funktionieren in Thetadex „wie bisher“, ohne Datenverlust. Regeln: STAND.md 1.2, 2.2, 4 und 7.2.
Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

Was gleich bleibt:
- Die Daten bleiben in den bestehenden Sheets. Kein Export, kein Import, keine Spalte wird umbenannt oder verschoben.
- Neu kommt je Sheet nur ein Blatt `Einstellungen`. Die Skripte schreiben genau dorthin, wo die alten Apps schreiben.
- Die alten Apps laufen mit ihren alten Bereitstellungen weiter, bis die Person umsteigt (Tor am Ende).
  Darum wird bei jeder Skript-Änderung **nur die Thetadex-Bereitstellung** auf die neue Version gestellt, nie die alte.
- Kein Knopf „Auf anderes Gerät übertragen“ (Wunsch der Person). Jedes Gerät wird einmal unter „Einrichtung“ eingerichtet.

Was im Gerät liegt: Passwort, Script-Adressen und die zuletzt bekannten Kontostände (wie bisher).
Die Einstellungen (Tracking-Felder, Zwecke, Personen) lädt die App bei jedem Öffnen des Reiters neu und speichert sie **nicht** im Gerät.
Grund: Sie verraten, was getrackt wird. Ohne Netz kann man ohnehin nichts senden (1.5).

Hilfe zum Ausfüllen: Die Werte der alten Apps (Felder, Zwecke, Personen) legt der Agent als Tabelle zum Kopieren in die
Projektdateien im Chat (`etappe-2/`), **nie ins Repo**. Die Person fügt sie ins Blatt `Einstellungen` ein.

## Schritt 2.0 Plan (0.1.10 → 0.2.1)

- Dieser Plan. Sheet und Skript bleiben unverändert. Nachbesserung 0.2.1: Diagramme mit Chart.js (Entscheidung der Person, 29.10.2026).

## Schritt 2.1 Tracking (0.2.1 → 0.2.2)

- Sheet Tracking, neues Blatt `Einstellungen`, Kopfzeile in Zeile 1:
  `feld, gruppe, art, vorgabe, optionen, schritt`
  - `feld`: genau der Spaltenname aus `Tabellenblatt1`, Zeile 4.
  - `gruppe`: Überschrift im Formular (zum Beispiel „Gesundheit“). Reihenfolge der Zeilen = Reihenfolge im Formular.
  - `art`: `haken` (Ja/Nein, sendet 1 oder 0), `zahl` oder `auswahl`.
  - `vorgabe`: Startwert (bei `haken`: WAHR oder leer).
  - `optionen` (nur `auswahl`): Einträge mit `;` getrennt, je Eintrag `wert=Text` oder nur `wert` (dann ist Text = Wert).
  - `schritt` (nur `zahl`, freiwillig): zum Beispiel 0,5. Leer = ganze Zahlen.
  - Zeilen mit leerem `feld` werden übersprungen. Spalten der Kopfzeile, die nicht im Blatt `Einstellungen` stehen, zeigt die App nicht.
- Skript `apps-script/tracking/Code.gs`:
  - Funktion `einrichten` (einmal im Editor ausführen): legt `Einstellungen` mit Kopfzeile an und trägt jede Spalte aus
    `Tabellenblatt1` Zeile 4 (außer `Datum` und leeren) als `feld` mit `art = zahl` ein. Ein vorhandenes Blatt bleibt unverändert.
    So steht kein Feldname im Repo.
  - Neue Aktion `einstellungen`: liefert die Felder. Prüft, dass jedes `feld` in der Kopfzeile steht; fehlende meldet sie als Hinweis.
  - `eintragen` bleibt wie es ist (prüft schon jeden Feldnamen gegen die Kopfzeile).
- Reiter Tracking `js/views/tracking.js`: Datum (Vorgabe heute, nach Mitternacht wieder heute, solange nicht von Hand geändert),
  darunter je Gruppe eine Karte mit den Feldern. Haken als große Schalter (44 px), Auswahl als Liste, Zahl als Zahlenfeld.
  Am PC zwei bis drei Spalten, am Handy zwei.
  Knopf „Speichern“: gesperrt während des Sendens (keine Doppel-Einträge). Erfolg nur nach Antwort des Skripts,
  dann kurze Meldung „Gespeichert für <Datum>“ und das Formular steht wieder auf den Vorgaben. Bei Fehler bleibt alles stehen.
- Einrichtung „Verbindung prüfen“ nutzt für Tracking künftig `einstellungen` (prüft damit auch das neue Blatt).

## Schritt 2.2 Finanzen: Kontostände und Buchen (0.2.2 → 0.2.3)

- Sheet Finanzen, neues Blatt `Einstellungen`, Kopfzeile in Zeile 1: `liste, name, kategorie, betrag, zweck`
  | `liste` | `name` | `kategorie` | `betrag` | `zweck` |
  | --- | --- | --- | --- | --- |
  | `zweck` | Zweck für die Auswahl | Kategorie, die dazu gesetzt wird | fester Betrag (freiwillig) | – |
  | `kategorie` | Kategorie für die Auswahl | – | – | – |
  | `rueckzahlung` | Name, wie er bei den Haken steht | `Abos` oder `Wohnen` | – | Zweck, mit dem die Person zurückzahlt |
  | `eigenanteil` | – | `Abos` oder `Wohnen` | eigener fester Anteil | – |
- Skript `apps-script/finanzen/Code.gs`:
  - Funktion `einrichten`: legt `Einstellungen` nur mit Kopfzeile an. Vorhandenes Blatt bleibt.
    (Geändert beim Bauen: Die Spaltennamen in `Analyse Monate` weichen von den Kategorien beim Buchen ab, zum Beispiel
    Mehrzahl. Darum kommen die Kategorien aus der Tabelle zum Einfügen, genau wie in der alten App.)
  - Neue Aktion `einstellungen`: liefert Zwecke, Kategorien, Rückzahlungen, Eigenanteile.
  - `buchen` und `stats` bleiben, wie sie sind. Konten bleiben fest im Skript (Konto, Paypal, Kreditkarte, Portemonnaie, Münzglas, Pfandbons).
- Reiter Finanzen `js/views/finanzen.js`, Umschalter „Buchen / Auswertung“ (wie „Rangliste / Vergleich“ bei Döner):
  - Oben: Vermögen gesamt und die sechs Konten. Sofort die zuletzt bekannten Stände aus dem Gerät, dann frisch vom Skript.
  - Buchen wie bisher: Konto, Datum, Zweck (Auswahl mit Freitext; wählt Kategorie und Betrag mit), Kategorie (Auswahl mit Freitext),
    Betrag, Split. Knöpfe „Ausgabe“ und „Einnahme“; darunter „Umbuchung nach“ mit Zielkonto.
  - Sperre gegen Doppelbuchung während des Sendens. Erfolg nur nach Antwort; das Skript schickt die neuen Stände gleich mit.
    Danach leeren sich Zweck, Kategorie, Betrag, Split; Konto und Datum bleiben.
  - Die Combo-Auswahl wird ein kleiner Baustein `js/ui/auswahl.js`, damit Einkauf (Etappe 4) ihn wiederverwenden kann.
- Einrichtung „Verbindung prüfen“ nutzt für Finanzen künftig `einstellungen`.

## Schritt 2.3 Tracking-Übersicht und Rückmeldung (0.2.3 → 0.2.6)

Wünsche der Person (29.10.2026), eingeschoben vor die Finanz-Auswertung:
- Nach dem Speichern (Tracking und Finanzen) ein kurzes Fenster mit grünem Haken und „Gespeichert“, wie in der alten Finanz-App.
- Haken im Döner-Formular („Ausführlich bewerten“) in der Döner-Farbe.
- Tracking bekommt einen Umschalter „Eingabe / Übersicht“. Übersicht: Auswahl des Jahres, darunter eine Tabelle
  (Zeile = Tag, Spalte = Feld) mit farbigen Zellen ohne Zahlen. Kopf und Datum bleiben beim Scrollen stehen.
- Sheet Tracking, Blatt `Einstellungen`: neue Spalte `farben` (G). Regeln mit `;` getrennt, die erste passende zählt:
  `1=grün` (genau), `7-10=grün` (von bis), `<7=rot`, `>10=gelb`, `<=`, `>=`, `sonst=rot`, `skala 1-10` (rot → weiß → grün).
  Farben: grün, hellgrün, dunkelgrün, rot, dunkelrot, gelb, blau, rosa, grau. Ohne Regel bleibt die Zelle farblos.
- Skript: neue Aktion `tabelle` (`jahr`): alle Einträge des Jahres für die Felder aus `Einstellungen` und die Liste der Jahre. Liest nur.
- Nachbesserung 0.2.5 (Rückmeldung zu Finanzen): 💶 vor der Überschrift, Vermögen grün (positiv) oder rot (negativ),
  Knopf „Ausgabe“ rot und „Einnahme“ grün, nach dem Buchen nur noch das Fenster statt Text darunter,
  Klick irgendwo ins Datumsfeld öffnet den Kalender (Tracking und Finanzen).
- Nachbesserung 0.2.6 (Rückmeldung zu Tracking): 📊 vor der Überschrift. Übersicht zeigt alle Tage (im laufenden Jahr bis heute),
  Tage ohne Eintrag farblos, je Monat eine eigene Tabelle untereinander, Filter „Monat“ zeigt nur einen Monat.

## Schritt 2.4 Finanzen: Auswertung (0.2.6 → 0.2.7)

- Gebaut wie unten beschrieben. Abweichung: Die Jahrestabelle bleibt auch am Handy eine Tabelle (vier schmale Spalten passen),
  Tipp auf eine Zeile wählt den Monat. Haken für Rückzahlungen gibt es bei jeder Netto-Kategorie, für die im Blatt
  `Einstellungen` Zeilen `rueckzahlung` stehen.

- Skript: `analyse` liefert die Kategorien zusätzlich allgemein: alle Spalten aus `Analyse Monate` Zeile 7 mit Endung `-Out`, `-In`
  und Anfang `Netto-` als Liste `{name, wert}` je Monat. So braucht die App keine Kategorie-Namen im Code, und neue Kategorien
  im Sheet erscheinen von selbst. Die bisherigen Felder bleiben (die alte App kann weiter mit der alten Bereitstellung laufen).
- Ansicht „Auswertung“ wie bisher:
  - Auswahl Monat oder ganzes Jahr (nur Monate mit Buchungen und der aktuelle), Monats- bzw. Jahresbilanz.
  - Ausgaben und Einnahmen nach Kategorie, Ausgaben netto mit Budget-Linie, Budget-Balken (ab 80 % als Warnung).
  - Netto-Kacheln (Abos, Wohnen, … aus den `Netto-`-Spalten). Bei Abos und Wohnen die Haken, wer schon zurückgezahlt hat
    (aus dem Blatt `Einstellungen`), und der Rest.
  - Jahrestabelle (Monat, Ausgaben, Einnahmen, Bilanz; Tipp auf eine Zeile wählt den Monat), am Handy als Karten.
  - Bafög: erhalten, Darlehen, Rückzahlung.
  - Knopf „Neu laden“. Die Auswertung wird beim Öffnen geladen und nach einer Buchung neu geholt.
- Diagramme mit Chart.js 4.4.1 als lokale Datei `vendor/chart.umd.min.js` (Festlegung in STAND.md 4, Entscheidung der Person 29.10.2026):
  Ringe für Ausgaben und Einnahmen, Säulen der Ausgaben netto mit gestrichelter Budget-Linie, wie bisher.
  Farben der Kategorien: feste Reihe von Farbtönen, die hell und dunkel gut lesbar sind; Schrift und Gitter aus den Farb-Variablen in `css/base.css`.
  Chart.js kommt in `sw.js` (`HUELLE`) und wird nur im Reiter Finanzen geladen. Die Content-Security-Policy bleibt gleich.

## Schritt 2.5 Nachbesserungen und Umstieg (0.2.8 …)

- 0.2.8: Überschrift „Tracking Leben“, Tracking-Felder beim Start im Hintergrund holen (nur Arbeitsspeicher), Bafög-Kacheln so breit wie ihr Inhalt.

- Anmerkungen der Person aus dem Testen, gesammelt in einem oder mehreren Schritten.
- **Tor:** Die Person nutzt etwa zwei Wochen nur Thetadex und ist zufrieden. Dann (von Hand, der Agent ändert die alten Repos nicht):
  1. Im Apps-Script-Editor je Sheet: Bereitstellen → Bereitstellungen verwalten → alte Bereitstellung → Archivieren.
  2. Alte Apps vom Startbildschirm entfernen.
  3. Alte Repos löschen: GitHub → Repo → Settings → ganz unten „Delete this repository“ (die ZIP-Sicherung aus 0.0 bleibt).
- Danach Etappe 2 abschließen: Plan in STAND.md einarbeiten, diese Datei löschen.

## Datenschutz und Sicherheit (für die ganze Etappe)

- Tracking und Finanzen nur mit Passwort, wie bisher. Keine neuen Adressen nach außen; die Content-Security-Policy bleibt gleich.
- Im Repo stehen keine Feldnamen, Zwecke, Kategorien, Personen, Beträge. Alles Persönliche steht im Blatt `Einstellungen`.
- Im Gerät nur, was schon erlaubt ist (5). Die Einstellungen werden nicht im Gerät gespeichert (siehe oben).
- Alle Texte aus den Sheets zeigt die App nur mit `textContent`.
- Neue Aktionen `einstellungen` lesen nur. Schreiben bleibt bei `eintragen` und `buchen` mit `LockService` und Eingabeprüfung.
