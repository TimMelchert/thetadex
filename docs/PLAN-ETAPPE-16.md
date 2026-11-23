# Plan Etappe 16 „Projekte“ (1.8.x)

Stand: 23.11.2026, Schritt 16.1. Grundlage: Wünsche und Antworten der Person (23.11.2026). Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

## 1. Ziel

Ein neuer Reiter **„Projekte“**: eine schlichte Übersicht über größere Vorhaben (zum Beispiel ein Bastelprojekt, Smart Home, die App selbst, ein Haus).

- Ein Projekt hat **Titel**, **Notiz** (Zeilenumbrüche bleiben) und **Status**. Keine Aufgaben, keine ToDos, keine Fristen, kein Bild.
- **Abschnitte** (zweite Ebene): Ein Projekt kann Abschnitte haben (zum Beispiel beim Haus: Küche, Bad). Ein Abschnitt hat ebenfalls Titel, Notiz und Status. Keine dritte Ebene.
- Status (fest im Code, keine persönlichen Daten), je mit eigener Farbe:
  **Idee** violett (kräftiger als das Flieder der Packlisten) · **Läuft** sandgelb · **Pausiert** grau · **Fertig** grün.
- **Eine** Liste, nicht nach Status gruppiert. Vor jedem Projekt und Abschnitt ein bunter Kreis in der Farbe seines Status.
  Projekte mit Pfeilen ^ v sortierbar, Abschnitte innerhalb ihres Projekts ebenso. Neue stehen ganz oben.
- Keine Verbindung zu anderen Reitern.
- Grenzen: Titel 80 Zeichen, Notiz 1000 Zeichen, höchstens 500 Projekte und Abschnitte zusammen.

## 2. Aufbau in der App (Schritt 16.2)

- Name „Projekte“, Adresse `#/projekte`, Kennung `projekte`, Skript `gemeinsam` (erscheint nur mit dessen Adresse, wie Einkauf, Uni und Bucket List).
- **In der Leiste unten am Handy** (kein `nurBreit`), siehe Schritt 16.3.
- Farbe **Taupe `#A39382`** (`--farbe-projekte`), 🛠️ vor der Überschrift, eigenes Symbol `icons/reiter/projekte.svg` (Werkzeug).
  Ausnahme von den sieben Farben wie Visitenkarte, Herbarium, Bucket List und Packlisten: nur Kachel, Reiter und Marken, nicht im Icon.
- Statusfarben als Variablen `--status-idee`, `--status-laeuft`, `--status-pausiert`, `--status-fertig` in `css/base.css` (hell und dunkel).
  Der Kreis hat einen unsichtbaren Text für Bildschirmleser („Status: Läuft“); im Fenster und im Formular steht der Status als Wort, damit er auch ohne Farbsehen lesbar ist.
- Liste: je Projekt Kreis, Titel und rechts ^ v. Ein Tipp auf den Titel klappt auf: Notiz, Status als Wort, die Abschnitte (je Kreis, Titel, ^ v, Tipp zeigt ihre Notiz), „+ Abschnitt“ und „Bearbeiten“. Noch ein Tipp klappt zu.
- „+ Neues Projekt“, „+ Abschnitt“ und „Bearbeiten“ öffnen ein Formular: Titel, Status (Auswahl), Notiz, Löschen.
  Ein Projekt mit Abschnitten zu löschen fragt nach und löscht die Abschnitte mit (weich).
- **Partnerin oder Partner darf alles** (lesen, anlegen, ändern, sortieren, löschen), wie bei Einkauf (Entscheidung der Person, 23.11.2026).
- Verschieben wirkt sofort, gespeichert wird kurz nach dem letzten Tippen. Klappt es nicht, bleibt die Reihenfolge stehen und „Nochmal speichern“ erscheint.
- Nur mit Netz (1.5): Die Liste liegt nur im Arbeitsspeicher.

## 3. Sheet „Gemeinsam“, Blatt `projekte` (Schritt 16.1)

