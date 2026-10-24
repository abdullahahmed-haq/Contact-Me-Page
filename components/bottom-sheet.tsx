"use client";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
} from "motion/react";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale, SheetTone } from "@/lib/config";
export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  locale,
  t,
  accent = "green",
  returnFocus,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  locale: Locale;
  t: Dictionary;
  accent?: SheetTone;
  returnFocus?: HTMLElement | null;
}) {
  const contentRef = useRef<HTMLElement>(null);
  const controls = useDragControls();
  const reduced = useReducedMotion();
  const restore = useRef<HTMLElement | null>(null);
  const [viewport, setViewport] = useState<{
    height: number;
    bottom: number;
  }>();
  useEffect(() => {
    if (!open) return;
    restore.current = returnFocus || (document.activeElement as HTMLElement);
    const update = () => {
      const v = window.visualViewport;
      if (v)
        setViewport({
          height: v.height,
          bottom: Math.max(0, window.innerHeight - v.height - v.offsetTop),
        });
    };
    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [open, returnFocus]);
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="sheet-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              forceMount
              asChild
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                requestAnimationFrame(() =>
                  contentRef.current
                    ?.querySelector<HTMLButtonElement>(".close-button")
                    ?.focus(),
                );
              }}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                restore.current?.focus();
              }}
            >
              <motion.section
                ref={contentRef}
                lang={locale}
                dir={locale === "ar" ? "rtl" : "ltr"}
                className={`bottom-sheet accent-${accent}`}
                style={
                  viewport
                    ? {
                        maxHeight: viewport.height * 0.85,
                        bottom: viewport.bottom,
                      }
                    : undefined
                }
                initial={{
                  y: reduced ? 0 : "100%",
                  opacity: reduced ? 1 : 0.8,
                }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: reduced ? 0 : "100%", opacity: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 330, damping: 34 }
                }
                drag="y"
                dragListener={false}
                dragControls={controls}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 85 || info.velocity.y > 650) onClose();
                }}
              >
                <div
                  className="drag-zone"
                  aria-hidden="true"
                  onPointerDown={(e) => controls.start(e)}
                >
                  <span />
                </div>
                <header className="sheet-header">
                  <span className="sheet-icon">{icon}</span>
                  <div>
                    <Dialog.Title>{title}</Dialog.Title>
                    <Dialog.Description>{subtitle}</Dialog.Description>
                  </div>
                  <Dialog.Close className="close-button" aria-label={t.close}>
                    <X size={22} />
                  </Dialog.Close>
                </header>
                <div className="sheet-body">{children}</div>
              </motion.section>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
