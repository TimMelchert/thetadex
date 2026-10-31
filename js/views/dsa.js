// Reiter Pen & Paper (DSA und DnD), Schritt 6.1: Bogen wählen und anlegen, Kopf, Eigenschaften und Zähler ansehen und ändern.
// Daten aus dem Skript „dsa“ (eigenes Sheet „DSA“). Nur mit Passwort.
// Die Bögen liegen nur im Arbeitsspeicher, solange die Seite offen ist. Im Gerät steht nur, welcher Bogen gewählt war
// (thetadex_dsa_bogen). Siehe docs/PLAN-ETAPPE-6.md.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { lesen, schreiben } from '../store.js';
import { zeigeGespeichert } from '../ui/overlay.js';

// Zuletzt geladene Daten, nur im Arbeitsspeicher
let daten = null;

// Felder des Kopfs: [Schlüssel, Anzeige]
const KOPF = [
    ['rasse', 'Rasse'], ['kultur', 'Kultur'], ['profession', 'Profession'], ['geschlecht', 'Geschlecht'],
    ['alter', 'Alter'], ['groesse', 'Größe'], ['gewicht', 'Gewicht'], ['haare', 'Haarfarbe'], ['augen', 'Augenfarbe'],
    ['stand', 'Stand'], ['titel', 'Titel'], ['sozialstatus', 'Sozialstatus'], ['herkunft', 'Herkunft'], ['gp_basis', 'GP-Basis']
];

// Vorlage für einen neuen Bogen (DnD ist wie DSA aufgebaut, Entscheidung der Person, 31.10.2026)
const VORLAGE_EIGENSCHAFTEN = [
    ['MU', 'Mut'], ['KL', 'Klugheit'], ['IN', 'Intuition'], ['CH', 'Charisma'],
    ['FF', 'Fingerfertigkeit'], ['GE', 'Gewandtheit'], ['KO', 'Konstitution'], ['KK', 'Körperkraft']
].map(([k, n]) => ({ k, n, w: '', g: 'e' })).concat([
    ['LeP', 'Lebensenergie'], ['AuP', 'Ausdauer'], ['AsP', 'Astralenergie'], ['MR', 'Magieresistenz'],
    ['INI', 'Initiative-Basis'], ['AT', 'Attacke-Basis'], ['PA', 'Parade-Basis'], ['FK', 'Fernkampf-Basis'], ['GS', 'Geschwindigkeit']
].map(([k, n]) => ({ k, n, w: '', g: 'b' })));
const VORLAGE_ZAEHLER = [
    { k: 'Geld', n: 'Geld', art: 'geld', start: 0, max: null },
    { k: 'LeP', n: 'Lebenspunkte', art: 'leben', start: 0, max: null },
    { k: 'AsP', n: 'Astralpunkte', art: 'leben', start: 0, max: null },
    { k: 'AP', n: 'Abenteuerpunkte', art: 'ap', start: 0, max: null }
];
const ARTEN = [['geld', 'Geld (in Kreuzern)'], ['leben', 'Punkte mit Höchstwert'], ['ap', 'AP (nur gesammelte zählen)'], ['zahl', 'Zahl']];

// Symbol je Zähler, sonst ein Punkt
function symbol(z) {
    if (z.art === 'geld') return '💰';
    if (z.art === 'ap') return '⭐';
    if (/^(lep|hp|le)$/i.test(z.k)) return '❤️';
    if (/^(asp|ae)$/i.test(z.k)) return '✨';
    return '•';
}

// Geld steht in Kreuzern: 1 Dukaten = 10 Silbertaler = 100 Heller = 1000 Kreuzer
function geldText(kreuzer) {
    const minus = kreuzer < 0;
    let rest = Math.abs(kreuzer);
    const teile = [];
    [[1000, 'D'], [100, 'S'], [10, 'H'], [1, 'K']].forEach(([wert, zeichen]) => {
        const n = Math.floor(rest / wert);
        rest -= n * wert;
        if (n) teile.push(n + ' ' + zeichen);
    });
    return (minus ? '− ' : '') + (teile.join(' ') || '0');
}

