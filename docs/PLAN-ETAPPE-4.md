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
- Die Einkaufsliste hat zwei Ansichten: **nach Abteilung** (zum Einkaufen, Vorgabe) und **nach Gericht** (welche Zutaten für welches Gericht).
- Knöpfe in der Einkauf-Farbe `#D4B483` mit dunkler Schrift (`--schrift-auf-farbe`, wie bei Döner).
- Am Handy Karten, am PC dieselben Karten breiter (Listen sind kurz, eine Tabelle bringt hier nichts).

## Sheet „Gemeinsam“ (neu, Kopfzeile in Zeile 1)

Fünf Blätter: `lebensmittel`, `einkaufsliste`, `gerichte`, `zutaten`, `vorrat`. Jedes Blatt hat zusätzlich `id, erstellt_am, geaendert_am, geloescht` (STAND.md 2.3). Löschen ist weich.

**Blatt `lebensmittel`** – alles, was man kaufen kann:
| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `name` | zum Beispiel „Haferdrink“ | ja | 60 Zeichen, kein zweites Mal gleich |
| `abteilung` | wo es im Laden liegt (Obst, Kühlregal …), ordnet die Einkaufsliste | nein | 40 Zeichen |
| `einheit` | Stück, Packung, g, ml … | nein | 20 Zeichen |
| `notiz` | frei | nein | 200 Zeichen |

**Blatt `einkaufsliste`** – was gekauft werden soll:
| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `lebensmittel_id` | welches Lebensmittel | ja | muss es geben |
| `anzahl` | wie viel | ja, Vorgabe 1 | 0,5 bis 9999 |
| `gericht_id` | für welches Gericht; leer = einzeln auf die Liste gesetzt | nein | muss es geben |
| `notiz` | zum Beispiel „die große“ | nein | 100 Zeichen |
| `abgehakt_am` | leer = noch offen; sonst Zeitpunkt des Abhakens | – | setzt das Skript |

**Blatt `gerichte`**: `name` (Pflicht, 60 Zeichen), `notiz` (300 Zeichen, zum Beispiel kurze Anleitung), `link` (Rezept, nur `https://`, 300 Zeichen).

**Blatt `zutaten`**: `gericht_id`, `lebensmittel_id`, `menge` (wie `anzahl`). Eine Zeile je Zutat eines Gerichts.

**Blatt `vorrat`** (eigenes Blatt, Entscheidung der Person 30.10.2026: zuhause gibt es mehrere Orte mit Lebensmitteln):
`lebensmittel_id`, `ort` (Schrank, Kühlschrank, Keller …, 40 Zeichen, Pflicht), `menge` (0 bis 9999, halbe erlaubt).
Eine Zeile je Lebensmittel und Ort. Ein Lebensmittel ohne Zeile im Vorrat gilt als „nicht gepflegt“.
Die Blätter für Uni (`semester`, `stundenplan`, `termine`, `module`) kommen erst in Etappe 5.

## Skript `apps-script/gemeinsam/Code.gs` (neu, gleicher Aufbau wie `leben`)

- Funktion `einrichten` legt alle fünf Blätter mit Kopfzeile an und ergänzt fehlende Spalten am Ende. Vorhandenes bleibt.
- **Zwei Passwörter:** `pruefePin_` vergleicht mit `APP_PIN` und mit `PARTNER_PIN` und gibt die Rolle zurück (`person` oder `partner`).
  Gemeinsame Sperre nach 5 Fehlversuchen für 15 Minuten. Beide Passwörter mindestens 12 Zeichen; ein zu kurzes `PARTNER_PIN` wird nicht angenommen.
- In Etappe 4 dürfen beide Rollen alles im Reiter Einkauf. Das Skript prüft die Rolle trotzdem schon bei jeder Aktion (eine Liste „erlaubt je Rolle“),
  damit Uni in Etappe 5 für Partner*in nur lesbar wird, ohne den Aufbau zu ändern.
- Aktionen:
  | Aktion | Was sie tut |
  | --- | --- |
  | `ping` | prüft das Passwort, antwortet mit der Rolle |
  | `alles` | Lebensmittel, offene Einkaufsliste, Gerichte mit Zutaten und Vorrat in einer Antwort (eine Anfrage beim Öffnen) |
  | `lebensmittel_speichern`, `lebensmittel_loeschen` | neu oder ändern (mit Schutz vor Überschreiben über `geaendert_am`, wie bei Besitz) |
  | `auf_liste` | setzt ein oder mehrere Lebensmittel auf die Liste, einzeln oder für ein Gericht. Steht dasselbe Lebensmittel für dasselbe Gericht (oder einzeln) schon offen darauf, wird die Anzahl erhöht statt doppelt eingetragen |
  | `liste_aendern` | Anzahl oder Notiz eines Eintrags ändern, Eintrag entfernen |
  | `abhaken` | eine Liste von Einträgen auf einmal abhaken. Schon abgehakte bleiben unverändert (doppelt senden schadet nicht). Ist der Vorrat des Lebensmittels gepflegt, steigt er um die Anzahl (siehe 4.4) |
  | `gericht_speichern`, `gericht_loeschen` | Gericht mit allen Zutaten auf einmal |
  | `vorrat_speichern`, `vorrat_loeschen` | Menge an einem Ort setzen oder den Ort beim Lebensmittel entfernen |
