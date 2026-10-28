// node tools/test-form.mjs — teste loader + formulaire RDV avec fetch/window.open simulés (aucun envoi réel)
import puppeteer from 'puppeteer-core'
import { readdirSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome')
const exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
mkdirSync('_raw/shots', { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.evaluateOnNewDocument(() => {
  window.__sent = []; window.__opened = []
  const real = window.fetch
  window.fetch = (url, opts) => {
    if (String(url).includes('formsubmit.co')) { window.__sent.push({ url, body: opts.body }); return Promise.resolve(new Response('{"success":"true"}', { status: 200 })) }
    return real(url, opts)
  }
  window.open = (u) => { window.__opened.push(u); return null }
})
const t0 = Date.now()
await page.goto('http://localhost:5960/')
await sleep(1500)
console.log('video t=', await page.$eval('#loader video', (v) => v.currentTime.toFixed(2) + ' paused=' + v.paused + ' ready=' + v.readyState))
await page.screenshot({ path: '_raw/shots/vid.png' })
while (await page.$('#loader') && Date.now() - t0 < 12000) await sleep(200)
console.log('loader gone after', ((Date.now() - t0) / 1000).toFixed(1), 's')
const q = (js) => page.evaluate(js)
await q(`document.querySelector('.serv:nth-child(2) [data-soin]').click()`); await sleep(2200)
console.log('preselect:', await q(`document.querySelector('#rdv-form').elements.soin.value`))
await q(`document.querySelector('#rdv-form [type=submit]').click()`); await sleep(300)
console.log('empty submit error:', await q(`document.querySelector('.f-error').hidden ? '(hidden)' : document.querySelector('.f-error').textContent`))
const next = (dow) => { const d = new Date(); do d.setDate(d.getDate() + 1); while (d.getDay() !== dow); return d.toISOString().slice(0, 10) }
await q(`(() => { const f = document.querySelector('#rdv-form').elements; f.nom.value = 'Test Cliente'; f.telephone.value = '0696 12 34 56'; f.email.value = 'test@example.com'; f.date.value = '${next(0)}'; f.date.dispatchEvent(new Event('change')); f.creneau.value = 'Matin (9 h – 12 h)'; f.consentement.checked = true })()`)
await q(`document.querySelector('#rdv-form [type=submit]').click()`); await sleep(300)
console.log('sunday error:', await q(`document.querySelector('.f-error').textContent`))
await q(`(() => { const f = document.querySelector('#rdv-form').elements; f.date.value = '${next(3)}'; f.date.dispatchEvent(new Event('change')) })()`)
console.log('wednesday late slot disabled:', await q(`document.querySelector('option.late').disabled`))
await page.screenshot({ path: '_raw/shots/rdv.png' })
await q(`document.querySelector('#rdv-wa').click()`); await sleep(200)
const wa = await q(`window.__opened[0] || ''`)
console.log('whatsapp url host:', wa.split('?')[0]); console.log(decodeURIComponent(wa.split('text=')[1] || ''))
await q(`document.querySelector('#rdv-form [type=submit]').click()`); await sleep(800)
const sent = await q(`window.__sent`)
console.log('formsubmit calls:', sent.length, sent[0]?.url); console.log(sent[0]?.body)
console.log('success shown:', await q(`!document.querySelector('.f-success').hidden`))
await page.screenshot({ path: '_raw/shots/rdv-ok.png' })
await browser.close()
