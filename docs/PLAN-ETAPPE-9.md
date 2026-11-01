# Plan Etappe 9 „Kontowecker“ (1.1.x)

Stand: 1.11.2026, Entwurf zur Abstimmung (Schritt 9.0, Version 1.0.0 → 1.1.0).
Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.
Grundlage: STAND.md 1.2, 1.5, 1.6, 2.2, 4 („Kontowecker“, „Finanzen: keine Finanzdaten öffentlich“) und 7.2 (Etappe 9).

## Ziel

Jede Kontowecker-SMS der Bank landet von selbst im Finanz-Sheet als „offen“.
Im Reiter Finanzen zeigt die App eine Liste **„Noch zuordnen“**. Zu jeder SMS schlägt die App eine fertige Buchung vor
(Betrag, Ein oder Aus, Datum, wenn möglich Zweck und Kategorie). Die Person prüft, ändert bei Bedarf und tippt „Buchen“
oder „Verwerfen“. **Nichts wird ohne Tipp der Person gebucht.**

## Was gleich bleibt

- Alle anderen Reiter und Skripte bleiben unverändert. Das Finanz-Sheet behält seinen Aufbau (Blätter je Konto, `Übersicht`, Daten ab Zeile 8).
- Die bestehenden Aktionen `stats`, `analyse`, `buchen`, `einstellungen` arbeiten wie bisher. Keine neue Bereitstellung, die Adresse bleibt gleich.
- Keine fremden Server für die App, die Content-Security-Policy bleibt gleich.
- Im Repo stehen keine SMS, keine Bank, keine Absender-Nummer, keine Beträge, keine Händler, auch nicht in Beispielen oder Pull-Request-Texten.
  Beispiel-SMS gibt die Person nur im Chat (abgeändert), sie kommen nie ins Repo.

## Weg der SMS

```
Handy (Android)                    Finanz-Skript (Google)              Thetadex, Reiter Finanzen
Kontowecker-SMS kommt an  ──►  Aktion „sms“ mit SMS_SCHLUESSEL  ──►  „Noch zuordnen“ (mit Passwort)
Weiterleitungs-App:            legt eine Zeile im Blatt „SMS“         Vorschlag prüfen → Buchen oder Verwerfen
nur dieser Absender            als „offen“ ab, sonst nichts
```

### Weiterleitungs-App auf dem Handy (Empfehlung)

**„SMS to URL Forwarder“** (Entwickler bogkonstantin, Paket `tech.bogomolov.incomingsmsgateway`), geprüft am 1.11.2026, Fassung 2.4.0 vom Juni 2026:
- Offen (MIT-Lizenz), keine Werbung, keine Tracker, kein Konto, kein eigener Server. Sie schickt die SMS nur an die eingetragene Adresse.
- Regel je Absender: Nur SMS vom Kontowecker-Absender werden weitergeleitet. Alle anderen SMS verlassen das Handy nicht.
- Freie Vorlage für den Inhalt (JSON) mit Platzhaltern `%from%`, `%text%`, `%sentStamp%`. Text wird sauber eingepackt.
- Ohne Netz wartet sie und versucht es bis zu 10-mal neu. Fehlgeschlagene SMS kann sie aufheben und später neu senden.
- **Wichtig:** Sie ist nicht (mehr) im Play Store, weil Google SMS-Weiterleitung dort nicht erlaubt. Installieren über **F-Droid**.
  Play Protect kann warnen („Trotzdem installieren“). Ab Android 13 muss man ggf. unter App-Info → ⋮ → „Eingeschränkte Einstellungen zulassen“ tippen,
  damit sie die SMS-Erlaubnis bekommen darf.
- Sie leitet nur echte SMS weiter, keine RCS-Chats. Kontowecker-Nachrichten der Bank sind normale SMS.

Alternativen, falls F-Droid nicht gewünscht ist: **MacroDroid** (Play Store, einfach, aber Werbung und nicht offen) oder **Tasker** (kostet, kompliziert).
Für beide gilt derselbe Aufbau (Aktion `sms`, Schlüssel im Inhalt). Die Wahl trifft die Person (Rückfrage 1).

### Vorlage in der Weiterleitungs-App

