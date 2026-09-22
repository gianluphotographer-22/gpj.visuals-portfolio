#!/usr/bin/env python3
"""
aggiorna-recensioni.py
-----------------------
Rigenera la griglia di recensioni "generali" dentro recensioni.html,
leggendo i dati da dati/recensioni-generali.json.

COME FUNZIONA IN PRATICA
  Le recensioni non compaiono da sole quando qualcuno compila il form:
  su un sito statico come questo non esiste un database che le
  raccolga in automatico. Il form manda una email alla tua casella
  (vedi index.html/recensioni.html, stessa access key di Web3Forms
  gia' usata per i contatti). Quando decidi che una recensione va
  pubblicata:
    1. apri dati/recensioni-generali.json
    2. aggiungi un blocco come questo, in fondo alla lista:
       {
         "nome": "Nome Cognome",
         "ruolo": "Cliente" ,
         "testo": "Il testo della recensione.",
         "voto": 5,
         "anno": "2026"
       }
    3. lancia:  python3 aggiorna-recensioni.py
    4. carica il nuovo recensioni.html sul sito

USO:
    python3 aggiorna-recensioni.py --progetto . --uscita ./nuovo
"""

import argparse
import json
import re
from pathlib import Path

MARCATORE_INIZIO = "<!-- INIZIO GRIGLIA GENERATA -->"
MARCATORE_FINE = "<!-- FINE GRIGLIA GENERATA -->"


def blocco_card(rec: dict) -> str:
    voto = int(rec.get("voto", 5))
    voto = max(1, min(5, voto))
    stelle = "★" * voto + "☆" * (5 - voto)
    ruolo = rec.get("ruolo", "").strip()
    return f"""          <article class="review-card reveal">

            <div class="review-header">

              <div class="review-avatar review-avatar-lettera" aria-hidden="true">
                {rec['nome'].strip()[:1].upper()}
              </div>

              <div class="review-user">
                <h3>{rec['nome'].strip()}</h3>
                <p>{ruolo}</p>
              </div>

            </div>

            <div class="review-rating" aria-label="{voto} stelle su 5">
              {stelle}
            </div>

            <blockquote>
              &ldquo;{rec['testo'].strip()}&rdquo;
            </blockquote>

            <div class="review-footer">
              <span>Recensione generale</span>
              <span>{rec.get('anno', '')}</span>
            </div>

          </article>
"""


def blocco_vuoto() -> str:
    return """          <div class="reviews-empty reveal">
            <p>Ancora nessuna recensione generale pubblicata.<br>Sii il primo a lasciarne una, dal modulo qui sotto.</p>
          </div>
"""


def genera_griglia(recensioni: list) -> str:
    if not recensioni:
        return blocco_vuoto()
    return "\n".join(blocco_card(r) for r in recensioni)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--progetto", default=".")
    p.add_argument("--dati", default="dati/recensioni-generali.json")
    p.add_argument("--uscita", default="./nuovo")
    a = p.parse_args()

    progetto = Path(a.progetto)
    uscita = Path(a.uscita)
    uscita.mkdir(parents=True, exist_ok=True)

    dati_path = progetto / a.dati
    recensioni = json.loads(dati_path.read_text(encoding="utf-8")) if dati_path.exists() else []

    pagina = progetto / "recensioni.html"
    testo = pagina.read_text(encoding="utf-8")

    if MARCATORE_INIZIO not in testo or MARCATORE_FINE not in testo:
        raise SystemExit("Non trovo i marcatori della griglia in recensioni.html. "
                         "Non tocco il file per sicurezza.")

    griglia = genera_griglia(recensioni)
    nuovo = re.sub(
        re.escape(MARCATORE_INIZIO) + r".*?" + re.escape(MARCATORE_FINE),
        MARCATORE_INIZIO + "\n\n" + griglia + "\n        " + MARCATORE_FINE,
        testo, count=1, flags=re.DOTALL)

    (uscita / "recensioni.html").write_text(nuovo, encoding="utf-8")
    print(f"recensioni.html rigenerata — {len(recensioni)} recensioni generali pubblicate")


if __name__ == "__main__":
    main()
