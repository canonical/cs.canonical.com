// import { test, expect } from "@playwright/test";
// import { config } from "./config";

// test.describe("Test Application Layout", () => {
//   test("displays the login page", async ({ page }) => {
//     await page.setExtraHTTPHeaders({
//       "X-Auth-Token": process.env.SSO_AUTH_TOKEN || "",
//     });
//     await page.goto(`${config.BASE_URL}/login_page`);
//     await expect(page.getByRole("heading", { name: /Welcome to the sites content system/i })).toBeVisible();
//     await expect(page.getByRole("link", { name: /Login with U1/i })).toBeVisible();
//   });

//   test("projects are loaded and visible", async ({ page }) => {
//     await page.goto(`${config.BASE_URL}/app`);
//     const tree = await page.locator(".l-navigation__drawer .p-panel__content .p-list-tree").first();
//     await expect(tree).toBeVisible();

//     const children = await tree.locator(".p-list-tree__item");
//     expect(await children.count()).toBeGreaterThan(0);
//   });
// });
