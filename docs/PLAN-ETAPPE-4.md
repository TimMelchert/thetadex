# Plan Etappe 4 „Einkauf und Essen“ (0.4.x)

Ziel: Ein Reiter Einkauf mit Lebensmittel-Liste, Einkaufsliste, Gerichten und (freiwillig) Vorrat.
Dazu ein neues Sheet „Gemeinsam“ mit eigenem Skript `gemeinsam`, das die Person und ihre Partnerin oder ihr Partner nutzen.
Regeln: STAND.md 1.2, 2.2, 2.3, 4 („Wer sieht was“, Ausnahme Einkaufsliste offline) und 7.2.
Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

Was gleich bleibt:
- Tracking, Finanzen, Döner und Besitz bleiben unverändert. Ihre Sheets und Skripte werden in dieser Etappe nicht angefasst.
- Das Passwort der Person (`APP_PIN`) gilt auch hier. Neu ist ein zweites Passwort `PARTNER_PIN`, das **nur** das Skript `gemeinsam` kennt.
- Im Repo stehen keine Lebensmittel, Gerichte oder Namen, auch nicht in Beispielen oder Pull-Request-Texten.

Was im Gerät liegt (Ausnahme aus STAND.md 4, schon entschieden): die Einkaufsliste und die noch nicht gesendeten Haken.
Lebensmittel und Gerichte hält die App nur im Arbeitsspeicher, solange die Seite offen ist.

## Aufbau des Reiters

- Überschrift „Einkauf“ mit einem bunten Emoji davor (Vorschlag 🛒, wie 📦 bei Besitz).
- Drei Unterreiter (Umschalter wie „Liste / Übersicht“ bei Besitz): **Einkaufsliste** (Vorgabe), **Lebensmittel**, **Gerichte**.
- Knöpfe in der Einkauf-Farbe `#D4B483` mit dunkler Schrift (`--schrift-auf-farbe`, wie bei Döner).
- Am Handy Karten, am PC dieselben Karten breiter (Listen sind kurz, eine Tabelle bringt hier nichts).

## Sheet „Gemeinsam“ (neu, Kopfzeile in Zeile 1)

Jedes Blatt hat zusätzlich `id, erstellt_am, geaendert_am, geloescht` (STAND.md 2.3). Löschen ist weich.

**Blatt `lebensmittel`** – alles, was man kaufen kann:
| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `name` | zum Beispiel „Haferdrink“ | ja | 60 Zeichen, kein zweites Mal gleich |
| `abteilung` | wo es im Laden liegt (Obst, Kühlregal …), ordnet die Einkaufsliste | nein | 40 Zeichen |
| `einheit` | Stück, Packung, g, ml … | nein | 20 Zeichen |
| `zuhause` | Vorrat: wie viel gerade da ist (leer = nicht gepflegt) | nein | 0 bis 9999, halbe erlaubt |
| `zuhause_ort` | Vorrat: Schrank, Kühlschrank … | nein | 40 Zeichen |
| `notiz` | frei | nein | 200 Zeichen |

**Blatt `einkaufsliste`** – was gekauft werden soll:
| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `lebensmittel_id` | welches Lebensmittel | ja | muss es geben |
| `anzahl` | wie viel | ja, Vorgabe 1 | 0,5 bis 9999 |
| `notiz` | zum Beispiel „die große“ oder „für Lasagne“ | nein | 100 Zeichen |
| `abgehakt_am` | leer = noch offen; sonst Zeitpunkt des Abhakens | – | setzt das Skript |

**Blatt `gerichte`**: `name` (Pflicht, 60 Zeichen), `notiz` (300 Zeichen, zum Beispiel kurze Anleitung), `link` (Rezept, nur `https://`, 300 Zeichen).

**Blatt `zutaten`**: `gericht_id`, `lebensmittel_id`, `menge` (wie `anzahl`). Eine Zeile je Zutat eines Gerichts.

Vereinfachung gegenüber STAND.md 2.3: **kein eigenes Blatt `vorrat`.** Der Vorrat sind die zwei Spalten `zuhause` und `zuhause_ort`
direkt beim Lebensmittel. Grund: Ein Lebensmittel hat höchstens einen Vorrat, so gibt es ein Blatt und eine Aktion weniger (1.2, Punkt 3).
Die Blätter für Uni (`semester`, `stundenplan`, `termine`, `module`) kommen erst in Etappe 5.

## Skript `apps-script/gemeinsam/Code.gs` (neu, gleicher Aufbau wie `leben`)

- Funktion `einrichten` legt alle vier Blätter mit Kopfzeile an und ergänzt fehlende Spalten am Ende. Vorhandenes bleibt.
- **Zwei Passwörter:** `pruefePin_` vergleicht mit `APP_PIN` und mit `PARTNER_PIN` und gibt die Rolle zurück (`person` oder `partner`).
  Gemeinsame Sperre nach 5 Fehlversuchen für 15 Minuten. Beide Passwörter mindestens 12 Zeichen; ein zu kurzes `PARTNER_PIN` wird nicht angenommen.
