# Plan Etappe 6 „Pen & Paper“ (DSA und DnD, 0.6.x)

Stand: 31.10.2026 (Schritt 6.0). Die Antworten der Person auf die Rückfragen und ihre Anmerkungen zum Muster sind eingearbeitet.
Ein Muster des Reiters (Bilder, ausgedachte Werte) liegt in den Projektdateien im Chat (`etappe-6/muster/`), nicht im Repo.
Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.
Grundlage: STAND.md 1.2, 2.2, 2.3, 4 („Wer sieht was“, „DSA teilen“, „Bilder“, „Würfel“) und 7.2 (Etappe 6).

## Ziel

Ein Reiter **Pen & Paper** (Kennung weiter `dsa`, Adresse `#/dsa`) mit vier Charakterbögen (drei DSA, ein DnD). Jeder Bogen ist einzeln wählbar, alles ist in der App bearbeitbar.
Geld, Leben, AsP und AP haben einen Verlauf mit schnellem „+“ und „−“. Dazu Würfel und ein Link zum Teilen eines Bogens ohne Passwort (nur lesen).
Die Daten liegen in einem **neuen Sheet „DSA“** mit eigenem Skript `apps-script/dsa/Code.gs` und eigener Adresse.

## Was gleich bleibt

- Alle anderen Reiter und Skripte bleiben unverändert. Keine neue Rolle: Nur die Person (Passwort `APP_PIN`) darf lesen und ändern.
  `PARTNER_PIN` kennt das Skript `dsa` nicht.
- Der Reiter erscheint erst, wenn die Adresse des Skripts `dsa` in den Einstellungen steht (gibt es schon seit 0.4.8, `BEREICHE` in `js/config.js`).
- **Im Repo stehen keine Bögen:** keine Namen von Helden, keine Werte, keine Zauber-Texte, auch nicht in Beispielen oder Pull-Request-Texten.
  Im Repo stehen nur allgemeine Spielbegriffe als Vorlage (Kürzel wie MU, KL, STR, DEX und die Namen der Talent-Gruppen).
- Keine fremden Server, die Content-Security-Policy bleibt gleich.

## Aufbau des Reiters

- **Name „Pen & Paper“** (Wunsch der Person, 31.10.2026) statt „DSA“: als Überschrift und in der Reiterleiste (`titel` in `BEREICHE`, `js/config.js`).
  Kennung, Adresse `#/dsa`, Skript `dsa` und Sheet „DSA“ bleiben (nichts umbenennen, 1.2 Punkt 4).
- **Symbol vor der Überschrift: ein W20** (Wunsch der Person) als eigene Datei `icons/w20.svg` (Flächen in Tönen der DSA-Farbe, weiße „20“),
  48 px, statt eines Emojis. Vorlage liegt in den Projektdateien (`etappe-6/muster/w20.svg`). Ausnahme wie 🥙 und 📦 (STAND.md 4 „Erscheinungsbild“).
- **„+ Bogen“ rechts in der Zeile der Überschrift** (Wunsch der Person). Knöpfe in der DSA-Farbe `#B5838D` mit dunkler Schrift (`--schrift-auf-farbe`).
- Darunter eine Auswahl **Bogen** (Vorgabe: der zuletzt gewählte, nur im Gerät gemerkt), daneben die Marke „DSA“ oder „DnD“ und „🔗 Link teilen“.
  „Neu laden“ steht unten (wie bei Uni).
- **Immer sichtbar oben** (klebt beim Scrollen): Geld, LeP, AsP (nur wenn der Bogen welche hat) und AP, je als Kachel mit Symbol; Tipp öffnet „+“ und „−“.
  Darunter die Leiste der Eigenschaften (acht Kacheln mit Wert und Kürzel).
- Darunter die **Abschnitte** als Karten, jede auf- und zuklappbar (am Handy zu Beginn zu, außer Kopf):
  1. Kopf (Bild links, Felder rechts, je Feld eine Zeile): Name, Rasse, Kultur, Profession, Geschlecht, Alter, Größe, Gewicht (eigene Zeile), Haar- und Augenfarbe, Stand, Titel, Sozialstatus, Herkunft, GP-Basis, Bild.
  2. Eigenschaften und Basiswerte (LeP, AuP, AsP, MR, INI, AT, PA, FK, GS, Wundschwelle …).
  3. Vor- und Nachteile.
  4. Sonderfertigkeiten und Gaben.
  5. Talente nach Gruppe (Kampftechniken, Körperliche, Gesellschaftliche, Natur-, Wissens-, Handwerkliche Talente, Sprachen und Schriften).
  6. Zauber.
  7. Waffen.
  8. Besitz.
  9. Verlauf (Geld, LeP, AsP, AP).