- Jede Eingabe wird geprüft (Art, Länge, erlaubte Werte, vorhandene ids) und mit `bereinigeText_` geschützt. Schreiben mit `LockService`.
- Das ganze Skript kommt in Schritt 4.1 auf einmal, damit die Person `Code.gs` möglichst nur einmal einfügen muss.

## Schritt 4.0 Plan (0.3.9 → 0.4.2)

- Dieser Plan. Sheet und Skript bleiben unverändert.
- 0.4.1: Antworten der Person eingearbeitet (30.10.2026): Vorrat als eigenes Blatt mit mehreren Orten; kein „Ziehen nach unten“;
  Abhaken erhöht den Vorrat, Zutaten mit genug Vorrat sind nicht angehakt; Abteilungen erst einmal A–Z; Reiter nach Script-Adressen;
  kein Knopf „Zufälliges Gericht“; zusätzliche Ansicht der Einkaufsliste nach Gericht.
- 0.4.2: Wunsch der Person für Besitz, im selben Pull Request (30.10.2026): ausgeliehene Anzahl (neue Spalte `ausgeliehen_anzahl` im Sheet „Leben“),
  Balken in der Besitz-Übersicht entfernt. Das ist die einzige Änderung an Sheet und Skript in Schritt 4.0.

## Schritt 4.1 Sheet „Gemeinsam“, Skript `gemeinsam`, Lebensmittel und Einkaufsliste (0.4.2 → 0.4.3) – erledigt

- Skript wie oben. `js/config.js`: `SKRIPTE` bekommt `gemeinsam` (Titel „Einkauf und Uni“, Test `ping`).
- Neue Ansicht `js/views/einkauf.js` statt Platzhalter.
- **Lebensmittel:** Suchleiste oben, sucht schon beim Tippen (ohne Groß- und Kleinschreibung; „apf“ und „aepf“ finden beide „Äpfel“).
  Tipp auf ein Lebensmittel → kleines Fenster mit Anzahl (− 1 +, Vorgabe 1) und Notiz → „Auf die Liste“.
  So kommt jedes Lebensmittel auch **einzeln** auf die Liste, ohne Gericht.
  Findet die Suche nichts: Knopf „„…“ neu anlegen“ übernimmt den Suchtext als Name (Abteilung und Einheit freiwillig, Auswahl mit Freitext wie Ort bei Besitz).
  Abteilungen gibt es nicht als feste Liste: Die Auswahl bildet die App aus den Abteilungen, die schon eingetragen sind; eine neue entsteht durch Eintippen.
  Ändern und Löschen über einen Stift am Lebensmittel. Steht es schon auf der Liste, steht das dabei („auf der Liste: 2“).
- **Einkaufsliste nach Abteilung:** nach Abteilung gruppiert (A–Z, ohne Abteilung zuletzt), je Lebensmittel eine Zeile mit Name,
  Anzahl mit Einheit (zusammengezählt, wenn es für mehrere Gerichte gebraucht wird) und Notiz. Darunter klein „für Lasagne, Curry“.
  Großer Haken zum Abhaken (44 px); er hakt das Lebensmittel für alle Gerichte ab. Abgehakte Einträge verschwinden.
  Tipp auf den Namen: Anzahl oder Notiz ändern, entfernen.
- Eine feste Laden-Reihenfolge der Abteilungen kann später dazukommen (dann eine kleine Liste im Sheet).
  In diesem Schritt geht Abhaken nur mit Netz (wie alles andere).
- Neu laden: beim Öffnen, mit Knopf „Neu laden“ und von selbst, wenn man in die App zurückkehrt (kein „Ziehen nach unten“, Entscheidung der Person 30.10.2026).
- Gebaut: Das Skript kann schon alles für die ganze Etappe (Gerichte, Vorrat, Abhaken mit Vorrat). Die App nutzt Gerichte ab 4.3 und Vorrat ab 4.4.
  Ein Lebensmittel löschen nimmt es auch von der offenen Einkaufsliste, aus Gerichten und aus dem Vorrat (weich, im Sheet zurückholbar).

## Schritt 4.2 Einkaufsliste ohne Netz (0.4.3 → 0.4.4) – erledigt

- Die offene Einkaufsliste liegt zusätzlich im Gerät (`thetadex_einkaufsliste`). Ohne Netz zeigt die App diese Fassung mit dem Hinweis „Stand von <Uhrzeit>“.
- Abhaken geht immer. Der Haken landet zuerst im Gerät (`thetadex_einkauf_offen`), der Eintrag verschwindet sofort.
  Oben steht „3 Haken noch nicht gesendet“, bis das Skript sie bestätigt hat. Gesendet wird sofort, wenn Netz da ist, sonst beim nächsten Öffnen,
  beim Zurückkehren in die App und wenn der Browser „wieder online“ meldet.
