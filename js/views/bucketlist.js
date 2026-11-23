// Reiter Bucket List (Etappe 14, docs/PLAN-ETAPPE-14.md). Eine gemeinsame Liste von Zielen.
// Oben die offenen Ziele, unten „Erreicht“; beide mit Pfeilen ^ und v sortierbar (wie die Abteilungen der Einkaufsliste).
// Ein Tipp auf den Titel klappt das Ziel auf (Bild, Notiz, „erreicht am“). Die Person darf alles, die Partnerin oder der Partner nur lesen.
// Daten aus dem Skript „gemeinsam“ (Sheet „Gemeinsam“, Blatt „bucketlist“). Nur im Arbeitsspeicher.

import { el, leeren, heute, kalenderBeiKlick, vergleiche, datumText } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { bildSpeicher, bildFeld } from '../ui/bild.js';

// Zuletzt geladene Daten { ziele, rolle }, nur im Arbeitsspeicher. Beim Öffnen sofort zeigen, dann frisch laden.
let daten = null;
// Aufgeklapptes Ziel (id) oder null
let offenId = null;
// Schon geladene Bilder (Drive-Kennung → data:-Bild), nur im Arbeitsspeicher
const bilder = bildSpeicher('gemeinsam');
const MAX_TITEL = 80;
const MAX_NOTIZ = 1000;

const istErreicht = (z) => Boolean(z.erledigt_am);
// Kleine Zahl zuerst; gleiche Zahl nach Titel
const ordne = (a, b) => (a.reihenfolge - b.reihenfolge) || vergleiche(a.titel, b.titel);
const offene = () => (daten ? daten.ziele.filter((z) => !istErreicht(z)).sort(ordne) : []);
const erreichte = () => (daten ? daten.ziele.filter(istErreicht).sort(ordne) : []);