Adresse: die bestehende Adresse des Finanz-Skripts (die Person kopiert sie aus Thetadex → Einstellungen; sie steht nie im Repo).
Inhalt (JSON-Vorlage):

```
{"action":"sms","schluessel":"<SMS_SCHLUESSEL>","von":"%from%","text":"%text%","zeit":%sentStamp%}
```

Der Schlüssel steht im Inhalt, nicht in einer Kopfzeile: Apps Script kann Kopfzeilen einer Anfrage nicht lesen.
Die Unterschrift `X-Signature` der App bleibt darum aus.

## Sicherheit und Datenschutz

- **Eigener Schlüssel `SMS_SCHLUESSEL`** (Skripteigenschaft, lang und zufällig, das Skript erzeugt ihn einmal im Editor).
  Er ist nicht das Passwort `APP_PIN`. Mit ihm geht nur eins: eine SMS als „offen“ ablegen. Er liest nichts, bucht nichts, löscht nichts.
  Die Antwort auf `sms` ist nur `{ok: true}` oder ein Fehler, nie Daten. Liegt der Schlüssel in der fremden App oder geht das Handy verloren,
  kann jemand höchstens falsche „offene“ SMS anlegen. Die Person sieht sie und verwirft sie. Neuer Schlüssel: Funktion im Editor nochmal ausführen.
- **Sperre:** 5 falsche Schlüssel → 15 Minuten gesperrt (eigener Zähler, getrennt vom Passwort). Höchstens 50 SMS am Tag, dann lehnt das Skript ab.
- **Böse Eingaben:** Text höchstens 640 Zeichen, Absender 40 Zeichen, beide mit `bereinigeText_`. Die App zeigt den Text nur mit `textContent`.
- **Doppelte SMS:** Die Weiterleitungs-App versucht es bei Fehlern neu. Das Skript bildet aus Absender, Zeit und Text eine Prüfsumme (SHA-256)
  und legt dieselbe SMS kein zweites Mal ab.
- **So wenig wie möglich:** Im Blatt `SMS` steht der SMS-Text nur, solange die SMS offen ist. Nach „Buchen“ oder „Verwerfen“ löscht das Skript
  Text und Absender aus der Zeile; Datum, Status und Prüfsumme bleiben (gegen Doppelte). Die Buchung selbst steht wie immer im Konto-Blatt.
  Neu sind damit Daten über andere (Name der Gegenseite in der SMS). Grund: Ohne sie lässt sich die Buchung nicht zuordnen. Sie bleiben im privaten Finanz-Sheet und nur bis zur Zuordnung.
- **Im Gerät** speichert Thetadex keine SMS (nur im Arbeitsspeicher, solange die Seite offen ist).
- Neue fremde App auf dem Handy: Sie sieht nur die SMS des Kontowecker-Absenders und kennt Adresse und Schlüssel. Siehe oben, was der Schlüssel kann.

## Finanz-Sheet: neues Blatt `SMS` (Kopfzeile in Zeile 1)

| Spalte | Inhalt |
| --- | --- |
| `id` | Kennung (setzt das Skript) |
| `empfangen_am` | wann das Skript die SMS bekam |
| `gesendet_am` | Zeit der SMS (aus `zeit`) |
| `absender` | Absender (leer nach Zuordnung) |
| `text` | SMS-Text (leer nach Zuordnung) |
| `pruefsumme` | gegen doppelte SMS |
| `status` | `offen`, `gebucht` oder `verworfen` |
| `erledigt_am` | wann zugeordnet |

Das Blatt legt die Funktion `einrichten` an (bestehende Blätter bleiben unverändert).

## Vorschlag für die Buchung

