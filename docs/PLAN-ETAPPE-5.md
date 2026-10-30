# Plan Etappe 5 „Uni“ (0.5.x)

Ziel: Ein Reiter Uni mit Semestern, Stundenplan, Kalender (Vorlesungen, Prüfungen, Urlaub, Semesterferien, Arbeit, Zug),
berechneten Arbeitsstunden und einer Master-Übersicht der Module.
Die Daten liegen im bestehenden Sheet „Gemeinsam“ mit dem Skript `gemeinsam` (vier neue Blätter).
Regeln: STAND.md 1.2, 2.2, 2.3, 4 („Wer sieht was“, „Stundenplan am Handy“) und 7.2.
Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

Was gleich bleibt:
- Tracking, Finanzen, Döner, Besitz und Einkauf bleiben unverändert. Die Einkauf-Blätter und -Aktionen im Skript `gemeinsam` werden nicht angefasst.
- Keine neuen Passwörter, keine neue Script-Adresse: Uni nutzt die schon eingetragene Adresse `gemeinsam`.
  Der Reiter Uni erscheint schon heute mit dieser Adresse (Schritt 4.5) und zeigt bis 5.1 den Platzhalter.
- Im Repo stehen keine Veranstaltungen, Module, Orte, Arbeitgeber, Strecken oder Noten, auch nicht in Beispielen oder Pull-Request-Texten.

Was im Gerät liegt: **nichts Neues.** Die Uni-Daten hält die App nur im Arbeitsspeicher, solange die Seite offen ist (wie bei Besitz).
Ohne Netz zeigt der Reiter eine klare Meldung. (Wer den Stundenplan auch ohne Netz braucht: siehe Rückfrage 7.)

## Aufbau des Reiters

- Überschrift „Uni“ mit einem bunten Emoji davor (Vorschlag 🎓, wie 📦 bei Besitz und 🛒 bei Einkauf).
- Oben eine Auswahl **Semester** (Vorgabe: das Semester, in dem heute liegt, sonst das neueste). Daneben „+ Semester“ und „Neu laden“.
- Drei Unterreiter (Umschalter wie bei Besitz und Einkauf): **Kalender** (Vorgabe), **Stundenplan**, **Module**.
- Knöpfe in der Uni-Farbe `#C9784A` mit dunkler Schrift (`--schrift-auf-farbe`, wie bei Döner und Einkauf).
- Am Handy Karten und Listen, am PC dieselben Karten breiter; die Woche als Raster mit Uhrzeiten (siehe Kalender).
- Für Partner*in: dieselbe Ansicht ohne Knöpfe zum Anlegen, Ändern und Löschen (die Rolle kommt mit der Antwort des Skripts, die App speichert sie nicht).

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
| `frei` | Feiertag, vorlesungsfrei | Termin | Grau |
| `ferien` | Semesterferien | berechnet aus dem Semester, nicht eingetragen | Sand `#D4B483`, nur als heller Streifen |
| `sonstiges` | Sonstiges | Termin | Grau, dunkler |

Die genauen Farbwerte (vor allem Rot und Grau, hell und dunkel) legt Schritt 5.2 fest. Kein Blau (wie bei den Bereichsfarben).

## Sheet „Gemeinsam“: vier neue Blätter (Kopfzeile in Zeile 1)

Jedes Blatt hat zusätzlich `id, erstellt_am, geaendert_am, geloescht` (STAND.md 2.3). Löschen ist weich.
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
| `titel` | Veranstaltung, „Arbeit“, „Zug nach …“ | ja | 80 Zeichen |
| `art` | `vorlesung`, `arbeit` oder `zug` | ja | feste Liste |
| `ort` | Raum, Strecke | nein | 60 Zeichen |
| `modul_id` | zu welchem Modul (nur Vorlesung) | nein | muss es geben |
| `notiz` | frei, zum Beispiel „Übung“ | nein | 200 Zeichen |