export function render(container, ctx) {
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'bucket-dialog-titel' } });
    let sendet = false; // gegen doppeltes Senden durch mehrfaches Tippen
    // Ändern darf nur die Person (das Skript prüft es auch)
    const darfAendern = () => Boolean(daten) && daten.rolle === 'person';

    function oeffneDialog(titel, inhalt) {
        leeren(dialog);
        dialog.append(el('div', { class: 'besitz-dialog-inhalt' }, [
            el('div', { class: 'form-kopf' }, [
                el('h2', { text: titel, attrs: { id: 'bucket-dialog-titel' } }),
                el('button', { class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Schließen' }, on: { click: () => dialog.close() } })
            ]),
            ...inhalt
        ]));
        if (!dialog.open) dialog.showModal();
        dialog.scrollTop = 0;
    }

    // Führt eine Anfrage aus: sperrt die Knöpfe, zeigt Fehler in status. Liefert die Antwort oder null.
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

    // Gespeichertes Ziel in die Liste übernehmen
    function merke(z) {
        const i = daten.ziele.findIndex((x) => x.id === z.id);
        if (i >= 0) daten.ziele[i] = z; else daten.ziele.push(z);
    }

    // --- Formular: neu oder ändern ---
    function zeigeForm(z) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const titel = el('input', { attrs: { id: 'bucket-f-titel', type: 'text', maxlength: MAX_TITEL, autocomplete: 'off', value: z ? z.titel : '' } });
        const notiz = el('textarea', { attrs: { id: 'bucket-f-notiz', maxlength: MAX_NOTIZ, rows: 5, placeholder: 'freiwillig' } });
        notiz.value = z ? z.notiz : '';
        const datum = kalenderBeiKlick(el('input', { attrs: { id: 'bucket-f-datum', type: 'date', max: heute(), autocomplete: 'off', value: z ? z.erledigt_am : '' } }));
        const bild = bildFeld({ id: 'bucket-f-bild', alt: 'Bild zum Ziel', bilder });
        bild.setze(z ? z.bild : '');

        const speichern = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const loeschen = z ? el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button' }, on: { click: () => entfernen() } }) : null;
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        const knoepfe = [speichern, loeschen, abbrechen].filter(Boolean);

        async function absenden(ev) {
            ev.preventDefault();
            const t = titel.value.trim();
            if (!t) { status.textContent = 'Bitte einen Titel eingeben.'; titel.focus(); return; }
            if (datum.value && datum.value > heute()) { status.textContent = '„Erreicht am“ darf nicht in der Zukunft liegen.'; datum.focus(); return; }
            // Ein neues Bild (Datei oder Link) geht nach dem Speichern einzeln über bucket_bild hoch
            const alt = z ? z.bild : '';
            const b = bild.werte();
            const neuesBild = b.bild_daten ? b : (b.bild && b.bild !== alt ? b : null);
            const werte = { titel: t, notiz: notiz.value, erledigt_am: datum.value, bild: neuesBild ? alt : (b.bild || '') };
            if (z) { werte.id = z.id; werte.geaendert_am = z.geaendert_am; }
            const warNeu = !z;
            const antwort = await senden(status, knoepfe, 'bucket_speichern', werte);
            if (!antwort || !antwort.ziel) return;
            z = antwort.ziel;
            merke(z);
            if (neuesBild) {
                const mitBild = await senden(status, knoepfe, 'bucket_bild', { id: z.id, geaendert_am: z.geaendert_am, ...neuesBild });
                if (!mitBild || !mitBild.ziel) {
                    // Das Ziel ist gespeichert, nur das Bild nicht: Fenster bleibt offen, nochmal „Speichern“ versucht nur das Bild
                    status.textContent = 'Ziel gespeichert, Bild ' + status.textContent;
                    zeigeListe();
                    return;
                }
                z = mitBild.ziel;
                merke(z);
                bild.merke(z.bild);
            }
            offenId = z.id;
            dialog.close();
            zeigeGespeichert(warNeu ? 'Gespeichert' : 'Geändert', z.titel);
            zeigeListe();
        }

        // Löschen ist weich: Im Sheet steht dann geloescht = TRUE, die Person kann es dort zurückholen.
        async function entfernen() {
            if (!confirm('„' + z.titel + '“ löschen?')) return;
            const antwort = await senden(status, knoepfe, 'bucket_loeschen', { id: z.id, geaendert_am: z.geaendert_am });
            if (!antwort) return;
            daten.ziele = daten.ziele.filter((x) => x.id !== z.id);
            dialog.close();
            zeigeGespeichert('Gelöscht', z.titel);
            zeigeListe();
        }

        oeffneDialog(z ? 'Ziel ändern' : 'Neues Ziel', [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden, input: () => { if (!sendet) status.textContent = ''; } } }, [
                el('label', { text: 'Titel', attrs: { for: 'bucket-f-titel' } }), titel,
                el('label', { text: 'Notiz', attrs: { for: 'bucket-f-notiz' } }), notiz,
                ...bild.elemente,
                el('label', { text: 'Erreicht am (leer = noch offen)', attrs: { for: 'bucket-f-datum' } }), datum,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        titel.focus();
    }

    // --- Haken setzen oder abnehmen ---
    const listeStatus = el('p', { class: 'meldung bucket-status', attrs: { role: 'status', 'aria-live': 'polite' } });
    async function haken(z, knopf) {
        const antwort = await senden(listeStatus, [knopf], 'bucket_haken', { id: z.id, geaendert_am: z.geaendert_am, erledigt: !istErreicht(z) });
        if (!antwort || !antwort.ziel) return;
        merke(antwort.ziel);
        zeigeListe();
        if (istErreicht(antwort.ziel)) zeigeGespeichert('Erreicht', antwort.ziel.titel);
    }

    // --- Reihenfolge: Pfeile ^ und v. Verschieben wirkt sofort, gespeichert wird kurz nach dem letzten Tippen. ---
    const reiheText = el('span');
    const reiheNochmal = el('button', { class: 'knopf knopf-zweit', text: 'Nochmal speichern', attrs: { type: 'button', hidden: true }, on: { click: () => speichereReihe() } });
    const reiheStatus = el('p', { class: 'meldung einkauf-reihe-status bucket-reihe', attrs: { role: 'status', 'aria-live': 'polite' } }, [reiheText, reiheNochmal]);
    let reiheTimer = 0;
    let reiheFertigTimer = 0;

    function schiebe(z, d) {
        const gruppe = istErreicht(z) ? erreichte() : offene();
        const i = gruppe.findIndex((x) => x.id === z.id);
        const j = i + d;
        if (i < 0 || j < 0 || j >= gruppe.length) return;
        [gruppe[i], gruppe[j]] = [gruppe[j], gruppe[i]];
        // Wie das Skript: alle Ziele der Reihe nach 1, 2, 3 … (offene zuerst, dann erreichte)
        const alle = istErreicht(z) ? [...offene(), ...gruppe] : [...gruppe, ...erreichte()];
        alle.forEach((x, k) => { x.reihenfolge = k + 1; });
        zeigeListe();
        // Den Finger am gleichen Pfeil lassen; ist er jetzt aus (ganz oben oder unten), den anderen nehmen
        const knoepfe = [...listeBox.querySelectorAll('.einkauf-reihe-pfeil')].filter((k) => k.dataset.id === z.id);
        const ziel = knoepfe.find((k) => k.dataset.d === String(d) && !k.disabled) || knoepfe.find((k) => !k.disabled);
        if (ziel) ziel.focus();
        clearTimeout(reiheTimer);
        clearTimeout(reiheFertigTimer);
        reiheNochmal.hidden = true;
        reiheText.textContent = 'Wird gleich gespeichert …';
        reiheTimer = setTimeout(speichereReihe, 900);
    }
    async function speichereReihe() {
        clearTimeout(reiheTimer);
        if (sendet) { reiheTimer = setTimeout(speichereReihe, 600); return; }
        const ids = [...offene(), ...erreichte()].map((x) => x.id);
        reiheNochmal.hidden = true;
        const antwort = await senden(reiheText, [], 'bucket_reihenfolge', { ids });
        if (!antwort) { reiheNochmal.hidden = false; return; }
        // Inzwischen weiter geschoben? Dann gilt die neue Reihenfolge, sie wird gleich gespeichert.
        const jetzt = [...offene(), ...erreichte()].map((x) => x.id);
        if (jetzt.join('\n') === ids.join('\n') && Array.isArray(antwort.ziele)) {
            daten.ziele = antwort.ziele;
            zeigeListe();
        }
        if (reiheText.textContent === '') reiheText.textContent = 'Reihenfolge gespeichert.';
        reiheFertigTimer = setTimeout(() => { if (reiheText.textContent === 'Reihenfolge gespeichert.') reiheText.textContent = ''; }, 3000);
    }

    // --- Ein aufgeklapptes Ziel: Bild, Notiz, „erreicht am“, „Bearbeiten“ ---
    function inhalt(z) {
        const teile = [];
        if (z.bild) {
            const bild = el('img', { class: 'besitz-dialog-bild bucket-bild', attrs: { alt: 'Bild zu ' + z.titel, hidden: true } });
            const hinweis = el('p', { class: 'leise', text: 'Bild lädt …' });
            bilder.hole(z.bild)
                .then((a) => { bild.src = a; bild.hidden = false; hinweis.remove(); })
                .catch((e) => { hinweis.textContent = 'Bild nicht geladen: ' + e.message; });
            teile.push(bild, hinweis);
        }
        if (z.notiz) teile.push(el('p', { class: 'einkauf-notiz', text: z.notiz }));
        if (z.erledigt_am) teile.push(el('p', { class: 'leise', text: 'Erreicht am ' + datumText(z.erledigt_am) }));
        if (!z.bild && !z.notiz && !z.erledigt_am) teile.push(el('p', { class: 'leise', text: 'Keine Notiz.' }));
        if (darfAendern()) {
            teile.push(el('div', { class: 'besitz-form-knoepfe' }, [
                el('button', { class: 'knopf knopf-zweit', text: 'Bearbeiten', attrs: { type: 'button' }, on: { click: () => zeigeForm(z) } })
            ]));
        }
        return el('div', { class: 'einkauf-rezept-inhalt' }, teile);
    }

    // Eine Zeile: Haken, Titel (Tipp klappt auf), Pfeile
    function zeile(z, i, anzahl) {
        const erreicht = istErreicht(z);
        const istOffen = offenId === z.id;
        const aendern = darfAendern();
        const knopf = el('button', {
            class: 'einkauf-haken' + (erreicht ? ' ist-an' : ''),
            attrs: { type: 'button', 'aria-pressed': erreicht ? 'true' : 'false', 'aria-label': z.titel + ' erreicht', disabled: !aendern },
            on: { click: () => haken(z, knopf) }
        });
        const pfeile = aendern && anzahl > 1 ? el('span', { class: 'einkauf-reihe-pfeile' }, [-1, 1].map((d) => el('button', {
            class: 'einkauf-reihe-pfeil ' + (d < 0 ? 'ist-hoch' : 'ist-runter'),
            attrs: { type: 'button', 'aria-label': z.titel + (d < 0 ? ' nach oben' : ' nach unten'), disabled: d < 0 ? i === 0 : i === anzahl - 1, 'data-id': z.id, 'data-d': String(d) },
            on: { click: () => schiebe(z, d) }
        }))) : null;
        const klein = [erreicht ? datumText(z.erledigt_am) : '', z.bild ? '📷' : ''].filter(Boolean).join(' · ');
        return el('li', { class: 'einkauf-zeile einkauf-lm einkauf-rezept bucket-zeile' + (istOffen ? ' ist-offen' : '') + (erreicht ? ' ist-erreicht' : '') }, [
            knopf,
            el('button', {
                class: 'einkauf-lm-wahl', attrs: { type: 'button', 'aria-expanded': istOffen ? 'true' : 'false' },
                on: { click: () => { offenId = istOffen ? null : z.id; zeigeListe(); } }
            }, [
                el('span', { class: 'einkauf-lm-name' }, [
                    el('span', { class: 'einkauf-pfeil', text: istOffen ? '▾ ' : '▸ ', attrs: { 'aria-hidden': 'true' } }),
                    el('span', { text: z.titel })
                ]),
                klein ? el('span', { class: 'leise einkauf-klein', text: klein }) : null
            ]),
            pfeile,
            istOffen ? inhalt(z) : null
        ]);
    }

    // --- Liste: offen oben, „Erreicht“ unten ---
    const listeBox = el('div', { class: 'bucket-liste' });
    function zeigeListe() {
        leeren(listeBox);
        if (!daten) return;
        neuKnopf.hidden = !darfAendern();
        const of = offene(), er = erreichte();
        if (offenId && !daten.ziele.some((z) => z.id === offenId)) offenId = null;
        const gruppe = (titel, liste, leer) => [
            el('h2', { class: 'besitz-ort' }, [el('span', { text: titel }), el('span', { class: 'besitz-zahl', text: String(liste.length) })]),
            liste.length
                ? el('ul', { class: 'einkauf-liste' }, liste.map((z, i) => zeile(z, i, liste.length)))
                : el('p', { class: 'leise', text: leer })
        ];
        listeBox.append(
            ...gruppe('Noch offen', of, darfAendern() ? 'Noch keine offenen Ziele. Tippe auf „+ Neues Ziel“.' : 'Keine offenen Ziele.'),
            ...gruppe('Erreicht', er, 'Noch nichts erreicht.')
        );
    }

    // --- Laden ---
    const ladeStatus = el('p', { class: 'meldung besitz-lade', attrs: { role: 'status', 'aria-live': 'polite' } });
    const neuLaden = el('button', { class: 'knopf knopf-zweit besitz-neu', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => laden() } });
    async function laden() {
        neuLaden.disabled = true;
        ladeStatus.textContent = daten ? 'Aktualisiere …' : 'Lädt …';
        try {
            const d = await api('gemeinsam', 'bucket');
            daten = { ziele: Array.isArray(d.ziele) ? d.ziele : [], rolle: d.rolle || '' };
            ladeStatus.textContent = '';
            zeigeListe();
        } catch (e) {
            ladeStatus.textContent = 'Laden fehlgeschlagen: ' + e.message
                + (e.code === 'aktion' ? ' Bitte im Sheet „Gemeinsam“ die neue Fassung des Skripts einfügen, „einrichten“ ausführen und bereitstellen (Schritt 14.1).' : '');
        } finally {
            neuLaden.disabled = false;
        }
    }

    const neuKnopf = el('button', { class: 'knopf knopf-bereich', text: '+ Neues Ziel', attrs: { type: 'button', hidden: true }, on: { click: () => zeigeForm(null) } });
    container.append(
        el('div', { class: 'besitz-kopf' }, [
            el('h1', { class: 'bereich-titel titel-mit-emoji' }, [
                el('span', { class: 'titel-emoji', text: '🎯', attrs: { 'aria-hidden': 'true' } }),
                el('span', { text: ctx.bereich.titel })
            ]),
            neuKnopf
        ]),
        ladeStatus,
        listeStatus,
        reiheStatus,
        listeBox,
        neuLaden,
        dialog
    );
    zeigeListe();
    laden();
}
