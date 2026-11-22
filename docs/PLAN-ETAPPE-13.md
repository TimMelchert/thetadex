# Plan Etappe 13 „Herbarium“ (1.5.x)

Stand: 22.11.2026, Schritt 13.0 (1.5.1 und 1.5.2: Antworten der Person). Grundlage: Wunsch der Person (22.11.2026). Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

## 1. Ziel

Ein neuer Reiter **„Herbarium“** zum Lernen mit Karteikarten. Die Person möchte mehr Pflanzen kennen und wieder lernen.
Das Herbarium aus Papier führt sie weiter. In der App sieht sie bei jeder Pflanze, ob sie schon im Herbarium ist, mit Nummer, Funddatum und Fundort.

- Jede Pflanze ist eine Karteikarte. **Vorderseite:** immer der deutsche Name. **Rückseite:** lateinischer Name, Familie, Gattung, Gruppen,
  Eigenschaften, Bestimmungsmerkmale, Notizen, Bilder und die Herbarium-Angaben.
- Pflanzen sind geordnet nach **Gruppen** (zum Beispiel Frühblüher) und nach der Biologie (**Familie, Gattung, Art**).
- Dazu **weitere Karteikarten** ohne Pflanze, je mit einer **Kategorie** (zuerst Raumplanung und Geographie): Vorderseite eine Frage oder ein Begriff, Rückseite die Antwort.
- Erst nur Pflanzen (Flora). Tiere (Fauna) sollen später dazukommen können, ohne Blätter oder Spalten umzubenennen.

Was gleich bleibt:
- Der Eintrag „Herbarium“ im Reiter Besitz bleibt, wie er ist. Die Inhalte des Herbariums kommen nicht in den Besitz.
- Alle anderen Reiter werden nicht angefasst.

## 2. Aufbau in der App

**Reiter:** Name „Herbarium“, Adresse `#/herbarium`, Kennung `herbarium`, Skript `leben` (erscheint nur mit der Adresse des Skripts `leben`, wie Besitz).
Symbol `icons/reiter/herbarium.svg` (ein Blatt, selbst gezeichnet), 🌿 vor der Überschrift.
Farbe **Moosgrün `#7A9455`** (`--farbe-herbarium`, Kontrast 5,1:1 zur dunklen Schrift, gut von Finanzen `#8DB580`, Besitz `#7FA7A0` und Visitenkarte `#A8AE6E` zu unterscheiden).
Wie die Visitenkarte eine Ausnahme von den sieben Farben: nur Kachel, Reiter und Karteikarten, nicht im Icon.
Kachel auf der Startseite und am PC in der Seitenleiste, am Handy nicht in der Leiste unten (`nurBreit`, wie die Visitenkarte; bestätigt von der Person, 22.11.2026).

**Unterreiter:** Herbarium · Karten (zwei statt drei, Wunsch der Person, 22.11.2026). „Herbarium“ ist die Pflanzenliste zum Suchen und Anhaken, „Karten“ ist zum Lernen.

**Herbarium** (die Pflanzen)
- Suche (deutscher und lateinischer Name, Familie, Gattung, Gruppen, Merkmale; ohne Groß- und Kleinschreibung), Filter Gruppe, Familie und Herbarium (alle / im Herbarium / fehlt noch).
- Liste A–Z nach deutschem Namen, je Zeile deutscher Name, darunter klein der lateinische Name, rechts die Herbarium-Nummer oder „fehlt noch“.
- Tipp auf eine Pflanze zeigt die ganze Karte. Darin lässt sich **„Im Herbarium“** direkt anhaken, mit Nummer, Funddatum und Fundort; „Übernehmen“ speichert
  (wie „Ausgeliehen“ bei Besitz). „Bearbeiten“ öffnet das Formular, „+ Neue Pflanze“ legt eine an.