Wann ein wöchentlicher Eintrag gilt (Vorschlag, siehe Rückfrage 2): Vorlesungen nur in der Vorlesungszeit, Arbeit und Zug im ganzen Semester.
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
| `notiz` | frei | nein | 200 Zeichen |

Termine gehören zu keinem Semester; der Kalender zeigt sie einfach an ihrem Datum.

**Blatt `module`** – für die Master-Übersicht:
| Spalte | Inhalt | Pflicht | Grenze |
| --- | --- | --- | --- |
| `name` | Modulname | ja | 80 Zeichen |
| `kuerzel` | Modulnummer oder Kürzel | nein | 20 Zeichen |
| `bereich` | Gruppe, zum Beispiel Pflicht- oder Wahlbereich | nein | 40 Zeichen |
| `ects` | Leistungspunkte | nein | 0 bis 60, halbe erlaubt |
| `status` | `offen`, `laeuft`, `bestanden` | ja, Vorgabe `offen` | feste Liste |
| `semester_id` | in welchem Semester belegt oder geplant | nein | muss es geben |
| `note` | Note (siehe Rückfrage 4) | nein | 1,0 bis 5,0 |
| `notiz` | frei | nein | 200 Zeichen |

## Skript `apps-script/gemeinsam/Code.gs` (Ergänzung, gleicher Aufbau wie Einkauf)

- `BLAETTER_` bekommt die vier Blätter; `einrichten` legt sie an, wie in Etappe 4 (vorhandene Blätter und Daten bleiben).
- **Rechte:** Neue lesende Aktion `uni` für beide Rollen. Die schreibenden Uni-Aktionen stehen nur bei `person` in `ERLAUBT_`.
  Partner*in bekommt beim Schreiben „Nicht erlaubt“, auch wenn jemand die App umgeht. Was `uni` für Partner*in liefert: siehe Rückfrage 5.
- Aktionen (bewusst wenige, eine Prüfregel je Blatt statt eigener Aktionen je Blatt):
  | Aktion | Was sie tut | Wer |
  | --- | --- | --- |
  | `uni` | alle Semester, Stundenplan, Termine und Module in einer Antwort, dazu die Rolle | person, partner |
  | `uni_speichern` | `blatt` (`semester`, `stundenplan`, `termine`, `module`) und ein Eintrag; neu ohne `id`, ändern mit `id` und `geaendert_am` (Schutz vor Überschreiben wie bei Besitz) | person |
  | `uni_loeschen` | `blatt` und `id`, weich | person |
- Löschen eines Semesters löscht seine Stundenplan-Einträge mit (weich). Löschen eines Moduls lässt Termine und Stundenplan stehen, nur `modul_id` wird geleert.
- Jede Eingabe wird geprüft (Art, Länge, Datum, Uhrzeit, feste Listen, vorhandene ids) und mit `bereinigeText_` geschützt. Schreiben mit `LockService`.
  Höchstens 200 Stundenplan-Einträge je Semester (Schutz vor Versehen).
- Das ganze Skript kommt in Schritt 5.1 auf einmal, damit die Person `Code.gs` nur einmal einfügen muss.

## Kalender (Vorbild AktionsDeck)

- Vorbild aus 7.2: `js/views/kalender.js` im öffentlichen Repo `fridaysforfuture-landau-pfalz/aktionsdeck-landau`.
  Dieses Repo ist in meiner Arbeitsumgebung nicht freigegeben, darum übernehme ich die Idee (Ansichten Liste, Monat, Woche, mehrtägige Termine,
  Filter nach Art) und schreibe die kleinen Rechenhelfer selbst neu: `js/ui/kalender.js` mit Monatsraster (Montag zuerst), Wochenanfang,
  Tage zählen und „Termine eines Tages“ (wöchentliche Einträge plus Termine, ohne Urlaubs- und freie Tage).
  Die Schriftfarbe auf der Farbfläche muss nicht berechnet werden: Die Farben stehen fest in `css/base.css`, dazu passt `--schrift-auf-farbe`.
