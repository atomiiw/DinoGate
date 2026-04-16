// @ts-check
const { test, expect } = require("@playwright/test");
const { openGatePage, pressSpace, waitMs } = require("./helpers");

test.describe("Difficulty — does the game get harder consistently?", () => {
  test("speed increases over time", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(500);

    const speedEarly = await page.evaluate(() => Runner.instance_.currentSpeed);

    await waitMs(3000);

    const speedLater = await page.evaluate(() => Runner.instance_.currentSpeed);

    expect(speedLater).toBeGreaterThan(speedEarly);
  });

  test("speed starts at config.SPEED", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);
    await waitMs(100);

    const state = await page.evaluate(() => {
      const r = Runner.instance_;
      return { current: r.currentSpeed, config: r.config.SPEED };
    });

    // Should be at or very near the starting speed
    expect(state.current).toBeCloseTo(state.config, 0);
  });

  test("speed never exceeds MAX_SPEED", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);

    // Keep the dino alive by jumping repeatedly
    for (let i = 0; i < 40; i++) {
      await pressSpace(page);
      await waitMs(500);
    }

    const state = await page.evaluate(() => {
      const r = Runner.instance_;
      return { current: r.currentSpeed, max: r.config.MAX_SPEED };
    });

    expect(state.current).toBeLessThanOrEqual(state.max);
  });

  test("obstacles spawn after CLEAR_TIME", async ({ page }) => {
    await openGatePage(page);
    await pressSpace(page);

    // Immediately after start — no obstacles yet (CLEAR_TIME = 3000ms)
    await waitMs(500);
    const earlyObstacles = await page.evaluate(
      () => Runner.instance_.horizon.obstacles.length
    );

    // After CLEAR_TIME passes, obstacles should appear
    await waitMs(4000);
    const laterObstacles = await page.evaluate(
      () => Runner.instance_.horizon.obstacles.length
    );

    expect(earlyObstacles).toBe(0);
    expect(laterObstacles).toBeGreaterThan(0);
  });

  test("acceleration is consistent across runs", async ({ page }) => {
    await openGatePage(page);

    // Run 1: measure speed at 2 seconds
    await pressSpace(page);
    await waitMs(2000);
    const speed1 = await page.evaluate(() => Runner.instance_.currentSpeed);

    // Force game over and restart
    await page.evaluate(() => {
      const r = Runner.instance_;
      r.distanceRan = 10 / r.distanceMeter.config.COEFFICIENT;
      r.gameOver();
    });
    await page.evaluate(() => {
      Runner.instance_.raqId = 0;
      Runner.instance_.restart();
    });
    await waitMs(100);

    // Run 2: measure speed at 2 seconds
    await waitMs(2000);
    const speed2 = await page.evaluate(() => Runner.instance_.currentSpeed);

    // Speeds should be very close (within 0.5)
    expect(Math.abs(speed1 - speed2)).toBeLessThan(0.5);
  });

  test("config values match Chrome defaults", async ({ page }) => {
    await openGatePage(page);

    const config = await page.evaluate(() => {
      const r = Runner.instance_;
      return {
        SPEED: r.config.SPEED,
        MAX_SPEED: r.config.MAX_SPEED,
        ACCELERATION: r.config.ACCELERATION,
        GAP_COEFFICIENT: r.config.GAP_COEFFICIENT,
        CLEAR_TIME: r.config.CLEAR_TIME,
        INITIAL_JUMP_VELOCITY: r.config.INITIAL_JUMP_VELOCITY,
        INVERT_DISTANCE: r.config.INVERT_DISTANCE,
        TREX_GRAVITY: Trex.normalJumpConfig.GRAVITY,
        TREX_INITIAL_VELOCITY: Trex.normalJumpConfig.INITIAL_JUMP_VELOCITY,
      };
    });

    // Chrome's standard values
    expect(config.SPEED).toBe(6);
    expect(config.MAX_SPEED).toBe(13);
    expect(config.ACCELERATION).toBe(0.001);
    expect(config.GAP_COEFFICIENT).toBe(0.6);
    expect(config.CLEAR_TIME).toBe(3000);
    expect(config.INITIAL_JUMP_VELOCITY).toBe(12);
    expect(config.INVERT_DISTANCE).toBe(700);
    expect(config.TREX_GRAVITY).toBe(0.6);
    expect(config.TREX_INITIAL_VELOCITY).toBe(-10);
  });
});