Spalten: `id, projekt, titel, notiz, status, reihenfolge, erstellt_am, geaendert_am, geloescht`. `einrichten` legt das Blatt an. Löschen ist weich.

- `projekt`: leer = Projekt, sonst die `id` des Projekts, zu dem der Abschnitt gehört (ein Blatt für beide Ebenen, weniger Code).
- `status`: `idee`, `laeuft`, `pausiert` oder `fertig` (das Skript prüft den Wert). `reihenfolge`: kleine Zahl = oben, Projekte für sich, Abschnitte je Projekt für sich.
- Aktionen (beide Rollen, `person` und `partner`): `projekte` (lesen), `projekt_speichern`, `projekt_loeschen`, `projekt_reihenfolge`.
  Die Rechte prüft das Skript (`ERLAUBT_`). `projekt_reihenfolge` ändert nur `reihenfolge`, nicht `geaendert_am`.

## 4. Datenschutz

- Neue Daten: nur Projekte und Abschnitte (Titel, Notiz, Status) im Sheet „Gemeinsam“, das mit niemandem geteilt wird. Über die Partnerin oder den Partner wird nichts gespeichert.
- Neues Recht: Die Partnerin oder der Partner darf Projekte ändern und löschen (wie Einkauf). In `docs/STAND.md` 2.2 nachtragen.
- Keine Projektnamen im Repo. Keine neuen Adressen nach außen.

## 5. Neue Reihenfolge der Reiter (Schritt 16.3, Wunsch der Person, 23.11.2026)

- **Kacheln auf der Startseite:** Tracking, Finanzen, Projekte, Einkauf, Uni, Besitz, Visitenkarte, danach der Rest (Pen & Paper, Döner, Herbarium, Bucket List, Packlisten).
- **Leiste unten am Handy:** Tracking, Finanzen, Projekte, **Start** (das Thetadex-Icon `icons/thetadex-icon.svg` in Farbe, in der Mitte, führt zur Startseite `#/`), Einkauf, Besitz, Uni.
  Pen & Paper, Döner und Visitenkarte sind am Handy nur Kacheln (`nurBreit`); die Visitenkarte bleibt also wie bisher (geändert am 23.11.2026, 14:41).
- Kein neues Symbol: Start zeigt das vorhandene Thetadex-Icon (Wunsch der Person, 23.11.2026, statt eines Hauses).
- Seitenleiste am PC: wie die Leiste unten (mit Start an derselben Stelle), danach der Rest (bestätigt).
- Umsetzung: Reihenfolge von `BEREICHE` in `js/config.js` = Leiste; dazu eine kurze Liste `START` für die Kacheln.

## 6. Partnerin oder Partner schreibt überall in „Gemeinsam“ (Schritt 16.4, Wunsch der Person, 23.11.2026)

- Bisher: Einkauf lesen und ändern, Uni und Bucket List nur lesen. Neu: auch **Uni** und **Bucket List** lesen und ändern (anlegen, ändern, sortieren, Bilder, löschen).
- Skript `gemeinsam`: die Schreib-Aktionen von Uni und Bucket List in `ERLAUBT_` für `partner` freigeben. Die Rechte prüft weiter das Skript.
- App: In Uni und Bucket List erscheinen Knöpfe, Haken und Pfeile auch für die Partnerin oder den Partner.
- `docs/STAND.md` 2.2 (Partner-Zugang) anpassen. Die anderen Skripte kennen `PARTNER_PIN` weiter nicht.

## 7. Schritte

- **16.1** Skript `gemeinsam`: Blatt `projekte`, Aktionen; dieser Plan (1.8.0).
- **16.2** Reiter Projekte in der App (1.8.1).
- **16.3** Neue Reihenfolge der Kacheln und der Leiste (1.8.2).
- **16.4** Partnerin oder Partner darf in Uni und Bucket List schreiben: Skript `gemeinsam` und App (1.8.3).
- **16.5** Abschluss: Prüfung, Plan in `docs/STAND.md` einarbeiten, diese Datei löschen.
