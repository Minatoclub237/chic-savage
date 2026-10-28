// Liste les sons Mixkit d'une ou plusieurs pages : node spot/mixkit.mjs <chemin> … → titre | durée | url
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import { homedir } from 'node:os'

const base = path.join(homedir(), '.cache/puppeteer/chrome')
const exe = path.join(base, fs.readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const browser = await puppeteer.launch({ executablePath: exe, headless: true })
const page = await browser.newPage()
for (const p of process.argv.slice(2)) {
  await page.goto(`https://mixkit.co/${p}/`, { waitUntil: 'networkidle2', timeout: 90000 }).catch(() => {})
  const items = await page.evaluate(() => [...document.querySelectorAll('[data-audio-player-preview-url-value]')].map((e) => {
    const card = e.closest('.item-grid-card, article, li, div[class*=card]') || e.parentElement
    const t = card.querySelector('h2, h3, .item-grid-card__title')
    const d = card.innerText.match(/\d+:\d\d/)
    return `${t ? t.innerText.trim() : '?'} | ${d ? d[0] : ''} | ${e.getAttribute('data-audio-player-preview-url-value')}`
  }))
  console.log(`## ${p} (${items.length})`)
  items.slice(0, 18).forEach((x) => console.log(x))
}
await browser.close()
