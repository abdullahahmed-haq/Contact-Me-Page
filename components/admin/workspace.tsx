"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  UserRound,
  Link2,
  MessageCircle,
  MessagesSquare,
  Image,
  Globe,
  QrCode,
  ContactRound,
  Palette,
  Languages,
  ChartNoAxesCombined,
  Search,
  Settings,
  History,
  Clock,
  ArrowUpRight,
  Check,
  Save,
  Send,
  Eye,
  Menu,
  X,
  LogOut,
  Monitor,
  Smartphone,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import type { SiteConfig, Locale } from "@/lib/config";
import type { ContentRecord } from "@/lib/admin-types";
import { Context } from "./context";
import { Editors } from "./editors";
export const navigation = [
  ["dashboard", "Overview", "نظرة عامة", LayoutDashboard],
  ["profile", "Profile", "الملف الشخصي", UserRound],
  ["links", "Contact links", "روابط التواصل", Link2],
  ["whatsapp", "WhatsApp", "واتساب", MessageCircle],
  ["messages", "Quick messages", "الرسائل السريعة", MessagesSquare],
  ["featured", "Featured website", "الموقع المميز", Globe],
  ["assets", "Asset library", "مكتبة الصور", Image],
  ["qr", "QR code", "رمز QR", QrCode],
  ["contact", "Digital contact", "بطاقة التواصل", ContactRound],
  ["appearance", "Appearance", "المظهر", Palette],
  ["localization", "Languages & copy", "اللغات والنصوص", Languages],
  ["analytics", "Analytics", "التحليلات", ChartNoAxesCombined],
  ["seo", "SEO & sharing", "الظهور والمشاركة", Search],
  ["settings", "Settings & security", "الإعدادات والأمان", Settings],
  ["revisions", "Published history", "سجل النشر", History],
  ["activity", "Activity log", "سجل النشاط", Clock],
] as const;
export function AdminWorkspace({
  initial,
  section,
  email,
}: {
  initial: ContentRecord;
  section: string;
  email: string;
}) {
  const [ready, setReady] = useState(false);
  const [activeSection, setActiveSection] = useState(section);
  const [record, setRecord] = useState(initial),
    [draft, setDraft] = useState<SiteConfig>(initial.draft),
    [locale, setLocale] = useState<Locale>("en"),
    [busy, setBusy] = useState(false),
    [menu, setMenu] = useState(false),
    [preview, setPreview] = useState(false),
    [previewLocale, setPreviewLocale] = useState<Locale>("en"),
    [size, setSize] = useState("mobile"),
    [frameReady, setFrameReady] = useState(0),
    [toast, setToast] = useState<{ message: string; error: boolean } | null>(
      null,
    ),
    [issues, setIssues] = useState<{ path: string; message: string }[]>([]);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    function message(e: MessageEvent) {
      if (
        e.origin === location.origin &&
        e.source === frame.current?.contentWindow &&
        e.data?.type === "connect-preview-ready"
      )
        setFrameReady((n) => n + 1);
    }
    window.addEventListener("message", message);
    return () => window.removeEventListener("message", message);
  }, []);
  const tr = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const unsaved = JSON.stringify(draft) !== JSON.stringify(record.draft),
    unpublished =
      JSON.stringify(record.draft) !== JSON.stringify(record.published);
  function notify(message: string, error = false) {
    setToast({ message, error });
  }
  useEffect(() => {
    setReady(true);
    try {
      const l = localStorage.getItem("admin-locale");
      if (l === "ar" || l === "en") setLocale(l);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("admin-locale", locale);
    } catch {}
  }, [locale]);
  useEffect(() => {
    setActiveSection(section);
  }, [section]);
  useEffect(() => {
    setMenu(false);
  }, [activeSection]);
  useEffect(() => {
    function pop() {
      const id = location.pathname.split("/").filter(Boolean)[1] || "dashboard";
      if (navigation.some((n) => n[0] === id)) setActiveSection(id);
    }
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  function navigate(e: React.MouseEvent) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    const a = (e.target as Element).closest("a");
    if (!a || a.target === "_blank") return;
    const url = new URL(a.href);
    const id = url.pathname.split("/").filter(Boolean)[1];
    if (
      url.origin !== location.origin ||
      !url.pathname.startsWith("/admin/") ||
      !navigation.some((n) => n[0] === id)
    )
      return;
    e.preventDefault();
    e.stopPropagation();
    history.pushState(null, "", `/admin/${id}/`);
    setActiveSection(id);
    window.scrollTo({ top: 0 });
  }
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (unsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(
      { type: "connect-preview", content: draft, locale: previewLocale },
      location.origin,
    );
  }, [draft, previewLocale, frameReady, preview, size]);
  async function request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const r = await fetch(`/api/admin/${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
    const body = await r.json();
    if (r.status === 401) {
      location.assign("/admin/login");
      throw new Error(
        tr(
          "Your session expired. Please sign in.",
          "انتهت الجلسة. سجل الدخول مرة أخرى.",
        ),
      );
    }
    if (!r.ok) {
      if (body.issues) setIssues(body.issues);
      throw new Error(body.error || "Request failed");
    }
    return body;
  }
  async function reload() {
    const row = await request<ContentRecord>("content");
    setRecord(row);
    setDraft(row.draft);
    setIssues([]);
  }
  async function save() {
    const row = await request<ContentRecord>("content", {
      method: "PUT",
      body: JSON.stringify({ version: record.version, content: draft }),
    });
    setRecord(row);
    setDraft(row.draft);
    setIssues([]);
    return row;
  }
  async function action(type: "save" | "publish" | "discard") {
    if (
      type === "discard" &&
      !window.confirm(
        tr(
          "Restore the published content? Unsaved and draft changes will be discarded.",
          "استعادة المحتوى المنشور وحذف تغييرات المسودة وغير المحفوظة؟",
        ),
      )
    )
      return;
    if (
      type === "publish" &&
      !window.confirm(
        tr(
          "Publish the current content to your public page?",
          "نشر المحتوى الحالي على صفحتك العامة؟",
        ),
      )
    )
      return;
    setBusy(true);
    setIssues([]);
    try {
      let row = record;
      if (type === "save" || unsaved) row = await save();
      if (type !== "save") {
        row = await request<ContentRecord>(type, {
          method: "POST",
          body: JSON.stringify({ version: row.version }),
        });
        setRecord(row);
        setDraft(row.draft);
      }
      notify(
        type === "publish"
          ? tr(
              "Published. Your public page is up to date.",
              "تم النشر وتحديث صفحتك العامة.",
            )
          : type === "save"
            ? tr(
                "Draft saved. Your public page is unchanged.",
                "حُفظت المسودة. الصفحة العامة لم تتغير.",
              )
            : tr(
                "Published content restored to the editor.",
                "تمت استعادة المحتوى المنشور إلى المحرر.",
              ),
      );
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      const r = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!r.ok) throw new Error("Could not sign out");
      location.assign("/admin/login");
    } catch {
      notify(
        tr(
          "Could not sign out. Try again.",
          "تعذر تسجيل الخروج. حاول مرة أخرى.",
        ),
        true,
      );
    }
  }
  const current = navigation.find((n) => n[0] === activeSection)!;
  return (
    <Context.Provider
      value={{ draft, setDraft, locale, tr, busy, notify, request, reload }}
    >
      <div
        data-ready={ready}
        className="admin-app"
        onClickCapture={navigate}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {menu && (
          <button
            className="sidebar-scrim"
            aria-label={tr("Close navigation", "إغلاق التنقل")}
            onClick={() => setMenu(false)}
          />
        )}
        <aside className={`admin-sidebar ${menu ? "open" : ""}`}>
          <Link href="/admin/dashboard" className="studio-brand">
            <span className="studio-mark">
              a<span>·</span>
            </span>
            <span>
              Connect<strong>{tr("Owner studio", "استوديو المالك")}</strong>
            </span>
          </Link>
          <nav aria-label={tr("Admin navigation", "التنقل الإداري")}>
            {navigation.map(([id, en, ar, Icon], i) => (
              <Link
                key={id}
                href={`/admin/${id}`}
                className={`${activeSection === id ? "active" : ""} ${[1, 9, 13].includes(i) ? "nav-group-start" : ""}`}
                aria-current={activeSection === id ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{tr(en, ar)}</span>
                {activeSection === id && <ChevronRight size={15} />}
              </Link>
            ))}
          </nav>
          <div className="sidebar-owner">
            <span className="owner-avatar">AA</span>
            <div>
              <strong>{tr("Your workspace", "مساحتك الخاصة")}</strong>
              <small title={email}>{email}</small>
            </div>
            <button
              className="icon-button"
              aria-label={tr("Sign out", "تسجيل الخروج")}
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </aside>
        <div className="admin-main">
          <header className="admin-topbar">
            <div>
              <button
                className="icon-button nav-toggle"
                aria-label={tr("Open navigation", "فتح التنقل")}
                onClick={() => setMenu(!menu)}
              >
                <Menu size={21} />
              </button>
              <span className="workspace-label">
                {tr("Personal Connect Hub", "مركز التواصل الشخصي")}
              </span>
            </div>
            <div>
              <button
                className="admin-button quiet"
                onClick={() => setLocale(locale === "en" ? "ar" : "en")}
              >
                <Languages size={16} />
                {locale === "en" ? "العربية" : "English"}
              </button>
              <Link
                className="admin-button quiet"
                href="/connect"
                target="_blank"
              >
                {tr("View live site", "عرض الموقع")}
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </header>
          <div className="admin-content">
            <div className="page-heading">
              <div>
                <h1>{tr(current[1], current[2])}</h1>
                <p>
                  {activeSection === "dashboard"
                    ? tr(
                        "Your little corner of the internet, thoughtfully managed.",
                        "ركنك الخاص على الإنترنت، بكل تفاصيله.",
                      )
                    : tr(
                        "Make it yours. Preview your changes before publishing.",
                        "أضف لمستك. عاين التغييرات قبل نشرها.",
                      )}
                </p>
              </div>
              <button
                className="admin-button"
                onClick={() => setPreview(!preview)}
                aria-pressed={preview}
              >
                <Eye size={17} />
                {tr("Live preview", "معاينة مباشرة")}
              </button>
            </div>
            <div className="publish-bar">
              <div>
                <span
                  className={`status-pill ${unsaved || unpublished ? "draft" : ""}`}
                >
                  <span />
                  {unsaved
                    ? tr("Unsaved changes", "تغييرات غير محفوظة")
                    : unpublished
                      ? tr("Draft changes", "تغييرات المسودة")
                      : tr("Published content", "المحتوى المنشور")}
                </span>
                <small>
                  {record.publishedAt
                    ? tr("Last published ", "آخر نشر ") +
                      new Date(record.publishedAt).toLocaleString(locale)
                    : tr(
                        "Original content · no publications yet",
                        "المحتوى الأصلي · لا توجد عمليات نشر بعد",
                      )}
                </small>
              </div>
              <div className="publish-actions">
                <button
                  className="icon-button"
                  title={tr("Discard draft changes", "تجاهل تغييرات المسودة")}
                  aria-label={tr(
                    "Discard draft changes",
                    "تجاهل تغييرات المسودة",
                  )}
                  disabled={busy || (!unsaved && !unpublished)}
                  onClick={() => action("discard")}
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  className="admin-button"
                  onClick={() => action("save")}
                  disabled={busy || !unsaved}
                >
                  <Save size={16} />
                  {tr("Save draft", "حفظ المسودة")}
                </button>
                <button
                  className="admin-button primary"
                  onClick={() => action("publish")}
                  disabled={busy || (!unsaved && !unpublished)}
                >
                  <Send size={16} />
                  {busy
                    ? tr("Working…", "جارٍ التنفيذ…")
                    : tr("Publish", "نشر")}
                </button>
              </div>
            </div>
            {issues.length > 0 && (
              <div className="admin-error validation-errors" role="alert">
                <strong>
                  {tr(
                    "Review these fields before saving:",
                    "راجع هذه الحقول قبل الحفظ:",
                  )}
                </strong>
                <ul>
                  {issues.map((i, n) => (
                    <li key={n}>
                      <bdi>{i.path}</bdi>: {i.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className={`editor-layout ${preview ? "with-preview" : ""}`}>
              <div className="editor-main">
                <Editors
                  section={activeSection}
                  record={record}
                  unsaved={unsaved}
                />
              </div>
              {preview && (
                <aside className="live-preview">
                  <div className="preview-toolbar">
                    <strong>{tr("Draft preview", "معاينة المسودة")}</strong>
                    <div>
                      <button
                        className={`icon-button ${size === "mobile" ? "selected" : ""}`}
                        aria-label={tr("Mobile preview", "معاينة الهاتف")}
                        onClick={() => setSize("mobile")}
                      >
                        <Smartphone size={17} />
                      </button>
                      <button
                        className={`icon-button ${size === "desktop" ? "selected" : ""}`}
                        aria-label={tr("Desktop preview", "معاينة سطح المكتب")}
                        onClick={() => setSize("desktop")}
                      >
                        <Monitor size={17} />
                      </button>
                      <select
                        aria-label={tr("Preview language", "لغة المعاينة")}
                        value={previewLocale}
                        onChange={(e) =>
                          setPreviewLocale(e.target.value as Locale)
                        }
                      >
                        <option value="en">EN</option>
                        <option value="ar">AR</option>
                      </select>
                      <button
                        className="icon-button"
                        aria-label={tr("Close preview", "إغلاق المعاينة")}
                        onClick={() => setPreview(false)}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                  <p>
                    {tr(
                      "Live edits · only visible to you",
                      "تغييرات مباشرة · ظاهرة لك فقط",
                    )}
                  </p>
                  <div className={`preview-window ${size}`}>
                    <iframe
                      ref={frame}
                      onLoad={() => setFrameReady((n) => n + 1)}
                      src="/admin/preview"
                      title={tr(
                        "Public page draft preview",
                        "معاينة مسودة الصفحة العامة",
                      )}
                    />
                  </div>
                </aside>
              )}
            </div>
          </div>
          <footer className="admin-footer">
            <span>Connect Studio</span>
            <span>
              <Check size={14} />
              {tr("Private workspace", "مساحة خاصة")}
            </span>
          </footer>
        </div>
        {toast && (
          <div
            className={`admin-toast ${toast.error ? "error" : ""}`}
            role={toast.error ? "alert" : "status"}
          >
            {toast.error ? <X size={18} /> : <Check size={18} />}
            <span>{toast.message}</span>
            <button
              className="icon-button"
              aria-label={tr("Dismiss notification", "إغلاق الإشعار")}
              onClick={() => setToast(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </Context.Provider>
  );
}
