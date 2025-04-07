import { test, expect, APIRequestContext } from "@playwright/test";
import { config } from "./config";
import type { IJiraTask } from "@/services/api/types/pages";

const JIRA_TASKS: IJiraTask[] = [];
let apiContext: APIRequestContext;

test.describe("Test project actions", () => {
  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: `${config.BASE_URL}`,
    });
  });

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

    const responsePromise = page.waitForResponse((response) => response.url().includes("request-removal"));
    await modal.getByRole("button", { name: /Submit/i }).click();
    const response = await responsePromise;

    if (response.status() === 200) {
      const responseBody = await response.json();
      if (responseBody.jira_task_id) {
        JIRA_TASKS.push(responseBody.jira_task_id);
      }
    }

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

    const responsePromise = page.waitForResponse((response) => {
      return response.url().includes("api/request-changes") && response.status() === 200;
    });
    await modal.getByRole("button", { name: /Submit/i }).click();
    const response = await responsePromise;

    if (response.status() === 200) {
      const responseBody = await response.json();
      if (responseBody.jira_task_id) {
        JIRA_TASKS.push(responseBody.jira_task_id);
      }
    }

    await expect(page.locator(".l-notification__container .p-notification--negative")).not.toBeVisible();
  });

  test("create new page", async ({ page }) => {
    await page.getByRole("button", { name: /Request new page/i }).click();
    await expect(page.getByRole("heading", { name: /New page/i })).toBeVisible();
    await page.locator("input[aria-labelledby='url-title']").fill(config.PLAYWRIGHT_TEST_PAGE_URL);
    await page.locator(".l-new-webpage--location .p-list-tree .p-list-tree__item").first().click();
    const productsDropdown = page.getByRole("combobox", { name: "Select products" });
    await productsDropdown.click();
    const products = productsDropdown.locator("xpath=parent::*").locator(".multi-select__dropdown-item");
    expect(await products.count()).toBeGreaterThan(0);
    for (let i = 0; i < 3; i++) {
      await products.nth(i).click();
    }
    await productsDropdown.click();

    var responsePromise = page.waitForResponse((response) => {
      return response.url().includes("api/create-page") && response.status() === 201;
    });
    await page.getByRole("button", { name: /Save and generate copy doc/i }).click();
    var response = await responsePromise;
    await expect(response.status()).toBe(201);
    await page.waitForTimeout(20000);
    await expect(page.url().endsWith(config.PLAYWRIGHT_TEST_PAGE_URL)).toBeTruthy();
    await page.getByRole("button", { name: /Submit for publication.*/i }).click();
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

    responsePromise = page.waitForResponse((response) => {
      return response.url().includes("api/request-changes") && response.status() === 200;
    });
    await modal.getByRole("button", { name: /Submit/i }).click();
    response = await responsePromise;

    if (response.status() === 200) {
      const responseBody = await response.json();
      if (responseBody.jira_task_id) {
        JIRA_TASKS.push(responseBody.jira_task_id);
      }
    }

    await expect(page.locator(".l-notification__container .p-notification--negative")).not.toBeVisible();
  });

  test.afterAll(async () => {
    const cleanup = await apiContext.post("/api/playwright-cleanup", {
      data: {
        jira_tasks: JIRA_TASKS,
      },
    });
    expect(cleanup.ok()).toBeTruthy();
    await apiContext.dispose();
  });
});
