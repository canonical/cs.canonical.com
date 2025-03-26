import { test, expect } from "@playwright/test";
import { config } from "./config";

test.describe("Test project actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({
      "X-JIRA-REPORTER-ID": process.env.JIRA_REPORTER_ID || "",
    });
    await page.goto(`${config.BASE_URL}/app`);
  });

  test("remove page", async ({ page }) => {
    const tree = page.locator(".l-navigation__drawer .p-panel__content .p-list-tree").first();
    const child = tree.locator(".p-list-tree__item").first();
    await child.click();
    await expect(page.getByRole("heading", { name: /Title/i })).toBeVisible();
    page.getByRole("button", { name: /Request removal/i }).click();
    const modal = page.locator(".p-modal").first();
    await expect(modal).toBeVisible();
    await expect(page.getByRole("heading", { name: /Submit request for page removal/i })).toBeVisible();
    await modal.locator('input[type="date"]').fill(new Date().toISOString().split("T")[0]);
    const checkboxes = await page.locator("input[type='checkbox'][required]");
    if (checkboxes) {
      const checkboxCount = await checkboxes.count();
      for (let i = 0; i < checkboxCount; i++) {
        await checkboxes.nth(i).check();
      }
    }
    await modal.getByRole("button", { name: /Submit/i }).click();
    // TODO: check that the jira ticket is created and jira tickets table has an entry.
    // the jira ticket will not be created if an existing one is already pending.
    expect(page.locator(".l-notification__container .p-notification--negative")).not.toBeVisible();
  });

  test("request page changes", async ({ page }) => {
    const tree = page.locator(".l-navigation__drawer .p-panel__content .p-list-tree").first();
    const child = tree.locator(".p-list-tree__item").first();
    await child.click();
    page.getByRole("button", { name: /Request changes/i }).click();
    const modal = page.locator(".p-modal").first();
    await expect(modal).toBeVisible();
    await modal.locator('input[type="date"]').fill(new Date().toISOString().split("T")[0]);
    const checkboxes = await page.locator("input[type='checkbox'][required]");
    if (checkboxes) {
      const checkboxCount = await checkboxes.count();
      for (let i = 0; i < checkboxCount; i++) {
        await checkboxes.nth(i).check();
      }
    }
    await modal.getByRole("button", { name: /Submit/i }).click();
    expect(page.locator(".l-notification__container .p-notification--negative")).not.toBeVisible();
  });
});
