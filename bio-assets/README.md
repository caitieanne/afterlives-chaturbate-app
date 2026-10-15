# caitie-bio: images for the Chaturbate profile bio

A standalone, assets-only Cloudflare Worker (`caitie-bio`) that serves the pictures used in `chaturbate-bio.html`,
so the bio never loads anything from afterlives.app. It has no code, only the files in `public/`:

| Path | What |
| --- | --- |
| `/campal/{peachy,cherries,eggy,bananzo}.png` | Cam Pal characters (idle frame 0 from `art/characters/`) |
| `/cryptids/{ghost,sasquatch,swampMonster,mothman,jerseyDevil}.png` | Afterlives adult sprites |
| `/town/noirleans.png` | Noirleans town art |

Live at `https://caitie-bio.caitie.workers.dev/<path>` once deployed.

## Deploy

Either run `npx wrangler deploy` from this folder, or connect the repo in the Cloudflare dashboard
(Workers & Pages, Create, Import a repository) with **root directory** `bio-assets`.

## The bio

`chaturbate-bio.html` is the snippet to paste into Chaturbate's About Me box. It isn't in `public/`, so the Worker doesn't serve it.

## Art license

The images in `public/` are Caitie Rage's original art, all rights reserved. Unlike the code in this repo they are
**not** covered by its MIT-0 license.
