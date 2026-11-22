// Reiter Herbarium (Etappe 13, Plan docs/PLAN-ETAPPE-13.md). Unterreiter Herbarium (die Pflanzen) und Karten (lernen mit 5 Fächern, ab 13.3).
// Herbarium: Pflanzen suchen und filtern, ansehen, „Im Herbarium“ mit Nummer, Funddatum und Fundort anhaken, anlegen, ändern, löschen.
// Daten aus dem Skript „leben“ (Sheet „Leben“, Blätter „arten“ und „karten“). Nur mit Passwort, nur im Arbeitsspeicher.

import { el, leeren, heute, kalenderBeiKlick, vergleiche, datumText } from '../ui/dom.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { verkleinereBild, bildSpeicher } from '../ui/bild.js';
import { plusTage } from '../ui/kalender.js';

// Zuletzt geladene Daten { arten, karten }, nur im Arbeitsspeicher. Beim Öffnen sofort zeigen, dann frisch laden.
let daten = null;
// Gewählter Unterreiter. Bleibt, solange die Seite offen ist.
let teil = 'herbarium';
// Schon geladene Bilder (Drive-Kennung → data:-Bild), nur im Arbeitsspeicher
const bilder = bildSpeicher('leben');
const MAX_BILDER = 5;
// Lernen mit 5 Fächern (Leitner, 13.3): nach so vielen Tagen ist eine Karte im Fach wieder dran. Fach 1 immer.
const WARTEN_TAGE = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
// Dran: noch nie gelernt, Fach 1, oder die Wartezeit des Fachs ist um
const istDran = (k) => !k.gelernt_am || (k.fach || 1) <= 1 || plusTage(k.gelernt_am, WARTEN_TAGE[k.fach] || 0) <= heute();
// Gewählter Fachbereich und Lernstand der laufenden Runde. Bleiben, solange die Seite offen ist.
let fachbereich = 'pflanzen';
let runde = null;   // { karten: [...], i, umgedreht, gewusst, nicht }
// Antworten, die das Skript noch nicht bestätigt hat: { blatt, id, gewusst }
const offeneAntworten = [];

// Für die Suche: klein, ä = ae, ö = oe, ü = ue, ß = ss; dazu ohne Punkte (so findet „gans“ auch „Gänseblümchen“)
const norm = (t) => String(t == null ? '' : t).toLocaleLowerCase('de')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const ohnePunkte = (t) => String(t == null ? '' : t).toLocaleLowerCase('de').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
const findet = (text, wort) => norm(text).includes(norm(wort)) || ohnePunkte(text).includes(ohnePunkte(wort));

// Gattung = erstes Wort des lateinischen Namens („Bellis perennis“ → „Bellis“)
const gattung = (p) => String(p.latein || '').trim().split(/\s+/)[0] || '';
// Gruppen als Liste („Frühblüher, Heilpflanze“ → ["Frühblüher", "Heilpflanze"])
const gruppenVon = (t) => String(t || '').split(',').map((x) => x.trim()).filter(Boolean);
// „im Herbarium · Nr. 12“ oder „fehlt noch“
const herbarText = (p) => (p.im_herbar ? 'im Herbarium' + (p.herbar_nr ? ' · Nr. ' + p.herbar_nr : '') : 'fehlt noch');
const pflanzen = () => (daten ? daten.arten.filter((p) => p.reich === 'flora') : []);

// Ein Vorschaubild als Knopf. src = schon bekanntes Bild (zum Beispiel gerade gewählt), sonst lädt es über das Skript.
function vorschauBild(id, src, label, beiTipp) {
    const bild = el('img', { attrs: { alt: label, hidden: true } });
    const text = el('span', { class: 'leise', text: '…' });
    const knopf = el('button', {
        class: 'dsa-ab-bild', attrs: { type: 'button', 'aria-label': label },
        on: { click: () => { if (!bild.hidden) beiTipp(bild.src); } }
    }, [bild, text]);
    const zeige = (adresse) => { bild.src = adresse; bild.hidden = false; text.remove(); };
    if (src) zeige(src);
    else bilder.hole(id).then(zeige).catch(() => { text.textContent = '⚠'; text.title = 'Bild nicht geladen'; });
    return knopf;
}