- Formular: deutscher Name (Pflicht), lateinischer Name, Familie, Gruppen (mehrere, mit Vorschlägen aus der Liste), Eigenschaften, Bestimmungsmerkmale, Notiz, bis zu 5 Bilder,
  Herbarium (Haken, Nummer, Funddatum, Fundort). Familie und Gruppen schlagen vor, was es schon gibt (`auswahlFeld`), wie Kategorie und Ort bei Besitz.
- **Gattung** schreibt die Person nicht extra: Sie ist das erste Wort des lateinischen Namens („Bellis perennis“ → Gattung *Bellis*, Art *perennis*).

**Karten** (lernen)
- Ganz oben die Wahl des **Fachbereichs**: **Pflanzen** (die Pflanzen aus dem Herbarium) und jede Kategorie der weiteren Karten (Raumplanung, Geographie …).
  Bei Pflanzen darunter ein Filter: Gruppe, Familie, Gattung, „im Herbarium“ / „fehlt noch“ / alle.
- Darunter, wie viele Karten in jedem der **5 Fächer** liegen und wie viele heute dran sind, und der Knopf **„Lernen“**.
- Lernen wie in einem Karteikasten (Leitner, bestätigt von der Person): Neue Karten liegen in Fach 1. „Gewusst“ schiebt die Karte ein Fach weiter,
  „Nicht gewusst“ zurück in Fach 1. Dran ist eine Karte nach ihrem Fach: Fach 1 immer, Fach 2 nach 1 Tag, Fach 3 nach 3 Tagen, Fach 4 nach 7 Tagen, Fach 5 nach 14 Tagen.
  Ein Schalter „Alle Karten“ lernt auch die, die noch nicht dran sind.
- Die Karte zeigt erst die Vorderseite (bei Pflanzen der deutsche Name, sonst die Frage). „Umdrehen“ zeigt die Rückseite mit allen Angaben.
  Bei Pflanzen steht auf **beiden Seiten** ein kleines Zeichen „im Herbarium · Nr. 12“ oder „fehlt noch“ (Wunsch der Person: die Markierung beim Lernen sehen).
- Die Antworten gehen gleich im Hintergrund ans Skript, die App wartet nicht darauf. Klappt das Senden nicht, bleibt die Antwort im Arbeitsspeicher, und die App zeigt
  „2 Antworten nicht gespeichert · Nochmal senden“. Nichts wird ohne Netz im Gerät gespeichert (1.5).
- **Karten anlegen und ändern:** Unter dem Knopf „Lernen“ die Liste der Karten des gewählten Fachbereichs mit Suche und „+ Neue Karte“. Tipp zeigt die Karte, „Bearbeiten“ öffnet das Formular.
  - Bei **Pflanzen** ist es dieselbe Liste wie im Unterreiter Herbarium, mit „+ Neue Pflanze“ und demselben Formular (Wunsch der Person, 22.11.2026:
    auch Pflanzen eintragen und lernen, die noch nicht gefunden sind). Eine neue Pflanze ist zuerst „fehlt noch“, bis „Im Herbarium“ angehakt ist.
  - Bei den anderen Fachbereichen: Formular mit Fachbereich (Pflicht, mit Vorschlägen, so entsteht auch ein neuer), Vorderseite (Pflicht), Rückseite (Zeilenumbrüche bleiben), bis zu 5 Bilder.

**Bilder** wie bei Besitz: hochladen (die App verkleinert auf höchstens 1600 px, JPEG) oder Google-Drive-Link, Datei im Drive der Person,
neuer privater Ordner **„Thetadex Herbarium“**. Die Liste lädt Bilder erst, wenn sie zu sehen sind, nur im Arbeitsspeicher (`bildSpeicher`).

## 3. Sheet „Leben“, zwei neue Blätter

**Warum zwei Blätter im Sheet „Leben“** (Frage der Person, 22.11.2026: „macht eine einzelne Tabelle mehr Sinn?“):
- Ein eigenes Sheet braucht ein eigenes Skript, eine neue Script-Adresse und eine neue Bereitstellung. Das lohnt sich nur, wenn andere Leute Zugriff bekommen sollen (2.2).
  Das Herbarium sieht nur die Person, darum reicht das Sheet „Leben“ mit dem Skript `leben`.
