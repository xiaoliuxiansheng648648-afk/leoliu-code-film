# /// script
# dependencies = ["numpy"]
# ///
"""国庆回家路 soundtrack, synthesised entirely in code: pad chords, a soft arpeggio,
rail clacks that follow the train (start, bridges, tunnel, braking), a tunnel whoosh
and a station chime. Output: assets/audio/music.wav (48 kHz stereo)."""
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 61.0
N = int(SR * DUR)
BEAT = 0.75  # 80 BPM, one bar = 3 s
rng = np.random.default_rng(62)
out = np.zeros((N, 2))


def t_of(n):
    return np.arange(n) / SR


def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    out[i : i + len(sig), 0] += sig * gain * l
    out[i : i + len(sig), 1] += sig * gain * r


def env(n, a, d, s_level, r):
    e = np.full(n, s_level)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) if na else e[:na]
    e[na : na + nd] = np.linspace(1, s_level, nd)[: max(0, min(nd, n - na))]
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def pad(midis, dur):
    n = int(dur * SR)
    t = t_of(n)
    s = np.zeros(n)
    for m in midis:
        for det in (-0.07, 0.0, 0.07):
            f = hz(m + det)
            s += np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    s /= len(midis) * 3
    return s * env(n, 0.9, 0.5, 0.8, 1.2)


def pluck(midi, dur=1.4):
    n = int(dur * SR)
    t = t_of(n)
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6) + 0.12 * np.sin(6 * np.pi * f * t) * np.exp(-t * 9)
    return s * np.exp(-t * 3.2) * np.minimum(1, t * 400)


def bell(midi, dur=2.5):
    n = int(dur * SR)
    t = t_of(n)
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)
    return s * np.exp(-t * 1.6) * np.minimum(1, t * 800)


def lowpass(x, k):
    kernel = np.ones(k) / k
    return np.convolve(x, kernel, mode="same")


def clack(bright=1.0):
    n = int(0.09 * SR)
    t = t_of(n)
    noise = lowpass(rng.standard_normal(n), 6 if bright > 0.5 else 18)
    thump = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 60)
    return (0.5 * noise * np.exp(-t * 70) + thump) * 0.9


def whoosh(dur, rise):
    n = int(dur * SR)
    t = t_of(n)
    noise = lowpass(rng.standard_normal(n), 30)
    shape = np.minimum(1, t / rise) * np.minimum(1, (dur - t) / 0.4)
    return noise * shape



# chords: D  A/C#  Bm  G   (one per bar)
PROG = [[50, 57, 62, 66], [49, 57, 61, 64], [47, 54, 59, 62], [43, 55, 59, 62]]
ARP = [[74, 69, 66, 69], [73, 69, 64, 69], [71, 66, 62, 66], [71, 67, 62, 67]]
def boom(dur=1.2, f0=60):
    n = int(dur * SR)
    t = t_of(n)
    f = f0 * np.exp(-t * 2.5) + 30
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5)


def kick():
    n = int(0.35 * SR)
    t = t_of(n)
    f = 110 * np.exp(-t * 30) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12)


def sweep(dur, start_pan, end_pan, start):
    n = int(dur * SR)
    noise = lowpass(rng.standard_normal(n), 14)
    t = t_of(n)
    shape = np.sin(np.pi * t / dur) ** 2
    pans = np.linspace(start_pan, end_pan, n)
    i = int(start * SR)
    seg = noise * shape
    l = np.cos((pans + 1) * np.pi / 4)
    r = np.sin((pans + 1) * np.pi / 4)
    m = min(n, N - i)
    out[i:i + m, 0] += seg[:m] * l[:m] * 0.5
    out[i:i + m, 1] += seg[:m] * r[:m] * 0.5


def riser(dur):
    n = int(dur * SR)
    t = t_of(n)
    f = 200 + 900 * (t / dur) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + lowpass(rng.standard_normal(n), 8) * 0.7
    return tone * (t / dur) ** 2




def ping(high=True):   # message arrives
    return bell(88 if high else 83, 1.2) * 0.9


def sent():            # my reply swooshes out
    n = int(0.35 * SR); t = t_of(n); f = 600 + 1400 * t / 0.35
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.5


