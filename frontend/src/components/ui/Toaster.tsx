"use client";

import type { ReactNode } from "react";
import { Toaster as SonnerToaster, toast as sonnerToast, type ExternalToast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

/**
 * Headless Sonner setup (ask-sonner styling ladder, rung 4): toast.custom() opts out of
 * Sonner's injected stylesheet entirely (`data-styled` becomes false), so every part below
 * is styled once from our own design tokens with no `!important` cascade fight against it.
 */
export function Toaster() {
  return <SonnerToaster position="bottom-right" gap={8} offset={20} />;
}

type ToastVariant = "success" | "error" | "warning" | "info";

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="w-[18px] h-[18px] text-sage" />,
  error: <XCircle className="w-[18px] h-[18px] text-red-500" />,
  warning: <AlertTriangle className="w-[18px] h-[18px] text-brass" />,
  info: <Info className="w-[18px] h-[18px] text-brass" />,
};

const ACCENT_BORDER: Record<ToastVariant, string> = {
  success: "border-sage/70",
  error: "border-red-500/60",
  warning: "border-brass",
  info: "border-brass/40",
};

const TOAST_SHELL =
  "flex items-start gap-3 w-[356px] max-w-[calc(100vw-2.5rem)] rounded-xl border bg-navy-900 p-4 shadow-2xl backdrop-blur-md font-sans";
const CONTENT = "flex flex-1 min-w-0 flex-col gap-0.5";
const TITLE = "text-sm font-semibold tracking-tight leading-snug text-canvas";
const DESCRIPTION = "text-xs font-normal leading-relaxed text-canvas/70";
const ACTION_BUTTON =
  "inline-flex h-7 shrink-0 items-center self-center rounded-lg bg-brass px-3 text-xs font-semibold text-navy-950 transition-colors duration-200 hover:bg-brass-600 active:scale-95";
const CANCEL_BUTTON =
  "inline-flex h-7 shrink-0 items-center self-center rounded-lg bg-white/10 px-3 text-xs font-medium text-canvas transition-colors duration-200 hover:bg-white/20";

function themedToast(variant: ToastVariant | undefined, title: ReactNode, opts?: ExternalToast) {
  return sonnerToast.custom(() => <span className={TITLE}>{title}</span>, {
    ...opts,
    icon: variant ? ICONS[variant] : opts?.icon,
    classNames: {
      toast: variant ? `${TOAST_SHELL} ${ACCENT_BORDER[variant]}` : `${TOAST_SHELL} border-brass/30`,
      icon: "flex shrink-0 items-center pt-0.5",
      content: CONTENT,
      description: DESCRIPTION,
      actionButton: ACTION_BUTTON,
      cancelButton: CANCEL_BUTTON,
      ...opts?.classNames,
    },
  });
}

/**
 * Drop-in replacement for sonner's own `toast` — same call shape
 * (`toast.success(title, { description, action })`, etc.), themed to Settly.
 */
export const toast = Object.assign(
  (title: ReactNode, opts?: ExternalToast) => themedToast(undefined, title, opts),
  {
    success: (title: ReactNode, opts?: ExternalToast) => themedToast("success", title, opts),
    error: (title: ReactNode, opts?: ExternalToast) => themedToast("error", title, opts),
    warning: (title: ReactNode, opts?: ExternalToast) => themedToast("warning", title, opts),
    info: (title: ReactNode, opts?: ExternalToast) => themedToast("info", title, opts),
    dismiss: sonnerToast.dismiss,
  }
);