- Die Datenmenge ist klein: Auch 2000 Pflanzen und 2000 Karten sind für ein Sheet wenig.
- Je Art von Karte **ein** Blatt: Eine Pflanze ist genau eine Zeile, mit Herbarium-Angaben und Lernstand in derselben Zeile. Kein eigenes Blatt für den Lernstand.
  Pflanzen und Karten getrennt, weil Pflanzen viele eigene Spalten haben, die bei Raumplanung leer blieben.

Kopfzeile in Zeile 1, dazu wie immer `id, erstellt_am, geaendert_am, geloescht`. Löschen ist weich (im Sheet zurückholbar). Ändern schickt `geaendert_am` mit (Schutz vor Überschreiben).

**Blatt `arten`** (eine Zeile je Pflanze, später auch je Tier)

| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `reich` | `flora` (später `fauna`) | ja | setzt die App, zurzeit immer `flora` |
| `name` | deutscher Name (Vorderseite) | ja | 80 |
| `latein` | lateinischer Name, daraus Gattung und Art | nein | 80 |
| `familie` | zum Beispiel Korbblütler (Asteraceae) | nein | 80 |
| `gruppen` | mehrere, mit Komma getrennt, zum Beispiel „Frühblüher, Heilpflanze“ | nein | 200 |
| `eigenschaften` | Text, Zeilenumbrüche bleiben | nein | 3000 |
| `merkmale` | Bestimmungsmerkmale, Zeilenumbrüche bleiben | nein | 3000 |
| `notiz` | Zeilenumbrüche bleiben | nein | 3000 |
| `bilder` | JSON-Liste von Drive-Kennungen | nein | höchstens 5 |
| `im_herbar` | `TRUE` oder leer | nein | |
| `herbar_nr` | Nummer im Herbarium, als Text (zum Beispiel „12“ oder „A-12“) | nein | 20 |
| `gefunden_am` | JJJJ-MM-TT, nicht in der Zukunft | nein | |
| `fundort` | Text, kein GPS | nein | 100 |
| `fach` | Lernfach 1 bis 5, leer = 1 | nein | |
| `gelernt_am` | JJJJ-MM-TT, letzte Antwort | nein | setzt das Skript |

**Blatt `karten`** (eine Zeile je Karte ohne Pflanze)

| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `kategorie` | Fachbereich, zum Beispiel Raumplanung, Geographie | ja | 40 |
| `vorne` | Frage oder Begriff | ja | 300 |
| `hinten` | Antwort, Zeilenumbrüche bleiben | nein | 3000 |
| `bilder` | JSON-Liste von Drive-Kennungen | nein | höchstens 5 |
| `fach`, `gelernt_am` | wie bei `arten` | | |

- Höchstens 3000 Zeilen je Blatt. Fachbereiche (`kategorie`) und Gruppen haben kein eigenes Blatt (wie Orte bei Besitz): Die Auswahl entsteht aus der Liste, Umbenennen im Sheet mit „Suchen und ersetzen“.
- `einrichten` legt beide Blätter an und den Bild-Ordner „Thetadex Herbarium“ (Skripteigenschaft `HERBAR_ORDNER`). Das Blatt `besitz` bleibt unverändert.
- Viele Pflanzen auf einmal: Die Person kann Zeilen direkt ins Blatt `arten` einfügen (Spalten wie oben, `reich` = `flora`). Fehlende `id` ergänzt das Skript beim Laden.

## 4. Skript `leben` (Änderungen)

Neue Aktionen, nur mit `APP_PIN`:

