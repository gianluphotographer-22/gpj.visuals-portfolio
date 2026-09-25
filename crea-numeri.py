#!/usr/bin/env python3
"""
crea-numeri.py
--------------
Genera numeri.html: la pagina "In numeri", costruita sui dati veri
degli Insight di Instagram (screenshot del 16 settembre 2026).

Per aggiornarla in futuro con un nuovo screenshot Insight, basta
cambiare i valori qui sotto in DATI e rilanciare lo script.

USO:
    python3 crea-numeri.py --progetto . --uscita ./nuovo
"""

import argparse
from pathlib import Path

# ======================================================================
# I DATI — presi dagli Insight di Instagram, aggiorna qui
# ======================================================================

PERIODO_PRINCIPALE = "Ultimi 90 giorni"
AGGIORNATO_AL = "15 settembre 2026"

GRANDI_NUMERI = [
    ("Visualizzazioni", "3.080.297", "90 giorni"),
    ("Account raggiunti", "330.026", "90 giorni"),
    ("Follower netti", "+591", "90 giorni"),
    ("Visite al profilo", "13.485", "90 giorni"),
]

RIPARTIZIONE_VISUALIZZAZIONI = [
    ("Reel", "1,7 mln"),
    ("Storie", "923.613"),
    ("Post", "422.073"),
]

RIPARTIZIONE_INTERAZIONI = [
    ("Reel", "40.242"),
    ("Post", "10.377"),
    ("Storie", "1.720"),
]

TOP_CONTENUTI = [
    ("Erling Haaland in Puglia", "2,9 mln", "visualizzazioni"),
    ("Locorotondo si prepara al matrimonio di Donnarumma", "1,6 mln", "visualizzazioni"),
    ("L&rsquo;arrivo di Donnarumma", "1,1 mln", "visualizzazioni"),
    ("Haaland tra gli invitati", "292.535", "visualizzazioni"),
]

FOLLOWER_TOTALI = "1.539"
FOLLOWER_CRESCITA = "+19,2%"
FOLLOWER_PERIODO = "dal 16 agosto 2026"

TOP_PER_NUOVI_FOLLOWER = [
    ("Dietro le quinte con i tifosi", "+195 follower"),
    ("Ritratto giocatore, SSC Bari", "+20 follower"),
    ("A bordo campo con la fotocamera", "+14 follower"),
]

INTRO = (
    "Questi sono i numeri, non le opinioni. Nei tre mesi in cui ho seguito e "
    "pubblicato il reportage sul matrimonio di Gianluigi Donnarumma &mdash; il "
    "progetto <em>Oltre la transenna</em> &mdash; i contenuti hanno superato i "
    "3 milioni di visualizzazioni, raggiungendo persone che non mi seguivano "
    "ancora nel 93% dei casi. Non e&rsquo; virale per caso: e&rsquo; il lavoro "
    "fatto dietro una transenna che ha trovato chi lo cercava."
)

CHIUSURA = (
    "Il video con piu&rsquo; visualizzazioni in assoluto, quello su Erling "
    "Haaland in Puglia, e la foto dell&rsquo;arrivo di Donnarumma vengono "
    "entrambi dalla stessa giornata: la stessa raccontata, scatto per scatto, "
    "nel progetto qui sotto."
)

COVER = "images/matrimonio-donnarumma/matrimonio-donnarumma-4.jpg"
COVER_ALT = "Erling Haaland in Puglia"


# ======================================================================
# CSS aggiuntivo
# ======================================================================

