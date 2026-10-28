// node tools/sheet.mjs <dir> <out.png> [cols] — numbered contact sheet
import sharp from 'sharp'
import { readdirSync } from 'node:fs'
const [dir, out, cols = 8] = process.argv.slice(2)
const files = readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b))
const W = 180, H = 135
const tiles = await Promise.all(files.map(async (f, i) => ({
  input: await sharp(`${dir}/${f}`).resize(W, H, { fit: 'cover', position: 'top' }).composite([{ input: Buffer.from(`<svg width="${W}" height="${H}"><rect width="34" height="20" fill="#000"/><text x="4" y="15" font-size="15" fill="#ff0" font-family="Arial">${parseInt(f)}</text></svg>`), top: 0, left: 0 }]).png().toBuffer(),
  left: (i % cols) * (W + 4), top: Math.floor(i / cols) * (H + 4),
})))
await sharp({ create: { width: cols * (W + 4), height: Math.ceil(files.length / cols) * (H + 4), channels: 3, background: '#fff' } }).composite(tiles).png().toFile(out)
