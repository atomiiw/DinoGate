# DinoGate — Basic QA

What each automated test does, in plain English.

---

## Page Load

Does the gate page look right when you first open it?

- **Fake offline message shows up** — The page should say "No internet" and "ERR_INTERNET_DISCONNECTED" so it looks like Chrome's real offline screen.
- **Runner canvas is created** — The real Chromium Runner engine should inject its `.runner-canvas` element into the page on init.
- **Streak counter is blank** — No progress should show before the user has played any rounds.
- **Unlock area is hidden** — The "proceed to instagram" link and time picker shouldn't be visible until earned.
- **Time input defaults to 600 seconds** — A reasonable 10-minute default so the user doesn't have to think about it.
- **Time input enforces 1–7200 range with integer step** — The min, max, and step=1 attributes are set so the browser rejects decimals and nonsense values.
- **Proceed link is empty** — No link text should appear until the user actually unlocks access.

## Gameplay

Does the dino game work the way a player would expect?

- **Space starts the game** — Pressing Space should put the Runner into playing state.
- **Distance increases while running** — After a couple seconds, the Runner's distance counter should be greater than zero.
- **Dino actually jumps** — Pressing Space mid-game should set the T-Rex into its jumping state, not just do nothing.
- **Forced game over sets crashed state** — Triggering a collision puts the Runner into crashed mode correctly.
- **You can restart after dying** — After crashing, calling restart resets the Runner to playing with crashed=false.
- **Game over panel exists after crash** — When you crash, the Runner creates its gameOverPanel object for the restart UI.
- **Spamming Space doesn't break anything** — Mashing the spacebar rapidly shouldn't crash the Runner or put it in an undefined state.

## Gate Logic

Does the streak-based unlock system work correctly?

- **Scoring 500+ counts toward your streak** — A round ending with score >= 500 should bump the streak counter by one.
- **Scoring under 500 resets the streak** — One bad round wipes your progress back to zero. Harsh but that's the point.
- **Three good rounds in a row unlocks access** — After 3 consecutive 500+ scores, the proceed link and time input should appear.
- **Proceed link says the right thing** — It should read "proceed to instagram.com" so the user knows where they're going.
- **Streak progress shows as "1/3", "2/3"** — The user can see how close they are to unlocking.
- **Streak display disappears once unlocked** — No need to show "3/3", just show the proceed option instead.
- **Failing after unlocking hides the proceed option** — If you play another round and score low, you lose your unlock and have to earn it again.
- **Clicking proceed sends the right message to Chrome** — The extension background script should receive the domain and the number of seconds the user entered.
- **Negative time input gets clamped to 1 second** — Entering -5 gets floored to 1 by the Math.max guard.
- **Entering 99999 seconds gets clamped to 7200** — Two hours (7200s) is the max, no matter what you type.
- **Leaving the time input blank defaults to 600 seconds** — If someone clears the field and clicks proceed, it falls back to 600s (10 minutes).
- **Decimal input gets floored to an integer** — Entering 45.7 results in 45 seconds. Only whole seconds are allowed.

## Edge Cases

Can a real person break this by doing weird stuff?

- **ArrowDown before starting does nothing** — Pressing duck before the game begins shouldn't crash the Runner or trigger a game start.
- **Mashing random keys mid-game is fine** — Hitting letters, Escape, Enter, Tab, numbers — none of it should crash the game loop.
- **Holding Space doesn't double-jump** — Keeping Space pressed should only trigger one jump, not launch the dino into orbit.
- **Dying and restarting 3 times in a row is stable** — Rapid play-die-restart cycles shouldn't accumulate broken state.
- **Clicking outside the game area is harmless** — Clicking on the "No internet" text or elsewhere shouldn't interfere with gameplay.
- **Resizing the browser window mid-game doesn't crash it** — Shrinking or expanding the window while playing shouldn't throw errors.
- **Non-numeric time input doesn't crash** — If someone forces letters into the time field via JS, the browser sanitizes it to an empty string; the code falls back gracefully.
- **Negative time input is accepted by the DOM** — You can force -5 into the field via JS; the clamping happens at proceed-click time (tested in Gate Logic).
- **Page starts in normal mode (not inverted)** — Night mode inversion on the `<html>` element shouldn't be active when the page first loads.
- **ArrowUp also starts the game** — Not just Space — ArrowUp is an alternate way to begin, matching Chrome's real dino game.
