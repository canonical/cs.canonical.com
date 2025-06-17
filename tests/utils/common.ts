import { Page, expect } from "@playwright/test";

export async function removeWebpage(page: Page, JIRA_TASKS: string[]): Promise<void> {
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

  await expect(page.locator(".l-notification__container .p-notification--negative")).not.toBeVisible();
}
