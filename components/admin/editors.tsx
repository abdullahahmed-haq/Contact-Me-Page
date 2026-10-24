"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  GripVertical,
  RotateCcw,
  Copy,
  Download,
  ImagePlus,
  ArrowUpRight,
  Check,
  History,
  ShieldCheck,
  CircleAlert,
} from "lucide-react";
import {
  defaultSiteConfig,
  iconNames,
  tones,
  type SiteConfig,
  type Locale,
} from "@/lib/config";
import type {
  ContentRecord,
  AssetRecord,
  AnalyticsRecord,
  AuditRecord,
  RevisionRecord,
} from "@/lib/admin-types";
import { buildVCard, downloadBlob } from "@/lib/contact";
import { QRCodeSheetContent } from "../qr-sheet-content";
import { useCMS, useField, Field, Bi, Panel, valueAt } from "./context";
import { AssetLibrary } from "./library";
function Collection({
  path,
  title,
  ar,
  create,
  children,
}: {
  path: string;
  title: string;
  ar: string;
  create: () => unknown;
  children: (prefix: string, index: number) => ReactNode;
}) {
  const { value, set } = useField(path);
  const { tr } = useCMS();
  const [drag, setDrag] = useState<number | null>(null);
  const items = value as { id?: string }[];
  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = structuredClone(items);
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    set(
      next.map((v, i) =>
        path === "contacts" || path === "quickMessages"
          ? { ...v, order: i }
          : v,
      ),
    );
  }
  return (
    <div className="collection">
      <div className="collection-heading">
        <span>
          {tr(title, ar)} <b>{items.length}</b>
        </span>
        <button
          className="admin-button"
          onClick={() => set([...items, create()])}
          disabled={items.length >= 30}
        >
          <Plus size={16} />
          {tr("Add", "إضافة")}
        </button>
      </div>
      {!items.length && (
        <p className="admin-empty">
          {tr(
            "Nothing here yet. Add your first item.",
            "لا توجد عناصر بعد. أضف العنصر الأول.",
          )}
        </p>
      )}
      {items.map((item, i) => (
        <article
          className={`collection-item ${drag === i ? "dragging" : ""}`}
          key={item.id || i}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (drag !== null) move(drag, i);
            setDrag(null);
          }}
        >
          <div className="item-toolbar">
            <button
              className="icon-button drag-handle"
              draggable
              onDragStart={() => setDrag(i)}
              onDragEnd={() => setDrag(null)}
              aria-label={tr("Drag to reorder", "اسحب لتغيير الترتيب")}
            >
              <GripVertical size={17} />
            </button>
            <strong>
              {tr("Item", "عنصر")} {i + 1}
            </strong>
            <div>
              <button
                className="icon-button"
                aria-label={tr("Move up", "نقل لأعلى")}
                disabled={i === 0}
                onClick={() => move(i, i - 1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={tr("Move down", "نقل لأسفل")}
                disabled={i === items.length - 1}
                onClick={() => move(i, i + 1)}
              >
                <ArrowDown size={16} />
              </button>
              <button
                className="icon-button danger"
                aria-label={tr("Delete item", "حذف العنصر")}
                onClick={() => {
                  if (
                    confirm(
                      tr(
                        "Remove this item from the draft?",
                        "حذف هذا العنصر من المسودة؟",
                      ),
                    )
                  )
                    set(items.filter((_, n) => n !== i));
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          {children(`${path}.${i}`, i)}
        </article>
      ))}
    </div>
  );
}
function MediaField({
  path,
  title,
  ar,
  restore,
}: {
  path: string;
  title: string;
  ar: string;
  restore?: string;
}) {
  const { value, set } = useField(path);
  const { tr, request, notify } = useCMS();
  const [items, setItems] = useState<AssetRecord[]>([]),
    [loaded, setLoaded] = useState(false);
  async function load() {
    try {
      setItems(await request<AssetRecord[]>("assets"));
      setLoaded(true);
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  return (
    <div className="media-field">
      <label className="admin-field">
        <span>{tr(title, ar)}</span>
        <input value={String(value)} readOnly dir="ltr" />
      </label>
      {!!value && (
        <img
          src={String(value)}
          alt={tr("Selected image preview", "معاينة الصورة المحددة")}
        />
      )}
      <div className="inline-actions">
        <button className="admin-button" onClick={load}>
          <ImagePlus size={16} />
          {tr("Select from library", "اختيار من المكتبة")}
        </button>
        <button
          className="admin-button quiet"
          onClick={() => set("")}
          disabled={!value}
        >
          {tr("Remove", "إزالة")}
        </button>
        {restore && (
          <button className="admin-button quiet" onClick={() => set(restore)}>
            <RotateCcw size={15} />
            {tr("Restore original", "استعادة الأصل")}
          </button>
        )}
      </div>
      {loaded && (
        <label className="admin-field">
          <span>{tr("Available images", "الصور المتاحة")}</span>
          <select value={String(value)} onChange={(e) => set(e.target.value)}>
            <option value="">
              {tr("Select an uploaded image", "اختر صورة مرفوعة")}
            </option>
            {items.map((a) => (
              <option value={a.url} key={a.id}>
                {a.name} · {a.width}×{a.height}
              </option>
            ))}
          </select>
          {!items.length && (
            <small>
              {tr(
                "Upload an image in the Asset library first.",
                "ارفع صورة في مكتبة الصور أولًا.",
              )}
            </small>
          )}
        </label>
      )}
      <Link className="text-link" href="/admin/assets">
        {tr("Open asset library", "فتح مكتبة الصور")}
        <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
function Profile() {
  const { tr } = useCMS();
  return (
    <>
      <Panel title="Your introduction" ar="تعريفك الشخصي">
        <Bi path="profile.name" label="Display name" ar="الاسم المعروض" />
        <Bi path="profile.greeting" label="Greeting" ar="التحية" />
        <Bi path="profile.subtitle" label="Short title" ar="العنوان المختصر" />
        <Bi path="profile.intro" label="Introduction" ar="النبذة" textarea />
      </Panel>
      <Panel title="Profile image" ar="الصورة الشخصية">
        <MediaField
          path="profile.avatar"
          title="Avatar"
          ar="الصورة الرمزية"
          restore={defaultSiteConfig.profile.avatar}
        />
        <Bi
          path="profile.avatarAlt"
          label="Image description"
          ar="وصف الصورة"
        />
        <Field
          path="profile.avatarBackground"
          label="Avatar background"
          ar="خلفية الصورة"
          type="color"
        />
      </Panel>
      <Panel title="Category badges" ar="شارات التصنيف">
        <Collection
          path="profile.badges"
          title="Badges"
          ar="الشارات"
          create={() => ({
            id: crypto.randomUUID(),
            label: { en: "", ar: "" },
            icon: "student",
            enabled: true,
          })}
        >
          {(p) => (
            <>
              <Bi path={`${p}.label`} label="Label" ar="النص" />
              <div className="field-grid">
                <Field
                  path={`${p}.icon`}
                  label="Icon"
                  ar="الأيقونة"
                  options={["student", "automation", "security"]}
                />
                <Field
                  path={`${p}.enabled`}
                  label="Visible"
                  ar="ظاهر"
                  type="checkbox"
                />
              </div>
            </>
          )}
        </Collection>
        <p className="field-note">
          {tr(
            "Drag items or use the arrow buttons to change their order.",
            "اسحب العناصر أو استخدم الأسهم لتغيير ترتيبها.",
          )}
        </p>
      </Panel>
    </>
  );
}
function Links() {
  const { draft, setDraft, tr } = useCMS();
  return (
    <Panel
      title="Your contact cards"
      ar="بطاقات التواصل"
      description={tr(
        "Choose what visitors see and where every card takes them.",
        "حدد ما يظهر للزائر ووجهة كل بطاقة.",
      )}
    >
      <Collection
        path="contacts"
        title="Cards"
        ar="البطاقات"
        create={() => ({
          id: `link-${crypto.randomUUID()}`,
          type: "link",
          title: { en: "", ar: "" },
          subtitle: { en: "", ar: "" },
          url: "",
          icon: "globe",
          tone: "mint",
          order: draft.contacts.length,
          enabled: false,
          opening: "new",
          sheet: true,
        })}
      >
        {(p, i) => (
          <>
            <Field path={`${p}.id`} label="Stable ID" ar="المعرّف الثابت" />
            <Bi path={`${p}.title`} label="Title" ar="العنوان" />
            <Bi path={`${p}.subtitle`} label="Subtitle" ar="العنوان الفرعي" />
            {draft.contacts[i].type === "link" ? (
              <Field
                path={`${p}.url`}
                label="HTTPS destination"
                ar="رابط الوجهة الآمن"
                type="url"
              />
            ) : (
              <p className="field-note">
                {tr(
                  "This action uses its dedicated contact settings.",
                  "يستخدم هذا الإجراء إعدادات التواصل المخصصة له.",
                )}{" "}
                <Link
                  className="text-link"
                  href={
                    draft.contacts[i].type === "whatsapp"
                      ? "/admin/whatsapp"
                      : "/admin/settings"
                  }
                >
                  {tr("Edit destination", "تعديل الوجهة")}
                </Link>
              </p>
            )}
            <div className="field-grid">
              <Field
                path={`${p}.type`}
                label="Action"
                ar="الإجراء"
                options={["link", "whatsapp", "email"]}
              />
              <Field
                path={`${p}.icon`}
                label="Icon"
                ar="الأيقونة"
                options={iconNames}
              />
              <Field
                path={`${p}.tone`}
                label="Color preset"
                ar="لوحة الألوان"
                options={tones}
              />
              {draft.contacts[i].type === "link" && (
                <Field
                  path={`${p}.opening`}
                  label="Open destination"
                  ar="فتح الوجهة"
                  options={["new", "same"]}
                />
              )}
              <Field
                path={`${p}.enabled`}
                label="Enabled"
                ar="مفعّل"
                type="checkbox"
              />
              {draft.contacts[i].type === "link" && (
                <Field
                  path={`${p}.sheet`}
                  label="Show action sheet first"
                  ar="إظهار نافذة الإجراء أولًا"
                  type="checkbox"
                />
              )}
            </div>
          </>
        )}
      </Collection>
      <button
        className="admin-button quiet"
        onClick={() => {
          if (
            confirm(
              tr(
                "Restore the six original cards in the draft?",
                "استعادة البطاقات الست الأصلية في المسودة؟",
              ),
            )
          )
            setDraft({
              ...draft,
              contacts: structuredClone(defaultSiteConfig.contacts),
            });
        }}
      >
        <RotateCcw size={16} />
        {tr("Restore original cards", "استعادة البطاقات الأصلية")}
      </button>
    </Panel>
  );
}
function WhatsApp() {
  const { tr } = useCMS();
  return (
    <>
      <Panel title="WhatsApp destination" ar="وجهة واتساب">
        <Field
          path="whatsapp.enabled"
          label="Enable WhatsApp"
          ar="تفعيل واتساب"
          type="checkbox"
        />
        <Field
          path="whatsappNumber"
          label="International WhatsApp number"
          ar="رقم واتساب الدولي"
          hint={tr(
            "Include the country code. Spaces, + and parentheses are normalized when saved.",
            "أدخل رمز الدولة. تُحذف المسافات وعلامة + والأقواس عند الحفظ.",
          )}
        />
        <div className="field-grid">
          <Field
            path="whatsapp.maxLength"
            label="Maximum message length"
            ar="الحد الأقصى لطول الرسالة"
            type="number"
            min={1}
            max={500}
          />
          <Field
            path="whatsapp.accent"
            label="Action accent"
            ar="لون الإجراء"
            type="color"
          />
        </div>
      </Panel>
      <Panel title="Message sheet" ar="نافذة الرسائل">
        <Bi path="copy.whatsapp" label="Heading" ar="العنوان" />
        <Bi path="copy.whatsappSubtitle" label="Subtitle" ar="العنوان الفرعي" />
        <Bi
          path="copy.placeholder"
          label="Composer placeholder"
          ar="النص التوضيحي للرسالة"
        />
        <Bi path="copy.send" label="Send button" ar="زر الإرسال" />
        <Link className="text-link" href="/admin/messages">
          {tr(
            "Edit quick-message suggestions",
            "تعديل اقتراحات الرسائل السريعة",
          )}
          <ArrowUpRight size={15} />
        </Link>
        <p className="field-note">
          {tr(
            "Open Live preview, then tap the WhatsApp card to test the real composer.",
            "افتح المعاينة المباشرة ثم اضغط بطاقة واتساب لتجربة محرر الرسائل الفعلي.",
          )}
        </p>
      </Panel>
    </>
  );
}
function QuickMessages() {
  const { draft } = useCMS();
  return (
    <Panel title="Conversation starters" ar="بدايات المحادثات">
      <Collection
        path="quickMessages"
        title="Quick messages"
        ar="الرسائل السريعة"
        create={() => ({
          id: crypto.randomUUID(),
          text: { en: "", ar: "" },
          emoji: "",
          order: draft.quickMessages.length,
          enabled: true,
        })}
      >
        {(p) => (
          <>
            <Bi path={`${p}.text`} label="Message" ar="الرسالة" />
            <div className="field-grid">
              <Field
                path={`${p}.emoji`}
                label="Optional emoji"
                ar="إيموجي اختياري"
                max={8}
              />
              <Field
                path={`${p}.enabled`}
                label="Enabled"
                ar="مفعّل"
                type="checkbox"
              />
            </div>
          </>
        )}
      </Collection>
    </Panel>
  );
}
function Featured() {
  return (
    <Panel title="Featured website" ar="الموقع المميز">
      <Field
        path="featured.enabled"
        label="Show featured website"
        ar="إظهار الموقع المميز"
        type="checkbox"
      />
      <Bi path="featured.title" label="Heading" ar="العنوان" />
      <Bi path="featured.subtitle" label="Subtitle" ar="العنوان الفرعي" />
      <Bi path="featured.cta" label="Button label" ar="نص الزر" />
      <Field
        path="featured.url"
        label="Website URL"
        ar="رابط الموقع"
        type="url"
      />
      <MediaField
        path="featured.image"
        title="Preview image"
        ar="صورة المعاينة"
        restore={defaultSiteConfig.featured.image}
      />
      <Bi path="featured.alt" label="Image description" ar="وصف الصورة" />
      <div className="field-grid">
        <Field
          path="featured.position"
          label="Image focal position"
          ar="موضع تركيز الصورة"
          options={["center", "top", "bottom"]}
        />
        <Field
          path="featured.tone"
          label="Accent preset"
          ar="لوحة الألوان"
          options={tones}
        />
      </div>
    </Panel>
  );
}
function QR() {
  const { draft, setDraft, tr, notify } = useCMS();
  return (
    <>
      <Panel title="Your public QR code" ar="رمز الصفحة العامة">
        <Field
          path="canonicalUrl"
          label="Canonical Connect URL"
          ar="الرابط الأساسي لصفحة التواصل"
          type="url"
          hint={tr(
            "Use your real public HTTPS address. Add ?source=qr to a distributed QR URL to measure identifiable referrals.",
            "استخدم رابط HTTPS عامًا. أضف ‎?source=qr‎ لرابط رمز موزع لقياس الزيارات المحالة منه.",
          )}
        />
        <Field
          path="sections.qr"
          label="Show QR card"
          ar="إظهار بطاقة QR"
          type="checkbox"
        />
        <Field
          path="qr.foreground"
          label="Scan-safe foreground"
          ar="لون رمز آمن للمسح"
          options={["#111111", "#173523", "#172d50"]}
        />
        <p className="field-note">
          {tr(
            "White background, four-module quiet zone and tested dark colors preserve scanning contrast.",
            "خلفية بيضاء ومنطقة هادئة بأربع وحدات وألوان داكنة للحفاظ على وضوح المسح.",
          )}
        </p>
        <div className="inline-actions">
          <button
            className="admin-button"
            disabled={!draft.canonicalUrl}
            onClick={() =>
              navigator.clipboard
                .writeText(draft.canonicalUrl)
                .then(() => notify(tr("URL copied", "تم نسخ الرابط")))
                .catch(() =>
                  notify(tr("Couldn’t copy URL", "تعذر نسخ الرابط"), true),
                )
            }
          >
            <Copy size={16} />
            {tr("Copy URL", "نسخ الرابط")}
          </button>
          <button
            className="admin-button quiet"
            onClick={() =>
              setDraft({ ...draft, qr: structuredClone(defaultSiteConfig.qr) })
            }
          >
            <RotateCcw size={16} />
            {tr("Restore QR styling", "استعادة تنسيق الرمز")}
          </button>
        </div>
      </Panel>
      <Panel title="Scan & download" ar="المسح والتحميل">
        <div className="admin-qr-preview accent-dark">
          <QRCodeSheetContent
            url={draft.canonicalUrl}
            qr={draft.qr}
            t={draft.copy[tr("en", "ar") as Locale]}
          />
        </div>
      </Panel>
    </>
  );
}
function Contact() {
  const { draft, tr } = useCMS();
  return (
    <>
      <Panel title="Digital contact card" ar="بطاقة التواصل الرقمية">
        <Field
          path="sections.saveContact"
          label="Show Add to Contacts"
          ar="إظهار الإضافة لجهات الاتصال"
          type="checkbox"
        />
        <div className="field-grid">
          <Field
            path="vcard.fullName"
            label="English full name"
            ar="الاسم الكامل بالإنجليزية"
          />
          <Field
            path="vcard.fullNameAr"
            label="Arabic full name"
            ar="الاسم الكامل بالعربية"
          />
          <Field path="vcard.givenName" label="Given name" ar="الاسم الأول" />
          <Field path="vcard.familyName" label="Family name" ar="اسم العائلة" />
          <Field
            path="vcard.phone"
            label="Contact phone"
            ar="هاتف التواصل"
            type="tel"
          />
          <Field
            path="vcard.email"
            label="Contact email"
            ar="بريد التواصل"
            type="email"
          />
          <Field path="vcard.organization" label="Organization" ar="المؤسسة" />
          <Field path="vcard.title" label="Title" ar="المسمى" />
        </div>
        <Field
          path="vcard.website"
          label="Primary website"
          ar="الموقع الأساسي"
          type="url"
        />
        <button
          className="admin-button"
          onClick={() =>
            downloadBlob(
              new Blob([buildVCard(draft.vcard)], {
                type: "text/vcard;charset=utf-8",
              }),
              "contact-preview.vcf",
            )
          }
        >
          <Download size={16} />
          {tr("Download draft vCard", "تحميل مسودة بطاقة التواصل")}
        </button>
      </Panel>
      <Panel title="Public profiles" ar="الحسابات العامة">
        <Collection
          path="vcard.profiles"
          title="Included profiles"
          ar="الحسابات المضافة"
          create={() => ({ label: "", url: "" })}
        >
          {(p) => (
            <div className="field-grid">
              <Field
                path={`${p}.label`}
                label="Platform label"
                ar="اسم المنصة"
              />
              <Field
                path={`${p}.url`}
                label="Profile URL"
                ar="رابط الحساب"
                type="url"
              />
            </div>
          )}
        </Collection>
      </Panel>
    </>
  );
}
function Appearance() {
  const { draft, setDraft, tr } = useCMS();
  return (
    <>
      <Panel title="Color & surfaces" ar="الألوان والأسطح">
        <div className="field-grid">
          <Field
            path="theme.surface"
            label="Page surface"
            ar="خلفية الصفحة"
            type="color"
          />
          <Field
            path="theme.ink"
            label="Primary text"
            ar="النص الأساسي"
            type="color"
          />
          <Field
            path="theme.muted"
            label="Secondary text"
            ar="النص الثانوي"
            type="color"
          />
          <Field
            path="theme.sheet"
            label="Sheet surface"
            ar="خلفية النافذة"
            type="color"
          />
          {tones.map((t) => (
            <Field
              key={t}
              path={`theme.accents.${t}`}
              label={`${t} accent`}
              ar={`لون ${t}`}
              type="color"
            />
          ))}
        </div>
      </Panel>
      <Panel title="Shape & rhythm" ar="الشكل والإيقاع">
        <div className="field-grid">
          <Field
            path="theme.radius"
            label="Card radius"
            ar="استدارة البطاقات"
            options={["16px", "20px", "24px", "28px", "32px", "36px"]}
          />
          <Field
            path="theme.buttonRadius"
            label="Button radius"
            ar="استدارة الأزرار"
            options={["12px", "20px", "999px"]}
          />
          <Field
            path="theme.gap"
            label="Spacing"
            ar="التباعد"
            options={["8px", "10px", "14px", "18px", "24px"]}
          />
          <Field
            path="theme.shadow"
            label="Shadow intensity"
            ar="شدة الظلال"
            options={["none", "soft", "medium"]}
          />
          <Field
            path="theme.font"
            label="Typography"
            ar="الخطوط"
            options={["manrope", "system"]}
          />
          <Field
            path="theme.duration"
            label="Animation duration"
            ar="مدة الحركة"
            options={["0ms", "120ms", "220ms", "300ms"]}
          />
        </div>
        <button
          className="admin-button quiet"
          onClick={() =>
            setDraft({
              ...draft,
              theme: structuredClone(defaultSiteConfig.theme),
            })
          }
        >
          <RotateCcw size={16} />
          {tr(
            "Reset appearance in draft",
            "استعادة المظهر الافتراضي في المسودة",
          )}
        </button>
      </Panel>
    </>
  );
}
function translationPairs(v: unknown, path = ""): string[] {
  if (!v || typeof v !== "object") return [];
  const o = v as Record<string, unknown>;
  if (typeof o.en === "string" && typeof o.ar === "string") return [path];
  return Object.entries(o).flatMap(([k, c]) =>
    translationPairs(c, path ? `${path}.${k}` : k),
  );
}
function Localization() {
  const { draft, tr } = useCMS();
  const [filter, setFilter] = useState("");
  const keys = Object.keys(draft.copy.en);
  const complete = keys.filter(
    (k) =>
      draft.copy.en[k as keyof typeof draft.copy.en].trim() &&
      draft.copy.ar[k as keyof typeof draft.copy.ar].trim(),
  ).length;
  const pairs = translationPairs({ ...draft, copy: undefined });
  return (
    <Panel
      title="English & Arabic"
      ar="الإنجليزية والعربية"
      description={tr(
        `${complete} of ${keys.length} interface strings translated in both languages.`,
        `${complete} من ${keys.length} نصًا مترجمًا باللغتين.`,
      )}
    >
      <label className="admin-field">
        <span>{tr("Find a translation", "البحث عن ترجمة")}</span>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </label>
      <div className="translation-list">
        {pairs
          .filter((k) => k.toLowerCase().includes(filter.toLowerCase()))
          .map((k) => (
            <Bi key={k} path={k} label={k} ar={k} />
          ))}
        {keys
          .filter((k) =>
            `${k} ${draft.copy.en[k as keyof typeof draft.copy.en]} ${draft.copy.ar[k as keyof typeof draft.copy.ar]}`
              .toLowerCase()
              .includes(filter.toLowerCase()),
          )
          .map((k) => (
            <fieldset className="bilingual" key={k}>
              <legend>{k}</legend>
              <div>
                <Field path={`copy.en.${k}`} label="English" ar="English" />
                <Field path={`copy.ar.${k}`} label="العربية" ar="العربية" />
              </div>
              {(!draft.copy.en[k as keyof typeof draft.copy.en] ||
                !draft.copy.ar[k as keyof typeof draft.copy.ar]) && (
                <small className="missing-translation">
                  {tr("Missing translation", "ترجمة غير مكتملة")}
                </small>
              )}
            </fieldset>
          ))}
      </div>
    </Panel>
  );
}
function SEO() {
  const { draft, tr, locale } = useCMS();
  return (
    <>
      <Panel title="Search & sharing" ar="البحث والمشاركة">
        <Bi path="seo.title" label="Site title" ar="عنوان الموقع" />
        <Bi
          path="seo.description"
          label="Meta description"
          ar="وصف محركات البحث"
          textarea
        />
        <Field
          path="canonicalUrl"
          label="Canonical URL"
          ar="الرابط الأساسي"
          type="url"
        />
        <Field
          path="seo.index"
          label="Allow search engine indexing"
          ar="السماح بفهرسة محركات البحث"
          type="checkbox"
        />
        <MediaField
          path="seo.image"
          title="Open Graph image"
          ar="صورة Open Graph"
        />
        <MediaField
          path="seo.sharingImage"
          title="Social sharing image"
          ar="صورة المشاركة الاجتماعية"
        />
        <MediaField path="seo.favicon" title="Site icon" ar="أيقونة الموقع" />
      </Panel>
      <Panel title="Search preview" ar="معاينة نتائج البحث">
        <div className="search-preview">
          <small>
            {draft.canonicalUrl || tr("Your canonical URL", "الرابط الأساسي")}
          </small>
          <h3>{draft.seo.title[locale]}</h3>
          <p>{draft.seo.description[locale]}</p>
        </div>
      </Panel>
    </>
  );
}
function useResource<T>(path: string) {
  const { request } = useCMS();
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState("");
  async function load() {
    setError("");
    try {
      setData(await request<T>(path));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [path]);
  return { data, error, load };
}
function ResourceState({
  error,
  loading,
  retry,
}: {
  error: string;
  loading: boolean;
  retry: () => void;
}) {
  const { tr } = useCMS();
  return error ? (
    <div className="admin-error" role="alert">
      {error}
      <button className="admin-button" onClick={retry}>
        {tr("Try again", "حاول مرة أخرى")}
      </button>
    </div>
  ) : loading ? (
    <div className="admin-skeleton" aria-label={tr("Loading", "جارٍ التحميل")}>
      <span />
      <span />
      <span />
    </div>
  ) : null;
}
function Analytics({ overview = false }: { overview?: boolean }) {
  const { tr, draft } = useCMS();
  const [days, setDays] = useState("30");
  const { data, error, load } = useResource<AnalyticsRecord[]>(
    `analytics?days=${days}`,
  );
  const counts = new Map<string, number>();
  for (const row of data || [])
    counts.set(row.event, (counts.get(row.event) || 0) + row.count);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const peak = Math.max(1, ...[...counts.values()]);
  return (
    <Panel
      title={overview ? "Visitor activity" : "Privacy-conscious analytics"}
      ar={overview ? "نشاط الزوار" : "تحليلات تراعي الخصوصية"}
    >
      <div className="section-toolbar">
        <p>
          {tr(
            "Aggregate actions. No visitor profiles, cookies, or stored IP addresses.",
            "إجماليات الإجراءات دون ملفات زوار أو ملفات تعريف ارتباط أو تخزين لعناوين IP.",
          )}
        </p>
        <label>
          {tr("Period", "الفترة")}
          <select value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">{tr("7 days", "٧ أيام")}</option>
            <option value="30">{tr("30 days", "٣٠ يومًا")}</option>
            <option value="90">{tr("90 days", "٩٠ يومًا")}</option>
          </select>
        </label>
      </div>
      <ResourceState error={error} loading={!data && !error} retry={load} />
      {data &&
        (!total ? (
          <div className="admin-empty">
            <h3>{tr("Your story is just starting", "قصتك لسه بتبدأ")}</h3>
            <p>
              {draft.settings.analytics
                ? tr(
                    "There are no recorded actions in this period. Data appears here as visitors use your page.",
                    "لا توجد إجراءات مسجلة في هذه الفترة. ستظهر البيانات مع استخدام الزوار للصفحة.",
                  )
                : tr(
                    "Analytics is disabled. Enable aggregate analytics in Settings when you’re ready.",
                    "التحليلات غير مفعلة. فعّل التحليلات الإجمالية من الإعدادات عندما تكون جاهزًا.",
                  )}
            </p>
            <Link className="text-link" href="/admin/settings">
              {tr("Analytics settings", "إعدادات التحليلات")}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="analytics-bars">
            {[...counts]
              .sort((a, b) => b[1] - a[1])
              .map(([key, n]) => (
                <div key={key}>
                  <div>
                    <span>{key.replaceAll("_", " ")}</span>
                    <strong>{n.toLocaleString()}</strong>
                  </div>
                  <div className="bar-track">
                    <span style={{ width: `${(n / peak) * 100}%` }} />
                  </div>
                </div>
              ))}
          </div>
        ))}
      <p className="field-note">
        {tr(
          "QR referrals are counted only when the landing URL contains ?source=qr. These are observed events, not unique people or verified scans. Do Not Track is respected.",
          "تُحسب إحالات QR فقط عندما يحتوي رابط الوصول على ‎?source=qr‎. هي أحداث مرصودة وليست أشخاصًا فريدين أو عمليات مسح مؤكدة. يُحترم طلب عدم التتبع.",
        )}
      </p>
    </Panel>
  );
}
function Activity({ compact = false }: { compact?: boolean }) {
  const { tr, locale } = useCMS();
  const { data, error, load } = useResource<AuditRecord[]>("activity");
  return (
    <Panel title="Recent changes" ar="أحدث التغييرات">
      <ResourceState error={error} loading={!data && !error} retry={load} />
      {data &&
        (!data.length ? (
          <p className="admin-empty">
            {tr(
              "Your first saved change will appear here.",
              "سيظهر أول تغيير محفوظ هنا.",
            )}
          </p>
        ) : (
          <div className="activity-list">
            {data.slice(0, compact ? 5 : 100).map((row) => (
              <div key={row.id}>
                <span
                  className={`activity-dot ${row.action.includes("failed") ? "failed" : ""}`}
                >
                  {row.action.includes("failed") ? (
                    <CircleAlert size={15} />
                  ) : (
                    <Check size={15} />
                  )}
                </span>
                <div>
                  <strong>
                    {row.action.replaceAll(".", " · ").replaceAll("-", " ")}
                  </strong>
                  <small>{row.actor}</small>
                </div>
                <time>{new Date(row.createdAt).toLocaleString(locale)}</time>
              </div>
            ))}
          </div>
        ))}
      {compact && (
        <Link className="text-link" href="/admin/activity">
          {tr("View all activity", "عرض كل النشاط")}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </Panel>
  );
}
function Revisions({
  record,
  unsaved,
}: {
  record: ContentRecord;
  unsaved: boolean;
}) {
  const { request, reload, tr, notify } = useCMS();
  const { data, error, load } = useResource<RevisionRecord[]>("revisions");
  const [busy, setBusy] = useState(false);
  async function restore(id: string) {
    if (unsaved) {
      notify(
        tr(
          "Save or discard your unsaved changes before restoring a revision.",
          "احفظ التغييرات أو تجاهلها قبل استعادة إصدار سابق.",
        ),
        true,
      );
      return;
    }
    if (
      !confirm(
        tr(
          "Restore this previously published version as a draft? Publish it when you’re ready.",
          "استعادة هذا الإصدار المنشور سابقًا كمسودة؟ يمكنك نشره عندما تكون جاهزًا.",
        ),
      )
    )
      return;
    setBusy(true);
    try {
      await request("restore", {
        method: "POST",
        body: JSON.stringify({ version: record.version, revision: id }),
      });
      await reload();
      notify(
        tr(
          "Revision restored to draft. Review it before publishing.",
          "تمت استعادة الإصدار كمسودة. راجعه قبل النشر.",
        ),
      );
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title="Previous published versions"
      ar="الإصدارات المنشورة السابقة"
      description={tr(
        "Each publication keeps the prior live snapshot. Restoring creates a draft, so you can review it first.",
        "يحفظ كل نشر النسخة العامة السابقة. الاستعادة تنشئ مسودة لمراجعتها أولًا.",
      )}
    >
      <ResourceState error={error} loading={!data && !error} retry={load} />
      {data &&
        (!data.length ? (
          <p className="admin-empty">
            {tr(
              "Publish your first update to start the version history.",
              "انشر أول تحديث لبدء سجل الإصدارات.",
            )}
          </p>
        ) : (
          <div className="revision-list">
            {data.map((r) => (
              <div key={r.id}>
                <History size={20} />
                <div>
                  <strong>{new Date(r.createdAt).toLocaleString()}</strong>
                  <small>
                    {r.actor} · {r.id.slice(0, 8)}
                  </small>
                </div>
                <button
                  className="admin-button"
                  disabled={busy}
                  onClick={() => restore(r.id)}
                >
                  <RotateCcw size={15} />
                  {tr("Restore to draft", "استعادة كمسودة")}
                </button>
              </div>
            ))}
          </div>
        ))}
    </Panel>
  );
}
function Settings() {
  const { draft, setDraft, tr, notify, request } = useCMS();
  const { data, error, load } = useResource<{
    database: string;
    storage: string;
    owner: { name: string; email: string };
    sessionExpiresAt: string;
    aiGeneration: string;
  }>("status");
  const [sessions, setSessions] = useState<
      { token: string; expiresAt: string; createdAt: string }[]
    >([]),
    [working, setWorking] = useState(false);
  async function authAction(path: string, body: unknown) {
    const r = await fetch(`/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok)
      throw new Error(
        tr(
          "Security action failed. Check your current password or sign in again.",
          "تعذر تنفيذ الإجراء الأمني. تحقق من كلمة المرور أو سجل الدخول مجددًا.",
        ),
      );
    return r.json();
  }
  async function listSessions() {
    try {
      const r = await fetch("/api/auth/list-sessions");
      if (!r.ok) throw new Error("Could not load sessions");
      setSessions(await r.json());
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get("new") !== data.get("confirm")) {
      notify(
        tr(
          "New passwords must match.",
          "كلمتا المرور الجديدتان غير متطابقتين.",
        ),
        true,
      );
      return;
    }
    setWorking(true);
    try {
      await authAction("change-password", {
        currentPassword: data.get("current"),
        newPassword: data.get("new"),
        revokeOtherSessions: true,
      });
      form.reset();
      notify(
        tr(
          "Password changed. Other sessions were revoked.",
          "تم تغيير كلمة المرور وإلغاء الجلسات الأخرى.",
        ),
      );
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setWorking(false);
    }
  }
  return (
    <>
      <Panel title="General settings" ar="الإعدادات العامة">
        <Field
          path="settings.baseUrl"
          label="Website base URL"
          ar="الرابط الأساسي للموقع"
          type="url"
        />
        <Field
          path="settings.defaultLocale"
          label="Default language"
          ar="اللغة الافتراضية"
          options={["en", "ar"]}
        />
        <fieldset className="locale-choices">
          <legend>{tr("Available languages", "اللغات المتاحة")}</legend>
          {(["en", "ar"] as Locale[]).map((l) => (
            <label key={l}>
              <input
                type="checkbox"
                checked={draft.settings.locales.includes(l)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    settings: {
                      ...draft.settings,
                      locales: e.target.checked
                        ? [...draft.settings.locales, l]
                        : draft.settings.locales.filter((v) => v !== l),
                    },
                  })
                }
              />
              {l === "en" ? "English" : "العربية"}
            </label>
          ))}
        </fieldset>
        <Field
          path="email"
          label="Public email action"
          ar="بريد إجراء التواصل العام"
          type="email"
        />
        <Field
          path="settings.enabled"
          label="Enable public page"
          ar="تفعيل الصفحة العامة"
          type="checkbox"
        />
        <Field
          path="settings.analytics"
          label="Enable aggregate analytics"
          ar="تفعيل التحليلات الإجمالية"
          type="checkbox"
        />
        <p className="field-note">
          {tr(
            "Analytics is off by default. Review your privacy notice and applicable consent requirements before enabling it.",
            "التحليلات متوقفة افتراضيًا. راجع سياسة الخصوصية ومتطلبات الموافقة المناسبة قبل تفعيلها.",
          )}
        </p>
      </Panel>
      <Panel title="Service health" ar="حالة الخدمات">
        <ResourceState error={error} loading={!data && !error} retry={load} />
        {data && (
          <dl className="status-list">
            <div>
              <dt>{tr("Database", "قاعدة البيانات")}</dt>
              <dd>{tr("Connected", "متصلة")}</dd>
            </div>
            <div>
              <dt>{tr("Image storage", "تخزين الصور")}</dt>
              <dd>{data.storage}</dd>
            </div>
            <div>
              <dt>
                {tr("AI image generation", "توليد الصور بالذكاء الاصطناعي")}
              </dt>
              <dd>{tr("Not connected · optional", "غير متصل · اختياري")}</dd>
            </div>
            <div>
              <dt>{tr("Signed in as", "الحساب الحالي")}</dt>
              <dd>{data.owner.email}</dd>
            </div>
            <div>
              <dt>{tr("Session expires", "انتهاء الجلسة")}</dt>
              <dd>{new Date(data.sessionExpiresAt).toLocaleString()}</dd>
            </div>
          </dl>
        )}
      </Panel>
      <Panel title="Password & sessions" ar="كلمة المرور والجلسات">
        <form
          method="post"
          action="/api/auth/change-password/"
          className="security-form"
          onSubmit={changePassword}
        >
          <label className="admin-field">
            <span>{tr("Current password", "كلمة المرور الحالية")}</span>
            <input
              name="current"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <div className="field-grid">
            <label className="admin-field">
              <span>
                {tr(
                  "New password · 14+ characters",
                  "كلمة مرور جديدة · ١٤ حرفًا على الأقل",
                )}
              </span>
              <input
                name="new"
                type="password"
                required
                minLength={14}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
            <label className="admin-field">
              <span>{tr("Confirm new password", "تأكيد كلمة المرور")}</span>
              <input
                name="confirm"
                type="password"
                required
                minLength={14}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
          </div>
          <button className="admin-button" disabled={working}>
            <ShieldCheck size={16} />
            {tr("Change password", "تغيير كلمة المرور")}
          </button>
        </form>
        <div className="inline-actions">
          <button className="admin-button" onClick={listSessions}>
            {tr("View active sessions", "عرض الجلسات النشطة")}
          </button>
          <button
            className="admin-button quiet"
            onClick={async () => {
              try {
                await authAction("revoke-other-sessions", {});
                setSessions([]);
                notify(tr("Other sessions revoked", "تم إلغاء الجلسات الأخرى"));
              } catch (e) {
                notify((e as Error).message, true);
              }
            }}
          >
            {tr("Sign out other devices", "خروج الأجهزة الأخرى")}
          </button>
        </div>
        {sessions.map((s) => (
          <div className="session-row" key={s.token}>
            <span>
              {tr("Created ", "أُنشئت ")}
              {new Date(s.createdAt).toLocaleString()}
              <small>
                {tr("Expires ", "تنتهي ")}
                {new Date(s.expiresAt).toLocaleString()}
              </small>
            </span>
            <button
              className="admin-button quiet"
              onClick={async () => {
                try {
                  await authAction("revoke-session", { token: s.token });
                  await listSessions();
                  notify(tr("Session revoked", "تم إلغاء الجلسة"));
                } catch (e) {
                  notify((e as Error).message, true);
                }
              }}
            >
              {tr("Revoke", "إلغاء")}
            </button>
          </div>
        ))}
        <p className="field-note">
          {tr(
            "Lost access? Use the documented offline owner:reset command. Recovery revokes every session.",
            "فقدت الوصول؟ استخدم أمر owner:reset من الخادم كما في الدليل. الاستعادة تلغي جميع الجلسات.",
          )}
        </p>
      </Panel>
      <Panel title="Configuration backup" ar="نسخة احتياطية للإعدادات">
        <p className="field-note">
          {tr(
            "Exports contain public content only. Store database and image backups separately.",
            "يتضمن التصدير المحتوى العام فقط. احفظ نسخ قاعدة البيانات والصور بشكل منفصل.",
          )}
        </p>
        <div className="inline-actions">
          <button
            className="admin-button"
            onClick={() =>
              downloadBlob(
                new Blob([JSON.stringify(draft, null, 2)], {
                  type: "application/json",
                }),
                "connect-draft.json",
              )
            }
          >
            <Download size={16} />
            {tr("Export draft", "تصدير المسودة")}
          </button>
          <label className="admin-button file-button">
            {tr("Import to draft", "استيراد كمسودة")}
            <input
              type="file"
              accept="application/json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  if (f.size > 300000)
                    throw new Error("Configuration is too large");
                  const { siteConfigSchema } = await import("@/lib/config");
                  setDraft(siteConfigSchema.parse(JSON.parse(await f.text())));
                  notify(
                    tr(
                      "Imported into the editor. Save and preview before publishing.",
                      "تم الاستيراد إلى المحرر. احفظ وعاين قبل النشر.",
                    ),
                  );
                } catch (err) {
                  notify(
                    tr("Invalid configuration: ", "إعدادات غير صالحة: ") +
                      (err as Error).message,
                    true,
                  );
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </Panel>
    </>
  );
}
function Dashboard({ record }: { record: ContentRecord }) {
  const { draft, tr, locale } = useCMS();
  const enabled = draft.contacts.filter(
    (c) => c.enabled && (c.type !== "whatsapp" || draft.whatsapp.enabled),
  ).length;
  return (
    <>
      <section className="overview-welcome">
        <div>
          <h2>
            {tr("A good connection starts here.", "كل تواصل جميل بيبدأ هنا.")}
          </h2>
          <p>
            {tr(
              "Keep your details fresh, make space for new work, and share when you’re ready.",
              "حدّث بياناتك وأضف أعمالك الجديدة وشاركها عندما تكون جاهزًا.",
            )}
          </p>
          <Link className="admin-button primary" href="/admin/profile">
            {tr("Edit your profile", "تعديل الملف الشخصي")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <img
          src={draft.profile.avatar || defaultSiteConfig.profile.avatar}
          alt=""
          width={112}
          height={112}
        />
      </section>
      <div className="overview-summary">
        <Link href="/admin/links">
          <strong>{enabled}</strong>
          <span>{tr("active contact cards", "بطاقات تواصل نشطة")}</span>
          <ArrowUpRight size={17} />
        </Link>
        <Link href="/admin/messages">
          <strong>{draft.quickMessages.filter((q) => q.enabled).length}</strong>
          <span>{tr("conversation starters", "بدايات للمحادثات")}</span>
          <ArrowUpRight size={17} />
        </Link>
        <Link href="/admin/revisions">
          <History size={23} />
          <span>
            {record.publishedAt
              ? new Date(record.publishedAt).toLocaleDateString(locale)
              : tr("First publication awaits", "بانتظار أول نشر")}
          </span>
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <Analytics overview />
      <Activity compact />
    </>
  );
}
export function Editors({
  section,
  record,
  unsaved,
}: {
  section: string;
  record: ContentRecord;
  unsaved: boolean;
}) {
  switch (section) {
    case "profile":
      return <Profile />;
    case "links":
      return <Links />;
    case "whatsapp":
      return <WhatsApp />;
    case "messages":
      return <QuickMessages />;
    case "featured":
      return <Featured />;
    case "assets":
      return <AssetLibrary />;
    case "qr":
      return <QR />;
    case "contact":
      return <Contact />;
    case "appearance":
      return <Appearance />;
    case "localization":
      return <Localization />;
    case "analytics":
      return <Analytics />;
    case "seo":
      return <SEO />;
    case "settings":
      return <Settings />;
    case "activity":
      return <Activity />;
    case "revisions":
      return <Revisions record={record} unsaved={unsaved} />;
    default:
      return <Dashboard record={record} />;
  }
}
