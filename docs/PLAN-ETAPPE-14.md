# Plan Etappe 14 „Bucket List“ (1.6.x)

Stand: 23.11.2026, Schritt 14.2. Grundlage: Wünsche und Antworten der Person (23.11.2026). Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

## 1. Ziel

Ein neuer Reiter **„Bucket List“**: eine gemeinsame Liste von Zielen. Die Person pflegt sie, die Partnerin oder der Partner liest mit.

- Ein Ziel hat **Titel**, **Notiz** (Zeilenumbrüche bleiben), einen **Haken** und mit dem Haken das Datum **„erreicht am“**. Dazu **ein Bild**, das in der Detailansicht erscheint.
- **Eine** Liste. Oben die offenen Ziele, unten der Bereich **„Erreicht“**. Erreichte bleiben dort lesbar.
- Beide Bereiche sind mit kleinen Pfeilen ^ und v sortierbar, wie die Abteilungen der Einkaufsliste. Neue Ziele stehen zuerst ganz oben;
  ein gerade erreichtes Ziel steht unter „Erreicht“ ganz oben.
- Haken wieder abnehmen: Das Ziel kommt zurück nach oben zu den offenen, das Datum ist weg.
- „Erreicht am“ lässt sich beim Bearbeiten von Hand ändern (zum Beispiel für Ziele, die schon früher erreicht wurden).
- Grenzen: Titel 80 Zeichen, Notiz 1000 Zeichen, höchstens 500 Ziele.

## 2. Aufbau in der App (Schritt 14.2)

- Name „Bucket List“, Adresse `#/bucketlist`, Kennung `bucketlist`, Skript `gemeinsam` (erscheint nur mit dessen Adresse, wie Einkauf und Uni).
- Kachel auf der Startseite und am PC in der Seitenleiste, am Handy nicht in der Leiste unten (`nurBreit`, wie Herbarium und Visitenkarte).
- Farbe **Rosé `#D98C9A`** (`--farbe-bucketlist`, Kontrast 6,7:1 zur dunklen Schrift), 🎯 vor der Überschrift, eigenes Symbol `icons/reiter/bucketlist.svg`.
  Wie Visitenkarte und Herbarium eine Ausnahme von den sieben Farben: nur Kachel, Reiter und Marken, nicht im Icon.
- Liste: je Ziel der Haken, der Titel und rechts ^ v. Unter „Erreicht“ zusätzlich das Datum. Ein Tipp auf den Titel klappt die **Detailansicht** auf
  (Bild, Notiz, „erreicht am“, „Bearbeiten“), noch ein Tipp klappt sie zu (wie bei Rezepten).
- „+ Neues Ziel“ und „Bearbeiten“ öffnen ein Formular: Titel, Notiz, Bild (hochladen oder Drive-Link, ×), „Erreicht am“ (Datum, leer = offen), Löschen.
- Partnerin oder Partner: dieselbe Liste und Detailansicht, ohne Haken zum Tippen, ohne Pfeile, ohne Knöpfe.
- Verschieben wirkt sofort, gespeichert wird kurz nach dem letzten Tippen. Klappt es nicht, bleibt die Reihenfolge stehen und „Nochmal speichern“ erscheint.
- Nur mit Netz (1.5): Die Liste und die Bilder liegen nur im Arbeitsspeicher.

## 3. Sheet „Gemeinsam“, Blatt `bucketlist` (Schritt 14.1)

Spalten: `id, titel, notiz, erledigt_am, reihenfolge, bild, erstellt_am, geaendert_am, geloescht`. `einrichten` legt das Blatt an. Löschen ist weich.

- `erledigt_am`: leer = offen, sonst `JJJJ-MM-TT`. `reihenfolge`: kleine Zahl = oben, offene und erreichte je für sich. `bild`: eine Drive-Kennung oder leer.
- Hochgeladene Bilder liegen im neuen privaten Drive-Ordner **„Thetadex Bucket List“** der Person (Skripteigenschaft `BUCKET_ORDNER`, legt `einrichten` an).
- Aktionen: `bucket` (lesen, beide Rollen), nur `person`: `bucket_speichern`, `bucket_haken`, `bucket_bild`, `bucket_loeschen`, `bucket_reihenfolge`.
  Die Rechte prüft das Skript (`ERLAUBT_`). `bild` liest auch Bilder der Bucket List, aber nur solche, die bei einem nicht gelöschten Ziel stehen.
- `bucket_reihenfolge` ändert nur die Spalte `reihenfolge`, nicht `geaendert_am`.

## 4. Datenschutz

- Neue Daten: nur Ziele (Titel, Notiz, Datum, Bild), im Sheet „Gemeinsam“, das mit niemandem geteilt wird. Über die Partnerin oder den Partner wird nichts gespeichert.
- Keine Ziele, Namen oder Bilder im Repo. Keine neuen Adressen nach außen.

## 5. Schritte

- **14.1** Skript `gemeinsam`: Blatt `bucketlist`, Aktionen, Bild-Ordner; dieser Plan (1.6.0).
- **14.2** Reiter in der App (1.6.1).
- **14.3** Abschluss: Prüfung, Plan in `docs/STAND.md` einarbeiten, diese Datei löschen.
