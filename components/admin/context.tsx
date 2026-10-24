"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { SiteConfig, Locale } from "@/lib/config";
export type CMSContext = {
  draft: SiteConfig;
  setDraft: (v: SiteConfig) => void;
  locale: Locale;
  tr: (en: string, ar: string) => string;
  busy: boolean;
  notify: (message: string, error?: boolean) => void;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
  reload: () => Promise<void>;
};
export const Context = createContext<CMSContext | null>(null);
export function useCMS() {
  const c = useContext(Context);
  if (!c) throw new Error("CMS context required");
  return c;
}
export function valueAt(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((v, k) => (v as Record<string, unknown>)?.[k], source);
}
export function useField(path: string) {
  const c = useCMS();
  return {
    value: valueAt(c.draft, path),
    set: (value: unknown) => {
      const draft = structuredClone(c.draft);
      const parts = path.split(".");
      const key = parts.pop()!;
      const parent = parts.reduce<unknown>(
        (v, k) => (v as Record<string, unknown>)[k],
        draft,
      ) as Record<string, unknown>;
      parent[key] = value;
      c.setDraft(draft);
    },
  };
}
export function Field({
  path,
  label,
  ar,
  type = "text",
  options,
  hint,
  min,
  max,
}: {
  path: string;
  label: string;
  ar: string;
  type?: string;
  options?: readonly string[];
  hint?: string;
  min?: number;
  max?: number;
}) {
  const { tr } = useCMS(),
    { value, set } = useField(path);
  const id = `field-${path}`;
  return (
    <label
      className={`admin-field ${type === "checkbox" ? "toggle-field" : ""}`}
      htmlFor={id}
    >
      <span>{tr(label, ar)}</span>
      {type === "checkbox" ? (
        <input
          id={id}
          type="checkbox"
          checked={!!value}
          onChange={(e) => set(e.target.checked)}
        />
      ) : options ? (
        <select
          id={id}
          value={String(value ?? "")}
          onChange={(e) => set(e.target.value)}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {tr(
                o === "manrope" ? "Brand fonts" : o,
                (
                  {
                    mint: "نعناعي",
                    green: "أخضر",
                    blue: "أزرق",
                    cream: "كريمي",
                    lavender: "بنفسجي فاتح",
                    pink: "وردي",
                    new: "نافذة جديدة",
                    same: "النافذة الحالية",
                    link: "رابط",
                    email: "بريد إلكتروني",
                    whatsapp: "واتساب",
                    none: "بدون",
                    soft: "خفيف",
                    medium: "متوسط",
                    system: "خط الجهاز",
                    manrope: "خطوط الهوية",
                    center: "المنتصف",
                    top: "الأعلى",
                    bottom: "الأسفل",
                    student: "طالب",
                    automation: "أتمتة",
                    security: "أمن",
                    globe: "موقع",
                    graduation: "تعليم",
                    sparkles: "إبداع",
                    shield: "حماية",
                  } as Record<string, string>
                )[o] || o,
              )}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={id}
          value={String(value ?? "")}
          maxLength={max || 2000}
          rows={3}
          onChange={(e) => set(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={String(value ?? "")}
          dir={type === "url" || type === "email" ? "ltr" : undefined}
          maxLength={max || 2000}
          min={min}
          max={max}
          onChange={(e) =>
            set(type === "number" ? Number(e.target.value) : e.target.value)
          }
        />
      )}{" "}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Bi({
  path,
  label,
  ar,
  textarea = false,
}: {
  path: string;
  label: string;
  ar: string;
  textarea?: boolean;
}) {
  const { tr } = useCMS();
  return (
    <fieldset className="bilingual">
      <legend>{tr(label, ar)}</legend>
      <div>
        <label className="admin-field">
          <span>English</span>
          <BiInput
            path={
              path.startsWith("copy.")
                ? `copy.en.${path.slice(5)}`
                : path + ".en"
            }
            lang="en"
            textarea={textarea}
          />
        </label>
        <label className="admin-field">
          <span>العربية</span>
          <BiInput
            path={
              path.startsWith("copy.")
                ? `copy.ar.${path.slice(5)}`
                : path + ".ar"
            }
            lang="ar"
            textarea={textarea}
          />
        </label>
      </div>
    </fieldset>
  );
}
function BiInput({
  path,
  lang,
  textarea,
}: {
  path: string;
  lang: Locale;
  textarea?: boolean;
}) {
  const { value, set } = useField(path);
  const props = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    value: String(value ?? ""),
    maxLength: 2000,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(e.target.value),
  };
  return (
    <>
      {textarea ? <textarea rows={3} {...props} /> : <input {...props} />}{" "}
      {!String(value ?? "").trim() && (
        <small className="missing-translation">
          {lang === "ar" ? "الترجمة غير مكتملة" : "Translation is missing"}
        </small>
      )}
    </>
  );
}
export function Panel({
  title,
  ar,
  description,
  children,
}: {
  title: string;
  ar: string;
  description?: string;
  children: ReactNode;
}) {
  const { tr } = useCMS();
  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <h2>{tr(title, ar)}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}
