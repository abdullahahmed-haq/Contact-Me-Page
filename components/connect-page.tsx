"use client";
import { useEffect, useState, type CSSProperties } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MotionConfig } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  MoreHorizontal,
  Globe,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Mail,
  UserRoundPlus,
  Check,
  Languages,
  BriefcaseBusiness,
} from "lucide-react";
import type { ContactConfig, Locale, SiteConfig } from "@/lib/config";
import { messages } from "@/lib/i18n";
import { buildVCard, downloadBlob } from "@/lib/contact";
import { BrandIcon } from "./icons";
import { BottomSheet } from "./bottom-sheet";
import { MessageComposer } from "./message-composer";
import { QRCodeCard } from "./qr-card";
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
      <span className={`contact-icon ${card.id}`}>
        {card.id === "email" ? (
          <Mail aria-hidden="true" />
        ) : (
          <BrandIcon id={card.id} />
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
  return card.url ? (
    <a
      data-contact={card.id}
      className={`contact-card ${card.tone}`}
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {content}
    </a>
  ) : (
    <button
      data-contact={card.id}
      className={`contact-card ${card.tone}`}
      onClick={onAction}
    >
      {content}
    </button>
  );
}
export function ConnectPage({ config }: { config: SiteConfig }) {
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");
  const [sheet, setSheet] = useState<
    "whatsapp" | "email" | "unavailable" | null
  >(null);
  const [downloadError, setDownloadError] = useState("");
  const t = messages[locale];
  useEffect(() => {
    setReady(true);
    try {
      const saved = localStorage.getItem("connect-locale");
      if (saved === "en" || saved === "ar") setLocale(saved);
    } catch {}
  }, []);
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
  } as CSSProperties;
  const close = () => setSheet(null);
  const icons = {
    student: GraduationCap,
    automation: Sparkles,
    security: ShieldCheck,
  };
  function saveContact() {
    try {
      downloadBlob(
        new Blob([buildVCard(config.vcard)], {
          type: "text/vcard;charset=utf-8",
        }),
        "abdullah-ahmed.vcf",
      );
    } catch {
      setDownloadError(t.downloadError);
    }
  }
  return (
    <MotionConfig reducedMotion="user">
      <main
        data-ready={ready}
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
                {(["en", "ar"] as Locale[]).map((l) => (
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
        </header>
        <div className="category-badges reveal">
          {config.profile.badges.map((b) => {
            const Icon = icons[b.id];
            return (
              <span key={b.id} className={`category-badge badge-${b.id}`}>
                <Icon size={19} strokeWidth={2.2} aria-hidden="true" />
                {b.label[locale]}
              </span>
            );
          })}
        </div>
        <div id="links" className="links-content">
          {config.featured.enabled && (
            <section className="featured-card reveal">
              <div className="featured-content">
                <div>
                  <h2>{config.featured.title[locale]}</h2>
                  <p>{config.featured.subtitle[locale]}</p>
                  {config.featured.url ? (
                    <a
                      href={config.featured.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="black-button"
                    >
                      {t.visit}
                      <ArrowRight size={21} />
                    </a>
                  ) : (
                    <button
                      className="black-button"
                      onClick={() => setSheet("unavailable")}
                    >
                      {t.visit}
                      <ArrowRight size={21} />
                    </button>
                  )}
                </div>
              </div>
              <img
                className="website-preview"
                src="/assets/website-preview.svg"
                width={360}
                height={270}
                alt={t.preview}
              />
            </section>
          )}
          <div className="contact-grid reveal">
            {[...config.contacts]
              .filter((c) => c.enabled)
              .sort((a, b) => a.order - b.order)
              .map((c) => (
                <ContactCard
                  card={c}
                  key={c.id}
                  locale={locale}
                  onAction={() =>
                    setSheet(
                      c.id === "whatsapp"
                        ? "whatsapp"
                        : c.id === "email"
                          ? "email"
                          : "unavailable",
                    )
                  }
                />
              ))}
          </div>
          <div className="closing-grid reveal">
            {config.sections.qr && (
              <QRCodeCard url={config.canonicalUrl} t={t} />
            )}{" "}
            {config.sections.saveContact && (
              <section className="save-card">
                <span className="save-icon">
                  <UserRoundPlus size={28} />
                </span>
                <div>
                  <h2>{t.save}</h2>
                  <p>{t.saveSub}</p>
                </div>
                <button
                  className="black-button"
                  onClick={saveContact}
                  aria-label={t.vcard}
                >
                  <UserRoundPlus size={20} />
                  {t.saveAction}
                </button>
                {downloadError && <p role="alert">{downloadError}</p>}
              </section>
            )}
          </div>
        </div>
      </main>
      <BottomSheet
        open={sheet !== null}
        onClose={close}
        title={
          sheet === "whatsapp"
            ? t.whatsapp
            : sheet === "email"
              ? t.email
              : t.unavailableTitle
        }
        subtitle={
          sheet === "whatsapp"
            ? t.whatsappSubtitle
            : sheet === "email"
              ? t.emailSubtitle
              : t.unconfigured
        }
        icon={
          sheet === "whatsapp" ? (
            <BrandIcon id="whatsapp" />
          ) : sheet === "email" ? (
            <Mail />
          ) : (
            <Globe />
          )
        }
        locale={locale}
        t={t}
        accent={sheet === "whatsapp" ? "green" : "blue"}
      >
        {sheet === "whatsapp" || sheet === "email" ? (
          <MessageComposer
            key={`${sheet}-${locale}`}
            kind={sheet}
            config={config}
            locale={locale}
            t={t}
          />
        ) : (
          <div className="unavailable-content">
            <p>{t.unconfiguredDetail}</p>
            <button
              className="send-button"
              onClick={() => setSheet("whatsapp")}
            >
              <BrandIcon id="whatsapp" />
              {t.whatsapp}
              <ArrowUpRight size={20} />
            </button>
          </div>
        )}
      </BottomSheet>
    </MotionConfig>
  );
}
