// Bilder vor dem Senden verkleinern. Alles passiert im Gerät, nichts geht an fremde Server.
// Ergebnis ist ein data:-Bild (JPEG), passend zur Content-Security-Policy (img-src 'self' data:).

import { api } from '../api.js';
import { el } from './dom.js';

// Liest eine Bilddatei, verkleinert sie auf höchstens maxSeite Pixel und gibt ein data:-JPEG zurück.
export function verkleinereBild(datei, maxSeite = 1600, qualitaet = 0.85) {
    return new Promise((fertig, fehler) => {
        if (!datei || !/^image\//.test(datei.type)) {
            fehler(new Error('Bitte ein Bild wählen.'));
            return;
        }
        const leser = new FileReader();
        leser.onerror = () => fehler(new Error('Das Bild konnte nicht gelesen werden.'));
        leser.onload = () => {
            const bild = new Image();
            bild.onerror = () => fehler(new Error('Dieses Bildformat kann der Browser nicht öffnen. Bitte JPEG oder PNG wählen.'));
            bild.onload = () => {
                const faktor = Math.min(1, maxSeite / Math.max(bild.naturalWidth, bild.naturalHeight));
                const leinwand = document.createElement('canvas');
                leinwand.width = Math.max(1, Math.round(bild.naturalWidth * faktor));
                leinwand.height = Math.max(1, Math.round(bild.naturalHeight * faktor));
                const malen = leinwand.getContext('2d');
                // Weißer Grund, damit durchsichtige PNGs nicht schwarz werden
                malen.fillStyle = '#FFFFFF';
                malen.fillRect(0, 0, leinwand.width, leinwand.height);
                malen.drawImage(bild, 0, 0, leinwand.width, leinwand.height);
                fertig(leinwand.toDataURL('image/jpeg', qualitaet));
            };
            bild.src = leser.result;
        };
        leser.readAsDataURL(datei);
    });
}

// Baut aus einer Skript-Antwort { typ, daten } ein data:-Bild. Nur bekannte Bildarten.
export function bildAdresse(antwort) {
    const typ = String(antwort && antwort.typ || '');
    if (!/^image\/(jpeg|png|gif|webp)$/.test(typ) || typeof antwort.daten !== 'string') return null;
    return 'data:' + typ + ';base64,' + antwort.daten;
}

// Merkt geladene Bilder im Arbeitsspeicher (Kennung → data:-Bild) und holt fehlende beim Skript.
// bilder.hole(id) lädt einmal und merkt es; bilder.set(id, adresse) merkt ein gerade gewähltes Bild.
// feld = Name, unter dem das Skript die Kennung erwartet (Visitenkarte: „id“, sonst „bild“).
export function bildSpeicher(skript, feld = 'bild') {
    const bilder = new Map();
    bilder.hole = async (id) => {
        if (bilder.has(id)) return bilder.get(id);
        const adresse = bildAdresse(await api(skript, 'bild', { [feld]: id }));
        if (!adresse) throw new Error('Unbekannte Bildart.');
        bilder.set(id, adresse);
        return adresse;
    };
    return bilder;
}

// Ein Bild-Feld im Formular (Besitz, Pen & Paper): Datei wählen (die App verkleinert sie) oder Drive-Link, Vorschau, „Bild entfernen“.
// id = Vorsilbe der Feld-Kennungen, alt = Beschreibung der Vorschau, bilder = bildSpeicher des Reiters.
// feld.elemente ins Formular hängen; feld.setze(kennung) beim Öffnen; feld.werte() beim Speichern ({ bild_daten } oder { bild });
// feld.geaendert sagt, ob die Person am Bild etwas getan hat; feld.merke(kennung) merkt ein neu hochgeladenes Bild nach dem Speichern.
export function bildFeld({ id, alt, bilder }) {
    let stand = { id: '', daten: null };   // id = gespeichertes Bild, daten = neu gewähltes (verkleinert)
    let geaendert = false;
    const vorschau = el('img', { class: 'besitz-vorschau', attrs: { alt, hidden: true } });
    const text = el('p', { class: 'leise besitz-hinweis' });
    const datei = el('input', { attrs: { id, type: 'file', accept: 'image/*' }, on: { change: () => gewaehlt() } });
    const link = el('input', {
        attrs: { id: id + '-link', type: 'url', inputmode: 'url', autocomplete: 'off', spellcheck: 'false', placeholder: 'https://drive.google.com/…' },
        on: { input: () => { geaendert = true; if (link.value.trim()) { stand = { id: stand.id, daten: null }; zeige(null, 'Das Bild aus dem Link erscheint nach dem Speichern.'); } } }
    });
    const entfernen = el('button', {
        class: 'knopf knopf-zweit', text: 'Bild entfernen', attrs: { type: 'button', hidden: true },
        on: { click: () => { geaendert = true; stand = { id: '', daten: null }; datei.value = ''; link.value = ''; zeige(null); } }
    });

    function zeige(adresse, hinweis = '') {
        vorschau.hidden = !adresse;
        if (adresse) vorschau.src = adresse; else vorschau.removeAttribute('src');
        text.textContent = hinweis;
        entfernen.hidden = !(adresse || stand.id || link.value.trim());
    }

    async function gewaehlt() {
        const d = datei.files && datei.files[0];
        if (!d) return;
        zeige(null, 'Bild wird verkleinert …');
        try {
            const daten = await verkleinereBild(d);
            link.value = '';
            stand = { id: stand.id, daten };
            geaendert = true;
            zeige(daten);
        } catch (e) {
            datei.value = '';
            zeige(null, e.message);
        }
    }

    return {
        elemente: [
            el('label', { text: 'Bild (freiwillig): wählen oder aufnehmen', attrs: { for: id } }), datei,
            el('label', { text: 'oder Google-Drive-Link', attrs: { for: id + '-link' } }), link,
            vorschau, text, entfernen
        ],
        get geaendert() { return geaendert; },
        // Gespeichertes Bild zeigen (leer = keins). Lädt es, wenn es noch nicht im Speicher ist.
        setze(kennung) {
            stand = { id: kennung || '', daten: null };
            geaendert = false;
            datei.value = '';
            link.value = '';
            if (!stand.id) { zeige(null); return; }
            const k = stand.id;
            if (bilder.has(k)) { zeige(bilder.get(k)); return; }
            zeige(null, 'Bild lädt …');
            bilder.hole(k)
                .then((a) => { if (stand.id === k && !stand.daten && !link.value.trim()) zeige(a); })
                .catch((e) => { if (stand.id === k) zeige(null, 'Bild nicht geladen: ' + e.message); });
        },
        // Neu gewählt geht als Text mit, sonst Link oder das bisherige Bild (leer = kein Bild)
        werte() {
            return stand.daten ? { bild_daten: stand.daten.replace(/^data:image\/jpeg;base64,/, '') } : { bild: link.value.trim() || stand.id };
        },
        merke(kennung) {
            if (stand.daten && kennung) bilder.set(kennung, stand.daten);
        }
    };
}
