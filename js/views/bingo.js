// Unterreiter Bingo im Reiter Projekte (Etappe 17, docs/PLAN-ETAPPE-17.md). Ein Jahres-Vorsatz-Bingo mit 5 × 5 Feldern je Jahr.
// Ein Feld: Bild, kurze Textzeile, Kästchen unten rechts; abgehakt wird es grau. Ein Feld kann mit einem Projekt verknüpft sein:
// Wird das Projekt „fertig“, setzt das Skript den Haken. Abhaken geht immer auch von Hand (Wunsch der Person, 24.11.2026).
// Die Bilder stehen klein im Sheet (kein Drive), darum kommt ein ganzes Jahr mit einer Anfrage. Person und Partner*in dürfen alles.
// Im Gerät (ab 1.9.2, Wunsch der Person, 24.11.2026): das laufende Jahr mit Bildern (thetadex_bingo, ohne Rolle).
// Beim Öffnen steht es sofort da, dann lädt die App frisch. Ohne Netz bleibt es mit „Stand von …“ stehen.
// Ändern prüft immer das Skript (Feld belegt, inzwischen geändert), darum sind die Knöpfe auch dann da.

import { el, leeren, vergleiche } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { quadratBild } from '../ui/bild.js';
import { lesen, schreiben } from '../store.js';

const FELDER = 25;
const MAX_TEXT = 40;
const STATUS_TEXT = { idee: 'Idee', laeuft: 'Läuft', pausiert: 'Pausiert', fertig: 'Fertig' };

// Zuletzt geladenes Jahr { jahr, jahre, felder, projekte }, nur im Arbeitsspeicher
let daten = null;
// Gezeigtes Jahr; leer = dieses Jahr (bestimmt das Skript)
let jahr = 0;

