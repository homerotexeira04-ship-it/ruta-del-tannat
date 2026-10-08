#!/usr/bin/env python3
"""Análisis objetivo del audio (sin escucharlo): forma de onda, nivel, espectrograma y bandas.
Uso: analyze.py in.wav out.png"""
import sys, wave, json, os, numpy as np
from PIL import Image, ImageDraw

def read(p):
    w = wave.open(p); n = w.getnframes(); sw = w.getsampwidth(); ch = w.getnchannels(); sr = w.getframerate()
    raw = np.frombuffer(w.readframes(n), dtype=np.uint8)
    if sw == 3:
        b = raw.reshape(-1, 3).astype(np.int32); v = b[:, 0] | (b[:, 1] << 8) | (b[:, 2] << 16); v = np.where(v >= 1 << 23, v - (1 << 24), v) / 2 ** 23
    else: v = np.frombuffer(raw.tobytes(), dtype='<i2') / 32768.0
    return v.reshape(-1, ch), sr

def cmap(v):  # 0..1 -> RGB (tipo inferno)
    stops = [(0, (0, 0, 4)), (0.25, (66, 10, 104)), (0.5, (187, 55, 84)), (0.75, (249, 142, 9)), (1, (252, 255, 164))]
    out = np.zeros(v.shape + (3,), dtype=np.uint8)
    for (a, ca), (b, cb) in zip(stops[:-1], stops[1:]):
        mk = (v >= a) & (v <= b); t = ((v - a) / (b - a))[mk]
        for c in range(3): out[..., c][mk] = (ca[c] + (cb[c] - ca[c]) * t).astype(np.uint8)
    return out

x, sr = read(sys.argv[1]); m = x.mean(1); dur = len(m) / sr
W = 1800; img = Image.new('RGB', (W, 920), '#0b0b0f'); d = ImageDraw.Draw(img)
# forma de onda
px = np.array_split(m, W)
for i, seg in enumerate(px):
    a, b = seg.min(), seg.max(); d.line([(i, 80 - a * 70), (i, 80 - b * 70)], fill='#7fd1c4')
# nivel RMS (dB) cada 50 ms
hop = int(0.05 * sr); rms = np.array([np.sqrt((m[i:i + hop] ** 2).mean() + 1e-12) for i in range(0, len(m) - hop, hop)]); db = 20 * np.log10(rms)
for i, v in enumerate(db):
    xx = int(i * hop / len(m) * W); h = np.clip((v + 60) / 60, 0, 1) * 110; d.line([(xx, 270), (xx, 270 - h)], fill='#C29D62')
# espectrograma
nfft = 4096; hp = 480; win = np.hanning(nfft); fr_ = (len(m) - nfft) // hp
S = np.zeros((fr_, nfft // 2 + 1))
for i in range(fr_): S[i] = np.abs(np.fft.rfft(m[i * hp:i * hp + nfft] * win))
S = 20 * np.log10(S + 1e-9); S -= S.max()
fb = np.geomspace(30, 18000, 360); fr = np.fft.rfftfreq(nfft, 1 / sr); idx = np.searchsorted(fr, fb)
Sl = np.clip((S[:, idx].T[::-1] + 85) / 85, 0, 1)
spec = Image.fromarray(cmap(Sl)).resize((W, 560), Image.BILINEAR); img.paste(spec, (0, 330))
# marcas de tiempo y golpes
tlp = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'timeline.json')
hits = [h['t'] for h in json.load(open(tlp))['hits']] if os.path.exists(tlp) else []
for s in range(16):
    xx = int(s / dur * W); d.line([(xx, 0), (xx, 920)], fill='#2a2a33'); d.text((xx + 3, 4), f'{s}s', fill='#ffffff')
for h in hits:
    xx = int(h / dur * W); d.line([(xx, 0), (xx, 920)], fill='#ff4060')
for f in (100, 1000, 10000):
    yy = 330 + 560 - int(np.log(f / 30) / np.log(18000 / 30) * 560); d.text((4, yy - 10), f'{f} Hz', fill='#ffffff'); d.line([(0, yy), (40, yy)], fill='#fff')
img.save(sys.argv[2])
# métricas
bands = [('sub 20-60', 20, 60), ('bajo 60-200', 60, 200), ('medio-bajo 200-800', 200, 800), ('medio 0.8-3k', 800, 3000), ('agudo 3-8k', 3000, 8000), ('aire 8k+', 8000, 20000)]
F = np.fft.rfftfreq(len(m), 1 / sr); P = np.abs(np.fft.rfft(m)) ** 2; tot = P.sum()
print('picos L/R: %.3f %.3f | RMS %.1f dBFS | cresta %.1f dB' % (np.abs(x[:, 0]).max(), np.abs(x[:, 1]).max(), 20 * np.log10(np.sqrt((m ** 2).mean())), 20 * np.log10(np.abs(m).max() / np.sqrt((m ** 2).mean()))))
print('bandas (% energía):', ', '.join(f'{n} {100 * P[(F >= a) & (F < b)].sum() / tot:.1f}' for n, a, b in bands))
print('RMS por segundo (dBFS):', ' '.join(f'{20 * np.log10(np.sqrt((m[int(s * sr):int((s + 1) * sr)] ** 2).mean() + 1e-12)):.0f}' for s in range(int(dur))))
print('correlación L/R: %.2f' % np.corrcoef(x[:, 0], x[:, 1])[0, 1])
