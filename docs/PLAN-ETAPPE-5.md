# Plan Etappe 5 „Uni“ (0.5.x)

Ziel: Ein Reiter Uni mit Semestern, Stundenplan, Kalender (Vorlesungen, Prüfungen, Urlaub, Semesterferien, Arbeit, Zug),
berechneten Arbeitsstunden und einer Master-Übersicht der Module (Ziel 120 ECTS).
Die Daten liegen im bestehenden Sheet „Gemeinsam“ mit dem Skript `gemeinsam` (fünf neue Blätter).
Die Antworten der Person auf die Rückfragen (30.10.2026) sind eingearbeitet (0.5.1).
**Umbau in Schritt 5.5 (31.10.2026, Anmerkungen der Person):** kein Stundenplan mehr, Module mit Kursen, Prüfungen mit „bestanden“,
Termine jede Woche an bestimmten Tagen. Was davon abweicht, steht in Schritt 5.5; die älteren Abschnitte zeigen den Stand bis 0.5.5.
Regeln: STAND.md 1.2, 2.2, 2.3, 4 („Wer sieht was“, „Stundenplan am Handy“) und 7.2.
Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

Was gleich bleibt:
- Tracking, Finanzen, Döner, Besitz und Einkauf bleiben unverändert. Die Einkauf-Blätter und -Aktionen im Skript `gemeinsam` werden nicht angefasst.
- Keine neuen Passwörter, keine neue Script-Adresse: Uni nutzt die schon eingetragene Adresse `gemeinsam`.
  Der Reiter Uni erscheint schon heute mit dieser Adresse (Schritt 4.5) und zeigt bis 5.1 den Platzhalter.
- Im Repo stehen keine Veranstaltungen, Module, Räume, Arbeitgeber oder Strecken, auch nicht in Beispielen oder Pull-Request-Texten.
- **Keine Noten** (Entscheidung der Person, 30.10.2026): Die stehen auf der Uni-Plattform, doppelte Pflege wäre unnötig.

Was im Gerät liegt (neue Ausnahme, Wunsch der Person, 30.10.2026): die zuletzt geladenen Uni-Daten (`thetadex_uni`), damit Kalender und
Stundenplan auch ohne Netz da sind. Ohne Netz steht oben „Stand von <Datum, Uhrzeit>“ und es gibt keine Knöpfe zum Ändern:
Ändern geht nur mit Netz (STAND.md 1.5 bleibt). „Abmelden“ löscht die Daten aus dem Gerät. Die Ausnahme kommt in Schritt 5.2 mit Grund in STAND.md 4.

## Aufbau des Reiters

- Überschrift „Uni“ mit einem bunten Emoji davor (Vorschlag 🎓, wie 📦 bei Besitz und 🛒 bei Einkauf).
- Oben eine Auswahl **Semester** (Vorgabe: das Semester, in dem heute liegt, sonst das neueste). Daneben „+ Semester“ und „Neu laden“.
- Zwei Unterreiter (Umschalter wie bei Besitz und Einkauf): **Kalender** (Vorgabe, Ansicht Woche mit der aktuellen Woche) und **Module**.
  Den Unterreiter Stundenplan gibt es seit 5.5 nicht mehr (der Kalender deckt alles ab).
- **Semesterzeiten** trägt die Person in der App ein: „+ Semester“ öffnet ein Formular mit Name, Semesterbeginn und -ende, Vorlesungsbeginn und -ende.
  Das landet im Blatt `semester`. Ändern über „Bearbeiten“ neben der Semester-Auswahl.
- Knöpfe in der Uni-Farbe `#C9784A` mit dunkler Schrift (`--schrift-auf-farbe`, wie bei Döner und Einkauf).
- Am Handy Karten und Listen, am PC dieselben Karten breiter; die Woche als Raster mit Uhrzeiten (siehe Kalender).
- Für Partner*in: dieselbe Ansicht mit allem, auch den Modulen (Entscheidung der Person), aber ohne Knöpfe zum Anlegen, Ändern und Löschen
  (die Rolle kommt mit der Antwort des Skripts, die App speichert sie nicht).