- Je Eintrag ein Knopf ✎ (wie im Reiter Uni seit 5.5). Fenster schließen nur mit × oder Abbrechen.
- Würfel als Knopf „🎲 Würfeln“ unten rechts, öffnet ein kleines Fenster (siehe Schritt 6.5).
- Am Handy Karten untereinander, am PC zwei Spalten (links Kopf, Eigenschaften, Vor- und Nachteile, Sonderfertigkeiten, Verlauf; rechts Talente, Zauber, Waffen, Besitz).

**DnD wie DSA** (Entscheidung der Person, 31.10.2026): Es gibt nur eine Vorlage, aufgebaut wie der DSA-Bogen:
Eigenschaften MU, KL, IN, CH, FF, GE, KO, KK; Zähler Geld (Dukaten, Silbertaler, Heller, Kreuzer), LeP, AsP, AP.
Beim Anlegen wählt die Person nur, ob der Bogen für DSA oder DnD gedacht ist (Spalte `regelwerk`, als kleine Marke neben dem Namen sichtbar).
So bleibt gemerkt, welcher Bogen der DnD-Bogen ist. Sonst ist er gleich aufgebaut. Braucht DnD Anpassungen, meldet die Person sie.
Alles ist frei änderbar: Eigenschaften sind eine Liste aus Kürzel, Name und Wert; Gruppen und Zähler ebenso.
Hinweis: 7.2 nennt CH nicht. Der DSA-Bogen hat CH, darum ist es in der Vorlage.

## Sheet „DSA“: drei Blätter (Kopfzeile in Zeile 1)

Jedes Blatt hat zusätzlich `id, erstellt_am, geaendert_am, geloescht` (STAND.md 2.3). Löschen ist weich.

**Blatt `boegen`** – ein Bogen je Zeile:
| Spalte | Inhalt | Grenze |
| --- | --- | --- |
| `name` | Name des Helden | Pflicht, 80 Zeichen |
| `regelwerk` | `dsa` oder `dnd` (merkt, welcher Bogen für DnD gedacht ist) | feste Liste |
| `kopf` | alle Felder des Kopfs als JSON (Rasse, Kultur …) | je Feld 80 Zeichen |
| `eigenschaften` | Liste als JSON: Kürzel, Name, Wert, Gruppe (Eigenschaft oder Basiswert) | höchstens 40 |
| `zaehler` | Liste als JSON: Kürzel, Name, Art (`geld`, `leben`, `zahl`), Startwert, Höchstwert | höchstens 6 |
| `bild` | Kennung der Bild-Datei (siehe 6.5) | – |
| `freigabe` | zufälliger Schlüssel für den Link, leer = nicht geteilt | setzt das Skript |
| `notiz` | frei | 1000 Zeichen |

**Blatt `eintraege`** – eine Zeile je Vorteil, Talent, Zauber, Waffe, Gegenstand:
| Spalte | Inhalt | Grenze |
| --- | --- | --- |
| `bogen_id` | zu welchem Bogen | muss es geben |
| `abschnitt` | `vorteil`, `nachteil`, `sonderfertigkeit`, `gabe`, `talent`, `zauber`, `waffe`, `besitz` | feste Liste |
| `gruppe` | zum Beispiel die Talent-Gruppe | 40 Zeichen |
| `name` | Name | Pflicht, 80 Zeichen |
| `wert` | TaW, ZfW, Stufe, Anzahl (Text, damit auch „II“ oder „+3“ geht) | 20 Zeichen |
| `probe` | zum Beispiel „KL / IN / CH“ | 30 Zeichen |
| `felder` | weitere Felder als JSON, je nach Abschnitt (siehe unten) | je Feld 200 Zeichen |
| `text` | Beschreibung, Wirkung, Notiz | 3000 Zeichen |
| `reihenfolge` | Zahl zum Sortieren innerhalb der Gruppe | 0 bis 9999 |

