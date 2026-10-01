# /// script
# dependencies = ["numpy"]
# ///
"""XHS-064 full soundtrack (108 s), synthesised in code.

D-gong pentatonic (D E F# A B). Voices: Karplus-Strong plucked string (guqin-like), additive bells,
a singing-bowl for the big reveal, soft sub, drone pad, air, tiny glass ticks; one shared reverb.
Every sound is tied to a visual event in index.html (times below mirror its timeline).
"""
import math
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 108.0
N = int(SR * DUR)
rng = np.random.default_rng(64)
dry = np.zeros((N, 2))
send = np.zeros((N, 2))  # reverb send


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# D gong pentatonic around D4 (62): D E F# A B
SCALE = [0, 2, 4, 7, 9]


def pent(step, base=62):
    o, i = divmod(step, 5)
    return midi(base + 12 * o + SCALE[i])


def put(sig, t, gain=1.0, pan=0.0, rev=0.35):
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0:
        return
    s = sig[: N - i]
    l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
    dry[i:i + len(s), 0] += s * gain * l
    dry[i:i + len(s), 1] += s * gain * r
    send[i:i + len(s), 0] += s * gain * rev * l
    send[i:i + len(s), 1] += s * gain * rev * r


def tt(sec):
    return np.arange(int(sec * SR)) / SR


def bell(f, dur=3.5, bright=1.0):
    t = tt(dur)
    parts = [(1.0, 1.0, 1.6), (2.0, 0.35, 2.4), (2.76, 0.28 * bright, 3.2), (5.4, 0.12 * bright, 5.5), (8.93, 0.05 * bright, 8.0)]
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in parts)
    return s * np.minimum(1, t * 600) * 0.6


def bowl(f, dur=7.0):
    t = tt(dur)
    s = np.zeros_like(t)
    for r, a, d in [(1.0, 1.0, 0.45), (2.71, 0.45, 0.7), (5.15, 0.2, 1.1), (8.3, 0.08, 1.6)]:
        s += a * (np.sin(2 * np.pi * f * r * t) + 0.8 * np.sin(2 * np.pi * (f * r + 0.9) * t)) * np.exp(-t * d)
    return s * np.minimum(1, t * 40) * 0.35


def pluck(f, dur=3.0, damp=0.996, bright=0.5):
    n = int(dur * SR)
    L = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, L)
    # soften the excitation (plucked with the flesh of the finger)
    for _ in range(int(3 * (1 - bright)) + 1):
        buf = 0.5 * (buf + np.roll(buf, 1))
    out = np.empty(n)
    idx = 0
    for k in range(n):
        v = buf[idx]
        nxt = buf[(idx + 1) % L]
        buf[idx] = damp * 0.5 * (v + nxt)
        out[k] = v
        idx = (idx + 1) % L
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) * 0.25   # a touch of the fundamental for warmth
    return (out + body) * np.minimum(1, t * 900) * 0.8


def tick(f=3200, dur=0.09):
    t = tt(dur)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 70) * 0.5


def sub(f, dur, att=0.8):
    t = tt(dur)
    env = np.minimum(1, t / att) * np.minimum(1, (dur - t) / 1.2)
    return np.sin(2 * np.pi * f * t) * np.clip(env, 0, 1)


def pad(freqs, dur, att=2.0, rel=2.5):
    t = tt(dur)
    s = sum(np.sin(2 * np.pi * f * (1 + dt) * t + p) for f in freqs for dt, p in [(-0.002, 0), (0.0, 1.3), (0.002, 2.1)])
    env = np.minimum(1, t / att) * np.clip((dur - t) / rel, 0, 1)
    lfo = 0.8 + 0.2 * np.sin(2 * np.pi * 0.11 * t)
    return s / (3 * len(freqs)) * env * lfo


def air(dur, att=0.6, rel=0.8, smooth=40):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    x = np.convolve(x, np.ones(smooth) / smooth, mode="same")
    t = np.arange(n) / SR
    env = np.minimum(1, t / att) * np.clip((dur - t) / rel, 0, 1)
    return x * env


# ---- the same zoom curve as index.html (to place the counting ticks) ----
def span(t):
    if t < 13.6:
        return 100.0
    x = min(1.0, max(0.0, (t - 13.6) / 6.0))
    k = 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
    return math.exp(math.log(100) + (math.log(5000) - math.log(100)) * k)


