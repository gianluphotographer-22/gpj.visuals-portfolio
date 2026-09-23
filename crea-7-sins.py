#!/usr/bin/env python3
"""
crea-7-sins.py
--------------
Sostituisce il progetto segnaposto "Human Detail" (mai riempito con foto
vere) con "7 SINS": il reportage sulla squadra social dei 7 Sins.

Usa lo stesso file e lo stesso indirizzo di prima (projects/human-detail.html)
cosi' i link da altre pagine continuano a funzionare da soli.

USO:
    python3 crea-7-sins.py --progetto . --uscita ./nuovo
"""

import argparse
import re
from pathlib import Path

SLUG_FILE = "human-detail"                 # nome del file, invariato
CARTELLA_FOTO = "images/7-sins"
N_FOTO = 17

TITOLO = "7 SINS"
CATEGORIA = "CONTENT SQUADRA"
FILTRO = "content"
TAG_CARD = "SQUADRA SOCIALE"

INTRO = (
    "Non una partita da raccontare, ma una squadra. I 7 Sins sono un progetto "
    "calcistico nato sui social, e questo reportage segue la loro giornata tipo: "
    "l&rsquo;allenamento, i duelli, gli sfottò tra compagni, il pubblico dietro "
    "la rete che chiede un selfie, l&rsquo;abbraccio dopo il gol. "
    "Meno cronaca di gara, più il clima che si respira attorno a un gruppo."
)

FATTI = [
    ("Soggetto", "7 Sins"),
    ("Formato", "Content squadra"),
    ("Ambito", "Calcio sociale"),
    ("Output", "Reportage foto"),
]

TITOLO_GALLERIA = "DENTRO IL GRUPPO"

PROGETTO_SUCCESSIVO = ("cuore-biancorosso.html", "CUORE BIANCOROSSO")


def blocco_galleria() -> str:
    pezzi = []
    for i in range(1, N_FOTO + 1):
        pezzi.append(f"""          <button
            class="gallery-item"
            type="button"
            aria-label="Apri immagine {i}">

            <img
              src="../{CARTELLA_FOTO}/7-sins-{i}.jpg"
              alt="7 Sins &mdash; immagine {i}"
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


def crea_pagina(template: Path) -> str:
    html = template.read_text(encoding="utf-8")

    html = html.replace(
        'content="Kings League — progetto fotografico e video di Gianluca Paglionico."',
        'content="7 Sins — reportage fotografico sulla squadra social, '
        'di Gianluca Paglionico."')
    html = html.replace("<title>Kings League — GPJ</title>", "<title>7 Sins — GPJ</title>")

    html = html.replace(
        'src="../images/athlete-portraits-cover.jpg"\n        alt="Kings League — Alpak FC"',
        f'src="../{CARTELLA_FOTO}/7-sins-cover.jpg"\n        alt="{TITOLO}"')
    html = re.sub(r'<div class="eyebrow project-category">\s*SCATTI DA RE\s*</div>',
                  f'<div class="eyebrow project-category">\n          {CATEGORIA}\n        </div>',
                  html)
    html = html.replace("<h1>KINGS LEAGUE</h1>", f"<h1>{TITOLO}</h1>")

    html = re.sub(r'<p class="project-intro">.*?</p>',
                  f'<p class="project-intro">\n            {INTRO}\n          </p>',
                  html, flags=re.DOTALL)
    html = re.sub(r'(<div class="project-facts reveal">).*?(</div>\s*</div>\s*</section>)',
                  lambda m: m.group(1) + "\n\n" + blocco_fatti() + "\n        " + m.group(2),
                  html, count=1, flags=re.DOTALL)

    html = re.sub(r'<h2 class="gallery-title reveal">.*?</h2>',
                  f'<h2 class="gallery-title reveal">\n          {TITOLO_GALLERIA}\n        </h2>',
                  html, count=1, flags=re.DOTALL)
    html = re.sub(r'(<div class="gallery-grid">).*?(</div>\s*</div>\s*</section>)',
                  lambda m: m.group(1) + "\n\n" + blocco_galleria() + "\n        " + m.group(2),
                  html, count=1, flags=re.DOTALL)

    # niente sezione video per questo progetto
    html = re.sub(r'\s*<!-- VIDEO -->.*?(?=<!-- PROGETTO SUCCESSIVO -->)', "\n\n    ",
                  html, flags=re.DOTALL)

    href, etichetta = PROGETTO_SUCCESSIVO
    html = html.replace('<a href="live-atmosphere.html">\n\n          <h2>WIN OR GO HOME</h2>',
                        f'<a href="{href}">\n\n          <h2>{etichetta}</h2>')

    html = html.replace('../images/GPJ pos.png', '../images/favicon.png')
    html = html.replace('../images/GPJ neg.png', '../images/gpj-mark.png')
    html = re.sub(r'<img(?![^>]*loading=)(?![^>]*gpj-mark)',
                  '<img loading="lazy" decoding="async"', html)
    return html


def aggiorna_homepage(index: str) -> str:
    # sostituisce la card esistente di Human Detail sul posto, senza aggiungerne una nuova
    index = re.sub(r'data-category="portrait"(\s*\n\s*href="projects/human-detail\.html")',
                   f'data-category="{FILTRO}"\\1', index)
    index = index.replace('src="images/human-detail-cover.svg"',
                          f'src="{CARTELLA_FOTO}/7-sins-cover.jpg"')
    index = index.replace('alt="Human Detail"', f'alt="{TITOLO}"')
    index = index.replace("EDITORIAL PORTRAIT", TAG_CARD)
    index = re.sub(r'(href="projects/human-detail\.html"[\s\S]*?<h3>\s*)Human Detail(\s*</h3>)',
                   rf'\g<1>{TITOLO}\g<2>', index)
    return index


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--progetto", default=".")
    p.add_argument("--template", default="projects/athlete-portraits.html")
    p.add_argument("--uscita", default="./nuovo")
    a = p.parse_args()

    progetto, uscita = Path(a.progetto), Path(a.uscita)
    (uscita / "projects").mkdir(parents=True, exist_ok=True)

    template = progetto / a.template
    pagina = crea_pagina(template)
    (uscita / "projects" / f"{SLUG_FILE}.html").write_text(pagina, encoding="utf-8")
    print(f"Sostituita: projects/{SLUG_FILE}.html  ({len(pagina)/1024:.0f} KB, {N_FOTO} foto)")

    index = (progetto / "index.html").read_text(encoding="utf-8")
    index = aggiorna_homepage(index)
    (uscita / "index.html").write_text(index, encoding="utf-8")
    print("Card in homepage aggiornata sul posto (nessuna card duplicata).")

    # le pagine "progetto successivo" che puntavano a Human Detail
    for altra in ("projects/intensity.html", "projects/drone-works.html"):
        f = progetto / altra
        if f.exists():
            t = f.read_text(encoding="utf-8")
            n = t.replace('<a href="human-detail.html">\n\n          <h2>Human Detail</h2>',
                          f'<a href="human-detail.html">\n\n          <h2>{TITOLO}</h2>')
            n = n.replace('<a href="human-detail.html">\n   <h2>Human Detail</h2>',
                          f'<a href="human-detail.html">\n   <h2>{TITOLO}</h2>')
            if n != t:
                (uscita / altra).parent.mkdir(parents=True, exist_ok=True)
                (uscita / altra).write_text(n, encoding="utf-8")
                print(f"Etichetta aggiornata in {altra}")


if __name__ == "__main__":
    main()
