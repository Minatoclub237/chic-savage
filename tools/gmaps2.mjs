// node tools/gmaps2.mjs <cid> — liens, horaires et photos de la fiche Google
import puppeteer from 'puppeteer-core'
import { readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome')
const exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--lang=fr-FR'] })
const page = await browser.newPage()
await page.setViewport({ width: 1400, height: 1000 })
await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9' })
await page.goto(`https://www.google.com/maps?cid=${process.argv[2]}&hl=fr`, { waitUntil: 'networkidle2', timeout: 60000 })
const consent = await page.$('form[action*="consent"] button, button[aria-label*="Tout accepter"]')
if (consent) { await consent.click(); await sleep(4000) }
await sleep(3000)
const links = await page.evaluate(() => [...document.querySelectorAll('div[role="main"] a[href]')].map((a) => a.href).filter((h) => !/google\./.test(h)))
const labels = await page.evaluate(() => [...document.querySelectorAll('div[role="main"] [aria-label]')].map((e) => e.getAttribute('aria-label')).filter((l) => /lundi|mardi|heure|Horaires|ouvert|Ouvre/i.test(l)))
const hoursBtn = await page.$('[aria-label*="horaires" i], [data-item-id="oh"], [jsaction*="openhours"]')
if (hoursBtn) { await hoursBtn.click().catch(() => {}); await sleep(2000) }
const table = await page.evaluate(() => [...document.querySelectorAll('table')].map((t) => t.innerText).join('\n---\n'))
await page.screenshot({ path: '_client/gmaps.png' })
const photoBtn = await page.$('button[aria-label*="Photo" i], button[jsaction*="heroHeaderImage"]')
let imgs = []
if (photoBtn) { await photoBtn.click().catch(() => {}); await sleep(4000); imgs = await page.evaluate(() => [...document.querySelectorAll('[style*="googleusercontent"], img')].map((e) => (e.src || e.style.backgroundImage || '')).filter((s) => /googleusercontent/.test(s) && !/\/a\/|\/a-\//.test(s))) }
const out = { links: [...new Set(links)], labels: [...new Set(labels)], table, imgs: [...new Set(imgs)] }
writeFileSync('_client/gmaps2.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1).slice(0, 3000))
await browser.close()
