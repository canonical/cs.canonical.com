import { test, expect } from "@playwright/test";
import { config } from "./config";

test.describe("Test Application Layout", () => {
  test("displays the login page", async ({ page }) => {
    await page.setExtraHTTPHeaders({
      "X-Auth-Token": process.env.SSO_AUTH_TOKEN || "",
    });
    await page.goto(`${config.BASE_URL}/login_page`);
    await expect(page.getByRole("heading", { name: /Welcome to the sites content system/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Login with U1/i })).toBeVisible();
  });

  test("projects are loaded and visible", async ({ page }) => {
    await page.goto(`${config.BASE_URL}/app`);

    // select table view
    await page.locator(".l-navigation__drawer .p-panel__content .p-side-navigation__link").first().click();

    // check projects are present
    const projects = page.locator(".p-accordion__list .p-accordion__group");
    const projectCount = await projects.count();
    expect(projectCount).toBeGreaterThan(0);

    // check all projects have pages
    for (let i = 0; i < projectCount; i++) {
      const project = projects.nth(i);
      const projectHeading = project.locator(".p-accordion__heading");
      const projectPageCount = await projectHeading.locator(".p-badge").innerText();
      expect(parseInt(projectPageCount)).toBeGreaterThan(1);
    }
  });
});
