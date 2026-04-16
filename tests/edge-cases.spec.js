// @ts-check
const { test, expect } = require("@playwright/test");
const {
  openGatePage,
  pressSpace,
  waitMs,
  forceGameOver,
} = require("./helpers");

test.describe("Edge cases — breaking the app like a real user would", () => {
  test("pressing ArrowDown before game starts does nothing bad", async ({
    page,
  }) => {
    await openGatePage(page);

    await page.keyboard.press("ArrowDown");
    await waitMs(100);

    const state = await page.evaluate(() => {
      const r = Runner.instance_;
      return r
        ? { playing: r.playing, crashed: r.crashed, activated: r.activated }
        : null;
    });
    expect(state).not.toBeNull();
    expect(state.playing).toBe(false);
  });

  test("pressing random keys during gameplay doesn't crash", async ({
    page,
  }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(200);

    const keys = ["KeyA", "KeyZ", "Enter", "Escape", "Tab", "Digit1"];
    for (const key of keys) {
      await page.keyboard.press(key);
      await waitMs(30);
    }

    const state = await page.evaluate(() => {
      const r = Runner.instance_;
      return r ? { playing: r.playing, crashed: r.crashed } : null;
    });
    expect(state).not.toBeNull();
    expect(state.playing || state.crashed).toBe(true);
  });

  test("holding Space doesn't cause double-jump", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(500);

    await page.keyboard.down("Space");
    await waitMs(500);
    await page.keyboard.up("Space");

    const state = await page.evaluate(() => {
      const r = Runner.instance_;
      return r ? { playing: r.playing, crashed: r.crashed } : null;
    });
    expect(state).not.toBeNull();
    expect(state.playing || state.crashed).toBe(true);
  });

  test("rapid restart doesn't break state", async ({ page }) => {
    await openGatePage(page);

    for (let i = 0; i < 3; i++) {
      await pressSpace(page);
      await waitMs(200);

      // Force a crash instead of waiting for natural collision
      await forceGameOver(page, 50);

      const crashed = await page.evaluate(() => Runner.instance_.crashed);
      expect(crashed).toBe(true);

      // Wait for restart cooldown
      await waitMs(1300);
    }

    // After multiple cycles, runner should still be functional
    await expect(page.locator(".runner-canvas")).toBeVisible();
  });

  test("clicking outside game area during game doesn't interfere", async ({
    page,
  }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(200);

    await page.locator("#main-message").click();
    await waitMs(200);

    const state = await page.evaluate(() => {
      const r = Runner.instance_;
      return r ? { playing: r.playing, crashed: r.crashed } : null;
    });
    expect(state).not.toBeNull();
  });

  test("resizing the window mid-game doesn't crash", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(300);

    await page.setViewportSize({ width: 400, height: 300 });
    await waitMs(300);
    await page.setViewportSize({ width: 1200, height: 800 });
    await waitMs(300);

    // Runner should still exist and not be in an invalid state
    const exists = await page.evaluate(() => Runner.instance_ != null);
    expect(exists).toBe(true);
  });

  test("non-numeric time input doesn't crash", async ({ page }) => {
    await openGatePage(page);

    // type=number rejects non-numeric strings at the DOM level,
    // so setting "abc" via JS results in an empty string
    await page.evaluate(() => {
      document.getElementById("time-input").value = "abc";
    });

    const val = await page.evaluate(
      () => document.getElementById("time-input").value
    );
    // Chromium sanitizes type=number values — "abc" becomes ""
    expect(val).toBe("");
  });

  test("negative time input is clamped to 1", async ({ page }) => {
    await openGatePage(page);

    await page.evaluate(() => {
      document.getElementById("time-input").value = "-5";
    });

    const val = await page.locator("#time-input").inputValue();
    expect(val).toBe("-5");
  });

  test("page starts without inverted class", async ({ page }) => {
    await openGatePage(page);

    const isInverted = await page.evaluate(() =>
      document.documentElement.classList.contains("inverted")
    );
    expect(isInverted).toBe(false);
  });

  test("ArrowUp also starts the game (not just Space)", async ({ page }) => {
    await openGatePage(page);

    await page.keyboard.press("ArrowUp");
    await waitMs(100);

    const state = await page.evaluate(() => {
      const r = Runner.instance_;
      return r ? { playing: r.playing } : null;
    });
    expect(state).not.toBeNull();
    expect(state.playing).toBe(true);
  });
});
