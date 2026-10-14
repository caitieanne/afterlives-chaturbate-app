# Character roster: the sassy fruit

A play on the cheeky emoji the site already talks in. Cute, flirty, never explicit, and never anyone real.

| Character | Emoji | Who | Look |
| --- | --- | --- | --- |
| **Peachy** | 🍑 | Fem. Fuzzy and fierce, always the favorite | Round fuzzy peach, siren eyes with winged liner, glossy lips, red heeled boots |
| **The Cherries** | 🍒 | Fem pair. Double trouble, always gossiping | Two cherries joined at the stem, siren eyes, one throwing a peace sign |
| **Eggy** | 🍆 | Masc. Too cool for this, unbothered | Glossy eggplant with a leafy crown, arms crossed, sneakers |
| **Bananzo** | 🍌 | Masc. The main character, fabulous | Banana with the peel half open, cocky brows, thumbs up, sneakers, no glasses |

## How they live

Each one lives in the room the broadcaster picks (see `src/overlay/life.js`): walks between the room's spots, poses on the bed or couch,
sits at the desk typing into the room's own computer, dances on the rug, gazes out of the window, and gets smaller the further back they
go. Tips, goals and chat commands interrupt: they turn to the camera and react.

## Animations (PixelLab, the same set for every character)

idle, walk (side, mirrored for the other way), desk, lounge, dance, wink, kiss, wave, party, buzz.

Frames live in `art/characters/<name>/<anim>/0.png ...`; `npm run pack` turns each into a strip, and the build bakes them in.
PixelLab character IDs are in `art/characters/pixellab-ids.json`.
