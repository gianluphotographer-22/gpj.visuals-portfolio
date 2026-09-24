#!/usr/bin/env python3
"""
ottimizza-immagini.py
---------------------
Comprime le foto del portfolio e le inserisce direttamente nel codice HTML.

USO:
    python3 ottimizza-immagini.py --modo inline
    python3 ottimizza-immagini.py --modo lqip     (consigliato)
    python3 ottimizza-immagini.py --modo esterno

MODALITA':
  inline   Ogni foto diventa WebP compresso e viene scritta dentro l'HTML
           come data:image/webp;base64. Nessuna cartella /images necessaria:
           il sito diventa un file solo. Ideale per consegnare/spedire.

  lqip     Dentro l'HTML finisce solo una miniatura sfocata da ~1 KB
           (segnaposto istantaneo). La foto vera resta un file WebP esterno
           caricato in lazy load. HTML leggerissimo + pagina che appare subito.

  esterno  Solo compressione: converte i PNG in WebP dentro /images e
           aggiorna i percorsi nell'HTML. Nessun base64.

Richiede: pip install pillow
"""

import argparse
import base64
import io
import re
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image, ImageFilter
except ImportError:
    sys.exit("Manca Pillow. Installa con:  pip install pillow")


# ----------------------------------------------------------------------
# CONFIGURAZIONE — regola qui qualita' e dimensioni
# ----------------------------------------------------------------------

PROFILI = {
    # ruolo         lato massimo   qualita' WebP
    "cover":        (1400, 72),   # immagini hero / copertina, si vedono grandi
    "gallery":      (1100, 70),   # foto della griglia + lightbox
    "card":         (800,  68),   # anteprime nella homepage
    "logo":         (400,  80),   # loghi, icone
    "default":      (1100, 70),
}

# Miniatura sfocata incorporata (modalita' lqip)
LQIP_LATO = 24
LQIP_QUALITA = 35

ESTENSIONI = (".png", ".PNG", ".jpg", ".jpeg", ".JPG", ".webp")


# ----------------------------------------------------------------------
# UTILITA'
# ----------------------------------------------------------------------

def normalizza(nome: str) -> str:
    """'athlete-portraits-1.svg' -> 'athleteportraits1'"""
    base = Path(nome).stem.lower()
    return re.sub(r"[^a-z0-9]", "", base)


def costruisci_indice(cartella_foto: Path) -> dict:
    """Mappa nome-normalizzato -> percorso del file reale (anche nelle sottocartelle)."""
    indice = {}
    for f in sorted(cartella_foto.rglob("*")):
        if f.is_file() and f.suffix in ESTENSIONI:
            chiave = normalizza(f.name)
            indice.setdefault(chiave, f)
            # tollera i duplicati tipo 'athleteportraits3_1'
            chiave_pulita = re.sub(r"\d+$", "", chiave)
            indice.setdefault(chiave_pulita + "__base", f)
    return indice


def trova_foto(src: str, indice: dict) -> Path | None:
    """Trova la foto corrispondente a un src dell'HTML, con fallback."""
    chiave = normalizza(src)
    if chiave in indice:
        return indice[chiave]
    # fallback 1: 'intensity-4' non esiste -> prova 'intensity-1', '-2', '-3'
    m = re.match(r"^(.*?)(\d+)$", chiave)
    if m:
        radice, numero = m.group(1), int(m.group(2))
        for tentativo in range(numero - 1, 0, -1):
            if f"{radice}{tentativo}" in indice:
                return indice[f"{radice}{tentativo}"]
    # fallback 2: '...cover' non esiste -> usa la prima foto della serie
    radice = chiave.replace("cover", "")
    for n in range(1, 20):
        if f"{radice}{n}" in indice:
            return indice[f"{radice}{n}"]
    return None



def percorso_uscita(src: str) -> str:
    """'../images/cuore-biancorosso/bari-cavese-1.jpg' -> 'cuore-biancorosso/bari-cavese-1.webp'"""
    m = re.search(r"images/(.+)$", src)
    if m:
        return str(Path(m.group(1)).with_suffix("." + FORMATO))
    return normalizza(src) + "." + FORMATO


