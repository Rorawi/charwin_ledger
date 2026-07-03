"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * ConfirmModal - A styled confirmation dialog that replaces window.confirm
 *
 * Props:
 *  - isOpen: boolean
 *  - title: string
 *  - message: string
 *  - confirmLabel: string (default "Delete")
 *  - cancelLabel: string (default "Cancel")
 *  - onConfirm: () => void
 *  - onCancel: () => void
 *  - danger: boolean — if true, confirm button uses destructive red style
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  danger = true,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1A1816]/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-brand-paper rounded-2xl shadow-2xl border border-[#ECE6DD] p-6 animate-slide-up">
        {/* Icon */}
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-[#FAF1EE] border border-[#F2DDD7] mb-4 mx-auto">
          <AlertTriangle className="w-5 h-5 text-brand-rust" />
        </div>

        {/* Text */}
        <h3 className="font-serif font-bold text-lg text-brand-charcoal text-center mb-2 leading-tight">
          {title}
        </h3>
        <p className="text-sm text-brand-clay font-sans text-center leading-relaxed mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#ECE6DD] text-xs font-semibold uppercase tracking-wider text-brand-clay hover:bg-brand-cream font-sans transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-sans transition-colors cursor-pointer text-white ${
              danger
                ? "bg-red-700 hover:bg-red-800"
                : "bg-brand-rust hover:bg-brand-rust/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