Weitere Felder je Abschnitt (`felder`):
- Zauber: Kosten, Zauberdauer, Wirkungsdauer, Reichweite, Technik, Modifikationen (Liste), Merkmale, Hauszauber (ja/nein).
- Waffe: Art, INI, AT, PA, TP, BE, Reichweite (für Fernkampf).
- Talent: BE (zum Beispiel „BEx2“), Spezialisierung.
- Besitz: Ort (am Körper, Tasche, Boot …), Gewicht.

**Blatt `verlauf`** – jede Änderung an einem Zähler:
| Spalte | Inhalt | Grenze |
| --- | --- | --- |
| `bogen_id` | zu welchem Bogen | muss es geben |
| `zaehler` | Kürzel des Zählers (zum Beispiel `LeP`) | muss es am Bogen geben |
| `aenderung` | „+“ oder „−“ als Zahl; Geld in der kleinsten Münze (Kreuzer bzw. Kupfer) | −1.000.000 bis 1.000.000, ganze Zahl |
| `notiz` | zum Beispiel „Sold vom Händler“ | 100 Zeichen |
| `datum` | setzt das Skript | – |

Der **aktuelle Stand** ist Startwert plus alle Änderungen. Leben und AsP gehen nie über den Höchstwert (die App zeigt dann den Höchstwert).
**AP** (Entscheidung der Person, 31.10.2026): „+“ heißt gesammelt, „−“ heißt ausgegeben. Oben steht nur die Summe der gesammelten AP.
Im Verlauf stehen beide, ausgegebene als „ausgegeben“ markiert.
Geld zeigt die App umgerechnet an (1 Dukaten = 10 Silbertaler = 100 Heller = 1000 Kreuzer, steht so auf dem Bogen).

**Warum eine Zeile je Eintrag statt JSON-Spalten** (STAND.md 2.3 plant `boegen` mit JSON-Abschnitten, dazu `gegenstaende` und `bilder`):
Eine Zelle fasst höchstens 50.000 Zeichen. Zauber mit ihren langen Texten kämen damit schnell an die Grenze.
Eine Zeile je Eintrag ist im Sheet gut lesbar, ein Eintrag lässt sich einzeln ändern, und die Bögen lassen sich als Tabelle ins Sheet einfügen (Schritt 6.7).
Die Blätter `gegenstaende` und `bilder` fallen dadurch weg (Besitz ist ein Abschnitt, das Bild liegt im Drive). Das ändert STAND.md 2.3 und 4 „Bilder“ (mit 6.0 dort schon angepasst).

## Skript `apps-script/dsa/Code.gs` (neu, gleicher Aufbau wie `leben`)

- Helfer wie in den anderen Skripten: `jsonOut_`, `pruefePin_` (Sperre nach 5 Fehlversuchen), `bereinigeText_`, `LockService`, Funktion `einrichten`.
- Aktionen:
  | Aktion | Was sie tut | Passwort |
  | --- | --- | --- |
  | `ping` | prüft das Passwort | ja |
  | `liste` | alle Bögen (ohne `freigabe`), ihre Einträge und den Verlauf | ja |
  | `bogen_speichern` | neu ohne `id`, ändern mit `id` und `geaendert_am` (Schutz vor Überschreiben wie bei Besitz) | ja |
  | `bogen_loeschen` | weich, mit seinen Einträgen | ja |
  | `eintrag_speichern`, `eintrag_loeschen` | ein Eintrag | ja |
  | `verlauf_neu` | eine Änderung an einem Zähler (Löschen nur im Sheet, wie ein Kassenbuch) | ja |
  | `bild` | das Bild eines Bogens als `data:`-Bild | ja |
  | `freigabe` | erstellt einen neuen Schlüssel (alter Link gilt sofort nicht mehr) oder löscht ihn | ja |
  | `geteilt` | genau ein Bogen mit seinem Schlüssel, nur lesen, mit Bild | **nein** |
- `geteilt` gibt nie `freigabe`, keinen Verlauf (nur die aktuellen Werte, Entscheidung der Person) und nichts von anderen Bögen heraus.
  Der Schlüssel ist lang und zufällig (mindestens 32 Zeichen). Falsche Schlüssel zählen wie falsche Passwörter (Sperre), damit niemand rät.
- Das ganze Skript kommt in Schritt 6.1 auf einmal, damit die Person `Code.gs` nur einmal einfügen muss.

## Schritte

Jeder Schritt ist ein eigener Zweig und ein eigener Pull Request. Nach jedem Schritt prüft die Person am Handy und am PC.