def ruolo_di(src: str, contesto: str) -> str:
    s = src.lower()
    if "gpj" in s or "logo" in s:
        return "logo"
    if "cover" in s or "hero" in s:
        return "cover" if "page-hero" in contesto or "hero" in s else "card"
    return "gallery"


FORMATO = "webp"


def comprimi(percorso: Path, lato: int, qualita: int) -> bytes:
    im = Image.open(percorso)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        fondo = Image.new("RGB", im.size, (10, 10, 10))
        fondo.paste(im, mask=im.split()[-1])
        im = fondo
    else:
        im = im.convert("RGB")
    im.thumbnail((lato, lato), Image.LANCZOS)
    buf = io.BytesIO()
    if FORMATO == "jpg":
        im.save(buf, "JPEG", quality=qualita + 10, optimize=True, progressive=True)
    else:
        im.save(buf, "WEBP", quality=qualita, method=6)
    return buf.getvalue()


def miniatura_sfocata(percorso: Path) -> bytes:
    im = Image.open(percorso).convert("RGB")
    im.thumbnail((LQIP_LATO, LQIP_LATO), Image.LANCZOS)
    im = im.filter(ImageFilter.GaussianBlur(1))
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=LQIP_QUALITA, method=6)
    return buf.getvalue()


def data_uri(dati: bytes) -> str:
    return "data:image/webp;base64," + base64.b64encode(dati).decode("ascii")


# ----------------------------------------------------------------------
# CSS + JS iniettati in modalita' lqip
# ----------------------------------------------------------------------

BLOCCO_LQIP = """
<style>
/* segnaposto sfocato incorporato nel codice, la foto vera arriva dopo */
img[data-foto]{
  filter:blur(14px);
  transform:scale(1.04);
  transition:filter .5s ease, transform .5s ease;
}
img[data-foto].caricata{
  filter:none;
  transform:none;
}
</style>
<script>
(function(){
  var osserva = new IntersectionObserver(function(voci){
    voci.forEach(function(v){
      if(!v.isIntersecting) return;
      var img = v.target;
      var vera = new Image();
      vera.onload = function(){
        img.src = img.dataset.foto;
        img.classList.add('caricata');
      };
      vera.src = img.dataset.foto;
      osserva.unobserve(img);
    });
  }, {rootMargin:'300px'});
  document.querySelectorAll('img[data-foto]').forEach(function(i){ osserva.observe(i); });
})();
</script>
"""


# ----------------------------------------------------------------------
# ELABORAZIONE
# ----------------------------------------------------------------------

