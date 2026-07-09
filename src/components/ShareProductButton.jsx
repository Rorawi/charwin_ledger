"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { shareProduct, copyToClipboard } from "../lib/share";
import { buildProductCaption } from "../lib/calendar";

export default function ShareProductButton({ item, formatCurrency, imageUrl, className = "" }) {
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(null);

  const caption = buildProductCaption(item, formatCurrency);

  const handleShare = async () => {
    const result = await shareProduct({ item, formatCurrency, imageUrl });
    if (result.method === "fallback" || (!result.success && !result.cancelled)) {
      setShowFallback(true);
    }
  };

  const handleCopy = async (type) => {
    const text = type === "caption" ? caption : window.location.href;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider font-semibold px-3 py-2 rounded-lg border border-[#ECE6DD] bg-brand-cream text-brand-charcoal hover:bg-brand-paper transition-colors cursor-pointer"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>

      {showFallback && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCopy("caption")}
            className="inline-flex items-center gap-1 text-[11px] font-sans px-2.5 py-1.5 rounded-lg bg-brand-paper border border-[#ECE6DD] cursor-pointer"
          >
            {copied === "caption" ? <Check className="w-3 h-3 text-brand-sage" /> : <Copy className="w-3 h-3" />}
            Copy caption
          </button>
          <button
            type="button"
            onClick={() => handleCopy("link")}
            className="inline-flex items-center gap-1 text-[11px] font-sans px-2.5 py-1.5 rounded-lg bg-brand-paper border border-[#ECE6DD] cursor-pointer"
          >
            {copied === "link" ? <Check className="w-3 h-3 text-brand-sage" /> : <Copy className="w-3 h-3" />}
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
