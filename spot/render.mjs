// Rendu image par image : node spot/render.mjs <v|h> [video|stills] [t1,t2,…]
//   v = 9:16 (1080×1920), h = 16:9 (1920×1080) → spot/out/chic-savage-spot-9x16.mp4 / -16x9.mp4
import puppeteer from 'puppeteer-core'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const base = path.join(homedir(), '.cache/puppeteer/chrome')
const exe = path.join(base, fs.readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const [fmt = 'v', mode = 'video', list = ''] = process.argv.slice(2)
const [W, H] = fmt === 'v' ? [1080, 1920] : [1920, 1080]
const FPS = 30, DUR = 42, N = FPS * DUR
const out = path.join(dir, 'out')
fs.mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: exe, headless: true,
  args: ['--hide-scrollbars', '--allow-file-access-from-files', '--force-color-profile=srgb', '--use-angle=d3d11', '--ignore-gpu-blocklist'],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
})
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()))
await page.goto(pathToFileURL(path.join(dir, 'spot.html')).href, { waitUntil: 'load' })
const fonts = await page.evaluate(async () => {
  const f = ['600 40px IN', '700 40px IN', '500 40px MO', '600 40px MO', '700 40px MO', '800 40px MO']
  await Promise.all(f.map((x) => document.fonts.load(x)))
  window.build()
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
  return f.filter((x) => !document.fonts.check(x))
})
if (fonts.length) console.log('POLICES MANQUANTES', fonts)

if (mode === 'stills') {
  for (const t of list.split(',').map(Number)) {
    await page.evaluate((t) => window.render(t), t)
    await page.screenshot({ path: path.join(out, `still-${fmt}-${t.toFixed(2)}.jpg`), type: 'jpeg', quality: 80 })
  }
} else {
  const file = path.join(out, `chic-savage-spot-${fmt === 'v' ? '9x16' : '16x9'}.mp4`)
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(out, 'audio.wav'), '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(DUR), '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] })
  for (let i = 0; i < N; i++) {
    await page.evaluate((t) => window.render(t), i / FPS)
    const buf = await page.screenshot({ type: 'jpeg', quality: 92, optimizeForSpeed: true })
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    if (i % 300 === 0) console.log(fmt, `${i}/${N}`)
  }
  ff.stdin.end()
  await new Promise((r) => ff.on('close', r))
  console.log('ok', file)
}
await browser.close()