- Alles andere (Lebensmittel anlegen, auf die Liste setzen, Gerichte) braucht weiter Netz und sagt das klar.
- „Abmelden“ löscht beides mit.

## Schritt 4.3 Gerichte (0.4.4 → 0.4.5)

- Unterreiter Gerichte: Liste aller Gerichte mit Suche. „+ Gericht“ öffnet das Formular: Name, Notiz, Link, Zutaten.
  Eine Zutat fügt man mit derselben Suche wie bei Lebensmitteln hinzu (neue Lebensmittel lassen sich dort gleich anlegen), dazu die Menge.
- Tipp auf ein Gericht → Ansicht mit allen Zutaten, jede **angehakt** vorgeschlagen, Menge änderbar.
  „Auf die Liste“ setzt alle angehakten Zutaten für dieses Gericht auf die Einkaufsliste. Ein Gericht kann man auch mehrmals hinzufügen (die Mengen wachsen).
- **Einkaufsliste nach Gericht** (Wunsch der Person, 30.10.2026): zweite Ansicht der Einkaufsliste. Je Gericht eine Gruppe mit seinen Zutaten,
  dazu eine Gruppe „Einzeln“ für alles ohne Gericht. Abhaken hier hakt nur die Zutat dieses Gerichts ab.
  Ein Knopf je Gericht „Gericht von der Liste nehmen“ entfernt alle seine noch offenen Zutaten.
- Ändern und Löschen eines Gerichts löscht nie die Lebensmittel.

## Schritt 4.4 Vorrat (0.4.5 → 0.4.6)

- Freiwillig. Am Lebensmittel ein Bereich „Zuhause“: je Ort eine Zeile mit Menge (− +) und Ort (Auswahl mit Freitext), „+ Ort“ fügt einen weiteren hinzu.
  Kein Ort = wird nicht gepflegt.
- Wo der Vorrat gepflegt ist, steht er klein dabei: auf der Einkaufsliste, in der Lebensmittel-Liste und bei den Zutaten eines Gerichts
  („zuhause: 2 Kühlschrank, 1 Keller“). Fehlt er, fehlt einfach der Hinweis.
- **Abhaken erhöht den Vorrat** (Entscheidung der Person, 30.10.2026): Ist der Vorrat gepflegt, rechnet das Skript beim Abhaken die Anzahl dazu,
  und zwar an dem Ort, an dem schon am meisten liegt. Ist er nicht gepflegt, passiert nichts. Das gilt auch für Haken, die ohne Netz gesetzt und später gesendet werden.
- **Zutaten mit genug Vorrat** (Entscheidung der Person, 30.10.2026): Bei einem Gericht ist eine Zutat, von der zuhause mindestens die Menge da ist, schon **nicht** angehakt.
- Unterreiter Lebensmittel bekommt den Haken „Nur was zuhause ist“, dann nach Ort gruppiert. So dient die Liste auch als Vorrat-Übersicht.

## Schritt 4.5 Gemeinsam nutzen (0.4.6 → 0.4.7)

- **Welche Reiter jemand sieht, folgt aus den eingetragenen Script-Adressen:** Tracking nur mit Adresse `tracking`, Finanzen mit `finanzen`,
  Besitz mit `leben`, Einkauf (und später Uni) mit `gemeinsam`. Döner ist immer da. So sieht die Partnerin oder der Partner nur Einkauf und Döner,
  ohne dass die App eine Rolle speichern muss. Die Rechte prüft trotzdem immer das Skript (STAND.md 2.2).
  Folge für die Person: Der Platzhalter DSA verschwindet, bis es das Skript `dsa` gibt (Etappe 6, Entscheidung der Person 30.10.2026). Uni erscheint mit der Adresse `gemeinsam`.
- Einstellungen: „Verbindung prüfen“ zeigt bei `gemeinsam` die Rolle („als Partner*in angemeldet“).
- Anleitung für die Person im Pull Request: Partnerin oder Partner öffnet die App-Adresse, „Zum Startbildschirm hinzufügen“,
  Einstellungen → Passwort = `PARTNER_PIN`, nur die Adresse `gemeinsam` eintragen. Weitergeben am besten persönlich, nicht im Chat.
- Passwort ändern: neues `PARTNER_PIN` in den Skripteigenschaften eintragen. Das alte gilt sofort nicht mehr (ohne neue Bereitstellung).

## Schritt 4.6 Abschluss (0.4.7 …)

- Anmerkungen der Person nach dem Testen, dann Etappe 4 abschließen: Plan in STAND.md einarbeiten, diese Datei löschen.

## Datenschutz und Sicherheit (für die ganze Etappe)

- Neue Daten: Lebensmittel, Einkaufsliste, Gerichte mit Zutaten, Vorrat mit Orten. Keine Gesundheitsdaten, keine Preise, keine Läden.
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