export function render(container, ctx) {
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'herbar-dialog-titel' } });
    let sendet = false; // gegen doppeltes Senden durch mehrfaches Tippen

    // Ein Fenster mit Titel, Inhalt und × zum Schließen
    function oeffneDialog(titel, inhalt) {
        leeren(dialog);
        dialog.append(el('div', { class: 'besitz-dialog-inhalt' }, [
            el('div', { class: 'form-kopf' }, [
                el('h2', { text: titel, attrs: { id: 'herbar-dialog-titel' } }),
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
            const antwort = await api('leben', action, werte);
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

    // Gespeicherte Pflanze in die Liste übernehmen
    function merke(p) {
        const i = daten.arten.findIndex((x) => x.id === p.id);
        if (i >= 0) daten.arten[i] = p; else daten.arten.push(p);
    }

    // --- Eine Pflanze ansehen: Bilder, alle Angaben, „Im Herbarium“ direkt ändern ---
    function zeigePflanze(p) {
        const fotos = p.bilder || [];
        const gross = el('img', { class: 'besitz-dialog-bild einkauf-bild-gross', attrs: { alt: '', hidden: true } });
        gross.addEventListener('click', () => { gross.hidden = true; });
        const leiste = fotos.length ? el('div', { class: 'dsa-ab-bilder einkauf-bilder' }, fotos.map((id, i) =>
            vorschauBild(id, null, 'Bild ' + (i + 1) + ' zu ' + p.name + ' groß zeigen', (src) => {
                gross.hidden = !gross.hidden && gross.src === src;
                gross.src = src;
                gross.alt = 'Bild ' + (i + 1) + ' zu ' + p.name;
            }))) : null;
        const angaben = [
            ['Lateinisch', p.latein],
            ['Familie', p.familie],
            ['Gattung', gattung(p)],
            ['Gruppen', gruppenVon(p.gruppen).join(', ')],
            ['Eigenschaften', p.eigenschaften],
            ['Bestimmungs­merkmale', p.merkmale],
            ['Notiz', p.notiz]
        ].filter(([, w]) => w);
        oeffneDialog(p.name, [
            el('p', { class: 'herbar-marke' + (p.im_herbar ? ' ist-drin' : ''), text: herbarText(p) }),
            fotos.length ? gross : null,
            leiste,
            angaben.length ? el('dl', { class: 'besitz-angaben' }, angaben.flatMap(([n, w]) => [el('dt', { text: n }), el('dd', { text: w })])) : null,
            herbarAendern(p),
            el('div', { class: 'besitz-form-knoepfe' }, [
                el('button', { class: 'knopf knopf-bereich', text: 'Bearbeiten', attrs: { type: 'button' }, on: { click: () => zeigeForm(p) } }),
                el('button', { class: 'knopf knopf-zweit', text: 'Schließen', attrs: { type: 'button' }, on: { click: () => dialog.close() } })
            ])
        ].filter(Boolean));
    }

    // Felder „Im Herbarium“: Haken, Nummer, Funddatum, Fundort. Im Formular und in der Ansicht einer Pflanze.
    function herbarFelder(p, vorsilbe) {
        const haken = el('input', { attrs: { id: vorsilbe + '-drin', type: 'checkbox', checked: Boolean(p && p.im_herbar) } });
        const nr = el('input', { attrs: { id: vorsilbe + '-nr', type: 'text', maxlength: 20, autocomplete: 'off', placeholder: 'zum Beispiel 12', value: p ? p.herbar_nr : '' } });
        const datum = kalenderBeiKlick(el('input', { attrs: { id: vorsilbe + '-datum', type: 'date', max: heute(), autocomplete: 'off', value: p ? p.gefunden_am : '' } }));
        const ort = el('input', { attrs: { id: vorsilbe + '-ort', type: 'text', maxlength: 100, autocomplete: 'off', placeholder: 'zum Beispiel Waldrand am Bach', value: p ? p.fundort : '' } });
        const teile = [nr, datum, ort];
        const stand = () => teile.forEach((f) => { f.disabled = !haken.checked; });
        haken.addEventListener('change', () => { stand(); if (haken.checked) nr.focus(); });
        stand();
        return {
            haken, nr, datum,
            werte: () => ({ im_herbar: haken.checked, herbar_nr: nr.value.trim(), gefunden_am: datum.value, fundort: ort.value.trim() }),
            elemente: [
                el('label', { class: 'besitz-schnell-haken herbar-haken', attrs: { for: vorsilbe + '-drin' } }, [haken, el('span', { text: 'Im Herbarium' })]),
                el('label', { text: 'Nummer im Herbarium', attrs: { for: vorsilbe + '-nr' } }), nr,
                el('label', { text: 'Funddatum', attrs: { for: vorsilbe + '-datum' } }), datum,
                el('label', { text: 'Fundort', attrs: { for: vorsilbe + '-ort' } }), ort
            ]
        };
    }

    // Datum nicht in der Zukunft. Liefert eine Fehlermeldung oder ''.
    const datumFehler = (w) => (w.gefunden_am && w.gefunden_am > heute() ? 'Das Funddatum liegt in der Zukunft.' : '');

    // In der Ansicht: „Im Herbarium“ ändern, „Übernehmen“ speichert nur diese vier Angaben (das Skript lässt den Rest stehen)
    function herbarAendern(p) {
        const f = herbarFelder(p, 'herbar-schnell');
        const meldung = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const knopf = el('button', { class: 'knopf knopf-bereich', text: 'Übernehmen', attrs: { type: 'button', hidden: true }, on: { click: () => uebernehmen() } });
        const alt = JSON.stringify({ im_herbar: p.im_herbar, herbar_nr: p.herbar_nr, gefunden_am: p.gefunden_am, fundort: p.fundort });
        const box = el('form', { class: 'formular herbar-schnell', attrs: { novalidate: true }, on: { submit: (ev) => { ev.preventDefault(); uebernehmen(); } } }, [
            el('h3', { text: 'Herbarium' }), ...f.elemente, el('div', { class: 'besitz-form-knoepfe' }, [knopf]), meldung
        ]);
        const pruefe = () => { knopf.hidden = JSON.stringify(f.werte()) === alt; meldung.textContent = ''; };
        box.addEventListener('input', pruefe);
        box.addEventListener('change', pruefe);
        async function uebernehmen() {
            const w = f.werte();
            if (datumFehler(w)) { meldung.textContent = datumFehler(w); f.datum.focus(); return; }
            const antwort = await senden(meldung, [knopf], 'herbar_speichern', { blatt: 'arten', id: p.id, geaendert_am: p.geaendert_am, ...w });
            if (!antwort) return;
            merke(antwort.eintrag);
            zeigeGespeichert('Geändert', antwort.eintrag.name);
            zeigeAlles();
            zeigePflanze(antwort.eintrag);
        }
        return box;
    }

    // Bilder im Formular (Pflanze oder Karte): behalten = gespeicherte Kennungen, die bleiben;
    // neue = gewählte (data:-Bild) oder Drive-Links, die nach dem Speichern einzeln hochgehen
    function bilderTeil(start, vorsilbe) {
        const t = { behalten: [...(start || [])], neue: [] };   // neue: { daten } oder { link }
        const bilderBox = el('div', { class: 'dsa-ab-bilder einkauf-bilder' });
        const bildStatus = el('p', { class: 'leise besitz-hinweis', attrs: { role: 'status', 'aria-live': 'polite' } });
        const bildDatei = el('input', { attrs: { id: vorsilbe + '-bild', type: 'file', accept: 'image/*', multiple: true }, on: { change: () => bilderGewaehlt() } });
        const bildLink = el('input', { attrs: { id: vorsilbe + '-bild-link', type: 'url', inputmode: 'url', autocomplete: 'off', spellcheck: 'false', placeholder: 'https://drive.google.com/…' } });
        const linkDazu = el('button', { class: 'knopf knopf-zweit', text: 'Link dazu', attrs: { type: 'button' }, on: { click: () => bildLinkDazu() } });
        bildLink.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); bildLinkDazu(); } });
        const platz = () => MAX_BILDER - t.behalten.length - t.neue.length;
        t.zeige = () => {
            leeren(bilderBox);
            const weg = (label, tun) => el('button', { class: 'form-zu einkauf-bild-weg', text: '×', attrs: { type: 'button', 'aria-label': label }, on: { click: tun } });
            t.behalten.forEach((id, i) => bilderBox.append(el('div', { class: 'einkauf-bild-feld' }, [
                vorschauBild(id, null, 'Bild ' + (i + 1), () => {}),
                weg('Bild ' + (i + 1) + ' entfernen', () => { t.behalten = t.behalten.filter((x) => x !== id); t.zeige(); })
            ])));
            t.neue.forEach((b, i) => bilderBox.append(el('div', { class: 'einkauf-bild-feld' }, [
                b.daten ? vorschauBild('', b.daten, 'Neues Bild ' + (i + 1), () => {})
                    : el('span', { class: 'dsa-ab-bild einkauf-bild-link leise', text: 'Drive-Link' }),
                weg('Neues Bild ' + (i + 1) + ' entfernen', () => { t.neue.splice(t.neue.indexOf(b), 1); t.zeige(); })
            ])));
            bilderBox.hidden = !t.behalten.length && !t.neue.length;
            const voll = platz() <= 0;
            bildDatei.disabled = voll;
            bildLink.disabled = voll;
            linkDazu.disabled = voll;
            bildStatus.textContent = voll ? 'Höchstens ' + MAX_BILDER + ' Bilder.'
                : t.neue.length ? 'Neue Bilder gehen beim Speichern hoch. Entfernte bleiben im Drive-Ordner „Thetadex Herbarium“.' : '';
        };
        async function bilderGewaehlt() {
            const dateien = [...(bildDatei.files || [])];
            bildDatei.value = '';
            for (const datei of dateien) {
                if (platz() <= 0) break;
                try {
                    bildStatus.textContent = 'Bild wird verkleinert …';
                    t.neue.push({ daten: await verkleinereBild(datei) });
                } catch (e) {
                    t.zeige();
                    bildStatus.textContent = e.message;
                    return;
                }
            }
            t.zeige();
        }
        function bildLinkDazu() {
            const wert = bildLink.value.trim();
            if (!wert || platz() <= 0) return;
            if (!/^https:\/\/(drive|docs)\.google\.com\//i.test(wert)) {
                bildStatus.textContent = 'Bitte einen Google-Drive-Link einfügen (in Drive „Link kopieren“).';
                return;
            }
            t.neue.push({ link: wert });
            bildLink.value = '';
            t.zeige();
        }
        t.elemente = [
            el('label', { text: 'Bilder (freiwillig, bis zu ' + MAX_BILDER + '): wählen oder aufnehmen', attrs: { for: vorsilbe + '-bild' } }), bilderBox, bildDatei,
            el('label', { text: 'oder Google-Drive-Link', attrs: { for: vorsilbe + '-bild-link' } }),
            el('div', { class: 'herbar-link-zeile' }, [bildLink, linkDazu]), bildStatus
        ];
        t.zeige();
        return t;
    }

    // Speichert einen Eintrag (Pflanze oder Karte), danach die neuen Bilder einzeln. Liefert den gespeicherten Eintrag oder null.
    // Schlägt ein Bild fehl, bleibt das Fenster mit den übrigen offen; gilt() bekommt jeden gespeicherten Stand (für einen zweiten Versuch).
    async function speichereMitBildern(blatt, alt, werte, bt, status, knoepfe, wort, gilt) {
        const anfrage = { ...werte, blatt };
        if (alt) Object.assign(anfrage, { id: alt.id, geaendert_am: alt.geaendert_am, bilder: bt.behalten });
        const antwort = await senden(status, knoepfe, 'herbar_speichern', anfrage);
        if (!antwort) return null;
        let neu = antwort.eintrag;
        const merkeHier = (x) => {
            const liste = daten[blatt];
            const i = liste.findIndex((y) => y.id === x.id);
            if (i >= 0) liste[i] = x; else liste.push(x);
            gilt(x);
            bt.behalten = [...(x.bilder || [])];
        };
        merkeHier(neu);
        while (bt.neue.length) {
            const b = bt.neue[0];
            const werteBild = { blatt, id: neu.id, geaendert_am: neu.geaendert_am };
            if (b.daten) werteBild.bild_daten = b.daten.replace(/^data:image\/jpeg;base64,/, ''); else werteBild.bild = b.link;
            const a = await senden(status, knoepfe, 'herbar_bild', werteBild);
            if (!a) {
                status.textContent = wort + ' gespeichert, aber ein Bild nicht: ' + status.textContent.replace(/^NICHT gespeichert: /, '') + ' Bitte nochmal „Speichern“ tippen.';
                bt.zeige();
                zeigeAlles();
                return null;
            }
            neu = a.eintrag;
            merkeHier(neu);
            // Hochgeladenes Bild gleich merken, dann muss es nicht neu geladen werden
            if (b.daten && bt.behalten.length) bilder.set(bt.behalten[bt.behalten.length - 1], b.daten);
            bt.neue.shift();
        }
        return neu;
    }

    // --- Pflanze anlegen oder ändern ---
    function zeigeForm(p) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const feld = (id, max, wert, extra = {}) => el('input', { attrs: { id, type: 'text', maxlength: max, autocomplete: 'off', value: wert || '', ...extra } });
        const text = (id, wert, platz) => {
            const t = el('textarea', { attrs: { id, maxlength: 3000, rows: 4, placeholder: platz } });
            t.value = wert || '';
            return t;
        };
        const name = feld('herbar-f-name', 80, p && p.name);
        const latein = feld('herbar-f-latein', 80, p && p.latein, { placeholder: 'zum Beispiel Bellis perennis', spellcheck: 'false' });
        const familie = auswahlFeld({ id: 'herbar-f-familie', maxlength: 80, placeholder: 'wählen oder eintippen' });
        familie.feld.value = p ? p.familie : '';
        familie.setzeEintraege([...new Set(pflanzen().map((x) => x.familie).filter(Boolean))].sort(vergleiche));
        const gruppen = feld('herbar-f-gruppen', 200, p && p.gruppen, { placeholder: 'zum Beispiel Frühblüher, Heilpflanze' });
        // Bekannte Gruppen zum Antippen: Tipp hängt die Gruppe an
        const gruppenVorschlag = el('div', { class: 'herbar-vorschlaege' });
        function zeigeGruppenVorschlag() {
            leeren(gruppenVorschlag);
            const schon = new Set(gruppenVon(gruppen.value).map((x) => x.toLocaleLowerCase('de')));
            const alle = [...new Set(pflanzen().flatMap((x) => gruppenVon(x.gruppen)))].sort(vergleiche)
                .filter((g) => !schon.has(g.toLocaleLowerCase('de')));
            alle.forEach((g) => gruppenVorschlag.append(el('button', {
                class: 'herbar-vorschlag', text: '+ ' + g, attrs: { type: 'button', 'aria-label': 'Gruppe ' + g + ' dazu' },
                on: { click: () => { gruppen.value = [...gruppenVon(gruppen.value), g].join(', '); zeigeGruppenVorschlag(); } }
            })));
            gruppenVorschlag.hidden = !alle.length;
        }
        gruppen.addEventListener('input', zeigeGruppenVorschlag);
        zeigeGruppenVorschlag();
        const eigenschaften = text('herbar-f-eigenschaften', p && p.eigenschaften, 'freiwillig, zum Beispiel Blütezeit, Standort, Verwendung');
        const merkmale = text('herbar-f-merkmale', p && p.merkmale, 'freiwillig, woran man sie erkennt');
        const notiz = text('herbar-f-notiz', p && p.notiz, 'freiwillig');
        const herbar = herbarFelder(p, 'herbar-f');

        const bt = bilderTeil(p ? p.bilder : [], 'herbar-f');

        const speichern = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const loeschen = p ? el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button' }, on: { click: () => entfernen() } }) : null;
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        const knoepfe = [speichern, loeschen, abbrechen].filter(Boolean);

        async function absenden(ev) {
            ev.preventDefault();
            const werte = {
                reich: 'flora',
                name: name.value.trim(), latein: latein.value.trim(), familie: familie.feld.value.trim(), gruppen: gruppenVon(gruppen.value).join(', '),
                eigenschaften: eigenschaften.value, merkmale: merkmale.value, notiz: notiz.value,
                ...herbar.werte()
            };
            if (!werte.name) { status.textContent = 'Bitte den deutschen Namen eingeben.'; name.focus(); return; }
            if (werte.gruppen.length > 200) { status.textContent = 'Gruppen sind zu lang (höchstens 200 Zeichen).'; gruppen.focus(); return; }
            if (datumFehler(werte)) { status.textContent = datumFehler(werte); herbar.datum.focus(); return; }
            const warNeu = !p;
            const neu = await speichereMitBildern('arten', p, werte, bt, status, knoepfe, 'Pflanze', (x) => { p = x; });
            if (!neu) return;
            zeigeGespeichert(warNeu ? 'Gespeichert' : 'Geändert', neu.name);
            zeigeAlles();
            zeigePflanze(neu);
        }

        // Löschen ist weich: Im Sheet steht dann geloescht = TRUE, die Person kann es dort zurückholen.
        async function entfernen() {
            if (!confirm('„' + p.name + '“ löschen?')) return;
            const antwort = await senden(status, knoepfe, 'herbar_loeschen', { blatt: 'arten', id: p.id, geaendert_am: p.geaendert_am });
            if (!antwort) return;
            daten.arten = daten.arten.filter((x) => x.id !== p.id);
            dialog.close();
            zeigeGespeichert('Gelöscht', p.name);
            zeigeAlles();
        }

        oeffneDialog(p ? 'Pflanze ändern' : 'Neue Pflanze', [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden, input: () => { if (!sendet) status.textContent = ''; } } }, [
                el('label', { text: 'Deutscher Name (Vorderseite der Karte)', attrs: { for: 'herbar-f-name' } }), name,
                el('label', { text: 'Lateinischer Name', attrs: { for: 'herbar-f-latein' } }), latein,
                el('p', { class: 'leise besitz-hinweis', text: 'Die Gattung ist das erste Wort des lateinischen Namens.' }),
                el('label', { text: 'Familie', attrs: { for: 'herbar-f-familie' } }), familie.box,
                el('label', { text: 'Gruppen (mit Komma getrennt)', attrs: { for: 'herbar-f-gruppen' } }), gruppen, gruppenVorschlag,
                el('label', { text: 'Eigenschaften', attrs: { for: 'herbar-f-eigenschaften' } }), eigenschaften,
                el('label', { text: 'Bestimmungsmerkmale', attrs: { for: 'herbar-f-merkmale' } }), merkmale,
                el('label', { text: 'Notiz', attrs: { for: 'herbar-f-notiz' } }), notiz,
                ...bt.elemente,
                el('h3', { text: 'Herbarium' }), ...herbar.elemente,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        name.focus();
    }

    // --- Suche und Filter (rechnen nur im Gerät) ---
    let suchWarten = null;
    const suche = el('input', {
        attrs: { id: 'herbar-suche', type: 'search', autocomplete: 'off', placeholder: 'Name, lateinisch, Familie, Gattung, Merkmale' },
        on: { input: () => { clearTimeout(suchWarten); suchWarten = setTimeout(zeigeListe, 200); } }
    });
    const gruppeFilter = el('select', { attrs: { id: 'herbar-filter-gruppe' }, on: { change: () => zeigeListe() } });
    const familieFilter = el('select', { attrs: { id: 'herbar-filter-familie' }, on: { change: () => zeigeListe() } });
    const herbarFilter = el('select', { attrs: { id: 'herbar-filter-drin' }, on: { change: () => zeigeListe() } }, [
        el('option', { text: 'Alle', attrs: { value: '' } }),
        el('option', { text: 'Im Herbarium', attrs: { value: 'ja' } }),
        el('option', { text: 'Fehlt noch', attrs: { value: 'nein' } })
    ]);
    const trefferText = el('span', { class: 'besitz-treffer', attrs: { 'aria-live': 'polite' } });
    const suchBox = el('div', { class: 'formular besitz-suche', attrs: { role: 'search' } }, [
        el('label', { text: 'Suchen', attrs: { for: 'herbar-suche' } }), suche,
        el('div', { class: 'besitz-filter' }, [
            el('div', {}, [el('label', { text: 'Gruppe', attrs: { for: 'herbar-filter-gruppe' } }), gruppeFilter]),
            el('div', {}, [el('label', { text: 'Familie', attrs: { for: 'herbar-filter-familie' } }), familieFilter]),
            el('div', {}, [el('label', { text: 'Herbarium', attrs: { for: 'herbar-filter-drin' } }), herbarFilter]),
            el('div', { class: 'besitz-trefferfeld' }, [trefferText])
        ])
    ]);

    // Füllt eine Filter-Auswahl neu und behält die Wahl, wenn es sie noch gibt
    function fuelleFilter(auswahl, alleText, werte) {
        const vorher = auswahl.value;
        leeren(auswahl);
        auswahl.append(el('option', { text: alleText, attrs: { value: '' } }));
        werte.forEach((w) => auswahl.append(el('option', { text: w, attrs: { value: w } })));
        auswahl.value = werte.includes(vorher) ? vorher : '';
    }

    // --- Liste der Pflanzen, A–Z nach deutschem Namen ---
    const listeBox = el('div', { class: 'herbar-liste' });
    function zeigeListe() {
        clearTimeout(suchWarten);
        leeren(listeBox);
        if (!daten) return;
        const alle = pflanzen();
        fuelleFilter(gruppeFilter, 'Alle Gruppen', [...new Set(alle.flatMap((p) => gruppenVon(p.gruppen)))].sort(vergleiche));
        fuelleFilter(familieFilter, 'Alle Familien', [...new Set(alle.map((p) => p.familie).filter(Boolean))].sort(vergleiche));
        const wort = suche.value.trim();
        const gr = gruppeFilter.value, fa = familieFilter.value, drin = herbarFilter.value;
        const liste = alle.filter((p) => (!wort || [p.name, p.latein, p.familie, gattung(p), p.gruppen, p.merkmale, p.eigenschaften, p.notiz, p.fundort].some((t) => findet(t, wort)))
            && (!gr || gruppenVon(p.gruppen).includes(gr))
            && (!fa || p.familie === fa)
            && (!drin || (drin === 'ja') === Boolean(p.im_herbar)))
            .sort((a, b) => vergleiche(a.name, b.name));
        const gefiltert = wort || gr || fa || drin;
        trefferText.textContent = gefiltert ? (liste.length === 1 ? '1 Pflanze' : liste.length + ' Pflanzen') : '';
        if (!alle.length) {
            listeBox.append(el('p', { class: 'leise', text: 'Noch keine Pflanzen. Tippe auf „+ Neue Pflanze“.' }));
            return;
        }
        if (!liste.length) {
            listeBox.append(el('p', { class: 'leise', text: 'Nichts gefunden.' }));
            return;
        }
        const drinZahl = alle.filter((p) => p.im_herbar).length;
        if (!gefiltert) listeBox.append(el('p', { class: 'leise herbar-zahl', text: alle.length + ' Pflanzen, davon ' + drinZahl + ' im Herbarium' }));
        listeBox.append(el('ul', { class: 'einkauf-liste' }, liste.map((p) => el('li', { class: 'einkauf-zeile einkauf-lm' + (p.im_herbar ? ' herbar-drin' : '') }, [
            el('button', { class: 'einkauf-lm-wahl', attrs: { type: 'button' }, on: { click: () => zeigePflanze(p) } }, [
                el('span', { class: 'einkauf-lm-name', text: p.name + ((p.bilder || []).length ? ' · 📷' : '') }),
                p.latein ? el('span', { class: 'leise einkauf-klein herbar-latein', text: p.latein }) : null
            ].filter(Boolean)),
            el('span', { class: 'herbar-nr' + (p.im_herbar ? '' : ' leise'), text: p.im_herbar ? (p.herbar_nr ? 'Nr. ' + p.herbar_nr : '✓') : 'fehlt noch' })
        ]))));
    }

    // --- Karten: Fachbereich wählen, Fächer sehen, lernen (13.3) ---
    // Fachbereiche: Pflanzen und jede Kategorie aus dem Blatt „karten“ (13.4). „+ Neuer Fachbereich“ öffnet eine neue Karte.
    const fachbereichWahl = el('select', {
        attrs: { id: 'herbar-fachbereich' },
        on: { change: () => {
            if (fachbereichWahl.value === '__neu') { fachbereichWahl.value = fachbereich; zeigeKartenForm(null, ''); return; }
            fachbereich = fachbereichWahl.value;
            zeigeKarten();
        } }
    });
    const kategorien = () => (daten ? [...new Set(daten.karten.map((k) => k.kategorie).filter(Boolean))].sort(vergleiche) : []);
    const istPflanzen = () => fachbereich === 'pflanzen';
    const kGruppe = el('select', { attrs: { id: 'herbar-k-gruppe' }, on: { change: () => zeigeKarten() } });
    const kFamilie = el('select', { attrs: { id: 'herbar-k-familie' }, on: { change: () => zeigeKarten() } });
    const kGattung = el('select', { attrs: { id: 'herbar-k-gattung' }, on: { change: () => zeigeKarten() } });
    const kDrin = el('select', { attrs: { id: 'herbar-k-drin' }, on: { change: () => zeigeKarten() } }, [
        el('option', { text: 'Alle', attrs: { value: '' } }),
        el('option', { text: 'Im Herbarium', attrs: { value: 'ja' } }),
        el('option', { text: 'Fehlt noch', attrs: { value: 'nein' } })
    ]);
    const pflanzenFilter = el('div', { class: 'besitz-filter' }, [
        el('div', {}, [el('label', { text: 'Gruppe', attrs: { for: 'herbar-k-gruppe' } }), kGruppe]),
        el('div', {}, [el('label', { text: 'Familie', attrs: { for: 'herbar-k-familie' } }), kFamilie]),
        el('div', {}, [el('label', { text: 'Gattung', attrs: { for: 'herbar-k-gattung' } }), kGattung]),
        el('div', {}, [el('label', { text: 'Herbarium', attrs: { for: 'herbar-k-drin' } }), kDrin])
    ]);
    const alleHaken = el('input', { attrs: { id: 'herbar-k-alle', type: 'checkbox' }, on: { change: () => zeigeKarten() } });
    const faecherBox = el('div', { class: 'herbar-faecher' });
    const lernenKnopf = el('button', { class: 'knopf knopf-bereich', text: 'Lernen', attrs: { type: 'button' }, on: { click: () => starteRunde() } });
    const kNeuKnopf = el('button', { class: 'knopf knopf-zweit', text: '+ Neue Pflanze', attrs: { type: 'button' }, on: { click: () => (istPflanzen() ? zeigeForm(null) : zeigeKartenForm(null, fachbereich)) } });
    const kListe = el('div', { class: 'herbar-liste' });
    const sendeStatus = el('p', { class: 'meldung herbar-sende', attrs: { role: 'status', 'aria-live': 'polite' } });
    const nochmalKnopf = el('button', { class: 'knopf knopf-zweit', text: 'Nochmal senden', attrs: { type: 'button', hidden: true }, on: { click: () => sendeAntworten(true) } });
    const wahlBox = el('div', {}, [
        el('div', { class: 'formular besitz-suche' }, [
            el('label', { text: 'Fachbereich', attrs: { for: 'herbar-fachbereich' } }), fachbereichWahl,
            pflanzenFilter,
            el('label', { class: 'besitz-schnell-haken herbar-haken', attrs: { for: 'herbar-k-alle' } }, [alleHaken, el('span', { text: 'Alle Karten lernen, auch die noch nicht dran sind' })])
        ]),
        faecherBox,
        el('div', { class: 'besitz-form-knoepfe' }, [lernenKnopf]),
        el('h2', { class: 'besitz-ort herbar-k-titel', text: 'Karten in diesem Fachbereich' }),
        el('div', { class: 'besitz-form-knoepfe herbar-k-neu' }, [kNeuKnopf]),
        kListe
    ]);
    const lernBox = el('div', { class: 'herbar-lernen', attrs: { hidden: true } });

    // Karten des gewählten Fachbereichs (bei Pflanzen mit Filter)
    function kartenAuswahl() {
        if (!daten) return [];
        if (!istPflanzen()) return daten.karten.filter((k) => k.kategorie === fachbereich);
        const gr = kGruppe.value, fa = kFamilie.value, ga = kGattung.value, drin = kDrin.value;
        return pflanzen().filter((p) => (!gr || gruppenVon(p.gruppen).includes(gr))
            && (!fa || p.familie === fa)
            && (!ga || gattung(p) === ga)
            && (!drin || (drin === 'ja') === Boolean(p.im_herbar)));
    }

    function zeigeKarten() {
        // Gibt es den Fachbereich nicht mehr (zum Beispiel letzte Karte gelöscht), zurück zu Pflanzen
        const kats = kategorien();
        if (!istPflanzen() && daten && !kats.includes(fachbereich)) fachbereich = 'pflanzen';
        leeren(fachbereichWahl);
        fachbereichWahl.append(
            el('option', { text: 'Pflanzen', attrs: { value: 'pflanzen' } }),
            ...kats.map((k) => el('option', { text: k, attrs: { value: k } })),
            el('option', { text: '+ Neuer Fachbereich …', attrs: { value: '__neu' } })
        );
        fachbereichWahl.value = fachbereich;
        pflanzenFilter.hidden = !istPflanzen();
        kNeuKnopf.textContent = istPflanzen() ? '+ Neue Pflanze' : '+ Neue Karte';
        leeren(faecherBox);
        leeren(kListe);
        lernBox.hidden = !runde;
        wahlBox.hidden = Boolean(runde);
        neuLaden.hidden = Boolean(runde);
        if (runde) { zeigeKarte(); return; }
        wahlBox.append(sendeStatus, nochmalKnopf);
        if (!daten) return;
        const alle = pflanzen();
        fuelleFilter(kGruppe, 'Alle Gruppen', [...new Set(alle.flatMap((p) => gruppenVon(p.gruppen)))].sort(vergleiche));
        fuelleFilter(kFamilie, 'Alle Familien', [...new Set(alle.map((p) => p.familie).filter(Boolean))].sort(vergleiche));
        fuelleFilter(kGattung, 'Alle Gattungen', [...new Set(alle.map(gattung).filter(Boolean))].sort(vergleiche));
        const auswahl = kartenAuswahl();
        // Fünf Fächer: wie viele Karten darin liegen und wie viele davon heute dran sind
        for (let f = 1; f <= 5; f++) {
            const im = auswahl.filter((k) => (k.fach || 1) === f);
            const dran = im.filter(istDran).length;
            faecherBox.append(el('div', { class: 'herbar-fach' + (im.length ? '' : ' ist-leer') }, [
                el('span', { class: 'herbar-fach-name', text: 'Fach ' + f }),
                el('span', { class: 'herbar-fach-zahl', text: String(im.length) }),
                el('span', { class: 'leise herbar-fach-dran', text: f === 1 ? 'immer dran' : dran + ' dran' })
            ]));
        }
        const zahl = alleHaken.checked ? auswahl.length : auswahl.filter(istDran).length;
        lernenKnopf.textContent = 'Lernen (' + zahl + ')';
        lernenKnopf.disabled = !zahl;
        if (!istPflanzen()) {
            kListe.append(el('ul', { class: 'einkauf-liste' }, auswahl.slice().sort((a, b) => vergleiche(a.vorne, b.vorne)).map((k) => el('li', { class: 'einkauf-zeile einkauf-lm' }, [
                el('button', { class: 'einkauf-lm-wahl', attrs: { type: 'button' }, on: { click: () => zeigeKarteEintrag(k) } }, [
                    el('span', { class: 'einkauf-lm-name', text: k.vorne + ((k.bilder || []).length ? ' · 📷' : '') })
                ]),
                el('span', { class: 'herbar-nr leise', text: 'Fach ' + (k.fach || 1) + (istDran(k) ? ' · dran' : '') })
            ]))));
            return;
        }
        if (!auswahl.length) {
            kListe.append(el('p', { class: 'leise', text: alle.length ? 'Keine Pflanze passt zum Filter.' : 'Noch keine Pflanzen. Tippe auf „+ Neue Pflanze“.' }));
            return;
        }
        kListe.append(el('ul', { class: 'einkauf-liste' }, auswahl.slice().sort((a, b) => vergleiche(a.name, b.name)).map((p) => el('li', { class: 'einkauf-zeile einkauf-lm' }, [
            el('button', { class: 'einkauf-lm-wahl', attrs: { type: 'button' }, on: { click: () => zeigePflanze(p) } }, [
                el('span', { class: 'einkauf-lm-name', text: p.name }),
                el('span', { class: 'leise einkauf-klein', text: herbarText(p) })
            ]),
            el('span', { class: 'herbar-nr leise', text: 'Fach ' + (p.fach || 1) + (istDran(p) ? ' · dran' : '') })
        ]))));
    }

    // Bilder nebeneinander, Tipp zeigt groß darüber. Liefert [großes Bild, Leiste] oder [].
    function bilderLeiste(fotos, titel) {
        if (!fotos || !fotos.length) return [];
        const gross = el('img', { class: 'besitz-dialog-bild einkauf-bild-gross', attrs: { alt: '', hidden: true } });
        gross.addEventListener('click', () => { gross.hidden = true; });
        return [gross, el('div', { class: 'dsa-ab-bilder einkauf-bilder' }, fotos.map((id, i) =>
            vorschauBild(id, null, 'Bild ' + (i + 1) + ' zu ' + titel + ' groß zeigen', (src) => {
                gross.hidden = !gross.hidden && gross.src === src;
                gross.src = src;
                gross.alt = 'Bild ' + (i + 1) + ' zu ' + titel;
            })))];
    }

    // Eine Karte (nicht Pflanze) ansehen
    function zeigeKarteEintrag(k) {
        oeffneDialog(k.vorne, [
            el('p', { class: 'leise', text: k.kategorie + ' · Fach ' + (k.fach || 1) + (k.gelernt_am ? ' · zuletzt gelernt ' + datumText(k.gelernt_am) : '') }),
            ...bilderLeiste(k.bilder, k.vorne),
            k.hinten ? el('p', { class: 'herbar-hinten', text: k.hinten }) : el('p', { class: 'leise', text: 'Noch nichts auf der Rückseite.' }),
            el('div', { class: 'besitz-form-knoepfe' }, [
                el('button', { class: 'knopf knopf-bereich', text: 'Bearbeiten', attrs: { type: 'button' }, on: { click: () => zeigeKartenForm(k, k.kategorie) } }),
                el('button', { class: 'knopf knopf-zweit', text: 'Schließen', attrs: { type: 'button' }, on: { click: () => dialog.close() } })
            ])
        ]);
    }

    // Karte anlegen oder ändern: Fachbereich, Vorderseite, Rückseite, Bilder
    function zeigeKartenForm(k, kat) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const bereich = auswahlFeld({ id: 'herbar-kf-bereich', maxlength: 40, placeholder: 'wählen oder neu eintippen, zum Beispiel Geographie' });
        bereich.feld.value = k ? k.kategorie : (kat || '');
        bereich.setzeEintraege(kategorien());
        const vorne = el('textarea', { attrs: { id: 'herbar-kf-vorne', maxlength: 300, rows: 2, placeholder: 'Frage oder Begriff' } });
        vorne.value = k ? k.vorne : '';
        const hinten = el('textarea', { attrs: { id: 'herbar-kf-hinten', maxlength: 3000, rows: 6, placeholder: 'Antwort' } });
        hinten.value = k ? k.hinten : '';
        const bt = bilderTeil(k ? k.bilder : [], 'herbar-kf');
        const speichern = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const loeschen = k ? el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button' }, on: { click: () => entfernen() } }) : null;
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        const knoepfe = [speichern, loeschen, abbrechen].filter(Boolean);

        async function absenden(ev) {
            ev.preventDefault();
            const werte = { kategorie: bereich.feld.value.replace(/\s+/g, ' ').trim(), vorne: vorne.value.replace(/\s+/g, ' ').trim(), hinten: hinten.value };
            if (!werte.kategorie) { status.textContent = 'Bitte einen Fachbereich wählen oder eintippen.'; bereich.feld.focus(); return; }
            if (!werte.vorne) { status.textContent = 'Bitte die Vorderseite ausfüllen.'; vorne.focus(); return; }
            const warNeu = !k;
            const neu = await speichereMitBildern('karten', k, werte, bt, status, knoepfe, 'Karte', (x) => { k = x; });
            if (!neu) return;
            fachbereich = neu.kategorie;
            zeigeGespeichert(warNeu ? 'Gespeichert' : 'Geändert', neu.vorne);
            zeigeAlles();
            zeigeKarteEintrag(neu);
        }

        // Löschen ist weich: Im Sheet steht dann geloescht = TRUE, die Person kann es dort zurückholen.
        async function entfernen() {
            if (!confirm('Karte „' + k.vorne + '“ löschen?')) return;
            const antwort = await senden(status, knoepfe, 'herbar_loeschen', { blatt: 'karten', id: k.id, geaendert_am: k.geaendert_am });
            if (!antwort) return;
            daten.karten = daten.karten.filter((x) => x.id !== k.id);
            dialog.close();
            zeigeGespeichert('Gelöscht', k.vorne);
            zeigeAlles();
        }

        oeffneDialog(k ? 'Karte ändern' : 'Neue Karte', [
            el('form', { class: 'formular', attrs: { novalidate: true }, on: { submit: absenden, input: () => { if (!sendet) status.textContent = ''; } } }, [
                el('label', { text: 'Fachbereich', attrs: { for: 'herbar-kf-bereich' } }), bereich.box,
                el('label', { text: 'Vorderseite', attrs: { for: 'herbar-kf-vorne' } }), vorne,
                el('label', { text: 'Rückseite', attrs: { for: 'herbar-kf-hinten' } }), hinten,
                ...bt.elemente,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe),
                status
            ])
        ]);
        (k || kat ? vorne : bereich.feld).focus();
    }

    // Neue Runde: dran (oder alle), niedrige Fächer zuerst, innerhalb eines Fachs gemischt
    function starteRunde() {
        const auswahl = kartenAuswahl().filter((k) => alleHaken.checked || istDran(k));
        if (!auswahl.length) return;
        const gemischt = auswahl.map((k) => [k, Math.random()]).sort((a, b) => (a[0].fach || 1) - (b[0].fach || 1) || a[1] - b[1]).map(([k]) => k);
        runde = { blatt: istPflanzen() ? 'arten' : 'karten', karten: gemischt, i: 0, umgedreht: false, gewusst: 0, nicht: 0 };
        zeigeKarten();
    }

    // Eine Karte: vorne der deutsche Name, nach „Umdrehen“ alle Angaben. Die Marke „im Herbarium · Nr.“ steht auf beiden Seiten.
    function zeigeKarte() {
        leeren(lernBox);
        const beenden = el('button', { class: 'knopf knopf-zweit', text: 'Beenden', attrs: { type: 'button' }, on: { click: () => { runde = null; zeigeKarten(); } } });
        if (runde.i >= runde.karten.length) {
            lernBox.append(
                el('h2', { text: 'Runde fertig' }),
                el('p', { text: runde.gewusst + ' gewusst, ' + runde.nicht + ' nicht gewusst.' }),
                el('div', { class: 'besitz-form-knoepfe' }, [beenden]),
                sendeStatus, nochmalKnopf
            );
            beenden.textContent = 'Zurück';
            beenden.className = 'knopf knopf-bereich';
            beenden.focus();
            return;
        }
        const p = runde.karten[runde.i];
        const pflanze = runde.blatt === 'arten';
        const karte = el('div', { class: 'herbar-karte', attrs: { 'aria-live': 'polite' } }, [
            el('p', { class: 'leise herbar-karte-fach', text: 'Karte ' + (runde.i + 1) + ' von ' + runde.karten.length + ' · Fach ' + (p.fach || 1) }),
            el('p', { class: 'herbar-karte-vorne', text: pflanze ? p.name : p.vorne }),
            pflanze ? el('p', { class: 'herbar-marke' + (p.im_herbar ? ' ist-drin' : ''), text: herbarText(p) }) : null
        ]);
        if (runde.umgedreht && !pflanze) {
            karte.append(...[
                bilderLeiste(p.bilder, p.vorne),
                p.hinten ? el('p', { class: 'herbar-hinten', text: p.hinten })
                    : el('p', { class: 'leise', text: 'Noch nichts auf der Rückseite. Tippe in der Liste auf die Karte und dann auf „Bearbeiten“.' })
            ].flat().filter(Boolean));
        }
        if (runde.umgedreht && pflanze) {
            const angaben = [
                ['Lateinisch', p.latein], ['Familie', p.familie], ['Gattung', gattung(p)], ['Gruppen', gruppenVon(p.gruppen).join(', ')],
                ['Eigenschaften', p.eigenschaften], ['Bestimmungs­merkmale', p.merkmale], ['Notiz', p.notiz],
                ['Funddatum', p.im_herbar ? datumText(p.gefunden_am) : ''], ['Fundort', p.im_herbar ? p.fundort : '']
            ].filter(([, w]) => w);
            const fotos = p.bilder || [];
            const gross = el('img', { class: 'besitz-dialog-bild einkauf-bild-gross', attrs: { alt: '', hidden: true } });
            gross.addEventListener('click', () => { gross.hidden = true; });
            karte.append(...[
                fotos.length ? gross : null,
                fotos.length ? el('div', { class: 'dsa-ab-bilder einkauf-bilder' }, fotos.map((id, i) =>
                    vorschauBild(id, null, 'Bild ' + (i + 1) + ' zu ' + p.name + ' groß zeigen', (src) => {
                        gross.hidden = !gross.hidden && gross.src === src;
                        gross.src = src;
                    }))) : null,
                angaben.length ? el('dl', { class: 'besitz-angaben' }, angaben.flatMap(([n, w]) => [el('dt', { text: n }), el('dd', { text: w })]))
                    : el('p', { class: 'leise', text: 'Noch keine Angaben auf der Rückseite. Tippe in der Liste auf die Pflanze und dann auf „Bearbeiten“.' })
            ].filter(Boolean));
        }
        const knoepfe = runde.umgedreht
            ? [
                el('button', { class: 'knopf knopf-bereich', text: '✓ Gewusst', attrs: { type: 'button' }, on: { click: () => antworte(p, true) } }),
                el('button', { class: 'knopf knopf-zweit', text: '✗ Nicht gewusst', attrs: { type: 'button' }, on: { click: () => antworte(p, false) } })
            ]
            : [el('button', { class: 'knopf knopf-bereich', text: 'Umdrehen', attrs: { type: 'button' }, on: { click: () => { runde.umgedreht = true; zeigeKarte(); } } })];
        lernBox.append(karte, el('div', { class: 'besitz-form-knoepfe herbar-lern-knoepfe' }, [...knoepfe, beenden]), sendeStatus, nochmalKnopf);
        knoepfe[0].focus({ preventScroll: true });
    }

    // Antwort merken, gleich weiter zur nächsten Karte. Gesendet wird im Hintergrund.
    function antworte(p, gewusst) {
        if (gewusst) runde.gewusst++; else runde.nicht++;
        offeneAntworten.push({ blatt: runde.blatt, id: p.id, gewusst });
        runde.i++;
        runde.umgedreht = false;
        zeigeKarte();
        sendeAntworten(false);
    }

    // Schickt die offenen Antworten nacheinander ans Skript. Schlägt eine fehl, bleibt sie (und alle danach) im Arbeitsspeicher.
    let sendetAntworten = false;
    async function sendeAntworten(nochmal) {
        if (sendetAntworten) return;
        sendetAntworten = true;
        nochmalKnopf.hidden = true;
        if (nochmal) sendeStatus.textContent = 'Sende …';
        while (offeneAntworten.length) {
            const a = offeneAntworten[0];
            try {
                const r = await api('leben', 'herbar_gelernt', a);
                const k = daten && daten[a.blatt].find((x) => x.id === r.id);
                if (k) { k.fach = r.fach; k.gelernt_am = r.gelernt_am; }
                offeneAntworten.shift();
            } catch (e) {
                // „gibt es nicht mehr“: diese Antwort verwerfen, die übrigen weiter senden
                if (e.code === 'fehlt') { offeneAntworten.shift(); continue; }
                const n = offeneAntworten.length;
                sendeStatus.textContent = (n === 1 ? '1 Antwort' : n + ' Antworten') + ' nicht gespeichert: ' + e.message;
                nochmalKnopf.hidden = false;
                sendetAntworten = false;
                return;
            }
        }
        sendeStatus.textContent = '';
        sendetAntworten = false;
        if (!runde) zeigeKarten();
    }

    // --- Unterreiter ---
    const neuKnopf = el('button', { class: 'knopf knopf-bereich', text: '+ Neue Pflanze', attrs: { type: 'button' }, on: { click: () => zeigeForm(null) } });
    const herbarTeil = el('div', { attrs: { id: 'herbar-teil-herbarium' } }, [suchBox, listeBox]);
    const kartenTeil = el('div', { attrs: { id: 'herbar-teil-karten' } }, [wahlBox, lernBox]);
    const teilKnoepfe = [['herbarium', 'Herbarium', herbarTeil], ['karten', 'Karten', kartenTeil]].map(([id, text, box]) => [
        id,
        el('button', { class: 'ansicht', text, attrs: { type: 'button', 'aria-controls': box.id }, on: { click: () => zeigeTeil(id) } }),
        box
    ]);
    function zeigeTeil(id) {
        teil = id;
        teilKnoepfe.forEach(([k, knopf, box]) => {
            knopf.setAttribute('aria-pressed', k === id ? 'true' : 'false');
            box.hidden = k !== id;
        });
        neuKnopf.hidden = id !== 'herbarium';
        neuLaden.hidden = id === 'karten' && Boolean(runde);
    }

    function zeigeAlles() {
        zeigeListe();
        if (!runde) zeigeKarten();
    }

    // --- Laden ---
    const ladeStatus = el('p', { class: 'meldung besitz-lade', attrs: { role: 'status', 'aria-live': 'polite' } });
    const neuLaden = el('button', { class: 'knopf knopf-zweit besitz-neu', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => laden() } });
    async function laden() {
        neuLaden.disabled = true;
        ladeStatus.textContent = daten ? 'Aktualisiere …' : 'Lädt …';
        try {
            const d = await api('leben', 'herbar');
            daten = { arten: Array.isArray(d.arten) ? d.arten : [], karten: Array.isArray(d.karten) ? d.karten : [] };
            ladeStatus.textContent = '';
            zeigeAlles();
        } catch (e) {
            ladeStatus.textContent = 'Laden fehlgeschlagen: ' + e.message
                + (e.code === 'aktion' ? ' Bitte im Sheet „Leben“ die neue Fassung des Skripts einfügen und bereitstellen (Schritt 13.1).' : '');
        } finally {
            neuLaden.disabled = false;
        }
    }

    container.append(
        el('div', { class: 'besitz-kopf' }, [
            el('h1', { class: 'bereich-titel titel-mit-emoji' }, [
                el('span', { class: 'titel-emoji', text: '🌿', attrs: { 'aria-hidden': 'true' } }),
                el('span', { text: ctx.bereich.titel })
            ]),
            neuKnopf
        ]),
        el('div', { class: 'ansichten' }, teilKnoepfe.map(([, knopf]) => knopf)),
        ladeStatus,
        herbarTeil,
        kartenTeil,
        neuLaden,
        dialog
    );
    zeigeTeil(teil);
    zeigeAlles();
    if (runde) zeigeKarten();
    laden();
    // Noch offene Antworten (zum Beispiel nach einem Wechsel des Reiters) weiter senden
    if (offeneAntworten.length) sendeAntworten(false);
}
