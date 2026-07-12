import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the main title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("أسعار الذهب");
  });

  test("should display gold prices after loading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=عيار ٢١")).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to calculator", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/calculator"]');
    await expect(page).toHaveURL(/\/calculator/);
  });
});
