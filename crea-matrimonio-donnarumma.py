#!/usr/bin/env python3
"""
crea-matrimonio-donnarumma.py
-----------------------------
Genera la sezione "Oltre la transenna": il servizio da paparazzo
al matrimonio di Gianluigi Donnarumma e Alessia Elefante.

Oltre alla galleria aggiunge un blocco "Come e' stata fatta" che
racconta il metodo di lavoro in condizioni scomode.

USO:
    python3 crea-matrimonio-donnarumma.py --progetto . --uscita ./nuovo
"""

import argparse
import re
from pathlib import Path

# ======================================================================
# CONFIGURAZIONE
# ======================================================================

SLUG = "matrimonio-donnarumma"
CARTELLA_FOTO = "images/matrimonio-donnarumma"
N_FOTO = 10

TITOLO = "OLTRE LA TRANSENNA"
CATEGORIA = "PAPARAZZO"
TAG_CARD = "DONNARUMMA &mdash; ELEFANTE"
FILTRO = "eventi"
ETICHETTA_FILTRO = "Eventi"

INTRO = (
    "Un matrimonio blindato, raccontato da fuori. Nessun accredito, nessun "
    "accesso, nessuna possibilit&agrave; di scegliere dove mettersi: solo una "
    "transenna, una folla che cresce e una finestra di pochi minuti in cui "
    "passano gli invitati e poi gli sposi. "
    "Queste dieci immagini sono quello che &egrave; rimasto di quei minuti."
)

FATTI = [
    ("Tipo", "Paparazzo"),
    ("Soggetti", "Sposi e invitati"),
    ("Condizioni", "Transenne e folla"),
    ("Output", "Reportage"),
]

TITOLO_GALLERIA = "QUELLO CHE &Egrave; PASSATO DAVANTI"

# --- il blocco sul metodo ---
TITOLO_METODO = "COME &Egrave; STATA FATTA"
METODO = [
    (
        "Il posto non lo scegli, te lo prendi",
        "Dietro una transenna non esiste l&rsquo;inquadratura giusta: esiste "
        "l&rsquo;unica inquadratura possibile da dove sei riuscito ad "
        "arrivare. Il lavoro vero comincia prima dello scatto, quando decidi "
        "dove piazzarti e non ti muovi pi&ugrave; per ore. Un metro di "
        "differenza cambia tutto: un metro pi&ugrave; in l&agrave; e davanti "
        "hai una testa, un metro pi&ugrave; in alto e hai il muro di fiori "
        "pulito dietro al soggetto."
    ),
    (
        "Guadagnare centimetri di altezza",
        "Quasi tutte queste foto guardano leggermente dall&rsquo;alto verso il "
        "basso. Non &egrave; una scelta estetica: &egrave; l&rsquo;unico modo "
        "di scavalcare le teste di chi sta davanti. Salire di venti centimetri "
        "su qualsiasi cosa regga, tenere la fotocamera alta e comporre "
        "guardando lo schermo invece del mirino. Si perde precisione, si "
        "guadagna la linea di vista."
    ),
    (
        "Il fondale te lo regala l&rsquo;evento",
        "La parete di rose bianche allestita all&rsquo;ingresso &egrave; "
        "diventata lo sfondo di met&agrave; del servizio. Quando non puoi "
        "controllare n&eacute; luce n&eacute; posizione, l&rsquo;unica leva "
        "che resta &egrave; aspettare che il soggetto entri nel punto dove il "
        "fondo &egrave; gi&agrave; pulito. Teleobiettivo aperto, sfondo "
        "compresso, e quello che era un allestimento per gli invitati diventa "
        "un fondale da studio."
    ),
    (
        "Si scatta a raffica e si sceglie dopo",
        "Le persone camminano, si girano, vengono coperte. Non c&rsquo;&egrave; "
        "modo di far ripetere niente a nessuno. Si tengono tempi alti, si "
        "scatta ogni volta che si apre un varco tra due teste, e si accetta "
        "che su cento fotogrammi ne reggano dieci. Il lavoro di selezione pesa "
        "quanto quello sul campo."
    ),
]

