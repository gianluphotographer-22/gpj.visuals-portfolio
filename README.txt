PORTFOLIO VETRINA MULTIMEDIA — COME MODIFICARLO

APERTURA
1. Estrai lo ZIP.
2. Apri index.html con il browser.
3. Per modificarlo usa Visual Studio Code.

PAGINE PROGETTO
La cartella /projects contiene una pagina HTML per ogni lavoro:
- matchday-stories.html
- athlete-portraits.html
- live-atmosphere.html
- visual-campaign.html
- match-film.html
- intensity.html
- human-detail.html

Quando clicchi una card nella homepage viene aperta la relativa pagina progetto.

FOTOGRAFIE
Le immagini sono nella cartella /images.
I file SVG presenti sono solo placeholder.
Puoi sostituirli con JPG o WebP e cambiare il percorso nei file HTML.

VIDEO
Il file /videos/demo-showreel.mp4 è un video demo.
Puoi:
1. cancellarlo;
2. inserire il tuo MP4 nella cartella /videos;
3. aprire la pagina progetto desiderata;
4. cerca:
   ../videos/demo-showreel.mp4
5. sostituiscilo con:
   ../videos/nomedelvideo.mp4

ESEMPIO:
<video controls>
  <source src="../videos/highlights-bari.mp4" type="video/mp4">
</video>

PER YOUTUBE
Al posto del tag <video> puoi usare:
<iframe
  width="100%"
  src="https://www.youtube.com/embed/ID_VIDEO"
  title="YouTube video"
  allowfullscreen>
</iframe>

FILE PRINCIPALI
index.html               Homepage
assets/css/style.css     Grafica, colori, responsive
assets/js/main.js        Filtri, menu, animazioni, lightbox
projects/*.html          Pagine dedicate ai singoli lavori
images/                  Foto e copertine
videos/                  Video MP4

COLORE PRINCIPALE
Nel file assets/css/style.css:
--red:#e10600;

Puoi cambiare #e10600 con qualsiasi altro rosso.

CONSIGLIO
Per le foto usa JPG/WebP ottimizzati.
Per i video web usa MP4 H.264 per maggiore compatibilità.


CERTIFICAZIONI
La homepage contiene ora la sezione #certifications.
Per modificarla: apri index.html, cerca "certifications" e cambia ente, nome, anno, descrizione e href del certificato.
Puoi duplicare una <article class="cert-card"> per aggiungere nuove certificazioni.
