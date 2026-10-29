var SECRET_PIN = "HIER_PASSWORT"; // wird in Schritt 0.2 durch Skripteigenschaft APP_PIN ersetzt 

function doPost(e) {
  var data;
  try { 
    data = JSON.parse(e.postData.contents); 
  } catch(f) { 
    return ContentService.createTextOutput("Fehler beim Parsen").setMimeType(ContentService.MimeType.TEXT);
  }
  
  if (data.pin !== SECRET_PIN) {
    return ContentService.createTextOutput("Zugriff verweigert").setMimeType(ContentService.MimeType.TEXT);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Tabellenblatt1");
  if (!sheet) return ContentService.createTextOutput("Blatt nicht gefunden").setMimeType(ContentService.MimeType.TEXT);

  // Spalten-Mapping (Sucht Namen in Zeile 4)
  var lastCol = sheet.getLastColumn();
  var headerRow = sheet.getRange(4, 1, 1, lastCol).getValues()[0];
  
  var getCol = function(name) {
    var idx = headerRow.indexOf(name);
    return idx + 1;
  };

  // Datum verarbeiten
  var buchungsDatum = data.datum ? new Date(data.datum) : new Date();
  buchungsDatum.setHours(12, 0, 0, 0);

  // Neue Zeile finden
  var lastRow = sheet.getLastRow();
  var targetRow = lastRow + 1;

  // Datum in die Spalte "Datum" schreiben
  var dateCol = getCol("Datum");
  if (dateCol > 0) {
    sheet.getRange(targetRow, dateCol).setValue(buchungsDatum);
  }
  
  // Alle anderen Felder aus dem "values"-Objekt loopen und setzen
  for (var key in data.values) {
    var colIdx = getCol(key);
    if (colIdx > 0) {
      sheet.getRange(targetRow, colIdx).setValue(data.values[key]);
    }
  }

  return ContentService.createTextOutput("Erfolg").setMimeType(ContentService.MimeType.TEXT);
}