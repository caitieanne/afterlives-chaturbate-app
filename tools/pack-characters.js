#!/usr/bin/env node
// Packs each character's animation frames (art/characters/<name>/<anim>/0.png, 1.png ...: PixelLab frames) into one WebP strip per
// animation (art/characters/<name>/<anim>.webp), every frame centred on a 124 px square so all animations line up. tools/build.js then
// bakes the strips into the overlay. Run after adding or replacing frames:   npm run pack
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, '..', 'art', 'characters');
const CELL = 124;
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'characters.json'), 'utf8'));

(async () => {
  for (const [name, chr] of Object.entries(manifest)) {
    for (const anim of Object.keys(chr.anims)) {
      const dir = path.join(DIR, name, anim);
      const frames = fs
        .readdirSync(dir)
        .filter(f => /^\d+\.png$/.test(f))
        .sort((a, b) => parseInt(a) - parseInt(b));
      const parts = [];
      for (let i = 0; i < frames.length; i++) {
        // a download that failed (PixelLab "too busy", say) leaves an error message where a frame should be: say which one
        const meta = await sharp(path.join(dir, frames[i]))
          .metadata()
          .catch(() => {
            throw new Error(path.join(dir, frames[i]) + ' is not an image: download it again');
          });
        parts.push({ input: path.join(dir, frames[i]), left: i * CELL + Math.round((CELL - meta.width) / 2), top: Math.round((CELL - meta.height) / 2) });
      }
      const out = path.join(DIR, name, anim + '.webp');
      await sharp({ create: { width: frames.length * CELL, height: CELL, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite(parts)
        .webp({ lossless: true })
        .toFile(out);
      console.log(name + '/' + anim + ': ' + frames.length + ' frames, ' + Math.round(fs.statSync(out).size / 1024) + ' KB');
    }
  }
})();
