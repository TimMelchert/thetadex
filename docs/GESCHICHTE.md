# GESCHICHTE – Thetadex

Rückblick: was wann gebaut wurde. Diese Datei liest der Agent nur bei Bedarf, nicht bei jeder Aufgabe.
Die gültigen Regeln stehen in `docs/STAND.md` (vor allem Abschnitt 4). Bei Widerspruch gilt `docs/STAND.md`.
Bis Version 1.3.27 stand dieser Text in `docs/STAND.md` (Teil 1 in 3.1, Teil 2 als 7.2, Teil 3 als 8).

---

## Teil 1: Stand je Etappe (ausführlich, früher STAND.md 3.1)

- Neues Repo `thetadex` angelegt. Schritt 0.0 erledigt (Sheets kopiert, alte Repos als ZIP gesichert).
- Schritt 0.1: leeres App-Gerüst mit Reiterleiste (Platzhalter), Ersteinrichtung, Info, Hell- und Dunkelmodus, Hinweis „Neue Version da“.
- Etappe 1: Symbole für alle Reiter (1.1). Döner-Skript und Reiter mit Rangliste, Einzelheiten, Bewerten und Teilen-Link (1.2).
  Döner-Skript: Aktionen `liste`, `bewerten`, `ping`, ohne Passwort. Schnell (drei Werte) oder ausführlich nach Kriterien (1.3).
- Etappe 2: Reiter Tracking (Eingabe und Übersicht je Jahr und Monat mit farbigen Zellen) und Finanzen (Kontostände, Buchen,
  Auswertung mit Chart.js). Felder, Zwecke, Kategorien, Rückzahlungen und Farbregeln stehen im Blatt `Einstellungen` des jeweiligen Sheets.
- Etappe 3 (fertig): Einstellungen mit Aussehen (3.1). Sheet „Leben“ mit Skript `leben` (3.2): Blatt `besitz`, Aktionen `ping`, `liste`,
  `speichern` (neu ohne `id`, ändern mit `id` und `geaendert_am` als Schutz vor Überschreiben), `loeschen` (weich). Funktion `einrichten`.
  Reiter Besitz: Liste je Ort (PC Tabelle, Handy Karten), Hinzufügen; Ändern und Löschen per Tipp auf eine Sache, Suche, Filter nach Ort und Kategorie, Sortieren am PC (3.3).
  Zubehör (3.4): Spalte `gehoert_zu`, eine Ebene, eingerückt und aufklappbar unter der Hauptsache.
  Bild (3.5): Spalte `bild` (Drive-Datei-Kennung), Aktion `bild` (nur Bilder, die bei einer Sache stehen), Ordner „Thetadex Besitz“.
  Nachbesserungen (3.6): Tipp auf eine Sache zeigt erst ihre Daten mit Bild, „Bearbeiten“ öffnet das Formular; Formular schließt nach dem Speichern.
  Anzahl 0 ist ausgeblendet (außer mit Zubehör, Haken „Auch Items mit Anzahl 0 zeigen“). Spalte `ausgeliehen_an` mit Filter.
  Ab 0.4.2: Spalte `ausgeliehen_anzahl` (wie viele Stück ausgeliehen sind, leer = alle); die Übersicht zeigt keine Balken mehr.
  Unterreiter „Liste“ und „Übersicht“ (Sachen, Stück, ausgeliehen; je Kategorie, je Ort, an wen). Auswahlfelder öffnen die Liste beim Tipp ins Feld.
- Etappe 4 (fertig): Sheet „Gemeinsam“ mit Skript `gemeinsam` (4.1): Blätter `lebensmittel`, `einkaufsliste`, `gerichte`, `zutaten`, `vorrat`.
  Zwei Passwörter (`APP_PIN` = Rolle `person`, `PARTNER_PIN` = Rolle `partner`, mindestens 12 Zeichen); das Skript prüft je Aktion, was die Rolle darf.
  Aktionen: `ping` (mit Rolle), `alles`, `lebensmittel_speichern`, `lebensmittel_loeschen`, `auf_liste`, `liste_aendern`, `abhaken` (erhöht gepflegten Vorrat),
  `gericht_speichern`, `gericht_loeschen`, `vorrat_speichern`, `vorrat_loeschen`. Funktion `einrichten`.
  Ab 1.3.4 (Rezepte): `rezept_bild` (ein Bild anhängen) und `bild` (Bild lesen, nur von Rezepten); `alles` meldet `rezepte_felder: true`.
  Reiter Einkauf (4.1): Unterreiter „Einkaufsliste“ (nach Abteilung, großer Haken) und „Lebensmittel“ (Suche, antippen → Anzahl → auf die Liste, neu anlegen aus der Suche).
  Ohne Netz (4.2): Einkaufsliste im Gerät (`thetadex_einkaufsliste`), Abhaken geht immer, wartende Haken in `thetadex_einkauf_offen`,
  gesendet beim Öffnen, beim Zurückkehren in die App und bei „wieder online“.
  Nachbesserung 0.4.5 (Wunsch der Person): Start im Unterreiter „Lebensmittel“; Lebensmittel ankreuzen (bleibt bei Suche), oben „Auf die Einkaufsliste“
  öffnet ein Fenster mit allen angekreuzten und je einer Menge; Tipp auf den Namen ändert das Lebensmittel. Auf der Liste steht die Menge rechts in der Zeile.
  Abgehakte bleiben grau und durchgestrichen (wieder lösbar, im Gerät `thetadex_einkauf_haken`), bis „Einkauf fertig“ sie sendet.
  Gerichte (4.3): Unterreiter „Gerichte“ mit Suche; Gericht mit Name, Notiz, Rezept-Link (nur https) und Zutaten (Suche, neue Lebensmittel gleich anlegen).
  Gericht antippen → Zutaten angehakt, Menge änderbar → „Auf die Liste“ (mit `gericht_id`). Einkaufsliste „Nach Abteilung“ oder „Nach Gericht“
  (Gruppe „Einzeln“ für alles ohne Gericht, „Gericht von der Liste nehmen“).
  Vorrat (4.4, freiwillig): im Formular des Lebensmittels „Zuhause“ mit je Ort einer Zeile (Ort, Menge ab 0, ×, „+ Ort“).
  Hinweis „zuhause: 2 Keller, 1 Kühlschrank“ auf der Einkaufsliste, bei Lebensmitteln und bei Zutaten. Zutaten mit genug Vorrat sind nicht angehakt.
  Haken „Vorrat“ bei Lebensmitteln: nur was zuhause ist, nach Ort. Abhaken erhöht gepflegten Vorrat (macht das Skript).
  Ab 0.4.11 (Wunsch der Person): Auswahl „Alle Abteilungen“ links von „+ Neues Lebensmittel“ filtert nach Abteilung (aus den vorhandenen, dazu „Ohne Abteilung“).
  Nachbesserung 0.4.9 (Wunsch der Person): bei Lebensmitteln Haken „Vorrat“ rechts neben der Suche, „+ Neues Lebensmittel“ und „Neu laden“
  gleich unter der Suche; im Gericht-Formular „+ Neues Lebensmittel“ mit Name, Abteilung und Einheit, kommt gleich als Zutat dazu.
  Gemeinsam nutzen (4.5): Reiter erscheinen nach eingetragenen Script-Adressen. „Verbindung prüfen“ zeigt bei `gemeinsam`, ob als Hauptperson oder Partner*in angemeldet.
- Etappe 5 (fertig): Reiter Uni im Sheet „Gemeinsam“ (Skript `gemeinsam`), Regeln in 4 „Uni, Sheet ‚Gemeinsam‘“.
  Semester (5.1), Kalender mit Woche, Monat, Liste, Filter nach Art, „einmal anders“ und ohne Netz (5.2), Arbeitsstunden (5.3),
  Module mit Master-Übersicht (5.4). Umbau nach Anmerkungen (5.5): kein Stundenplan mehr (in `termine` umgezogen), Kurse je Modul,
  Termine jede Woche an bestimmten Tagen, Prüfungen „bestanden“, Auflagen getrennt. 5.6: Art der Prüfung bei der Prüfung, ein Knopf „+ Prüfung“,
  Prüfung gleich beim Anlegen von Modul und Kurs, Woche am Handy als Raster, Art Hobby. 5.7: Hobby dunkelgrün, Text in den Kästen gekürzt, Linie „jetzt“.
