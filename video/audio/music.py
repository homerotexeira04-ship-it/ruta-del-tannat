#!/usr/bin/env python3
"""
Música y diseño de sonido del reel «La Ruta del Tannat» — 100 % síntesis desde cero.

Sin muestras, sin modelos de audio: todo son osciladores, ruido, filtros espectrales y
convolución con respuestas al impulso sintetizadas. 128 BPM, 8 compases = 15,000 s exactos.
Cada golpe de imagen está en timeline.json (lo escribe el mismo código que dibuja el video),
así que el sonido cae sobre el cuadro correcto.

Uso:  python3 audio/music.py [salida.wav]
"""
import json, os, sys, wave
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
tl = json.load(open(os.path.join(HERE, '..', 'timeline.json')))
EV, BEAT, BAR = tl['ev'], tl['beat'], tl['bar']
S16 = BEAT / 4
DUR = tl['dur']
N = int(round(SR * DUR))
rng = np.random.default_rng(1874)          # semilla = año de Harriague


def I(t):
    return int(round(t * SR))


def mtof(m):
    return 440.0 * 2 ** ((np.asarray(m, dtype=float) - 69) / 12)


# ---------------------------------------------------------------- buses
class Bus:
    def __init__(self):
        self.L = np.zeros(N)
        self.R = np.zeros(N)


BUS = {k: Bus() for k in ['drums', 'bass', 'gtr', 'pad', 'bell', 'fx', 'imp']}
SEND_P, SEND_H = Bus(), Bus()   # reverb de placa (corta) y de sala (larga)


def put(bus, sig, t, pan=0.0, g=1.0, sp=0.0, sh=0.0):
    """Mezcla una señal mono (o estéreo Nx2) en el bus, con paneo de potencia constante y envíos de reverb."""
    b = BUS[bus] if isinstance(bus, str) else bus
    i = I(t)
    n = sig.shape[0]
    if i >= N or i + n <= 0:
        return
    s0 = max(0, -i)
    e = min(n, N - i)
    if sig.ndim == 2:
        l, r = sig[s0:e, 0], sig[s0:e, 1]
        gl = gr = g
    else:
        l = r = sig[s0:e]
        a = (pan + 1) * np.pi / 4
        gl, gr = g * np.cos(a), g * np.sin(a)
    sl = slice(i + s0, i + e)
    b.L[sl] += l * gl
    b.R[sl] += r * gr
    if sp:
        SEND_P.L[sl] += l * gl * sp; SEND_P.R[sl] += r * gr * sp
    if sh:
        SEND_H.L[sl] += l * gl * sh; SEND_H.R[sl] += r * gr * sh


# ---------------------------------------------------------------- primitivas
def tgrid(n):
    return np.arange(n) / SR


def noise(n):
    return rng.standard_normal(n)


def fft_filter(x, lo=None, hi=None, order=2):
    """Filtro de fase cero por FFT: paso-banda/alto/bajo de pendiente 'order'. lo = corte alto-paso, hi = corte bajo-paso."""
    n = len(x)
    m = 1 << int(np.ceil(np.log2(n + 8)))
    X = np.fft.rfft(x, m)
    f = np.fft.rfftfreq(m, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    if hi:
        g *= 1 / np.sqrt(1 + (np.maximum(f, 1e-3) / hi) ** (2 * order))
    return np.fft.irfft(X * g, m)[:n]


def env_exp(n, tau, a=0.002):
    t = tgrid(n)
    e = np.exp(-t / tau)
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def sweep_noise(dur, f0, f1, bw=0.9, amp=None, curve=1.0, seed=0):
    """Ruido estéreo con un filtro de banda estrecha que barre de f0 a f1 (espectral, STFT)."""
    n = int(dur * SR)
    win, hop = 2048, 512
    out = np.zeros((n + win, 2))
    w = np.hanning(win)
    fr = np.fft.rfftfreq(win, 1 / SR)
    r = np.random.default_rng(seed + 11)
    for ch in range(2):
        x = r.standard_normal(n + win)
        y = np.zeros(n + win)
        for p in range(0, n, hop):
            u = min(1.0, (p + win / 2) / n) ** curve
            fc = f0 * (f1 / f0) ** u
            g = np.exp(-0.5 * (np.log2(np.maximum(fr, 20) / fc) / bw) ** 2)
            y[p:p + win] += np.fft.irfft(np.fft.rfft(x[p:p + win] * w) * g) * w
        out[:, ch] = y
    out = out[:n] / 1.5
    out /= (np.sqrt((out ** 2).mean()) + 1e-9) * 3.0
    if amp is not None:
        out *= amp[:, None]
    return out


def fade(x, a=0.004, b=0.004):
    x = x.copy()
    na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x


# ---------------------------------------------------------------- instrumentos
def kick(vel=1.0):
    n = int(0.42 * SR); t = tgrid(n)
    f = 46 + 110 * np.exp(-t / 0.028)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / 0.11) * 1.0
    y += 0.35 * np.sin(2 * np.pi * np.cumsum(48 + 40 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.13)
    c = fft_filter(noise(n), lo=1500, hi=9000) * np.exp(-t / 0.004) * 0.35
    y = np.tanh(1.5 * (y + c)) * vel
    return fade(y, 0.0005, 0.01)


def drum(f0, drop, dec, nlo, nhi, ndec, vel=1.0, ring=0.0):
    """Parche afinado: seno con caída de tono + ruido de ataque (baquetas)."""
    n = int(max(dec, ndec) * 5.5 * SR) + 1; t = tgrid(n)
    f = f0 * (1 + drop * np.exp(-t / 0.012))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec)
    y += 0.35 * np.sin(2 * np.pi * np.cumsum(f * 1.58) / SR) * np.exp(-t / (dec * 0.6))
    nz = fft_filter(noise(n), lo=nlo, hi=nhi) * np.exp(-t / ndec)
    out = (y * 0.9 + nz * 0.5) * vel
    if ring:
        out += 0.2 * np.sin(2 * np.pi * f0 * 0.5 * t) * np.exp(-t / ring) * vel
    return fade(np.tanh(1.2 * out), 0.0006, 0.01)


def chico(v=1.0, acc=False):
    return drum(520 * (1 + 0.03 * rng.standard_normal()), 0.22, 0.045, 2500, 9000, 0.03 if not acc else 0.05, v)


