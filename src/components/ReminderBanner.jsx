"use client";

import { X } from "lucide-react";

export default function ReminderBanner({ count, onShow, onDismiss }) {
  if (count <= 0) return null;

  return (
    <div className="mx-6 mt-3 mb-1 bg-brand-paper border border-[#ECE6DD] rounded-xl px-4 py-3.5 flex items-start gap-3 shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-brand-charcoal font-sans leading-relaxed">
          You have <span className="font-semibold">{count}</span>{" "}
          {count === 1 ? "product ready" : "products ready"} to share.
        </p>
        <div className="flex gap-3 mt-2.5">
          <button type="button" onClick={onShow} className="text-xs font-sans uppercase tracking-wider font-semibold text-brand-rust cursor-pointer">
            Show me
          </button>
          <button type="button" onClick={onDismiss} className="text-xs font-sans uppercase tracking-wider font-semibold text-brand-clay cursor-pointer">
            Remind me later
          </button>
        </div>
      </div>
      <button type="button" onClick={onDismiss} className="p-1 text-brand-clay/60 hover:text-brand-clay cursor-pointer shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
