import { test, expect } from "@playwright/test";
import { config } from "../config";
import { selectTableView } from "../utils/common";

test.beforeEach(async ({ page }) => {
  await page.goto(`${config.BASE_URL}/app`);
});

test.describe("Test Table View", () => {
  test("table view is visible", async ({ page }) => {
    await selectTableView(page);
    // expect a page showing all the projects in an accordion
    expect(page.getByRole("heading", { name: /All pages/i })).toBeVisible();
    const projects = page.locator(".p-accordion__list .p-accordion__group");
    const projectCount = await projects.count();
    expect(projectCount).toBeGreaterThan(0);

    // check all projects have pages
    for (let i = 0; i < projectCount; i++) {
      const project = projects.nth(i);
      const projectHeading = project.locator(".p-accordion__heading");
      const projectPageCount = await projectHeading.locator(".p-badge").innerText();
      expect(parseInt(projectPageCount)).toBeGreaterThan(1);

      // select each project
      await project.click();

      // select a random page
      const pages = project.locator(".p-accordion__panel table tbody tr");
      const pagesCount = await pages.count();
      const selectedPage = project
        .locator(".p-accordion__panel table tbody tr")
        .nth(Math.floor(Math.random() * pagesCount));
      await selectedPage.locator(".p-button--link").first().click();

      // check the page details are visible
      await expect(page.getByText(/Description/i).first()).toBeVisible();

      // click the back button
      await page.getByRole("button", { name: /Back/i }).click();
    }
  });
});