- **Liste:** die nächsten Wochen ab heute, je Tag eine Gruppe mit Uhrzeit, Titel, Ort und Farbstreifen der Art.
- **Monat:** Raster mit sieben Spalten; je Tag farbige Punkte oder kurze Balken, mehrtägige Termine als durchgehender Balken. Tipp auf einen Tag zeigt seine Einträge.
- **Woche:** am PC und im Querformat ein Raster mit Uhrzeiten (Montag bis Sonntag), im Hochformat eine Liste je Tag mit Hinweis „Für die Woche das Handy drehen“ (STAND.md 4).
  Ganztägige Einträge (Urlaub, Prüfungstag, Semesterferien) stehen als Leiste oben.
- **Filter nach Art:** eine Reihe Knöpfe mit Farbpunkt zum An- und Abschalten. Die Wahl gilt, solange die Seite offen ist.
- Vor und zurück blättern, Knopf „Heute“. Tipp auf einen Eintrag zeigt ihn; die Person hat dort „Bearbeiten“.

## Schritt 5.0 Plan (0.4.11 → 0.5.0)

- Dieser Plan. Sheet und Skript bleiben unverändert.

## Schritt 5.1 Blätter, Skript, Semester und Stundenplan (0.5.0 → 0.5.1)

- Skript wie oben (alle Uni-Aktionen auf einmal). `js/views/uni.js` statt Platzhalter, `js/app.js` meldet die Ansicht an.
- Semester anlegen, ändern, löschen; Auswahl oben.
- Unterreiter **Stundenplan**: je Wochentag eine Karte mit den Einträgen (Uhrzeit, Titel, Ort, Farbstreifen der Art). „+ Eintrag“ öffnet das Formular
  (Tag, von, bis, Titel, Art, Ort, Modul, Notiz). Tipp auf einen Eintrag zeigt ihn, „Bearbeiten“ öffnet das Formular (wie bei Besitz).
- Unterreiter Kalender und Module zeigen bis 5.2 und 5.4 „kommt bald“.

## Schritt 5.2 Termine und Kalender (0.5.1 → 0.5.2)

- Formular für Termine (Titel, Art, Beginn, Ende, von, bis, Ort, Modul, Notiz).
- Unterreiter **Kalender** mit Liste, Monat und Woche wie oben, Filter nach Art, Semesterferien als Streifen, Farben der Arten in `css/base.css` (hell und dunkel).
- STAND.md 4: neue Ausnahme „Farben der Arten im Uni-Kalender“.

## Schritt 5.3 Arbeitsstunden (0.5.2 → 0.5.3)

- Die App rechnet aus allen Einträgen der Art `arbeit` (wöchentlich und einmalig, mit Uhrzeit), ohne Urlaubs- und freie Tage:
  **Stunden diese Woche** und **Stunden in diesem Monat**. Das steht oben in der Woche und im Monat des Kalenders
  und als Zeile „Arbeit: 12 h je Woche“ im Stundenplan. Rechnen nur im Gerät, nichts davon wird gespeichert.
- Zugfahrten zählen nicht zur Arbeit; sie stehen nur im Kalender und im Stundenplan.

## Schritt 5.4 Module und Master-Übersicht (0.5.3 → 0.5.4)

- Unterreiter **Module**: oben Kacheln „bestanden“, „läuft“, „offen“ mit Zahl der Module und Summe der ECTS (siehe Rückfrage 6), darunter die Module nach Bereich,
  je Modul Status, ECTS, Semester und die nächste Prüfung (aus den Terminen mit diesem Modul, Datum und Uhrzeit). Filter nach Status.
- Modul anlegen, ändern, löschen. Im Termin-Formular und im Stundenplan ist das Modul eine Auswahl.

## Schritt 5.5 Abschluss (0.5.4 …)

- Anmerkungen der Person nach dem Testen (auch am Handy der Partnerin oder des Partners: nur lesen, keine Knöpfe), dann Etappe 5 abschließen:
  Plan in STAND.md einarbeiten, diese Datei löschen.

