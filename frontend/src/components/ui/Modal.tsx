"use client";

import React, { useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  className,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop Scrim */}
      <div
        className="fixed inset-0 bg-[#0B111F]/70 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Frame */}
      <div
        role="dialog"
        aria-modal="true"
        className={twMerge(
          clsx(
            "relative w-full bg-white border border-[rgba(30,42,74,0.14)] rounded-2xl shadow-2xl z-10 overflow-hidden transform transition-all duration-200 animate-in fade-in-0 zoom-in-95",
            maxWidthStyles[maxWidth],
            className
          )
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="p-6 border-b border-[rgba(30,42,74,0.08)] pr-12">
            {title && (
              <h3 className="font-serif text-xl font-semibold text-[#131D36] tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-[#4C5878] mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F7F6F3] border border-[rgba(30,42,74,0.10)] flex items-center justify-center text-[#4C5878] hover:text-[#131D36] hover:bg-[#EFEDE6] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C69749]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Body Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
