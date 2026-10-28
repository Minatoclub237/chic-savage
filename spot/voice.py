# Voix off : py -3.13 spot/voice.py → spot/assets/voice/vNN.mp3 + words.json (timings mot à mot) + contrôle de langue
# Script entier synthétisé d'une traite (une réplique courte isolée dérive vers l'italien/l'anglais avec les voix
# multilingues), puis découpé réplique par réplique en comptant les caractères (robuste aux élisions « qu'un »).
import asyncio, json, os, re, subprocess
import edge_tts

VOICE, RATE = "fr-FR-VivienneMultilingualNeural", "-2%"
LINES = [
    "Prendre soin de soi ne devrait pas être compliqué.",
    "Ça devrait être aussi simple qu'un sourire.",
    "Blanchiment, strass, lipocavitation : tout est réuni.",
    "Voici Chic Savage Beauty : votre éclat, révélé.",
    "Réservez votre soin en quelques secondes.",
    "Des soins sur mesure, pensés pour chacune.",
    "Blanchiment dès 75 euros, séance découverte à 50 euros.",
    "Un seul institut, pour votre sourire et votre silhouette.",
    "De vrais résultats, séance après séance.",
    "Au cœur de Fort-de-France, en Martinique.",
    "Réservez dès aujourd'hui, sur WhatsApp ou en ligne.",
    "Chic Savage Beauty : votre éclat, notre art.",
]
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "assets", "voice")
os.makedirs(out, exist_ok=True)
alnum = lambda s: len(re.findall(r"\w", s))


async def main():
    c = edge_tts.Communicate(" ".join(LINES), VOICE, rate=RATE, boundary="WordBoundary")
    words, audio = [], b""
    async for ch in c.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append([ch["text"], ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7])
    full = os.path.join(out, "full.mp3")
    with open(full, "wb") as f:
        f.write(audio)
    meta, k = [], 0
    for i, text in enumerate(LINES):
        target, got, ws = alnum(text), 0, []
        while k < len(words) and got < target:
            ws.append(words[k]); got += alnum(words[k][0]); k += 1
        nxt = words[k][1] if k < len(words) else ws[-1][2] + .6
        a = max(0, ws[0][1] - .06)
        b = min(nxt - .02, ws[-1][2] + .25)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", full, "-ss", f"{a:.3f}", "-to", f"{b:.3f}",
                        "-af", "afade=t=in:d=0.02,areverse,afade=t=in:d=0.06,areverse", os.path.join(out, f"v{i:02d}.mp3")], check=True)
        meta.append({"text": text, "dur": round(b - a, 3), "words": [[w, round(s - a, 3), round(e - a, 3)] for w, s, e in ws]})
    assert k == len(words), (k, len(words))
    with open(os.path.join(out, "words.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    for i, m in enumerate(meta):
        print(f"v{i:02d} {m['dur']:.2f}s  {m['text']}")


asyncio.run(main())

# contrôle de langue (faster-whisper small) — audio décodé par ffmpeg (PyAV plante sur certaines métadonnées)
import numpy as np
from faster_whisper import WhisperModel
model = WhisperModel("small", device="cpu", compute_type="int8")
for i in range(len(LINES)):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(out, f"v{i:02d}.mp3"), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, np.float32)
    segs, info = model.transcribe(x, beam_size=1)
    print(f"v{i:02d} {info.language} {info.language_probability:.2f} | {' '.join(s.text.strip() for s in segs)}")
