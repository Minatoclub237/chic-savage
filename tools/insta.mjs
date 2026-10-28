// node tools/insta.mjs <handle> — bio, compteurs et liens de posts publics (sans connexion)
import puppeteer from 'puppeteer-core'
import { readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome')
const exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled', '--lang=fr-FR'] })
const page = await browser.newPage()
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36')
await page.evaluateOnNewDocument(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }))
await page.setViewport({ width: 1300, height: 1600 })
await page.goto(`https://www.instagram.com/${process.argv[2]}/`, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
await sleep(4000)
const btn = await page.$('[role="dialog"] [aria-label="Fermer"], [role="dialog"] [aria-label="Close"]'); if (btn) { await btn.click(); await sleep(1500) }
const data = await page.evaluate(() => ({
  title: document.title,
  og: document.querySelector('meta[property="og:description"]')?.content,
  desc: document.querySelector('meta[name="description"]')?.content,
  text: document.querySelector('header')?.innerText,
  posts: [...new Set([...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')].map((a) => a.href))],
  imgs: [...document.querySelectorAll('img')].map((i) => ({ src: i.src, alt: i.alt })).filter((i) => /cdninstagram|fbcdn/.test(i.src)),
}))
await page.screenshot({ path: '_client/insta.png' })
writeFileSync('_client/insta.json', JSON.stringify(data, null, 1))
console.log(JSON.stringify({ ...data, imgs: data.imgs.length }, null, 1).slice(0, 4000))
await browser.close()
