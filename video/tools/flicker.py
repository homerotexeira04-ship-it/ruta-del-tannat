#!/usr/bin/env python3
"""Detecta saltos bruscos entre cuadros consecutivos (posibles pops/parpadeos). Uso: flicker.py DIR"""
import sys, glob, numpy as np
from PIL import Image
fs = sorted(glob.glob(sys.argv[1] + '/f*.jpg'))
prev = None; diffs = []
for f in fs:
    im = np.asarray(Image.open(f).convert('RGB').resize((240, 135), Image.BILINEAR), dtype=np.float32)
    if prev is not None: diffs.append(np.abs(im - prev).mean())
    prev = im
d = np.array(diffs)
print('cuadros', len(fs), 'dif media %.2f  p95 %.2f  max %.2f' % (d.mean(), np.percentile(d, 95), d.max()))
med = np.median(d)
idx = np.argsort(-d)[:24]
print('mayores saltos (cuadro→cuadro, t, dif):')
for i in sorted(idx): print('  f%03d→f%03d  t=%.3f  dif=%.1f' % (i, i + 1, (i + 1) / 60, d[i]))
