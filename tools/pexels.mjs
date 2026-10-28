// node tools/pexels.mjs "requête" … → liste des photos Pexels (id, alt, url) via un vrai Chrome
import puppeteer from 'puppeteer-core'
import { readdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome')
const exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled', '--lang=en-US'] })
const page = await browser.newPage()
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36')
await page.evaluateOnNewDocument(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }))
const all = existsSync('_raw/pexels.json') ? JSON.parse(readFileSync('_raw/pexels.json', 'utf8')) : []
for (const q of process.argv.slice(2)) {
  await page.goto(`https://www.pexels.com/search/${encodeURIComponent(q)}/?orientation=${process.env.OR||"landscape"}`, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
  await new Promise((r) => setTimeout(r, 2500))
  const items = await page.evaluate(() => [...new Map([...document.querySelectorAll('a[href*="/photo/"]')].map((a) => {
    const img = a.querySelector('img')
    const src = img ? (img.currentSrc || img.src || '').split('?')[0] : ''
    return [src, a.getAttribute('href').replace(/^.*\/photo\//, '').replace(/\/$/, '')]
  }).filter(([s]) => s.includes('images.pexels.com/photos/'))).entries()].map(([src, alt]) => ({ src, alt })))
  const title = await page.title()
  console.log(q, '→', items.length, '|', title.slice(0, 50))
  items.slice(0, 8).forEach((it) => { if (!all.some((a) => a.src === it.src)) all.push({ n: all.length, q, ...it }) })
}
writeFileSync('_raw/pexels.json', JSON.stringify(all, null, 1))
await browser.close()