| Aktion | Was sie tut |
| --- | --- |
| `herbar` | alle Zeilen aus `arten` und `karten` (ohne gelöschte), erst beim Öffnen des Reiters geladen |
| `herbar_speichern` | `blatt` = `arten` oder `karten`; neu (ohne `id`) oder ändern (mit `id` und `geaendert_am`); neue Bilder gehen danach einzeln über `herbar_bild` hoch |
| `herbar_bild` | ein Bild hochladen (verkleinert in der App), legt es im Ordner „Thetadex Herbarium“ ab und hängt die Kennung an den Eintrag (wie `rezept_bild` im Skript `gemeinsam`) |
| `herbar_loeschen` | weich löschen (mit `geaendert_am`) |
| `herbar_gelernt` | `blatt`, `id`, `gewusst` (ja/nein): rechnet das neue Fach im Skript aus, setzt `gelernt_am`. Ohne `geaendert_am`-Schutz, weil es nur Fach und Datum ändert; ändert `geaendert_am` nicht |

- Bilder lesen über die bestehende Aktion `bild` nur für Kennungen, die bei einem nicht gelöschten Eintrag in `besitz`, `arten` oder `karten` stehen.
- Lange Texte (`eigenschaften`, `merkmale`, `notiz`, `hinten`) mit einem Helfer wie `bereinigeLang_` im Skript `gemeinsam` (Zeilenumbrüche bleiben, Formel-Schutz).
  Zu langer Text wird abgelehnt, nicht gekürzt. Alles andere über `bereinigeText_`. Schreiben mit `LockService`.

## 5. Datenschutz und Sicherheit

- Neue Daten: Pflanzen, Lernkarten, Lernstand, Funddatum und Fundort. Keine Namen von Personen, keine Gesundheitsdaten.
  Fundort und Funddatum zeigen, wo die Person wann war: darum nur als Text, kein GPS, und nur im Sheet „Leben“, das niemand sonst sieht.
- Wer sieht sie: nur die Person mit `APP_PIN`. Kein Teilen per Link, kein Partner-Zugang. Das Sheet bleibt mit niemandem geteilt.
- Keine Pflanzenlisten, Karten oder Fundorte im Repo, auch nicht in Beispielen oder Pull-Request-Texten. Listen zum Einfügen nur in den Projektdateien.
- Keine neuen Adressen nach außen, die Content-Security-Policy bleibt gleich. Im Gerät nur die Wahl des Unterreiters und des Fachbereichs (`thetadex_herbar_wahl`), keine Karten.

## 6. Schritte (je ein Zweig und ein Pull Request)

| Schritt | Version | Inhalt |
| --- | --- | --- |
| 13.0 | 1.5.0 bis 1.5.2 | dieser Plan (1.5.1 und 1.5.2: Antworten der Person eingearbeitet) |
| 13.1 | 1.5.3 | Skript `leben`: Blätter `arten` und `karten`, Aktionen aus 4, Bild-Ordner. Von Hand: Skript einfügen, `einrichten`, neue Version bereitstellen |
| 13.2 | 1.5.4 | Reiter Herbarium (Kachel, Symbol, Farbe), Unterreiter Herbarium: Liste, Suche, Filter, Karte ansehen, „Im Herbarium“ anhaken, Formular mit Bildern |
| 13.3 | 1.5.5 | Unterreiter Karten: Fachbereich wählen, Lernen mit 5 Fächern, zuerst für Pflanzen (mit „+ Neue Pflanze“) |
| 13.4 | 1.5.6 | Unterreiter Karten: weitere Fachbereiche (Raumplanung, Geographie …), Karten anlegen und ändern |
| 13.5 | 1.5.7 | Abschluss: Prüfung Sicherheit und Datenschutz (nur Bericht), Plan in `docs/STAND.md` einarbeiten, diese Datei löschen |

## 7. Später (nicht in dieser Etappe)

- Fauna: Zeilen mit `reich` = `fauna` im selben Blatt, dann ein Umschalter „Pflanzen | Tiere“. Gruppen und Familien gelten dann je Reich.