## Arten und Farben

Jeder Eintrag hat eine **Art**. Jede Art hat eine eigene Farbe (Wunsch aus 7.2). Das ist eine neue Ausnahme von „schwarz-weiß“ (STAND.md 1.5),
sie kommt in Schritt 5.2 mit Grund in STAND.md 4. Farben nur als Fläche oder Streifen, nie als Schriftfarbe auf hellem Grund (Kontrast).
Jede Farbe bekommt einen hellen und einen dunklen Wert als Variable in `css/base.css` (`--art-vorlesung` …). Vorschlag, die Person kann ihn nach dem Testen ändern:

| Art (Schlüssel) | Anzeige | Wo eingetragen | Farbe (Vorschlag) |
| --- | --- | --- | --- |
| `vorlesung` | Vorlesung, Übung, Seminar | Stundenplan oder Termin | Uni-Farbe `#C9784A` |
| `pruefung` | Prüfung | Termin (mit Modul) | Rot |
| `arbeit` | Arbeit | Stundenplan oder Termin | Graugrün `#7FA7A0` |
| `zug` | Zug | Stundenplan oder Termin | Altrosa `#B5838D` |
| `urlaub` | Urlaub | Termin (mehrtägig) | Grün `#8DB580` |
| `frei` | Feiertag, vorlesungsfrei (seit 5.5 nicht mehr neu, gilt und erscheint als Urlaub) | Termin | Grau |
| `ferien` | Semesterferien | berechnet aus dem Semester, nicht eingetragen | Sand `#D4B483`, nur als heller Streifen |
| `sonstiges` | Sonstiges | Termin | Grau, dunkler |

Die genauen Farbwerte (vor allem Rot und Grau, hell und dunkel) legt Schritt 5.2 fest. Kein Blau (wie bei den Bereichsfarben).

## Sheet „Gemeinsam“: fünf neue Blätter (Kopfzeile in Zeile 1)

Jedes Daten-Blatt hat zusätzlich `id, erstellt_am, geaendert_am, geloescht` (STAND.md 2.3). Löschen ist weich.
Daten und Uhrzeiten stehen als **Text** (`JJJJ-MM-TT`, `HH:MM`), damit Google Sheets sie nicht in Datum oder Zahl umwandelt.

**Blatt `semester`** – ein Semester je Zeile:
| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `name` | zum Beispiel „WiSe 26/27“ | ja | 40 Zeichen, kein zweites Mal gleich |
| `beginn`, `ende` | ganzes Semester | ja | Datum, `ende` nach `beginn`, höchstens 12 Monate |
| `vorlesung_beginn`, `vorlesung_ende` | Vorlesungszeit | ja | Datum, innerhalb des Semesters |

Semesterferien sind die Zeit im Semester außerhalb der Vorlesungszeit. Sie werden **berechnet**, nicht eingetragen (eine Eingabe weniger).

**Blatt `stundenplan`** – was jede Woche gleich ist:
| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `semester_id` | zu welchem Semester | ja | muss es geben |
| `tag` | Wochentag | ja | 1 (Montag) bis 7 (Sonntag) |
| `von`, `bis` | Uhrzeit | ja | `HH:MM`, `bis` nach `von` |
| `titel` | Veranstaltung, „Arbeit“, „Zug nach …“ (mit Modul: Vorgabe ist der Modulname) | ja | 80 Zeichen |
| `art` | `vorlesung`, `arbeit` oder `zug` | ja | feste Liste |
| `ort` | Raum (bei Vorlesungen), Strecke (bei Zug) | nein | 60 Zeichen |
| `modul_id` | zu welchem Modul (nur Vorlesung) | nein | muss es geben |
| `notiz` | frei, zum Beispiel „Übung“ | nein | 200 Zeichen |