CSS = """
    .numbers-page .page-hero { min-height: clamp(360px, 58svh, 680px); }

    .numbers-page .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 30px;
      margin-top: 40px;
    }

    .numbers-page .stat small {
      display: block;
      color: var(--muted);
      font-size: 11px;
      letter-spacing: .12em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .numbers-page .stat strong {
      display: block;
      font-family: Manrope, sans-serif;
      font-size: clamp(30px, 3.4vw, 46px);
      letter-spacing: -.04em;
      line-height: 1;
    }

    .numbers-page .stat span {
      display: block;
      margin-top: 8px;
      color: var(--muted);
      font-size: 11px;
    }

    .numbers-page .split-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      margin-top: 10px;
    }

    .numbers-page .split-grid h3 {
      font-family: Manrope, sans-serif;
      font-size: 15px;
      letter-spacing: -.02em;
      margin: 0 0 18px;
    }

    .numbers-page .bar-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(0, 0, 0, .08);
      font-size: 14px;
    }

    .numbers-page .bar-row strong { font-weight: 700; }

    .numbers-page .top-list {
      margin-top: 34px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .numbers-page .top-item {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 20px;
      padding: 20px 0;
      border-bottom: 1px solid rgba(0, 0, 0, .1);
    }

    .numbers-page .top-item .n {
      font-family: Inter, sans-serif;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .1em;
      color: var(--red, #e10600);
      margin-right: 14px;
    }

    .numbers-page .top-item .titolo {
      font-size: 16px;
      line-height: 1.4;
    }

    .numbers-page .top-item .valore {
      flex: 0 0 auto;
      text-align: right;
      font-family: Manrope, sans-serif;
      font-size: 20px;
      font-weight: 700;
      white-space: nowrap;
    }

    .numbers-page .top-item .valore small {
      display: block;
      font-family: Inter, sans-serif;
      font-weight: 400;
      font-size: 10px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-top: 2px;
    }

    .numbers-page .followers-band {
      background: var(--red);
      color: #fff;
      padding: 90px 0;
    }

    .numbers-page .followers-band .eyebrow.red { color: rgba(255,255,255,.75); }

    .numbers-page .followers-big {
      font-family: Manrope, sans-serif;
      font-size: clamp(56px, 9vw, 120px);
      letter-spacing: -.05em;
      line-height: .95;
      margin: 10px 0 6px;
    }

    .numbers-page .followers-band .growth {
      font-size: 18px;
      opacity: .9;
    }

    .numbers-page .followers-list {
      margin-top: 40px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }

    .numbers-page .followers-list .fitem {
      border: 1px solid rgba(255,255,255,.3);
      border-radius: var(--radius, 18px);
      padding: 18px 20px;
    }

    .numbers-page .followers-list .fitem strong {
      display: block;
      font-family: Manrope, sans-serif;
      font-size: 22px;
      margin-top: 6px;
    }

    .numbers-page .cta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 50px;
      padding-top: 40px;
      border-top: 1px solid rgba(0,0,0,.1);
    }

    .numbers-page .cta-row p {
      max-width: 60ch;
      color: var(--muted);
      font-size: 15px;
      line-height: 1.7;
      margin: 0;
    }

    @media (max-width: 900px) {
      .numbers-page .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .numbers-page .split-grid { grid-template-columns: 1fr; gap: 34px; }
      .numbers-page .followers-list { grid-template-columns: 1fr; }
    }
"""


def blocco_grandi_numeri() -> str:
    pezzi = []
    for etichetta, valore, periodo in GRANDI_NUMERI:
        pezzi.append(f"""          <div class="stat reveal">
            <small>{etichetta}</small>
            <strong>{valore}</strong>
            <span>{periodo}</span>
          </div>
""")
    return "\n".join(pezzi)


def blocco_barre(voci) -> str:
    return "\n".join(
        f'          <div class="bar-row"><span>{et}</span><strong>{val}</strong></div>'
        for et, val in voci)


def blocco_top() -> str:
    pezzi = []
    for i, (titolo, valore, etichetta) in enumerate(TOP_CONTENUTI, start=1):
        pezzi.append(f"""          <div class="top-item reveal">
            <div class="titolo"><span class="n">{i:02d}</span>{titolo}</div>
            <div class="valore">{valore}<small>{etichetta}</small></div>
          </div>
""")
    return "\n".join(pezzi)


def blocco_follower_top() -> str:
    pezzi = []
    for titolo, valore in TOP_PER_NUOVI_FOLLOWER:
        pezzi.append(f"""          <div class="fitem">
            {titolo}
            <strong>{valore}</strong>
          </div>
""")
    return "\n".join(pezzi)


