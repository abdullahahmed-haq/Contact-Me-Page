"use client";
import { MotionConfig } from "motion/react";
import { Mail, QrCode, UserRoundPlus, Globe } from "lucide-react";
import type { ContactId, Locale, SheetTone, SiteConfig } from "@/lib/config";
import type { InitialQR } from "@/lib/qr-data";
import { BrandIcon } from "./icons";
import { BottomSheet } from "./bottom-sheet";
import { MessageComposer } from "./message-composer";
import { QRCodeSheetContent } from "./qr-sheet-content";
import {
  LinkSheetContent,
  SaveContactSheetContent,
} from "./action-sheet-content";

export type ActionSheetProps = {
  config: SiteConfig;
  locale: Locale;
  sheet: ContactId | null;
  open: boolean;
  onClose: () => void;
  returnFocus: HTMLElement | null;
  initialQR?: InitialQR;
};

export function ActionSheet({
  config,
  locale,
  sheet,
  open,
  onClose,
  returnFocus,
  initialQR,
}: ActionSheetProps) {
  const t = config.copy[locale];
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
      <BottomSheet
        open={open}
        onClose={onClose}
        returnFocus={returnFocus}
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
            initialQR={initialQR}
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
