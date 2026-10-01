# -*- coding: utf-8 -*-
"""Play recorded instruments from code: the score stays in your music.py, the sound comes from real recordings.

Samples: a subset of VSCO 2 CE (Versilian Studios, CC0), downloaded by scripts/fetch-samples.sh into
$LEOLIU_SAMPLES/vsco2ce (default ~/.cache/leoliu-code-film/vsco2ce).

    from sampler import Bank, gong, to_midi
    harp = Bank("harp")
    sig = harp.note(62, 3.0)          # D4 for 3 s, as a mono numpy array at 48 kHz
    pad = Bank("cello").sustain(50, 12.0)   # longer than the recording: looped with crossfades

Each note uses the nearest recorded pitch, resampled (at most a couple of semitones for harp/glock/cello).
"""
import math
import os
import re
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
ROOT = Path(os.environ.get("LEOLIU_SAMPLES", Path.home() / ".cache/leoliu-code-film")) / "vsco2ce"
NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
# folder pattern, octave offset. Offsets were checked by FFT, not taken from the names: the glockenspiel files are
# named an octave below what they sound, and the cello files use C3 = middle C.
KITS = {
    "harp": ("harp/*.wav", 0),
    "glock": ("glock/*.wav", 12),
    "cello": ("cello/*.wav", 12),
    "tubes": ("perc/TB_hit_*.wav", 0),
}


def to_midi(f):
    return 69 + 12 * math.log2(f / 440.0)


def fit(y, dur, fade):
    """Cut or pad to dur seconds with a fade-out at the end (a damped string, a stopped bell)."""
    n = int(dur * SR)
    y = y[:n] if len(y) >= n else np.pad(y, (0, n - len(y)))
    t = np.arange(n) / SR
    return y * np.clip((dur - t) / max(fade, 1e-3), 0, 1)


def load(path):
    """Mono, 48 kHz, attack aligned to sample 0 (so notes land on their event time), peak 1."""
    x, sr = sf.read(str(path), dtype="float64", always_2d=True)
    x = x.mean(1)
    if sr != SR:
        n = int(len(x) * SR / sr)
        x = np.interp(np.arange(n) * (sr / SR), np.arange(len(x)), x)
    i0 = int(np.argmax(np.abs(x) > 0.02 * np.max(np.abs(x))))
    x = x[max(0, i0 - int(0.002 * SR)):]
    return x / np.max(np.abs(x))


class Bank:
    def __init__(self, name):
        pattern, offset = KITS[name]
        files = sorted(ROOT.glob(pattern))
        if not files:
            raise SystemExit(f"no {name} samples in {ROOT} — run: bash scripts/fetch-samples.sh")
        self.samples = []
        for p in files:
            m = re.search(r"_([A-G])(\d)", p.stem)
            self.samples.append((12 * (int(m.group(2)) + 1) + NOTE[m.group(1)] + offset, load(p)))

    def _nearest(self, m):
        return min(self.samples, key=lambda s: abs(s[0] - m))

    def note(self, m, dur, fade=0.4, decay=None):
        """midi note m (float ok) for dur seconds; decay adds an extra exp(-t*decay) to shorten a ringing note."""
        m0, x = self._nearest(m)
        r = 2 ** ((m - m0) / 12)
        n = int(dur * SR)
        idx = np.arange(n) * r
        idx = idx[idx < len(x) - 1]
        y = np.pad(np.interp(idx, np.arange(len(x)), x), (0, n - len(idx)))
        if decay:
            y = y * np.exp(-np.arange(n) / SR * decay)
        return fit(y, dur, fade)

    def sustain(self, m, dur, xf=0.8):
        """A held note longer than its recording: loop the steady middle with equal-power crossfades."""
        m0, x = self._nearest(m)
        r = 2 ** ((m - m0) / 12)
        y = np.interp(np.arange(int((len(x) - 1) / r)) * r, np.arange(len(x)), x)
        n, k = int(dur * SR), int(xf * SR)
        if len(y) >= n:
            return y[:n]
        seg = y[int(1.2 * SR):len(y) - int(0.6 * SR)]
        out = y[:len(y) - int(0.6 * SR)].copy()
        fade_in = np.sin(np.linspace(0, np.pi / 2, k)) ** 2
        while len(out) < n:
            out[-k:] = out[-k:] * (1 - fade_in) + seg[:k] * fade_in
            out = np.concatenate([out, seg[k:]])
        return out[:n]


_GONG = None


def gong(f, dur=7.0, fade=1.8):
    """A soft gong hit (recorded at about 143 Hz), pitched to f."""
    global _GONG
    if _GONG is None:
        _GONG = load(ROOT / "perc/gongHit_p.wav")
    r = f / 143.5
    n = int(dur * SR)
    idx = np.arange(n) * r
    idx = idx[idx < len(_GONG) - 1]
    return fit(np.pad(np.interp(idx, np.arange(len(_GONG)), _GONG), (0, n - len(idx))), dur, fade)