- In Etappe 4 dürfen beide Rollen alles im Reiter Einkauf. Das Skript prüft die Rolle trotzdem schon bei jeder Aktion (eine Liste „erlaubt je Rolle“),
  damit Uni in Etappe 5 für Partner*in nur lesbar wird, ohne den Aufbau zu ändern.
- Aktionen:
  | Aktion | Was sie tut |
  | --- | --- |
  | `ping` | prüft das Passwort, antwortet mit der Rolle |
  | `alles` | Lebensmittel, offene Einkaufsliste, Gerichte mit Zutaten in einer Antwort (eine Anfrage beim Öffnen) |
  | `lebensmittel_speichern`, `lebensmittel_loeschen` | neu oder ändern (mit Schutz vor Überschreiben über `geaendert_am`, wie bei Besitz) |
  | `auf_liste` | setzt ein oder mehrere Lebensmittel auf die Liste. Steht eines schon offen darauf, wird die Anzahl erhöht statt doppelt eingetragen |
  | `liste_aendern` | Anzahl oder Notiz eines Eintrags ändern, Eintrag entfernen |
  | `abhaken` | eine Liste von Einträgen auf einmal abhaken. Schon abgehakte bleiben unverändert (doppelt senden schadet nicht) |
  | `gericht_speichern`, `gericht_loeschen` | Gericht mit allen Zutaten auf einmal |
  | `vorrat` | `zuhause` und `zuhause_ort` eines Lebensmittels setzen |
- Jede Eingabe wird geprüft (Art, Länge, erlaubte Werte, vorhandene ids) und mit `bereinigeText_` geschützt. Schreiben mit `LockService`.
- Das ganze Skript kommt in Schritt 4.1 auf einmal, damit die Person `Code.gs` möglichst nur einmal einfügen muss.

## Schritt 4.0 Plan (0.3.9 → 0.4.0)

- Dieser Plan. Sheet und Skript bleiben unverändert.

## Schritt 4.1 Sheet „Gemeinsam“, Skript `gemeinsam`, Lebensmittel und Einkaufsliste (0.4.0 → 0.4.1)

- Skript wie oben. `js/config.js`: `SKRIPTE` bekommt `gemeinsam` (Titel „Einkauf und Uni“, Test `ping`).
- Neue Ansicht `js/views/einkauf.js` statt Platzhalter.
- **Lebensmittel:** Suchleiste oben, sucht schon beim Tippen (ohne Groß- und Kleinschreibung, ä = ae).
  Tipp auf ein Lebensmittel → kleines Fenster mit Anzahl (− 1 +, Vorgabe 1) und Notiz → „Auf die Liste“.
  Findet die Suche nichts: Knopf „„…“ neu anlegen“ übernimmt den Suchtext als Name (Abteilung und Einheit freiwillig, Auswahl mit Freitext wie Ort bei Besitz).
  Ändern und Löschen über einen Stift am Lebensmittel. Steht es schon auf der Liste, steht das dabei („auf der Liste: 2“).
- **Einkaufsliste:** nach Abteilung gruppiert (Abteilungen in der Reihenfolge A–Z, ohne Abteilung zuletzt), je Eintrag Name, Anzahl mit Einheit, Notiz.
  Großer Haken zum Abhaken (44 px). Abgehakte Einträge verschwinden. Tipp auf den Namen: Anzahl oder Notiz ändern, entfernen.
  In diesem Schritt geht Abhaken nur mit Netz (wie alles andere).
- Neu laden: beim Öffnen, mit Knopf „Neu laden“ und von selbst, wenn man in die App zurückkehrt (siehe Rückfrage 2).

## Schritt 4.2 Einkaufsliste ohne Netz (0.4.1 → 0.4.2)

- Die offene Einkaufsliste liegt zusätzlich im Gerät (`thetadex_einkaufsliste`). Ohne Netz zeigt die App diese Fassung mit dem Hinweis „Stand von <Uhrzeit>“.
- Abhaken geht immer. Der Haken landet zuerst im Gerät (`thetadex_einkauf_offen`), der Eintrag verschwindet sofort.
  Oben steht „3 Haken noch nicht gesendet“, bis das Skript sie bestätigt hat. Gesendet wird sofort, wenn Netz da ist, sonst beim nächsten Öffnen,
  beim Zurückkehren in die App und wenn der Browser „wieder online“ meldet.
- Alles andere (Lebensmittel anlegen, auf die Liste setzen, Gerichte) braucht weiter Netz und sagt das klar.
- „Abmelden“ löscht beides mit.

## Schritt 4.3 Gerichte (0.4.2 → 0.4.3)

- Unterreiter Gerichte: Liste aller Gerichte mit Suche. „+ Gericht“ öffnet das Formular: Name, Notiz, Link, Zutaten.
  Eine Zutat fügt man mit derselben Suche wie bei Lebensmitteln hinzu (neue Lebensmittel lassen sich dort gleich anlegen), dazu die Menge.
