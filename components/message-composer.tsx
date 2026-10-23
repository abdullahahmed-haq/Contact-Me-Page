"use client";
import { useRef, useState } from "react";
import { Send, Smile, ArrowUpRight } from "lucide-react";
import type { Locale, SiteConfig } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import { buildWhatsAppUrl, limitMessage } from "@/lib/contact";
export function MessageComposer({
  kind,
  config,
  locale,
  t,
}: {
  kind: "whatsapp" | "email";
  config: SiteConfig;
  locale: Locale;
  t: Dictionary;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const available =
    kind === "whatsapp" ? !!config.whatsappNumber : !!config.email;
  function insertEmoji() {
    const el = textarea.current;
    const start = el?.selectionStart ?? message.length;
    const end = el?.selectionEnd ?? message.length;
    const text = limitMessage(
      message.slice(0, start) + "👋" + message.slice(end),
    );
    setMessage(text);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(
        Math.min(start + 2, text.length),
        Math.min(start + 2, text.length),
      );
    });
  }
  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError(t.empty);
      textarea.current?.focus();
      return;
    }
    if (!available) return;
    const url =
      kind === "whatsapp"
        ? buildWhatsAppUrl(config.whatsappNumber, message)
        : `mailto:${config.email}?body=${encodeURIComponent(message.trim())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return (
    <form onSubmit={send} className="composer" noValidate>
      <div className={`message-field ${error ? "has-error" : ""}`}>
        <label className="sr-only" htmlFor="contact-message">
          {t.message}
        </label>
        <textarea
          id="contact-message"
          ref={textarea}
          maxLength={500}
          placeholder={t.placeholder}
          value={message}
          aria-invalid={!!error}
          aria-describedby={error ? "composer-error" : "composer-counter"}
          onChange={(e) => {
            setMessage(e.target.value);
            setError("");
          }}
        />
        <div className="field-toolbar">
          <button
            type="button"
            className="emoji-button"
            aria-label={t.emoji}
            onClick={insertEmoji}
          >
            <Smile size={23} />
          </button>
          <span
            id="composer-counter"
            aria-label={`${message.length}/500 ${t.counter}`}
            dir="ltr"
          >
            {message.length}/500
          </span>
        </div>
      </div>
      {error && (
        <p className="form-error" id="composer-error" role="alert">
          {error}
        </p>
      )}
      <fieldset className="quick-messages">
        <legend>{t.quick}</legend>
        <div className="quick-chips">
          {[...config.quickMessages]
            .sort((a, b) => a.order - b.order)
            .map((p) => (
              <button
                type="button"
                key={p.id}
                aria-pressed={message === p.text[locale]}
                onClick={() => {
                  setMessage(limitMessage(p.text[locale]));
                  setError("");
                }}
              >
                {p.text[locale]}
              </button>
            ))}
        </div>
      </fieldset>
      {!available && (
        <p className="availability" role="status">
          {kind === "whatsapp" ? t.numberMissing : t.emailMissing}
        </p>
      )}
      <button
        type="submit"
        className="send-button sheet-primary"
        disabled={!available || !message.trim()}
      >
        <Send size={23} />
        {kind === "whatsapp" ? t.send : t.openEmail}
        <ArrowUpRight className="send-arrow" size={18} />
      </button>
      <p className="handoff-note">
        {kind === "whatsapp" ? t.handoff : t.emailHandoff}
      </p>
    </form>
  );
}
