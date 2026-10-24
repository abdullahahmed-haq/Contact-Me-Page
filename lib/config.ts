import { z } from "zod";
import { messages } from "./i18n";
import { isPublicUrl } from "./contact";
export type Locale = "en" | "ar";
export type Localized = Record<Locale, string>;
export type ContactId = string;
const text = z.string().max(2000);
const localized = z.object({ en: text, ar: text });
export const optionalUrl = z.union([
  z.literal(""),
  z
    .string()
    .max(2048)
    .refine(isPublicUrl, "Use a public HTTPS URL without credentials"),
]);
const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color");
const media = z
  .string()
  .max(2048)
  .refine(
    (v) =>
      v === "" ||
      /^\/assets\/[a-zA-Z0-9._-]+$/.test(v) ||
      /^\/media\/[a-f0-9-]{36}\/?$/.test(v) ||
      isPublicUrl(v),
    "Select an image from the asset library",
  );
export const iconNames = [
  "portfolio",
  "whatsapp",
  "telegram",
  "email",
  "github",
  "linkedin",
  "globe",
  "graduation",
  "sparkles",
  "shield",
] as const;
export const tones = [
  "mint",
  "green",
  "blue",
  "cream",
  "lavender",
  "pink",
] as const;
const id = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/);
const cardSchema = z.object({
  id,
  type: z.enum(["link", "whatsapp", "email"]).default("link"),
  title: localized,
  subtitle: localized,
  url: optionalUrl,
  icon: z.enum(iconNames).default("portfolio"),
  enabled: z.boolean(),
  order: z.number().int().min(0).max(1000),
  tone: z.enum(tones),
  opening: z.enum(["new", "same"]).default("new"),
  sheet: z.boolean().default(true),
});
export const siteConfigSchema = z
  .object({
    profile: z.object({
      name: localized,
      greeting: localized,
      subtitle: localized,
      intro: localized,
      avatar: media,
      avatarAlt: localized,
      avatarBackground: color.default("#d2f2e9"),
      badges: z
        .array(
          z.object({
            id,
            icon: z
              .enum(["student", "automation", "security"])
              .default("student"),
            label: localized,
            enabled: z.boolean().default(true),
          }),
        )
        .max(12),
    }),
    featured: z.object({
      enabled: z.boolean(),
      title: localized,
      subtitle: localized,
      url: optionalUrl,
      cta: localized.default({ en: messages.en.visit, ar: messages.ar.visit }),
      image: media.default("/assets/website-preview.svg"),
      alt: localized.default({
        en: messages.en.preview,
        ar: messages.ar.preview,
      }),
      position: z.enum(["center", "top", "bottom"]).default("center"),
      tone: z.enum(tones).default("blue"),
    }),
    contacts: z.array(cardSchema).max(30),
    whatsappNumber: z
      .string()
      .transform((v) => v.replace(/[+\s()-]/g, " ").replace(/ /g, ""))
      .pipe(
        z
          .string()
          .regex(
            /^(?:|[1-9]\d{7,14})$/,
            "Use an international number, including country code",
          ),
      ),
    whatsapp: z
      .object({
        enabled: z.boolean(),
        maxLength: z.number().int().min(1).max(500),
        accent: color,
      })
      .default({ enabled: true, maxLength: 500, accent: "#e4f8da" }),
    email: z.union([z.literal(""), z.email().max(254)]),
    quickMessages: z
      .array(
        z.object({
          id,
          text: localized,
          order: z.number().int().min(0).max(1000),
          enabled: z.boolean().default(true),
          emoji: z.string().max(8).default(""),
        }),
      )
      .max(30),
    canonicalUrl: optionalUrl,
    qr: z
      .object({
        foreground: z.enum(["#111111", "#173523", "#172d50"]),
        background: z.literal("#ffffff"),
      })
      .default({ foreground: "#111111", background: "#ffffff" }),
    vcard: z.object({
      fullName: text,
      familyName: text,
      givenName: text,
      fullNameAr: text.default(""),
      phone: z
        .string()
        .max(40)
        .regex(/^[+0-9 ()-]*$/),
      email: z.union([z.literal(""), z.email()]),
      website: optionalUrl,
      organization: text.default(""),
      title: text.default(""),
      profiles: z
        .array(z.object({ label: z.string().max(80), url: optionalUrl }))
        .max(20),
    }),
    sections: z.object({ qr: z.boolean(), saveContact: z.boolean() }),
    theme: z.object({
      surface: color,
      ink: color,
      radius: z.string().regex(/^(1[6-9]|2[0-9]|3[0-6])px$/),
      gap: z.string().regex(/^(8|9|1[0-9]|2[0-4])px$/),
      duration: z.enum(["0ms", "120ms", "220ms", "300ms"]),
      muted: color.default("#626760"),
      sheet: color.default("#fffcf7"),
      buttonRadius: z.enum(["12px", "20px", "999px"]).default("999px"),
      shadow: z.enum(["none", "soft", "medium"]).default("soft"),
      font: z.enum(["manrope", "system"]).default("manrope"),
      accents: z
        .object({
          mint: color,
          green: color,
          blue: color,
          cream: color,
          lavender: color,
          pink: color,
        })
        .default({
          mint: "#e4f8da",
          green: "#e9f6dc",
          blue: "#dce9ff",
          cream: "#fff0d5",
          lavender: "#ebddff",
          pink: "#fce2eb",
        }),
    }),
    seo: z
      .object({
        title: localized,
        description: localized,
        image: media,
        sharingImage: media,
        favicon: media,
        index: z.boolean(),
      })
      .default({
        title: {
          en: "Abdullah Ahmed — Let’s connect",
          ar: "عبدالله أحمد — خلينا نتواصل",
        },
        description: {
          en: "Student, AI automation and cybersecurity. Explore my work and let’s build something great together.",
          ar: "طالب ومهتم بالأتمتة بالذكاء الاصطناعي والأمن السيبراني. اكتشف أعمالي وخلينا نتواصل.",
        },
        image: "",
        sharingImage: "",
        favicon: "",
        index: true,
      }),
    settings: z
      .object({
        baseUrl: optionalUrl,
        defaultLocale: z.enum(["en", "ar"]),
        locales: z
          .array(z.enum(["en", "ar"]))
          .min(1)
          .max(2),
        enabled: z.boolean(),
        analytics: z.boolean(),
      })
      .default({
        baseUrl: "",
        defaultLocale: "en",
        locales: ["en", "ar"],
        enabled: true,
        analytics: false,
      }),
    copy: z
      .object({
        en: z.object(
          Object.fromEntries(
            Object.keys(messages.en).map((k) => [k, text]),
          ) as Record<keyof typeof messages.en, typeof text>,
        ),
        ar: z.object(
          Object.fromEntries(
            Object.keys(messages.ar).map((k) => [k, text]),
          ) as Record<keyof typeof messages.ar, typeof text>,
        ),
      })
      .default(messages),
  })
  .superRefine((c, ctx) => {
    for (const [name, items] of [
      ["contacts", c.contacts],
      ["quickMessages", c.quickMessages],
      ["badges", c.profile.badges],
    ] as const) {
      if (new Set(items.map((x) => x.id)).size !== items.length)
        ctx.addIssue({
          code: "custom",
          path: [name],
          message: "IDs must be unique",
        });
    }
    if (c.contacts.some((x) => ["website", "qr", "save"].includes(x.id)))
      ctx.addIssue({
        code: "custom",
        path: ["contacts"],
        message: "This ID is reserved",
      });
    if (!c.settings.locales.includes(c.settings.defaultLocale))
      ctx.addIssue({
        code: "custom",
        path: ["settings", "defaultLocale"],
        message: "Default language must be enabled",
      });
    c.quickMessages.forEach((m, i) => {
      for (const locale of ["en", "ar"] as const) {
        if (
          m.enabled &&
          (m.emoji + m.text[locale]).length > c.whatsapp.maxLength
        )
          ctx.addIssue({
            code: "custom",
            path: ["quickMessages", i, "text", locale],
            message: "Quick message exceeds the configured WhatsApp limit",
          });
      }
    });
    const luminance = (v: string) => {
      const c = [1, 3, 5]
        .map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
        .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
    };
    const contrast = (a: string, b: string) => {
      const x = luminance(a),
        y = luminance(b);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
    if (
      contrast(c.theme.surface, c.theme.ink) < 4.5 ||
      contrast(c.theme.sheet, c.theme.ink) < 4.5
    )
      ctx.addIssue({
        code: "custom",
        path: ["theme", "ink"],
        message:
          "Text must have at least 4.5:1 contrast against page and sheet surfaces",
      });
    if (contrast(c.theme.surface, c.theme.muted) < 4.5)
      ctx.addIssue({
        code: "custom",
        path: ["theme", "muted"],
        message:
          "Secondary text needs at least 4.5:1 contrast against the page",
      });
  });
export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type ContactConfig = SiteConfig["contacts"][number];
export type SheetTone = ContactConfig["tone"] | "dark";
const L = (en: string, ar: string): Localized => ({ en, ar });
export const defaultSiteConfig = siteConfigSchema.parse({
  profile: {
    name: L("Abdullah Ahmed", "عبدالله أحمد"),
    greeting: L("Hello! 👋", "أهلًا! 👋"),
    subtitle: L(
      "Student • AI Automation • Cybersecurity",
      "طالب • أتمتة بالذكاء الاصطناعي • أمن سيبراني",
    ),
    intro: L(
      "Let’s connect and build something great.",
      "خلينا نتواصل ونبني حاجة رائعة مع بعض.",
    ),
    avatar: "/assets/abdullah-illustrated-avatar.webp",
    avatarAlt: L(
      "Illustrated avatar placeholder for Abdullah Ahmed",
      "صورة رمزية توضيحية لعبدالله أحمد",
    ),
    badges: [
      { id: "student", icon: "student", label: L("Student", "طالب") },
      {
        id: "automation",
        icon: "automation",
        label: L("AI Automation", "أتمتة ذكية"),
      },
      {
        id: "security",
        icon: "security",
        label: L("Cybersecurity", "أمن سيبراني"),
      },
    ],
  },
  featured: {
    enabled: true,
    title: L("My Website", "موقعي الشخصي"),
    subtitle: L("Portfolio, projects & more", "أعمالي ومشاريعي والمزيد"),
    url: "",
  },
  contacts: [
    {
      id: "portfolio",
      icon: "portfolio",
      type: "link",
      title: L("Portfolio", "أعمالي"),
      subtitle: L("My work & projects", "شوف بعض أعمالي"),
      url: "",
      enabled: true,
      order: 0,
      tone: "mint",
    },
    {
      id: "whatsapp",
      icon: "whatsapp",
      type: "whatsapp",
      title: L("WhatsApp", "واتساب"),
      subtitle: L("Let’s chat", "خلينا نبدأ محادثة"),
      url: "",
      enabled: true,
      order: 1,
      tone: "green",
    },
    {
      id: "telegram",
      icon: "telegram",
      type: "link",
      title: L("Telegram", "تيليجرام"),
      subtitle: L("Quick messages", "رسالة ونكون على تواصل"),
      url: "",
      enabled: true,
      order: 2,
      tone: "blue",
    },
    {
      id: "email",
      icon: "email",
      type: "email",
      title: L("Email", "البريد الإلكتروني"),
      subtitle: L("Get in touch", "الأفكار الحلوة بتبدأ هنا"),
      url: "",
      enabled: true,
      order: 3,
      tone: "cream",
    },
    {
      id: "github",
      icon: "github",
      type: "link",
      title: L("GitHub", "جيت هاب"),
      subtitle: L("Code & projects", "برمجة وإبداع وتجارب"),
      url: "https://github.com/abdullahahmed-haq",
      enabled: true,
      order: 4,
      tone: "lavender",
    },
    {
      id: "linkedin",
      icon: "linkedin",
      type: "link",
      title: L("LinkedIn", "لينكد إن"),
      subtitle: L("Let’s connect", "نكبّر شبكة علاقاتنا"),
      url: "",
      enabled: true,
      order: 5,
      tone: "pink",
    },
  ],
  whatsappNumber: "201034243496",
  email: "",
  quickMessages: [
    { id: "hello", text: L("Hi! 👋", "أهلًا! 👋"), order: 0 },
    { id: "question", text: L("I have a question", "عندي سؤال"), order: 1 },
    {
      id: "collaborate",
      text: L("Let’s collaborate", "خلينا نتعاون"),
      order: 2,
    },
    {
      id: "work",
      text: L("Interested in your work", "مهتم بأعمالك"),
      order: 3,
    },
  ],
  canonicalUrl: process.env.NEXT_PUBLIC_CONNECT_URL || "",
  vcard: {
    fullName: "Abdullah Ahmed",
    familyName: "Ahmed",
    givenName: "Abdullah",
    phone: "+201034243496",
    email: "",
    website: "",
    profiles: [
      { label: "GitHub", url: "https://github.com/abdullahahmed-haq" },
      { label: "Instagram", url: "https://www.instagram.com/abdobug_1/" },
    ],
  },
  sections: { qr: true, saveContact: true },
  theme: {
    surface: "#fffcf7",
    ink: "#171917",
    radius: "28px",
    gap: "14px",
    duration: "220ms",
  },
});

// Pure defaults for tooling and tests; the public app reads the published repository.
export async function getSiteConfig(): Promise<SiteConfig> {
  return structuredClone(defaultSiteConfig);
}
