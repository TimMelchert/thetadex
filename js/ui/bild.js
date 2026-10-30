// Bilder vor dem Senden verkleinern. Alles passiert im Gerät, nichts geht an fremde Server.
// Ergebnis ist ein data:-Bild (JPEG), passend zur Content-Security-Policy (img-src 'self' data:).

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