PAGINA = f"""<!doctype html>
<html lang="it">

<head>
  <meta charset="utf-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover">

  <meta name="theme-color" content="#e10600">

  <meta
    name="description"
    content="I numeri di Instagram di Gianluca Paglionico: risultati reali del reportage sul matrimonio Donnarumma-Elefante.">

  <title>In numeri — GPJ</title>

  <link rel="icon" type="image/png" href="images/favicon.png">
  <link rel="apple-touch-icon" href="images/favicon.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap"
    rel="stylesheet">

  <link rel="stylesheet" href="assets/css/style.css">

  <style>
{CSS}
  </style>
</head>

<body class="project-page numbers-page">

  <!-- HEADER -->
  <header class="site-header">

    <a class="brand" href="index.html">
      <span class="brand-mark">
        <img decoding="async" src="images/gpj-mark.png" alt="" width="64" height="64">
      </span>
      <span class="brand-name">GPJ.VISUALS</span>
    </a>

    <nav class="nav" aria-label="Navigazione principale">
      <a href="index.html#work">Portfolio</a>
      <a href="index.html#about">Chi sono</a>
      <a href="index.html#reviews">Recensioni</a>
      <a href="numeri.html">Numeri</a>
      <a href="index.html#contact">Contatti</a>
    </nav>

    <a class="header-contact" href="index.html#contact">
      Parliamone
    </a>

    <button class="menu-btn" type="button" aria-label="Apri menu" aria-expanded="false">☰</button>

  </header>


  <main>

    <!-- HERO -->
    <section class="page-hero">

      <img loading="lazy" decoding="async"
        src="{COVER}"
        alt="{COVER_ALT}"
        fetchpriority="high">

      <div class="container page-hero-content reveal">
        <div class="eyebrow project-category">
          INSTAGRAM &middot; {AGGIORNATO_AL.upper()}
        </div>

        <h1>IN NUMERI</h1>
      </div>

    </section>


    <!-- INTRO + GRANDI NUMERI -->
    <section class="project-info">

      <div class="container">

        <p class="project-intro reveal" style="max-width:70ch">
          {INTRO}
        </p>

        <div class="stat-grid">

{blocco_grandi_numeri()}
        </div>

      </div>

    </section>


    <!-- RIPARTIZIONE -->
    <section class="gallery-section">

      <div class="container">

        <div class="eyebrow red reveal">
          {PERIODO_PRINCIPALE}
        </div>

        <h2 class="gallery-title reveal">
          COME SI DIVIDONO I NUMERI
        </h2>

        <div class="split-grid">

          <div class="reveal">
            <h3>Visualizzazioni per formato</h3>
{blocco_barre(RIPARTIZIONE_VISUALIZZAZIONI)}
          </div>

          <div class="reveal">
            <h3>Interazioni per formato</h3>
{blocco_barre(RIPARTIZIONE_INTERAZIONI)}
          </div>

        </div>

        <div class="eyebrow red reveal" style="margin-top:60px">
          Contenuti piu&rsquo; visti
        </div>

        <h2 class="gallery-title reveal">
          COSA HA FUNZIONATO
        </h2>

        <div class="top-list">

{blocco_top()}
        </div>

        <div class="cta-row reveal">
          <p>{CHIUSURA}</p>
          <a class="btn btn-red" href="projects/matrimonio-donnarumma.html">
            Vedi il progetto &rarr;
          </a>
        </div>

      </div>

    </section>


    <!-- FOLLOWER -->
    <section class="followers-band">

      <div class="container">

        <div class="eyebrow red reveal">
          Pubblico &middot; ultimi 30 giorni
        </div>

        <div class="followers-big reveal">{FOLLOWER_TOTALI}</div>
        <div class="growth reveal">{FOLLOWER_CRESCITA} follower {FOLLOWER_PERIODO}</div>

        <div class="followers-list">

{blocco_follower_top()}
        </div>

      </div>

    </section>

  </main>


  <!-- FOOTER -->
  <footer>

    <strong>GPJ.Visuals</strong>

    <span>© 2026 Portfolio</span>

    <a href="#top">Top ↑</a>

  </footer>


  <!-- SCRIPT PRINCIPALE -->
  <script src="assets/js/main.js"></script>

</body>

</html>
"""


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--progetto", default=".")
    p.add_argument("--uscita", default="./nuovo")
    a = p.parse_args()

    uscita = Path(a.uscita)
    uscita.mkdir(parents=True, exist_ok=True)
    (uscita / "numeri.html").write_text(PAGINA, encoding="utf-8")
    print(f"Creata: numeri.html  ({len(PAGINA)/1024:.0f} KB)")


if __name__ == "__main__":
    main()
