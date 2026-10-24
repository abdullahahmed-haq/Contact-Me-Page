"use client";
import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Copy,
  Trash2,
  Check,
  ImagePlus,
  RefreshCw,
} from "lucide-react";
import { useCMS, Panel } from "./context";
import type { AssetRecord } from "@/lib/admin-types";
export function AssetLibrary() {
  const { draft, setDraft, tr, request, notify } = useCMS();
  const [assets, setAssets] = useState<AssetRecord[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [src, setSrc] = useState(""),
    [altEn, setAltEn] = useState(""),
    [altAr, setAltAr] = useState(""),
    [busy, setBusy] = useState(false),
    [square, setSquare] = useState(false),
    [x, setX] = useState(50),
    [y, setY] = useState(50),
    [editing, setEditing] = useState<AssetRecord | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const cropCanvas = useRef<HTMLCanvasElement>(null);
  async function load() {
    setLoading(true);
    setError("");
    try {
      setAssets(await request<AssetRecord[]>("assets"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!file) {
      setSrc("");
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (!src || !square) return;
    let active = true;
    const image = new window.Image();
    image.onload = () => {
      if (!active) return;
      const c = cropCanvas.current;
      if (!c) return;
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      c.width = 300;
      c.height = 300;
      c.getContext("2d")?.drawImage(
        image,
        ((image.naturalWidth - side) * x) / 100,
        ((image.naturalHeight - side) * y) / 100,
        side,
        side,
        0,
        0,
        300,
        300,
      );
    };
    image.src = src;
    return () => {
      active = false;
    };
  }, [src, square, x, y]);
  function select(f?: File) {
    if (!f) return;
    if (
      f.size > 4 * 1024 * 1024 ||
      !/^image\/(png|jpeg|webp|avif)$/.test(f.type)
    ) {
      notify(
        tr(
          "Choose a PNG, JPEG, WebP or AVIF smaller than 4 MB.",
          "اختر صورة PNG أو JPEG أو WebP أو AVIF أصغر من ٤ ميجابايت.",
        ),
        true,
      );
      return;
    }
    setFile(f);
    setSquare(false);
    setX(50);
    setY(50);
  }
  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      let body: Blob = file;
      if (square) {
        const image = await createImageBitmap(file);
        const side = Math.min(image.width, image.height);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = Math.min(side, 2000);
        canvas
          .getContext("2d")!
          .drawImage(
            image,
            ((image.width - side) * x) / 100,
            ((image.height - side) * y) / 100,
            side,
            side,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        image.close();
        body = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (v) => (v ? resolve(v) : reject(new Error("Crop failed"))),
            "image/webp",
            0.92,
          ),
        );
      }
      const form = new FormData();
      form.set("file", body, file.name);
      form.set("altEn", altEn);
      form.set("altAr", altAr);
      await request("assets", { method: "POST", body: form });
      setFile(null);
      setAltEn("");
      setAltAr("");
      if (input.current) input.current.value = "";
      await load();
      notify(tr("Image saved to the library.", "تم حفظ الصورة في المكتبة."));
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function remove(a: AssetRecord) {
    if (
      !confirm(
        tr(
          `Delete ${a.name}? Referenced images are protected.`,
          `حذف ${a.name}؟ الصور المستخدمة محمية من الحذف.`,
        ),
      )
    )
      return;
    try {
      await request(`assets/${a.id}`, { method: "DELETE" });
      await load();
      notify(tr("Unused image deleted.", "تم حذف الصورة غير المستخدمة."));
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  function useAsset(a: AssetRecord, target: "avatar" | "featured") {
    const next = structuredClone(draft);
    if (target === "avatar") {
      next.profile.avatar = a.url;
      next.profile.avatarAlt = a.alt;
    } else {
      next.featured.image = a.url;
      next.featured.alt = a.alt;
    }
    setDraft(next);
    notify(
      tr(
        "Image selected in draft. Save and publish when ready.",
        "تم اختيار الصورة في المسودة. احفظ وانشر عندما تكون جاهزًا.",
      ),
    );
  }
  return (
    <>
      <Panel
        title="Upload an image"
        ar="رفع صورة"
        description={tr(
          "Optimized to WebP, metadata removed, and safely stored. Original and replaced images remain available for rollback.",
          "تُحسن الصورة إلى WebP وتُزال بياناتها الإضافية وتُحفظ بأمان. تبقى الصور الأصلية والمستبدلة متاحة للاستعادة.",
        )}
      >
        <div
          className="upload-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            select(e.dataTransfer.files[0]);
          }}
        >
          <Upload size={25} />
          <strong>
            {tr("Drop your next image here", "اسحب صورتك التالية هنا")}
          </strong>
          <span>
            {tr(
              "PNG, JPEG, WebP, AVIF · up to 4 MB",
              "PNG، JPEG، WebP، AVIF · حتى ٤ ميجابايت",
            )}
          </span>
          <label className="admin-button file-button">
            <ImagePlus size={16} />
            {tr("Choose image", "اختيار صورة")}
            <input
              ref={input}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(e) => select(e.target.files?.[0])}
            />
          </label>
        </div>
        {file && (
          <div className="upload-editor">
            <img
              className="upload-image"
              src={src}
              alt={tr("Original image", "الصورة الأصلية")}
            />
            <label className="toggle-field">
              <span>{tr("Crop to square", "قص إلى مربع")}</span>
              <input
                type="checkbox"
                checked={square}
                onChange={(e) => setSquare(e.target.checked)}
              />
            </label>
            {square && (
              <>
                <canvas ref={cropCanvas} className="crop-preview" />
                <label className="admin-field">
                  <span>{tr("Horizontal focal point", "التركيز الأفقي")}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={x}
                    onChange={(e) => setX(Number(e.target.value))}
                  />
                </label>
                <label className="admin-field">
                  <span>{tr("Vertical focal point", "التركيز الرأسي")}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={y}
                    onChange={(e) => setY(Number(e.target.value))}
                  />
                </label>
              </>
            )}
            <div className="field-grid">
              <label className="admin-field">
                <span>{tr("English alt text", "وصف الصورة بالإنجليزية")}</span>
                <input
                  value={altEn}
                  maxLength={500}
                  onChange={(e) => setAltEn(e.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>{tr("Arabic alt text", "وصف الصورة بالعربية")}</span>
                <input
                  value={altAr}
                  maxLength={500}
                  dir="rtl"
                  onChange={(e) => setAltAr(e.target.value)}
                />
              </label>
            </div>
            <div className="inline-actions">
              <button
                className="admin-button primary"
                disabled={busy}
                onClick={upload}
              >
                <Upload size={16} />
                {busy
                  ? tr("Uploading…", "جارٍ الرفع…")
                  : tr("Save to library", "حفظ في المكتبة")}
              </button>
              <button
                className="admin-button quiet"
                disabled={busy}
                onClick={() => setFile(null)}
              >
                {tr("Cancel", "إلغاء")}
              </button>
            </div>
          </div>
        )}
      </Panel>
      <Panel title="Your image library" ar="مكتبة صورك">
        <div className="section-toolbar">
          <label className="admin-field">
            <span>{tr("Search images", "البحث في الصور")}</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button
            className="icon-button"
            aria-label={tr("Refresh library", "تحديث المكتبة")}
            onClick={load}
          >
            <RefreshCw size={18} />
          </button>
        </div>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <div className="admin-skeleton">
            <span />
            <span />
          </div>
        ) : !assets.length ? (
          <div className="admin-empty">
            <h3>{tr("A home for your images", "مكان لصورك")}</h3>
            <p>
              {tr(
                "Upload your first image above. Your original project illustrations stay available through Restore original in each editor.",
                "ارفع صورتك الأولى بالأعلى. تظل رسوم المشروع الأصلية متاحة عبر استعادة الأصل في كل محرر.",
              )}
            </p>
          </div>
        ) : (
          <div className="asset-grid">
            {assets
              .filter((a) =>
                `${a.name} ${a.alt.en} ${a.alt.ar}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((a) => (
                <article className="asset-item" key={a.id}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={tr(`Preview ${a.name}`, `معاينة ${a.name}`)}
                  >
                    <img
                      src={a.url}
                      alt={a.alt.en || a.alt.ar || a.name}
                      loading="lazy"
                    />
                  </a>
                  <strong title={a.name}>{a.name}</strong>
                  <small>
                    {a.width} × {a.height} · {Math.ceil(a.bytes / 1024)} KB
                  </small>
                  <div className="inline-actions">
                    <button
                      className="admin-button"
                      onClick={() => useAsset(a, "avatar")}
                    >
                      {tr("Use as avatar", "استخدام كصورة شخصية")}
                    </button>
                    <button
                      className="admin-button"
                      onClick={() => useAsset(a, "featured")}
                    >
                      {tr("Use for website", "استخدام للموقع")}
                    </button>
                  </div>
                  <div className="inline-actions">
                    <button
                      className="admin-button quiet"
                      onClick={() => setEditing(a)}
                    >
                      {tr("Edit alt text", "تعديل الوصف")}
                    </button>
                    <button
                      className="icon-button"
                      aria-label={tr("Copy image URL", "نسخ رابط الصورة")}
                      onClick={() =>
                        navigator.clipboard
                          .writeText(new URL(a.url, location.origin).href)
                          .then(() =>
                            notify(
                              tr("Image URL copied", "تم نسخ رابط الصورة"),
                            ),
                          )
                          .catch(() =>
                            notify(
                              tr(
                                "Couldn’t copy image URL",
                                "تعذر نسخ رابط الصورة",
                              ),
                              true,
                            ),
                          )
                      }
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={tr(
                        "Delete unused image",
                        "حذف الصورة غير المستخدمة",
                      )}
                      onClick={() => remove(a)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {editing?.id === a.id && (
                    <div className="asset-alt-editor">
                      <label className="admin-field">
                        <span>English</span>
                        <input
                          value={editing.alt.en}
                          maxLength={500}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              alt: { ...editing.alt, en: e.target.value },
                            })
                          }
                        />
                      </label>
                      <label className="admin-field">
                        <span>العربية</span>
                        <input
                          dir="rtl"
                          value={editing.alt.ar}
                          maxLength={500}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              alt: { ...editing.alt, ar: e.target.value },
                            })
                          }
                        />
                      </label>
                      <div className="inline-actions">
                        <button
                          className="admin-button"
                          onClick={async () => {
                            try {
                              await request(`assets/${a.id}`, {
                                method: "PATCH",
                                body: JSON.stringify({ alt: editing.alt }),
                              });
                              setEditing(null);
                              await load();
                              notify(
                                tr(
                                  "Image description saved.",
                                  "تم حفظ وصف الصورة.",
                                ),
                              );
                            } catch (e) {
                              notify((e as Error).message, true);
                            }
                          }}
                        >
                          <Check size={16} />
                          {tr("Save alt text", "حفظ وصف الصورة")}
                        </button>
                        <button
                          className="admin-button quiet"
                          onClick={() => setEditing(null)}
                        >
                          {tr("Cancel", "إلغاء")}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
          </div>
        )}
      </Panel>
    </>
  );
}
