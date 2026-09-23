#!/usr/bin/env python3
"""
crea-timmagini.py
------------------
Trasforma "T'Immagini" in una raccolta a capitoli, una per ogni
partita dell'Ideale Bari raccontata — stesso meccanismo gia' usato
per Cuore Biancorosso. Stesso file di sempre (projects/matchday-
stories.html), quindi i link che gia' puntano li' continuano a
funzionare da soli.

PER AGGIUNGERE UNA PARTITA
  1. metti le foto in images/timmagini/<slug>-1.jpg, -2.jpg, ...
     piu' <slug>-cover.jpg (solo per la primissima partita, e' la
     copertina di tutta la pagina)
  2. se c'e' un video, mettilo in videos/<slug>.mp4 (comprimilo prima
     con comprimi-video.py)
  3. aggiungi un blocco alla lista PARTITE qui sotto
  4. lancia:  python3 crea-timmagini.py --progetto . --uscita ./nuovo

USO:
    python3 crea-timmagini.py --progetto . --uscita ./nuovo
"""

import argparse
import re
from pathlib import Path

SLUG_FILE = "matchday-stories"          # nome del file, invariato
CARTELLA_FOTO = "images/timmagini"
TITOLO = "T'IMMAGINI"
CATEGORIA = "IDEALE BARI CALCIO"
TAG_CARD = "IDEALE BARI CALCIO"

INTRO = (
    "Un gruppo unico, un calcio diverso, delle emozioni indescrivibili. "
    "Questa raccolta segue l&rsquo;Ideale Bari partita dopo partita: "
    "ogni capitolo racconta una giornata a s&eacute;, e cresce ogni volta "
    "che c&rsquo;&egrave; una nuova gara da raccontare."
)

FATTI = [
    ("Cliente", "Ideale Bari Calcio"),
    ("Formato", "Diario di stagione"),
    ("Servizi", "Photo, Video, Social"),
    ("Stato", "In aggiornamento"),
]

# --- ordine dei capitoli = ordine di questa lista ---
PARTITE = [
    {
        "slug": "ideale-triggiano",
        "titolo": "IDEALE BARI &mdash; TRIGGIANO",
        "etichetta": "Bisceglie, 10 maggio 2026",
        "nota": (
            "Un gruppo unico, un calcio diverso, delle emozioni indescrivibili: "
            "tra tutte le squadre scattate sul rettangolo verde, quelle vissute "
            "con l&rsquo;Ideale Bari restano uniche. Il traguardo raggiunto "
            "ancora di pi&ugrave;, perch&eacute; le favole esistono, basta crederci."
        ),
        "foto": 14,
        "video": "BOVIO.MP4",
        "video_nota": "Il goal vittoria di Bovio in Ideale Bari &mdash; Triggiano | Bisceglie, 10 maggio 2026",
    },
]

PROGETTO_SUCCESSIVO = ("athlete-portraits.html", "SCATTI DA RE")


# ======================================================================
# CSS dei capitoli — stesso blocco gia' usato in Cuore Biancorosso
# ======================================================================

CSS_CAPITOLI = """
    /* ==============================
       RACCOLTA A CAPITOLI
    ============================== */

    .project-page .match-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 0 0 8px;
      padding: 0;
      list-style: none;
    }

    .project-page .match-nav a {
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
      padding: 9px 16px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 999px;
      font-size: 13px;
      letter-spacing: 0.04em;
      text-decoration: none;
      color: inherit;
      transition: border-color .25s ease, background .25s ease;
    }

    .project-page .match-nav a:hover,
    .project-page .match-nav a:focus-visible {
      border-color: var(--red, #e10600);
      background: rgba(225, 6, 0, 0.08);
    }

    .project-page .match-nav .n {
      font-size: 11px;
      opacity: .55;
    }

    .project-page .match-chapter {
      scroll-margin-top: 90px;
      padding-top: 10px;
    }

    .project-page .match-chapter + .match-chapter {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 20px;
    }

    .project-page .match-note {
      max-width: 62ch;
      margin: 14px 0 0;
      opacity: .78;
      line-height: 1.65;
    }

    .project-page .match-video {
      margin-top: 34px;
    }

    .project-page .collection-end {
      padding: 10px 0 70px;
    }

    .project-page .collection-end p {
      max-width: 60ch;
      opacity: .6;
      font-size: 15px;
    }
"""


def blocco_galleria(partita: dict) -> str:
    pezzi = []
    titolo_pulito = partita["titolo"].replace("&mdash;", "\u2014")
    for i in range(1, partita["foto"] + 1):
        pezzi.append(f"""          <button class="gallery-item" type="button" aria-label="Apri immagine {i}">
            <img src="../{CARTELLA_FOTO}/{partita['slug']}-{i}.jpg" alt="{titolo_pulito} &mdash; immagine {i}" loading="lazy" decoding="async">
          </button>
""")
    return "\n".join(pezzi)


def blocco_video(partita: dict) -> str:
    if not partita.get("video"):
        return ""
    cover = partita.get("cover_locale", f"{CARTELLA_FOTO}/{partita['slug']}-cover.jpg")
    return f"""
        <div class="match-video reveal">
          <div class="video-frame">
            <video controls playsinline preload="metadata" poster="../{cover}">
              <source src="../videos/{partita['video']}" type="video/mp4">
              Il browser non supporta la riproduzione video.
            </video>
          </div>
          <p class="video-note">{partita.get('video_nota', '')}</p>
        </div>
"""


