# Plan Etappe 10 „Visitenkarte“ (1.2.x)

Stand: 4.11.2026, Schritt 10.0. Grundlage: Wunsch der Person (4.11.2026), ihre Antworten auf die Einschätzung
(Projektdateien `etappe-10/visitenkarte-einschaetzung.md`) und auf die Prüfung des Plans (Projektdateien `pruefung/visitenkarte-plan-bericht.md`, Funde 1 bis 4 übernommen). Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

## 1. Ziel

Eine Visitenkarte, die Besucher über einen Link oder QR-Code ohne Passwort sehen. Sie zeigt den aktuellen Status
(zum Beispiel ein Studiengang), Kontakt, Social-Media-Links und Veröffentlichungen. Alle Angaben kommen aus einem eigenen Sheet, nie aus dem Repo.
Besucher sehen nur die Karte, keinen anderen Reiter. Nur die Person sieht angemeldet die Links und QR-Codes.

## 2. Festlegungen (Antworten der Person, 4.11.2026)

1. **Drei Karten:** `privat`, `arbeit`, `aktivismus`. Jede Karte hat ihren eigenen Link. **Ein Link zeigt nur seine Karte**, es gibt für Besucher keinen Umschalter.
   Jede Angabe im Sheet sagt, auf welchen Karten sie steht. `arbeit` wird vielleicht nicht genutzt; ohne Angaben und ohne Link bleibt sie einfach leer.
2. **E-Mail und Telefon erst nach Tipp** auf „E-Mail zeigen“ oder „Nummer zeigen“ (Vorschlag, siehe 4). Kein Captcha.
3. **Veröffentlichungen:** nur Links (`https://`, zum Beispiel zur Uni-Seite), dazu freiwillig ein Vorschaubild, das die Person selbst in ihr Google Drive legt.
4. **Pflege nur im Sheet.** Die App ändert keine Angaben.
5. **Kein Foto** der Person.
6. **„Kontakt speichern“:** Die App erzeugt im Gerät eine Adressbuch-Datei (vCard). Darin steht auch der Link der Karte, damit man sie später wieder öffnen kann.
   Wird der Link erneuert, geht der gespeicherte Link nicht mehr (dann hilft nur ein neuer QR-Code).
7. **QR-Code** mit der freien Bibliothek „qrcode-generator“ (Kazuhiko Arase, MIT-Lizenz) als lokale Datei `vendor/qrcode.js`.
   Kostenlos und dauerhaft: Die Datei liegt im Repo, es gibt keinen fremden Dienst. Ausnahme von „keine Bibliotheken“ wie Chart.js (Abschnitt 4 in `docs/STAND.md`).
8. **Für die Person nur eine Kachel auf der Startseite** (`#/visitenkarte`), kein Reiter in der Leiste. Icon und die sieben Register bleiben, wie sie sind.
   Die Kachel hat keine Bereichsfarbe.
9. **Kein Impressum**, keine Datenschutzerklärung (Entscheidung der Person, 4.11.2026). Die Online-Karte ist nur der Notfall, wenn keine Papierkarte dabei ist.
10. **Eigenes Passwort `KARTE_PIN`** (Entscheidung der Person nach der Prüfung, Fund 4): Das Skript `karte` kennt `APP_PIN` nicht. Grund: Seine Adresse wird an Fremde verteilt;
    wer dort rät, kann so nie das Hauptpasswort für Finanzen, Tracking und die anderen Bereiche treffen.

## 3. Sheet „Visitenkarte“ und Skript `karte`

Eigenes Sheet, eigenes Skript (`apps-script/karte/Code.gs`), wie bei DSA und Döner. Grund: Ein Fehler hier kann nie Tracking, Finanzen oder Besitz verraten.
Nur `KARTE_PIN` (Skripteigenschaft, mindestens 12 Zeichen, anders als `APP_PIN`; Rolle Person), nach 5 Fehlversuchen 15 Minuten Sperre. Das Sheet wird mit niemandem geteilt. Kopfzeile in Zeile 1.

