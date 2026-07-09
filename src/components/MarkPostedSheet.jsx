"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PLATFORMS } from "../lib/calendar";

export default function MarkPostedSheet({ entry, onClose, onSubmit }) {
  const existing = Array.isArray(entry.posted_platforms) ? entry.posted_platforms : [];
  const [postedPlatforms, setPostedPlatforms] = useState(
    existing.length > 0 ? existing : (Array.isArray(entry.platforms) ? entry.platforms : ["instagram"])
  );

  const toggle = (id) => {
    setPostedPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (postedPlatforms.length === 0) return;
    onSubmit(postedPlatforms);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <div className="absolute inset-0 bg-[#1A1816]/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-brand-paper rounded-t-2xl shadow-2xl z-10 overflow-hidden animate-slide-up border-t border-[#ECE6DD]">
        <div className="w-full flex justify-center py-3">
          <div className="w-12 h-1.5 rounded-full bg-[#E6E1DA]" />
        </div>
        <button type="button" onClick={onClose} className="absolute right-4 top-3 p-1.5 rounded-full hover:bg-brand-cream text-brand-clay cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="px-6 pb-8">
          <h2 className="font-serif font-bold text-2xl text-brand-charcoal mb-1">Mark as posted</h2>
          <p className="text-sm text-brand-clay font-sans mb-5">
            Which platforms did you share <span className="font-medium text-brand-charcoal">{entry.title}</span> on?
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={`px-3 py-2 rounded-lg text-xs font-sans font-medium cursor-pointer border transition-colors ${
                  postedPlatforms.includes(p.id)
                    ? "bg-brand-sage/20 text-brand-charcoal border-brand-sage"
                    : "bg-brand-cream text-brand-clay border-[#ECE6DD]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={postedPlatforms.length === 0}
            className="w-full py-3.5 rounded-xl bg-brand-charcoal text-white font-sans text-sm uppercase tracking-wider font-semibold cursor-pointer hover:bg-[#2A2622] transition-colors disabled:opacity-40"
          >
            Confirm posted
          </button>
        </form>
      </div>
    </div>
  );
}
