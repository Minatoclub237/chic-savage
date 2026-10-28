// node tools/decontam.mjs in.png out.webp — retire le liseré blanc du détourage (fond blanc d'origine)
import sharp from 'sharp'
const [src, dst] = process.argv.slice(2)
const base = sharp(src).trim().resize({ width: 1100 }).ensureAlpha()
const { data, info } = await base.clone().raw().toBuffer({ resolveWithObject: true })
// masque rétréci : alpha flouté puis seuillé (≈ érosion de 3-4 px)
const alpha = await base.clone().extractChannel(3).blur(3).raw().toBuffer()
for (let p = 0, i = 0; i < data.length; i += 4, p++) {
  const shrunk = Math.max(0, Math.min(1, (alpha[p] / 255 - 0.74) / 0.22))
  const a = Math.min(data[i + 3] / 255, shrunk)
  if (a > 0 && a < 0.98) for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, (data[i + c] - (1 - a) * 255) / Math.max(a, 0.2)))
  data[i + 3] = Math.round(255 * a)
}
await sharp(data, { raw: info }).webp({ quality: 86, alphaQuality: 90 }).toFile(dst)