## Datenschutz und Sicherheit (für die ganze Etappe)

- Neue Daten: Semester, Stundenplan, Termine (mit Urlaub, Arbeit und Zug), Module. Zusammen zeigen sie, **wann die Person wo ist.**
  Das ist so gewollt (7.2: Partner*in sieht alle Zeiten), aber es ist ein Grund, keine Adressen zu speichern: Ort ist ein kurzer Text (Raum, Strecke), keine Anschrift.
  Keine Preise oder Tickets bei Zugfahrten, kein Lohn bei der Arbeit, keine Namen anderer Personen (zum Beispiel Dozierende) nötig.
- Wer sieht sie: die Person (lesen und ändern) und Partner*in (nur lesen), beide nur mit Passwort. Das Skript prüft die Rolle bei jeder Aktion,
  die App blendet die Knöpfe nur zusätzlich aus. Was Partner*in bei den Modulen sieht: Rückfrage 5.
- Im Gerät: nichts Neues. Abmelden ändert sich nicht.
- Keine neuen Adressen nach außen, die Content-Security-Policy bleibt gleich. Keine Bibliothek für den Kalender.
- Alle Texte aus dem Sheet zeigt die App nur mit `textContent`. Böse Eingaben: Längen, Daten und Werte prüft das Skript, Formeln verhindert `bereinigeText_`.

## Von Hand (Person, in Schritt 5.1, steht dann genau im Pull Request)

1. Sheet „Gemeinsam“ öffnen → Erweiterungen → Apps Script → `Code.gs` durch die neue Fassung aus dem Repo ersetzen.
2. Funktion `einrichten` einmal ausführen: Im Protokoll steht je neuem Blatt „angelegt“ (`semester`, `stundenplan`, `termine`, `module`), bei den alten „vollständig“.
3. Bereitstellen → Bereitstellungen verwalten → Stift → „Neue Version“ → Bereitstellen. Die Adresse bleibt gleich, in der App ist nichts einzutragen.

## Rückfragen

1. **Rhythmus:** Reicht „jede Woche“ für den Stundenplan? Was nur alle zwei Wochen oder einzeln stattfindet, wäre dann ein Termin. (Vorschlag: ja, das hält es einfach.)
2. **Wann gelten wöchentliche Einträge?** Vorschlag: Vorlesungen nur in der Vorlesungszeit, Arbeit und Zug im ganzen Semester, an Urlaubs- und freien Tagen fällt alles aus. Passt das?
3. **Arbeit und Zug** sowohl als wöchentlicher Eintrag im Stundenplan als auch als einzelner Termin: passt das? Oder gibt es Arbeit nur mit wechselnden Zeiten (dann nur Termine)?
4. **Noten:** Sollen Noten gespeichert werden? Vorschlag: freiwillig, eine Note je Modul; ein Schnitt wird nur angezeigt, wenn du ihn möchtest.
5. **Partner*in und Module:** Vorschlag: Partner*in sieht Kalender und Stundenplan mit allen Zeiten, aber nicht die Module und Noten (weniger Daten, 1.2). Oder alles?
6. **Ziel des Masters:** Soll die Übersicht eine Soll-Zahl kennen (zum Beispiel 120 ECTS)? Vorschlag: ohne Soll-Zahl, die Summe ergibt sich aus den eingetragenen Modulen. Mit Soll-Zahl käme eine Spalte `ects_soll` ins Blatt `semester` oder ein kleines Blatt `uni_einstellungen`.
7. **Ohne Netz:** Vorschlag: Der Reiter Uni braucht Netz (wie Besitz), im Gerät liegt nichts. Soll der Stundenplan auch ohne Netz da sein? Dann läge er zusätzlich im Gerät (neue Ausnahme in STAND.md 4).
8. **Startansicht:** Vorschlag: Unterreiter Kalender in der Ansicht Woche mit der aktuellen Woche. Oder lieber Liste oder Stundenplan?
