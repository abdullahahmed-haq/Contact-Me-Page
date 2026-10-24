import { test, expect } from "@playwright/test";

test("root and Connect routes render the same published content in both languages", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.request.get("/api/public/connect/");
  expect(response.status()).toBe(200);
  const config = await response.json();

  for (const locale of ["en", "ar"] as const) {
    for (const route of ["/", "/connect/"]) {
      const result = await page.goto(`${route}?lang=${locale}`);
      expect(result?.status()).toBe(200);
      await expect(page.locator("main.connect-page")).toHaveAttribute(
        "data-ready",
        "true",
      );
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        config.profile.name[locale],
      );
      await expect(page).toHaveTitle(config.seo.title[locale]);
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        locale === "ar" ? "rtl" : "ltr",
      );
    }
  }

  expect(errors).toEqual([]);
});
