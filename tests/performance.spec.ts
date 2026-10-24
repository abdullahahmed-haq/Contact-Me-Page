import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/connect/");
  await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
  await page.waitForLoadState("networkidle");
});

test("first dialog load can be canceled, retried and focused without duplicate analytics", async ({
  page,
}) => {
  const events: string[] = [];
  await page.route(/\/api\/events\/?$/, async (route) => {
    events.push(route.request().postDataJSON().event);
    await route.fulfill({
      status: 200,
      body: "{}",
      contentType: "application/json",
    });
  });
  await page.evaluate(() => {
    document.documentElement.dataset.analytics = "enabled";
  });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/static/chunks/**", async (route) => {
    await gate;
    await route.continue();
  });
  const trigger = page.locator('[data-contact="whatsapp"]');
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("status")).toContainText("Opening dialog");
  await trigger.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(trigger).not.toHaveAttribute("aria-busy", "true");
  release();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(events.filter((event) => event === "whatsapp_open")).toHaveLength(0);
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(events.filter((event) => event === "whatsapp_open")).toHaveLength(1);
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect
    .poll(() => events.filter((event) => event === "whatsapp_open").length)
    .toBe(2);
});

test("a failed dialog chunk shows a recoverable error and retries on the next click", async ({
  page,
}) => {
  let fail!: () => void;
  const gate = new Promise<void>((resolve) => {
    fail = resolve;
  });
  await page.route("**/_next/static/chunks/**", async (route) => {
    await gate;
    await route.abort("failed");
  });
  const trigger = page.locator('[data-contact="github"]');
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-busy", "true");
  fail();
  await expect(page.locator("p[role=alert]")).toContainText(
    "Select the button again to retry",
  );
  await expect(trigger).not.toHaveAttribute("aria-busy", "true");
  await page.unroute("**/_next/static/chunks/**");
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("p[role=alert]")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Open GitHub", exact: true }),
  ).toHaveAttribute("href", "https://github.com/abdullahahmed-haq");
});

test("draft preview updates QR and raster images, and both QR downloads work under CSP", async ({
  page,
  baseURL,
}) => {
  test.skip(
    !process.env.OWNER_EMAIL || !process.env.OWNER_PASSWORD,
    "Requires the isolated owner fixture",
  );
  const login = await page.request.post("/api/auth/sign-in/email/", {
    headers: { Origin: new URL(baseURL!).origin },
    data: {
      email: process.env.OWNER_EMAIL,
      password: process.env.OWNER_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const content = await (await page.request.get("/api/admin/content/")).json();
  const config = structuredClone(content.draft);
  config.canonicalUrl = "https://example.com/preview/?source=qr";
  config.qr.foreground = "#172d50";
  config.profile.avatar = "/assets/abdullah-illustrated-avatar.webp";
  config.featured.image = "/assets/abdullah-illustrated-avatar.webp";
  await page.goto("/admin/preview/");
  await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
  const update = () =>
    page.evaluate((draft) => {
      window.postMessage(
        { type: "connect-preview", content: draft, locale: "en" },
        location.origin,
      );
    }, config);
  await update();
  const qr = page.locator(".qr-card img");
  await expect(qr).toHaveAttribute("src", /^data:image\/png;base64,/);
  await expect(page.locator(".avatar")).toHaveAttribute("srcset", /w/);
  await expect(page.locator(".website-preview")).toHaveAttribute("srcset", /w/);
  await expect
    .poll(() =>
      page
        .locator(".avatar")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  const first = await qr.getAttribute("src");
  config.canonicalUrl = "https://example.com/updated/?source=qr";
  config.qr.foreground = "#173523";
  await update();
  await expect(qr).toHaveAttribute("src", /^data:image\/png;base64,/);
  await expect(qr).not.toHaveAttribute("src", first!);
  await page.locator('[data-action="qr"]').click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".qr-target")).toHaveText(config.canonicalUrl);
  for (const format of ["PNG", "SVG"]) {
    const promise = page.waitForEvent("download");
    await dialog
      .getByRole("button", { name: `Download QR as ${format}` })
      .click();
    const download = await promise;
    expect(download.suggestedFilename()).toMatch(
      new RegExp(`\\.${format.toLowerCase()}$`),
    );
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream!) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    if (format === "PNG") expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    else expect(bytes.toString()).toContain("<svg");
  }
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await page.keyboard.press("Escape");
  config.canonicalUrl = "";
  await update();
  await expect(qr).toHaveCount(0);
  await page.locator('[data-action="qr"]').click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Download QR as PNG" }),
  ).toBeDisabled();
});