| Blatt | Spalten (Grenzen) |
| --- | --- |
| `angaben` | `art` (`status`, `name`, `email`, `telefon`, `social`, `veroeffentlichung`, `text`), `titel` (60, zum Beispiel „Instagram“), `wert` (200, Text, Adresse oder Nummer), `link` (nur `https://`, 300), `bild` (Drive-Kennung oder Drive-Link, nur bei `veroeffentlichung`), `karten` (zum Beispiel `privat,aktivismus`; leer oder unbekannt = auf keiner Karte, Groß- und Kleinschreibung und Leerzeichen egal), `reihenfolge` (0 bis 9999) + `id, erstellt_am, geaendert_am, geloescht` |
| `links` | `karte` (`privat`, `arbeit`, `aktivismus`), `schluessel` (64 Zeichen, setzt das Skript) + `id, erstellt_am, geaendert_am` |

- `einrichten` legt beide Blätter mit Kopfzeile an und je Karte eine Zeile in `links` (noch ohne Schlüssel = kein Link).
- Die Person trägt die Angaben im Sheet ein. Höchstens 100 Angaben.
- **Form von E-Mail und Telefon** (Fund 3): E-Mail nur als `name@domain` ohne `?`, `&`, Leerzeichen oder Komma; Telefon nur Ziffern, `+`, Leerzeichen, `/`, `-`.
  Passt eine Angabe nicht, gibt das Skript sie ohne Passwort nie heraus; in der Vorschau der Person steht sie mit dem Hinweis „Form passt nicht“.
  Angaben auf keiner Karte stehen in der Vorschau unter „Auf keiner Karte“ (Fund 2).
- **Aktionen mit Passwort:** `ping`, `angaben` (alles, auch E-Mail und Telefon, für die Vorschau), `link` (Schlüssel einer Karte erstellen oder erneuern; der alte gilt sofort nicht mehr),
  `link_weg` (Karte nicht mehr teilen). Der Schlüssel kommt nur beim Erstellen heraus, wie beim DSA-Bogen.
- **Ohne Passwort, nur mit Schlüssel:**
  - `karte`: welche Karte der Schlüssel öffnet und ihre Angaben **ohne** E-Mail und Telefon (dort steht nur, dass es sie gibt). Nie den Schlüssel, nie andere Karten, nie `geloescht`.
  - `kontakt`: E-Mail und Telefon dieser Karte (für „zeigen“ und „Kontakt speichern“).
  - `bild` mit Kennung einer Angabe: Vorschaubild als `data:`-Bild, nur für Angaben dieser Karte, nur Bilddateien, als kleines Vorschaubild aus Drive.
- **Schutz:** Ein gültiger Schlüssel geht immer durch (Fund 1, anders als beim DSA-Bogen: dort prüft das Skript zuerst die Sperre).
  Erst nach 20 falschen Schlüsseln in 15 Minuten werden weitere falsche sofort abgewiesen (eigener Zähler). So können Fremde keine Karte sperren. Obergrenze für alle zusammen:
  höchstens 300 Abrufe von `karte` und 60 von `kontakt` je Stunde (`CacheService`). Danach freundliche Meldung „Gerade zu viele Abrufe“.
  Das Skript ist nur lesend: Niemand kann etwas ins Sheet schreiben. Texte gehen nur als Text heraus, Links nur mit `https://`.
- Für das Vorschaubild braucht das Skript einmal die Drive-Erlaubnis (beim ersten Ausführen von `einrichten`).

## 4. Warum Tipp statt Captcha (Frage der Person)

- E-Mail und Telefon stehen nie in der Seite selbst. Sie kommen erst vom Skript, wenn die App im Browser läuft. Einfache Sammel-Bots führen kein JavaScript aus
  und finden darum nichts, auch wenn die Angaben gleich sichtbar wären.
- Mit Tipp ist es etwas sicherer: Ein Bot, der die Seite wie ein Browser öffnet, aber nicht tippt, bekommt E-Mail und Telefon trotzdem nicht.
  Der Tipp holt sie mit einer eigenen Anfrage (`kontakt`), die eine eigene, kleinere Obergrenze hat. Für Menschen kostet das einen Tipp.
- **Kein Captcha:** Gute Captchas (Google reCAPTCHA, hCaptcha) sind fremde Dienste, die Besucher verfolgen, die Content-Security-Policy öffnen
  und eine Datenschutzerklärung nötig machen. Selbst gebaute (Rechenaufgabe) lösen Bots leicht, sie nerven nur Menschen.
- Ehrlich: Gegen einen Menschen, der die Karte sieht und abschreibt, hilft nichts. Eigene Weiterleitungs-Adressen je Karte machen Spam abschaltbar.

## 5. App