Alles ist wöchentlich (kein „alle zwei Wochen“, Entscheidung der Person); Seltenes ist ein Termin.
Arbeitszeiten, die an jedem Wochentag anders sind, sind einfach je Tag ein eigener Eintrag.
Wann ein wöchentlicher Eintrag gilt (bestätigt): Vorlesungen nur in der Vorlesungszeit, Arbeit und Zug im ganzen Semester.
An Tagen mit `urlaub` oder `frei` fallen alle wöchentlichen Einträge weg (und zählen nicht als Arbeitsstunden).

**Blatt `termine`** – alles Einmalige und Mehrtägige:
| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `titel` | zum Beispiel „Klausur …“, „Urlaub“ | ja | 80 Zeichen |
| `art` | eine Art aus der Tabelle oben außer `ferien` | ja | feste Liste |
| `beginn` | erster Tag | ja | Datum |
| `ende` | letzter Tag (leer = eintägig) | nein | Datum, nicht vor `beginn`, höchstens 366 Tage |
| `von`, `bis` | Uhrzeit (leer = ganztägig) | nein | `HH:MM`, beide oder keine |
| `ort` | Raum, Strecke | nein | 60 Zeichen |
| `modul_id` | zu welchem Modul (vor allem bei Prüfungen) | nein | muss es geben |
| `stunde_id` | ändert einen wöchentlichen Eintrag nur an diesem Tag (siehe unten) | nein | muss es geben, nur eintägig |
| `notiz` | frei | nein | 200 Zeichen |

Termine gehören zu keinem Semester; der Kalender zeigt sie einfach an ihrem Datum.

**Einmal anders** (Wunsch der Person: Arbeitszeiten ändern sich zwischendurch einmalig). Ein Termin mit `stunde_id` ersetzt den wöchentlichen Eintrag
an seinem Tag: mit Uhrzeit = andere Zeit an diesem Tag, ohne Uhrzeit = fällt an diesem Tag aus. Das geht für Arbeit, Zug und Vorlesungen.
Im Kalender: Tipp auf einen wöchentlichen Eintrag → „Nur an diesem Tag ändern“ (Formular mit den Werten vorbefüllt) oder „Fällt an diesem Tag aus“.
Ein geänderter Tag trägt eine kleine Marke „einmalig geändert“; „Wieder wie immer“ löscht den Termin. Die Arbeitsstunden rechnen mit der geänderten Zeit.

**Blatt `module`** – für die Master-Übersicht:
| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `name` | Modulname | ja | 80 Zeichen |
| `kuerzel` | Modulnummer oder Kürzel | nein | 20 Zeichen |
| `bereich` | Gruppe, zum Beispiel Pflicht- oder Wahlbereich | nein | 40 Zeichen |
| `ects` | Leistungspunkte | nein | 0 bis 60, halbe erlaubt |
| `status` | `offen`, `laeuft`, `bestanden` | ja, Vorgabe `offen` | feste Liste |
| `semester_id` | in welchem Semester belegt oder geplant | nein | muss es geben |
| `notiz` | frei | nein | 200 Zeichen |

Keine Noten (Entscheidung der Person).

**Blatt `uni_einstellungen`** – Werte für die Übersicht, Spalten `name, wert` (ohne Standardspalten):
| `name` | `wert` |
| --- | --- |
| `ects_ziel` | Ziel des Studiums in ECTS. `einrichten` legt die Zeile mit 120 an, wenn sie fehlt; ändern direkt im Sheet. |

## Skript `apps-script/gemeinsam/Code.gs` (Ergänzung, gleicher Aufbau wie Einkauf)

- `BLAETTER_` bekommt die vier Daten-Blätter, dazu `uni_einstellungen`; `einrichten` legt sie an, wie in Etappe 4 (vorhandene Blätter und Daten bleiben).
- **Rechte:** Neue lesende Aktion `uni` für beide Rollen. Die schreibenden Uni-Aktionen stehen nur bei `person` in `ERLAUBT_`.
  Partner*in bekommt beim Schreiben „Nicht erlaubt“, auch wenn jemand die App umgeht. `uni` liefert beiden Rollen dasselbe (auch die Module).
