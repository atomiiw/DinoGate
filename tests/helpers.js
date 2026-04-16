const path = require("path");

const DINOGATE_URL =
  "file://" + path.resolve(__dirname, "..", "gate", "dinogate.html");

/**
 * Inject a minimal chrome.* stub before the page scripts run.
 * Call this via page.addInitScript() BEFORE navigating.
 */
const CHROME_STUB = `
  window.chrome = {
    runtime: {
      sendMessage(msg, cb) {
        window.__lastChromeMessage = msg;
        if (cb) cb({ ok: true });
      }
    },
    storage: {
      local: {
        get(key, cb) { cb && cb({}); },
        set(obj, cb) { cb && cb(); }
      }
    }
  };
`;

/**
 * Navigate to dinogate.html with Chrome APIs stubbed.
 */
async function openGatePage(page) {
  await page.addInitScript(CHROME_STUB);
  await page.goto(DINOGATE_URL);
  // The real Chromium Runner creates .runner-canvas dynamically on init.
  await page.waitForSelector(".runner-canvas");
}

/**
 * Press Space to start/restart the game.
 */
async function pressSpace(page) {
  await page.keyboard.press("Space");
}

/**
 * Let the game run for a given number of milliseconds.
 */
async function waitMs(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Get the current gate state from the DOM.
 * The real Runner exposes state via Runner.instance_.
 */
async function getGameInfo(page) {
  return page.evaluate(() => {
    const streak = document.getElementById("streak").textContent;
    const unlockVisible = document
      .getElementById("unlock-area")
      .classList.contains("visible");
    const proceedText = document.getElementById("proceed-link").textContent;
    const timeValue = document.getElementById("time-input").value;
    const isInverted = document.documentElement.classList.contains("inverted");
    const crashed = Runner.instance_ ? Runner.instance_.crashed : false;
    const playing = Runner.instance_ ? Runner.instance_.playing : false;
    return { streak, unlockVisible, proceedText, timeValue, isInverted, crashed, playing };
  });
}

/**
 * Force a game over with a specific displayed score.
 * Converts to raw distanceRan using the DistanceMeter coefficient (0.025).
 */
async function forceGameOver(page, displayedScore) {
  await page.evaluate((score) => {
    const runner = Runner.instance_;
    if (runner) {
      // The displayed score = distanceRan * COEFFICIENT (0.025)
      // So distanceRan = displayedScore / 0.025
      const coeff = runner.distanceMeter.config.COEFFICIENT;
      runner.distanceRan = score / coeff;
      runner.gameOver();
    }
  }, displayedScore);
}

module.exports = {
  DINOGATE_URL,
  CHROME_STUB,
  openGatePage,
  pressSpace,
  waitMs,
  getGameInfo,
  forceGameOver,
};
