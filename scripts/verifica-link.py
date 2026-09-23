#!/usr/bin/env python3
"""
verifica-link.py
-----------------
Controlla che ogni file richiamato dalle pagine HTML (immagini, css, js,
altre pagine) esista davvero sul disco, prima di pubblicare il sito.

Usato dalla GitHub Action .github/workflows/deploy.yml: se trova un
riferimento rotto a un file "importante" (tutto tranne i video), ferma
la pubblicazione invece di mettere online una pagina con un buco.

I video (videos/*.mp4) sono trattati come avviso, non errore: il sito
funziona comunque, quella sezione resta solo senza player finche' non
carichi i file veri.

USO:
    python3 verifica-link.py            (dalla radice del sito)
"""

import re
import sys
from pathlib import Path
from urllib.parse import unquote

RADICE = Path(__file__).resolve().parent.parent
ESTENSIONI_VIDEO = (".mp4", ".mov", ".m4v")


def pulisci(riferimento: str) -> str:
    return riferimento.split("#")[0].split("?")[0]


def main() -> int:
    pagine = sorted(
        p for p in list(RADICE.glob("*.html")) + list(RADICE.glob("projects/*.html"))
        if p.name != "diagnostica.html" and not p.name.startswith("admin-")
    )

    rotti_gravi = []
    rotti_video = []

    for pagina in pagine:
        testo = pagina.read_text(encoding="utf-8")
        for m in re.finditer(
            r'(?:src|href|poster)="((?!http|https|data:|#|mailto|tel|//)[^"]+)"', testo
        ):
            riferimento = pulisci(m.group(1))
            if not riferimento:
                continue
            bersaglio = (pagina.parent / unquote(riferimento)).resolve()
            if bersaglio.exists():
                continue
            voce = f"{pagina.relative_to(RADICE)} -> {m.group(1)}"
            if riferimento.lower().endswith(ESTENSIONI_VIDEO):
                rotti_video.append(voce)
            else:
                rotti_gravi.append(voce)

    if rotti_video:
        print("Avviso (non blocca la pubblicazione) — video non ancora caricati:")
        for v in sorted(set(rotti_video)):
            print("   ", v)
        print()

    if rotti_gravi:
        print("ERRORE — riferimenti rotti che bloccano la pubblicazione:")
        for r in sorted(set(rotti_gravi)):
            print("   ", r)
        print(f"\n{len(set(rotti_gravi))} riferimenti da sistemare prima di pubblicare.")
        return 1

    print(f"Tutto ok — {len(pagine)} pagine controllate, nessun riferimento rotto (a parte i video in attesa).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