- Aktionen (bewusst wenige, eine Prüfregel je Blatt statt eigener Aktionen je Blatt):
  | Aktion | Was sie tut | Wer |
  | --- | --- | --- |
  | `uni` | alle Semester, Stundenplan, Termine, Module und `ects_ziel` in einer Antwort, dazu die Rolle | person, partner |
  | `uni_speichern` | `blatt` (`semester`, `stundenplan`, `termine`, `module`) und ein Eintrag; neu ohne `id`, ändern mit `id` und `geaendert_am` (Schutz vor Überschreiben wie bei Besitz) | person |
  | `uni_loeschen` | `blatt` und `id`, weich | person |
- Löschen eines Semesters löscht seine Stundenplan-Einträge mit (weich), dazu die Termine „einmal anders“ dieser Einträge.
  Löschen eines Moduls lässt Termine und Stundenplan stehen, nur `modul_id` wird geleert.
- Jede Eingabe wird geprüft (Art, Länge, Datum, Uhrzeit, feste Listen, vorhandene ids) und mit `bereinigeText_` geschützt. Schreiben mit `LockService`.
  Höchstens 200 Stundenplan-Einträge je Semester (Schutz vor Versehen).
- Das ganze Skript kommt in Schritt 5.1 auf einmal, damit die Person `Code.gs` nur einmal einfügen muss.

## Kalender (Vorbild AktionsDeck)

- Vorbild aus 7.2: `js/views/kalender.js` im öffentlichen Repo `fridaysforfuture-landau-pfalz/aktionsdeck-landau`.
  Dieses Repo ist in meiner Arbeitsumgebung nicht freigegeben, darum übernehme ich die Idee (Ansichten Liste, Monat, Woche, mehrtägige Termine,
  Filter nach Art) und schreibe die kleinen Rechenhelfer selbst neu: `js/ui/kalender.js` mit Monatsraster (Montag zuerst), Wochenanfang,
  Tage zählen und „Einträge eines Tages“ (wöchentliche Einträge mit „einmal anders“, plus Termine, ohne Urlaubs- und freie Tage).
  Die Schriftfarbe auf der Farbfläche muss nicht berechnet werden: Die Farben stehen fest in `css/base.css`, dazu passt `--schrift-auf-farbe`.
- **Jeder Eintrag zeigt in jeder Ansicht Uhrzeit, Titel und Raum** (Wunsch der Person; bei Zug die Strecke). Im engen Wochenraster steht der Raum
  in einer zweiten Zeile, notfalls gekürzt; der Tipp zeigt alles.
- **Liste:** die nächsten Wochen ab heute, je Tag eine Gruppe mit Uhrzeit, Titel, Raum und Farbstreifen der Art.
- **Monat:** Raster mit sieben Spalten; je Tag farbige Punkte oder kurze Balken, mehrtägige Termine als durchgehender Balken. Tipp auf einen Tag zeigt seine Einträge.
- **Woche:** am PC und im Querformat ein Raster mit Uhrzeiten (Montag bis Sonntag), im Hochformat eine Liste je Tag mit Hinweis „Für die Woche das Handy drehen“ (STAND.md 4).
  Ganztägige Einträge (Urlaub, Prüfungstag, Semesterferien) stehen als Leiste oben.
- **Filter nach Art:** eine Reihe Knöpfe mit Farbpunkt zum An- und Abschalten. Die Wahl gilt, solange die Seite offen ist.
- Vor und zurück blättern, Knopf „Heute“. Tipp auf einen Eintrag zeigt ihn; die Person hat dort „Bearbeiten“ (bei wöchentlichen Einträgen
  zusätzlich „Nur an diesem Tag ändern“ und „Fällt an diesem Tag aus“).
- Start: Ansicht Woche mit der aktuellen Woche (Entscheidung der Person).

## Schritt 5.0 Plan (0.4.11 → 0.5.0, Antworten 0.5.1)

- Dieser Plan. Sheet und Skript bleiben unverändert.

## Schritt 5.1 Blätter, Skript, Semester und Stundenplan (0.5.1 → 0.5.2)

