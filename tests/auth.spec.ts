import { test, expect } from "@playwright/test";
import { config } from "./config";

test.describe("Auth", () => {
  test.beforeEach(async ({ page }) => {
    // SSO is disabled for playwright testing i.e., DISABLE_SSO is set in env
    // so any call to login / login_page will redirect to app dashboard
    await page.goto(`${config.BASE_URL}/login_page`);
  });

  test("log in", async ({ page }) => {
    await page.getByRole("link", { name: /Login with U1/i }).click();
    expect(page.url()).toMatch(`${config.BASE_URL}/app`);
  });

  test("log out", async ({ page }) => {
    await page.goto(`${config.BASE_URL}/app`);
    await page.getByRole("button", { name: /Log out/i }).click();
    expect(page.url()).toMatch(`${config.BASE_URL}/login_page`);
  });
});
