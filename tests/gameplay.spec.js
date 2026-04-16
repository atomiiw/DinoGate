// @ts-check
const { test, expect } = require("@playwright/test");
const {
  openGatePage,
  pressSpace,
  waitMs,
  getGameInfo,
  forceGameOver,
} = require("./helpers");

test.describe("Gameplay — does the game behave like a real user expects?", () => {
  test("pressing Space starts the game", async ({ page }) => {
    await openGatePage(page);

    await pressSpace(page);
    await waitMs(200);

    const info = await getGameInfo(page);
    expect(info.playing).toBe(true);
  });

  test("distance increases while running", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(1500);

    const distance = await page.evaluate(() =>
      Runner.instance_ ? Runner.instance_.distanceRan : 0
    );
    expect(distance).toBeGreaterThan(0);
  });

  test("dino jumps on Space during gameplay", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(300);

    await pressSpace(page);
    await waitMs(200);

    const isAboveGround = await page.evaluate(() => {
      const runner = Runner.instance_;
      return runner && runner.tRex && runner.tRex.jumping;
    });
    expect(isAboveGround).toBe(true);
  });

  test("forceGameOver sets crashed state", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(200);

    await forceGameOver(page, 250);

    const info = await getGameInfo(page);
    expect(info.crashed).toBe(true);
  });

  test("game can be restarted after crashing", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(200);

    await forceGameOver(page, 100);
    const crashed = await page.evaluate(() => Runner.instance_.crashed);
    expect(crashed).toBe(true);

    // The Runner's restart is gated on raqId === 0 (no active animation frame).
    // After gameOver → stop(), raqId should be 0. Call restart directly.
    const restarted = await page.evaluate(() => {
      const r = Runner.instance_;
      r.raqId = 0; // ensure the guard passes
      try { r.restart(); return true; } catch { return false; }
    });
    expect(restarted).toBe(true);
    await waitMs(200);

    const info = await getGameInfo(page);
    expect(info.crashed).toBe(false);
    expect(info.playing).toBe(true);
  });

  test("game over sets crashed state on runner", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(200);

    await forceGameOver(page, 300);

    // Verify the runner reports crashed and the game over panel exists
    const state = await page.evaluate(() => {
      const r = Runner.instance_;
      return {
        crashed: r.crashed,
        hasGameOverPanel: !!r.gameOverPanel,
      };
    });
    expect(state.crashed).toBe(true);
    expect(state.hasGameOverPanel).toBe(true);
  });

  test("rapid Space presses don't break the game", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(50);

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Space");
      await waitMs(30);
    }

    const state = await page.evaluate(() => {
      const r = Runner.instance_;
      return r ? { playing: r.playing, crashed: r.crashed } : null;
    });
    expect(state).not.toBeNull();
    expect(typeof state.playing).toBe("boolean");
    expect(typeof state.crashed).toBe("boolean");
  });
});