# ================= score =================
def glide(f0, f1, dur, att=0.6, rel=1.2):
    t = tt(dur)
    k = np.clip(t / (dur * 0.8), 0, 1)
    f = f0 * (f1 / f0) ** (k * k * (3 - 2 * k))
    env = np.minimum(1, t / att) * np.clip((dur - t) / rel, 0, 1)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env


def swoop(f0, f1, dur=0.9):
    t = tt(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3) * np.minimum(1, t * 200)


def kC(t):  # same curve as film.js
    if t < 46.8:
        return min(10.0, max(0.0, (t - 41.3) / 0.55))
    x = min(1.0, max(0.0, (t - 46.8) / 6.4))
    return 10 + 23 * x ** 3


# ---- drones ----
put(pad([midi(38), midi(45), midi(50)], 21.0, att=3.0), 0.0, 0.06, 0, 0.5)
put(sub(midi(26), 20.0, att=2.0), 0.0, 0.10, 0, 0.1)
put(pad([midi(40), midi(47), midi(52), midi(59)], 21.0, att=1.5), 20.0, 0.055, 0, 0.5)
put(pad([midi(38), midi(45), midi(52)], 19.0, att=2.0), 40.2, 0.06, 0, 0.5)
put(pad([midi(50), midi(57), midi(64), midi(69)], 11.0, att=5.5, rel=1.0), 46.8, 0.07, 0, 0.6)   # swell into 33 generations
put(pad([midi(47), midi(54), midi(59), midi(62)], 15.0, att=2.5), 57.6, 0.055, 0, 0.5)
put(pad([midi(45), midi(52), midi(57)], 16.5, att=2.0), 72.0, 0.045, 0, 0.5)
put(pad([midi(38), midi(45), midi(50), midi(54), midi(57), midi(62)], 20.5, att=2.5, rel=4.0), 87.8, 0.065, 0, 0.55)
put(sub(midi(26), 20.0, att=3.0), 88.0, 0.09, 0, 0.1)

# ---- A · the question ----
for i, st in enumerate([7, 6, 5, 3]):
    put(bell(pent(st), 3.2), 0.0 + i * 0.45, 0.16, (-0.3, 0.2, -0.1, 0.25)[i])
put(air(1.2) * 0.25, 2.8, 0.18, 0, 0.6)
for i, st in enumerate([3, 5, 7]):
    put(pluck(pent(st), 2.6), 3.4 + i * 0.35, 0.34, (-0.5, 0, 0.5)[i])
for t0 in (5.0, 6.0, 7.0):
    put(tick(2600, 0.12), t0, 0.10, 0.2, 0.4)
put(bell(pent(10), 2.0, 0.6), 7.8, 0.09, 0.2)
put(air(1.0) * 0.2, 8.0, 0.15, -0.2, 0.6)

# ---- B · the timeline pulls back ----
t = tt(1.2)
put(np.sin(2 * np.pi * (220 + 660 * (t / 1.2) ** 2) * t) * np.exp(-((t - 0.8) ** 2) / 0.12) * 0.3, 8.4, 0.12, 0.3, 0.6)
for g, st in enumerate([5, 4, 3, 2]):
    put(pluck(pent(st), 3.0), 9.4 + g * 1.05, 0.36, 0.45 - g * 0.25)
put(bell(pent(10), 1.6, 0.5), 10.9, 0.06, 0.4)
last, step, tt_ = 3, 0, 13.6
while tt_ < 19.7:
    c = min(185, int(span(tt_) / 26.9))
    if c // 5 > last // 5:
        put(tick(pent(10 + step % 10) * 2, 0.08), tt_, 0.07, -0.6 + 1.2 * (c / 185), 0.5)
        step += 1
        last = c
    tt_ += 1 / 240
put(air(6.2, att=5.0, rel=0.3, smooth=24) * 0.35, 13.6, 0.14, 0, 0.5)
put(bowl(midi(50)), 19.8, 0.5, 0, 0.6)
put(sub(midi(38), 5.0, att=0.02), 19.8, 0.22, 0, 0.1)
for i, st in enumerate([5, 7, 10]):
    put(bell(pent(st), 4.0), 19.82 + i * 0.06, 0.12, (-0.35, 0.35, 0)[i])
