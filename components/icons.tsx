import {
  Globe,
  Mail,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  BriefcaseBusiness,
} from "lucide-react";
import { siWhatsapp, siTelegram, siGithub } from "simple-icons";
import type { ContactId } from "@/lib/config";
export function BrandIcon({
  id,
  className,
}: {
  id: ContactId;
  className?: string;
}) {
  const brand =
    id === "whatsapp"
      ? siWhatsapp
      : id === "telegram"
        ? siTelegram
        : id === "github"
          ? siGithub
          : null;
  if (brand)
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d={brand.path} />
      </svg>
    );
  if (id === "linkedin")
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.39-.74 1.35-1.52 2.79-1.52 2.98 0 3.58 1.96 3.58 4.51v5.26Z" />
      </svg>
    );
  const Icon =
    (
      {
        globe: Globe,
        email: Mail,
        graduation: GraduationCap,
        sparkles: Sparkles,
        shield: ShieldCheck,
      } as Record<string, typeof Globe>
    )[id] || BriefcaseBusiness;
  return <Icon className={className} aria-hidden="true" />;
}