- **Besucher-Ansicht** `#/karte/<skript>/<schluessel>` (`js/views/karte.js`): ohne Einrichtung, ohne Passwort. Reiterleiste, Einstellungen und Info sind ausgeblendet
  (heute zeigt die Leiste ohne Einrichtung den Döner-Reiter; auf der Karte nicht). Inhalt von oben nach unten: Name, Status, Kontakt („E-Mail zeigen“, „Nummer zeigen“,
  danach als `mailto:`- und `tel:`-Link), Social Media, Veröffentlichungen mit Vorschaubild, Knopf „Kontakt speichern“. Leere Gruppen fallen weg.
  Im Gerät der Besucher wird nichts gespeichert. Ist der Link ungültig: „Dieser Link gilt nicht (mehr).“
- **Für die Person** `#/visitenkarte` (nur Kachel auf der Startseite, sichtbar mit eingetragener Adresse des Skripts `karte`): Umschalter „Privat | Arbeit | Aktivismus“
  mit Vorschau der gewählten Karte, darunter „Link erstellen“, „Link kopieren“, „QR-Code zeigen“ (groß, zum Abfotografieren oder Zeigen), „Neuen Link erstellen“, „Nicht mehr teilen“.
  Im Gerät nur die eigenen Schlüssel (`thetadex_karte_links`, Karte → Schlüssel). Wurde ein Link an einem anderen Gerät erstellt, hilft „Neuen Link erstellen“.
- **Einstellungen:** neue Zeile „Visitenkarte“ für die Adresse des Skripts `karte` (`SKRIPTE` in `js/config.js`) und ein eigenes Feld für `KARTE_PIN`.
  Die App schickt an `karte` nur dieses Passwort, nie `APP_PIN`. Gespeichert nur im Gerät wie das Hauptpasswort, „Abmelden“ löscht es.
- **Warum die Script-Adresse im Link steht:** Besucher haben nichts eingerichtet. Die App muss aus dem Link wissen, welches Skript sie fragen soll,
  und die Adresse darf nicht ins öffentliche Repo (1.5). Die Adresse allein gibt nichts heraus: ohne Schlüssel keine Karte, ohne `KARTE_PIN` keine Verwaltung.
  Döner und geteilte Bögen machen es genauso.
- Die Content-Security-Policy bleibt gleich (`img-src 'self' data:`, Verbindungen nur zu Google Apps Script). „Kontakt speichern“ erzeugt die Datei im Gerät.

## 6. Schritte (je Schritt ein Zweig, ein Pull Request)

| Schritt | Version | Inhalt |
| --- | --- | --- |
| 10.0 | 1.2.0–1.2.1 | Dieser Plan (1.2.1: Funde der Prüfung und `KARTE_PIN`). |
| 10.1 | 1.2.2 | Sheet „Visitenkarte“ und Skript `karte` mit allen Aktionen (3), Adresse und `KARTE_PIN` in den Einstellungen. |
| 10.2 | 1.2.3 | Besucher-Ansicht `#/karte/…` mit „zeigen“, Vorschaubildern und „Kontakt speichern“. |
| 10.3 | 1.2.4 | Kachel und Ansicht `#/visitenkarte` für die Person: Vorschau, Links, QR-Code (`vendor/qrcode.js`, Eintrag in `LIZENZEN.md`). |
| 10.4 | 1.2.5 | Abschluss: kurze Prüfung Sicherheit und Datenschutz (Bericht nur in den Projektdateien), Plan in `docs/STAND.md` einarbeiten, diese Datei löschen. |

## 7. Prüfung gegen die Grundsätze

- **Welche Daten?** Nur, was die Person selbst auf die Karte schreibt. Über Besucher nichts (keine Zähler je Person, keine Geräte-Kennung).
  Google sieht wie bei Döner und geteilten Bögen die IP-Adresse der Besucher.
- **Wer sieht was?** Mit einem Link genau eine Karte, E-Mail und Telefon erst nach Tipp. Ohne Schlüssel nichts. Ändern nur im Sheet.
  Verwaltung nur mit `KARTE_PIN`; das Hauptpasswort ist an diesem öffentlich bekannten Skript nicht zu erraten.
- **Geht es einfacher?** Eine Karte fest ins Repo zu schreiben wäre weniger Code, verstößt aber gegen „Persönliches nie im Repo“. Ein eigenes kleines Skript nach dem Muster
  des DSA-Teilens ist der einfachste sichere Weg.
- **Neue fremde Teile:** nur `vendor/qrcode.js` (MIT), lokal.