CHIUSURA = (
    "Da una posizione che non avevo scelto, con soggetti che non potevo dirigere "
    "e una luce che stava calando, il margine di manovra era quasi zero. "
    "&Egrave; esattamente il tipo di situazione in cui si capisce quanto conta "
    "arrivare preparati: quando non puoi cambiare le condizioni, l&rsquo;unica "
    "cosa che puoi ancora fare &egrave; essere nel punto giusto un attimo prima "
    "degli altri."
)

PROGETTO_SUCCESSIVO = ("cuore-biancorosso.html", "CUORE BIANCOROSSO")


# ======================================================================
# CSS aggiuntivo
# ======================================================================

CSS_METODO = """

    /* ==============================
       BLOCCO SUL METODO DI LAVORO
    ============================== */

    .project-page .method {
      padding: 10px 0 70px;
    }

    .project-page .method-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 34px 46px;
      margin-top: 34px;
    }

    .project-page .method-item h3 {
      font-family: Manrope, sans-serif;
      font-size: 19px;
      letter-spacing: -.03em;
      margin: 0 0 10px;
    }

    .project-page .method-item h3:before {
      content: attr(data-n);
      display: block;
      font-family: Inter, sans-serif;
      font-size: 11px;
      letter-spacing: .18em;
      font-weight: 800;
      color: var(--red, #e10600);
      margin-bottom: 9px;
    }

    .project-page .method-item p {
      margin: 0;
      opacity: .74;
      line-height: 1.68;
      font-size: 15px;
    }

    .project-page .method-close {
      max-width: 68ch;
      margin: 44px 0 0;
      padding-left: 20px;
      border-left: 3px solid var(--red, #e10600);
      font-size: 16px;
      line-height: 1.7;
      opacity: .9;
    }

    @media (max-width: 760px) {
      .project-page .method-grid {
        grid-template-columns: 1fr;
        gap: 28px;
      }
    }
"""


# ======================================================================
# COSTRUZIONE
# ======================================================================

def blocco_galleria() -> str:
    pezzi = []
    for i in range(1, N_FOTO + 1):
        pezzi.append(f"""          <button
            class="gallery-item"
            type="button"
            aria-label="Apri immagine {i}">

            <img
              src="../{CARTELLA_FOTO}/{SLUG}-{i}.jpg"
              alt="Matrimonio Donnarumma &mdash; immagine {i}"
              loading="lazy"
              decoding="async">

          </button>
""")
    return "\n".join(pezzi)


def blocco_fatti() -> str:
    return "\n".join(
        f"""          <div class="fact">
            <small>{e}</small>
            <strong>{v}</strong>
          </div>
""" for e, v in FATTI)


def blocco_metodo() -> str:
    voci = "\n".join(
        f"""          <div class="method-item reveal">

            <h3 data-n="{i:02d}">
              {titolo}
            </h3>

            <p>
              {testo}
            </p>

          </div>
""" for i, (titolo, testo) in enumerate(METODO, start=1))

    return f"""
    <!-- COME E' STATA FATTA -->
    <section class="method">

      <div class="container">

        <div class="eyebrow red reveal">
          Dietro le quinte
        </div>

        <h2 class="gallery-title reveal">
          {TITOLO_METODO}
        </h2>

        <div class="method-grid">

{voci}
        </div>

        <p class="method-close reveal">
          {CHIUSURA}
        </p>

      </div>

    </section>
"""


