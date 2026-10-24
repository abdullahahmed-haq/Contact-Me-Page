import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { ContentRecord } from "../lib/admin-types";
const email = process.env.OWNER_EMAIL,
  password = process.env.OWNER_PASSWORD;
test.skip(
  !email || !password,
  "Run npm run test:e2e:isolated for isolated owner provisioning",
);
async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login/");
  await expect(page.locator("main.admin-login")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.getByLabel("Owner email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}
test("owner CMS: publish, preview, content CRUD, media, rollback, bilingual routes and logout", async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(240000);
  const origin = new URL(baseURL!).origin;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const api = async (path: string, method = "GET", data?: unknown) => {
    const r = await page.request.fetch(`/api/admin/${path}`, {
      method,
      headers: { Origin: origin },
      timeout: 15000,
      ...(data ? { data } : {}),
    });
    expect(r.ok(), await r.text()).toBeTruthy();
    return r.json();
  };
  await page.goto("/admin/profile/");
  await expect(page).toHaveURL(/\/admin\/login/);
  expect((await page.request.get("/api/admin/content/")).status()).toBe(401);
  expect(
    (
      await page.request.post("/api/auth/sign-up/email/", {
        headers: { Origin: origin },
        data: {
          name: "Stranger",
          email: "no@example.test",
          password: "not-a-real-password-123",
        },
      })
    ).status(),
  ).toBe(404);
  await expect(page.locator("main.admin-login")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.getByLabel("Owner email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill("invalid-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".admin-error[role=alert]")).toContainText(
    "Couldn’t sign in",
  );
  await login(page);
  await expect(page.locator(".admin-app")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const original = (await api("content")) as ContentRecord;
  try {
    await page.setViewportSize({ width: 1440, height: 1050 });
    await expect(
      page.getByRole("heading", { name: "Your story is just starting" }),
    ).toBeVisible();
    await mkdir(".impeccable/review", { recursive: true });
    await mkdir("artifacts/admin", { recursive: true });
    await page.screenshot({
      path: ".impeccable/review/desktop.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBeTruthy();
    await page.screenshot({
      path: ".impeccable/review/mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.getByRole("link", { name: "Profile", exact: true }).click();
    const name = page.getByRole("group", { name: "Display name", exact: true });
    await name
      .getByRole("textbox", { name: "English" })
      .fill("CMS verified owner");
    await name
      .getByRole("textbox", { name: "العربية" })
      .fill("المالك من لوحة الإدارة");
    await page
      .getByRole("button", { name: "Live preview", exact: true })
      .click();
    const preview = page.frameLocator("iframe");
    await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
      "CMS verified owner",
      { timeout: 15000 },
    );
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Draft saved",
    );
    const publicPage = await context.newPage();
    await publicPage.goto("/connect/");
    await expect(publicPage.getByRole("heading", { level: 1 })).toHaveText(
      original.published.profile.name.en,
    );
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Published.",
    );
    await publicPage.reload();
    await expect(publicPage.getByRole("heading", { level: 1 })).toHaveText(
      "CMS verified owner",
      { timeout: 15000 },
    );
    await publicPage.goto("/connect/?lang=ar");
    await expect(publicPage.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(publicPage.getByRole("heading", { level: 1 })).toHaveText(
      "المالك من لوحة الإدارة",
    );
    await publicPage.close();
    await page.getByRole("button", { name: "Close preview" }).click();
    await page
      .getByRole("link", { name: "Contact links", exact: true })
      .click();
    await page
      .getByLabel("HTTPS destination")
      .first()
      .fill("https://example.com/portfolio/");
    await page
      .getByRole("button", { name: "Move down", exact: true })
      .first()
      .click();
    await page.getByLabel("Enabled", { exact: true }).last().uncheck();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Draft saved",
    );
    let row = (await api("content")) as ContentRecord;
    expect(row.draft.contacts[0].id).toBe("whatsapp");
    expect(row.draft.contacts.at(-1)?.enabled).toBe(false);
    await page.getByRole("link", { name: "WhatsApp", exact: true }).click();
    await page
      .getByLabel("International WhatsApp number")
      .fill("+20 (103) 424-3496");
    await page.getByLabel("Maximum message length").fill("240");
    await page
      .getByRole("group", { name: "Heading", exact: true })
      .getByRole("textbox", { name: "English" })
      .fill("Message the owner");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Draft saved",
    );
    await page
      .getByRole("link", { name: "Quick messages", exact: true })
      .click();
    await page
      .getByRole("group", { name: "Message", exact: true })
      .first()
      .getByRole("textbox", { name: "English" })
      .fill("A saved quick message");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Draft saved",
    );
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Published.",
    );
    const pub = await context.newPage();
    await pub.goto("/connect/?lang=en");
    await expect(pub.locator("[data-contact]")).toHaveCount(5);
    expect(
      await pub.locator("[data-contact]").first().getAttribute("data-contact"),
    ).toBe("whatsapp");
    await pub.locator("[data-contact=whatsapp]").click();
    await expect(pub.getByRole("dialog")).toHaveAccessibleName(
      "Message the owner",
    );
    await pub
      .getByRole("button", { name: "A saved quick message", exact: true })
      .click();
    await expect(
      pub.getByRole("textbox", { name: "Your message" }),
    ).toHaveValue("A saved quick message");
    await expect(
      pub.getByRole("textbox", { name: "Your message" }),
    ).toHaveAttribute("maxlength", "240");
    await pub.close();
    await page.getByRole("link", { name: "Appearance", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Card radius", exact: true })
      .selectOption("32px");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Draft saved",
    );
    await page
      .getByRole("link", { name: "Asset library", exact: true })
      .click();
    await page
      .locator('input[type="file"]')
      .setInputFiles("public/assets/abdullah-illustrated-avatar.webp");
    await page.getByLabel("English alt text").fill("Test owner avatar");
    await page.getByLabel("Arabic alt text").fill("صورة المالك للتجربة");
    await page
      .getByRole("button", { name: "Save to library", exact: true })
      .click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Image saved",
    );
    await page
      .getByRole("button", { name: "Use as avatar", exact: true })
      .click();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Draft saved",
    );
    row = await api("content");
    expect(row.draft.profile.avatar).toMatch(/^\/media\//);
    expect((await page.request.get(row.draft.profile.avatar)).status()).toBe(
      200,
    );
    const invalid = await page.request.post("/api/admin/assets/", {
      headers: { Origin: origin },
      multipart: {
        file: {
          name: "bad.svg",
          mimeType: "image/svg+xml",
          buffer: Buffer.from('<svg onload="alert(1)"/>'),
        },
      },
    });
    expect(invalid.status()).toBe(422);
    await page.getByRole("link", { name: "QR code", exact: true }).click();
    await page
      .getByLabel("Canonical Connect URL")
      .fill("https://example.com/connect/?source=qr");
    await expect(
      page.getByRole("button", { name: "Download QR as PNG" }),
    ).toBeEnabled();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download QR as SVG" }).click();
    expect((await download).suggestedFilename()).toMatch(/\.svg$/);
    await page
      .getByRole("link", { name: "Digital contact", exact: true })
      .click();
    const vcard = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download draft vCard" }).click();
    expect((await vcard).suggestedFilename()).toMatch(/\.vcf$/);
    // Save the URL edit before leaving the active editor; shared state survives sidebar navigation.
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Draft saved",
    );
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Published.",
    );
    const themed = await context.newPage();
    await themed.setViewportSize({ width: 390, height: 844 });
    await themed.goto("/connect/?lang=en");
    await expect(themed.locator("main")).toHaveAttribute("data-ready", "true");
    await expect(themed.locator(".contact-card").first()).toHaveCSS(
      "border-radius",
      "32px",
    );
    await expect(themed.locator(".avatar")).toHaveAttribute(
      "alt",
      "Test owner avatar",
    );
    await themed.close();
    await page
      .getByRole("link", { name: "Published history", exact: true })
      .click();
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("button", { name: "Restore to draft", exact: true })
      .last()
      .click();
    await expect(page.locator(".admin-toast[role=status]")).toContainText(
      "Revision restored",
    );
    row = await api("content");
    expect(row.draft.profile.name.en).toBe(original.published.profile.name.en);
    for (const section of [
      "dashboard",
      "featured",
      "localization",
      "analytics",
      "seo",
      "settings",
      "activity",
    ]) {
      await page.goto(`/admin/${section}/`);
      await expect(page.locator(".page-heading h1")).toBeVisible();
      await expect(page.locator(".admin-error")).toHaveCount(0);
    }
    await page.getByRole("button", { name: "العربية", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(
      page.getByRole("heading", { name: "سجل النشاط", exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBeTruthy();
    await page.screenshot({
      path: "artifacts/admin/arabic-mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("button", { name: "فتح التنقل" }).click();
    await expect(
      page.getByRole("link", { name: "الملف الشخصي", exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "الملف الشخصي", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "الملف الشخصي", exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    const row = (await api("content")) as ContentRecord;
    const saved = (await api("content", "PUT", {
      version: row.version,
      content: original.published,
    })) as ContentRecord;
    await api("publish", "POST", { version: saved.version });
  }
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  expect((await page.request.get("/api/admin/content/")).status()).toBe(401);
});
