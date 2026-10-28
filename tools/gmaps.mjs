// node tools/gmaps.mjs <cid> — texte de la fiche Google + avis visibles + URL des photos
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
await sleep(3500)
const main = await page.evaluate(() => document.querySelector('div[role="main"]')?.innerText || document.body.innerText)
const imgs = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.src).filter((s) => /googleusercontent|ggpht/.test(s) && !/\/a\/|\/a-\//.test(s)))
let reviews = ''
const tab = await page.$('button[role="tab"][aria-label*="Avis"]')
if (tab) { await tab.click(); await sleep(3500); reviews = await page.evaluate(() => document.querySelector('div[role="main"]')?.innerText || '') }
writeFileSync('_client/gmaps.txt', `${main}\n\n===== AVIS =====\n${reviews}\n\n===== IMAGES =====\n${[...new Set(imgs)].join('\n')}`)
console.log(main.slice(0, 2500)); console.log('===== AVIS =====\n' + reviews.slice(0, 4000)); console.log('images:', new Set(imgs).size)
await browser.close()
