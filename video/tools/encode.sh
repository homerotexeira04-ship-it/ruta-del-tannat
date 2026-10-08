#!/bin/bash
# Codifica los cuadros JPEG + el WAV en un MP4 1920x1080 / 60 fps (H.264 + AAC), color BT.709.
# Uso: tools/encode.sh FRAMES_DIR AUDIO.wav SALIDA.mp4 [CRF] [FRAMES]
set -e
FR=$1; WAV=$2; OUT=$3; CRF=${4:-14}; N=${5:-900}
ffmpeg -y -hide_banner -loglevel error -framerate 60 -start_number 0 -i "$FR/f%04d.jpg" -i "$WAV" \
  -frames:v "$N" \
  -vf "scale=in_range=pc:in_color_matrix=bt601:out_range=tv:out_color_matrix=bt709:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p" \
  -c:v libx264 -preset slow -crf "$CRF" -profile:v high -level 4.2 -r 60 \
  -x264-params "aq-mode=3:aq-strength=0.9:deblock=-1,-1:ref=4:bframes=3" \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
ls -l "$OUT"
