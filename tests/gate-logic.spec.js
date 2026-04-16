// @ts-check
const { test, expect } = require("@playwright/test");
const { openGatePage, forceGameOver, waitMs, CHROME_STUB } = require("./helpers");

/**
 * These tests validate the gate/unlock system that sits on top of the game.
 *
 * Now that the Runner is a global singleton, we can drive game state directly
 * via Runner.instance_ and trigger game-over with forceGameOver(page, score).
 */

test.describe("Gate logic — streak, unlock, and proceed flow", () => {
  test("streak increments when score >= 50", async ({ page }) => {
    await openGatePage(page);

    await forceGameOver(page, 150);
    await expect(page.locator("#streak")).toHaveText("1/3");
  });

  test("streak resets to 0 when score < 50", async ({ page }) => {
    await openGatePage(page);

    // Build up a streak
    await forceGameOver(page, 200);
    await forceGameOver(page, 300);
    await expect(page.locator("#streak")).toHaveText("2/3");

    // Fail — score too low
    await forceGameOver(page, 50);
    await expect(page.locator("#streak")).toHaveText("");
  });

  test("unlock area appears after 3 consecutive qualifying rounds", async ({
    page,
  }) => {
    await openGatePage(page);

    await forceGameOver(page, 100);
    await expect(page.locator("#unlock-area")).not.toHaveClass(/visible/);

    await forceGameOver(page, 100);
    await expect(page.locator("#unlock-area")).not.toHaveClass(/visible/);

    await forceGameOver(page, 100);
    await expect(page.locator("#unlock-area")).toHaveClass(/visible/);
  });

  test("proceed link says 'go to instagram.com' after unlock", async ({
    page,
  }) => {
    await openGatePage(page);

    await forceGameOver(page, 200);
    await forceGameOver(page, 200);
    await forceGameOver(page, 200);

    await expect(page.locator("#proceed-link")).toHaveText(
      "go to instagram.com"
    );
  });

  test("streak display shows progress like 2/3", async ({ page }) => {
    await openGatePage(page);

    await forceGameOver(page, 500);
    await expect(page.locator("#streak")).toHaveText("1/3");

    await forceGameOver(page, 500);
    await expect(page.locator("#streak")).toHaveText("2/3");
  });

  test("streak display clears once unlocked", async ({ page }) => {
    await openGatePage(page);

    await forceGameOver(page, 200);
    await forceGameOver(page, 200);
    await forceGameOver(page, 200);

    await expect(page.locator("#streak")).toHaveText("");
  });

  test("failing after unlock hides the unlock area", async ({ page }) => {
    await openGatePage(page);

    // Unlock
    await forceGameOver(page, 200);
    await forceGameOver(page, 200);
    await forceGameOver(page, 200);
    await expect(page.locator("#unlock-area")).toHaveClass(/visible/);

    // Fail
    await forceGameOver(page, 20);
    await expect(page.locator("#unlock-area")).not.toHaveClass(/visible/);
  });

  test("hint updates through all phases", async ({ page }) => {
    await openGatePage(page);
    const hint = page.locator("#gate-hint");

    // Phase 1: initial
    await expect(hint).toContainText("Easy, right?");

    // Phase 2: mid-streak (1/3)
    await forceGameOver(page, 200);
    await expect(hint).toContainText("Feeling lucky?");

    // Phase 3: mid-streak (2/3)
    await forceGameOver(page, 200);
    await expect(hint).toContainText("Don't choke");

    // Phase 4: unlocked
    await forceGameOver(page, 200);
    await expect(hint).toContainText("beat your high score first");

    // Phase 5: lost unlock
    await forceGameOver(page, 10);
    await expect(hint).toContainText("Streak gone");
  });

  test("proceed link sends correct chrome message with seconds", async ({
    page,
  }) => {
    await openGatePage(page);

    await forceGameOver(page, 200);
    await forceGameOver(page, 200);
    await forceGameOver(page, 200);

    await page.locator("#time-input").fill("30");

    await page.evaluate(() => {
      window.chrome.runtime.sendMessage = function (msg, cb) {
        window.__lastChromeMessage = msg;
      };
    });

    await page.locator("#proceed-link").click();
    await waitMs(100);

    const msg = await page.evaluate(() => window.__lastChromeMessage);
    expect(msg).toEqual({
      type: "unlock",
      domain: "instagram.com",
      seconds: 30,
    });
  });

  test("time input clamps to minimum 1 for negative values", async ({ page }) => {
    await openGatePage(page);

    await forceGameOver(page, 200);
    await forceGameOver(page, 200);
    await forceGameOver(page, 200);

    await page.evaluate(() => {
      document.getElementById("time-input").value = "-5";
    });
    await page.evaluate(() => {
      window.chrome.runtime.sendMessage = function (msg) {
        window.__lastChromeMessage = msg;
      };
    });
    await page.locator("#proceed-link").click();
    await waitMs(100);

    const msg = await page.evaluate(() => window.__lastChromeMessage);
    expect(msg.seconds).toBe(1);
  });

  test("time input clamps to maximum 7200", async ({ page }) => {
    await openGatePage(page);

    await forceGameOver(page, 200);
    await forceGameOver(page, 200);
    await forceGameOver(page, 200);

    await page.locator("#time-input").fill("99999");
    await page.evaluate(() => {
      window.chrome.runtime.sendMessage = function (msg) {
        window.__lastChromeMessage = msg;
      };
    });
    await page.locator("#proceed-link").click();
    await waitMs(100);

    const msg = await page.evaluate(() => window.__lastChromeMessage);
    expect(msg.seconds).toBe(7200);
  });

  test("empty time input defaults to 600 seconds", async ({ page }) => {
    await openGatePage(page);

    await forceGameOver(page, 200);
    await forceGameOver(page, 200);
    await forceGameOver(page, 200);

    await page.locator("#time-input").fill("");
    await page.evaluate(() => {
      window.chrome.runtime.sendMessage = function (msg) {
        window.__lastChromeMessage = msg;
      };
    });
    await page.locator("#proceed-link").click();
    await waitMs(100);

    const msg = await page.evaluate(() => window.__lastChromeMessage);
    expect(msg.seconds).toBe(600);
  });

  test("decimal input is floored to integer seconds", async ({ page }) => {
    await openGatePage(page);

    await forceGameOver(page, 200);
    await forceGameOver(page, 200);
    await forceGameOver(page, 200);

    await page.locator("#time-input").fill("45");
    await page.evaluate(() => {
      document.getElementById("time-input").value = "45.7";
    });
    await page.evaluate(() => {
      window.chrome.runtime.sendMessage = function (msg) {
        window.__lastChromeMessage = msg;
      };
    });
    await page.locator("#proceed-link").click();
    await waitMs(100);

    const msg = await page.evaluate(() => window.__lastChromeMessage);
    expect(msg.seconds).toBe(45);
  });
});