- Skript wie oben (alle Uni-Aktionen auf einmal). `js/views/uni.js` statt Platzhalter, `js/app.js` meldet die Ansicht an.
- Semester anlegen, ändern, löschen; Auswahl oben.
- Unterreiter **Stundenplan**: je Wochentag eine Karte mit den Einträgen (Uhrzeit, Titel, Ort, Farbstreifen der Art). „+ Eintrag“ öffnet das Formular
  (Tag, von, bis, Titel, Art, Ort, Modul, Notiz). Tipp auf einen Eintrag zeigt ihn, „Bearbeiten“ öffnet das Formular (wie bei Besitz).
- Unterreiter Kalender und Module zeigen bis 5.2 und 5.4 „kommt bald“.

## Schritt 5.2 Termine, Kalender und ohne Netz (0.5.2 → 0.5.3)

- Formular für Termine (Titel, Art, Beginn, Ende, von, bis, Raum, Modul, Notiz).
- Unterreiter **Kalender** mit Liste, Monat und Woche wie oben, Filter nach Art, Semesterferien als Streifen, Farben der Arten in `css/base.css` (hell und dunkel).
- „Einmal anders“: Nur an diesem Tag ändern, Fällt aus, Wieder wie immer.
- Ohne Netz: Uni-Daten im Gerät (`thetadex_uni`), „Stand von …“, keine Knöpfe zum Ändern; „Abmelden“ löscht sie.
- STAND.md 4: neue Ausnahmen „Farben der Arten im Uni-Kalender“ und „Uni-Daten im Gerät“.

## Schritt 5.3 Arbeitsstunden (0.5.3 → 0.5.4)

- Die App rechnet aus allen Einträgen der Art `arbeit` (wöchentlich, einmalig und „einmal anders“, mit Uhrzeit), ohne Urlaubs- und freie Tage:
  **Stunden diese Woche** und **Stunden in diesem Monat**. Das steht oben in der Woche und im Monat des Kalenders
  und als Zeile „Arbeit: 12 h je Woche“ im Stundenplan. Rechnen nur im Gerät, nichts davon wird gespeichert.
- Zugfahrten zählen nicht zur Arbeit; sie stehen nur im Kalender und im Stundenplan.

## Schritt 5.4 Module und Master-Übersicht (0.5.4 → 0.5.5)

- Unterreiter **Module**: oben ein Fortschritt „48 von 120 ECTS“ (bestandene ECTS von `ects_ziel`), dazu Kacheln „bestanden“, „läuft“, „offen“
  mit Zahl der Module und Summe der ECTS; wie viele ECTS noch ganz ohne Modul fehlen. Darunter die Module nach Bereich,
  je Modul Status, ECTS, Semester und die nächste Prüfung (aus den Terminen mit diesem Modul, Datum und Uhrzeit). Filter nach Status.
- Modul anlegen, ändern, löschen. Im Termin-Formular und im Stundenplan ist das Modul eine Auswahl.

## Schritt 5.5 Kurse, Prüfungen und Termine jede Woche (0.5.5 → 0.5.6)

Anmerkungen der Person (31.10.2026): Stundenplan unnötig, Filter „Frei“ weg (gleich wie Urlaub), Module mit Kursen, Prüfungen bestanden,
alles mit einem Knopf bearbeiten, Fenster nur mit × oder Abbrechen schließen, Termine mit Zeitraum **und** Wochentagen.

**Sheet und Skript**
- Neues Blatt **`kurse`**: `modul_id` (Pflicht), `name` (80), `ects` (0 bis 60, halbe), `semester_id` (leer = wie das Modul), `tag` (1 bis 7),
  `von`, `bis` (Tag, von und bis alle oder keins), `ort` (Raum, 60), `dozent` (60), `pruefungsleistung` (Text, 80, zum Beispiel „Klausur“), `notiz`.
  Ein Kurs mit Tag und Uhrzeit steht jede Woche in der Vorlesungszeit seines Semesters im Kalender (Art Vorlesung). Höchstens 300 Kurse.
