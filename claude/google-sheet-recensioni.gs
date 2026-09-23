/**
 * GPJ Visuals — ricevi le recensioni del modulo del sito in un Google Sheet.
 *
 * COME USARLO (vedi anche GUIDA-ADMIN.txt, punto 12):
 * 1. Vai su https://sheets.google.com e crea un foglio nuovo, vuoto.
 *    Chiamalo per esempio "Recensioni sito".
 * 2. Dal menu del foglio: Estensioni > Apps Script.
 * 3. Cancella il contenuto di esempio (function myFunction... ) e incolla
 *    tutto questo file al suo posto.
 * 4. In alto premi "Salva" (icona del dischetto), poi "Esegui" > scegli
 *    la funzione "doPost" (serve solo per farti chiedere i permessi la
 *    prima volta: comparirà un avviso di Google, premi "Avanzate" >
 *    "Vai al progetto (non sicuro)" > "Consenti" — è normale, è il tuo
 *    stesso script, su un progetto che hai appena creato tu).
 * 5. In alto a destra: "Esegui il deployment" > "Nuovo deployment".
 *    Tipo: "App web". Chi ha accesso: "Chiunque". Esegui come: "Io".
 *    Premi "Esegui il deployment" e poi "Autorizza accesso" se richiesto.
 * 6. Copia l'URL che ti viene dato (finisce con /exec).
 * 7. Mandami quell'URL: lo incollo al posto giusto in assets/js/main.js
 *    (costante SHEET_WEBHOOK_URL) e ti preparo il sito aggiornato.
 *
 * Da quel momento, ogni recensione inviata dal modulo del sito comparirà
 * anche come nuova riga in questo foglio — oltre alla email che continui
 * a ricevere come prima da Web3Forms.
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Data", "Nome", "Ruolo o azienda", "Email", "Voto", "Recensione"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
  }

  var dati = {};
  try {
    dati = JSON.parse(e.postData.contents);
  } catch (err) {
    dati = {};
  }

  sheet.appendRow([
    new Date(),
    dati.name || "",
    dati.ruolo || "",
    dati.email || "",
    dati.voto || "",
    dati.message || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
