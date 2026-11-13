#!/usr/bin/env python3
"""
Generates six ORIGINAL calm instrumental pieces for Daily Dose of Gospels
so the music player works out of the box. Pure sine/pad synthesis with
soft envelopes, a gentle feedback-delay for depth, and light mastering.

Output: public/music/*.mp3 (mono 22050 Hz, 96 kbps — ~0.7 MB per minute)
Run:    python3 scripts/generate_music.py
"""
import numpy as np
import subprocess
import os

SR = 22050
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "music")
os.makedirs(OUT_DIR, exist_ok=True)

def note_freq(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)

def env(n: int, attack: float, release: float) -> np.ndarray:
    e = np.ones(n)
    a = max(int(attack * SR), 1)
    r = max(int(release * SR), 1)
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return e

def pad_tone(freq: float, dur: float, amp: float = 0.16) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    # detuned pair + soft octave for a warm pad
    w = (
        np.sin(2 * np.pi * freq * t) * 0.6
        + np.sin(2 * np.pi * freq * 1.003 * t) * 0.4
        + np.sin(2 * np.pi * freq * 2 * t) * 0.15
    )
    vib = 1 + 0.002 * np.sin(2 * np.pi * 0.15 * t)
    w *= vib
    return w * env(n, attack=min(1.2, dur * 0.25), release=min(1.5, dur * 0.35)) * amp

def pluck(freq: float, dur: float, amp: float = 0.22) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t) + 0.12 * np.sin(2 * np.pi * freq * 3 * t)
    decay = np.exp(-t * 2.2)
    return w * decay * env(n, attack=0.004, release=0.05) * amp

def bell(freq: float, dur: float, amp: float = 0.14) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 2.756 * t) * np.exp(-t * 3)
    decay = np.exp(-t * 1.4)
    return w * decay * env(n, attack=0.002, release=0.08) * amp

def delay_fx(x: np.ndarray, time_s: float = 0.28, fb: float = 0.32, mix: float = 0.22) -> np.ndarray:
    d = int(time_s * SR)
    y = x.copy()
    echo = np.zeros_like(x)
    src = x.copy()
    for i in range(1, 4):
        shifted = np.zeros_like(src)
        shifted[d * i:] = src[: len(src) - d * i] * (fb ** i)
        echo += shifted
    return y * (1 - mix) + echo * mix

def place(canvas: np.ndarray, sound: np.ndarray, at_s: float) -> None:
    i = int(at_s * SR)
    j = min(i + len(sound), len(canvas))
    if j > i:
        canvas[i:j] += sound[: j - i]

def render(title: str, chords: list, melody: list, tempo: float, bar_len: float,
           lead=pluck, pad_amp=0.15, loop=2, tail=3.0):
    """chords: list of (root_midi, [intervals]); melody: list of (midi_or_None, beat_pos, dur_beats)."""
    total = bar_len * len(chords) * loop + tail
    n = int(total * SR)
    canvas = np.zeros(n)

    for rep in range(loop):
        base = rep * bar_len * len(chords)
        for ci, (root, intervals) in enumerate(chords):
            t0 = base + ci * bar_len
            for iv in intervals:
                place(canvas, pad_tone(note_freq(root + iv), bar_len * 0.98, amp=pad_amp), t0)
            place(canvas, pad_tone(note_freq(root - 12), bar_len * 0.98, amp=pad_amp * 0.8), t0)  # bass

    for rep in range(loop):
        base = rep * bar_len * len(chords)
        for midi, beat, dur in melody:
            if midi is None:
                continue
            t0 = base + beat * bar_len / 4  # beats are quarter notes (4 per bar)
            place(canvas, lead(note_freq(midi), dur * bar_len / 4 + 0.35), t0)

    y = delay_fx(canvas)
    peak = np.max(np.abs(y)) or 1.0
    y = y / peak * 0.86
    fade = int(2.2 * SR)
    y[-fade:] *= np.linspace(1, 0, fade)
    y[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR))

    pcm = (y * 32767).astype(np.int16)
    wav_path = os.path.join("/tmp", f"{title}.wav")
    mp3_path = os.path.join(OUT_DIR, f"{title}.mp3")
    import wave
    with wave.open(wav_path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", wav_path,
         "-codec:a", "libmp3lame", "-b:a", "96k", mp3_path],
        check=True,
    )
    os.remove(wav_path)
    dur = len(y) / SR
    print(f"  {title}.mp3  {dur:.1f}s  {os.path.getsize(mp3_path)/1024:.0f} KB")
    return round(dur)