- **6.0 Plan** (→ 0.6.0): dieser Plan als `docs/PLAN-ETAPPE-6.md`, Antworten eingearbeitet. Kein Code.
- **6.1 Sheet, Skript und Bogen anlegen** (→ 0.6.1) – gebaut. Kopf ändern im Fenster über ✎; Eigenschaften, Basiswerte und Zähler (Startwert, Höchstwert) in einem Fenster.
  AsP erscheint oben nur mit Höchstwert oder Stand. Geld steht als Kreuzer im Sheet.
  - Von Hand: neues Google Sheet „DSA“, `Code.gs` einfügen, `APP_PIN` eintragen, `einrichten` ausführen, **neue Bereitstellung**, Adresse in der App eintragen.
  - Neue Datei `icons/w20.svg` (in `HUELLE` in `sw.js`), Name „Pen & Paper“ in `js/config.js`.
  - Dazu drei Wünsche der Person zum Aussehen (31.10.2026), gelten für die ganze App:
    1. Heller Modus: Die Kopfzeile (Icon, Name, Einstellungen, Info) bleibt immer dunkelgrau wie im dunklen Modus.
    2. Heller Modus: Hintergrund nicht reinweiß, sondern leicht beige-grau (Vorschlag `#F3F0EA`, Kacheln etwas dunkler); Kontrast nach WCAG AA prüfen.
    3. Startseite: großes Icon ohne dunklen Hintergrund, nur die Karteikarte mit den farbigen Reitern (eigene Datei, zum Beispiel `icons/thetadex-karte.svg`).
    Die Werte kommen in STAND.md 4 „Erscheinungsbild“.
  - Reiter Pen & Paper: Bogen wählen, „+ Bogen“ (Vorlage DSA oder DnD), Kopf und Eigenschaften anzeigen und ändern, Eigenschaften-Leiste oben.
- **6.2 Listen** (→ 0.6.2) – gebaut: Vor- und Nachteile, Sonderfertigkeiten, Gaben, Talente nach Gruppe, Besitz. Anlegen, ändern, löschen, sortieren.
  Vor- und Nachteile, Sonderfertigkeiten und Gaben als Knöpfe nebeneinander (Tipp öffnet), Talente und Besitz als Zeilen je Gruppe bzw. Ort.
  „Speichern und weiter“ beim Anlegen (Gruppe und Ort bleiben stehen). Sortiert nach „Reihenfolge“ (freiwillig), sonst nach Name.
- **6.3 Zauber und Waffen** (→ 0.6.3) – gebaut: Zauber mit allen Feldern und Modifikationen (lange Texte aufklappbar), Waffen als kleine Tabelle (am Handy Karten).
  Modifikationen im Formular je Zeile eine; Haken „Hauszauber“ zeigt eine Marke. Waffen haben kein Feld „Wert“. Sheet und Skript bleiben gleich.
- **6.4 Verlauf** (→ 0.6.4) – gebaut: Geld, Leben, AsP, AP oben mit Symbol; Tipp darauf → „+“ oder „−“, Betrag, Notiz. Liste der letzten Änderungen je Zähler.
  Geld mit Feldern je Münze (D, S, H, K), die App rechnet um. Leben und AsP mit Knopf „Voll“ (setzt auf den Höchstwert).
  „+“ speichert höchstens bis zum Höchstwert, Geld nicht unter 0. Karte „Verlauf“ mit Filter je Zähler. Sheet und Skript bleiben gleich.
- **6.5 Würfel und Bild** (→ 0.6.5) – gebaut. Knopf „🎲 Würfeln“ schwebt unten rechts; Bild steht rechts neben dem Kopf. Sheet und Skript bleiben gleich.
  - Würfel W4, W6, W8, W10, W12, W20 (W8 bis W12 Wunsch der Person für DnD), Anzahl wählbar (zum Beispiel 3W20), Ergebnis groß mit den Einzelwürfen.
    Rechnet nur im Gerät mit `crypto.getRandomValues`, nichts wird gespeichert (STAND.md 4 „Würfel“).
    So zufällig wie möglich: Das ist der Zufall, den der Browser auch für Verschlüsselung nutzt, nicht berechenbar.
    Würfe, die nicht gleichmäßig auf die Seiten passen, werden verworfen und neu gezogen, damit jede Seite genau gleich oft kommen kann.
  - Bild des Helden: hochladen oder Drive-Link, wie bei Besitz (`js/ui/bild.js` wiederverwenden), privater Ordner „Thetadex DSA“.