- Tipp auf ein Gericht → Ansicht mit allen Zutaten, jede **angehakt** vorgeschlagen, Menge änderbar.
  „Auf die Liste“ setzt alle angehakten Zutaten auf die Einkaufsliste (Notiz „für <Gericht>“). Ein Gericht kann man auch mehrmals hinzufügen.
- Ändern und Löschen eines Gerichts löscht nie die Lebensmittel.

## Schritt 4.4 Vorrat (0.4.3 → 0.4.4)

- Freiwillig. Am Lebensmittel zwei Felder „Zuhause“ (Menge) und „Wo“ (Auswahl mit Freitext). Leer = wird nicht gepflegt.
- Wo der Vorrat gepflegt ist, steht er klein dabei: auf der Einkaufsliste, in der Lebensmittel-Liste und bei den Zutaten eines Gerichts („zuhause: 2, Kühlschrank“).
  Fehlt er, fehlt einfach der Hinweis.
- Bei einem Gericht ist eine Zutat, die zuhause in genug Menge da ist, schon **nicht** angehakt vorgeschlagen (siehe Rückfrage 3).
- Filter in Lebensmittel: „Nur was zuhause ist“, sortiert nach Ort. So dient die Liste auch als Vorrat-Übersicht.

## Schritt 4.5 Gemeinsam nutzen (0.4.4 → 0.4.5)

- **Welche Reiter jemand sieht, folgt aus den eingetragenen Script-Adressen:** Tracking nur mit Adresse `tracking`, Finanzen mit `finanzen`,
  Besitz mit `leben`, Einkauf (und später Uni) mit `gemeinsam`. Döner ist immer da. So sieht die Partnerin oder der Partner nur Einkauf und Döner,
  ohne dass die App eine Rolle speichern muss. Die Rechte prüft trotzdem immer das Skript (STAND.md 2.2).
  Folge für die Person: Der Platzhalter DSA verschwindet, bis es das Skript `dsa` gibt (Etappe 6). Uni erscheint mit der Adresse `gemeinsam`.
- Einstellungen: „Verbindung prüfen“ zeigt bei `gemeinsam` die Rolle („als Partner*in angemeldet“).
- Anleitung für die Person im Pull Request: Partnerin oder Partner öffnet die App-Adresse, „Zum Startbildschirm hinzufügen“,
  Einstellungen → Passwort = `PARTNER_PIN`, nur die Adresse `gemeinsam` eintragen. Weitergeben am besten persönlich, nicht im Chat.
- Passwort ändern: neues `PARTNER_PIN` in den Skripteigenschaften eintragen. Das alte gilt sofort nicht mehr (ohne neue Bereitstellung).

## Schritt 4.6 Abschluss (0.4.5 …)

- Anmerkungen der Person nach dem Testen, dann Etappe 4 abschließen: Plan in STAND.md einarbeiten, diese Datei löschen.

## Datenschutz und Sicherheit (für die ganze Etappe)

- Neue Daten: Lebensmittel, Einkaufsliste, Gerichte mit Zutaten, Vorrat. Keine Gesundheitsdaten, keine Preise, keine Läden.
  **Über die Partnerin oder den Partner wird nichts gespeichert,** auch nicht, wer etwas eingetragen oder abgehakt hat.
- Wer sieht sie: die Person (`APP_PIN`) und Partner*in (`PARTNER_PIN`), beide nur mit Passwort. Eigenes Sheet, eigenes Skript.
  `PARTNER_PIN` öffnet nur das Skript `gemeinsam`. Tracking, Finanzen, Besitz und DSA kennen es nicht (STAND.md 2.2).
  Ein verlorenes Partner-Handy verrät also höchstens Einkauf und Uni; dann `PARTNER_PIN` ändern.
- Das Sheet „Gemeinsam“ wird mit niemandem geteilt (wer es bearbeiten darf, sieht beide Passwörter in den Skripteigenschaften).
- Im Gerät: Einkaufsliste und offene Haken (schon erlaubte Ausnahme). Abmelden löscht sie.
- Keine neuen Adressen nach außen, die Content-Security-Policy bleibt gleich. Rezept-Links öffnen nur mit `https://` (`sichereUrl`).
- Alle Texte aus dem Sheet zeigt die App nur mit `textContent`. Böse Eingaben: Längen und Werte prüft das Skript, Formeln verhindert `bereinigeText_`.

## Von Hand (Person, in Schritt 4.1, steht dann genau im Pull Request)

1. Google Drive → Neu → Google Tabellen, Name „Gemeinsam“. **Mit niemandem teilen**, auch nicht mit der Partnerin oder dem Partner.
2. Erweiterungen → Apps Script, `apps-script/gemeinsam/Code.gs` aus dem Repo hineinkopieren.
3. Projekteinstellungen → Skripteigenschaften: `APP_PIN` (dasselbe Passwort wie überall) und `PARTNER_PIN` (neu, mindestens 12 Zeichen, anders als `APP_PIN`).
4. Funktion `einrichten` einmal ausführen.
5. Bereitstellen → Neue Bereitstellung → Web-App (Ausführen als: ich, Zugriff: Jeder). Adresse in Thetadex unter Einstellungen bei „Einkauf und Uni“ eintragen.
