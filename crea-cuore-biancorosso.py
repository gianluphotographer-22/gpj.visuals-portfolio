#!/usr/bin/env python3
"""
crea-cuore-biancorosso.py  (v2)
-------------------------------
Genera la sezione "Cuore Biancorosso": una raccolta che cresce nel tempo,
divisa in un capitolo per ogni partita.

PER AGGIUNGERE UNA PARTITA
  1. aggiungi un blocco alla lista PARTITE qui sotto;
  2. metti le foto in  images/cuore-biancorosso/<slug>-1.jpg, -2.jpg, ...
     piu' <slug>-cover.jpg;
  3. rilancia:  python3 crea-cuore-biancorosso.py --progetto . --uscita ./nuovo

USO:
    python3 crea-cuore-biancorosso.py --progetto . --uscita ./nuovo
"""

import argparse
import re
from pathlib import Path

# ======================================================================
# LA RACCOLTA — modifica solo questa parte
# ======================================================================

SLUG = "cuore-biancorosso"
TITOLO = "CUORE BIANCOROSSO"
CATEGORIA = "STAGIONE BIANCOROSSA"
TAG_CARD = "SSC BARI"
CARTELLA_FOTO = "images/cuore-biancorosso"   # sottocartella dedicata

# Copertina della raccolta: se lasci "", usa la cover della prima partita.
COVER = ""

INTRO = (
    "Un racconto che non finisce con il fischio finale. "
    "Cuore Biancorosso &egrave; il diario fotografico di una stagione seguita "
    "dal bordo campo e dagli spalti, partita dopo partita: le prime volte, "
    "i derby, le serate storte e quelle che restano. "
    "Ogni capitolo &egrave; una giornata a s&eacute;, e la raccolta cresce "
    "man mano che il calendario va avanti."
)

# --- ordine dei capitoli = ordine di questa lista ---
PARTITE = [
    {
        "slug": "bari-cavese",
        "titolo": "BARI &mdash; CAVESE",
        "etichetta": "La prima in casa",
        "nota": (
            "Il primo San Nicola della stagione. Le curve che si riempiono "
            "prima del fischio d&rsquo;inizio, le sciarpe alzate sull&rsquo;inno, "
            "l&rsquo;attesa di capire che squadra sar&agrave;. Ho fotografato "
            "soprattutto quello che succedeva intorno al campo."
        ),
        "foto": 18,
    },
    {
        "slug": "altamura-bari",
        "titolo": "ALTAMURA &mdash; BARI",
        "etichetta": "Derby di Puglia",
        "nota": (
            "Fuori casa, su un campo piccolo e sotto i riflettori, con la curva "
            "ospite attaccata al rettangolo di gioco. Novanta minuti di corse, "
            "duelli e stacchi di testa, fino al gol che sblocca la serata e alla "
            "squadra sotto il settore a fine partita."
        ),
        "foto": 30,
    },
]

FATTI = [
    ("Squadra", "SSC Bari"),
    ("Formato", "Diario di stagione"),
    ("Servizi", "Fotografia sportiva"),
    ("Stato", "In aggiornamento"),
]

PROGETTO_SUCCESSIVO = ("matchday-stories.html", "T&rsquo;IMMAGINI")


# ======================================================================
# CSS aggiuntivo per i capitoli
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

    .project-page .collection-end {
      padding: 10px 0 70px;
    }

    .project-page .collection-end p {
      max-width: 60ch;
      opacity: .6;
      font-size: 15px;
    }
"""


# ======================================================================
# COSTRUZIONE
# ======================================================================

def blocco_galleria(partita: dict) -> str:
    pezzi = []
    titolo_pulito = partita["titolo"]
    for i in range(1, partita["foto"] + 1):
        pezzi.append(f"""            <button
              class="gallery-item"
              type="button"
              aria-label="Apri immagine {i}">

              <img
                src="../{CARTELLA_FOTO}/{partita['slug']}-{i}.jpg"
                alt="{titolo_pulito} &mdash; immagine {i}"
                loading="lazy"
                decoding="async">

            </button>
""")
    return "\n".join(pezzi)


def blocco_capitolo(partita: dict, numero: int) -> str:
    return f"""
    <!-- CAPITOLO {numero:02d} — {partita['slug']} -->
    <section class="gallery-section match-chapter" id="{partita['slug']}">

      <div class="container">

        <div class="eyebrow red reveal">
          {numero:02d} &mdash; {partita['etichetta']}
        </div>

        <h2 class="gallery-title reveal">
          {partita['titolo']}
        </h2>

        <p class="match-note reveal">
          {partita['nota']}
        </p>

        <div class="gallery-grid">

{blocco_galleria(partita)}
        </div>

      </div>

    </section>
"""


def blocco_nav() -> str:
    voci = []
    for i, p in enumerate(PARTITE, start=1):
        voci.append(f"""            <li>
              <a href="#{p['slug']}">
                <span class="n">{i:02d}</span>
                {p['titolo']}
              </a>
            </li>
""")
    return f"""
    <!-- INDICE DEI CAPITOLI -->
    <section class="gallery-section" style="padding-bottom:0">

      <div class="container">

        <div class="eyebrow red reveal">
          {len(PARTITE)} partite raccontate
        </div>

        <h2 class="gallery-title reveal">
          I CAPITOLI
        </h2>

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

        <p>
          La raccolta &egrave; aperta: ogni nuova partita seguita diventa
          un capitolo in fondo a questa pagina.
        </p>

      </div>

    </section>
"""


def blocco_fatti() -> str:
    return "\n".join(
        f"""          <div class="fact">
            <small>{etichetta}</small>
            <strong>{valore}</strong>
          </div>
