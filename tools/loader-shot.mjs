// node tools/loader-shot.mjs — suit l'écran de chargement dès le début de la navigation
import puppeteer from 'puppeteer-core'
import { readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome')
const exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const browser = await puppeteer.launch({ executablePath: exe, headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 810 })
page.goto(`http://localhost:${process.env.PORT || 5960}/`).catch(() => {})
let n = 0
for (let i = 0; i < 16; i++) {
  await new Promise((r) => setTimeout(r, 300))
  const s = await page.evaluate(() => {
    const l = document.querySelector('#loader')
    return `${Math.round(performance.now())}ms ${document.readyState} loader=${l ? getComputedStyle(l).clipPath + ' logoOp=' + getComputedStyle(l.querySelector('img')).opacity : 'removed'}`
  }).catch((e) => 'eval-fail')
  console.log(s)
  if ([1, 4, 7, 9].includes(i)) await page.screenshot({ path: `_raw/shots/ld-${n++}.png` })
}
await browser.close()
