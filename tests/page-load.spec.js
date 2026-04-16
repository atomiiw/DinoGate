// @ts-check
const { test, expect } = require("@playwright/test");
const { openGatePage, getGameInfo } = require("./helpers");

test.describe("Page load — does the gate page render correctly?", () => {
  test("shows the fake offline message and error code", async ({ page }) => {
    await openGatePage(page);

    await expect(page.locator("#main-message h1")).toContainText("No internet");
    await expect(page.locator("#error-code")).toHaveText(
      "ERR_INTERNET_DISCONNECTED"
    );
  });

  test("runner canvas is created by the game engine", async ({ page }) => {
    await openGatePage(page);

    const canvas = page.locator(".runner-canvas");
    await expect(canvas).toBeVisible();
  });

  test("gate hint explains the rules on load", async ({ page }) => {
    await openGatePage(page);

    await expect(page.locator("#gate-hint")).toContainText(
      "Easy, right?"
    );
  });

  test("streak counter is empty on load", async ({ page }) => {
    await openGatePage(page);

    await expect(page.locator("#streak")).toHaveText("");
  });

  test("unlock area is hidden on load", async ({ page }) => {
    await openGatePage(page);

    const unlockArea = page.locator("#unlock-area");
    await expect(unlockArea).not.toHaveClass(/visible/);
  });

  test("time input defaults to 600 seconds", async ({ page }) => {
    await openGatePage(page);

    await expect(page.locator("#time-input")).toHaveValue("600");
  });

  test("time input has correct min/max/step attributes", async ({ page }) => {
    await openGatePage(page);

    const input = page.locator("#time-input");
    await expect(input).toHaveAttribute("min", "1");
    await expect(input).toHaveAttribute("max", "7200");
    await expect(input).toHaveAttribute("step", "1");
  });

  test("proceed link is empty on load", async ({ page }) => {
    await openGatePage(page);

    await expect(page.locator("#proceed-link")).toHaveText("");
  });
});
