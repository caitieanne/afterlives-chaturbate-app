# Afterlives: Cam Cryptid (a Chaturbate app)

A little cryptid for your Chaturbate stream. It lives in a **broadcast overlay** (a see-through page you add to OBS) and reacts to what happens in
your room: tips set off a wink, a blush, a kiss, a vibe, a dance, a smooch, a twerk or a party; a fan club join gets a party; newcomers get a wave; chat can play with it for free.
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

1. `npm run build` (or `node tools/build.js`) makes `dist/` with one file per slot, numbered as below. Open `dist/preview.html` to try it first.
2. In devportal.cb.dev, **Create new app** and name it. Fill in the summary and description from `LISTING.md`.
3. Paste each file into its slot:

   | File | Slot in the IDE |
   | --- | --- |
   | `1-app-shared-code.js` | Shared code |
   | `2-handler-tip-received.js` | Event handler: Tip Received |
   | `3-handler-chat-message.js` | Event handler: Chat Message |
   | `4-handler-user-enter.js` | Event handler: User Enter |
   | `5-handler-fanclub-join.js` | Event handler: Fanclub Join |
| `9-handler-broadcast-start.js` | Event handler: Broadcast Start |
| `10-handler-app-start.js` | Event handler: App Start |
| `11-handler-app-settings-change.js` | Event handler: App Settings Change |
| `12-handler-callback.js` | Event handler: Callback |
   | `6-overlay-cryptid-html.html` | Broadcast Overlay named `cryptid`: HTML |
   | `7-overlay-cryptid-js.js` | Broadcast Overlay `cryptid`: JS |
   | `8-overlay-shared-code.js` | Broadcast Overlay `cryptid`: Shared code |

4. Add the **settings** in one go: open the IDE's **Advanced Settings** and paste `0-advanced-settings.json`. That makes the whole settings page,
   in Chaturbate's own style, with sections (Your character, Look, Tip menu, Tip goal, Chat), dropdowns, a color picker and plain descriptions.
   (The table below lists the same settings, for reference or for creating them by hand with the "+" beside `$settings`.)
5. Test on the Testbed, then **Release**.

### The settings (all in `0-advanced-settings.json`)

| Name | Type | Default | What it does |
| --- | --- | --- | --- |
| `character` | choice or text: `lumi`, `boo`, `bigfoot` | `lumi` | Which cryptid |
| `pet_name` | text | (the character's name) | Shown on the name tag and in chat lines |
| `console_shape` | choice or text: `coffin`, `moon`, `heart`, `star`, `box`, `diamond`, `harlequin`, `circle`, `none` | `coffin` | The handheld console the cryptid lives in (`none`: it stands on the stream by itself) |
| `room` | choice or text: `dusk`, `zen`, `cyber`, `campfire`, `academia`, `boutique`, `vaporwave`, `starship`, `studio`, `slime`, `cottage`, `neon`, `goth`, `music`, `rooftop`, `gym`, `library`, `dreamy` | `dusk` | What the console's screen shows: the drawn dusk sky, or one of the painted rooms |
| `console_color` | color picker (hex), or a name: `midnight`, `blue_raspberry`, `blueberry`, `violet`, `bubblegum`, `cherry`, `tangerine`, `lime`, `smoke`, `frost` | Violet (`#8a47d6`) | The console's see-through plastic |
| `tip_wink` | number | 1 | Tokens for a wink (empty or 0 = off) |
| `tip_blush` | number | 3 | Tokens for a shy blush (hides behind its hands, then peeks out) |
| `tip_kiss` | number | 5 | Tokens for a kiss |
| `tip_vibe` | number | 10 | Tokens for a vibe (buzzes and shakes all over) |
| `tip_dance` | number | 15 | Tokens for a dance |
| `tip_party` | number | 50 | Tokens for a party |
| `tip_menu_in_chat` | checkbox | on | Post the tip menu in chat on a timer (like a Lovense menu) |
| `tip_menu_every` | number | 10 | Minutes between tip menu posts (2 to 120) |
| `console_position` | choice | Bottom right | Which corner of the stream it sits in |
| `chat_commands` | checkbox | on | Chat can use `/wink /kiss /dance /party` (one per person every 10 seconds) |
| `greet` | checkbox | on | The cryptid waves at followers and token holders who come in |
| `thank_in_chat` | checkbox | off | Also thank tippers with a notice in chat |
| `chat_notices_per_hour` | number | 10 | The most thank-you notices the app sends in an hour (0: none). The tip menu is not counted: it has its own timer |
| `speak_per_hour` | number | 6 | How many times an hour the cryptid says something on its own, like "Hydrate, chat!" (0: only when someone plays with it; at most 60) |
| `tip_goal` | number | (empty) | A tip goal in tokens. Empty or 0: no goal. Tips count toward it, and reaching it sets off a big celebration |
| `tip_goal_name` | text | Tip goal | What the goal is for, shown on the goal card |
| `show_goal` | checkbox | on | Show the goal card (name, progress bar, tokens so far) on the overlay |
| `goal_repeats` | checkbox | on | Once the goal is reached, start it again (off: it stays full until the next show) |
| `goal_reset_each_show` | checkbox | on | Start the goal from zero when a show starts (off: progress carries over between shows) |

A tip sets off the priciest reaction it reaches, and a tip below all of them still gets a wink, so every tip is answered. The amounts are the
broadcaster's to change any time in the app's settings screen.

### Add the overlay to OBS

In the app's page on Chaturbate, copy the overlay `cryptid` address and add it to OBS as a Browser source **the size of your whole canvas**
(for example 1920 x 1080), covering the scene. It is see-through, and everything it shows keeps to one corner (the `Corner` setting),
about a third of the stream tall, so it never covers you. The tip menu is posted in chat on a timer instead of shown on the overlay.

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
