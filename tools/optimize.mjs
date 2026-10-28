// node tools/optimize.mjs — _raw/full/*.jpg + _raw/hero-cut.png → public/img/*.webp
import sharp from 'sharp'
import { readdirSync } from 'node:fs'
for (const f of readdirSync('_raw/full')) {
  const name = f.replace(/\.jpg$/, '')
  if (name === 'hero') continue
  let img = sharp(`_raw/full/${f}`)
  if (name.startsWith('av-')) img = img.resize(160, 160, { fit: 'cover', position: 'attention' })
  await img.webp({ quality: 78 }).toFile(`public/img/${name}.webp`)
}
await sharp('_raw/hero-cut.png').trim().resize({ width: 1300, withoutEnlargement: true }).webp({ quality: 86, alphaQuality: 90 }).toFile('public/img/hero.webp')
const m = await sharp('public/img/hero.webp').metadata(); console.log('hero', m.width, m.height)