- `module` + Spalte **`pflicht`**: `pflicht`, `wahlpflicht` oder `auflage` (Auflage vom Bachelor). Vorgabe `pflicht`.
- `termine` + Spalten **`tage`** (Wochentage als Text, zum Beispiel `1,3` = Montag und Mittwoch), **`kurs_id`** und **`bestanden`** (wahr oder falsch, nur bei Prüfungen).
  Mit `tage` gilt ein Termin jede Woche an diesen Tagen vom ersten bis zum letzten Tag (der letzte Tag ist dann Pflicht).
  `stunde_id` („einmal anders“ oder „fällt aus“) zeigt jetzt auf einen Kurs oder einen Termin mit `tage`. Mit `kurs_id` bestimmt der Kurs das Modul.
  Die Art `frei` wird nicht mehr angenommen; alte Einträge zeigt die App als Urlaub. Höchstens 3000 Termine.
- **Umzug:** `einrichten` macht aus jedem Stundenplan-Eintrag einen Termin mit `tage` und **derselben id** (so zeigen „einmal anders“ und „fällt aus“ weiter darauf):
  Vorlesungen gelten in der Vorlesungszeit, Arbeit und Zug im ganzen Semester. Danach ist die alte Zeile weich gelöscht, nichts geht verloren.
  Einträge ohne gültiges Semester bleiben stehen, das Protokoll nennt ihre Zahl. Mehrmals ausführen schadet nicht.
- `uni` liefert jetzt Semester, Module, Kurse, Termine und `ects_ziel`; `uni_speichern` und `uni_loeschen` gehen für `semester`, `module`, `kurse`, `termine`.
- Löschen: Modul → seine Kurse (und deren „einmal anders“); Prüfungen und Termine bleiben, sie werden nur ausgetragen.
  Kurs oder Termin mit `tage` → seine „einmal anders“. Semester → bei Modulen und Kursen nur ausgetragen.

**App**
- Kalender: wöchentliche Einträge kommen aus Kursen und Terminen mit `tage`; an Urlaubstagen fallen beide weg. Tipp: „Nur an diesem Tag ändern“,
  „Fällt an diesem Tag aus“ und „Jede Woche ändern“ (öffnet Kurs oder Termin). Filter „Frei“ weg.
- Termin-Formular: Art, „Gehört zu Modul oder Kurs“, Titel, „Bestanden“ (nur Prüfung), erster und letzter Tag, **„Jede Woche an“ Mo bis So**
  mit Knöpfen „Vorlesungszeit“ und „Ganzes Semester“, Uhrzeit, Raum, Notiz.
- Module: eine Karte je Modul mit Stand, Pflicht, ECTS, Semester, nächster Prüfung, darunter die Kurse (ECTS, Tag und Zeit, Raum, Dozent*in,
  Prüfungsleistung) mit ihren Prüfungen. Je Modul, Kurs und Prüfung ein Knopf ✎; bei Prüfungen ein Knopf „bestanden?“ zum Umschalten.
  „+ Kurs“, „+ Prüfung“ (für einen Kurs) und „+ Prüfung fürs Modul“.
- **Fertig:** Ein Kurs ist fertig, wenn eine seiner Prüfungen bestanden ist (ein zweiter Versuch zählt). Ein Modul ist fertig, wenn jeder Kurs mit
  Prüfungsleistung oder Prüfung fertig ist (und Prüfungen ohne Kurs bestanden sind), mindestens einer, oder wenn die Person den Stand „Fertig“ wählt.
  Fertige Module zählen zu den ECTS. Ohne ECTS am Modul zählt die Summe seiner Kurse. Auflagen zählen nicht zu den 120 ECTS, sie stehen in einer eigenen Zeile.
- Fenster im Reiter Uni schließen nur mit × oder Abbrechen (kein Tipp daneben, keine Escape-Taste).

## Schritt 5.6 Abschluss (0.5.6 …)