- Etappe 6 (fertig, Regeln in 4 „Pen & Paper, Sheet ‚DSA‘“): Sheet „DSA“ mit Skript `dsa` (6.1): Blätter `boegen`, `eintraege`, `verlauf`, ab 0.6.8 `abenteuer`, `sessions`; alle Aktionen der Etappe
  (`ping`, `liste`, `bogen_speichern`, `bogen_loeschen`, `eintrag_speichern`, `eintrag_loeschen`, `verlauf_neu`, `bild`, `freigabe`,
  `abenteuer_speichern`, `abenteuer_loeschen`, `session_speichern`, `session_loeschen`, ab 0.6.9 `abenteuer_bild`, `abenteuer_bild_weg`,
  ohne Passwort `geteilt`, auch mit `bild` für ein Abenteuer-Bild). Funktion `einrichten`.
  Reiter Pen & Paper: Bogen wählen und anlegen (DSA oder DnD, gleiche Vorlage), Kopf, Eigenschaften, Basiswerte und Zähler ändern, Zähler und Eigenschaften kleben oben.
  Listen (6.2): Vor- und Nachteile, Sonderfertigkeiten und Gaben (als Knöpfe nebeneinander), Talente nach Gruppe (feste Reihenfolge der Gruppen), Besitz nach Ort;
  Tipp öffnet das Formular, „+“ legt an, „Speichern und weiter“ für viele Einträge hintereinander, Sortierung nach „Reihenfolge“, sonst nach Name.
  Zauber (6.3): je Zauber aufklappbar mit allen Feldern, Wirkung, Modifikationen (je Zeile eine, höchstens 20) und Haken „Hauszauber“.
  Waffen (6.3): Tabelle mit TP, AT, PA, INI, BE, Reichweite; am Handy als Karten, leere Werte fallen dort weg.
  Verlauf (6.4): Tipp auf einen Zähler oben öffnet „+“ oder „−“, Betrag (Geld mit einem Feld je Münze D, S, H, K), Notiz; bei Punkten mit Höchstwert Knopf „Voll“.
  „+“ geht nie über den Höchstwert (die App speichert nur bis voll), Geld kann nicht unter 0. AP: „+ gesammelt“, „− ausgegeben“; oben nur gesammelte, im Fenster auch „frei“.
  Karte „Verlauf“: neueste Änderung oben, Filter je Zähler, erst 30, dann „Alle zeigen“. Änderungen löschen nur im Sheet (wie ein Kassenbuch).
  Würfel (6.5): schwebender Knopf „🎲 Würfeln“ unten rechts, Anzahl 1 bis 20, W4 bis W20, Einzelwürfe und Summe, letzte 10 Würfe nur im Arbeitsspeicher (`js/ui/wuerfel.js`).
  Bild (6.5): im Kopf-Fenster hochladen (App verkleinert) oder Drive-Link, Ordner „Thetadex DSA“; steht links neben dem Kopf. Wird nur mitgeschickt, wenn es sich ändert.
  Teilen (6.6): Knopf „🔗 Teilen“ (heißt „🔗 Geteilt“, wenn ein Link gilt): „Link erstellen“, „Link kopieren“, „Senden …“ (wenn das Gerät es kann),
  „Neuen Link erstellen“, „Nicht mehr teilen“. Den Schlüssel gibt das Skript nur beim Erstellen heraus; die App merkt ihn in `thetadex_dsa_links`.
  Wurde der Link an einem anderen Gerät erstellt, hilft nur „Neuen Link erstellen“. Die Adresse `#/bogen/<skript>/<schluessel>` nutzt dieselbe Ansicht
  (`js/views/dsa.js`, Route `bogen` in `js/app.js`) im Modus „nur lesen“: ohne Passwort, ohne Verlauf, ohne Knöpfe zum Ändern, Tipp auf einen Eintrag zeigt ihn nur an.
  Bogen Faëlandel (6.7): Tabellen zum Einfügen ins Sheet liegen in den Projektdateien (`etappe-6/bogen-faelandel/`), nie im Repo. Die anderen Bögen trägt die Person in der App ein.
  Aussehen (0.6.7, Wunsch der Person): Marke DSA/DnD und „🔗 Teilen“ in einer Zeile über dem Namen; der Name ist eine große fette Überschrift
  mit Pfeil, darüber liegt unsichtbar die Bogen-Auswahl. Geld als Münzen untereinander (Gold D, Silber S, Bronze H, Eisen K, nur mit Anzahl; am PC mit Namen).
  Bild links: der Kasten hat das Seitenverhältnis des Bildes, so hoch wie der Kopf-Text (am Handy höchstens gut ein Drittel breit, dann niedriger).
  Nie beschnitten, nie unscharf; Tipp zeigt es groß. Die Karte Kopf hat keine Überschrift mehr, ✎ steht unten rechts.
  Schalter „Charakterbogen | Abenteuer | DM“ (0.6.8, am Handy „Bogen“, Teilen nur 🔗) links in der Zeile, rechts davon die Marke DSA (nur weiß umrandet, 0.6.9) und Teilen;
  die Wahl bleibt (`thetadex_dsa_modus`). Bei Abenteuer fehlt die klebende Leiste mit Zählern und Eigenschaften (0.6.9).
  Abenteuer: je Charakter (genau einer je Abenteuer), Titel und Beschreibung, darin Sessions mit Datum und Text, neueste oben. „+“ an der Karte = neue Session,
  Tipp auf eine Session = bearbeiten. DM: Textfeld „Abenteuerideen“ und Abenteuer, die die Person leitet (Titel, Text direkt in der Karte, keine Sessions),
  Haken „Abenteuer abgeschlossen“ speichert sofort und schiebt es unten in die zuklappbare Karte „Abgeschlossene Abenteuer“. DM geht auch ohne Bogen.
  Der geteilte Link zeigt Bogen und Abenteuer des Charakters (nur lesen), nie DM.
  Bilder je gespieltem Abenteuer (0.6.9): „🖼 Bild anhängen“ (mehrere auf einmal, App verkleinert), Vorschau als Raster, Tipp zeigt groß,
  dort „Bild entfernen“ (Datei bleibt im Drive). Im geteilten Link zu sehen, ohne Entfernen.
- Etappe 7 (fertig): Umstieg von den alten Apps am 1.11.2026 (alte Bereitstellungen archiviert, alte Repos und Zweige gelöscht).
  Aufgeräumt nach Bericht (`pruefung/ungenutztes-bericht.md` in den Projektdateien): Platzhalter-Ansicht, Feld `etappe`, Adresse `#/einrichtung`,
  alte Art „frei“, Stundenplan-Umzug im Skript `gemeinsam`, Kommentare auf gelöschte Pläne, kurze `README.md`.
