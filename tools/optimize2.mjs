// node tools/optimize2.mjs — photos v2 (Pexels + Instagram du client) → public/img/*.webp
import sharp from 'sharp'
import { readdirSync } from 'node:fs'
const out = (n) => `public/img/${n}.webp`
for (const f of readdirSync('_raw/full2')) {
  const n = f.replace(/\.jpg$/, '')
  let img = sharp(`_raw/full2/${f}`)
  if (n.startsWith('ic-')) img = img.resize(120, 120, { fit: 'cover', position: 'attention' })
  await img.webp({ quality: 78 }).toFile(out(n))
}
await sharp('_raw/hero2-cut.png').trim().resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 86, alphaQuality: 90 }).toFile(out('hero'))
// photos réelles (Instagram 360–640 px) : agrandissement modéré + accentuation légère
const real = (src, w, h, position = 'centre') => sharp(src).resize(w, h, { fit: 'cover', position, kernel: 'lanczos3' }).sharpen({ sigma: 0.6 }).webp({ quality: 84 })
const a = await real('_client/up/teeth-smile.png', 330, 420).toBuffer()
const b = await real('_client/up/teeth-close.png', 330, 420).toBuffer()
await sharp({ create: { width: 668, height: 420, channels: 3, background: '#fff' } }).composite([{ input: a, left: 0, top: 0 }, { input: b, left: 338, top: 0 }]).webp({ quality: 84 }).toFile(out('serv-2'))
await real('_client/igimg/2.jpg', 560, 324).toFile(out('gal-1'))
await real('_client/igimg/5.jpg', 560, 420).toFile(out('gal-2'))
await real('_client/igimg/3.jpg', 480, 360, 'top').toFile(out('gal-3'))
await real('_client/igimg/7.jpg', 560, 324, 'top').toFile(out('gal-4'))
const logo = await sharp('_client/igimg/8.jpg').resize({ height: 488 }).toBuffer()
await sharp({ create: { width: 1332, height: 488, channels: 3, background: '#000' } }).composite([{ input: logo, gravity: 'centre' }]).webp({ quality: 84 }).toFile(out('gal-5'))
await sharp('_client/igimg/8.jpg').resize(240, 240).webp({ quality: 84 }).toFile(out('logo'))
for (const n of ['hero', 'serv-2', 'gal-1']) { const m = await sharp(out(n)).metadata(); console.log(n, m.width, m.height) }