put(bell(pent(12), 2.4), 20.25, 0.08, 0.3)

# ---- C · the train ----
put(air(1.0) * 0.2, 22.6, 0.14, 0.4, 0.6)
for i in range(20):
    st = [5, 6, 7, 8, 9, 10][i % 6] + (i // 6)
    put(pluck(pent(st), 1.4, 0.993, 0.7), 23.3 + i * 0.12, 0.16, 0.6 - i * 0.06, 0.45)
put(bell(pent(8), 3.0), 26.25, 0.10, -0.2)
put(air(1.0) * 0.2, 29.6, 0.12, -0.4, 0.6)

# ---- D · Li Bai, Confucius ----
put(pluck(midi(45), 4.5, 0.998, 0.3), 30.9, 0.42, -0.1, 0.5)
for g in range(0, 50, 2):
    put(tick(pent(15 - (g // 2) % 10), 0.07), 31.4 + g * (2.4 / 49), 0.08, 0.5 - g / 49, 0.5)
put(bell(pent(9), 3.4), 33.8, 0.12, -0.2)
put(bell(pent(3), 3.4), 33.86, 0.10, 0.2)
put(pluck(midi(38), 5.0, 0.998, 0.25), 35.6, 0.46, 0.1, 0.5)          # a deeper string for Confucius
for g in range(0, 46, 2):
    put(tick(pent(12 - (g // 2) % 8), 0.07), 36.0 + g * (1.6 / 45), 0.07, 0.1 - g / 60, 0.5)
put(bell(pent(8), 3.6), 37.7, 0.12, -0.1)
put(bell(pent(1), 3.6), 37.76, 0.10, 0.2)

# ---- E · the doubling ----
put(air(1.4) * 0.22, 40.5, 0.14, 0.3, 0.6)
put(bell(pent(7), 2.6), 41.4, 0.09, 0)
for l in range(1, 11):                                            # levels 1..10: a strum that thickens
    n = min(2 ** (l - 1), 6)
    for i in range(n):
        put(pluck(pent(4 + l // 2 + i % 3), 1.6, 0.994, 0.7), 41.3 + 0.55 * l + i * 0.045, 0.2 / math.sqrt(n), -0.6 + 1.2 * i / max(1, n - 1), 0.45)
prev = 10
tt_ = 46.8
while tt_ < 53.3:                                                 # 11..33: a thickening shimmer
    k = kC(tt_)
    if int(k) > prev:
        prev = int(k)
        put(bell(pent(8 + prev % 7), 1.2, 0.8), tt_, 0.05, (prev % 5 - 2) / 3, 0.6)
    dens = 4 + 2.2 * (k - 10)
    if rng.random() < dens / 240:
        put(tick(pent(10 + int(rng.integers(0, 10))) * 1.0, 0.05), tt_, 0.035, rng.uniform(-0.8, 0.8), 0.6)
    tt_ += 1 / 240
t = tt(6.4)
put(np.sin(2 * np.pi * np.cumsum(110 * 2 ** (2.2 * (t / 6.4) ** 2)) / SR) * (t / 6.4) ** 2 * 0.25, 46.8, 0.10, 0, 0.5)   # rising sweep
put(air(6.4, att=6.0, rel=0.2, smooth=16) * 0.4, 46.8, 0.14, 0, 0.5)
for kk in (10, 20, 30):
    tk = 46.8 + 6.4 * ((kk - 10) / 23) ** (1 / 3) if kk > 10 else 46.8
    put(bell(pent(10 + kk // 10), 2.4), tk, 0.10, 0.2, 0.6)
put(bowl(midi(38)), 53.25, 0.55, 0, 0.6)                         # 33 generations: 8.6 billion seats
put(sub(midi(26), 4.0, att=0.02), 53.25, 0.28, 0, 0.1)
for i, st in enumerate([0, 5, 10, 12]):
    put(bell(pent(st), 4.5), 53.27 + i * 0.05, 0.10, (-0.4, 0.4, -0.2, 0.2)[i], 0.7)
put(pluck(pent(7), 2.2), 53.5, 0.2, -0.3)
put(pluck(pent(6), 2.2), 53.9, 0.2, 0.3)

# ---- F · collapse and weave ----
for i, st in enumerate([0, 1, 2, 3, 4, 5, 6]):                     # many notes glide into one
    put(glide(pent(st), pent(0), 4.4), 58.0, 0.05, -0.6 + 0.2 * i, 0.6)
for i in range(18):
    put(tick(pent(14 - i % 9), 0.06), 58.1 + i * 0.2, 0.04, rng.uniform(-0.7, 0.7), 0.6)
put(bell(pent(5), 3.4), 62.2, 0.12, 0)
put(bell(pent(0), 3.4), 62.26, 0.09, 0.2)
for order in range(5):                                           # people join, “you” first
    pitches = [5] if order == 0 else [5 - order, 5 + order]
    for j, st in enumerate(pitches):
        put(pluck(pent(st), 2.4, 0.996, 0.5), 64.8 + order * 0.38 + j * 0.02, 0.26 if order == 0 else 0.18, (0 if order == 0 else (-0.5 if j == 0 else 0.5)), 0.5)
for i in range(10):
    put(pluck(pent([5, 7, 9, 7][i % 4]), 1.8, 0.994, 0.6), 67.0 + i * 0.42, 0.10, -0.4 + 0.08 * i, 0.5)

# ---- G · the Nature model ----
put(bell(pent(3), 3.0), 72.4, 0.09, 0)
put(bell(pent(12), 2.6), 76.0, 0.12, 0)
put(pluck(midi(38), 4.0, 0.998, 0.3), 76.0, 0.3, 0, 0.5)
for j in range(0, 72, 2):
    put(tick(pent(15 - (j // 2) % 10), 0.06), 76.2 + j * (1.6 / 72), 0.05, -0.8 + 1.6 * j / 72, 0.5)
put(pad([midi(50), midi(54), midi(57), midi(62), midi(66)], 5.5, att=0.4, rel=3.0), 80.2, 0.10, 0, 0.7)   # ignition
for i, st in enumerate([5, 7, 9, 10, 12]):
    put(bell(pent(st), 4.0), 80.25 + i * 0.07, 0.08, (-0.5, 0.5, -0.2, 0.2, 0)[i], 0.7)
for i in range(6):
    put(swoop(pent(9 - i) * 2, pent(9 - i), 0.9), 80.3 + i * 0.2, 0.05, rng.uniform(-0.6, 0.6), 0.6)

# ---- H · landing ----
for i in range(12):
    put(pluck(pent(12 - i % 7), 1.6, 0.994, 0.6), 88.2 + i * 0.2, 0.12, 0.6 - i * 0.1, 0.5)
put(air(3.4, att=0.4, rel=1.5) * 0.3, 92.2, 0.12, 0, 0.6)
for i in range(10):
    put(bell(pent(12 - i), 2.0, 0.7), 92.3 + i * 0.32, 0.06, 0.6 - i * 0.13, 0.6)
put(bowl(midi(50)), 96.6, 0.45, 0, 0.6)
put(sub(midi(38), 5.0, att=0.05), 96.6, 0.2, 0, 0.1)
for i, st in enumerate([5, 7, 8]):
    put(bell(pent(st), 4.5), 96.62 + i * 0.06, 0.10, (-0.3, 0.3, 0)[i], 0.7)
for i, (st, d) in enumerate([(5, 0.0), (4, 0.7), (3, 1.4), (2, 2.1), (3, 3.0)]):   # a short guqin phrase
    put(pluck(pent(st), 3.2, 0.997, 0.35), 97.9 + d, 0.28, 0.1, 0.55)
put(bell(pent(6), 3.0), 102.0, 0.09, 0)
put(pluck(pent(0), 4.0, 0.998, 0.3), 106.2, 0.3, 0, 0.6)

# ================= reverb (FFT convolution with a synthetic hall) =================
irn = int(3.4 * SR)
ti = np.arange(irn) / SR
ir = np.stack([rng.standard_normal(irn), rng.standard_normal(irn)], 1) * np.exp(-ti / 0.9)[:, None]
ir[: int(0.02 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(0))
M = 1 << int(np.ceil(np.log2(N + irn)))
wet = np.stack([np.fft.irfft(np.fft.rfft(send[:, c], M) * np.fft.rfft(ir[:, c], M), M)[:N] for c in range(2)], 1)
mix = dry + wet * 0.9

fade = int(0.8 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix /= np.max(np.abs(mix)) / 0.89
path = Path(__file__).parent / "assets/audio/music.wav"
path.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(path), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(path)
