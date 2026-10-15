# Handoff: Chaturbate bio + Cam Pal goal panel

Pick this up locally with Claude Code: open this repo, paste the "Prompt to start with" below, and keep Claude in Chrome connected. Several of the next steps need pages you're signed in to (Chaturbate devportal, Cloudflare dashboard).

## Where things stand

**Profile bio** (`bio-assets/`)
- `chaturbate-bio.html` is the latest bio. Paste it into Chaturbate's About Me. It's built by `build-bio.py`; edit the copy there and rebuild, rather than editing the HTML by hand.
- Chaturbate drops styling on `<style>`, `<div>` and `<table>`, but kept it on `<span>`, `<a>` and `<img>`. So the bio uses only those three, with every style inline. Whether the black background holds hasn't been checked on Chaturbate yet. **First thing to do:** paste it and look.
  - If the background still comes out white, there are two fallbacks: a light version (dark text on white), or each section rendered as one image with the real buttons underneath.
- Images are served by the Cloudflare Worker `caitie-bio`, at https://caitie-bio.caitie.workers.dev/, from `bio-assets/public/`: the avatar, the Noirleans town image, the cryptid and Cam Pal sprites, and the title images. The Worker's address is blank by design; the images are at paths like `/avatar.png`.
- The section titles are images, made with `make-titles.py`, because web fonts can't load without `<style>`.
- Production builds from `main` work. Builds of other branches fail (red "Workers Builds: caitie-bio" check on PRs). The cause is unknown; the error is only in the Cloudflare dashboard log. Either read that log, or untick "Builds for non-production branches".
- **Afterlives must stay separate from adult sites.** Never hotlink afterlives.app images from the bio. The two afterlives.app buttons use `rel="noopener noreferrer"`.

**Copy rules for the bio:** edgy in a sweet way, showing off that Caitie made all of it. Not condescending, not "cute". No em dashes. Never use "baby" or "babies", or anything that sounds young. Say "virtual pet", never "Tamagotchi". The footer is just "18+ only."

**Cam Pal app**
- Merged in #14: while a tip goal is set, the goal goes in the room subject via `$room.setSubject`. Settings: `goal_in_subject` and `room_subject`.
- Not yet released or tested on Chaturbate. To release: `npm run build`, paste the changed `dist/` files into the devportal, then test on the Testbed.

## Next task: a custom goal box under the video (the broadcast panel)

Chaturbate's v2 apps can draw the panel under the video using `$room.setPanelTemplate()` and `$room.reloadPanel()`, plus a "Broadcast Panel Update" event handler. The exact template format still needs to be read from the devportal docs, which need a sign-in:
- https://devportal.cb.dev/wiki/api/$room
- the Broadcast Panel / panel template pages

Old v1 docs mention text layouts like `3_rows_12_21_31`. Branded panels are probably an image template: a background image uploaded to the app's Images, with text layered on top. Unconfirmed.

Goal for the panel: Caitie's black `#09090b` and hot pink `#ff0066` style, Bebas Neue, the goal name and a progress bar. Optionally the chosen Cam Pal character. It should update on tips (the goal progress is in `$kv` as `goal_progress`; `goalState()` in `src/shared.js`). Keep `LISTING.md` up to date, because the portal doesn't allow hidden behaviour.

## Prompt to start with

> Read docs/handoff.md. Use Claude in Chrome to read the Chaturbate devportal docs for the broadcast panel ($room.setPanelTemplate, $room.reloadPanel, the Broadcast Panel Update event and the panel templates). Then plan a Cam Pal goal panel in my black and pink style that shows the tip goal and updates on tips. Show me the plan before building it.
