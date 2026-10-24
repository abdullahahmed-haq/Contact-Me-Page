"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MotionConfig } from "motion/react";
import {
  ArrowRight,
  ChevronRight,
  MoreHorizontal,
  Globe,
  QrCode,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Mail,
  UserRoundPlus,
  Check,
  Languages,
} from "lucide-react";
import type {
  ContactConfig,
  ContactId,
  Locale,
  SheetTone,
  SiteConfig,
} from "@/lib/config";
import { trackEvent } from "@/lib/analytics";
import { BrandIcon } from "./icons";
import { BottomSheet } from "./bottom-sheet";
import { MessageComposer } from "./message-composer";
import { QRCodeCard, QRCodeSheetContent } from "./qr-card";
import {
  LinkSheetContent,
  SaveContactSheetContent,
} from "./action-sheet-content";
function DecorativeShapes() {
  return (
    <svg
      className="hero-strokes"
      viewBox="0 0 70 90"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 79c-1-26 3-50 8-50 3 0 2 24 9 24 5 0 7-39 24-48"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ContactCard({
  card,
  locale,
  onAction,
}: {
  card: ContactConfig;
  locale: Locale;
  onAction: () => void;
}) {
  const content = (
    <>
      <span className={`contact-icon ${card.icon}`}>
        {card.icon === "email" ? (
          <Mail aria-hidden="true" />
        ) : (
          <BrandIcon id={card.icon} />
        )}
      </span>
      <span className="contact-copy">
        <span className="contact-title">{card.title[locale]}</span>
        <span className="contact-subtitle">{card.subtitle[locale]}</span>
      </span>
      <span className="arrow-circle">
        <ChevronRight size={20} />
      </span>
    </>
  );
  return (
    <button
      data-contact={card.id}
      className={`contact-card ${card.tone}`}
      onClick={onAction}
      aria-haspopup="dialog"
    >
      {content}
    </button>
  );
}
export function ConnectPage({
  config,
  preview = false,
  initialLocale,
}: {
  config: SiteConfig;
  preview?: boolean;
  initialLocale?: Locale;
}) {
  const viewed = useRef(false);
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState<Locale>(
    initialLocale || config.settings.defaultLocale,
  );
  const [sheet, setSheet] = useState<
    ContactId | "website" | "qr" | "save" | null
  >(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openSheet = (id: ContactId | "website" | "qr" | "save") => {
    trackEvent(`${id === "website" ? "website_open" : id + "_open"}`);
    setSheet(id);
    setSheetOpen(true);
  };
  const t = config.copy[locale];
  useEffect(() => {
    setReady(true);
    try {
      const saved = localStorage.getItem("connect-locale");
      if (
        !initialLocale &&
        (saved === "en" || saved === "ar") &&
        config.settings.locales.includes(saved)
      )
        setLocale(saved);
    } catch {}
  }, [initialLocale, config.settings.locales]);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("connect-locale", locale);
    } catch {}
  }, [locale, ready]);
  const theme = {
    "--surface": config.theme.surface,
    "--ink": config.theme.ink,
    "--card-radius": config.theme.radius,
    "--gap": config.theme.gap,
    "--duration": config.theme.duration,
    "--muted": config.theme.muted,
    "--shadow":
      config.theme.shadow === "none"
        ? "none"
        : config.theme.shadow === "medium"
          ? "0 12px 28px -10px #33432a48"
          : "0 8px 24px -14px #33432a38",
    "--button-radius": config.theme.buttonRadius,
    "--avatar-bg": config.profile.avatarBackground,
    "--reveal-duration": config.theme.duration === "0ms" ? "0ms" : "500ms",
    "--font-body":
      config.theme.font === "system"
        ? "system-ui,sans-serif"
        : locale === "ar"
          ? '"Noto Sans Arabic Variable",sans-serif'
          : '"Manrope Variable",sans-serif',
    ...Object.fromEntries(
      Object.entries(config.theme.accents)
        .filter(
          ([k, v]) =>
            v !==
            (
              {
                mint: "#e4f8da",
                green: "#e9f6dc",
                blue: "#dce9ff",
                cream: "#fff0d5",
                lavender: "#ebddff",
                pink: "#fce2eb",
              } as Record<string, string>
            )[k],
        )
        .map(([k, v]) => [`--custom-${k}`, v]),
    ),
  } as CSSProperties;
  useEffect(() => {
    const root = document.documentElement;
    for (const key of Object.keys(config.theme.accents))
      root.style.removeProperty(`--custom-${key}`);
    for (const [k, v] of Object.entries(theme))
      root.style.setProperty(k, String(v));
    root.style.background = config.theme.surface;
    root.style.setProperty("--sheet-surface", config.theme.sheet);
    root.style.setProperty("--wa-accent", config.whatsapp.accent);
    root.dataset.customButtons = String(config.theme.buttonRadius !== "999px");
    root.dataset.analytics =
      !preview && config.settings.analytics ? "enabled" : "disabled";
    if (!preview && !viewed.current) {
      viewed.current = true;
      trackEvent("page_view");
      if (new URLSearchParams(location.search).get("source") === "qr")
        trackEvent("qr_referral");
    }
    return () => {
      root.dataset.analytics = "disabled";
    };
    // Public analytics fires once per mounted page; preview updates never emit events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, preview]);
  const close = () => setSheetOpen(false);
  const icons = {
    student: GraduationCap,
    automation: Sparkles,
    security: ShieldCheck,
  };
  const activeCard = config.contacts.find((card) => card.id === sheet);
  const activeTitle = activeCard
    ? activeCard.title[locale]
    : sheet === "qr"
      ? t.scan
      : sheet === "save"
        ? t.save
        : config.featured.title[locale];
  const activeSubtitle =
    activeCard?.type === "whatsapp"
      ? t.whatsappSubtitle
      : activeCard?.type === "email"
        ? t.emailSubtitle
        : activeCard
          ? activeCard.subtitle[locale]
          : sheet === "qr"
            ? t.scanSub
            : sheet === "save"
              ? t.saveDescription
              : config.featured.subtitle[locale];
  const activeTone: SheetTone =
    activeCard?.tone ?? (sheet === "qr" ? "dark" : "blue");
  const activeIcon = activeCard ? (
    activeCard.icon === "email" ? (
      <Mail />
    ) : (
      <BrandIcon id={activeCard.icon} />
    )
  ) : sheet === "qr" ? (
    <QrCode />
  ) : sheet === "save" ? (
    <UserRoundPlus />
  ) : (
    <Globe />
  );
  return (
    <MotionConfig
      reducedMotion={config.theme.duration === "0ms" ? "always" : "user"}
    >
      <main
        data-ready={ready}
        data-custom-radius={config.theme.radius !== "28px"}
        data-custom-spacing={config.theme.gap !== "14px"}
        className="connect-page"
        style={theme}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <a className="skip-link" href="#links">
          {t.skip}
        </a>
        <div className="page-options">
          <DropdownMenu.Root dir={locale === "ar" ? "rtl" : "ltr"}>
            <DropdownMenu.Trigger className="menu-button" aria-label={t.menu}>
              <MoreHorizontal size={25} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="language-menu"
                align="end"
                sideOffset={8}
              >
                <DropdownMenu.Label>
                  <Languages size={16} />
                  {t.language}
                </DropdownMenu.Label>
                {config.settings.locales.map((l) => (
                  <DropdownMenu.Item
                    key={l}
                    onSelect={() => setLocale(l)}
                    lang={l}
                  >
                    {l === "en" ? "English" : "العربية"}
                    {locale === l && <Check size={16} />}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        <header className="profile-hero reveal">
          <div className="hero-text">
            <p className="greeting">{config.profile.greeting[locale]}</p>
            <h1>{config.profile.name[locale]}</h1>
            <p className="profile-subtitle">
              {config.profile.subtitle[locale]}
            </p>
            <p className="intro">{config.profile.intro[locale]}</p>
          </div>
          {config.profile.avatar && (
            <div className="avatar-wrap">
              <span className="avatar-blob" />
              <DecorativeShapes />
              <img
                className="avatar"
                src={config.profile.avatar}
                width={230}
                height={230}
                alt={config.profile.avatarAlt[locale]}
                fetchPriority="high"
              />
            </div>
          )}
        </header>
        <div className="category-badges reveal">
          {config.profile.badges
            .filter((b) => b.enabled)
            .map((b) => {
              const Icon = icons[b.icon];
              return (
                <span key={b.id} className={`category-badge badge-${b.icon}`}>
                  <Icon size={19} strokeWidth={2.2} aria-hidden="true" />
                  {b.label[locale]}
                </span>
              );
            })}
        </div>
        <div id="links" className="links-content">
          {config.featured.enabled && (
            <section
              className={`featured-card reveal featured-tone-${config.featured.tone}`}
            >
              <button
                className="card-trigger"
                data-action="website"
                aria-label={config.featured.cta[locale]}
                aria-haspopup="dialog"
                onClick={() => openSheet("website")}
              />
              <div className="featured-content">
                <div>
                  <h2>{config.featured.title[locale]}</h2>
                  <p>{config.featured.subtitle[locale]}</p>
                  <span className="black-button">
                    {config.featured.cta[locale]}
                    <ArrowRight size={21} />
                  </span>
                </div>
              </div>
              <img
                className="website-preview"
                src={config.featured.image || "/assets/website-preview.svg"}
                style={{ objectPosition: config.featured.position }}
                width={360}
                height={270}
                alt={config.featured.alt[locale]}
              />
            </section>
          )}
          <div className="contact-grid reveal">
            {[...config.contacts]
              .filter(
                (c) =>
                  c.enabled &&
                  (c.type !== "whatsapp" || config.whatsapp.enabled),
              )
              .sort((a, b) => a.order - b.order)
              .map((c) => (
                <ContactCard
                  card={c}
                  key={c.id}
                  locale={locale}
                  onAction={() => {
                    if (!c.sheet && c.type === "link" && c.url) {
                      trackEvent(`${c.id}_click`);
                      if (c.opening === "same") location.assign(c.url);
                      else window.open(c.url, "_blank", "noopener,noreferrer");
                    } else openSheet(c.id);
                  }}
                />
              ))}
          </div>
          <div className="closing-grid reveal">
            {config.sections.qr && (
              <QRCodeCard
                url={config.canonicalUrl}
                qr={config.qr}
                t={t}
                onOpen={() => openSheet("qr")}
              />
            )}{" "}
            {config.sections.saveContact && (
              <section className="save-card">
                <button
                  className="card-trigger"
                  data-action="save"
                  aria-label={t.save}
                  aria-haspopup="dialog"
                  onClick={() => openSheet("save")}
                />
                <span className="save-icon">
                  <UserRoundPlus size={28} />
                </span>
                <div>
                  <h2>{t.save}</h2>
                  <p>{t.saveSub}</p>
                </div>
                <span className="black-button">
                  <UserRoundPlus size={20} />
                  {t.saveAction}
                </span>
              </section>
            )}
          </div>
        </div>
      </main>
      <BottomSheet
        open={sheetOpen}
        onClose={close}
        title={
          activeCard?.type === "email"
            ? t.email
            : activeCard?.type === "whatsapp"
              ? t.whatsapp
              : activeTitle
        }
        subtitle={activeSubtitle}
        icon={activeIcon}
        locale={locale}
        t={t}
        accent={activeTone}
      >
        {activeCard?.type === "whatsapp" || activeCard?.type === "email" ? (
          <MessageComposer
            key={`${sheet}-${locale}`}
            kind={activeCard!.type as "whatsapp" | "email"}
            config={config}
            locale={locale}
            t={t}
          />
        ) : sheet === "qr" ? (
          <QRCodeSheetContent
            key={locale}
            url={config.canonicalUrl}
            qr={config.qr}
            t={t}
          />
        ) : sheet === "save" ? (
          <SaveContactSheetContent contact={config.vcard} t={t} />
        ) : (
          <LinkSheetContent
            opening={activeCard?.opening}
            event={activeCard ? `${activeCard.id}_click` : "website_click"}
            url={
              sheet === "website"
                ? config.featured.url
                : (activeCard?.url ?? "")
            }
            action={
              sheet === "website"
                ? config.featured.cta[locale]
                : t.openOn.replace("{name}", activeTitle)
            }
            t={t}
          />
        )}
      </BottomSheet>
    </MotionConfig>
  );
}
