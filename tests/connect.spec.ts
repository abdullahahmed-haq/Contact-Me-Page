import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
test.beforeEach(async ({ page }) => {
  await page.goto("/connect/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
});
test("responsive English and Arabic at all requested widths", async ({
  page,
}) => {
  await mkdir("artifacts", { recursive: true });
  for (const locale of ["en", "ar"]) {
    if (locale === "ar") {
      await page.getByRole("button", { name: "Page options" }).click();
      await page.getByRole("menuitem", { name: "العربية" }).click();
    }
    for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBeTruthy();
      await expect(page.locator("[data-contact]")).toHaveCount(6);
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: `artifacts/${locale}-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
    }
    await page.reload();
    await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
  }
});
test("WhatsApp composer handoff, focus trap, presets and 500 limit", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  const trigger = page.locator("[data-contact=whatsapp]");
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator(".sheet-scrim")).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-scroll-locked", "1");
  await expect(
    page.getByRole("button", { name: "Close", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest("[role=dialog]"),
    ),
  ).toBeTruthy();
  const field = page.getByRole("textbox", { name: "Your message" });
  await expect(
    page.getByRole("button", { name: "Send Message", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Hi! 👋", exact: true }).click();
  await expect(field).toHaveValue("Hi! 👋");
  await expect(
    page.getByRole("button", { name: "Hi! 👋", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await field.fill("x".repeat(510));
  await expect(field).toHaveValue("x".repeat(500));
  await field.fill("x".repeat(499));
  await page
    .getByRole("button", { name: "Insert a waving hand emoji" })
    .click();
  await expect(field).toHaveValue("x".repeat(499));
  await field.fill("أهلًا & hello? 👋");
  await page
    .getByRole("button", { name: "Insert a waving hand emoji" })
    .click();
  await expect(field).toHaveValue("أهلًا & hello? 👋👋");
  await page.screenshot({
    path: "artifacts/whatsapp-en.png",
    fullPage: false,
    animations: "disabled",
  });
  await page.evaluate(() => {
    (window as unknown as { captured: string; open: typeof window.open }).open =
      (url) => {
        (window as unknown as { captured: string }).captured = String(url);
        return null;
      };
  });
  await page.getByRole("button", { name: "Send Message", exact: true }).click();
  const url = await page.evaluate(
    () => (window as unknown as { captured: string }).captured,
  );
  expect(new URL(url).pathname).toBe("/201034243496");
  expect(new URL(url).searchParams.get("text")).toBe("أهلًا & hello? 👋👋");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});
test("Arabic sheet and close by scrim, close button, handle drag", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Page options" }).click();
  await page.getByRole("menuitem", { name: "العربية" }).click();
  await page.locator("[data-contact=whatsapp]").click();
  await page.getByRole("button", { name: "خلينا نتعاون", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue("خلينا نتعاون");
  await page.screenshot({
    path: "artifacts/whatsapp-ar.png",
    fullPage: false,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.locator("[data-contact=whatsapp]").click();
  await page.locator(".sheet-scrim").click({ position: { x: 10, y: 10 } });
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.locator("[data-contact=whatsapp]").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(500);
  const h = await page.locator(".drag-zone").boundingBox();
  if (!h) throw Error("Handle missing");
  await page.mouse.move(h.x + h.width / 2, h.y + 15);
  await page.mouse.down();
  await page.mouse.move(h.x + h.width / 2, h.y + 140, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("real GitHub URL, honest missing links, vCard download and QR empty state", async ({
  page,
}) => {
  await expect(page.locator("[data-contact=github]")).toHaveAttribute(
    "href",
    "https://github.com/abdullahahmed-haq",
  );
  await page.locator("[data-contact=portfolio]").click();
  await expect(page.getByRole("dialog")).toContainText(
    "This contact link isn’t available yet.",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".qr-card")).toContainText("public page URL");
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download vCard" }).click();
  const download = await promise;
  expect(download.suggestedFilename()).toBe("abdullah-ahmed.vcf");
  await download.saveAs("artifacts/abdullah-ahmed.vcf");
});
test("short viewport preserves internal scrolling and reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 430 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("[data-contact=whatsapp]").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const b = await dialog.boundingBox();
  expect(b!.height).toBeLessThanOrEqual(430 * 0.85 + 1);
  await page
    .getByRole("button", { name: "Let’s collaborate", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Send Message", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "Send Message", exact: true }),
  ).toBeInViewport();
});

test("handle dismisses with real touch events in mobile Chromium", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/connect/");
  await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
  await page.locator("[data-contact=whatsapp]").tap();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(450);
  const box = await page.locator(".drag-zone").boundingBox();
  if (!box) throw new Error("Drag handle missing");
  const session = await context.newCDPSession(page);
  const x = box.x + box.width / 2,
    y = box.y + 15;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 10; step++)
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y + step * 14 }],
    });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await context.close();
});
