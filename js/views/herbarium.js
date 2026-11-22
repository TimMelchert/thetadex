// Reiter Herbarium (Etappe 13, Plan docs/PLAN-ETAPPE-13.md). Unterreiter Herbarium (die Pflanzen) und Karten (lernen, ab 13.3).
// Herbarium: Pflanzen suchen und filtern, ansehen, „Im Herbarium“ mit Nummer, Funddatum und Fundort anhaken, anlegen, ändern, löschen.
// Daten aus dem Skript „leben“ (Sheet „Leben“, Blätter „arten“ und „karten“). Nur mit Passwort, nur im Arbeitsspeicher.

import { el, leeren, heute, kalenderBeiKlick, vergleiche, datumText } from '../ui/dom.js';
import { auswahlFeld } from '../ui/auswahl.js';
import { api } from '../api.js';
import { zeigeGespeichert } from '../ui/overlay.js';
import { verkleinereBild, bildSpeicher } from '../ui/bild.js';

// Zuletzt geladene Daten { arten, karten }, nur im Arbeitsspeicher. Beim Öffnen sofort zeigen, dann frisch laden.
let daten = null;
// Gewählter Unterreiter. Bleibt, solange die Seite offen ist.
let teil = 'herbarium';
// Schon geladene Bilder (Drive-Kennung → data:-Bild), nur im Arbeitsspeicher
const bilder = bildSpeicher('leben');
const MAX_BILDER = 5;

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
            zeigeListe();
            zeigePflanze(antwort.eintrag);
        }
        return box;
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

        // Bilder: behalten = gespeicherte Kennungen, die bleiben; neu = gewählte (data:-Bild) oder Drive-Links, die nach dem Speichern hochgehen
        let behalten = p ? [...(p.bilder || [])] : [];
        const neueBilder = [];   // { daten, name } oder { link }
        const bilderBox = el('div', { class: 'dsa-ab-bilder einkauf-bilder' });
        const bildStatus = el('p', { class: 'leise besitz-hinweis', attrs: { role: 'status', 'aria-live': 'polite' } });
        const bildDatei = el('input', { attrs: { id: 'herbar-f-bild', type: 'file', accept: 'image/*', multiple: true }, on: { change: () => bilderGewaehlt() } });
        const bildLink = el('input', { attrs: { id: 'herbar-f-bild-link', type: 'url', inputmode: 'url', autocomplete: 'off', spellcheck: 'false', placeholder: 'https://drive.google.com/…' } });
        const linkDazu = el('button', { class: 'knopf knopf-zweit', text: 'Link dazu', attrs: { type: 'button' }, on: { click: () => bildLinkDazu() } });
        bildLink.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); bildLinkDazu(); } });
        const platz = () => MAX_BILDER - behalten.length - neueBilder.length;
        function zeigeBilder() {
            leeren(bilderBox);
            const weg = (label, tun) => el('button', { class: 'form-zu einkauf-bild-weg', text: '×', attrs: { type: 'button', 'aria-label': label }, on: { click: tun } });
            behalten.forEach((id, i) => bilderBox.append(el('div', { class: 'einkauf-bild-feld' }, [
                vorschauBild(id, null, 'Bild ' + (i + 1), () => {}),
                weg('Bild ' + (i + 1) + ' entfernen', () => { behalten = behalten.filter((x) => x !== id); zeigeBilder(); })
            ])));
            neueBilder.forEach((b, i) => bilderBox.append(el('div', { class: 'einkauf-bild-feld' }, [
                b.daten ? vorschauBild('', b.daten, 'Neues Bild ' + (i + 1), () => {})
                    : el('span', { class: 'dsa-ab-bild einkauf-bild-link leise', text: 'Drive-Link' }),
                weg('Neues Bild ' + (i + 1) + ' entfernen', () => { neueBilder.splice(neueBilder.indexOf(b), 1); zeigeBilder(); })
            ])));
            bilderBox.hidden = !behalten.length && !neueBilder.length;
            const voll = platz() <= 0;
            bildDatei.disabled = voll;
            bildLink.disabled = voll;
            linkDazu.disabled = voll;
            bildStatus.textContent = voll ? 'Höchstens ' + MAX_BILDER + ' Bilder.'
                : neueBilder.length ? 'Neue Bilder gehen beim Speichern hoch. Entfernte bleiben im Drive-Ordner „Thetadex Herbarium“.' : '';
        }
        async function bilderGewaehlt() {
            const dateien = [...(bildDatei.files || [])];
            bildDatei.value = '';
            for (const datei of dateien) {
                if (platz() <= 0) break;
                try {
                    bildStatus.textContent = 'Bild wird verkleinert …';
                    neueBilder.push({ daten: await verkleinereBild(datei), name: String(datei.name || 'Bild').replace(/\.[^.]*$/, '').slice(0, 60) });
                } catch (e) {
                    zeigeBilder();
                    bildStatus.textContent = e.message;
                    return;
                }
            }
            zeigeBilder();
        }
        function bildLinkDazu() {
            const wert = bildLink.value.trim();
            if (!wert || platz() <= 0) return;
            if (!/^https:\/\/(drive|docs)\.google\.com\//i.test(wert)) {
                bildStatus.textContent = 'Bitte einen Google-Drive-Link einfügen (in Drive „Link kopieren“).';
                return;
            }
            neueBilder.push({ link: wert });
            bildLink.value = '';
            zeigeBilder();
        }
        zeigeBilder();

        const speichern = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const loeschen = p ? el('button', { class: 'knopf knopf-zweit', text: 'Löschen', attrs: { type: 'button' }, on: { click: () => entfernen() } }) : null;
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        const knoepfe = [speichern, loeschen, abbrechen].filter(Boolean);

        async function absenden(ev) {
            ev.preventDefault();
            const werte = {
                blatt: 'arten', reich: 'flora',
                name: name.value.trim(), latein: latein.value.trim(), familie: familie.feld.value.trim(), gruppen: gruppenVon(gruppen.value).join(', '),
                eigenschaften: eigenschaften.value, merkmale: merkmale.value, notiz: notiz.value,
                ...herbar.werte()
            };
            if (!werte.name) { status.textContent = 'Bitte den deutschen Namen eingeben.'; name.focus(); return; }
            if (werte.gruppen.length > 200) { status.textContent = 'Gruppen sind zu lang (höchstens 200 Zeichen).'; gruppen.focus(); return; }
            if (datumFehler(werte)) { status.textContent = datumFehler(werte); herbar.datum.focus(); return; }
            if (p) Object.assign(werte, { id: p.id, geaendert_am: p.geaendert_am, bilder: behalten });
            const antwort = await senden(status, knoepfe, 'herbar_speichern', werte);
            if (!antwort) return;
            let neu = antwort.eintrag;
            merke(neu);
            p = neu;   // ab jetzt gilt die gespeicherte Pflanze (für einen zweiten Versuch mit den restlichen Bildern)
            behalten = [...(neu.bilder || [])];
            // Neue Bilder einzeln nacheinander anhängen. Schlägt eins fehl, bleibt das Fenster mit den übrigen offen.
            while (neueBilder.length) {
                const b = neueBilder[0];
                const werteBild = { blatt: 'arten', id: neu.id, geaendert_am: neu.geaendert_am };
                if (b.daten) werteBild.bild_daten = b.daten.replace(/^data:image\/jpeg;base64,/, ''); else werteBild.bild = b.link;
                const a = await senden(status, knoepfe, 'herbar_bild', werteBild);
                if (!a) {
                    status.textContent = 'Pflanze gespeichert, aber ein Bild nicht: ' + status.textContent.replace(/^NICHT gespeichert: /, '') + ' Bitte nochmal „Speichern“ tippen.';
                    zeigeBilder();
                    zeigeListe();
                    return;
                }
                neu = a.eintrag;
                merke(neu);
                p = neu;
                behalten = [...(neu.bilder || [])];
                // Hochgeladenes Bild gleich merken, dann muss es nicht neu geladen werden
                if (b.daten && behalten.length) bilder.set(behalten[behalten.length - 1], b.daten);
                neueBilder.shift();
            }
            zeigeGespeichert(werte.id ? 'Geändert' : 'Gespeichert', neu.name);
            zeigeListe();
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
            zeigeListe();
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
                el('label', { text: 'Bilder (freiwillig, bis zu ' + MAX_BILDER + '): wählen oder aufnehmen', attrs: { for: 'herbar-f-bild' } }), bilderBox, bildDatei,
                el('label', { text: 'oder Google-Drive-Link', attrs: { for: 'herbar-f-bild-link' } }),
                el('div', { class: 'herbar-link-zeile' }, [bildLink, linkDazu]), bildStatus,
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

    // --- Unterreiter ---
    const neuKnopf = el('button', { class: 'knopf knopf-bereich', text: '+ Neue Pflanze', attrs: { type: 'button' }, on: { click: () => zeigeForm(null) } });
    const herbarTeil = el('div', { attrs: { id: 'herbar-teil-herbarium' } }, [suchBox, listeBox]);
    // Karten (Lernen mit 5 Fächern) kommen in Schritt 13.3
    const kartenTeil = el('div', { attrs: { id: 'herbar-teil-karten' } }, [
        el('p', { class: 'leise herbar-bald', text: 'Hier lernst du bald mit Karteikarten: Pflanzen, Raumplanung, Geographie und mehr (kommt im nächsten Schritt).' })
    ]);
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
            zeigeListe();
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
    zeigeListe();
    laden();
}