- Anmerkungen der Person nach dem Testen (auch am Handy der Partnerin oder des Partners: nur lesen, keine Knöpfe), dann Etappe 5 abschließen:
  Plan in STAND.md einarbeiten, diese Datei löschen.

## Datenschutz und Sicherheit (für die ganze Etappe)

- Neue Daten: Semester, Stundenplan, Termine (mit Urlaub, Arbeit und Zug), Module (ohne Noten), das ECTS-Ziel. Zusammen zeigen sie, **wann die Person wo ist.**
  Das ist so gewollt (7.2: Partner*in sieht alle Zeiten), aber es ist ein Grund, keine Adressen zu speichern: Ort ist ein kurzer Text (Raum, Strecke), keine Anschrift.
  Keine Preise oder Tickets bei Zugfahrten, kein Lohn bei der Arbeit.
  Seit 5.5 gibt es ein Feld Dozent*in (Wunsch der Person): Namen stehen nur im Sheet, nie im Repo; das Feld ist freiwillig.
- Wer sieht sie: die Person (lesen und ändern) und Partner*in (nur lesen), beide nur mit Passwort. Das Skript prüft die Rolle bei jeder Aktion,
  die App blendet die Knöpfe nur zusätzlich aus. Partner*in sieht alles, auch die Module (Entscheidung der Person).
- Im Gerät: die zuletzt geladenen Uni-Daten (`thetadex_uni`), auch auf dem Handy der Partnerin oder des Partners. Wer das Handy entsperrt hat, sieht also
  den Stundenplan ohne Passwort. Dafür ist er im Laden, in der Bahn und ohne Netz da (Wunsch der Person). „Abmelden“ löscht die Daten.
- Keine neuen Adressen nach außen, die Content-Security-Policy bleibt gleich. Keine Bibliothek für den Kalender.
- Alle Texte aus dem Sheet zeigt die App nur mit `textContent`. Böse Eingaben: Längen, Daten und Werte prüft das Skript, Formeln verhindert `bereinigeText_`.

## Von Hand (Person, in Schritt 5.1, steht dann genau im Pull Request)

1. Sheet „Gemeinsam“ öffnen → Erweiterungen → Apps Script → `Code.gs` durch die neue Fassung aus dem Repo ersetzen.
2. Funktion `einrichten` einmal ausführen: Im Protokoll steht je neuem Blatt „angelegt“ (`semester`, `stundenplan`, `termine`, `module`, `uni_einstellungen`), bei den alten „vollständig“.
3. Bereitstellen → Bereitstellungen verwalten → Stift → „Neue Version“ → Bereitstellen. Die Adresse bleibt gleich, in der App ist nichts einzutragen.

## Antworten der Person (30.10.2026)

1. Stundenplan nur wöchentlich: ja.
2. Vorlesungen nur in der Vorlesungszeit, Arbeit und Zug im ganzen Semester, an Urlaubs- und freien Tagen fällt alles aus: ja.
   Die Semesterzeiten trägt die Person in der App ein (Formular „+ Semester“).
3. Arbeitszeiten sind an jedem Wochentag anders und ändern sich einmalig: je Tag ein Eintrag, dazu „einmal anders“ (Spalte `stunde_id`).
4. Keine Noten (stehen auf der Uni-Plattform).
5. Partner*in sieht alles, auch die Module.
6. Ziel 120 ECTS (`uni_einstellungen`), die ECTS der Module trägt die Person ein.
7. Uni auch ohne Netz: ja (Uni-Daten im Gerät).
8. Start: Kalender mit der aktuellen Woche.
- Dazu: Jeder Eintrag zeigt im Kalender neben der Zeit auch den Raum.

## Rückfragen

Keine offenen. Antworten zu 5.5 (31.10.2026):
1. Auflagen vom Bachelor zählen **nicht** zu den 120 ECTS. Sie müssen nur bestanden sein; ECTS dafür sind freiwillig.
2. Fenster in Einkauf und Besitz bleiben wie sie sind (Tipp daneben schließt weiter); nur im Reiter Uni gehen sie nur mit × oder Abbrechen zu.
