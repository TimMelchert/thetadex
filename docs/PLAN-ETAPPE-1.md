# Plan Etappe 1 „Döner Landau“ (0.1.x)

Ziel: ein öffentlicher Reiter, in dem jede Person mit dem Link Döner-Läden in Landau bewerten und alle Bewertungen sehen kann.
Dazu bekommt jeder Reiter ein Symbol. Regeln: STAND.md Abschnitt 4 „Döner öffentlich“ und 7.2.
Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

## Schritt 1.1 Symbole und öffentliche Reiter (0.1.3 → 0.1.4)

- Jeder Reiter hat ein Symbol als eigene SVG-Datei in `icons/reiter/<id>.svg` (einfache Linien, 24 × 24).
  Die Farbe kommt über CSS (`mask-image`), darum passt das Symbol zu Hell- und Dunkelmodus.
  Tracking (Kalender mit Lupe) und Finanzen (Geldschein) nach den Bildern der alten Apps; DSA W20-Würfel, Einkauf Korb,
  Besitz Kiste, Uni Doktorhut, Döner Drehspieß.
- Am Handy zeigt die Reiterleiste nur die Symbole. Der Name bleibt für Bildschirmleser lesbar. Am PC Symbol und Name.
- `js/config.js`: Bereiche haben `oeffentlich: true|false`. Ohne Einrichtung zeigt die Leiste nur öffentliche Reiter (Döner),
  und private Adressen führen zur Startseite.

## Schritt 1.2 Döner-Skript und Reiter (0.1.4 → 0.1.5)

- Neues Sheet „Döner“ (die Person legt es an). Skript `apps-script/doener/Code.gs`, an das Sheet gebunden.
  - Funktion `einrichten` (einmal im Editor ausführen): legt die Blätter `bewertungen` und `laeden` mit Kopfzeile an.
  - `bewertungen`: `id, erstellt_am, laden, doener, yufka, pommes, begruendung, geloescht`.
  - `laeden`: `name`. Neue Läden aus dem Freitext kommen automatisch dazu (Groß- und Kleinschreibung zählt als gleich).
  - Aktionen ohne Passwort: `liste` (Läden und Bewertungen, ohne `id` und ohne gelöschte), `bewerten` (neue Bewertung).
    `bewerten` prüft: Laden 1 bis 60 Zeichen, Sterne ganze Zahl 1 bis 10 oder leer, mindestens ein Stern, Begründung bis 300 Zeichen,
    Lockfeld `web` muss leer sein, höchstens 30 Bewertungen pro Stunde (`CacheService`), `LockService`, `bereinigeText_`.
  - Löschen: Die Person löscht die Zeile im Sheet oder setzt `geloescht` auf WAHR.
- Reiter `#/doener` und öffentlicher Link `#/doener/<kennung>` (Kennung = Teil der Script-Adresse zwischen `/s/` und `/exec`).
  Ein Besucher speichert die Kennung im Gerät (`thetadex_oeffentlich`), damit der Reiter beim nächsten Mal wieder geht.
  Für die Person kommt „Döner“ in die Einrichtung (Script-Adresse) und ein Knopf „Link zum Teilen kopieren“ in den Reiter.
- Anzeige: Balken je Laden mit „Insgesamt“ (0 bis 10) und Zahl der Bewertungen, sortiert nach Insgesamt.
  Antippen öffnet die Einzelheiten: Döner, Yufka, Pommes je mit Durchschnitt, darunter alle Bewertungen mit Datum und Begründung.
- Formular „Bewerten“: Laden (Liste mit Suche, Freitext erlaubt), drei Sterne-Felder 1 bis 10 (freiwillig), Begründung, Senden.
  Erfolg nur, wenn das Skript ihn bestätigt. Bei Fehler bleibt die Eingabe stehen.
- Startwerte: Die Person trägt die bisherigen Durchschnitte als je eine Zeile pro Laden in `bewertungen` ein.

## Schritt 1.3 Ausführlich nach Kriterien (0.1.5 → 0.1.6)

- Neue Blätter `kriterien` (`teil, name`) und `details` (`bewertung_id, teil, kriterium, wert, begruendung`), neue Spalte `ladennote`.
  `einrichten` legt sie an, auch in einem schon eingerichteten Sheet (fehlende Spalten kommen ans Ende).
- Formular: Schalter „Ausführlich bewerten“. Dann je Teil (Döner, Yufka, Pommes, Laden) aufklappbar alle Kriterien,
  Werte 1 bis 10 in halben Schritten, je eine Begründung. Der Teil-Wert ist der Durchschnitt der Kriterien.
- Anzeige: Laden-Note in den Einzelheiten, „Alle Kriterien“ je Bewertung aufklappbar.
- Das Skript prüft Teil und Kriterium gegen das Blatt `kriterien`, höchstens 60 Kriterien je Bewertung, Begründung je Kriterium bis 200 Zeichen.

## Prüfen am Ende der Etappe

- Bewerten am Handy ohne Einrichtung (privates Fenster mit dem Link) und mit Einrichtung.
- Böse Eingaben: Formel am Anfang (`=1+1`), sehr langer Text, Sterne 11 oder 0, leere Sterne: alles wird abgelehnt oder entschärft.
- Ohne Einrichtung sind keine privaten Reiter zu sehen.
