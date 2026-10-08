#!/bin/bash
# Reconstruye todo el reel desde cero: línea de tiempo → audio → cuadros → MP4.
# Requisitos: node (con puppeteer-core del repo), Chromium, python3 + numpy + Pillow, ffmpeg.
# Uso: ./build.sh [DIRECTORIO_DE_CUADROS]      (por defecto /tmp/reel-frames)
set -e
cd "$(dirname "$0")"
FR=${1:-/tmp/reel-frames}
mkdir -p "$FR"
node tools/export_timeline.js                       # 1) eventos de imagen → timeline.json (el audio los lee)
python3 audio/music.py audio/music.wav              # 2) música y sonido, 100 % sintetizados
node tools/render.js --out "$FR" --range 0-899 --workers 3 --q 0.97   # 3) 900 cuadros a 1920×1080 (motion blur por acumulación)
tools/encode.sh "$FR" audio/music.wav ruta-del-tannat-reel.mp4 19    # 4) H.264 + AAC, BT.709
