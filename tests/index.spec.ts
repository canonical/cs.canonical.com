import { test, expect } from "@playwright/test";
import { config } from "./config";
import { selectTreeView } from "./utils/common";

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

    await selectTreeView(page);

    // check projects are present
    const projectsDropdown = page.locator("select.l-site-selector");
    const projects = projectsDropdown.locator("option");
    const projectCount = await projects.count();
    expect(projectCount).toBeGreaterThan(0);

    // check all projects have pages
    for (let i = 0; i < projectCount; i++) {
      const value = await projects.nth(i).getAttribute("value");
      if (value) {
        await projectsDropdown.selectOption(value);
        const tree = page.locator(".l-navigation__drawer .p-panel__content .p-list-tree").first();
        const pages = tree.locator(".p-list-tree__item");
        const pageCount = await pages.count();
        expect(pageCount).toBeGreaterThan(0);
      }
    }
  });
});