- Etappe 8 (fertig): Prüfungen Sicherheit, Datenschutz, Geschwindigkeit, Barrierefreiheit, Rechtliches und Datensicherung, Berichte nur in den
  Projektdateien (`pruefung/`). Behebungen in 0.8.0 bis 0.8.4 (Pull Request #65), Einzelheiten in Teil 3. Version 1.0.0.
- Etappe 9 (fertig): Kontowecker-SMS über die Handy-App „SMS to URL Forwarder“ ins Blatt `SMS` des Finanz-Sheets, im Reiter Finanzen „Noch zuordnen“
  mit Vorschlag zum Bestätigen (Pull Requests #67 bis #70). Festlegungen in 4 („Kontowecker“).
- Etappe 11 (fertig, Pull Requests #83 bis #87): 11.1 (1.3.3) Gerichte heißen in der App „Rezepte“ und stehen bei Lebensmitteln hinter dem Umschalter „Einzeln | Rezepte“; Unterreiter nur noch Einkaufsliste und Lebensmittel; Einkaufsliste „Nach Rezept“. Sheet und Skript unverändert (`gerichte`).
  11.2 (1.3.4): Skript `gemeinsam` mit neuen Spalten `text`, `personen`, `ergibt`, `bilder` im Blatt `gerichte`, Aktionen `rezept_bild` und `bild`,
  Ordner „Thetadex Rezepte“. App: Rezepttext, „für … Personen“, „ergibt“ und „Personen diesmal“ (rechnet Mengen um). Die alte Notiz wandert beim Bearbeiten in den Rezepttext.
  11.3 (1.3.5): Bilder im Rezept: Vorschau nebeneinander (Tipp zeigt groß), beim Bearbeiten hochladen (mehrere), Drive-Link einfügen, × entfernt (Datei bleibt im Drive). Skript unverändert.
  11.4 (1.3.6): Abschluss, Prüfung Sicherheit und Datenschutz (Bericht `pruefung/rezepte-bericht.md` in den Projektdateien), Plan eingearbeitet.
  Nachbesserung 1.3.7: Rezepte klappen in der Liste auf statt im Fenster (Wunsch der Person, war beim Planen untergegangen).
  Nachbesserung 1.3.8: Mengen ab 0,01 mit zwei Stellen nach dem Komma (Gewürze, Esslöffel), in Rezepten, auf der Liste und im Vorrat. Skript `gemeinsam` geändert.
  Nachbesserung 1.3.9: Lebensmittel „Einzeln“ nach Abteilung gruppiert wie die Einkaufsliste (A–Z, ohne Abteilung zuletzt).
  Nachbesserung 1.3.10: Packung je Lebensmittel und Menge im Rezept in g oder ml (Spalten `packung`, `rezept_menge`). Skript `gemeinsam` geändert.
  Nachbesserung 1.3.17: Abteilungen in der Reihenfolge im Laden (Blatt `laden_reihenfolge`, Aktion `reihenfolge_speichern`). Skript `gemeinsam` geändert.
  Nachbesserung 1.3.18: Pfeile ^ und v für die Reihenfolge im Laden, auch bei Lebensmittel „Einzeln“. Nur App.


---

## Teil 2: Plan Version 1 (früher STAND.md 7.2)


Jede Etappe bekommt vor dem ersten Schritt ihren eigenen Plan `docs/PLAN-ETAPPE-<n>.md` mit Schritten, genauen Spalten und Prüflisten.
Die Etappen bauen nacheinander auf. Nichts davon ist dringend (Person, 29.10.2026). Die Reihenfolge der Etappen 3 bis 6 kann die Person tauschen. Döner kam auf Wunsch der Person vor den Umzug (29.10.2026).

- **Etappe 1 „Döner Landau“ (0.1.x) – fertig.** So ist es gebaut (Schritte 1.1 bis 1.6, Pull Requests #7 bis #12):
  - Überschrift „Veganes Döner-Rating Landau“ mit 🥙. Knöpfe in der Döner-Farbe, „+ Bewerten“ rechts oben klappt das Formular auf
    (× schließt, Eingaben bleiben; „Abbrechen“ verwirft). Bewerten mit 10 kleinen 🥙 (antippen = ganz, nochmal = halb, × = nicht bewerten).
    Laden als Auswahlliste mit „+ Neuer Laden …“.
  - Umschalter „Rangliste / Vergleich“. Rangliste: Kachel je Laden mit Zahl der Bewertungen, eingerückte Einzelheiten,
    „Kriterien“-Knopf je Bewertung. Vergleich: je Teil und je Kriterium alle Läden als Balken, Gewinner mit 🏆, Gruppen als Kacheln
    mit gelbem Dreieck zum Aufklappen.
  - Ziel: öffentlicher Reiter mit neuem Sheet „Döner“ und eigenem Skript `doener`. Ohne Passwort, aber getrennt von allem anderen.
    Das alte Döner-Sheet (nur Durchschnitte) bleibt als Sicherung. Das Skript hat eine Funktion `einrichten`, die die Blätter
    und Kopfzeilen selbst anlegt. Die bisherigen Werte trägt die Person als je eine Start-Bewertung pro Laden ein.
  - Bewerten: Laden aus einer Auswahl der bisherigen Läden oder neu als Freitext. Sterne 1 bis 10 getrennt für Döner, Yufka und Pommes,
    jedes Feld freiwillig, mindestens eins (Entscheidung der Person, 29.10.2026). Begründung freiwillig, Datum automatisch.
  - Wahlweise „ausführlich“ (Entscheidung der Person, 29.10.2026): je Kriterium 1 bis 10 in halben Schritten mit eigener Begründung.
    Die Kriterien stehen im Blatt `kriterien` (Vorgabe aus dem alten Döner-Sheet). Der Wert eines Teils ist dann der Durchschnitt
    seiner Kriterien. Dazu kommt der Teil „Laden“ (Service, Gemütlichkeit); er zählt nicht zu „Insgesamt“.
  - Anzeige: Balken-Grafik aller Läden mit „Insgesamt“ und der Zahl der Bewertungen. Je Teil (Döner, Yufka, Pommes) zählt der
    Durchschnitt aller Bewertungen; „Insgesamt“ ist der Durchschnitt der Teile, die schon Bewertungen haben.
    Antippen eines Ladens zeigt die drei Teile und alle Begründungen mit Sternen und Datum. Die Balken baut die App selbst mit CSS, ohne Bibliothek.
  - Fleisch (Wunsch der Person, 30.10.2026, 0.4.12–0.4.14): Im Formular wählt der Umschalter „🌱 Vegan / 🥩 Fleisch“ die Sorte
    (Vorgabe vegan; Spalte `fleisch` = `true` oder leer). Bei Fleisch heißt das Kriterium „Seitan“ „Fleisch“
    (das Skript speichert dann „Fleisch“ im Blatt `details`, Tausch in `TAUSCH_FLEISCH_`). Überschrift „Döner-Rating Landau“.
    Rangliste: je Laden zwei Balken nebeneinander (🌱 und 🥩), sortiert nach der veganen Wertung. Vergleich: jeder Laden
    erscheint je Sorte als eigene Zeile mit 🌱 oder 🥩.
  - Teilen: Link `#/doener/<skript>` ohne Einrichtung. Für dich steht der Reiter normal in der Reiterleiste.
    Ist die eigene Döner-Adresse eingetragen, gilt immer sie; ein fremder Link ändert sie nicht (ab 0.8.0).
  - Reiter-Symbole (Wunsch der Person): jeder Reiter hat ein Symbol, am Handy nur das Symbol, am PC Symbol und Name.
    Ohne Einrichtung zeigt die Reiterleiste nur öffentliche Reiter.
  - Datenschutz: Nur Laden, Sterne, Begründung und Datum. Keine Namen, keine Geräte-Kennung.
- **Etappe 2 „Bestehendes umziehen“ (0.2.x) – fertig, Umstieg am 1.11.2026.** So ist es gebaut (Schritte 2.0 bis 2.5, Pull Requests #14 bis #21):
  - Daten bleiben in den bestehenden Sheets, kein Export oder Import. Je Sheet kam nur ein Blatt `Einstellungen` dazu.
    Skript-Änderungen gehen nur in die Thetadex-Bereitstellung, die alten Apps laufen mit ihrer alten Bereitstellung weiter.
    Die Werte der alten Apps lagen als Tabellen zum Einfügen in den Projektdateien (`etappe-2/`), nie im Repo.
  - Tracking: Blatt `Einstellungen` (`feld, gruppe, art, vorgabe, optionen, schritt, farben`); `einrichten` füllt `feld` aus der Kopfzeile.
    Arten `haken`, `zahl`, `auswahl` (`wert=Text; …`, Hochkomma vor `-1=…`). Formular je Gruppe als Karte, „Speichern“ in der Tracking-Farbe.
    Die Felder holt die App beim Start im Hintergrund und hält sie nur im Arbeitsspeicher (10 Minuten).
    Übersicht: Jahr und Monat wählen, je Monat eine Tabelle mit allen Tagen, Zellen farbig ohne Zahlen. Farbregeln in Spalte `farben`:
    `1=grün`, `7-10=grün`, `<7=rot`, `>10=gelb`, `<=`, `>=`, `sonst=rot`, `skala 1-10`; Farben grün, hellgrün, dunkelgrün, rot, dunkelrot, gelb, blau, rosa, grau.
  - Finanzen: Blatt `Einstellungen` (`liste, name, kategorie, betrag, zweck`; Listen `zweck`, `kategorie`, `rueckzahlung`, `eigenanteil`).
    Umschalter „Buchen / Auswertung“. Buchen wie bisher mit Auswahlfeld für Zweck und Kategorie, Doppelbuchungs-Sperre, Fenster „Gespeichert“.
    Auswertung mit Chart.js (lokal): Monat oder Jahr, Ringe, Säulen mit Budget, Budget-Balken, Netto-Kacheln mit Haken, Jahrestabelle, Bafög.
    Die Kategorien kommen allgemein aus `Analyse Monate` (Spalten `-Out`, `-In`, `Netto-`).
  - Ziel: Tracking und Finanzen funktionieren in Thetadex „wie bisher“.
  - Schritte: Blatt `Einstellungen` je Sheet (Tracking-Felder; Zwecke, Kategorien, Personen für Rückzahlungen) und Aktion `einstellungen`;
    Reiter Tracking (Eingabe wie bisher); Reiter Finanzen (Übersicht, Buchen, Auswertung mit Chart.js aus `vendor/`).
  - Datenschutz: Finanz- und Tracking-Daten nur nach Passwort, nichts im Gerät außer den letzten Kontoständen (5).
  - **Tor:** Die Person ist mit der neuen App zufrieden. Erledigt am 1.11.2026 (Etappe 7): alte Bereitstellungen archiviert, alte Repos gelöscht.
- **Etappe 3 „Besitz“ (0.3.x)** – fertig (30.10.2026), Plan eingearbeitet (3.1 und 4).
  - Gebaut: „Einstellungen“ statt „Einrichtung“ mit Aussehen Hell, Dunkel, Wie Gerät. Neues Sheet „Leben“ mit Skript `leben` (nur die Person).
  - Reiter Besitz mit Unterreitern „Liste“ und „Übersicht“: Liste je Ort (PC Tabelle mit Strich je Sache, Handy Karten), Suche,
    Filter nach Ort, Kategorie und ausgeliehen, Sortieren am PC, Zubehör aufklappbar, Bild je Sache aus Google Drive.
  - Datenschutz: nur mit Passwort; die Liste nur im Arbeitsspeicher, nichts davon im Gerät. Bilder bleiben privat im Drive der Person.
- **Etappe 4 „Einkauf und Essen“ (0.4.x)** – fertig (30.10.2026), Plan eingearbeitet (2.3, 3.1 und 4).
  - Gebaut: neues Sheet „Gemeinsam“ mit Skript `gemeinsam` und zweitem Passwort `PARTNER_PIN` für die Partnerin oder den Partner.
  - Reiter Einkauf mit Unterreitern „Einkaufsliste“ (nach Abteilung oder nach Gericht, abhaken auch ohne Netz, „Einkauf fertig“),
    „Lebensmittel“ (Suche, ankreuzen, zusammen auf die Liste, Vorrat je Ort) und „Gerichte“ (Zutaten mit Menge, Zutaten mit genug Vorrat nicht angehakt).
  - Reiter erscheinen nach eingetragenen Script-Adressen; so sieht die Partnerin oder der Partner nur Einkauf, Uni und Döner.
  - Datenschutz: nur mit Passwort; im Gerät nur die Einkaufsliste und die noch nicht gesendeten Haken. Über die Partnerin oder den Partner wird nichts gespeichert.
- **Etappe 5 „Uni“ (0.5.x)**, im Sheet „Gemeinsam“ – fertig (31.10.2026), Festlegungen in 4. Ursprünglicher Plan:
  - Semester auswählen, je Semester ein Stundenplan (Tag, von, bis, Veranstaltung, Ort, Art).
  - Zusätzlich eintragen: Arbeitszeiten (Stunden je Woche und Monat werden berechnet) und Zugfahrten.
  - Kalender mit Vorlesungen, Prüfungen, Urlaub, Semesterferien, Arbeit und Zug. Jede Art hat ihre eigene Farbe.
    Vorbild ist der Kalender im AktionsDeck (öffentliches Repo `fridaysforfuture-landau-pfalz/aktionsdeck-landau`, `js/views/kalender.js`):
    Ansichten Liste, Monat und Woche, mehrtägige Termine, Filter nach Art. Die Rechenhelfer aus `kalender-rechnen.js`
    (Monatsraster, Woche, Tage zählen, Schriftfarbe auf Farbfläche) werden vereinfacht übernommen.
  - Master-Übersicht: welche Module erledigt sind, welche noch fehlen, wann und welche Prüfung dazu gehört.
  - Partner*in sieht Uni mit allen Zeiten, nur lesend (Rechte in 4).
- **Etappe 6 „DSA und DnD“ (0.6.x)** – fertig (1.11.2026), Festlegungen in 4 („Pen & Paper, Sheet ‚DSA‘“). Gebaut wurde mehr und anders als hier:
  Reiter „Pen & Paper“, DnD wie DSA, Würfel bis W20, dazu Abenteuer mit Sessions und DM (Wunsch der Person). Ursprünglicher Plan:
  - Ziel: neues Sheet „DSA“ mit Skript `dsa`. Vier Bögen (drei DSA, ein DnD), jeder einzeln wählbar, alle Daten in der App bearbeitbar.
  - Bogen zeigt: Kopf (Name, GP-Basis, Rasse, Kultur, Profession, Geschlecht, Alter, Größe, Gewicht, Haar- und Augenfarbe, Bild,
    Stand, Titel, Sozialstatus, Herkunft); Vor- und Nachteile; Eigenschaften und Basiswerte (MU, KL, IN, FF, GE, KO, KK zusätzlich
    immer sichtbar als Leiste); Sonderfertigkeiten und Talente in Gruppen (Sonderfertigkeiten, Gaben, Kampftechniken, Körperliche,
    Gesellschaftliche, Natur-, Wissens-, Handwerkliche Talente, Sprachen und Schriften); Zauber (Name, Probe, Kosten, Dauer, Spruch,
    Wirkungsdauer, ZfW, Modifikationen); Waffen mit Werten; Besitz-Liste.
  - Verlauf für Geld, AP, AsP und Leben: schnell „+“ oder „−“ mit Notiz; aktueller Stand wird daraus berechnet.
    Geld und Leben stehen mit Icon immer sichtbar oben.
  - Würfel W4, W6, W20.
  - Die Eigenschaften sind eine Liste aus Kürzel, Name und Wert. So passt auch der DnD-Bogen (STR, DEX …) ohne Sonderbau.
  - Teilen per Link ohne Passwort, nur lesen (4 „DSA teilen“).
- **Etappe 7 „Umstieg und Aufräumen“ (0.7.x)** – fertig (1.11.2026), Plan eingearbeitet (3.1). Schritte 7.0 bis 7.5, Pull Requests #61 bis #64.
  - Umstieg (7.4) zuerst, von Hand nach Anleitung in den Projektdateien (`etappe-7/umstieg-anleitung.md`): alte Bereitstellungen über die Script-Adresse erkannt
    und archiviert, alte App und Lesezeichen entfernt, alte Repos gelöscht. Dazu alle gemergten Zweige im Repo `thetadex` (die Person, von Hand).
  - Bericht „Ungenutztes und Verweise“ (7.1) nur in den privaten Projektdateien. Die Person kreuzte an, was weg darf; App (7.2) und Skripte (7.3) danach aufgeräumt.
  - Die Skripte aus 7.3 hat die Person nach 0.8.4 zusammen mit den Skripten aus Etappe 8 eingefügt.
- **Etappe 8 „Prüfen und Version 1.0.0“ (0.8.x → 1.0.0)** – fertig (1.11.2026), Pull Requests #65 und #66. Ursprünglicher Plan (Wunsch der Person, 1.11.2026): Jede Prüfung nach 1.10: erst Bericht in den Projektdateien
  (`pruefung/<thema>-bericht.md`, nie im Repo), dann baut Claude nur, was die Person freigibt. Je Prüfung ein Schritt, Behebungen als eigene Schritte.
  - **Sicherheit:** alle Skripte (`doener`, `finanzen`, `tracking`, `leben`, `gemeinsam`, `dsa`) und die App. Wer darf was (Rollen, geteilte Links),
    böse Eingaben, Sperre nach Fehlversuchen, Content-Security-Policy, Links und Bilder aus Daten, was im Gerät liegt.
  - **Barrierefreiheit:** nach WCAG 2.2, Stufe AA. Kontrast hell und dunkel, Bedienung mit Tastatur, Beschriftungen für Bildschirmleser,
    Tippflächen, Zoom bis 200 %. Bildschirmleser auf echten Geräten prüft die Person.
  - **Datenschutz:** welche Daten wo liegen (Sheet, Gerät, Drive), wer sie sieht, was öffentlich ist (Döner, geteilte Bögen, Repo),
    ob etwas Persönliches im öffentlichen Repo oder in seiner Geschichte steht.
  - **Rechtliches:** ob die App ein Impressum oder eine Datenschutzerklärung braucht (privat, aber mit öffentlichem Döner-Reiter und geteilten Links),
    Lizenzen fremder Teile (Chart.js in `vendor/`, Schriften, Symbole), Inhalte aus DSA und DnD (Regelwerke) und Bilder.
    Claude ersetzt keine Rechtsberatung; der Bericht nennt, was unsicher ist.
  - **Geschwindigkeit und ohne Netz:** Ladezeit, Größe der Hülle, was ohne Netz geht (Einkaufsliste, Uni) und welche Meldung sonst kommt.
    Echte Ladezeiten am Handy prüft die Person.
  - **Datensicherung:** ob sich jedes Sheet, Skript und die Bilder im Drive wiederherstellen lassen, ob die Sicherung der Skripte
    in den Projektdateien (`apps-script-backup/`) aktuell ist, was bei Verlust des Handys verloren wäre. Keine Anleitung „neues Handy“ (Entscheidung der Person).
    Ergebnis (Bericht `pruefung/datensicherung-bericht.md`): nichts zu bauen, keine zusätzliche Sicherung (Entscheidung der Person, 1.11.2026).
  - **Version 1.0.0:** `docs/STAND.md` auf den Stand bringen, Version 1.0.0 in `js/config.js` und `sw.js`.
- **Etappe 9 „Kontowecker“ (1.1.x)** – fertig (1.11.2026). Kontowecker-SMS automatisch an das Finanz-Skript, im Reiter Finanzen „Noch zuordnen“ mit Vorschlag.
  Schritte: 9.0 Plan, 9.1 Skript nimmt SMS an, 9.2 Noch zuordnen (mit Nachbesserungen), 9.3 Abschluss mit Prüfung. Festlegungen in 4 („Kontowecker“).
- **Etappe 10 „Visitenkarte“ (1.2.x)** – fertig (4.11.2026), Plan eingearbeitet (4 „Visitenkarte“). Schritte 10.0 Plan mit Prüfung, 10.1 Sheet und Skript `karte`, 10.2 Besucher-Ansicht, 10.3 Kachel mit Links und QR-Code, 10.4 Abschluss mit Prüfung (Pull Requests #73 bis #77).
- **Etappe 11 „Rezepte“ (1.3.x)** – fertig (7.11.2026), Plan eingearbeitet (4 „Einkauf“, Abschnitt Rezepte). Schritte 11.0 Plan, 11.1 Umschalter, 11.2 Skript mit Rezepttext und Personen, 11.3 Bilder, 11.4 Abschluss mit Prüfung (Pull Requests #83 bis #87).
- **Entfallen:** Startseite mit Heute-Übersicht (Entscheidung der Person, 1.11.2026).

Prüfung gegen die Grundsätze (1.2):
- Welche Daten? Nur was die Person beschrieben hat. Über die Partnerin oder den Partner werden keine Daten gespeichert.
- Wer sieht sie? Siehe Tabelle „Wer sieht was“ in 4. Jede Rolle prüft das Skript.
- Geht es einfacher? Ein Sheet für alles wäre weniger Einrichtung, aber dann hinge die Sicherheit von Besitz und Tracking
  an der Rechteprüfung für Partner*in und geteilte Bögen. Drei kleine Skripte mit demselben Aufbau sind sicherer und kaum mehr Arbeit.

---

---

## Teil 3: Geschichte der Versionen (früher STAND.md 8)


- **Etappe 0** (ab 0.0.0): Repo angelegt, Start-Datei `docs/STAND.md` übernommen.
- **0.0.1** Schritt 0.1: App-Gerüst, Ersteinrichtung, Icons.
- **0.0.2** Schritt 0.2: Tracking-Skript auf Finanz-Stand, ein Passwort für alle Skripte, neue Bereitstellungen, „Verbindung prüfen“ in der Einrichtung.
- **0.1.0** Schritt 0.3: Plan Version 1 (7.2), Rechte je Bereich, drei neue Sheets geplant. Etappe 0 fertig.
- **0.1.1** Antworten auf die Rückfragen: Reiter ToDos entfällt, Uni-Kalender nach Vorbild AktionsDeck, Vorrat, Kontowecker per SMS-Weiterleitung.
- **0.1.2–0.1.3** Neuer öffentlicher Reiter Döner Landau als Etappe 2 (neues Sheet, Sterne für Döner, Yufka, Pommes), die übrigen Etappen rücken eins nach hinten.
- **Etappe 1** Döner Landau (vor dem Umzug, Wunsch der Person). **0.1.4** Schritt 1.1: Symbole für alle Reiter, ohne Einrichtung nur öffentliche Reiter.
- **0.1.5** Schritt 1.2: Döner-Skript (`apps-script/doener/Code.gs`) und Reiter Döner.
- **0.1.6** Schritt 1.3: ausführliche Bewertung nach Kriterien (Blatt `kriterien`, `details`), Laden-Note (Service, Gemütlichkeit).
- **0.1.7** Schritt 1.4: Döner-Optik nach Rückmeldung (bunter Döner, Bewerten mit kleinen Dönern, „+ Bewerten“, Laden-Auswahl, Einrückung).
- **0.1.8** Schritt 1.5: 🥙 statt Bild, „Döner-Rating Landau“, gelbe Knöpfe, Kriterium in einer Zeile, × und Abbrechen,
  Vergleich aller Kriterien mit Gewinnern; Seite lädt nicht mehr von selbst neu.
- **0.1.9** Schritt 1.6: Feinschliff Döner (Titel „Veganes Döner-Rating Landau“, Danke verschwindet, Pokal-Spalte, gelbe Dreiecke, Gruppen als Kacheln).
- **0.1.10** Etappe 1 abgeschlossen, Plan eingearbeitet, `docs/PLAN-ETAPPE-1.md` gelöscht.
- **Etappe 2** Bestehendes umziehen. **0.2.0–0.2.1** Schritt 2.0: Plan `docs/PLAN-ETAPPE-2.md`, Diagramme mit Chart.js.
- **0.2.2** Schritt 2.1: Reiter Tracking, Felder aus dem Blatt `Einstellungen`, Aktion `einstellungen`.
- **0.2.3** Schritt 2.2: Reiter Finanzen mit Kontoständen und Buchen, Zwecke und Kategorien aus dem Blatt `Einstellungen`.
- **0.2.4** Schritt 2.3: Tracking-Übersicht (Tabelle mit farbigen Zellen je Jahr), Fenster „Gespeichert“ mit grünem Haken, Döner-Haken gelb.
- **0.2.5** Nachbesserung 2.3: Finanzen mit 💶, Vermögen grün/rot, Knöpfe rot/grün, Kalender öffnet bei Klick ins Datumsfeld.
- **0.2.6** Nachbesserung 2.3: Tracking mit 📊, Übersicht mit allen Tagen, je Monat eine Tabelle, Filter nach Monat.
- **0.2.7** Schritt 2.4: Finanzen → Auswertung mit Chart.js (lokal), Kategorien allgemein aus dem Skript, Haken für Rückzahlungen.
- **0.2.8** Schritt 2.5: Überschrift „Tracking Leben“, Tracking-Felder werden beim Start im Hintergrund geholt (nur Arbeitsspeicher, 10 Minuten), Bafög-Kacheln schmal.
- **0.2.9** Etappe 2 abgeschlossen, Plan eingearbeitet, `docs/PLAN-ETAPPE-2.md` gelöscht. Dazu: Logo groß auf der Startseite,
  Icon füllt am Android-Startbildschirm die Form, Tracking-„Speichern“ in der Tracking-Farbe, Bafög drei gleich breite Kacheln.
- **Etappe 3** Besitz. **0.3.0** Schritt 3.0: Plan `docs/PLAN-ETAPPE-3.md` (Einstellungen mit hell/dunkel, Sheet „Leben“, Reiter Besitz).
- **0.3.1** Antworten zum Plan: Orte ohne eigenes Blatt, Spalte `kategorie`, keine Summe der Kaufpreise.
- **0.3.2** Schritt 3.1: „Einrichtung“ heißt „Einstellungen“ (Zahnrad), Aussehen Hell, Dunkel oder Wie Gerät.
- **0.3.3** Schritt 3.2: Sheet „Leben“, Skript `leben`, Reiter Besitz mit Liste je Ort und Hinzufügen.
- **0.3.4** Schritt 3.3: Besitz ändern, weich löschen, suchen, filtern nach Ort und Kategorie, sortieren.
- **0.3.5** Schritt 3.4: Zubehör unter einer Hauptsache (Spalte `gehoert_zu`), eingerückt und aufklappbar.
- **0.3.6** Schritt 3.5: Bild je Sache aus Google Drive (hochladen oder Link), Spalte `bild`.
- **0.3.7** Schritt 3.6: 📦 im Titel, Ansicht vor dem Bearbeiten, Anzahl 0 ausgeblendet, „Ausgeliehen an“ mit Filter, Übersicht, Strich je Sache am PC.
- **0.3.8** Schritt 3.7: Besitz-Übersicht mit Farbstrich oben an den Zahlen, Haken „Anzahl 0 zeigen“ immer sichtbar.
- **0.3.9** Etappe 3 abgeschlossen, Plan eingearbeitet, `docs/PLAN-ETAPPE-3.md` gelöscht. Dazu: Startseite mit Logo neben dem Namen, beides größer.
- **Etappe 4** Einkauf und Essen. **0.4.0** Schritt 4.0: Plan `docs/PLAN-ETAPPE-4.md` (Sheet „Gemeinsam“, Skript `gemeinsam` mit `PARTNER_PIN`, Lebensmittel, Einkaufsliste offline, Gerichte, Vorrat).
- **0.4.1** Antworten zum Plan: Vorrat als eigenes Blatt mit mehreren Orten, Abhaken erhöht den Vorrat, Einkaufsliste auch nach Gericht, Reiter nach Script-Adressen.
- **0.4.2** Wunsch der Person zu Besitz: ausgeliehene Anzahl (Spalte `ausgeliehen_anzahl`), Balken in der Übersicht entfernt.
- **0.4.3** Schritt 4.1: Sheet „Gemeinsam“, Skript `gemeinsam` (alle Aktionen der Etappe), Reiter Einkauf mit Einkaufsliste und Lebensmitteln.
- **0.4.4** Schritt 4.2: Einkaufsliste ohne Netz, Haken werden später gesendet.
- **0.4.5** Nachbesserung 4.2: Lebensmittel ankreuzen und zusammen auf die Liste, Menge rechts, Abgehakte bleiben bis „Einkauf fertig“, Start bei Lebensmittel.
- **0.4.6** Schritt 4.3: Gerichte mit Zutaten, Einkaufsliste nach Gericht.
- **0.4.7** Schritt 4.4: Vorrat je Ort am Lebensmittel, Hinweis „zuhause“, Zutaten mit genug Vorrat nicht angehakt, Filter „Nur was zuhause ist“.
- **0.4.8** Schritt 4.5: Reiter nach eingetragenen Script-Adressen (DSA-Platzhalter verschwindet), Rolle bei „Verbindung prüfen“.
- **0.4.9** Nachbesserung: Haken „Vorrat“ neben der Suche, Knöpfe unter der Suche, neues Lebensmittel im Gericht mit Abteilung und Einheit.
- **0.4.10** Etappe 4 abgeschlossen, Plan eingearbeitet, `docs/PLAN-ETAPPE-4.md` gelöscht.
- **0.4.11** Nachbesserung: Lebensmittel nach Abteilung filtern.
- **0.4.12** Döner: Häkchen „Fleisch“ (leer = vegan), getrennte Ranglisten Vegan und Fleisch, Spalte `fleisch`.
- **0.4.13** Döner: Kriterium „Seitan“ heißt bei Fleisch „Fleisch“.
- **0.4.14** Döner: Sorte im Formular statt Häkchen, je Laden zwei Balken 🌱 und 🥩, Vergleich mit beiden Sorten.
- **Etappe 5** Uni. **0.5.0** Schritt 5.0: Plan `docs/PLAN-ETAPPE-5.md` (vier Blätter im Sheet „Gemeinsam“, Kalender mit Arten, Arbeitsstunden, Module).
- **0.5.1** Antworten zum Plan: keine Noten, Ziel 120 ECTS, Arbeitszeiten „einmal anders“, Uni auch ohne Netz, Partner*in sieht auch Module, Raum im Kalender.
- **0.5.2** Schritt 5.1: Uni-Blätter und -Aktionen im Skript `gemeinsam`, Reiter Uni mit Semestern und Stundenplan.
- **0.5.3** Schritt 5.2: Kalender (Woche, Monat, Liste, Filter, Farben je Art), Termine, „einmal anders“, Uni-Daten ohne Netz.
- **0.5.4** Schritt 5.3: Arbeitsstunden je Woche, Monat und im Stundenplan.
- **0.5.5** Schritt 5.4: Module mit Master-Übersicht (Ziel aus `uni_einstellungen`), Prüfungen je Modul.
- **0.5.6** Schritt 5.5: Kurse je Modul, Prüfungen „bestanden“, Termine jede Woche an bestimmten Tagen, Stundenplan in Termine umgezogen, Filter „Frei“ weg, Fenster nur mit × oder Abbrechen.
- **0.5.7** Schritt 5.6: Art der Prüfung bei der Prüfung, ein Knopf „+ Prüfung“, Prüfung beim Anlegen von Modul und Kurs, Woche am Handy als Raster, Art Hobby.
- **0.5.8** Schritt 5.7: Hobby dunkelgrün, Text in den Kalender-Kästen gekürzt, Linie „jetzt“ in der Woche. Etappe 5 abgeschlossen, Plan eingearbeitet, `docs/PLAN-ETAPPE-5.md` gelöscht.
- **Etappe 6** Pen & Paper (DSA und DnD). **0.6.0** Schritt 6.0: Plan `docs/PLAN-ETAPPE-6.md` (Sheet „DSA“ mit drei Blättern, Skript `dsa`, Verlauf, Würfel, Teilen; Name „Pen & Paper“, W20 als Symbol).
- **0.6.1** Schritt 6.1: Sheet „DSA“ und Skript `dsa`, Reiter Pen & Paper mit Bogen, Kopf, Eigenschaften und Zählern; Kopfzeile dunkel, Hintergrund beige-grau, Startseite mit Karteikarte.
- **0.6.2** Schritt 6.2: Listen bei Pen & Paper (Vor- und Nachteile, Sonderfertigkeiten und Gaben, Talente nach Gruppe, Besitz nach Ort).
- **0.6.3** Schritt 6.3: Zauber (aufklappbar, Modifikationen, Hauszauber) und Waffen (Tabelle, am Handy Karten) bei Pen & Paper.
- **0.6.4** Schritt 6.4: Verlauf bei Pen & Paper (Zähler antippen, „+“ oder „−“, Geld je Münze, „Voll“, Karte „Verlauf“ mit Filter).
- **0.6.5** Schritt 6.5: Würfel (W4 bis W20, Anzahl, schwebender Knopf) und Bild des Helden im Kopf bei Pen & Paper.
- **0.6.6** Schritt 6.6: Teilen bei Pen & Paper (Link erstellen, kopieren, neu, nicht mehr teilen; geteilter Bogen `#/bogen/<skript>/<schluessel>` nur lesen).
- **0.6.7** Anmerkungen zum Aussehen: Name als Überschrift mit Auswahl, DSA und Teilen darüber, Geld als Münzen, Bild links im eigenen Seitenverhältnis und groß per Tipp, Kopf ohne Überschrift.
- **0.6.8** Abenteuer und DM: Schalter Charakterbogen | Abenteuer | DM, Abenteuer mit Sessions je Charakter (auch im geteilten Link), DM mit Abenteuerideen und abschließbaren Abenteuern.
- **0.6.9** Bilder je gespieltem Abenteuer (auch im geteilten Link), Marke DSA rechts und nur umrandet, größerer Schalter, Abenteuer ohne klebende Leiste.
- **0.6.10** Etappe 6 abgeschlossen, Plan eingearbeitet, `docs/PLAN-ETAPPE-6.md` gelöscht.
- **0.6.11–0.6.12** Weitere Etappen geplant: 7 „Umstieg und Aufräumen“, 8 „Prüfen und Version 1.0.0“ (mit Geschwindigkeit und Datensicherung), 9 „Kontowecker“. Heute-Übersicht entfällt.
- **Etappe 7** Umstieg und Aufräumen. **0.7.0** Schritt 7.0: Plan `docs/PLAN-ETAPPE-7.md` (Bericht Ungenutztes, App und Skripte aufräumen, Umstieg mit Anleitung).
- **0.7.1** Antworten zum Plan: Umstieg zuerst (1.11.2026), Bericht nur privat, alte Zweige löschen, STAND.md mit aufräumen.
- Umstieg (7.4) und Bericht (7.1) von der Person erledigt, alte Repos und Zweige gelöscht. **0.7.2** Schritt 7.2: Platzhalter, `etappe`, `#/einrichtung`, alte Art „frei“ und eine CSS-Regel entfernt, `README.md`.
- **0.7.3** Schritt 7.3: Skripte aufräumen (Stundenplan-Umzug und „frei“ aus `gemeinsam`, Kommentare auf gelöschte Pläne in fünf Skripten).
- **0.7.4** Etappe 7 abgeschlossen, Plan eingearbeitet, `docs/PLAN-ETAPPE-7.md` gelöscht, STAND.md aufgeräumt (7.1 gekürzt, Geschichte geordnet).
- **Etappe 8** Prüfen und Version 1.0.0. **0.8.0** Behebungen Sicherheit: eigene Döner-Adresse geht vor fremdem Link, Hinweis bei fremdem Rahmen. **0.8.1** Behebungen Datenschutz: alte Kategorie-Felder aus dem Finanz-Skript, ehrliche Texte zum Gerät, Hinweis bei Döner, keine internen Fehlertexte ohne Passwort. **0.8.2** Behebungen Geschwindigkeit: Service Worker holt neue Dateien frisch vom Server, Suche in Besitz flüssiger. **0.8.3** Behebungen Barrierefreiheit: Schalter bei Pen & Paper mit Namen und sichtbarem Fokus, Nachbarmonat im Uni-Monat lesbar, Unterreiter brechen bei schmalen Handys um. **0.8.4** Rechtliches: `LIZENZEN.md` mit den MIT-Lizenztexten, Hinweis unter Info. Kein Impressum und keine Datenschutzerklärung nötig (Döner-Link nur an Freunde, Entscheidung der Person, 1.11.2026).
- **1.0.0** Prüfung Datensicherung (nur Bericht, nichts zu bauen), alle Skripte im Editor aktuell. Etappe 8 abgeschlossen, Version 1.0.0 (Entscheidung der Person, 1.11.2026).
- **Etappe 9** Kontowecker. **1.1.0** Schritt 9.0: Plan `docs/PLAN-ETAPPE-9.md` (SMS-Weiterleitung mit „SMS to URL Forwarder“, Blatt `SMS`, Liste „Noch zuordnen“ mit Vorschlag).
- **1.1.1** Antworten zum Plan: App über F-Droid, immer mit Prüfung, nur Girokonto, SMS-Text nach Zuordnung löschen; Aufbau der SMS nach zwei abgeänderten Beispielen.
- **1.1.2** Schritt 9.1: Finanz-Skript nimmt Kontowecker-SMS an (Aktion `sms`, Blatt `SMS`, `smsSchluesselErzeugen`), Anleitung für die Weiterleitungs-App im Pull Request.
- **1.1.3** Schritt 9.2: Reiter Finanzen → „Noch zuordnen“ mit Vorschlag (Übernehmen ins Formular, Verwerfen), Suchwörter aus `Einstellungen`, Skript-Aktionen `smsListe`, `smsErledigt`, `buchen` mit `sms_id`.
- **1.1.4** Nachbesserung 9.2: Finanz-Skript schreibt bei `sms` „SMS angenommen“ oder „SMS abgelehnt: <Grund>“ ins Protokoll (Editor → Ausführungen), weil die Weiterleitungs-App immer „erfolgreich“ zeigt.
- **1.1.5** Nachbesserung 9.2: „Noch zuordnen“ nicht mehr über dem Formular. Am Handy und auf schmalen Bildschirmen eigener Umschalter „SMS (n)“ (nur mit offenen SMS), ab 1200 px rechts neben dem Formular (Wunsch der Person: Buchen passt auf einen Bildschirm).
- **1.1.6** Schritt 9.3: Etappe 9 abgeschlossen, Prüfung Sicherheit und Datenschutz (nur Bericht, nichts zu bauen), Plan in STAND.md eingearbeitet (4 „Kontowecker“, Anleitung mit Header `{}`), `docs/PLAN-ETAPPE-9.md` gelöscht.
- **1.1.7** Nachbesserung 9.3: „Noch zuordnen“ lädt von selbst neu (Seite wieder sichtbar, Tipp auf „SMS“, alle 5 Minuten), damit am PC keine am Handy erledigte SMS stehen bleibt.
- **1.1.8** Nachbesserung Etappe 9: SMS mit mehreren Umsätzen werden im Skript in eine Zeile je Umsatz geteilt, jeder Umsatz wird einzeln vorgeschlagen und gebucht.
- **Etappe 10** Visitenkarte. **1.2.0** Schritt 10.0: Plan `docs/PLAN-ETAPPE-10.md` (Sheet „Visitenkarte“, Skript `karte`, ein Link je Karte, E-Mail und Telefon erst nach Tipp, QR-Code mit lokaler Bibliothek).
- **1.2.1** Prüfung des Plans (Bericht nur in den Projektdateien): gültige Links gehen immer durch, leere Spalte `karten` = auf keiner Karte, Form von E-Mail und Telefon geprüft, eigenes Passwort `KARTE_PIN`.
- **1.2.2** Schritt 10.1: Sheet „Visitenkarte“ und Skript `karte` (Blätter `angaben`, `links`; mit `KARTE_PIN` `ping`, `angaben`, `link`, `link_weg`, `bild`; ohne Passwort `karte`, `kontakt`, `bild_karte`), Adresse und eigenes Passwort in den Einstellungen.
- **1.2.3** Schritt 10.2: Besucher-Ansicht `#/karte/<skript>/<schluessel>` (Name, Status, Kontakt erst nach Tipp, Social Media, Veröffentlichungen mit Vorschaubild, „Kontakt speichern“ als vCard mit dem Link der Karte), ohne Reiterleiste und Kopf-Links.
- **1.2.4** Schritt 10.3: Kachel „Visitenkarte“ auf der Startseite (`#/visitenkarte`, nicht in der Leiste): Umschalter Privat, Arbeit, Aktivismus mit Vorschau, Link erstellen, kopieren, als QR-Code zeigen und speichern, erneuern, nicht mehr teilen; Liste „Erscheint auf keiner Karte“. `vendor/qrcode.js`, Eintrag in `LIZENZEN.md`.
- **1.2.5** Schritt 10.4: Etappe 10 abgeschlossen, Prüfung Sicherheit und Datenschutz (nur Bericht, nichts zu bauen), Plan in STAND.md eingearbeitet (4 „Visitenkarte“), `docs/PLAN-ETAPPE-10.md` gelöscht.
- **1.2.6** Nachbesserung: Hinweis zu hängenden GitHub-Pages-Läufen im Merkzettel (5); neue Version, damit Pages nach dem hängenden Lauf von 1.2.5 neu ausliefert.
- **1.2.7** Nachbesserung Visitenkarte: Farbe Lavendel statt Grau (Kachel, Streifen oben an der Karte, Gruppen, Knöpfe), auch für Besucher.
- **1.2.8** Nachbesserung Visitenkarte: Olivgrün statt Lavendel, Rahmen um die ganze Karte, E-Mail und Telefon gleich sichtbar (Skript `karte` neu), Reihenfolge gilt auch für Texte und Gruppen, bunte Symbole für Instagram, LinkedIn und Signal, Logo je Status, am PC Reiter in der Seitenleiste und Link-Kasten rechts.
- **1.2.9** Nachbesserung Visitenkarte: `hut` in Spalte `bild` zeigt einen Studentenhut vor dem Text (Skript `karte` neu), Satz „So sehen es Besucher …“ über der Vorschau entfernt.
- **1.2.10** Nachbesserung Visitenkarte: Logos ohne weißen Hintergrund, Spalte `zusatz` (Status teils nicht fett), Art `adresse`.
- **1.2.11** Nachbesserung Visitenkarte: Symbol `stift` in Spalte `bild`, `zusatz` sieht aus wie die Beschriftung.
- **Etappe 11** Rezepte. **1.3.0** Schritt 11.0: Plan `docs/PLAN-ETAPPE-11.md` (Gerichte werden Rezepte mit Text, Personen und Bild, Umschalter „Einzeln | Rezepte“ bei Lebensmitteln).
- **1.3.1** Antworten zum Plan: Gerichte und Rezepte zusammengelegt, kein eigener Unterreiter, Personen umrechnen, ein Bild aus Drive je Rezept, nur mit Netz, keine Kategorien.
- **1.3.2** Weitere Antworten: bis 10 Bilder je Rezept (Spalte `bilder`), Runden auf halbe Einheiten und Bilder der Partnerin im Drive der Person bestätigt.
- **1.3.3** Schritt 11.1: Umschalter „Einzeln | Rezepte“ bei Lebensmitteln, Unterreiter „Gerichte“ entfällt, „Rezept“ statt „Gericht“ in der App.
- **1.3.4** Schritt 11.2: Skript `gemeinsam` mit Rezepttext, Personen, „ergibt“ und Bildern (Spalten, `rezept_bild`, `bild`, Ordner „Thetadex Rezepte“); App mit Rezepttext und „Personen diesmal“.
- **1.3.5** Schritt 11.3: Bilder im Rezept anzeigen, hochladen, als Drive-Link einfügen und entfernen.
- **1.3.6** Schritt 11.4: Etappe 11 abgeschlossen, Prüfung Sicherheit und Datenschutz (nur Bericht), Plan in STAND.md eingearbeitet (4 „Einkauf“, Rezepte), `docs/PLAN-ETAPPE-11.md` gelöscht.
- **1.3.7** Nachbesserung Rezepte: Ein Tipp auf den Titel klappt das Rezept in der Liste auf (statt Fenster).
- **1.3.8** Nachbesserung Rezepte: Mengen ab 0,01 mit bis zu zwei Stellen nach dem Komma (vorher halbe ab 0,5), Skript `gemeinsam` geändert.
- **1.3.9** Nachbesserung: Lebensmittel „Einzeln“ nach Abteilung gruppiert (Wunsch der Person, 9.11.2026).
- **1.3.10** Nachbesserung: Packung je Lebensmittel, Menge im Rezept in g oder ml, Einkaufsliste zeigt Packungen und g (Spalten `packung`, `rezept_menge`). Dazu: Auf der Einkaufsliste fehlte bei jedem zweiten Eintrag einer Abteilung „für …“.
- **1.3.11** Finanzen → Auswertung (A2, A3): Vergleich mit Vormonat, Durchschnitt der 12 Monate davor und Vorjahr; Kategorien gegen Vorjahr; Jahresverlauf (Säulen Ein/Aus, Linie Bilanz seit Januar); Jahrestabelle mit Budget, Sparquote, Summe und Ø; „Ganzes Jahr“ zählt das Budget nur für Monate mit Buchungen; Bafög zum Aufklappen.
- **1.3.12** Finanzen → Auswertung (A1): oben Eingenommen und Ausgegeben unter der Bilanz, Budget „… von … verbraucht, … übrig“ mit Satz, was „verbraucht“ ist; Fixkosten unter dem Budget (Skript `finanzen` neu); Säulen ohne Budget-Linie und wie „Monatsnetto“ (ein Plus in einer Netto-Spalte zählt als 0).
- **1.3.13** Nachbesserung: Kreditkarte nicht mehr bei den Kontoständen und beim Buchen (am PC fünf Stände nebeneinander).
- **1.3.14** Nachbesserung: „Fixkosten“ getrennt in „Feste Ausgaben“ (bezahlt) und „Feste Einnahmen“ (eingegangen, zum Beispiel Gehalt), Skript `finanzen` liefert `zweckEinnahmen`.
- **1.3.15** Finanzen → Auswertung (A4): Größte Ausgaben (Monat 5, Jahr 10) und Letzte Buchungen (10, „Alle zeigen“) aus dem Blatt `Alle Buchungen`, Skript-Aktion `buchungen`.
- **1.3.16** Finanzen → Auswertung (A5): Vermögen am Monatsende als Linie über die ganze Zeit (Skript `finanzen`, `vermoegen` in `analyse`).
- **1.3.17** Einkauf: Abteilungen in der Reihenfolge im Laden (Blatt `laden_reihenfolge`), auf der Einkaufsliste und bei Lebensmittel „Einzeln“.
- **1.3.18** Einkauf: Pfeile für die Reihenfolge im Laden als ^ und v, jetzt auch bei Lebensmittel „Einzeln“.
- **1.3.20** Besitz: Unterorte in bis zu drei Ebenen (Formular, Ort-Filter als Baum, Liste, Übersicht), Markierung „Ausmisten“ mit Filter (Spalte `ausmisten`).
- **1.3.21** Besitz: Kacheln kompakt (Name und rechts die Anzahl, Kategorie nur noch im Fenster mit allen Angaben, am PC ohne Spalte Kategorie).
- **1.3.22** Kopfzeile der App bleibt oben angeheftet. Besitz: fester Listenkopf, Sortierzeile oben, Zubehör in der Kachel der Hauptsache, „Items“ statt „Sachen“, Ausleihen und Ausmisten direkt im Fenster, Hinweis unter der Übersicht weg.
- **1.3.23** Besitz: Filme, Bücher und Spiele als Bild-Kacheln nebeneinander (Bild oben, Name unten, Handy zwei, PC vier je Reihe). Rahmen des Zubehör-Knopfs in der Farbe des Bereichs.
- **1.3.24** Besitz: Bild-Kacheln nur noch, wenn im Filter Filme, Bücher oder Spiele gewählt ist.
- **1.3.25** Besitz: freiwillige Spalte `unklar` im Sheet, Kachel dann gelb. Skript `leben` neu einfügen und `einrichten` ausführen.
- **1.3.26** Finanzen → Auswertung: „Fixkosten“ und „Fix-Einnahmen“, Spalte `monate` für jährliche Posten, Monatsauswahl oben, Bafög aufgeklappt, drei Hinweistexte weg, schneller (Zwischenspeicher im Skript, jedes Blatt nur einmal gelesen).
- **1.3.27** Besitz: Listenkopf mit Filtern wieder nicht mehr fest, er scrollt auf allen Geräten mit.
- **Etappe 12** Entschlacken (Abschluss = 1.4.0). **1.3.28** Schritt 12.1: Rückblick aus `docs/STAND.md` nach `docs/GESCHICHTE.md` verschoben, veraltete Projektdateien gelöscht.
- **1.3.29** Schritt 12.2: Zeitgrenze für Anfragen, Übergangs-Code für alte Skripte in Einkauf weg, gemeinsame Helfer (`euro`, `datumText`, `bildSpeicher` …), kein Service Worker auf Visitenkarten-Links, kleine Reste weg.
- **1.3.30** Schritt 12.3: Skript `karte` ohne alte Aktion `kontakt`, Skript `gemeinsam` liest jedes Blatt je Anfrage nur einmal und ohne Merker für alte App-Fassungen. Skripte `karte` und `gemeinsam` neu einfügen.
- **1.4.0** Schritt 12.4: Besitz und Pen & Paper nutzen ein gemeinsames Bild-Feld (`bildFeld` in `js/ui/bild.js`).
- **1.4.1** Besitz behoben: Das Formular speicherte leere Unterorte mit („Zimmer /  / “), solche Items fehlten danach in der Liste. Jetzt ohne leere Ebenen; die App ordnet beim Laden auch alte Einträge so (`ordne` in `js/views/besitz.js`), im Sheet wird es beim nächsten Speichern richtig.
- **1.4.2** Besitz: „Gehört zu (Zubehör von)“ ist ein Feld mit Vorschlägen wie Kategorie und Ort (`auswahlFeld`), Vorschlag „Name · Ort“; freier Text, der zu keinem Vorschlag passt, wird nicht gespeichert.
- **1.4.3** Besitz: „Abbrechen“ im Formular; ändert sich der Ort einer Hauptsache, zieht Zubehör am alten Ort mit um (die App speichert es einzeln mit); ein Filter „Ausgeliehen / Ausmisten“ (Alle, Ausgeliehen, verkaufen, verschenken, entsorgen, „Items mit Anzahl 0“ statt des Hakens, ab 1.4.4; andere Werte nur über die Übersicht); die Trefferzahl steht an der vierten Stelle der Filter statt in einer eigenen Zeile.
- **1.4.4** Besitz: Filter-Texte kürzer (verkaufen dazu, ohne „Ausmisten:“ und „Auch“), Trefferzahl ohne Überschrift, Sortierzeile näher an der Liste.
- **Etappe 13** Herbarium. **1.5.0** Schritt 13.0: Plan `docs/PLAN-ETAPPE-13.md` (Reiter Herbarium: Pflanzen als Karteikarten mit Herbarium-Angaben, weitere Karten je Kategorie, Lernen mit 5 Fächern).
- **1.5.1** Antworten zum Plan: zwei Unterreiter Herbarium und Karten (Karten mit Wahl des Fachbereichs), 5 Fächer, 5 Bilder, Reiter am Handy nur als Kachel.
- **1.5.2** Plan: Pflanzen lassen sich auch unter Karten anlegen (auch noch nicht gefundene).
- **1.5.3** Schritt 13.1: Skript `leben` mit den Blättern `arten` und `karten` und den Aktionen `herbar`, `herbar_speichern`, `herbar_loeschen`, `herbar_bild`, `herbar_gelernt`. Skript neu einfügen, `einrichten` ausführen.
- **1.5.4** Schritt 13.2: Reiter Herbarium (🌿, Moosgrün, am Handy nur Kachel) mit Unterreiter Herbarium: Pflanzen suchen, filtern, ansehen, „Im Herbarium“ anhaken, anlegen und ändern mit bis zu 5 Bildern.
- **1.5.5** Schritt 13.3: Unterreiter Karten: Fachbereich Pflanzen mit Filter, fünf Fächer, Lernen (vorne deutscher Name, hinten alle Angaben, Marke „im Herbarium“ auf beiden Seiten), Antworten gehen im Hintergrund ans Skript.
- **1.5.6** Schritt 13.4: Karten in weiteren Fachbereichen (Wahl „+ Neuer Fachbereich“, Vorderseite, Rückseite, bis zu 5 Bilder), lernen wie bei Pflanzen; Bilder-Teil im Formular für Pflanzen und Karten gemeinsam.
- **1.5.7** Schritt 13.5: Etappe 13 abgeschlossen, Prüfung Sicherheit und Datenschutz (nur Bericht), Plan in STAND.md eingearbeitet (4 „Herbarium“), `docs/PLAN-ETAPPE-13.md` gelöscht.
- **1.5.8** Schritt 13.6: zwei kleine Funde der Prüfung im Skript `leben` behoben (`hasOwnProperty` beim Nachschlagen, Laden ohne Sperre).
- **Etappe 14** Bucket List. **1.6.0** Schritt 14.1: Plan Etappe 14 „Bucket List“ und Skript `gemeinsam` mit Blatt `bucketlist` (Ziele mit Titel, Notiz, „erreicht am“, Reihenfolge, einem Bild) und sechs neuen Aktionen; Partnerin oder Partner nur lesen.
- **1.6.1** Schritt 14.2: Reiter Bucket List in der App (`js/views/bucketlist.js`, Kachel und Seitenleiste am PC, Rosé, 🎯); Partnerin oder Partner sieht die Liste nur zum Lesen.
- **1.6.2** Schritt 14.3: Bucket List mit weiteren Listen (eigene Unterreiter, Spalte `liste` im Blatt `bucketlist`, Namen nur im Sheet), Hauptliste heißt „Unsere“.
- **1.6.3** Bucket List: Hauptliste heißt „Meine“ statt „Unsere“ (Wunsch der Person).
- **Etappe 15** Packlisten. **1.7.0** Schritt 15.1: Plan Etappe 15 „Packlisten“ und Skript `leben` mit Blatt `packliste` und Zähler `nutzungen` im Blatt `besitz` (für Items wie einen Wasserfilter); Aktionen `packliste`, `pack_speichern`, `pack_haken`, `pack_loeschen`, `pack_zuruecksetzen`, `pack_reihenfolge`, `besitz_nutzung`.
- **1.7.1** Schritt 15.2: Reiter Packlisten in der App (`js/views/packlisten.js`, Kachel und Seitenleiste am PC, Flieder, 🧳, Symbol Koffer); Haken hin und zurück, Pfeile, „Alle Haken weg“, Zähler „Nutzungen“.
- **1.7.2** Schritt 15.3: Besitz zeigt und ändert den Zähler „Nutzungen“ (Fenster und Formular).
- **1.7.3** Packlisten: Zähler „Nutzungen“ nur bei Haken „Hin“; grüner Wanderrucksack (`icons/rucksack.svg`) statt 🧳, neues Reiter-Symbol.
- **1.7.4** Packlisten: Zähler „Nutzungen“ auch ohne Netz (Schritte im Gerät, werden nachgetragen); „Item aus dem Besitz“ als Suchfeld mit Liste.
- **1.7.5** Packlisten: zuletzt gezeigte Zähler im Gerät, damit sie auch beim Öffnen ohne Netz da sind.
- **1.7.6** Schritt 15.4: Abschluss Etappe 15 „Packlisten“ (Prüfung ohne schlimme Funde, Plan in `docs/STAND.md` 4 eingearbeitet, `docs/PLAN-ETAPPE-15.md` gelöscht). Beide kleinen Funde der Prüfung behoben: `packZuruecksetzen_` schreibt die Spalten `hin` und `zurueck` in einem Zug, Haken senden je Eintrag nacheinander.
- **1.8.0** Schritt 16.1: Skript `gemeinsam` mit Blatt `projekte` (Projekte mit Abschnitten, Titel, Notiz, Status idee/laeuft/pausiert/fertig, Reihenfolge); Partner*in darf dort alles. Plan `docs/PLAN-ETAPPE-16.md`.
- **1.8.1** Schritt 16.2: Reiter Projekte (`js/views/projekte.js`, 🛠️, Taupe `#A39382`, Symbol Hammer): eine Liste mit Abschnitten als zweiter Ebene, bunter Kreis je Status (Idee violett, Läuft sandgelb, Pausiert grau, Fertig grün), Pfeile ^ v, Formular mit Titel, Status, Notiz; Partner*in darf alles. Bis 16.3 am Handy nur Kachel.
- **1.8.2** Schritt 16.3: Reihenfolge der Leiste Tracking, Finanzen, Projekte, Start (Thetadex-Icon), Einkauf, Besitz, Uni (Pen & Paper und Döner am Handy nur Kachel); Kacheln der Startseite nach `START` (Tracking, Finanzen, Projekte, Einkauf, Uni, Besitz, Visitenkarte, Rest).
- **1.8.3** Schritt 16.4: Partner*in darf auch in Uni und Bucket List anlegen, ändern, sortieren, Bilder hochladen und löschen (`ERLAUBT_` im Skript `gemeinsam`, Knöpfe in `js/views/uni.js` und `js/views/bucketlist.js`).
- **1.8.4** Nachbesserung zu 16.2 und 16.3: eigenes Bild `icons/werkzeug.svg` statt 🛠️ (Emoji hatte am PC einen lila Schimmer); Knopf Start am Handy größer, etwas höher, mittig in einem Kreis in Kohle; am PC kein Start in der Seitenleiste.
- **1.8.5** Nachbesserung: Knopf Start am Handy mit der Karteikarte `icons/thetadex-karte.svg` im Kreis; hell Kohle mit Ring und weiter erhöht (Variante D), dunkel kleiner und flacher mit feinem Ring (Variante B), Werte `--start-grund`, `--start-groesse`, `--start-hoch` in `css/base.css` (Wunsch der Person). Vorher war der Kreis im Dunkelmodus nicht zu sehen.
- **1.8.6** Nachbesserung: `icons/reiter/projekte.svg` neu gezeichnet, Hammer mit breitem Kopf und Stiel, damit er klar zu erkennen ist (Wunsch der Person).
- **1.8.7** Nachbesserung: `icons/werkzeug.svg` neu gezeichnet (Hammerkopf quer zum Holzstiel, Schraubenschlüssel mit offenem Maul), weil der Hammer vorher nicht zu erkennen war.
- **1.8.8** Schritt 16.5: Abschluss Etappe 16 „Projekte“ (Prüfung ohne schlimme Funde, Plan in `docs/STAND.md` 4 eingearbeitet, `docs/PLAN-ETAPPE-16.md` gelöscht).
- **1.8.9** Fund 1 der Prüfung zu Etappe 16: Status in der Liste Projekte als abgerundetes, farbiges Feld mit dem Wort rechts neben dem Titel, alle gleich breit in einer Spalte; Dreieck zum Aufklappen entfernt, Aufklappen zeigt Notiz und Abschnitte; `--status-idee` kräftiger für lesbare Schrift (Wunsch der Person).
- **1.8.10** Nachbesserung: `icons/reiter/projekte.svg` durch Hammer Vorschlag E ersetzt (Kopf mit abgeschrägter Seite), in Leiste, Seitenleiste und Kachel (Wunsch der Person, 24.11.2026).
- **1.9.0** Schritt 17.1: Skript `gemeinsam`: Blatt `bingo` (ein Feld je Zeile, kleines Bild als Text direkt im Sheet, kein Drive) und Aktionen `bingo`, `bingo_speichern`, `bingo_haken`, `bingo_loeschen` für Person und Partner*in; wird ein verknüpftes Projekt „fertig“, bekommt das Feld den Haken, abhaken geht immer auch von Hand; Plan `docs/PLAN-ETAPPE-17.md`.
- **1.9.1** Schritt 17.2: Reiter Projekte mit Unterreitern Projekte · Bingo (`js/views/bingo.js`): 5 × 5 Felder mit Bild, Textzeile und Kästchen, abgehakt grau, Zähler „n von 25 geschafft“, Jahre mit ‹ ›, Fenster mit großem Bild und verknüpftem Projekt, Formular mit Bild (quadratisch 240 px, `quadratBild` in `js/ui/bild.js`), Text und Projekt.
- **1.9.2** Schritt 17.3: Das laufende Jahr des Bingos mit seinen Bildern liegt im Gerät (`thetadex_bingo`), steht beim Öffnen sofort da und bleibt ohne Netz mit „Stand von …“ stehen (Wunsch der Person, 24.11.2026).
- **1.9.4** Schritt 17.4: Abschluss Etappe 17 „Bingo“ (Prüfung ohne schlimme Funde, Plan in `docs/STAND.md` 4 „Projekte“ eingearbeitet, `docs/PLAN-ETAPPE-17.md` gelöscht).
- **1.10.0** Schritt 18.0: Plan `docs/PLAN-ETAPPE-18.md` „Widget“: eigene kleine Android-App mit Widget (Tracking heute und gestern, offene SMS) und Overlay am Abend; Skripte bekommen einen eigenen `WIDGET_SCHLUESSEL`, der nur ja/nein und eine Zahl liefert.
- **1.10.1** Schritt 18.1: Skripte Tracking und Finanzen: Aktion `widget` nur mit eigenem `WIDGET_SCHLUESSEL` (ohne Passwort, keine Sperre, zählt nie als Passwort-Fehlversuch). Tracking antwortet nur, ob heute und gestern eine Zeile da ist; Finanzen nur die Zahl der offenen SMS. Funktion `widgetSchluesselErzeugen` in beiden.