def repique(v=1.0):
    return drum(300 * (1 + 0.03 * rng.standard_normal()), 0.3, 0.09, 1200, 6000, 0.05, v)


def piano_d(v=1.0):
    return drum(118 * (1 + 0.02 * rng.standard_normal()), 0.55, 0.19, 200, 1800, 0.05, v, ring=0.15)


def hat(v=1.0, open_=False):
    n = int((0.16 if open_ else 0.05) * SR); t = tgrid(n)
    y = fft_filter(noise(n), lo=7000, hi=16000, order=2) * np.exp(-t / (0.07 if open_ else 0.012))
    return fade(y * v * 1.4, 0.0005, 0.004)


def shaker(v=1.0):
    n = int(0.055 * SR); t = tgrid(n)
    y = fft_filter(noise(n), lo=4500, hi=13000) * np.sin(np.pi * np.clip(t / 0.055, 0, 1)) ** 1.5
    return y * v * 1.8


def clap(v=1.0):
    n = int(0.35 * SR); t = tgrid(n); y = np.zeros(n)
    for k, dly in enumerate([0, 0.011, 0.023]):
        i = int(dly * SR)
        b = fft_filter(noise(n - i), lo=900, hi=5500) * np.exp(-t[:n - i] / 0.012)
        y[i:] += b * 0.7
    y += fft_filter(noise(n), lo=900, hi=4200) * np.exp(-t / 0.11) * 0.35
    return fade(y * v * 1.3, 0.0005, 0.02)


def snare(v=1.0, tone=190):
    n = int(0.3 * SR); t = tgrid(n)
    y = fft_filter(noise(n), lo=1200, hi=9500) * np.exp(-t / 0.075) * 0.9
    y += np.sin(2 * np.pi * tone * (1 + 0.4 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.05) * 0.6
    return fade(np.tanh(1.1 * y) * v, 0.0005, 0.02)


def karplus(f, dur, decay=0.997, bright=0.55, vel=1.0):
    """Cuerda de nylon: Karplus-Strong por bloques (vectorizado) + resonancia de caja."""
    L = max(8, int(round(SR / f)))
    n = int(dur * SR)
    y = np.zeros(n + L)
    seed = noise(L)
    # excitación con brillo controlado
    seed = np.convolve(seed, [1 - bright, bright], 'same') if bright < 1 else seed
    seed -= seed.mean()
    seed *= np.hanning(L) ** 0.2
    y[:L] = seed
    for k in range(L, n, L):
        prev = y[k - L:k]
        shifted = np.concatenate(([y[k - L - 1] if k - L - 1 >= 0 else 0.0], prev[:-1]))
        y[k:k + L] = decay * 0.5 * (prev + shifted)
    y = y[:n]
    # caja (resonancias de madera)
    t = tgrid(n)
    body = np.zeros(n)
    k0 = min(n, int(0.12 * SR))
    for fr, a, tau in [(98, 0.5, 0.05), (196, 0.35, 0.04), (390, 0.2, 0.025)]:
        body[:k0] += a * np.sin(2 * np.pi * fr * t[:k0]) * np.exp(-t[:k0] / tau)
    y = y / (np.abs(y).max() + 1e-9)
    y = fft_filter(y, lo=70, hi=5200, order=1)
    y = y + 0.08 * body * np.abs(seed).max()
    return fade(y * vel, 0.001, 0.05)


def bell(f, dur=1.6, ratio=3.5, idx=2.0, tau=0.5, vel=1.0):
    n = int(dur * SR); t = tgrid(n)
    I_ = idx * np.exp(-t / (tau * 0.5))
    y = np.sin(2 * np.pi * f * t + I_ * np.sin(2 * np.pi * f * ratio * t)) * np.exp(-t / tau)
    y += 0.3 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / (tau * 0.4))
    return fade(y * vel, 0.0008, 0.05)


def marimba(f, dur=0.7, vel=1.0):
    n = int(dur * SR); t = tgrid(n)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.22)
    y += 0.5 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t / 0.05)
    y += 0.2 * np.sin(2 * np.pi * f * 9.8 * t) * np.exp(-t / 0.018)
    y += 0.25 * fft_filter(noise(n), lo=1500, hi=6000) * np.exp(-t / 0.006)
    return fade(y * vel, 0.0005, 0.04)


def pluck_blip(f, dur=0.12, vel=1.0, glide=0.0):
    n = int(dur * SR); t = tgrid(n)
    ff = f * (1 + glide * np.exp(-t / 0.03))
    y = np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t / (dur * 0.35))
    return fade(y * vel, 0.0005, 0.01)


def click(f=3000, vel=1.0, dur=0.012):
    n = int(dur * SR); t = tgrid(n)
    y = fft_filter(noise(n), lo=f * 0.6, hi=f * 2.2) * np.exp(-t / 0.002)
    return fade(y * vel * 2.0, 0.0002, 0.002)


def saw_add(f, n, kmax_hz=4200, ph=0.0):
    t = tgrid(n)
    K = max(1, int(kmax_hz / f))
    y = np.zeros(n)
    for k in range(1, K + 1):
        y += np.sin(2 * np.pi * f * k * t + ph * k) / k
    return y * (2 / np.pi)


def pad_chord(notes, dur, bright=0.5, vel=1.0):
    n = int(dur * SR)
    y = np.zeros((n, 2))
    notes = notes[1:]
    for i, m in enumerate(notes):
        f = mtof(m)
        for dtn, pan in [(-7, -0.7), (0, 0.0), (7, 0.7)]:
            ff = f * 2 ** (dtn / 1200)
            s = saw_add(ff, n, 3500 + 3000 * bright, ph=rng.uniform(0, 6.28))
            a = (pan * (1 if i % 2 else -1) + 1) * np.pi / 4
            y[:, 0] += s * np.cos(a); y[:, 1] += s * np.sin(a)
    y /= len(notes) * 1.6
    # filtro: oscuro + brillante mezclados según 'bright'
    dark = np.stack([fft_filter(y[:, c], hi=1100, order=2) for c in range(2)], 1)
    brt = np.stack([fft_filter(y[:, c], hi=3600, order=1) for c in range(2)], 1)
    y = dark * (1 - bright) + brt * bright
    y = np.stack([fft_filter(y[:, c], lo=140, order=2) for c in range(2)], 1)
    t = tgrid(n)
    a = np.minimum(1, t / 0.42) ** 1.5
    r = np.minimum(1, (dur - t) / 0.35)
    return y * (a * np.clip(r, 0, 1))[:, None] * vel


