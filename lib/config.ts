import { z } from "zod";
export type Locale = "en" | "ar";
export type Localized = Record<Locale, string>;
export type ContactId =
  "portfolio" | "whatsapp" | "telegram" | "email" | "github" | "linkedin";
const localized = z.object({ en: z.string(), ar: z.string() });
const optionalUrl = z.union([
  z.literal(""),
  z.url().refine((v) => /^https:\/\//.test(v), "Use an HTTPS URL"),
]);
const cardSchema = z.object({
  id: z.enum([
    "portfolio",
    "whatsapp",
    "telegram",
    "email",
    "github",
    "linkedin",
  ]),
  title: localized,
  subtitle: localized,
  url: optionalUrl,
  enabled: z.boolean(),
  order: z.number(),
  tone: z.enum(["mint", "green", "blue", "cream", "lavender", "pink"]),
});
export const siteConfigSchema = z.object({
  profile: z.object({
    name: localized,
    greeting: localized,
    subtitle: localized,
    intro: localized,
    avatar: z.string(),
    avatarAlt: localized,
    badges: z.array(
      z.object({
        id: z.enum(["student", "automation", "security"]),
        label: localized,
      }),
    ),
  }),
  featured: z.object({
    enabled: z.boolean(),
    title: localized,
    subtitle: localized,
    url: optionalUrl,
  }),
  contacts: z.array(cardSchema),
  whatsappNumber: z.string().regex(/^(?:|[1-9]\d{7,14})$/),
  email: z.union([z.literal(""), z.email()]),
  quickMessages: z.array(
    z.object({ id: z.string(), text: localized, order: z.number() }),
  ),
  canonicalUrl: optionalUrl,
  vcard: z.object({
    fullName: z.string(),
    familyName: z.string(),
    givenName: z.string(),
    phone: z.string(),
    email: z.string(),
    website: optionalUrl,
    profiles: z.array(z.object({ label: z.string(), url: z.url() })),
  }),
  sections: z.object({ qr: z.boolean(), saveContact: z.boolean() }),
  theme: z.object({
    surface: z.string(),
    ink: z.string(),
    radius: z.string(),
    gap: z.string(),
    duration: z.string(),
  }),
});
export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type ContactConfig = SiteConfig["contacts"][number];
const L = (en: string, ar: string): Localized => ({ en, ar });
const defaults: SiteConfig = {
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
      { id: "student", label: L("Student", "طالب") },
      { id: "automation", label: L("AI Automation", "أتمتة ذكية") },
      { id: "security", label: L("Cybersecurity", "أمن سيبراني") },
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
      title: L("Portfolio", "أعمالي"),
      subtitle: L("My work & projects", "شوف بعض أعمالي"),
      url: "",
      enabled: true,
      order: 0,
      tone: "mint",
    },
    {
      id: "whatsapp",
      title: L("WhatsApp", "واتساب"),
      subtitle: L("Let’s chat", "خلينا نبدأ محادثة"),
      url: "",
      enabled: true,
      order: 1,
      tone: "green",
    },
    {
      id: "telegram",
      title: L("Telegram", "تيليجرام"),
      subtitle: L("Quick messages", "رسالة ونكون على تواصل"),
      url: "",
      enabled: true,
      order: 2,
      tone: "blue",
    },
    {
      id: "email",
      title: L("Email", "البريد الإلكتروني"),
      subtitle: L("Get in touch", "الأفكار الحلوة بتبدأ هنا"),
      url: "",
      enabled: true,
      order: 3,
      tone: "cream",
    },
    {
      id: "github",
      title: L("GitHub", "جيت هاب"),
      subtitle: L("Code & projects", "برمجة وإبداع وتجارب"),
      url: "https://github.com/abdullahahmed-haq",
      enabled: true,
      order: 4,
      tone: "lavender",
    },
    {
      id: "linkedin",
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
};
// Replace this boundary with a server-backed repository for future admin integration.
export async function getSiteConfig(): Promise<SiteConfig> {
  return siteConfigSchema.parse(defaults);
}