def bonk():            # failed to send in the tunnel
    n = int(0.3 * SR); t = t_of(n)
    return np.sin(2 * np.pi * 180 * t) * np.exp(-t * 18)


add(bell(81, 2.0), 0.0, 0.16, -0.3)             # 0 s: sound from the first frame
add(bell(76, 2.4), 0.35, 0.14, 0.3)
bar, start = 0, 0.0
while start < 58.5:
    chord = PROG[bar % 4]
    gain = 0.07 if start < 3.6 else (0.05 if 40.0 <= start < 43.0 else 0.11)
    add(pad(chord, 3.6), start, gain)
    if 4.2 <= start < 54.0 and not (40.0 <= start < 43.0):
        for k, m in enumerate(ARP[bar % 4]):
            add(pluck(m), start + k * BEAT, 0.085, (-0.4, 0.2, -0.1, 0.4)[k])
            if 16.5 <= start < 34.0 or 43.0 <= start < 50.0:
                add(pluck(m - 12, 1.8), start + k * BEAT + BEAT / 2, 0.05, 0.1)
    bar += 1; start += 3.0

# rails inside the carriage only
def rail_times():
    out_t, t, gap = [], 4.4, 1.2
    while t < 54.6:
        inside = t < 16.6 or 34.3 <= t < 40.0 or t >= 43.0
        if inside: out_t.append(t)
        if t < 9: gap = max(0.375, gap * 0.9)
        elif t > 49.6: gap = min(1.4, gap * 1.08)
        else: gap = 0.375
        t += gap
    return out_t
for t in rail_times():
    add(clack(0.3), t, 0.10, -0.2); add(clack(0.3), t + 0.11, 0.075, 0.2)

add(boom(0.9, 70), 4.2, 0.45)                       # train starts
sweep(0.9, -0.6, 0.9, 16.1); add(boom(1.3, 70), 16.5, 0.5)   # push out of the window into the drone shot
add(whoosh(8.0, 1.0) * 0.4, 16.6, 0.06)            # air over the river
add(boom(1.4, 85), 25.0, 0.5); add(bell(86, 2.2), 25.0, 0.07, 0.3); add(bell(90, 2.2), 25.12, 0.05, -0.3)   # Yangtze
add(whoosh(9.0, 1.0) * 0.4, 25.0, 0.06)
sweep(0.8, 0.9, -0.6, 33.9); add(boom(0.9, 60), 34.1, 0.35)  # back into the carriage
beat = 16.5
while beat < 50.0:                                   # heartbeat over the big middle
    if beat < 34.0 or beat >= 43.0: add(kick(), beat, 0.22)
    beat += BEAT
add(riser(1.8), 38.2, 0.12); add(boom(1.4, 50), 40.0, 0.5); add(whoosh(3.0, 0.15), 40.0, 0.14)   # tunnel
add(boom(1.6, 90), 43.0, 0.5); add(bell(90, 2.5), 43.0, 0.06, -0.3); add(bell(85, 2.5), 43.1, 0.06, 0.3)  # out into the south
for t0 in (4.8, 12.0, 27.4, 36.0, 45.6): add(ping(), t0, 0.10, 0.3)
for t0 in (6.8, 51.4): add(sent(), t0, 0.12, 0.3)
add(bonk(), 41.0, 0.25, 0.3)
add(bell(74), 54.3, 0.10, -0.2); add(bell(78), 54.65, 0.09, 0.2)       # arrival chime
n = int(0.25 * SR); tt = t_of(n); add(np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 25), 55.25, 0.4)   # stamp
add(ping(False), 56.2, 0.12, 0.3)
add(pad([50, 57, 62, 66, 69], 4.8), 56.2, 0.13)     # “汤还热着” resolves home
add(bell(81, 3.5), 58.9, 0.1)

duck = np.ones(N); duck[int(0.1 * SR):int(3.7 * SR)] = 0.55
out *= duck[:, None]
fade = int(1.5 * SR); out[-fade:] *= np.linspace(1, 0, fade)[:, None]
out /= np.max(np.abs(out)) / 0.8
path = Path(__file__).parent / "assets/audio/music.wav"
path.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(path), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype("<i2").tobytes())
print(path)
