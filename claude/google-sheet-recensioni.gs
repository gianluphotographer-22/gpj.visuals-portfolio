/**
 * GPJ Visuals — ricevi recensioni e messaggi di contatto del sito in un
 * Google Sheet.
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
 * anche come nuova riga nel foglio principale, e ogni messaggio dal
 * modulo "Contattami" comparirà come nuova riga in una scheda separata
 * chiamata "Contatti" (creata da sola al primo invio) — oltre alla email
 * che continui a ricevere come prima da Web3Forms in entrambi i casi.
 *
 * SE HAI GIÀ INSTALLATO UNA VERSIONE PRECEDENTE di questo script:
 * sostituisci tutto il contenuto con questo file, poi vai su "Esegui il
 * deployment" > "Gestisci deployment" > icona matita > Versione "Nuova
 * versione" > "Esegui il deployment". L'URL /exec resta lo stesso, non
 * serve cambiare nulla nel sito. Al primo invio successivo, lo script
 * aggiunge da solo due colonne nuove al foglio delle recensioni
 * ("Pubblica (SI/NO)" e "In home (SI/NO)"), senza toccare le righe già
 * presenti.
 *
 * QUELLE DUE COLONNE SONO PER TE: scrivi "SI" in "Pubblica (SI/NO)" per
 * ogni recensione che vuoi mostrare sul sito (nella pagina Recensioni
 * generali), e in più "SI" anche in "In home (SI/NO)" se la vuoi anche
 * in homepage — esattamente come facevi nell'Excel. Quando vuoi che il
 * sito rispecchi le tue scelte, condividi il link del foglio (basta la
 * visualizzazione) e chiedimi di aggiornare: leggo le righe segnate
 * "SI" e preparo io il sito pubblicato, senza che tu debba più toccare
 * l'Excel.
 */

function doPost(e) {
  var dati = {};
  try {
    dati = JSON.parse(e.postData.contents);
  } catch (err) {
    dati = {};
  }

  if (dati.tipo === "contatto") {
    salvaContatto(dati);
  } else {
    salvaRecensione(dati);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function salvaRecensione(dati) {
  // Stesso foglio di sempre (il primo/attivo), così le recensioni già
  // raccolte restano dove sono.
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var intestazioniComplete = [
    "Data", "Nome", "Ruolo o azienda", "Email", "Voto", "Recensione",
    "Pubblica (SI/NO)", "In home (SI/NO)", "Anno"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(intestazioniComplete);
    sheet.getRange(1, 1, 1, intestazioniComplete.length).setFontWeight("bold");
  } else {
    // Migrazione automatica: se il foglio esisteva già da prima (senza le
    // colonne di moderazione), le aggiunge senza toccare i dati presenti.
    var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (header.indexOf("Pubblica (SI/NO)") === -1) {
      var mancanti = intestazioniComplete.filter(function (h) {
        return header.indexOf(h) === -1;
      });
      if (mancanti.length) {
        var colonnaIniziale = sheet.getLastColumn() + 1;
        sheet.getRange(1, colonnaIniziale, 1, mancanti.length).setValues([mancanti]);
        sheet.getRange(1, colonnaIniziale, 1, mancanti.length).setFontWeight("bold");
      }
    }
  }

  sheet.appendRow([
    new Date(),
    dati.name || "",
    dati.ruolo || "",
    dati.email || "",
    dati.voto || "",
    dati.message || "",
    "", // Pubblica (SI/NO) — la compili tu
    "", // In home (SI/NO) — la compili tu
    new Date().getFullYear().toString()
  ]);
}

function salvaContatto(dati) {
  var sheet = trovaOCreaScheda("Contatti", ["Data", "Nome", "Email", "Messaggio"]);
  sheet.appendRow([
    new Date(),
    dati.name || "",
    dati.email || "",
    dati.message || ""
  ]);
}

function trovaOCreaScheda(nome, intestazioni) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nome);
  if (!sheet) {
    sheet = ss.insertSheet(nome);
    sheet.appendRow(intestazioni);
    sheet.getRange(1, 1, 1, intestazioni.length).setFontWeight("bold");
  }
  return sheet;
}
