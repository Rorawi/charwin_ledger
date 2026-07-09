"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PLATFORMS } from "../lib/calendar";

export default function CalendarEntrySheet({ inventory, entry, defaultDate, onClose, onSubmit }) {
  const isEdit = Boolean(entry);
  const [entryType, setEntryType] = useState(entry?.entry_type || "content");
  const [inventoryId, setInventoryId] = useState(entry?.inventory_id || "");
  const [title, setTitle] = useState(entry?.title || "");
  const [notes, setNotes] = useState(entry?.notes || "");
  const [targetDate, setTargetDate] = useState(
    entry?.target_date?.slice(0, 10) || defaultDate || new Date().toISOString().slice(0, 10)
  );
  const [platforms, setPlatforms] = useState(
    Array.isArray(entry?.platforms) ? entry.platforms : ["instagram"]
  );

  const togglePlatform = (id) => {
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleProductChange = (id) => {
    setInventoryId(id);
    const item = inventory.find((i) => i.id === id);
    if (item && !isEdit) setTitle(item.name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (entryType === "content" && !inventoryId && !isEdit) return;

    onSubmit({
      entry_type: entryType,
      inventory_id: entryType === "content" ? inventoryId || entry?.inventory_id : null,
      title: title.trim(),
      notes: notes.trim(),
      target_date: targetDate,
      platforms: entryType === "content" ? platforms : [],
      status: entry?.status || "needs_posting",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <div className="absolute inset-0 bg-[#1A1816]/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-brand-paper rounded-t-2xl shadow-2xl z-10 overflow-hidden animate-slide-up flex flex-col max-h-[85vh] border-t border-[#ECE6DD]">
        <div className="w-full flex justify-center py-3 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-[#E6E1DA]" />
        </div>
        <button type="button" onClick={onClose} className="absolute right-4 top-3 p-1.5 rounded-full hover:bg-brand-cream text-brand-clay cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="px-6 pb-8 overflow-y-auto flex-1">
          <h2 className="font-serif font-bold text-2xl text-brand-charcoal mb-1">
            {isEdit ? "Edit entry" : "Add to calendar"}
          </h2>
          <p className="text-sm text-brand-clay font-sans mb-6">Plan content or mark an occasion on your calendar.</p>

          {!isEdit && (
            <div className="flex gap-2 mb-5">
              {["content", "event"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEntryType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold font-sans cursor-pointer border transition-colors ${
                    entryType === type
                      ? "bg-brand-charcoal text-white border-brand-charcoal"
                      : "bg-brand-cream text-brand-clay border-[#ECE6DD]"
                  }`}
                >
                  {type === "content" ? "Content" : "Event"}
                </button>
              ))}
            </div>
          )}

          {entryType === "content" && !isEdit && (
            <label className="block mb-4">
              <span className="text-[10px] uppercase tracking-wider text-brand-clay font-sans">Product</span>
              <select
                value={inventoryId}
                onChange={(e) => handleProductChange(e.target.value)}
                required
                className="mt-1.5 w-full bg-brand-cream rounded-xl border border-[#ECE6DD] px-3 py-2.5 text-sm font-sans text-brand-charcoal focus:outline-none focus:border-brand-rust"
              >
                <option value="">Select a product...</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          )}

          <label className="block mb-4">
            <span className="text-[10px] uppercase tracking-wider text-brand-clay font-sans">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1.5 w-full bg-brand-cream rounded-xl border border-[#ECE6DD] px-3 py-2.5 text-sm font-sans text-brand-charcoal focus:outline-none focus:border-brand-rust"
            />
          </label>

          <label className="block mb-4">
            <span className="text-[10px] uppercase tracking-wider text-brand-clay font-sans">Date</span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
              className="mt-1.5 w-full bg-brand-cream rounded-xl border border-[#ECE6DD] px-3 py-2.5 text-sm font-sans text-brand-charcoal focus:outline-none focus:border-brand-rust"
            />
          </label>

          {entryType === "content" && (
            <div className="mb-4">
              <span className="text-[10px] uppercase tracking-wider text-brand-clay font-sans block mb-2">Platforms</span>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium cursor-pointer border transition-colors ${
                      platforms.includes(p.id)
                        ? "bg-brand-charcoal text-white border-brand-charcoal"
                        : "bg-brand-cream text-brand-clay border-[#ECE6DD]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block mb-6">
            <span className="text-[10px] uppercase tracking-wider text-brand-clay font-sans">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={entryType === "event" ? "Holiday, sale period, market day..." : "Caption ideas, hashtags..."}
              className="mt-1.5 w-full bg-brand-cream rounded-xl border border-[#ECE6DD] px-3 py-2.5 text-sm font-sans text-brand-charcoal focus:outline-none focus:border-brand-rust resize-none"
            />
          </label>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-brand-charcoal text-white font-sans text-sm uppercase tracking-wider font-semibold cursor-pointer hover:bg-[#2A2622] transition-colors"
          >
            {isEdit ? "Save changes" : "Add entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
