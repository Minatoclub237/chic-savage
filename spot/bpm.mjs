// Analyse rapide d'une piste : BPM (autocorrélation de l'enveloppe d'attaque) + énergie par tranche de 4 s
import { spawnSync } from 'node:child_process'
const f = process.argv[2], SR = 11025, HOP = 256
const pcm = spawnSync('ffmpeg', ['-v', 'error', '-i', f, '-t', '64', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1e9 }).stdout
const x = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4)
const n = Math.floor(x.length / HOP), e = new Float32Array(n)
for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < HOP; j++) s += x[i * HOP + j] ** 2; e[i] = Math.sqrt(s / HOP) }
const o = e.map((v, i) => Math.max(0, v - (e[i - 1] || 0)))
const fps = SR / HOP; let best = [0, 0]
for (let bpm = 70; bpm <= 160; bpm += .5) { const L = fps * 60 / bpm; let s = 0; for (let i = 0; i + L < n; i++) { const k = i + L, a = Math.floor(k), w = k - a; s += o[i] * (o[a] * (1 - w) + (o[a + 1] || 0) * w) } if (s > best[1]) best = [bpm, s] }
const rms = []; for (let t = 0; t < 64; t += 4) { let s = 0, c = 0; for (let i = Math.floor(t * fps); i < Math.min(n, (t + 4) * fps); i++) { s += e[i] ** 2; c++ } rms.push((20 * Math.log10(Math.sqrt(s / c) + 1e-9)).toFixed(0)) }
console.log(f.split(/[\/]/).pop(), 'bpm', best[0], '| dB/4s', rms.join(' '))