def blocco_capitolo(partita: dict, numero: int) -> str:
    return f"""
    <!-- CAPITOLO {numero:02d} — {partita['slug']} -->
    <section class="gallery-section match-chapter" id="{partita['slug']}">
      <div class="container">
        <div class="eyebrow red reveal">{numero:02d} &mdash; {partita['etichetta']}</div>
        <h2 class="gallery-title reveal">{partita['titolo']}</h2>
        <p class="match-note reveal">{partita['nota']}</p>

        <div class="gallery-grid">

{blocco_galleria(partita)}
        </div>
{blocco_video(partita)}
      </div>
    </section>
"""


def blocco_nav() -> str:
    voci = []
    for i, p in enumerate(PARTITE, start=1):
        voci.append(f"""            <li>
              <a href="#{p['slug']}"><span class="n">{i:02d}</span> {p['titolo']}</a>
            </li>
""")
    return f"""
    <!-- INDICE DEI CAPITOLI -->
    <section class="gallery-section" style="padding-bottom:0">
      <div class="container">
        <div class="eyebrow red reveal">{len(PARTITE)} partite raccontate</div>
        <h2 class="gallery-title reveal">I CAPITOLI</h2>
        <ul class="match-nav reveal">

{''.join(voci)}
        </ul>
      </div>
    </section>
"""


def blocco_chiusura() -> str:
    return """
    <!-- RACCOLTA APERTA -->
    <section class="collection-end">
      <div class="container reveal">
        <p>La raccolta &egrave; aperta: ogni nuova partita raccontata diventa un capitolo in fondo a questa pagina.</p>
      </div>
    </section>
"""


def blocco_fatti() -> str:
    return "\n".join(
        f'          <div class="fact"><small>{e}</small><strong>{v}</strong></div>'
        for e, v in FATTI)


def crea_pagina(template: Path) -> str:
    html = template.read_text(encoding="utf-8")
    cover = f"{CARTELLA_FOTO}/{PARTITE[0]['slug']}-cover.jpg"

    # CSS dei capitoli, prima della chiusura </style>
    if ".match-nav" not in html:
        html = html.replace("</style>", CSS_CAPITOLI + "</style>", 1)

    # copertina hero
    html = re.sub(
        r'src="\.\./images/matchday-stories-cover\.jpg"',
        f'src="../{cover}"', html)

    # intro + fatti (parte generale del catalogo, non della singola partita)
    html = re.sub(r'<p class="project-intro">.*?</p>',
                  f'<p class="project-intro">{INTRO}</p>', html, count=1, flags=re.DOTALL)
    html = re.sub(r'(<div class="project-facts reveal">).*?(</div>\s*</div>\s*</section>)',
                  lambda m: m.group(1) + "\n" + blocco_fatti() + "\n      " + m.group(2),
                  html, count=1, flags=re.DOTALL)

    # sostituisce la galleria singola + la vecchia sezione video con indice + capitoli
    capitoli = blocco_nav()
    for i, partita in enumerate(PARTITE, start=1):
        capitoli += blocco_capitolo(partita, i)
    capitoli += blocco_chiusura()

    html = re.sub(r'\s*<section class="gallery-section">.*?(?=<section class="next-project">)',
                  "\n" + capitoli + "\n  ", html, count=1, flags=re.DOTALL)

    # progetto successivo (lasciato invariato, ma pronto se cambia)
    href, etichetta = PROGETTO_SUCCESSIVO
    html = re.sub(r'(<a href=")[a-z0-9-]+\.html(">\s*<h2>).*?(</h2>)',
                  rf'\g<1>{href}\g<2>{etichetta}\g<3>', html, count=1)

    return html


def card_homepage(index: str) -> str:
    n = len(PARTITE)
    etichetta = "PARTITA" if n == 1 else "PARTITE"
    index = re.sub(
        r'(href="projects/matchday-stories\.html"[\s\S]*?class="project-tag">)\s*IDEALE BARI CALCIO\s*(</div>)',
        rf'\1\n\n              {TAG_CARD} &middot; {n} {etichetta}\n\n            \2',
        index, count=1)
    index = index.replace(
        'src="images/matchday-stories-cover.jpg"',
        f'src="{CARTELLA_FOTO}/{PARTITE[0]["slug"]}-cover.jpg"')
    return index


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--progetto", default=".")
    p.add_argument("--uscita", default="./nuovo")
    a = p.parse_args()

    progetto, uscita = Path(a.progetto), Path(a.uscita)
    (uscita / "projects").mkdir(parents=True, exist_ok=True)

    template = progetto / "projects" / f"{SLUG_FILE}.html"
    pagina = crea_pagina(template)
    (uscita / "projects" / f"{SLUG_FILE}.html").write_text(pagina, encoding="utf-8")
    totale_foto = sum(x["foto"] for x in PARTITE)
    print(f"Creata: projects/{SLUG_FILE}.html  ({len(pagina)/1024:.0f} KB)")
    for i, x in enumerate(PARTITE, start=1):
        video = f"  (+ video {x['video']})" if x.get("video") else ""
        print(f"  capitolo {i:02d}  {x['slug']:<20} {x['foto']:>2} foto{video}")
    print(f"  totale foto: {totale_foto}")

    index = (progetto / "index.html").read_text(encoding="utf-8")
    index = card_homepage(index)
    (uscita / "index.html").write_text(index, encoding="utf-8")
    print("Card della homepage aggiornata.")


if __name__ == "__main__":
    main()
