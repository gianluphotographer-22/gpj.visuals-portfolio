#!/usr/bin/env python3
"""
comprimi-video.py
------------------
Comprime video per il web con le impostazioni piu' aggressive che restano
guardabili in un player piccolo incorporato in una pagina (formato H.264,
compatibile con tutti i browser). Pensato per le clip corte del portfolio
(GELSI.MP4, BOVIO.MP4), ma funziona con qualsiasi video in ingresso.

USO:
    python3 comprimi-video.py GELSI.MP4 BOVIO.MP4
    python3 comprimi-video.py *.mp4 --uscita videos/
    python3 comprimi-video.py clip.mov --crf 28   (meno aggressivo)

Richiede ffmpeg installato e nel PATH.
"""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

CRF_DEFAULT = 32
LARGHEZZA_MAX_DEFAULT = 1280
PRESET = "veryslow"
AUDIO_BITRATE = "96k"

LIMITE_DURO_MB = 100    # GitHub rifiuta il push oltre questa soglia
LIMITE_AVVISO_MB = 50   # GitHub avvisa ma accetta


def controlla_ffmpeg():
    if not shutil.which("ffmpeg"):
        sys.exit(
            "ffmpeg non e' installato.\n"
            "macOS:    brew install ffmpeg\n"
            "Windows:  https://ffmpeg.org/download.html\n"
            "Linux:    sudo apt install ffmpeg"
        )


def dimensione_mb(path: Path) -> float:
    return path.stat().st_size / 1024 / 1024


def comprimi(sorgente: Path, uscita: Path, crf: int, larghezza: int) -> bool:
    uscita.parent.mkdir(parents=True, exist_ok=True)
    comando = [
        "ffmpeg", "-y", "-i", str(sorgente),
        "-c:v", "libx264", "-preset", PRESET, "-crf", str(crf),
        "-vf", f"scale='min({larghezza},iw)':-2",
        "-c:a", "aac", "-b:a", AUDIO_BITRATE, "-ac", "1",
        "-movflags", "+faststart",
        str(uscita),
    ]

    print(f"\n\u25b6 {sorgente.name}")
    risultato = subprocess.run(comando, capture_output=True, text=True)

    if risultato.returncode != 0:
        print("  fallito. Ultime righe di ffmpeg:")
        print("  " + "\n  ".join(risultato.stderr.strip().splitlines()[-12:]))
        return False

    prima = dimensione_mb(sorgente)
    dopo = dimensione_mb(uscita)
    riduzione = 100 - (dopo / prima * 100) if prima else 0

    print(f"  {prima:7.1f} MB  ->  {dopo:6.1f} MB   ({riduzione:4.0f}% in meno)")

    if dopo > LIMITE_DURO_MB:
        print(f"  attenzione: resta sopra i {LIMITE_DURO_MB} MB, GitHub rifiuta il push.")
        print("  riprova con --crf piu' alto (es. 34 o 36) o --larghezza piu' bassa (es. 960).")
    elif dopo > LIMITE_AVVISO_MB:
        print(f"  sopra i {LIMITE_AVVISO_MB} MB: GitHub avvisa ma lo accetta.")
    else:
        print("  pronto per essere caricato.")

    return True


def main():
    p = argparse.ArgumentParser(
        description="Comprime video per il web (H.264, compatibile ovunque).")
    p.add_argument("video", nargs="+", help="uno o piu' file video da comprimere")
    p.add_argument("--uscita", default="./videos-compressi",
                    help="cartella di destinazione (default: ./videos-compressi)")
    p.add_argument("--crf", type=int, default=CRF_DEFAULT,
                    help=f"qualita': piu' basso = piu' pesante e nitido (default: {CRF_DEFAULT})")
    p.add_argument("--larghezza", type=int, default=LARGHEZZA_MAX_DEFAULT,
                    help=f"larghezza massima in pixel (default: {LARGHEZZA_MAX_DEFAULT})")
    a = p.parse_args()

    controlla_ffmpeg()
    uscita_dir = Path(a.uscita)
    riusciti = 0

    for v in a.video:
        sorgente = Path(v)
        if not sorgente.exists():
            print(f"\n\u25b6 {v}\n  file non trovato, salto.")
            continue
        destinazione = uscita_dir / (sorgente.stem + ".mp4")
        if comprimi(sorgente, destinazione, a.crf, a.larghezza):
            riusciti += 1

    print(f"\n{riusciti}/{len(a.video)} video pronti in: {uscita_dir}/")


if __name__ == "__main__":
    main()