def elabora(progetto: Path, cartella_foto: Path, uscita: Path, modo: str):
    indice = costruisci_indice(cartella_foto)
    uscita.mkdir(parents=True, exist_ok=True)
    cartella_img_out = uscita / "images"
    if modo in ("lqip", "esterno"):
        cartella_img_out.mkdir(exist_ok=True)

    cache_compressa: dict[Path, bytes] = {}
    peso_inline = 0
    peso_esterno = 0
    peso_originale = 0
    visti: set[Path] = set()
    mancanti: list[str] = []

    file_html = sorted(progetto.glob("*.html"))

    for pagina in file_html:
        testo = pagina.read_text(encoding="utf-8", errors="ignore")
        modificato = testo

        for match in re.finditer(r'(src|poster|href)="([^"]*?\.(?:svg|png|jpg|jpeg|webp))"',
                                 testo, re.IGNORECASE):
            attributo, src = match.group(1), match.group(2)
            if src.startswith(("http", "data:")):
                continue
            if attributo == "href" and "icon" not in testo[max(0, match.start() - 120):match.start()]:
                continue

            foto = trova_foto(src, indice)
            if foto is None:
                mancanti.append(f"{pagina.name}: {src}")
                continue

            contesto = testo[max(0, match.start() - 200):match.start()]
            lato, qualita = PROFILI[ruolo_di(src, contesto)]

            chiave_cache = (foto, lato, qualita)
            if chiave_cache not in cache_compressa:
                cache_compressa[chiave_cache] = comprimi(foto, lato, qualita)
            dati = cache_compressa[chiave_cache]

            if foto not in visti:
                visti.add(foto)
                peso_originale += foto.stat().st_size

            if modo == "inline":
                uri = data_uri(dati)
                peso_inline += len(uri)
                modificato = modificato.replace(f'{attributo}="{src}"',
                                                f'{attributo}="{uri}"', 1)

            elif modo == "lqip":
                nome_out = percorso_uscita(src)
                destinazione = cartella_img_out / nome_out
                destinazione.parent.mkdir(parents=True, exist_ok=True)
                if not destinazione.exists():
                    destinazione.write_bytes(dati)
                    peso_esterno += len(dati)
                mini = data_uri(miniatura_sfocata(foto))
                peso_inline += len(mini)
                prefisso = "../" if pagina.name != "index.html" else ""
                sostituzione = (f'{attributo}="{mini}" '
                                f'data-foto="{prefisso}images/{nome_out}"')
                modificato = modificato.replace(f'{attributo}="{src}"', sostituzione, 1)

            else:  # esterno
                nome_out = percorso_uscita(src)
                destinazione = cartella_img_out / nome_out
                destinazione.parent.mkdir(parents=True, exist_ok=True)
                if not destinazione.exists():
                    destinazione.write_bytes(dati)
                    peso_esterno += len(dati)
                prefisso = "../" if pagina.name != "index.html" else ""
                modificato = modificato.replace(f'{attributo}="{src}"',
                                                f'{attributo}="{prefisso}images/{nome_out}"', 1)

        # aggiunge lazy loading a tutte le <img> che ne sono prive
        modificato = re.sub(r'<img(?![^>]*loading=)', '<img loading="lazy" decoding="async"',
                            modificato)

        if modo == "lqip" and "data-foto" in modificato:
            modificato = modificato.replace("</body>", BLOCCO_LQIP + "\n</body>")

        # rispetta la struttura del sito: index in radice, progetti in /projects
        if pagina.name == "index.html":
            destinazione_html = uscita / "index.html"
        else:
            (uscita / "projects").mkdir(exist_ok=True)
            destinazione_html = uscita / "projects" / pagina.name
        destinazione_html.write_text(modificato, encoding="utf-8")

    # copia gli asset non-immagine mantenendo i percorsi originali
    for extra, sotto in (("style.css", "assets/css"),
                         ("main.js", "assets/js"),
                         ("README.txt", "")):
        f = progetto / extra
        if f.exists():
            cartella = uscita / sotto if sotto else uscita
            cartella.mkdir(parents=True, exist_ok=True)
            shutil.copy(f, cartella / extra)

    # ---------------- report ----------------
    print(f"\nModalita': {modo}")
    print(f"Pagine elaborate: {len(file_html)}")
    print(f"Foto usate: {len(visti)}   (originale: {peso_originale/1024/1024:.2f} MB)")
    if peso_inline:
        print(f"Incorporato nell'HTML: {peso_inline/1024/1024:.2f} MB")
    if peso_esterno:
        print(f"Cartella images/ WebP: {peso_esterno/1024/1024:.2f} MB")
    totale = peso_inline + peso_esterno
    if peso_originale:
        print(f"TOTALE: {totale/1024/1024:.2f} MB  "
              f"({100 - totale/peso_originale*100:.0f}% in meno)")
    if mancanti:
        print(f"\nSenza corrispondenza ({len(mancanti)}):")
        for m in mancanti[:10]:
            print("  -", m)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--modo", choices=["inline", "lqip", "esterno"], default="lqip")
    p.add_argument("--progetto", default=".", help="cartella con gli .html")
    p.add_argument("--foto", default=".", help="cartella con i PNG/JPG originali")
    p.add_argument("--formato", choices=["webp", "jpg"], default="webp")
    p.add_argument("--uscita", default="./sito-ottimizzato")
    a = p.parse_args()
    global FORMATO
    FORMATO = a.formato
    elabora(Path(a.progetto), Path(a.foto), Path(a.uscita), a.modo)


if __name__ == "__main__":
    main()