# ── Six original pieces ───────────────────────────────────────────────────────

print("Generating original instrumentals…")

# 1. Morning Has Spoken — C major, I–V–vi–IV, hopeful plucks
C, Dm, E, F, G, Am = 60, 62, 64, 65, 67, 69
render(
    "morning-has-spoken",
    chords=[(48, [12, 16, 19]), (55, [12, 16, 19]), (45, [15, 19, 22]), (53, [12, 16, 19])],
    melody=[(72, 0, 2), (76, 2, 1), (79, 3, 1), (76, 4, 2), (74, 6, 2), (72, 8, 2), (67, 10, 2), (69, 12, 3.5), (None, 15.5, 0.5)],
    tempo=72, bar_len=4.0, loop=2,
)

# 2. Still Waters — A minor, slow pads, long breathing tones
render(
    "still-waters",
    chords=[(45, [12, 15, 19]), (41, [12, 16, 19]), (43, [12, 15, 19]), (40, [12, 15, 20])],
    melody=[(69, 0.5, 3), (72, 4, 2.5), (76, 7, 4), (74, 11.5, 3.5), (72, 15, 4)],
    tempo=52, bar_len=6.0, lead=pad_tone, pad_amp=0.17, loop=2,
)

# 3. The Shepherd's Path — G major, arpeggio lullaby
render(
    "the-shepherds-path",
    chords=[(43, [12, 16, 19]), (48, [12, 16, 19]), (45, [12, 16, 19]), (50, [11, 14, 19])],
    melody=[(67, 0, 1), (71, 1, 1), (74, 2, 1), (79, 3, 1), (78, 4, 1), (74, 5, 1), (71, 6, 1.5), (67, 8, 1), (69, 9, 1), (71, 10, 1), (74, 11, 1), (72, 12, 2), (71, 14, 1.5)],
    tempo=66, bar_len=4.0, loop=2,
)

# 4. Light Through the Window — F major, warm bells
render(
    "light-through-the-window",
    chords=[(41, [12, 16, 21]), (46, [11, 16, 19]), (43, [12, 16, 19]), (48, [9, 16, 19])],
    melody=[(77, 0, 2), (81, 2, 1.5), (84, 3.5, 2), (81, 6, 1), (79, 7, 2), (77, 9, 2), (76, 11, 2), (77, 13, 3)],
    tempo=58, bar_len=4.5, lead=bell, pad_amp=0.14, loop=2,
)

# 5. Anchor in the Deep — D minor, contemplative low drones
render(
    "anchor-in-the-deep",
    chords=[(38, [12, 15, 19]), (45, [12, 17, 20]), (41, [12, 15, 20]), (43, [12, 15, 19])],
    melody=[(62, 0, 3), (65, 3.5, 2.5), (69, 6.5, 4), (67, 11, 2.5), (65, 14, 3), (62, 17.5, 4)],
    tempo=48, bar_len=5.5, lead=pad_tone, pad_amp=0.18, loop=2,
)

# 6. Harvest of Peace — E major, gentle bell arpeggios
render(
    "harvest-of-peace",
    chords=[(40, [12, 16, 19]), (45, [12, 16, 19]), (42, [12, 16, 19]), (47, [9, 16, 19])],
    melody=[(76, 0, 1.5), (80, 1.5, 1.5), (83, 3, 2), (80, 5, 1), (78, 6, 1.5), (76, 8, 2), (71, 10, 1.5), (73, 11.5, 1.5), (76, 13, 2.5)],
    tempo=60, bar_len=4.5, lead=bell, pad_amp=0.13, loop=2,
)

print("Done.")