- **6.6 Teilen** (→ 0.6.6) – gebaut: Knopf „Link teilen“ je Bogen, „Neuen Link erstellen“, „Nicht mehr teilen“.
  Adresse `#/bogen/<skript>/<schluessel>` ohne Einrichtung: ganzer Bogen mit den aktuellen Werten und Würfel, ohne Verlauf und ohne Knöpfe zum Ändern (STAND.md 4 „DSA teilen“).
  Der Schlüssel kommt nur beim Erstellen; die App merkt ihn im Gerät (`thetadex_dsa_links`). Gleiche Ansicht wie der Reiter, Modus „nur lesen“. Sheet und Skript bleiben gleich.
- **6.7 Bogen übertragen** (Daten, kein Pull Request, kein Code): Aus der Vorlage in den Projektdateien (`dsa-vorlagen/`, ein Bogen) erstelle ich
  Tabellen zum Einfügen ins Sheet (Projektdateien, Ordner `etappe-6/`, nie ins Repo), wie die Werte in Etappe 2. Die Person fügt sie ein und prüft.
  Die anderen drei Bögen trägt die Person selbst in der App ein (Entscheidung, 31.10.2026).
  Das geht schon nach 6.3; der Verlauf startet leer mit den heutigen Werten als Startwert.
- **6.8 Anmerkungen und Abschluss** (→ 0.6.x): 0.6.7 Aussehen (Name als Überschrift, Münzen, Bild) gebaut; 0.6.8 Abenteuer und DM gebaut (Festlegungen in STAND.md 4). Sonst: gesammelte Anmerkungen der Person, dann Plan in STAND.md einarbeiten und löschen.

## Datenschutz und Sicherheit

- Welche Daten? Nur Spielwerte und Texte der Bögen, dazu ein Bild je Held. Keine Daten über Mitspielende, keine Namen von Personen.
- Wer sieht sie? Nur die Person mit Passwort. Ohne Passwort genau ein Bogen mit seinem Schlüssel, nur lesen. Das Skript prüft das, nie nur die App.
- Eigenes Sheet und eigenes Skript: Ein Fehler beim Teilen kann nie Tracking, Finanzen, Besitz oder Uni verraten (STAND.md 2.2).
- Böse Eingaben: Jede Eingabe geprüft (feste Listen, Längen, Zahlen), Texte über `bereinigeText_`, in der App nur `textContent`.
- Im Gerät: nur die Wahl des Bogens (`thetadex_dsa_bogen`), sonst nichts. Kein Bogen ohne Netz (Entscheidung der Person: online reicht). „Abmelden“ löscht alles.

## Antworten der Person (31.10.2026)

Zu den Rückfragen:

1. Eine Zeile je Eintrag oder JSON-Spalten: Die Person war unsicher; Erklärung im Thread, Vorschlag „eine Zeile je Eintrag“ gilt, solange sie nicht widerspricht.
2. Bild im Google Drive wie bei Besitz: ja.
3. Ohne Netz: nein, online reicht. Nichts vom Bogen liegt im Gerät.
4. Geteilter Link: nur die aktuellen Werte, kein Verlauf.
5. Würfel: auch W8, W10, W12.
6. AP: oben nur die gesammelten; im Verlauf auch die ausgegebenen.
7. DnD wie DSA aufbauen, Anpassungen meldet die Person. Spalte `regelwerk` merkt den DnD-Bogen. Die anderen drei Bögen trägt die Person selbst ein.

Zum Muster (31.10.2026):
- „+ Bogen“ in die Zeile der Überschrift.
- W20 als Symbol statt des Würfel-Emojis.
- Überschrift „Pen & Paper“ statt „DSA“ (auch in der Reiterleiste, siehe „Aufbau des Reiters“).
- Größe und Gewicht als eigene Zeilen.
- „Pen & Paper“ auch in der Reiterleiste: ja, wenn es vom Platz passt (am Handy steht dort nur das Symbol, am PC passt der Name in die Seitenleiste).
- Für 6.1 dazu: Kopfzeile im hellen Modus dunkelgrau, Hintergrund leicht beige-grau, Startseite mit Karteikarte ohne Hintergrund.