def crea_pagina(template: Path) -> str:
    html = template.read_text(encoding="utf-8")

    # --- head ---
    html = html.replace(
        'content="Kings League — progetto fotografico e video di Gianluca Paglionico."',
        'content="Oltre la transenna — servizio fotografico da paparazzo al matrimonio '
        'Donnarumma-Elefante, di Gianluca Paglionico."')
    html = html.replace("<title>Kings League — GPJ</title>",
                        "<title>Oltre la transenna — GPJ</title>")
    html = html.replace("  </style>\n</head>", CSS_METODO + "  </style>\n</head>")

    # --- hero ---
    html = html.replace(
        'src="../images/athlete-portraits-cover.svg"\n        alt="Kings League — Alpak FC"',
        f'src="../{CARTELLA_FOTO}/{SLUG}-cover.jpg"\n        alt="Oltre la transenna"')
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

    # --- titolo galleria + galleria ---
    html = re.sub(r'<h2 class="gallery-title reveal">.*?</h2>',
                  f'<h2 class="gallery-title reveal">\n          {TITOLO_GALLERIA}\n        </h2>',
                  html, count=1, flags=re.DOTALL)
    html = re.sub(r'(<div class="gallery-grid">).*?(</div>\s*</div>\s*</section>)',
                  lambda m: m.group(1) + "\n\n" + blocco_galleria() + "\n        " + m.group(2),
                  html, count=1, flags=re.DOTALL)

    # --- via il video, dentro il blocco sul metodo ---
    html = re.sub(r'\s*<!-- VIDEO -->.*?(?=<!-- PROGETTO SUCCESSIVO -->)',
                  "\n" + blocco_metodo() + "\n\n    ", html, flags=re.DOTALL)
    if "method-grid" not in html:      # il template non aveva la sezione video
        html = html.replace('    <!-- PROGETTO SUCCESSIVO -->',
                            blocco_metodo() + "\n\n    <!-- PROGETTO SUCCESSIVO -->')")

    # --- progetto successivo ---
    href, etichetta = PROGETTO_SUCCESSIVO
    html = html.replace('<a href="live-atmosphere.html">\n\n          <h2>WIN OR GO HOME</h2>',
                        f'<a href="{href}">\n\n          <h2>{etichetta}</h2>')

    # --- logo e favicon gia' corretti nel sito ---
    html = html.replace('../images/GPJ pos.png', '../images/favicon.png')
    html = html.replace('../images/GPJ neg.png', '../images/gpj-mark.png')
    html = re.sub(r'<img(?![^>]*loading=)(?![^>]*gpj-mark)',
                  '<img loading="lazy" decoding="async"', html)
    return html


def card_homepage() -> str:
    return f"""
      <!-- PROGETTO — MATRIMONIO DONNARUMMA -->

      <a
        class="project reveal"
        data-category="{FILTRO}"
        href="projects/{SLUG}.html"
      >

        <div class="project-media">

          <img
            src="{CARTELLA_FOTO}/{SLUG}-cover.jpg"
            alt="Oltre la transenna"
            loading="lazy"
            decoding="async"
          >

        </div>

        <div class="project-bottom">

          <div>

            <div class="project-tag">

              {TAG_CARD}

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


def bottone_filtro() -> str:
    return f"""      <button
        class="filter"
        type="button"
        data-filter="{FILTRO}"
      >

        {ETICHETTA_FILTRO}

      </button>


"""


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--progetto", default=".")
    p.add_argument("--template", default="projects/athlete-portraits.html")
    p.add_argument("--uscita", default="./nuovo")
    a = p.parse_args()

    progetto, uscita = Path(a.progetto), Path(a.uscita)
    (uscita / "projects").mkdir(parents=True, exist_ok=True)

    template = progetto / a.template
    if not template.exists():
        template = progetto / "athlete-portraits.html"

    pagina = crea_pagina(template)
    (uscita / "projects" / f"{SLUG}.html").write_text(pagina, encoding="utf-8")
    print(f"Creata: projects/{SLUG}.html  ({len(pagina)/1024:.0f} KB, {N_FOTO} foto)")

    # homepage: card + nuovo filtro
    index = (progetto / "index.html").read_text(encoding="utf-8")
    if SLUG not in index:
        index = index.replace('<div class="projects">',
                              '<div class="projects">\n' + card_homepage(), 1)
        print("Card aggiunta alla homepage.")
    if f'data-filter="{FILTRO}"' not in index:
        chiusura_filtri = re.search(r'(\s*</button>\s*\n\s*</div>)', index[index.find('data-filter="drone"'):])
        ancora = '        Drone Works\n\n      </button>\n'
        index = index.replace(ancora, ancora + "\n\n" + bottone_filtro(), 1)
        print(f'Filtro "{ETICHETTA_FILTRO}" aggiunto.')
    (uscita / "index.html").write_text(index, encoding="utf-8")

    attesi = uscita / CARTELLA_FOTO
    attesi.mkdir(parents=True, exist_ok=True)
    righe = [f"{SLUG}-cover.jpg   <- copertina"] + \
            [f"{SLUG}-{i}.jpg" for i in range(1, N_FOTO + 1)]
    (attesi / "NOMI-FILE.txt").write_text("\n".join(righe), encoding="utf-8")


if __name__ == "__main__":
    main()
