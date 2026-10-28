// Liste les rushes Mixkit d'une ou plusieurs catégories : node spot/mixkit-video.mjs barber haircut …
//   → _raw/mv.json (id, titre, aperçu) + vignettes _raw/mv/<id>.jpg   (Mixkit Free License, usage commercial autorisé)
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import { homedir } from 'node:os'

const base = path.join(homedir(), '.cache/puppeteer/chrome')
const exe = path.join(base, fs.readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const browser = await puppeteer.launch({ executablePath: exe, headless: true })
const page = await browser.newPage()
fs.mkdirSync('_raw/mv', { recursive: true })
const all = fs.existsSync('_raw/mv.json') ? JSON.parse(fs.readFileSync('_raw/mv.json', 'utf8')) : []
for (const cat of process.argv.slice(2)) {
  await page.goto(`https://mixkit.co/free-stock-video/${cat}/`, { waitUntil: 'networkidle2', timeout: 90000 }).catch(() => {})
  const items = await page.evaluate(() => [...document.querySelectorAll('video')].map((v) => {
    const card = v.closest('.item-grid-card, article') || v.parentElement
    const src = v.getAttribute('src') || (v.querySelector('source') || {}).src || ''
    const id = (src.match(/videos\/(\d+)\//) || [])[1]
    const t = card && card.querySelector('h2, h3, .item-grid-card__title')
    return id ? { id, title: t ? t.innerText.trim() : '', poster: v.poster || '' } : null
  }).filter(Boolean))
  console.log(cat, '→', items.length)
  for (const it of items) {
    if (all.some((a) => a.id === it.id)) continue
    all.push({ cat, ...it })
    if (it.poster) fs.writeFileSync(`_raw/mv/${it.id}.jpg`, Buffer.from(await (await fetch(it.poster)).arrayBuffer()))
  }
}
fs.writeFileSync('_raw/mv.json', JSON.stringify(all, null, 1))
await browser.close()