Die App liest aus dem Text mit allgemeinen Mustern (ohne Bankname im Code):
- **Betrag:** zum Beispiel `12,34 EUR`, `EUR 12,34`, `-12,34 €`, `1.234,56`.
- **Ein oder Aus:** Wörter wie „Gutschrift“, „Eingang“, „Zahlungseingang“ oder `+` → Ein; „Belastung“, „Abbuchung“, „Lastschrift“, „Kartenzahlung“ oder `-` → Aus.
- **Datum:** ein Datum im Text (`TT.MM.JJJJ` oder `TT.MM.`), sonst das Datum der SMS.
- **Konto:** Vorgabe `Konto` (Rückfrage 4).
- **Zweck und Kategorie:** aus einer neuen Liste `sms` im bestehenden Blatt `Einstellungen` (keine neuen Spalten):
  `liste` = `sms`, `name` = Suchwort (zum Beispiel ein Händler), `zweck`, `kategorie`. Kommt das Suchwort im Text vor, füllt die App Zweck und Kategorie aus.
  Ohne Treffer bleiben sie leer und die Person wählt wie gewohnt.

Kann die App keinen Betrag finden, zeigt sie nur den Text und ein leeres Formular. Die Muster passt der Agent an,
sobald die Person zwei abgeänderte Beispiel-SMS im Chat geschickt hat (Rückfrage 2).

## Schritte

Jeder Schritt = ein Zweig = ein Pull Request.

- **9.0 Plan** (1.1.0): diese Datei, STAND.md auf Etappe 9.
- **9.1 Skript: SMS annehmen** (1.1.1) – `apps-script/finanzen/Code.gs`:
  Aktion `sms` (vor der Passwort-Prüfung, nur mit `SMS_SCHLUESSEL`), Blatt `SMS` in `einrichten`, Funktion `smsSchluesselErzeugen`
  (legt den Schlüssel an und zeigt ihn einmal im Protokoll). Dazu eine Anleitung im Pull Request: Weiterleitungs-App installieren und einrichten,
  Test-SMS mit dem Knopf „Test“ der App. Die App Thetadex ändert sich in diesem Schritt nicht.
- **9.2 Noch zuordnen** (1.1.2) – Skript: Aktionen `smsListe` (offene SMS, mit Passwort) und `smsErledigt` (verwerfen);
  `buchen` nimmt zusätzlich `sms_id` an und setzt die SMS im selben Lauf auf „gebucht“ (eine Sperre, kein halbes Ergebnis).
  App (`js/views/finanzen.js`, neue Datei `js/views/finanzen-sms.js`): Karte „Noch zuordnen (3)“ oben im Reiter Finanzen,
  je SMS Text, Vorschlag, Knöpfe „Buchen…“ (öffnet das bekannte Buchungsformular, vorausgefüllt) und „Verwerfen“ (mit Nachfrage).
- **9.3 Suchwörter** (1.1.3): Liste `sms` aus dem Blatt `Einstellungen` für Zweck und Kategorie; Muster nach den Beispiel-SMS feinstellen.
- **9.4 Abschluss** (1.1.4): kurze Prüfung Sicherheit und Datenschutz der Etappe (Bericht nur in den Projektdateien), Plan in STAND.md einarbeiten, diese Datei löschen.

## Prüfung gegen die Grundsätze (1.2)

- Welche Daten? Nur Kontowecker-SMS, und deren Text nur bis zur Zuordnung.
- Wer sieht sie? Nur die Person (Passwort). Der SMS-Schlüssel kann nur ablegen, nie lesen.
- Geht es einfacher? Direkt buchen ohne Bestätigung wäre weniger Tippen, aber falsche Muster würden still falsche Buchungen erzeugen.
  Mit Vorschlag und einem Tipp bleibt das Sheet richtig. Ein eigenes Sheet für SMS wäre mehr Einrichtung ohne Gewinn.

## Rückfragen an die Person

1. Passt „SMS to URL Forwarder“ über F-Droid (siehe oben), oder lieber MacroDroid aus dem Play Store?
2. Bitte zwei Kontowecker-SMS **abgeändert** in den Chat schicken (eine Abbuchung, ein Eingang): Beträge, Namen und Kontonummern ändern,
   den Aufbau und die Wörter gleich lassen. Sie kommen nie ins Repo.
3. Vorschlag zum Bestätigen statt automatisch buchen: passt das?
4. Kommen Kontowecker-SMS nur für das Girokonto (Blatt `Konto`), oder auch für die Kreditkarte?
5. Text nach der Zuordnung aus dem Blatt `SMS` löschen (Vorschlag) oder aufheben?
