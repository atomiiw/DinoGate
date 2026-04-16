# DinoGate — Feature Plan

Chrome extension that blocks designated websites behind a dino game gate.

## Blocked Sites

- instagram.com (starting point, designed to support more later)

## How It Works

### Trigger

- When user navigates to a blocked site, the extension redirects to a local extension page (`dinogate.html`).
- Instagram never loads — no flash of content.

### Blocked Page

- Looks like Chrome's no-internet dino game page, but works while online.
- The dino game is a from-scratch clone of the Chrome offline runner.
- Page should feel native — like you just lost internet. The game is front and center.

### Unlock Mechanic

- User must score 500+ three consecutive times in a row.
- Failing any round (scoring below 500) resets the streak to 0.
- Streak progress is shown subtly — small unobtrusive text like "1/3" that feels part of the page, not a flashy UI element.

### After Unlocking

- A quiet "proceed to instagram.com" text link appears below the game. Not celebratory, not big — just a subtle option that says "you can go if you want to."
- Next to or near the link, a small input field to enter how many minutes they want to spend.
- If the user clicks "Play Again" instead of proceeding, and scores below 500 in that new round, the proceed link disappears and the streak resets.

### Time-Based Session

- When the user clicks proceed, Instagram is unblocked for the number of minutes they entered.
- After the timer expires, any navigation to Instagram redirects back to the dino gate.
- Timer is tracked in extension storage so it persists across tabs.

## Architecture

- **No popup** — everything lives on the blocked page DOM.
- **Manifest V3** Chrome extension.
- **Key files**:
  - `manifest.json` — extension config, permissions, redirect rules
  - `background.js` — service worker handling redirects and timer logic
  - `dinogate.html` — the blocked page
  - `dinogate.js` — dino game engine + unlock logic
  - `dinogate.css` — styling to match Chrome's native no-internet page look

## Design Principles

- **Exact Chrome replication**: The blocked page uses the actual Chromium open-source dino game code (`offline.js`, `offline.css`, sprite sheets) — not a custom clone. The page title, layout, error message, and game must be indistinguishable from Chrome's real "No internet" page. DinoGate-specific UI (streak counter, proceed link, time input) is added subtly below the game area.
- Subtle, native-feeling UI. Nothing should scream "blocker app."
- The streak counter, proceed link, and time input should feel like quiet parts of the page, not loud interactive widgets.
- Publish-ready code quality, even though it's personal use for now.