"""
        for etichetta, valore in FATTI
    )


def crea_pagina(template: Path) -> str:
    html = template.read_text(encoding="utf-8")
    cover = COVER or f"{CARTELLA_FOTO}/{PARTITE[0]['slug']}-cover.jpg"

    # --- head ---
    html = html.replace(
        'content="Kings League — progetto fotografico e video di Gianluca Paglionico."',
        'content="Cuore Biancorosso — diario fotografico di una stagione biancorossa, '
        'di Gianluca Paglionico."')
    html = html.replace("<title>Kings League — GPJ</title>",
                        "<title>Cuore Biancorosso — GPJ</title>")
    html = html.replace("  </style>\n</head>", CSS_CAPITOLI + "  </style>\n</head>")

    # --- hero ---
    html = html.replace(
        'src="../images/athlete-portraits-cover.svg"\n        alt="Kings League — Alpak FC"',
        f'src="../{cover}"\n        alt="Cuore Biancorosso"')
    html = re.sub(r'<div class="eyebrow project-category">\s*SCATTI DA RE\s*</div>',
                  f'<div class="eyebrow project-category">\n          {CATEGORIA}\n        </div>',
                  html)
    html = html.replace("<h1>KINGS LEAGUE</h1>", f"<h1>{TITOLO}</h1>")

    # --- intro + fatti ---
    html = re.sub(r'<p class="project-intro">.*?</p>',
                  f'<p class="project-intro">\n            {INTRO}\n          </p>',
                  html, flags=re.DOTALL)
    html = re.sub(r'(<div class="project-facts reveal">).*?(</div>\s*</div>\s*</section>)',
                  lambda m: m.group(1) + "\n\n" + blocco_fatti() + "\n        " + m.group(2),
                  html, count=1, flags=re.DOTALL)

    # --- sostituisce galleria singola + sezione video con indice e capitoli ---
    capitoli = blocco_nav()
    for i, partita in enumerate(PARTITE, start=1):
        capitoli += blocco_capitolo(partita, i)
    capitoli += blocco_chiusura()

    html = re.sub(r'\s*<!-- GALLERIA -->.*?(?=<!-- PROGETTO SUCCESSIVO -->)',
                  "\n" + capitoli + "\n\n    ",
                  html, flags=re.DOTALL)

    # --- progetto successivo ---
    href, etichetta = PROGETTO_SUCCESSIVO
    html = html.replace('<a href="live-atmosphere.html">\n\n          <h2>WIN OR GO HOME</h2>',
                        f'<a href="{href}">\n\n          <h2>{etichetta}</h2>')

    return html


def card_homepage() -> str:
    cover = COVER or f"{CARTELLA_FOTO}/{PARTITE[0]['slug']}-cover.jpg"
    return f"""
      <!-- PROGETTO — CUORE BIANCOROSSO (raccolta in aggiornamento) -->

      <a
        class="project wide reveal"
        data-category="sport"
        href="projects/{SLUG}.html"
      >

        <div class="project-media">

          <img
            src="{cover}"
            alt="Cuore Biancorosso"
            loading="lazy"
            decoding="async"
          >

        </div>

        <div class="project-bottom">

          <div>

            <div class="project-tag">

              {TAG_CARD} &middot; {len(PARTITE)} PARTITE

            </div>

            <h3>

              {TITOLO}

            </h3>

          </div>

          <div class="project-arrow">

            ↗

          </div>

        </div>

      </a>

"""


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--progetto", default=".")
    p.add_argument("--template", default="athlete-portraits.html")
    p.add_argument("--uscita", default="./nuovo")
    a = p.parse_args()

    progetto = Path(a.progetto)
    uscita = Path(a.uscita)
    (uscita / "projects").mkdir(parents=True, exist_ok=True)
    (uscita / CARTELLA_FOTO).mkdir(parents=True, exist_ok=True)

    template = progetto / a.template
    if not template.exists():
        template = progetto / "projects" / a.template

    pagina = crea_pagina(template)
    destinazione = uscita / "projects" / f"{SLUG}.html"
    destinazione.write_text(pagina, encoding="utf-8")

    totale = sum(x["foto"] for x in PARTITE)
    print(f"Creata: {destinazione}  ({len(pagina)/1024:.0f} KB)")
    for i, x in enumerate(PARTITE, start=1):
        print(f"  capitolo {i:02d}  {x['slug']:<18} {x['foto']:>2} slot foto")
    print(f"  totale slot: {totale}")

    index = (progetto / "index.html").read_text(encoding="utf-8")
    index = re.sub(r'\s*<!-- PROGETTO — CUORE BIANCOROSSO.*?</a>\n', "\n",
                   index, flags=re.DOTALL)
    index = index.replace('<div class="projects">',
                          '<div class="projects">\n' + card_homepage(), 1)
    (uscita / "index.html").write_text(index, encoding="utf-8")
    print("Card aggiornata nella homepage.")

    # promemoria dei nomi file attesi
    attesi = uscita / CARTELLA_FOTO / "NOMI-FILE.txt"
    righe = [f"{PARTITE[0]['slug']}-cover.jpg   <- copertina della raccolta", ""]
    for x in PARTITE:
        righe.append(f"# {x['titolo'].replace('&mdash;', '-')} — {x['etichetta']}")
        righe += [f"{x['slug']}-{i}.jpg" for i in range(1, x["foto"] + 1)]
        righe.append("")
    attesi.write_text("\n".join(righe), encoding="utf-8")
    print(f"Elenco nomi file attesi: {attesi}")


if __name__ == "__main__":
    main()
