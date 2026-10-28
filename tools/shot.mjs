// node tools/shot.mjs <largeur> <hauteur> <étape> ... — étapes : y=1800 | y=2.5vh | click=.sel | wait=800 | shot=nom | key=Escape | eval=js
import puppeteer from 'puppeteer-core'
import { readdirSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome')
const exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const [w, h, ...steps] = process.argv.slice(2)
const out = '_raw/shots'; mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1, isMobile: +w < 700, hasTouch: +w < 700 })
page.on('pageerror', (e) => console.log('[err]', e.message))
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log('[' + m.type() + ']', m.text()) })
await page.goto('http://localhost:5960/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 1500))
for (const s of steps) {
  const [k, ...rest] = s.split('='); const v = rest.join('=')
  if (k === 'y') {
    const px = v.endsWith('vh') ? parseFloat(v) * +h : +v
    await page.evaluate((y) => window.scrollTo(0, y), px)
    await new Promise((r) => setTimeout(r, 1700))
  } else if (k === 'click') { await page.click(v); }
  else if (k === 'wait') await new Promise((r) => setTimeout(r, +v))
  else if (k === 'key') await page.keyboard.press(v)
  else if (k === 'eval') console.log(await page.evaluate(v))
  else if (k === 'shot') { await page.screenshot({ path: `${out}/${v}.png` }); console.log('shot', v) }
}
await browser.close()
