// Mixage : voix off Vivienne (edge-tts) + musique Mixkit n° 371 « Cat Walk » (129 BPM, prise à 16 s)
//   + bruitages Mixkit (Mixkit Free License, usage commercial autorisé)
//   node spot/mix.mjs → spot/out/audio.wav   ·   node spot/mix.mjs stems → voix / musique / bruitages séparés
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const snd = (f) => path.join(dir, 'assets', 'sound', f)
const D = 42, MUSIC = 'm371.mp3', MUSIC_AT = 16
// même table que spot.html
const VO = [0.20, 2.78, 5.20, 9.52, 13.62, 18.35, 21.15, 25.05, 28.42, 31.35, 34.20, 37.75]

// [fichier, instant de l'attaque (s), attaque dans le fichier (s), durée gardée, volume, avance max]
const whoosh = (t, v = .45) => ['s1491.mp3', t, .29, .8, v]
const shine = (t, v = .3) => ['s1492.mp3', t, 1.07, .9, v, .5]
const pop = (t, v = .3) => ['s2358.mp3', t, .03, .45, v]
const hit = (t, v = .5) => ['s2150.mp3', t, .11, .5, v]
const click = (t, v = .3) => ['s3005.mp3', t, .03, .15, v]
const boom = (t, v = .7) => ['s788.mp3', t, 2.17, 3, v, .6]
const n = (k, f) => Array.from({ length: k }, (_, i) => f(i))
const cues = [
  // 1-2 · phrases d'accroche
  shine(.12, .16), pop(4.24, .18),
  // 3 · pastilles + carte, coups sur « blanchiment, strass, lipocavitation », regroupement sur « tout »
  ...n(8, (i) => pop(5.12 + i * .11, .2)), whoosh(5.5, .4), hit(5.26, .22), hit(6.22, .22), hit(7.07, .22), whoosh(8.39, .38),
  // 4-6 · retournement, pilule logo, traversée, « votre éclat, révélé »
  whoosh(9.45, .45), shine(10.0, .3), pop(10.3, .3), whoosh(10.95, .5), hit(11.2, .35), shine(11.6, .25),
  // 7 · panneau sombre, site, saisie, envoi
  whoosh(13.38, .55), whoosh(14.5, .28), whoosh(15.02, .45), ...n(12, (i) => click(15.48 + i * .072, .16)),
  pop(16.45, .28), click(16.78, .3), click(16.98, .3), click(17.42, .55), ['s2870.mp3', 17.56, .02, 1.5, .4], whoosh(18.0, .3),
  // 8-9 · « sur mesure », « chacune »
  shine(18.4, .2), pop(20.22, .22),
  // 10 · pilules + survols
  ...n(7, (i) => pop(21.15 + i * .2, .16)), click(21.56, .3), click(23.06, .3), whoosh(24.72, .3),
  // 11 · pastilles glissées dans la phrase
  whoosh(25.0, .2), whoosh(26.3, .18), pop(26.55, .3), whoosh(27.1, .18), pop(27.24, .3),
  // 12 · cartes résultats
  ...n(5, (i) => pop(28.45 + i * .09, .2)), whoosh(30.35, .4), hit(30.4, .25), whoosh(31.05, .25),
  // 13-14 · orbite
  boom(31.8, .35), shine(32.0, .3), ...n(4, (i) => pop(32.35 + i * .12, .18)), shine(33.03, .3), whoosh(33.86, .35),
  // 15-16 · appel à l'action
  whoosh(34.15, .25), whoosh(35.86, .4), pop(35.94, .3), whoosh(36.95, .3),
  // 17-18 · logo or + signature
  boom(37.2, .65), hit(37.25, .4), shine(38.3, .35), shine(39.4, .4), hit(39.55, .3), pop(40.05, .18), pop(40.21, .18),
]

const stems = process.argv[2] === 'stems'
const args = ['-v', 'error', '-y', '-ss', String(MUSIC_AT), '-t', String(D), '-i', snd(MUSIC)]
VO.forEach((_, i) => args.push('-i', path.join(dir, 'assets', 'voice', `v${String(i).padStart(2, '0')}.mp3`)))
const f = [`[0:a]aresample=48000,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS,volume=0.55,afade=t=in:st=0:d=0.3,afade=t=out:st=${D - 1.8}:d=1.8[mus]`]
VO.forEach((t, i) => { const ms = Math.round(t * 1000); f.push(`[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[v${i}]`) })
f.push(`${VO.map((_, i) => `[v${i}]`).join('')}amix=inputs=${VO.length}:normalize=0,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=2,volume=1.5,apad=whole_dur=${D},asplit=2[vo][vsc]`)
f.push('[mus][vsc]sidechaincompress=threshold=0.025:ratio=7:attack=20:release=380[musd]')
const n0 = VO.length + 1
cues.forEach(([file, at, hitAt, dur, vol, maxLead = 9], i) => {
  const lead = Math.min(hitAt, at, maxLead), start = hitAt - lead, delay = Math.round((at - lead) * 1000)
  const keep = Math.min(dur + lead, D - (at - lead))
  args.push('-i', snd(file))
  f.push(`[${n0 + i}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=${start.toFixed(3)}:${(start + keep).toFixed(3)},asetpts=PTS-STARTPTS,afade=t=out:st=${Math.max(0, keep - .08).toFixed(3)}:d=0.08,volume=${vol},adelay=${delay}|${delay}[c${i}]`)
})
const sfx = cues.map((_, i) => `[c${i}]`).join('')
const out = path.join(dir, 'out')
fs.mkdirSync(out, { recursive: true })
if (stems) {
  f.push('[musd]anull[m1]', `${sfx}amix=inputs=${cues.length}:normalize=0,apad=whole_dur=${D}[sx]`)
  args.push('-filter_complex', f.join(';'), '-map', '[vo]', '-t', String(D), path.join(out, 'stem-vo.wav'), '-map', '[m1]', '-t', String(D), path.join(out, 'stem-mus.wav'), '-map', '[sx]', '-t', String(D), path.join(out, 'stem-sfx.wav'))
} else {
  f.push(`[musd][vo]${sfx}amix=inputs=${cues.length + 2}:normalize=0:duration=first,alimiter=limit=0.93:attack=3:release=80,loudnorm=I=-14:TP=-1.5:LRA=9[out]`)
  args.push('-filter_complex', f.join(';'), '-map', '[out]', '-ar', '48000', '-t', String(D), path.join(out, 'audio.wav'))
}
const r = spawnSync('ffmpeg', args, { stdio: 'inherit' })
console.log(r.status === 0 ? `${stems ? 'stems' : 'audio.wav'} · ${cues.length} bruitages` : 'échec ffmpeg')
