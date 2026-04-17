import { test, expect } from "@playwright/test";
import { config } from "../config";
import { selectTableView } from "../utils/common";

test.beforeEach(async ({ page }) => {
  await page.goto(`${config.BASE_URL}/app`);
});

test.describe("Test Full Site View", () => {
  test("full site view displays project sidebar and page table", async ({ page }) => {
    await selectTableView(page);

    // Verify the sidebar shows projects
    const sidebar = page.locator(".full-site-view__sidebar");
    await expect(sidebar).toBeVisible();

    const projectButtons = sidebar.locator(".full-site-view__project-button");
    const projectCount = await projectButtons.count();
    expect(projectCount).toBeGreaterThan(0);

    // First project should be active by default
    const firstProject = projectButtons.first();
    await expect(firstProject).toHaveClass(/is-active/);

    // Table should be visible with pages
    const table = page.locator(".p-table--sortable");
    await expect(table).toBeVisible();

    // Verify table has rows
    const rows = table.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Click a page URL link and verify navigation
    const firstPageLink = rows.first().locator("button.p-button--link").first();
    await firstPageLink.click();
    await expect(page.getByText(/Description/i).first()).toBeVisible();

    // Click back
    await page.getByRole("button", { name: /Back/i }).click();
  });

  test("switching projects updates the table", async ({ page }) => {
    await selectTableView(page);

    const sidebar = page.locator(".full-site-view__sidebar");
    const projectButtons = sidebar.locator(".full-site-view__project-button");

    // Click a different project
    const secondProject = projectButtons.nth(1);
    const secondProjectName = await secondProject.innerText();
    await secondProject.click();

    // Verify the clicked project is now active
    await expect(secondProject).toHaveClass(/is-active/);

    // Verify the heading updates
    const expectedHeading = `${secondProjectName.charAt(0).toUpperCase()}${secondProjectName.slice(1)} pages`;
    await expect(page.getByRole("heading", { name: new RegExp(expectedHeading, "i") })).toBeVisible();
  });
});
