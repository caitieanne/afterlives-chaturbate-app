# Afterlives: Cam Cryptid (a Chaturbate app)

A little cryptid for your Chaturbate stream. It lives in a **broadcast overlay** (a see-through page you add to OBS) and reacts to what happens in
your room: tips set off a wink, a kiss, a dance or a party; a fan club join gets a party; newcomers get a wave; chat can play with it for free.
Three characters to choose from, all drawn in pixel art by the overlay's own script (no images, no outside files):

| Character | Who |
| --- | --- |
| **Lumi** | A fluffy moth cryptid drawn to your ring light, in heart-shaped sunglasses and a pink feather boa. Tips make the ring light flare. |
| **Boo** | A cam ghost with a headset, a hair bow and a tiny webcam on a stick with a blinking REC light. |
| **Bigfoot** | A blurry influencer with a selfie stick and round sunglasses, who is always a little out of focus, like cryptid evidence, until something happens. |

It is cute and teasing, nothing explicit, so it sits within Chaturbate's app content rules. Part of the Afterlives family of cozy cryptid games (afterlives.app).

## How it follows Chaturbate's rules (devportal.cb.dev)

- **No outside calls or scripts:** the overlay is one HTML slot and one JS slot, with no images, fonts or requests of its own.
- **Overlay is read only:** it only listens to `$overlay.on('react', ...)`; it sends nothing.
- **Tokens only:** nothing in the app or its text asks for money or any other payment method, and it collects no personal information.
- **No hidden behaviour:** everything the app does is listed in `LISTING.md` (the description to paste in), including that chat can use `/wink /kiss /dance /party`.
- **Not obfuscated, MIT-0 licensed** (as the portal's terms require of submissions).

## Put it in the Developer Portal

1. `npm run build` (or `node tools/build.js`) makes `dist/` with one file per slot, numbered in the order below. Open `dist/preview.html` to try it first.
2. In devportal.cb.dev, **Create new app** and name it. Fill in the summary and description from `LISTING.md`.
3. Paste each file into its slot:

   | File | Slot in the IDE |
   | --- | --- |
   | `1-app-shared-code.js` | Shared code |
   | `2-handler-tip-received.js` | Event handler: Tip Received |
   | `3-handler-chat-message.js` | Event handler: Chat Message |
   | `4-handler-user-enter.js` | Event handler: User Enter |
   | `5-handler-fanclub-join.js` | Event handler: Fanclub Join |
   | `6-overlay-cryptid-html.html` | Broadcast Overlay named `cryptid`: HTML |
   | `7-overlay-cryptid-js.js` | Broadcast Overlay `cryptid`: JS |
   | `8-overlay-shared-code.js` | Broadcast Overlay `cryptid`: Shared code |

4. Add the **settings** below (click the "+" beside `$settings`; the names must match exactly, and a setting's type cannot be changed once made).
5. Test on the Testbed, then **Release**.

### Settings to create

| Name | Type | Default | What it does |
| --- | --- | --- | --- |
| `character` | choice or text: `lumi`, `boo`, `bigfoot` | `lumi` | Which cryptid |
| `pet_name` | text | (the character's name) | Shown on the name tag and in chat lines |
| `console_shape` | choice or text: `coffin`, `moon`, `heart`, `star`, `box`, `diamond`, `harlequin`, `circle`, `none` | `coffin` | The handheld console the cryptid lives in (`none`: it stands on the stream by itself) |
| `room` | choice or text: `dusk`, `zen`, `cyber`, `campfire`, `academia`, `boutique`, `vaporwave`, `starship`, `studio`, `slime`, `cottage`, `neon`, `goth`, `music`, `rooftop`, `gym`, `library`, `dreamy` | `dusk` | What the console's screen shows: the drawn dusk sky, or one of the painted rooms |
| `console_color` | choice or text: `cauldron`, `nessie`, `gloomberry`, `coven`, `ghoul_gum`, `vampire`, `pumpkin`, `slime`, `tombstone`, `ghost` | `coven` | The console's see-through plastic (the Afterlives game's console colors) |
| `tip_wink` | number | 1 | Tokens for a wink (empty or 0 = off) |
| `tip_kiss` | number | 5 | Tokens for a kiss |
| `tip_dance` | number | 15 | Tokens for a dance |
| `tip_party` | number | 50 | Tokens for a party |
| `show_menu` | checkbox | off | Show the tip menu on the overlay |
| `chat_commands` | checkbox | on | Chat can use `/wink /kiss /dance /party` (one per person every 10 seconds) |
| `greet` | checkbox | on | The cryptid waves at followers and token holders who come in |
| `thank_in_chat` | checkbox | off | Also thank tippers with a notice in chat |

A tip sets off the priciest reaction it reaches, and a tip below all of them still gets a wink, so every tip is answered. The amounts are the
broadcaster's to change any time in the app's settings screen.

### Add the overlay to OBS

In the app's page on Chaturbate, copy the overlay `cryptid` address and add it to OBS as a Browser source (480 x 360 is the recommended size).
It is see-through, so place it over your scene.

## Developing

- `art/rooms/*.webp` are the painted rooms (240 x 320). The build bakes them into the overlay's JS slot as image addresses, since the overlay may
  not load image files; that makes the slot about 580 KB. If the portal caps slot size below that, drop rooms from `art/rooms` (each is 25 to 45 KB).
- `src/overlay/console.js` is the console: its eight shapes, ten colors and layout. It goes in the overlay's JS slot ahead of `overlay.js`. The screen
  shows the room from the `room` setting (the `BACKDROP` part).
- `src/shared.js` is the tip rules (`pickReaction`, `commandReaction`, `menuOf`), used by both the app and the overlay.
- `src/handlers/*.js` are the event handlers; `src/overlay/overlay.{html,js}` is the overlay.
- `npm test` checks the tip rules. `dist/preview.html` runs the overlay against a pretend `$overlay` and `$settings`
  (`?character=boo&show_menu=1&tip_kiss=10`) with buttons for each reaction. Serve `dist/` with any static server.
- API names come from devportal.cb.dev: `$tip.tokens`, `$tip.isAnon`, `$user.username`, `$overlay.emit` / `$overlay.on`, `$settings`, `$kv`, `$room.sendNotice`,
  `$message.body`, `$user.isFollower`, `$user.hasTokens`. It has **not** been run on Chaturbate's Testbed yet (that needs a login), so test there before releasing.
