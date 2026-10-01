# /// script
# dependencies = ["numpy", "soundfile"]
# ///
# -*- coding: utf-8 -*-
"""The same score as music.py, played on recorded instruments instead of synthesised voices.

  plucked string → concert harp      bells → glockenspiel (high) / tubular bells (low)
  singing bowl   → soft gong         pads  → cello section, sustained
  ticks          → very short glockenspiel notes
Sub-bass, air, sweeps and glides stay synthesised. Each recorded voice is scaled to the level of the synth voice it
replaces, and the shared random stream is consumed exactly as in music.py, so timing, panning and the reverb match.

    bash ../../scripts/fetch-samples.sh      # once: VSCO 2 CE samples (CC0), ~120 MB
    uv run music_real.py                     # → assets/audio/music.wav (overwrites the synth version)
"""
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
for d in [HERE, *HERE.parents]:          # find the repo's scripts/sampler.py from here or any parent folder
    if (d / "scripts/sampler.py").exists():
        sys.path.insert(0, str(d / "scripts"))
        break
from sampler import Bank, gong, to_midi  # noqa: E402

src = (HERE / "music.py").read_text(encoding="utf-8")
head, rest = src.split("# ================= score =================")
score, tail = rest.split("# ================= reverb")
ns = {"__name__": "score", "__file__": str(HERE / "music.py")}
exec(compile(head, "music.py (voices)", "exec"), ns)
SR, rng = ns["SR"], ns["rng"]
syn = {k: ns[k] for k in ("pluck", "bell", "bowl", "tick", "pad")}
HARP, GLOCK, CELLO, TUBES = Bank("harp"), Bank("glock"), Bank("cello"), Bank("tubes")


def pluck(f, dur=3.0, damp=0.996, bright=0.5):
    rng.uniform(-1, 1, max(2, int(SR / f)))          # keep the shared random stream in step with music.py
    return HARP.note(to_midi(f), dur, fade=min(0.45, dur * 0.3))


def bell(f, dur=3.5, bright=1.0):
    m = to_midi(f)
    return (GLOCK if m >= 78 else TUBES).note(m, dur, fade=min(0.8, dur * 0.35))


def bowl(f, dur=7.0):
    return gong(f, dur)


def tick(f=3200, dur=0.09):
    m = to_midi(f)
    while m > 108:                                   # fold into the glockenspiel's range
        m -= 12
    return GLOCK.note(m, max(0.3, dur * 4), fade=0.08, decay=16)


def pad(freqs, dur, att=2.0, rel=2.5):
    t = np.arange(int(dur * SR)) / SR
    s = sum(CELLO.sustain(to_midi(f), dur) for f in freqs) / len(freqs)
    return s * np.minimum(1, t / att) * np.clip((dur - t) / rel, 0, 1)


# level-match each recorded voice to the synth voice it replaces (RMS over the body of a reference note)
state = rng.bit_generator.state
pent, midi = ns["pent"], ns["midi"]
refs = {
    "pluck": (lambda v: v(pent(5), 2.0), 0.0, 0.6),
    "bell": (lambda v: v(pent(7), 3.0), 0.0, 0.8),
    "bowl": (lambda v: v(midi(50)), 0.0, 2.5),
    "tick": (lambda v: v(pent(12), 0.07), 0.0, 0.07),
    "pad": (lambda v: v([midi(38), midi(45), midi(50)], 10.0), 3.0, 7.0),
}
real = {"pluck": pluck, "bell": bell, "bowl": bowl, "tick": tick, "pad": pad}


def rms(x, a, b):
    return float(np.sqrt(np.mean(x[int(a * SR):int(b * SR)] ** 2))) + 1e-12


cal = {k: rms(f(syn[k]), a, b) / rms(f(real[k]), a, b) for k, (f, a, b) in refs.items()}
rng.bit_generator.state = state
for k in real:
    ns[k] = (lambda k: lambda *a, **kw: real[k](*a, **kw) * cal[k])(k)

exec(compile(score, "music.py (score)", "exec"), ns)
exec(compile("# ================= reverb" + tail, "music.py (reverb)", "exec"), ns)