def sub_bass(f, dur, vel=1.0):
    n = int(dur * SR); t = tgrid(n)
    y = np.tanh(1.7 * np.sin(2 * np.pi * f * t)) * 0.7 + 0.22 * np.sin(2 * np.pi * 2 * f * t) + 0.08 * np.sin(2 * np.pi * 3 * f * t)
    a = np.minimum(1, t / 0.006); r = np.minimum(1, (dur - t) / 0.04)
    e = np.exp(-t / (dur * 0.9)) * 0.5 + 0.5
    return y * a * np.clip(r, 0, 1) * e * vel


def impact(strength=1.0, big=False):
    n = int((3.2 if big else 1.6) * SR); t = tgrid(n)
    sub = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t / 0.07)) / SR) * np.exp(-t / (0.9 if big else 0.45))
    thump = np.sin(2 * np.pi * np.cumsum(70 + 160 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.18)
    nz = fft_filter(noise(n), lo=120, hi=1800) * np.exp(-t / 0.35) * 0.5
    cr = fft_filter(noise(n), lo=3500, hi=15000) * np.exp(-t / (1.3 if big else 0.4)) * (0.55 if big else 0.18)
    y = (sub * (0.8 if big else 0.45) + thump * 0.55 + nz + cr) * strength
    return fade(np.tanh(0.9 * y), 0.0005, 0.1)


# ---------------------------------------------------------------- reverb (IR sintetizadas)
def make_ir(rt60, pre=0.012, damp=3500.0, seed=3, width=1.0):
    n = int((rt60 * 1.1 + pre) * SR)
    r = np.random.default_rng(seed)
    out = np.zeros((n, 2))
    t = tgrid(n)
    for ch in range(2):
        x = r.standard_normal(n)
        bright = fft_filter(x, lo=500, hi=9000) * np.exp(-t / (rt60 / 6.9 * 0.55))
        dark = fft_filter(x, lo=80, hi=damp) * np.exp(-t / (rt60 / 6.9))
        y = bright * 0.5 + dark
        k = int(pre * SR)
        y = np.concatenate((np.zeros(k), y[:n - k]))
        out[:, ch] = y
    out *= 1 / np.sqrt((out ** 2).sum(0).mean())
    return out


def convolve_bus(bus, ir):
    m = 1 << int(np.ceil(np.log2(N + len(ir))))
    res = np.zeros((N, 2))
    for c, src in enumerate([bus.L, bus.R]):
        X = np.fft.rfft(src, m)
        for oc in range(2):
            res[:, oc] += np.fft.irfft(X * np.fft.rfft(ir[:, (oc + c) % 2], m), m)[:N] * (1.0 if oc == c else 0.55)
    return res


# ================================================================ COMPOSICIÓN
CH = {  # raíz del bajo, notas del pad, notas de arpegio de guitarra
    'Am': (45, [45, 52, 57, 60, 64], [57, 64, 69, 72, 76, 81]),
    'G':  (43, [43, 50, 55, 59, 62], [55, 62, 67, 71, 74, 79]),
    'F':  (41, [41, 48, 53, 57, 60], [53, 60, 65, 69, 72, 77]),
    'E':  (40, [40, 47, 52, 56, 59], [52, 59, 64, 68, 71, 76]),
    'A':  (45, [45, 52, 57, 61, 64], [57, 64, 69, 73, 76, 81]),
}
BAR_CHORDS = ['Am', 'Am', 'G', 'F', 'E', 'Am', ('F', 'E'), 'A']      # compás 0..7


def chord_at(t):
    b = min(7, int(t // BAR)); c = BAR_CHORDS[b]
    if isinstance(c, tuple):
        return c[0] if (t - b * BAR) < BAR / 2 else c[1]
    return c


def tstep(bar, step):
    return bar * BAR + step * S16


KICKS = []      # tiempos de bombo (para sidechain)

# --- 0. Intro: drone + goteo + subida --------------------------------------
drone = pad_chord([33, 45, 52, 57, 64], 2.2, bright=0.1, vel=0.9)
put('pad', drone, 0.0, g=0.6, sh=0.4)
sub0 = np.sin(2 * np.pi * 55 * tgrid(int(2.2 * SR))) * np.minimum(1, tgrid(int(2.2 * SR)) / 1.2) ** 2
put('bass', fade(sub0, 0.01, 0.2), 0.0, g=0.12)
for tk in EV['introTicks']:                       # clics de la regla mientras baja la línea
    put('fx', click(3200 if tk['major'] else 2400, 0.16 if tk['major'] else 0.07), tk['t'], pan=0.1, g=1.0, sp=0.15)
put('fx', pluck_blip(1320, 0.5, 0.18, glide=-0.0), EV['dropBulb'], sh=0.5)        # nace la gota
put('fx', sweep_noise(0.34, 5000, 300, 0.7, env_exp(int(0.34 * SR), 0.14, 0.001) * 0.35, seed=1), EV['dropRelease'], g=0.45, sh=0.3)   # se suelta
# caída: tono descendente fino
n_fall = int((EV['impact'] - EV['dropRelease']) * SR); tf = tgrid(n_fall)
fall = np.sin(2 * np.pi * np.cumsum(2400 - 1700 * (tf / tf[-1])) / SR) * (tf / tf[-1]) ** 2 * 0.12
put('fx', fall, EV['dropRelease'], g=0.7, sh=0.3)
# plop del agua + subgrave
n = int(0.5 * SR); t = tgrid(n)
plop = np.sin(2 * np.pi * np.cumsum(1400 * np.exp(-t / 0.05) + 150) / SR) * np.exp(-t / 0.07)
put('fx', fade(plop, 0.001, 0.05), EV['impact'], g=0.7, sp=0.4, sh=0.5)
put('imp', impact(0.55, False), EV['impact'], g=0.8, sh=0.35)
splash = fft_filter(noise(int(0.8 * SR)), lo=1500, hi=9000) * env_exp(int(0.8 * SR), 0.2, 0.002)
put('fx', np.stack([splash, np.roll(splash, 300)], 1) * 0.22, EV['impact'], sh=0.45)
# subida hacia el golpe de título (1,5 → 1,875)
nr = int((BAR - EV['impact']) * SR)
ramp = (tgrid(nr) / tgrid(nr)[-1]) ** 2.2
put('fx', sweep_noise(nr / SR, 400, 11000, 1.1, ramp * 0.7, curve=1.6, seed=2), EV['impact'], g=0.55, sh=0.25)
put('fx', np.sin(2 * np.pi * np.cumsum(mtof(57) * 2 ** (ramp * 1.7)) / SR) * ramp * 0.12, EV['impact'], g=0.5, sh=0.3)

# --- 1. Estructura rítmica ---------------------------------------------------
GUITAR_B = [0, 3, 6, 8, 11, 14]            # tresillo (3+3+2) doble — pulso latino
BASS_B = [(0, 0), (3, 0), (6, 12), (8, 0), (11, 7), (14, 12)]
CHICO = [0, 2, 3, 5, 6, 8, 10, 11, 13, 14]  # ostinato de "cuerda" (inspirado en candombe)
PIANO = [(4, 1.0), (7, 0.55), (12, 1.0), (15, 0.5)]
REPIQUE = [(10, 0.8), (13, 0.7), (1, 0.35)]


def bar_groove(b, level):
    """level: 1 = básico, 2 = medio, 3 = lleno"""
    t0 = b * BAR
    def chord_of(step):
        return chord_at(t0 + step * S16 + 1e-6)
    # Bombo
    if b == 3:
        ks = [0, 8]                       # compás de la copa: más aire
    elif b == 6:
        ks = [0, 4, 8, 12] if True else []
    else:
        ks = [0, 4, 8, 12] if level >= 2 else [0, 8]
    for s in ks:
        t = t0 + s * S16
        if b == 6 and t >= 12.1875 - 1e-6:
            continue
        put('drums', kick(1.0 if s % 8 == 0 else 0.82), t, g=0.95)
        KICKS.append(t)
    # Candombe (chico, piano, repique)
    for k, s in enumerate(CHICO):
        t = t0 + s * S16
        if b == 6 and t >= 12.1875 - 1e-6: continue
        v = (0.9 if s in (0, 3, 6, 11) else 0.55) * (0.88 + 0.12 * rng.random())
        put('drums', chico(v, acc=s in (0, 8)), t, pan=-0.45 + 0.1 * (k % 2), g=0.34 if level >= 2 else 0.22, sp=0.08)
    if level >= 2:
        for s, v in PIANO:
            t = t0 + s * S16
            if b == 6 and t >= 12.1875 - 1e-6: continue
            put('drums', piano_d(v), t, pan=0.1, g=0.5, sp=0.1)
        for s, v in REPIQUE:
            t = t0 + s * S16
            if b == 6 and t >= 12.1875 - 1e-6: continue
            put('drums', repique(v), t, pan=0.5, g=0.34, sp=0.12)
    # Hats / shaker
    for s in range(16):
        t = t0 + s * S16
        if b == 6 and t >= 12.1875 - 1e-6: continue
        if level >= 2:
            if s % 4 == 2:
                put('drums', hat(0.75, open_=(s in (6, 14))), t, pan=0.4, g=0.36, sp=0.05)
            else:
                put('drums', hat(0.28), t, pan=0.4, g=0.22)
        put('drums', shaker((0.9 if s % 2 == 0 else 0.55) * (0.8 + 0.2 * rng.random())), t, pan=0.55, g=0.2)
    # Palmas / clap en 2 y 4
    if level >= 3 and b != 3:
        for s in (4, 12):
            t = t0 + s * S16
            if b == 6 and t >= 12.1875 - 1e-6: continue
            put('drums', clap(0.9), t, g=0.5, sp=0.22, sh=0.08)
    # Bajo (tresillo)
    for s, oct_ in BASS_B:
        t = t0 + s * S16
        if b == 6 and t >= 12.1875 - 1e-6: continue
        ch = chord_of(s)
        root = CH[ch][0]
        note = root + (7 if (s == 11 and False) else 0)
        if s == 11: note = root + 7
        elif s in (6, 14): note = root + 12
        dur = {0: 0.34, 3: 0.2, 6: 0.18, 8: 0.3, 11: 0.2, 14: 0.2}[s]
        put('bass', sub_bass(mtof(note), dur, 0.95 if s in (0, 8) else 0.75), t, g=0.5)
    # Guitarra (arpegio de tresillo + rasgueo al inicio del compás)
    gsteps = GUITAR_B if level >= 2 else [0, 4, 8, 12]
    idxs = [0, 2, 1, 3, 2, 4] if level >= 2 else [0, 2, 1, 2]
    for k, s in enumerate(gsteps):
        t = t0 + s * S16
        if b == 6 and t >= 12.1875 - 1e-6 and s not in (0,): pass
        ch = chord_of(s)
        arp = CH[ch][2]
        m = arp[idxs[k % len(idxs)] % len(arp)]
        v = (0.95 if s in (0, 8) else 0.7) * (0.9 + 0.1 * rng.random())
        pan = -0.35 if k % 2 == 0 else 0.35
        put('gtr', karplus(mtof(m), 0.95, 0.9965, 0.55, v), t, pan=pan, g=0.5, sp=0.14, sh=0.06)
    # rasgueo en el 1 del compás
    if level >= 2 and b not in (6,):
        ch = chord_of(0); arp = CH[ch][2]
        for j, m in enumerate([arp[0] - 12, arp[1] - 12, arp[2] - 12, arp[3] - 12, arp[4] - 12 if len(arp) > 4 else arp[3]]):
            put('gtr', karplus(mtof(m), 1.3, 0.9972, 0.5, 0.55), t0 + j * 0.011, pan=-0.15 + 0.07 * j, g=0.42, sp=0.18, sh=0.1)

# compases 1..7 con niveles crecientes
levels = {1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 0}
for b in range(1, 7):
    bar_groove(b, levels[b])

# --- 2. Pad de cuerdas / acordes ---------------------------------------------
for b in range(1, 8):
    c = BAR_CHORDS[b]
    segs = [(c, b * BAR, BAR)] if not isinstance(c, tuple) else [(c[0], b * BAR, BAR / 2), (c[1], b * BAR + BAR / 2, BAR / 2)]
    for name, t0, d in segs:
        br = 0.25 + 0.08 * b
        dd = d + (0.35 if b < 7 else 2.2)
        y = pad_chord(CH[name][1], dd, bright=min(0.9, br), vel=1.0)
        put('pad', y, t0 - 0.02, g=0.5 if b < 7 else 0.62, sp=0.0, sh=0.35)

# --- 3. Melodía de campanas (la voz del tema) ---------------------------------
melody = [(BAR * 1, 76, 1.6), (BAR * 2, 74, 1.6), (BAR * 3 + 0.9375 * 0, 72, 1.4), (BAR * 4, 71, 1.6), (BAR * 5, 69, 1.8)]
for t, m, d in melody:
    put('bell', bell(mtof(m), d, 3.5, 1.8, 0.65, 0.5), t, pan=0.25, g=0.5, sp=0.25, sh=0.4)
    put('bell', bell(mtof(m - 12), d, 3.5, 1.4, 0.75, 0.3), t, pan=-0.2, g=0.35, sh=0.3)

# --- 4. Sonidos sincronizados con la imagen ------------------------------------
# título: arpegio de marimba con cada letra de «Tannat»
for i, t in enumerate(EV['titleLetters']):
    put('bell', marimba(mtof([69, 72, 76, 81, 84, 88][i]), 0.6, 0.55), t + 0.03, pan=-0.4 + 0.16 * i, g=0.5, sp=0.3, sh=0.2)
for i, t in enumerate(EV['titleSmallLetters']):
    put('fx', click(4200, 0.12), t, pan=-0.5 + 0.1 * i, g=0.7)
for t in EV['titleGlints']:                      # destellos sobre el título
    n = int(0.55 * SR); tt = tgrid(n)
    sh_ = np.sin(2 * np.pi * np.cumsum(2600 + 5200 * (tt / tt[-1]) ** 2) / SR) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.1
    put('fx', np.stack([sh_, np.roll(sh_, 70)], 1), t, g=0.8, sh=0.4)
put('fx', sweep_noise(0.5, 2000, 9000, 0.7, np.sin(np.pi * np.linspace(0, 1, int(0.5 * SR))) ** 2 * 0.3, seed=4), EV['titleGlints'][0] + 0.05, g=0.35, sh=0.3)

# Harriague: odómetro mecánico + aterrizaje + puntos de la línea de tiempo
for o in EV['odoTicks']:
    f = 1800 + 140 * (o['t'] - EV['odoTicks'][0]['t']) * 10
    put('fx', click(2100 + (900 if o['d'] == 3 else 0), 0.20), o['t'], pan=-0.2 if o['d'] == 2 else 0.2, g=0.8, sp=0.08)
put('bell', bell(mtof(86), 2.0, 3.5, 2.2, 0.8, 0.55), EV['odoLand'], pan=0.2, g=0.55, sp=0.3, sh=0.5)
put('bell', bell(mtof(79), 2.0, 3.5, 2.0, 0.8, 0.4), EV['odoLand'], pan=-0.2, g=0.4, sh=0.4)
put('imp', impact(0.5, False), EV['odoLand'], g=0.55, sh=0.2)
for t, m in [(EV['dotHop1894'], 79), (EV['dotHop2016'], 83)]:
    put('bell', marimba(mtof(m), 0.6, 0.55), t + 0.05, pan=0.3, g=0.5, sp=0.3)
put('fx', fade(pluck_blip(900, 0.22, 0.3, glide=0.8), 0.001, 0.02), EV['chipApr'], g=0.7, sp=0.3)  # pop de la etiqueta del 14 de abril
put('bell', bell(mtof(83), 1.2, 3.5, 1.8, 0.5, 0.4), EV['chipApr'] + 0.02, pan=0.3, g=0.4, sp=0.3, sh=0.3)

# Copa: aparición del vidrio + aromas (arpegio de Fa mayor) + brindis
put('fx', sweep_noise(0.5, 200, 3000, 0.8, np.sin(np.pi * np.linspace(0, 1, int(0.5 * SR))) * 0.4, seed=5), EV['glassPop'] + 0.0, g=0.4, sh=0.3)
for i, (t, m) in enumerate(zip(EV['aromas'], [77, 81, 84, 89, 93])):
    put('bell', bell(mtof(m), 1.4, 3.5, 1.6, 0.45, 0.5), t, pan=-0.6 + 0.3 * i, g=0.55, sp=0.35, sh=0.4)
    put('fx', pluck_blip(2000 + 200 * i, 0.15, 0.25, glide=0.5), t - 0.02, pan=-0.6 + 0.3 * i, g=0.5, sp=0.2)
for t in EV['meters']:
    put('fx', pluck_blip(660, 0.2, 0.18, glide=0.4), t, g=0.5, sp=0.2)
# «clink» de copa en el brindis: parciales inarmónicos de vidrio
n = int(2.2 * SR); tt = tgrid(n)
clink = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, a, d in [(3150, 1, 0.35), (4870, 0.8, 0.22), (6720, 0.6, 0.15), (8390, 0.4, 0.1), (2210, 0.5, 0.5)])
clink += fft_filter(noise(n), lo=5000, hi=14000) * np.exp(-tt / 0.004) * 1.2
put('fx', fade(clink * 0.14, 0.0004, 0.2), EV['clink'], pan=0.3, g=1.0, sp=0.3, sh=0.5)

# Ruta: nodos (acorde de Mi), tramos y contador de kilómetros
for i, (t, m) in enumerate(zip(EV['rutaNodes'], [76, 80, 83, 88])):
    put('bell', bell(mtof(m), 1.5, 3.5, 1.9, 0.5, 0.55), t, pan=-0.5 + 0.35 * i, g=0.6, sp=0.3, sh=0.4)
    put('imp', impact(0.18, False), t, g=0.4)
for t in EV['rutaLegs']:
    put('fx', pluck_blip(1100, 0.18, 0.3, glide=0.6), t + 0.05, g=0.55, sp=0.2)
for i, t in enumerate(EV['rutaKpi']):
    put('fx', click(2600 + 25 * i, 0.10), t, pan=0.3, g=0.7)
put('bell', bell(mtof(88), 2.0, 3.5, 2.0, 0.8, 0.5), EV['rutaKpiLand'], pan=0.1, g=0.6, sp=0.3, sh=0.5)
put('bell', bell(mtof(83), 2.0, 3.5, 2.0, 0.8, 0.4), EV['rutaKpiLand'], pan=-0.2, g=0.45, sh=0.4)
# línea que se dibuja: barrido ascendente sutil
nl = int((EV['rutaDraw'][1] - EV['rutaDraw'][0]) * SR)
put('fx', sweep_noise(nl / SR, 600, 5200, 0.8, np.linspace(0, 1, nl) ** 1.2 * 0.18, seed=6), EV['rutaDraw'][0], g=0.5, sh=0.2)

# Termas: gotas de agua que suben (contador 0→44)
tt0 = EV['termasTicks'][0]
for i, t in enumerate(EV['termasTicks']):
    u = (t - tt0) / (EV['termasTicks'][-1] - tt0)
    put('fx', pluck_blip(380 + 1100 * u, 0.1, 0.22, glide=1.1), t, pan=-0.3 + 0.6 * ((i * 7) % 10) / 10, g=0.6, sp=0.3, sh=0.15)
put('bell', bell(mtof(88), 1.8, 3.5, 1.8, 0.7, 0.5), EV['termasLand'], g=0.55, sp=0.3, sh=0.5)
put('bell', bell(mtof(81), 1.8, 3.5, 1.8, 0.7, 0.4), EV['termasLand'], pan=-0.3, g=0.4, sh=0.4)
put('fx', pluck_blip(520, 0.3, 0.4, glide=0.9), EV['termasChip'], g=0.6, sp=0.3)
put('bell', marimba(mtof(76), 0.6, 0.5), EV['termasTitle'] + 0.05, pan=0.2, g=0.5, sp=0.3)

# Sostenible: cuatro principios (madera) + anillo 31 %
for i, (t, m) in enumerate(zip(EV['sostChips'], [57, 60, 64, 69])):
    put('bell', marimba(mtof(m), 0.5, 0.7), t + 0.03, pan=-0.4 + 0.27 * i, g=0.55, sp=0.25)
ts0 = EV['sostTicks'][0]
for i, t in enumerate(EV['sostTicks']):
    put('fx', click(2000 + 30 * i, 0.11), t, pan=0.4, g=0.6)
put('bell', bell(mtof(81), 1.8, 3.5, 1.8, 0.7, 0.5), EV['sostLand'], g=0.5, sp=0.3, sh=0.5)

# Temporadas: cuatro paneles que suben (Fa mayor) + sello del 14 de abril
for i, (t, m) in enumerate(zip(EV['seasonPanels'], [77, 81, 84, 89])):
    put('bell', bell(mtof(m), 1.1, 3.5, 1.6, 0.4, 0.5), t + 0.06, pan=-0.6 + 0.4 * i, g=0.5, sp=0.3, sh=0.3)
    put('imp', impact(0.16, False), t + 0.04, g=0.5)
    put('fx', sweep_noise(0.2, 300, 3000, 0.8, np.sin(np.pi * np.linspace(0, 1, int(0.2 * SR))) * 0.25, seed=20 + i), t - 0.05, pan=-0.5 + 0.35 * i, g=0.5)
put('fx', pluck_blip(1500, 0.16, 0.35, glide=0.8), EV['badgeApr'], g=0.6, sp=0.3)
put('bell', bell(mtof(96), 1.2, 3.5, 1.5, 0.35, 0.4), EV['badgeApr'], pan=0.3, g=0.4, sh=0.4)

# Paquetes: tarjetas, precios, recomendado, WhatsApp, idiomas (Mi mayor)
for i, t in enumerate(EV['cards']):
    put('imp', impact(0.22, False), t + 0.05, g=0.5)
    put('fx', sweep_noise(0.22, 250, 2600, 0.8, np.sin(np.pi * np.linspace(0, 1, int(0.22 * SR))) * 0.25, seed=30 + i), t - 0.06, pan=-0.4 + 0.8 * i, g=0.5)
for p in EV['priceTicks']:
    put('fx', click(2500 + 400 * p['c'], 0.10), p['t'], pan=-0.3 + 0.6 * p['c'], g=0.6)
put('fx', pluck_blip(980, 0.14, 0.35, glide=0.7), EV['reco'], g=0.6, sp=0.3)
put('bell', bell(mtof(83), 1.3, 3.5, 1.6, 0.45, 0.4), EV['reco'], pan=0.35, g=0.4, sh=0.3)
put('fx', pluck_blip(1100, 0.1, 0.4, glide=0.2), EV['whatsapp'], g=0.6, sp=0.2)           # «pop» de mensaje
put('fx', pluck_blip(1480, 0.14, 0.4, glide=0.15), EV['whatsapp'] + 0.08, g=0.6, sp=0.2)
for i, (t, m) in enumerate(zip(EV['langs'], [80, 83, 88])):
    put('bell', marimba(mtof(m), 0.4, 0.5), t + 0.02, pan=0.3 + 0.2 * i, g=0.5, sp=0.3)

# --- 5. Transiciones (barridos de ruido espectral, paneados con el movimiento) ----
def whoosh(t0, t1, f0, f1, amp=0.4, pan_move=0.0, bw=0.9, peak=0.5, seed=0, sh=0.25):
    d = t1 - t0
    n = int(d * SR)
    u = np.linspace(0, 1, n)
    env = (np.sin(np.pi * u ** peak) ** 1.5)
    y = sweep_noise(d, f0, f1, bw, env * amp, seed=seed)
    if pan_move:
        pan = np.linspace(-pan_move, pan_move, n)
        a = (pan + 1) * np.pi / 4
        m = y.mean(1)
        y = np.stack([m * np.cos(a), m * np.sin(a)], 1) * 1.3
    put('fx', y, t0, g=1.0, sh=sh)

TR = tl['trans']
whoosh(3.6, 3.95, 400, 5200, 0.55, 0, 0.9, 0.7, 41)                      # líquido que sube
n = int(0.4 * SR); tt = tgrid(n)
gurgle = np.sin(2 * np.pi * np.cumsum(260 + 700 * (tt / tt[-1]) ** 2 + 90 * np.sin(2 * np.pi * 15 * tt)) / SR) * np.sin(np.pi * tt / tt[-1]) * 0.12
put('fx', gurgle, 3.58, g=0.6, sh=0.3)
for i in range(8):                                                       # persianas (matraca) 5,475–5,795
    tcl = 5.49 + i * (0.32 / 8) * 1.1
    put('fx', click(1500 + 280 * i, 0.5, 0.02), tcl, pan=-0.8 + 0.23 * i, g=0.7, sp=0.1)
whoosh(5.47, 5.8, 600, 7000, 0.4, 0.5, 1.0, 0.6, 42)
# zoom a través de la copa
n = int(0.35 * SR); tt = tgrid(n)
dive = np.sin(2 * np.pi * np.cumsum(1500 * (0.2 + 0.8 * (1 - tt / tt[-1]) ** 2)) / SR) * np.sin(np.pi * tt / tt[-1]) * 0.14
put('fx', dive, 7.32, g=0.7, sh=0.4)
whoosh(7.30, 7.66, 300, 4800, 0.55, 0, 1.0, 0.8, 43, sh=0.4)
whoosh(9.24, 9.52, 700, 8000, 0.45, 0.85, 0.9, 0.6, 44)                  # barrido diagonal
whoosh(10.20, 10.42, 400, 9000, 0.6, 0.95, 1.1, 0.5, 45, sh=0.15)        # whip horizontal
for i in range(14):                                                      # persianas finas
    put('fx', click(2200 + 90 * i, 0.4, 0.015), 11.14 + i * 0.0225, pan=-0.8 + 0.12 * i, g=0.6)
whoosh(11.12, 11.46, 500, 8000, 0.4, 0.5, 1.0, 0.6, 46)
whoosh(12.08, 12.30, 300, 9500, 0.55, 0, 1.1, 0.7, 47, sh=0.15)          # whip vertical (sube)
# build final: subida larga + redoble de caja desde 12,1875 hasta 13,0
t_b0, t_b1 = 12.1875, 13.125
nr = int((t_b1 - t_b0) * SR)
ramp = (tgrid(nr) / tgrid(nr)[-1]) ** 2.0
rise = sweep_noise(nr / SR, 500, 13000, 1.2, ramp * 0.9, curve=1.5, seed=48)
rise[int((13.0 - t_b0) * SR):] *= 0.0                                    # silencio de 1 corchea antes del golpe
put('fx', rise, t_b0, g=0.55, sh=0.3)
put('fx', np.sin(2 * np.pi * np.cumsum(mtof(64) * 2 ** (ramp * 2.0)) / SR) * ramp * 0.12 * (np.arange(nr) < int((13.0 - t_b0) * SR)), t_b0, g=0.5, sh=0.3)
# redoble: semicorcheas con velocidad creciente
roll_steps = int(round((13.0 - 12.1875) / S16))
for k in range(roll_steps):
    t = 12.1875 + k * S16
    u = k / roll_steps
    put('drums', snare(0.25 + 0.8 * u ** 1.3, tone=180 + 70 * u), t, pan=-0.2 + 0.4 * u, g=0.5, sp=0.15 + 0.2 * u)
    if k % 2 == 0:
        KICKS.append(t) if False else None
for t in [12.1875 + j * BEAT for j in range(2)]:
    put('drums', kick(0.9), t, g=0.8); KICKS.append(t)
# arpegio ascendente de Mi mayor (E G# B E) durante el build
for i, m in enumerate([64, 68, 71, 76, 80, 83, 88, 92]):
    put('bell', marimba(mtof(m), 0.5, 0.5 + 0.04 * i), 12.1875 + i * S16 * 2 + 0.0, pan=-0.4 + 0.1 * i, g=0.5, sp=0.3, sh=0.3)

# --- 6. Golpes (impactos) -----------------------------------------------------
for h in tl['hits']:
    big = h['s'] >= 1.0
    put('imp', impact(h['s'] * (1.0 if big else 0.75), big), h['t'], g=0.8 if big else 0.55, sh=0.45 if big else 0.2)
# capa extra de crash en el golpe de título y en el final
for t in (BAR, 13.125):
    cr = fft_filter(noise(int(2.6 * SR)), lo=4000, hi=15000) * env_exp(int(2.6 * SR), 0.9, 0.002)
    put('fx', np.stack([cr, np.roll(cr, 220)], 1) * 0.3, t, g=0.7, sh=0.35)
    put('bell', bell(mtof(81), 3.0, 3.5, 2.2, 1.1, 0.5), t, pan=0.2, g=0.5, sp=0.3, sh=0.5)

# --- 7. Cierre: golpe, acorde de La mayor y cola larga ------------------------
TF = 13.125
for j, m in enumerate([45, 52, 57, 61, 64, 69]):                       # rasgueo de guitarra (La mayor)
    put('gtr', karplus(mtof(m), 2.4, 0.9976, 0.5, 0.8), TF + j * 0.014, pan=-0.3 + 0.12 * j, g=0.5, sp=0.2, sh=0.25)
put('drums', kick(1.0), TF, g=1.0); KICKS.append(TF)
put('drums', clap(0.9), TF, g=0.5, sp=0.3, sh=0.25)
for s, m in [(0, 33), (0, 45)]:
    put('bass', sub_bass(mtof(m), 1.8, 1.0), TF + s, g=0.55)
for i, t in enumerate(EV['finalLetters']):
    if i % 3 == 0:
        put('bell', marimba(mtof([81, 85, 88, 93, 97, 100][i // 3]), 0.5, 0.35), t + 0.04, pan=-0.5 + 0.2 * (i // 3), g=0.4, sp=0.3, sh=0.3)
for i, t in enumerate(EV['finalChips']):
    put('fx', pluck_blip(1250 + 150 * i, 0.12, 0.3, glide=0.5), t, pan=-0.4 + 0.27 * i, g=0.5, sp=0.25)
put('fx', pluck_blip(990, 0.2, 0.3, glide=0.5), EV['finalUrl'], g=0.5, sp=0.3)
# "latido" de candombe suave en el cierre (para que no quede estático)
for j in range(0, 8):
    t = TF + 0.9375 + j * BEAT
    if t < 14.4:
        put('drums', piano_d(0.7 - 0.05 * j), t, g=0.4, sp=0.2, sh=0.2)
for j, s in enumerate([0, 3, 6, 8, 11, 14]):
    t = TF + BAR * 0 + 0.9375 + s * S16
    if t < 14.6:
        m = CH['A'][2][[0, 2, 1, 3, 2, 4][j]]
        put('gtr', karplus(mtof(m), 1.0, 0.996, 0.5, 0.6), t, pan=-0.3 if j % 2 == 0 else 0.3, g=0.4, sp=0.2, sh=0.25)

# ================================================================ MEZCLA
# compresión lateral (sidechain) por bombo
t_all = tgrid(N)
duck = np.ones(N)
for tk in KICKS:
    i0 = I(tk)
    if i0 >= N: continue
    L = min(N - i0, int(0.35 * SR))
    tt = np.arange(L) / SR
    duck[i0:i0 + L] = np.minimum(duck[i0:i0 + L], 1 - 0.55 * np.exp(-tt / 0.11) * np.minimum(1, tt / 0.004 + 0.0))
    duck[i0:i0 + L] = np.minimum(duck[i0:i0 + L], 1.0)

IR_P = make_ir(1.5, 0.010, 4800, seed=5)
IR_H = make_ir(3.6, 0.025, 3000, seed=9)
WET_P = convolve_bus(SEND_P, IR_P)
WET_H = convolve_bus(SEND_H, IR_H)


AUTO_PTS = [(0, 0.72), (1.4, 0.8), (1.875, 0.92), (3.6, 0.94), (3.75, 1.0), (5.5, 1.0), (5.625, 0.8), (7.4, 0.86), (7.5, 1.0),
            (11.25, 1.0), (12.1875, 1.04), (12.99, 1.12), (13.0, 0.55), (13.12, 0.55), (13.125, 1.15), (13.7, 1.0), (15, 0.9)]
AUTO = np.interp(t_all, [p[0] for p in AUTO_PTS], [p[1] for p in AUTO_PTS])
AUTO = np.convolve(AUTO, np.hanning(960) / np.hanning(960).sum(), 'same')


def mix_stem(name, gain, duck_amt=0.0, auto=True):
    b = BUS[name]
    d = (1 - duck_amt) + duck_amt * duck
    if auto:
        d = d * AUTO
    return np.stack([b.L * d, b.R * d], 1) * gain


mix = (mix_stem('drums', 1.0) + mix_stem('bass', 0.6, 0.65) + mix_stem('gtr', 1.05, 0.25) + mix_stem('pad', 0.85, 0.7)
       + mix_stem('bell', 1.0, auto=False) + mix_stem('fx', 0.9, auto=False) + mix_stem('imp', 0.8, auto=False))
mix += WET_P * 0.55 + WET_H * 0.5

for c in range(2):
    mix[:, c] = fft_filter(mix[:, c], lo=30, order=2)
fin = np.minimum(1, t_all / 0.02)
fout = 1 - (np.clip((t_all - 14.68) / 0.32, 0, 1)) ** 1.6
mix *= (fin * fout)[:, None]


def lufs(x):
    """Sonoridad integrada aproximada (BS.1770: ponderación K + compuerta) con filtros por FFT."""
    m_ = len(x)
    M = 1 << int(np.ceil(np.log2(m_)))
    f = np.fft.rfftfreq(M, 1 / SR)
    hp = 1 / np.sqrt(1 + (38.0 / np.maximum(f, 1e-3)) ** 4)
    shelf = np.sqrt(1 + (10 ** (4.0 / 20) ** 2 - 1) * 0 + 0)  # placeholder
    g_sh = 10 ** (4.0 / 20)
    hs = np.sqrt((1 + (f / 1681.0) ** 2 * g_sh ** 2) / (1 + (f / 1681.0) ** 2))
    ch = [np.fft.irfft(np.fft.rfft(x[:, c], M) * hp * hs, M)[:m_] for c in range(2)]
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([sum((ch[c][i:i + blk] ** 2).mean() for c in range(2)) for i in range(0, m_ - blk, hop)])
    l = -0.691 + 10 * np.log10(ms + 1e-12)
    keep = l > -70
    ref = -0.691 + 10 * np.log10(ms[keep].mean()) - 10
    keep &= l > ref
    return -0.691 + 10 * np.log10(ms[keep].mean())


def limiter(x, ceil=0.891, look=0.003):
    pk = np.abs(x).max(1)
    w = int(look * SR) | 1
    wm = np.lib.stride_tricks.sliding_window_view(np.pad(pk, (w // 2, w // 2), mode='edge'), w).max(-1)
    gain = np.minimum(1.0, ceil / np.maximum(wm, 1e-9))
    k = np.hanning(w); k /= k.sum()
    gain = np.convolve(np.pad(gain, (w // 2, w // 2), mode='edge'), k, 'valid')[:len(x)]
    return x * np.minimum(gain, 1.0)[:, None]


TARGET_LUFS = -13.4   # mi estimación queda ~0,5 LU por encima de ffmpeg/ebur128; apunta a -14 LUFS reales
l0 = lufs(mix)
mix = mix * 10 ** ((TARGET_LUFS - l0) / 20)
mix = limiter(mix, 0.80)
l1 = lufs(mix)
mix = mix * 10 ** ((TARGET_LUFS - l1) / 20)
mix = limiter(mix, 0.80)
print(f'sonoridad integrada ≈ {lufs(mix):.1f} LUFS (objetivo {TARGET_LUFS}), pico {20*np.log10(np.abs(mix).max()):.2f} dBFS')

out_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'music.wav')
# TPDF dither + 24 bit
x = mix + (rng.random(mix.shape) - rng.random(mix.shape)) / (2 ** 24)
iv = np.clip(np.round(x * (2 ** 23 - 1)), -2 ** 23, 2 ** 23 - 1).astype('<i4')
b3 = np.empty((N, 2, 3), dtype=np.uint8)
b3[..., 0] = iv & 0xFF; b3[..., 1] = (iv >> 8) & 0xFF; b3[..., 2] = (iv >> 16) & 0xFF
with wave.open(out_path, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b3.tobytes())
rms = np.sqrt((mix ** 2).mean())
print(f'{out_path}: {N / SR:.3f} s, pico {np.abs(mix).max():.3f}, rms {20 * np.log10(rms):.1f} dBFS')