// Aktueller Stand eines Zählers: Startwert plus Verlauf (AP: nur gesammelte), höchstens der Höchstwert
function stand(bogen, z) {
    let s = Number(z.start) || 0;
    daten.verlauf.forEach((v) => {
        if (v.bogen_id !== bogen.id || v.zaehler !== z.k) return;
        if (z.art === 'ap' && v.aenderung < 0) return;
        s += v.aenderung;
    });
    if (z.max != null && z.max !== '' && s > Number(z.max)) s = Number(z.max);
    return s;
}

export function render(container) {
    const ladeStatus = el('p', { class: 'meldung besitz-lade', attrs: { role: 'status', 'aria-live': 'polite' } });
    const auswahl = el('select', { attrs: { id: 'dsa-bogen', 'aria-label': 'Bogen' }, on: { change: () => { schreiben('dsa_bogen', auswahl.value); zeigeAlles(); } } });
    const marke = el('span', { class: 'dsa-marke', attrs: { hidden: true } });
    const leiste = el('div', { class: 'dsa-leiste' }, [auswahl, marke]);
    const oben = el('div', { class: 'dsa-oben', attrs: { hidden: true } });
    const abschnitte = el('div', { class: 'dsa-abschnitte' });
    const neuKnopf = el('button', { class: 'knopf knopf-bereich', text: '+ Bogen', attrs: { type: 'button', disabled: true }, on: { click: () => zeigeBogenForm(null) } });
    const neuLaden = el('button', { class: 'knopf knopf-zweit dsa-neu-laden', text: 'Neu laden', attrs: { type: 'button' }, on: { click: () => laden() } });
    const dialog = el('dialog', { class: 'besitz-dialog', attrs: { 'aria-labelledby': 'dsa-dialog-titel' } });
    // Nur × und Abbrechen schließen (kein Tipp daneben, keine Escape-Taste), damit nichts Eingetipptes verloren geht
    dialog.addEventListener('cancel', (ev) => ev.preventDefault());
    let sendet = false;
    let laedt = false;

    const gewaehlt = () => (daten ? daten.boegen.find((b) => b.id === auswahl.value) || null : null);

    // --- Anzeige ---

    function zeigeAlles() {
        const boegen = daten ? [...daten.boegen].sort((a, b) => a.name.localeCompare(b.name, 'de')) : [];
        const gemerkt = lesen('dsa_bogen', '');
        const wahl = boegen.some((b) => b.id === auswahl.value) ? auswahl.value
            : (boegen.some((b) => b.id === gemerkt) ? gemerkt : (boegen[0] ? boegen[0].id : ''));
        leeren(auswahl);
        boegen.forEach((b) => auswahl.append(el('option', { text: b.name, attrs: { value: b.id } })));
        auswahl.value = wahl;
        auswahl.hidden = !boegen.length;
        neuKnopf.disabled = !daten;

        const bogen = gewaehlt();
        marke.hidden = !bogen;
        marke.textContent = bogen ? (bogen.regelwerk === 'dnd' ? 'DnD' : 'DSA') : '';
        leeren(oben);
        leeren(abschnitte);
        oben.hidden = !bogen;
        if (!bogen) {
            if (daten) abschnitte.append(el('p', { class: 'leise', text: 'Noch kein Bogen. Lege mit „+ Bogen“ den ersten an.' }));
            return;
        }
        zeigeOben(bogen);
        abschnitte.append(kopfKarte(bogen), eigenschaftenKarte(bogen));
    }

    // Zähler (Geld, LeP, AsP, AP) und Eigenschaften-Leiste, kleben beim Scrollen oben
    function zeigeOben(bogen) {
        const zaehler = bogen.zaehler.filter((z) => {
            // AsP ohne Höchstwert und ohne Stand (Held ohne Zauber) blendet die App aus
            return !(/^(asp|ae)$/i.test(z.k) && !Number(z.max) && stand(bogen, z) === 0);
        });
        if (zaehler.length) {
            oben.append(el('div', { class: 'dsa-zaehler' }, zaehler.map((z) => {
                const s = stand(bogen, z);
                const wert = z.art === 'geld' ? [el('span', { text: geldText(s) })]
                    : [el('span', { text: String(s) }), Number(z.max) ? el('small', { text: ' / ' + z.max }) : null];
                return el('div', { class: 'dsa-zaehler-kachel' }, [
                    el('span', { class: 'dsa-zaehler-name', text: symbol(z) + ' ' + z.k }),
                    el('span', { class: 'dsa-zaehler-wert' }, wert)
                ]);
            })));
        }
        const eig = bogen.eigenschaften.filter((e) => e.g !== 'b');
        if (eig.length) {
            oben.append(el('div', { class: 'dsa-eig' }, eig.map((e) => el('div', { attrs: { title: e.n } }, [
                el('b', { text: e.w || '–' }), el('span', { text: e.k })
            ]))));
        }
    }

    // Eine aufklappbare Karte mit Titel, Knopf ✎ und Inhalt
    function karte(titel, offen, bearbeiten, inhalt) {
        const stift = el('button', { class: 'dsa-stift', text: '✎', attrs: { type: 'button', 'aria-label': titel + ' bearbeiten' }, on: { click: (ev) => { ev.preventDefault(); bearbeiten(); } } });
        return el('details', { class: 'dsa-abschnitt', attrs: { open: offen } }, [
            el('summary', {}, [el('span', { class: 'dsa-abschnitt-titel', text: titel }), stift]),
            el('div', { class: 'dsa-abschnitt-inhalt' }, inhalt)
        ]);
    }

    function kopfKarte(bogen) {
        const felder = KOPF.filter(([k]) => bogen.kopf[k]);
        const inhalt = [];
        if (felder.length) {
            inhalt.push(el('dl', { class: 'dsa-felder' }, felder.flatMap(([k, t]) => [el('dt', { text: t }), el('dd', { text: bogen.kopf[k] })])));
        } else {
            inhalt.push(el('p', { class: 'leise', text: 'Noch leer. Tippe auf ✎.' }));
        }
        if (bogen.notiz) inhalt.push(el('p', { class: 'dsa-notiz', text: bogen.notiz }));
        return karte('Kopf', true, () => zeigeBogenForm(bogen), inhalt);
    }

    function eigenschaftenKarte(bogen) {
        const zeile = (e) => el('div', { class: 'dsa-zeile' }, [
            el('span', { class: 'dsa-zeile-name', text: e.n || e.k }),
            el('span', { class: 'leise', text: e.n ? e.k : '' }),
            el('span', { class: 'dsa-zeile-wert', text: e.w || '–' })
        ]);
        const eig = bogen.eigenschaften.filter((e) => e.g !== 'b');
        const basis = bogen.eigenschaften.filter((e) => e.g === 'b');
        const inhalt = [];
        if (eig.length) inhalt.push(el('h3', { class: 'dsa-gruppe', text: 'Eigenschaften' }), ...eig.map(zeile));
        if (basis.length) inhalt.push(el('h3', { class: 'dsa-gruppe', text: 'Basiswerte' }), ...basis.map(zeile));
        if (bogen.zaehler.length) {
            inhalt.push(el('h3', { class: 'dsa-gruppe', text: 'Zähler oben' }), ...bogen.zaehler.map((z) => el('div', { class: 'dsa-zeile' }, [
                el('span', { class: 'dsa-zeile-name', text: symbol(z) + ' ' + (z.n || z.k) }),
                el('span', { class: 'leise', text: 'Start ' + (z.art === 'geld' ? geldText(z.start) : z.start) + (z.max != null ? ', höchstens ' + z.max : '') }),
                el('span', { class: 'dsa-zeile-wert', text: z.art === 'geld' ? geldText(stand(bogen, z)) : String(stand(bogen, z)) })
            ])));
        }
        if (!inhalt.length) inhalt.push(el('p', { class: 'leise', text: 'Noch leer. Tippe auf ✎.' }));
        return karte('Eigenschaften und Basiswerte', false, () => zeigeEigenschaftenForm(bogen), inhalt);
    }

    // --- Fenster und Senden ---

    function oeffneDialog(titel, inhalt) {
        leeren(dialog);
        dialog.append(el('div', { class: 'besitz-dialog-inhalt' }, [
            el('div', { class: 'form-kopf' }, [
                el('h2', { text: titel, attrs: { id: 'dsa-dialog-titel' } }),
                el('button', { class: 'form-zu', text: '×', attrs: { type: 'button', 'aria-label': 'Schließen' }, on: { click: () => dialog.close() } })
            ]),
            ...inhalt
        ]));
        if (!dialog.open) dialog.showModal();
    }

    // Sendet eine Aktion. Bei Erfolg kommen alle Daten frisch zurück.
    async function senden(status, knoepfe, action, werte) {
        if (sendet) return null;
        sendet = true;
        knoepfe.forEach((k) => { k.disabled = true; });
        status.textContent = 'Sende …';
        try {
            const antwort = await api('dsa', action, werte);
            setzeDaten(antwort);
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

    function formKnoepfe(loeschen) {
        const ok = el('button', { class: 'knopf knopf-bereich', text: 'Speichern', attrs: { type: 'submit' } });
        const abbrechen = el('button', { class: 'knopf knopf-zweit', text: 'Abbrechen', attrs: { type: 'button' }, on: { click: () => dialog.close() } });
        const weg = loeschen ? el('button', { class: 'knopf knopf-zweit', text: 'Bogen löschen', attrs: { type: 'button' }, on: { click: loeschen } }) : null;
        return [ok, abbrechen, weg].filter(Boolean);
    }

    const textFeld = (id, wert, max, extra = {}) => el('input', { attrs: { id, type: 'text', maxlength: max, autocomplete: 'off', value: wert || '', ...extra } });
    const feld = (id, titel, eingabe) => [el('label', { text: titel, attrs: { for: id } }), eingabe];

    // Alle Werte eines Bogens zum Senden (die Teile, die das Formular nicht ändert, bleiben wie sie sind)
    const bogenWerte = (b) => ({ id: b.id, geaendert_am: b.geaendert_am, name: b.name, regelwerk: b.regelwerk, kopf: b.kopf, eigenschaften: b.eigenschaften, zaehler: b.zaehler, notiz: b.notiz });

    // --- Bogen anlegen (b = null) oder Kopf ändern ---
    function zeigeBogenForm(b) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        const name = textFeld('dsa-name', b && b.name, 80);
        const regelwerk = el('select', { attrs: { id: 'dsa-regelwerk' } }, [
            el('option', { text: 'DSA', attrs: { value: 'dsa' } }), el('option', { text: 'DnD', attrs: { value: 'dnd' } })
        ]);
        regelwerk.value = b ? b.regelwerk : 'dsa';
        const kopfFelder = KOPF.map(([k, t]) => [k, t, textFeld('dsa-kopf-' + k, b && b.kopf[k], 80)]);
        const notiz = el('textarea', { attrs: { id: 'dsa-notiz', maxlength: 1000, rows: 3, placeholder: 'freiwillig' } });
        notiz.value = b ? b.notiz : '';
        const knoepfe = formKnoepfe(b ? () => loeschen(b, status, knoepfe) : null);

        async function absenden(ev) {
            ev.preventDefault();
            if (!name.value.trim()) { status.textContent = 'Bitte einen Namen angeben.'; return; }
            const kopf = {};
            kopfFelder.forEach(([k, , f]) => { if (f.value.trim()) kopf[k] = f.value.trim(); });
            const werte = b ? bogenWerte(b) : { eigenschaften: VORLAGE_EIGENSCHAFTEN, zaehler: VORLAGE_ZAEHLER };
            Object.assign(werte, { name: name.value.trim(), regelwerk: regelwerk.value, kopf, notiz: notiz.value.trim() });
            const antwort = await senden(status, knoepfe, 'bogen_speichern', { bogen: werte });
            if (!antwort) return;
            dialog.close();
            if (antwort.id) { schreiben('dsa_bogen', antwort.id); auswahl.value = antwort.id; }
            zeigeAlles();
            zeigeGespeichert(b ? 'Gespeichert' : 'Bogen angelegt');
        }

        oeffneDialog(b ? 'Kopf bearbeiten' : 'Neuer Bogen', [
            el('form', { class: 'formular', on: { submit: absenden } }, [
                ...feld('dsa-name', 'Name', name),
                ...feld('dsa-regelwerk', 'Für', regelwerk),
                b ? null : el('p', { class: 'leise besitz-hinweis', text: 'Der Bogen startet mit den Eigenschaften und Zählern von DSA. Alles lässt sich danach ändern.' }),
                ...kopfFelder.flatMap(([k, t, f]) => feld('dsa-kopf-' + k, t, f)),
                ...feld('dsa-notiz', 'Notiz', notiz),
                status,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe)
            ])
        ]);
    }

    async function loeschen(b, status, knoepfe) {
        if (!confirm('Bogen „' + b.name + '“ mit allen Einträgen löschen? (Im Sheet zurückholbar)')) return;
        const antwort = await senden(status, knoepfe, 'bogen_loeschen', { id: b.id, geaendert_am: b.geaendert_am });
        if (!antwort) return;
        dialog.close();
        zeigeAlles();
        zeigeGespeichert('Gelöscht');
    }

    // --- Eigenschaften, Basiswerte und Zähler ändern ---
    function zeigeEigenschaftenForm(b) {
        const status = el('p', { class: 'meldung', attrs: { role: 'status', 'aria-live': 'polite' } });
        let nr = 0;
        const eigBox = el('div', { class: 'dsa-zeilen-form' });
        const basisBox = el('div', { class: 'dsa-zeilen-form' });
        const zaehlerBox = el('div', { class: 'dsa-zeilen-form' });

        // Eine Zeile mit Kürzel, Name und Wert; g = 'e' (Eigenschaft, oben in der Leiste) oder 'b' (Basiswert)
        function eigZeile(e, g) {
            const i = nr++;
            const k = textFeld('dsa-e-k-' + i, e.k, 8, { 'aria-label': 'Kürzel', placeholder: 'Kürzel' });
            const n = textFeld('dsa-e-n-' + i, e.n, 40, { 'aria-label': 'Name', placeholder: 'Name' });
            const w = textFeld('dsa-e-w-' + i, e.w, 20, { 'aria-label': 'Wert', placeholder: 'Wert', inputmode: 'text' });
            const zeile = el('div', { class: 'dsa-eig-zeile' }, [k, n, w,
                el('button', { class: 'dsa-stift', text: '×', attrs: { type: 'button', 'aria-label': 'Zeile entfernen' }, on: { click: () => zeile.remove() } })]);
            zeile.wert = () => ({ k: k.value.trim(), n: n.value.trim(), w: w.value.trim(), g });
            return zeile;
        }

        function zaehlerZeile(z) {
            const i = nr++;
            const k = textFeld('dsa-z-k-' + i, z.k, 8, { 'aria-label': 'Kürzel', placeholder: 'Kürzel' });
            const n = textFeld('dsa-z-n-' + i, z.n, 40, { 'aria-label': 'Name', placeholder: 'Name' });
            const art = el('select', { attrs: { 'aria-label': 'Art' } }, ARTEN.map(([w, t]) => el('option', { text: t, attrs: { value: w } })));
            art.value = z.art || 'zahl';
            const start = el('input', { attrs: { type: 'number', step: '1', 'aria-label': 'Startwert', placeholder: 'Start', value: z.start ?? 0 } });
            const max = el('input', { attrs: { type: 'number', step: '1', min: '0', 'aria-label': 'Höchstwert', placeholder: 'max', value: z.max ?? '' } });
            const zeile = el('div', { class: 'dsa-zaehler-zeile' }, [k, n, art, start, max,
                el('button', { class: 'dsa-stift', text: '×', attrs: { type: 'button', 'aria-label': 'Zähler entfernen' }, on: { click: () => zeile.remove() } })]);
            zeile.wert = () => ({ k: k.value.trim(), n: n.value.trim(), art: art.value, start: start.value.trim() === '' ? 0 : Number(start.value), max: max.value.trim() === '' ? null : Number(max.value) });
            return zeile;
        }

        b.eigenschaften.forEach((e) => (e.g === 'b' ? basisBox : eigBox).append(eigZeile(e, e.g === 'b' ? 'b' : 'e')));
        b.zaehler.forEach((z) => zaehlerBox.append(zaehlerZeile(z)));
        const knoepfe = formKnoepfe(null);

        async function absenden(ev) {
            ev.preventDefault();
            const eigenschaften = [...eigBox.children, ...basisBox.children].map((z) => z.wert()).filter((e) => e.k || e.n || e.w);
            const zaehler = [...zaehlerBox.children].map((z) => z.wert()).filter((z) => z.k || z.n);
            if (eigenschaften.some((e) => !e.k) || zaehler.some((z) => !z.k)) { status.textContent = 'Jede Zeile braucht ein Kürzel.'; return; }
            const werte = { ...bogenWerte(b), eigenschaften, zaehler };
            if (!await senden(status, knoepfe, 'bogen_speichern', { bogen: werte })) return;
            dialog.close();
            zeigeAlles();
            zeigeGespeichert();
        }

        oeffneDialog('Eigenschaften und Basiswerte', [
            el('form', { class: 'formular', on: { submit: absenden } }, [
                el('h3', { class: 'dsa-gruppe', text: 'Eigenschaften (oben in der Leiste)' }),
                el('p', { class: 'leise besitz-hinweis', text: 'Je Zeile Kürzel, Name und Wert.' }),
                eigBox,
                el('button', { class: 'knopf knopf-zweit', text: '+ Eigenschaft', attrs: { type: 'button' }, on: { click: () => eigBox.append(eigZeile({}, 'e')) } }),
                el('h3', { class: 'dsa-gruppe', text: 'Basiswerte' }),
                basisBox,
                el('button', { class: 'knopf knopf-zweit', text: '+ Basiswert', attrs: { type: 'button' }, on: { click: () => basisBox.append(eigZeile({}, 'b')) } }),
                el('h3', { class: 'dsa-gruppe', text: 'Zähler oben' }),
                el('p', { class: 'leise besitz-hinweis', text: 'Startwert ist der Stand vor dem Verlauf (Geld in Kreuzern: 1 D = 10 S = 100 H = 1000 K). Höchstwert zum Beispiel für LeP und AsP.' }),
                zaehlerBox,
                el('button', { class: 'knopf knopf-zweit', text: '+ Zähler', attrs: { type: 'button' }, on: { click: () => zaehlerBox.append(zaehlerZeile({ k: '', n: '', art: 'zahl', start: 0, max: null })) } }),
                status,
                el('div', { class: 'besitz-form-knoepfe' }, knoepfe)
            ])
        ]);
    }

    // --- Laden ---

    function setzeDaten(d) {
        daten = {
            boegen: Array.isArray(d.boegen) ? d.boegen : [],
            eintraege: Array.isArray(d.eintraege) ? d.eintraege : [],
            verlauf: Array.isArray(d.verlauf) ? d.verlauf : []
        };
        daten.boegen.forEach((b) => {
            b.kopf = b.kopf && typeof b.kopf === 'object' ? b.kopf : {};
            b.eigenschaften = Array.isArray(b.eigenschaften) ? b.eigenschaften : [];
            b.zaehler = Array.isArray(b.zaehler) ? b.zaehler : [];
        });
    }

    async function laden() {
        if (laedt) return;
        laedt = true;
        neuLaden.disabled = true;
        ladeStatus.textContent = daten ? 'Aktualisiere …' : 'Lade …';
        try {
            setzeDaten(await api('dsa', 'liste'));
            ladeStatus.textContent = '';
        } catch (e) {
            ladeStatus.textContent = e.code === 'aktion'
                ? 'Das Skript „dsa“ kennt diese Aktion nicht. Bitte die neue Fassung von Code.gs einfügen und eine neue Version bereitstellen.'
                : 'Laden fehlgeschlagen: ' + e.message;
        } finally {
            laedt = false;
            neuLaden.disabled = false;
            zeigeAlles();
        }
    }

    container.append(
        el('div', { class: 'dsa-titelzeile' }, [
            el('h1', { class: 'bereich-titel titel-mit-emoji' }, [
                el('img', { class: 'dsa-w20', attrs: { src: 'icons/w20.svg', alt: '', width: '44', height: '44' } }),
                el('span', { text: 'Pen & Paper' })
            ]),
            neuKnopf
        ]),
        leiste,
        ladeStatus,
        oben,
        abschnitte,
        neuLaden,
        dialog
    );
    zeigeAlles();
    laden();
}