// oeffneDialog(titel, inhalt) und dialog kommen vom Reiter Projekte, ebenso ladeStatus (Meldungen beim Laden)
export function bingoTeil({ oeffneDialog, dialog, ladeStatus }) {
    const box = el('div', { class: 'bingo', attrs: { id: 'projekte-teil-bingo' } });
    const hakenStatus = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
    let sendet = false;

    const feldAn = (nr) => daten && daten.felder.find((f) => f.feld === nr);
    const projektVon = (f) => (f && f.projekt && daten ? daten.projekte.find((p) => p.id === f.projekt) : null);
    const diesesJahr = () => new Date().getFullYear();

    // Gleich zeigen, was im Gerät liegt (nur das laufende Jahr)
    const imGeraet = lesen('bingo', null);
    if (!daten && imGeraet && imGeraet.daten && imGeraet.daten.jahr === diesesJahr() && (!jahr || jahr === diesesJahr())) {
        daten = imGeraet.daten;
        jahr = daten.jahr;
    }
    // Das laufende Jahr nach dem Laden und nach jeder gespeicherten Änderung im Gerät ablegen
    function imGeraetMerken() {
        if (daten && daten.jahr === diesesJahr()) schreiben('bingo', { stand: Date.now(), daten });
    }
    const standText = (ms) => new Date(ms).toLocaleString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    async function senden(status, knoepfe, action, werte) {
        if (sendet) return null;
        sendet = true;
        knoepfe.forEach((k) => { k.disabled = true; });
        status.textContent = 'Sende …';
        try {
            const antwort = await api('gemeinsam', action, werte);
            status.textContent = '';
            return antwort;
        } catch (e) {
            status.textContent = 'NICHT gespeichert: ' + e.message;
            return null;
        } finally {
            sendet = false;
            knoepfe.forEach((k) => { k.disabled = false; });
        }
    }

    function merke(f) {
        const i = daten.felder.findIndex((x) => x.id === f.id);
        if (i >= 0) daten.felder[i] = f; else daten.felder.push(f);
        imGeraetMerken();
    }

    // --- Abhaken: wirkt sofort, klappt das Senden nicht, springt der Haken zurück ---
    async function haken(f, wert) {
        f.erledigt = wert;
        zeige();
        hakenStatus.textContent = '';
        try {
            const antwort = await api('gemeinsam', 'bingo_haken', { id: f.id, erledigt: wert });
            if (antwort && antwort.feld) merke(antwort.feld);
        } catch (e) {
            f.erledigt = !wert;
            hakenStatus.textContent = 'Haken NICHT gespeichert: ' + e.message;
        }
        zeige();
    }

    // --- Fenster: großes Bild, ganzer Text, Projekt, Bearbeiten ---
    function zeigeFeld(f) {
        const p = projektVon(f);
        const kasten = el('input', { attrs: { type: 'checkbox', id: 'bingo-d-haken' } });
        kasten.checked = f.erledigt;
        kasten.addEventListener('change', () => { haken(f, kasten.checked); });
        oeffneDialog(f.text, [
            f.bild ? el('img', { class: 'besitz-dialog-bild bingo-gross' + (f.erledigt ? ' ist-erledigt' : ''), attrs: { src: f.bild, alt: '' } }) : null,
            p ? el('p', {}, [
                el('span', { text: 'Projekt: ' + p.titel + ' ' }),
                el('span', { class: 'projekt-status ist-' + p.status, text: STATUS_TEXT[p.status] || '' })
            ]) : null,
            p ? el('p', { class: 'leise', text: 'Wird das Projekt auf „Fertig“ gesetzt, bekommt das Feld den Haken.' }) : null,
            el('p', { class: 'bingo-d-haken' }, [kasten, el('label', { text: 'Geschafft', attrs: { for: 'bingo-d-haken' } })]),
            el('div', { class: 'besitz-form-knoepfe' }, [
                el('button', { class: 'knopf knopf-zweit', text: 'Bearbeiten', attrs: { type: 'button' }, on: { click: () => zeigeForm(f, f.feld) } })
            ])
        ].filter(Boolean));
    }

    // --- Formular: neu (f = null) oder ändern ---
    function zeigeForm(f, nr) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const text = el('input', { attrs: { id: 'bingo-f-text', type: 'text', maxlength: MAX_TEXT, autocomplete: 'off', value: f ? f.text : '' } });
        const projekte = daten.projekte.slice().sort((a, b) => (a.reihenfolge - b.reihenfolge) || vergleiche(a.titel, b.titel));
        const wahl = el('select', { attrs: { id: 'bingo-f-projekt' } }, [
            el('option', { text: 'kein Projekt', attrs: { value: '' } }),
            ...projekte.map((p) => el('option', { text: p.titel, attrs: { value: p.id } }))
        ]);
        wahl.value = f && projekte.some((p) => p.id === f.projekt) ? f.projekt : '';

        // Bild: undefined = bleibt, '' = weg, sonst das neue (schon verkleinert)
        let neuesBild;
        const vorschau = el('img', { class: 'bingo-vorschau', attrs: { alt: 'Vorschau', hidden: true } });
        const datei = el('input', { attrs: { id: 'bingo-f-bild', type: 'file', accept: 'image/*' } });
        const weg = el('button', { class: 'knopf knopf-zweit', text: 'Bild entfernen', attrs: { type: 'button', hidden: true } });
        function zeigeVorschau() {
            const adresse = neuesBild !== undefined ? neuesBild : (f ? f.bild : '');
            vorschau.hidden = !adresse;
            weg.hidden = !adresse;
            if (adresse) vorschau.src = adresse; else vorschau.removeAttribute('src');
        }
        datei.addEventListener('change', async () => {
            const d = datei.files && datei.files[0];
            if (!d) return;
            status.textContent = 'Bild wird verkleinert …';
            try {
                neuesBild = await quadratBild(d);
                status.textContent = '';
            } catch (e) {
                status.textContent = e.message;
            }
            datei.value = '';
            zeigeVorschau();
        });
        weg.addEventListener('click', () => { neuesBild = ''; zeigeVorschau(); });
        zeigeVorschau();

        const speichern = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const loeschen = f ? el('button', { class: 'knopf knopf-zweit', text: 'Feld leeren', attrs: { type: 'button' }, on: { click: () => entfernen() } }) : null;
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        const knoepfe = [speichern, loeschen, abbrechen].filter(Boolean);

        async function absenden(ev) {
            ev.preventDefault();
            const t = text.value.trim();
            if (!t) { status.textContent = 'Bitte das Ziel eingeben.'; text.focus(); return; }
            const werte = { text: t, projekt: wahl.value };
            if (neuesBild !== undefined) werte.bild = neuesBild;
            if (f) { werte.id = f.id; werte.geaendert_am = f.geaendert_am; } else { werte.jahr = daten.jahr; werte.feld = nr; }
            const antwort = await senden(status, knoepfe, 'bingo_speichern', werte);
            if (!antwort || !antwort.feld) return;
            merke(antwort.feld);
            dialog.close();
            zeigeGespeichert(f ? 'Geändert' : 'Gespeichert', antwort.feld.text);
            zeige();
        }

        async function entfernen() {
            if (!confirm('Feld „' + f.text + '“ leeren?')) return;
            const antwort = await senden(status, knoepfe, 'bingo_loeschen', { id: f.id, geaendert_am: f.geaendert_am });
            if (!antwort) return;
            daten.felder = daten.felder.filter((x) => x.id !== f.id);
            imGeraetMerken();
            dialog.close();
            zeigeGespeichert('Geleert', f.text);
            zeige();
        }

        oeffneDialog(f ? 'Feld ändern' : 'Neues Feld', [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden, input: () => { if (!sendet) status.textContent = ''; } } }, [
                el('label', { text: 'Ziel', attrs: { for: 'bingo-f-text' } }), text,
                el('label', { text: 'Bild', attrs: { for: 'bingo-f-bild' } }), datei, vorschau, weg,
                el('label', { text: 'Projekt', attrs: { for: 'bingo-f-projekt' } }), wahl,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        text.focus();
    }

    // --- Ein Feld im Raster ---
    function feld(nr) {
        const f = feldAn(nr);
        if (!f) {
            return el('li', { class: 'bingo-feld ist-leer' }, [
                el('button', { class: 'bingo-feld-knopf', text: '+', attrs: { type: 'button', 'aria-label': 'Feld ' + (nr + 1) + ' befüllen' }, on: { click: () => zeigeForm(null, nr) } })
            ]);
        }
        const kasten = el('input', { class: 'bingo-kasten', attrs: { type: 'checkbox', 'aria-label': f.text + ' geschafft' } });
        kasten.checked = f.erledigt;
        kasten.addEventListener('change', () => { haken(f, kasten.checked); });
        return el('li', { class: 'bingo-feld' + (f.erledigt ? ' ist-erledigt' : '') }, [
            el('button', { class: 'bingo-feld-knopf', attrs: { type: 'button' }, on: { click: () => zeigeFeld(f) } }, [
                f.bild ? el('img', { class: 'bingo-bild', attrs: { src: f.bild, alt: '' } }) : el('span', { class: 'bingo-bild ist-ohne', attrs: { 'aria-hidden': 'true' } }),
                el('span', { class: 'bingo-text', text: f.text })
            ]),
            el('label', { class: 'bingo-haken' }, [kasten])
        ]);
    }

    // --- Ganzes Bingo: Jahr mit Pfeilen, Zähler, Raster ---
    function zeige() {
        leeren(box);
        if (!daten) return;
        const jahre = daten.jahre.slice();
        const bis = diesesJahr() + 1; // nächstes Jahr schon vorbereiten (zum Beispiel im Dezember)
        const vorher = jahre.filter((j) => j < daten.jahr).pop();
        const nachher = jahre.find((j) => j > daten.jahr) || (daten.jahr < bis ? daten.jahr + 1 : null);
        const geschafft = daten.felder.filter((f) => f.erledigt).length;
        box.append(
            el('div', { class: 'bingo-kopf' }, [
                el('button', { class: 'knopf knopf-zweit bingo-jahr-pfeil', text: '‹', attrs: { type: 'button', 'aria-label': 'Jahr davor', disabled: !vorher }, on: { click: () => wechsle(vorher) } }),
                el('h2', { class: 'bingo-jahr', text: String(daten.jahr) }),
                el('button', { class: 'knopf knopf-zweit bingo-jahr-pfeil', text: '›', attrs: { type: 'button', 'aria-label': 'Jahr danach', disabled: !nachher }, on: { click: () => wechsle(nachher) } })
            ]),
            el('p', { class: 'bingo-zaehler', text: geschafft + ' von ' + FELDER + ' geschafft' }),
            hakenStatus,
            el('ol', { class: 'bingo-raster', attrs: { 'aria-label': 'Bingo ' + daten.jahr } }, Array.from({ length: FELDER }, (_, nr) => feld(nr)))
        );
    }

    function wechsle(j) {
        if (!j) return;
        jahr = j;
        laden();
    }

    let ladeNr = 0;
    async function laden() {
        const nr = ++ladeNr;
        ladeStatus.textContent = daten ? 'Aktualisiere …' : 'Lädt …';
        try {
            const d = await api('gemeinsam', 'bingo', jahr ? { jahr } : {});
            if (nr !== ladeNr) return;
            daten = {
                jahr: d.jahr,
                jahre: Array.isArray(d.jahre) ? d.jahre : [d.jahr],
                felder: Array.isArray(d.felder) ? d.felder : [],
                projekte: Array.isArray(d.projekte) ? d.projekte : []
            };
            jahr = d.jahr;
            imGeraetMerken();
            ladeStatus.textContent = '';
            zeige();
        } catch (e) {
            if (nr !== ladeNr) return;
            // Ohne Netz: das laufende Jahr aus dem Gerät zeigen
            const im = lesen('bingo', null);
            if ((e.code === 'netz' || e.code === 'zeit') && im && im.daten && (!jahr || jahr === im.daten.jahr)) {
                daten = im.daten;
                jahr = daten.jahr;
                zeige();
                ladeStatus.textContent = 'Ohne Verbindung: Stand von ' + standText(im.stand) + ' Uhr. Ändern geht nur mit Netz.';
                return;
            }
            ladeStatus.textContent = 'Laden fehlgeschlagen: ' + e.message
                + (e.code === 'aktion' ? ' Bitte im Sheet „Gemeinsam“ die neue Fassung des Skripts einfügen, „einrichten“ ausführen und bereitstellen (Schritt 17.1).' : '');
        }
    }

    zeige();
    return { box, laden };
}
