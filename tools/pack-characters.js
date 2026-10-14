#!/usr/bin/env node
// Packs each character's animation frames (art/characters/<name>/<anim>/0.png, 1.png ...: PixelLab frames) into one WebP strip per
// animation (art/characters/<name>/<anim>.webp). PixelLab's frames come in different canvas sizes (96, 124, 128, even 96 x 124), so every
// frame is placed in one square cell per character, centred across and with the feet on the same line (FEET of the way down), so the
// character never jumps between animations. The cell size goes in art/characters/<name>/cell.json for the build. Run after adding or
// replacing frames:   npm run pack
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, '..', 'art', 'characters');
/** Where the feet sit in the cell, as a fraction of its height (life.js draws with the same number). */
const FEET = 0.84;
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'characters.json'), 'utf8'));

/** A frame's size and its lowest non-clear row (the feet). A failed download leaves an error message where a frame should be: say which. */
async function measure(file) {
  const img = sharp(file).ensureAlpha();
  const { data, info } = await img
    .raw()
    .toBuffer({ resolveWithObject: true })
    .catch(() => {
      throw new Error(file + ' is not an image: download it again');
    });
  let bottom = 0;
  for (let y = info.height - 1; y >= 0 && !bottom; y--) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 10) {
        bottom = y;
        break;
      }
    }
  }
  return { w: info.width, h: info.height, bottom };
}

(async () => {
  for (const [name, chr] of Object.entries(manifest)) {
    // every frame of every animation, measured
    const anims = {};
    for (const anim of Object.keys(chr.anims)) {
      const dir = path.join(DIR, name, anim);
      const files = fs
        .readdirSync(dir)
        .filter(f => /^\d+\.png$/.test(f))
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(f => path.join(dir, f));
      const sizes = [];
      for (const f of files) sizes.push(await measure(f));
      // one feet line per animation (its lowest point), so the animation itself does not bob off its own baseline
      anims[anim] = { files, sizes, feet: Math.max(...sizes.map(s => s.bottom)) };
    }
    // a cell big enough for every frame with its feet on the line
    let cell = 124;
    for (const a of Object.values(anims)) {
      for (const s of a.sizes) {
        cell = Math.max(cell, s.w, Math.ceil((a.feet + 1) / FEET), Math.ceil((s.h - a.feet) / (1 - FEET)) + 2);
      }
    }
    const line = Math.round(cell * FEET);
    for (const [anim, a] of Object.entries(anims)) {
      const parts = a.files.map((f, i) => ({ input: f, left: i * cell + Math.round((cell - a.sizes[i].w) / 2), top: Math.max(0, line - a.feet) }));
      const out = path.join(DIR, name, anim + '.webp');
      await sharp({ create: { width: a.files.length * cell, height: cell, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite(parts)
        .webp({ lossless: true })
        .toFile(out);
      console.log(name + '/' + anim + ': ' + a.files.length + ' frames, ' + Math.round(fs.statSync(out).size / 1024) + ' KB');
    }
    fs.writeFileSync(path.join(DIR, name, 'cell.json'), JSON.stringify({ cell }) + '\n');
    console.log(name + ': ' + cell + ' px cell');
  }
})();
