"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  getMonthGrid,
  formatMonthYear,
  formatShortDate,
  toDateKey,
  platformLabel,
} from "../lib/calendar";
import CalendarEntrySheet from "./CalendarEntrySheet";
import MarkPostedSheet from "./MarkPostedSheet";
import ShareProductButton from "./ShareProductButton";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({
  entries,
  inventory,
  formatCurrency,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onMarkPosted,
  filterUnposted = false,
}) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [postingEntry, setPostingEntry] = useState(null);

  const visibleEntries = useMemo(() => {
    if (!filterUnposted) return entries;
    return entries.filter((e) => e.entry_type === "content" && e.status === "needs_posting");
  }, [entries, filterUnposted]);

  const grid = useMemo(() => getMonthGrid(viewDate), [viewDate]);

  const entriesByDate = useMemo(() => {
    const map = new Map();
    for (const entry of visibleEntries) {
      const key = entry.target_date?.slice(0, 10) || toDateKey(entry.target_date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    }
    return map;
  }, [visibleEntries]);

  const selectedEntries = entriesByDate.get(selectedDate) || [];

  const monthAgenda = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    return visibleEntries
      .filter((e) => {
        const d = new Date(e.target_date);
        return d.getFullYear() === y && d.getMonth() === m;
      })
      .sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
  }, [visibleEntries, viewDate]);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const getInventoryItem = (inventoryId) => inventory.find((i) => i.id === inventoryId);

  return (
    <div className="px-4 py-5 pb-28 space-y-5">
      {filterUnposted && (
        <div className="bg-brand-cream rounded-xl border border-[#ECE6DD] px-4 py-3">
          <p className="text-sm text-brand-charcoal font-sans">Showing items that need posting.</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="p-2 rounded-lg hover:bg-brand-cream cursor-pointer">
          <ChevronLeft className="w-5 h-5 text-brand-clay" />
        </button>
        <h3 className="font-serif text-lg text-brand-charcoal">{formatMonthYear(viewDate)}</h3>
        <button type="button" onClick={nextMonth} className="p-2 rounded-lg hover:bg-brand-cream cursor-pointer">
          <ChevronRight className="w-5 h-5 text-brand-clay" />
        </button>
      </div>

      <div className="bg-brand-paper rounded-2xl border border-[#ECE6DD] p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] uppercase tracking-wider text-brand-clay font-sans py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, idx) => {
            if (!cell) return <div key={`empty-${idx}`} className="aspect-square" />;
            const key = toDateKey(cell);
            const dayEntries = entriesByDate.get(key) || [];
            const isSelected = key === selectedDate;
            const isToday = key === toDateKey(new Date());
            const hasContent = dayEntries.some((e) => e.entry_type === "content");
            const hasEvent = dayEntries.some((e) => e.entry_type === "event");

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-brand-charcoal text-white"
                    : isToday
                      ? "bg-brand-rust/10 text-brand-charcoal"
                      : "hover:bg-brand-cream text-brand-charcoal"
                }`}
              >
                <span className="text-sm font-sans font-medium">{cell.getDate()}</span>
                {(hasContent || hasEvent) && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasContent && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/80" : "bg-brand-rust"}`} />
                    )}
                    {hasEvent && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/60" : "bg-brand-sage"}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <section>
        <p className="text-[10px] uppercase tracking-widest text-brand-clay font-sans mb-2">
          {formatShortDate(selectedDate)}
        </p>
        {selectedEntries.length === 0 ? (
          <div className="bg-brand-cream rounded-xl border border-[#ECE6DD] px-4 py-6 text-center">
            <p className="text-sm text-brand-clay font-sans italic">Nothing planned for this day.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                inventoryItem={getInventoryItem(entry.inventory_id)}
                formatCurrency={formatCurrency}
                onEdit={() => setEditingEntry(entry)}
                onMarkPosted={() => setPostingEntry(entry)}
                onDelete={() => onDeleteEntry(entry.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="text-[10px] uppercase tracking-widest text-brand-clay font-sans mb-2">This month</p>
        {monthAgenda.length === 0 ? (
          <p className="text-sm text-brand-clay font-sans italic px-1">No entries this month yet.</p>
        ) : (
          <div className="space-y-2">
            {monthAgenda.map((entry) => (
              <button
                key={`agenda-${entry.id}`}
                type="button"
                onClick={() => {
                  setSelectedDate(entry.target_date.slice(0, 10));
                  setViewDate(new Date(entry.target_date));
                }}
                className="w-full text-left bg-brand-cream rounded-xl border border-[#ECE6DD] px-3.5 py-3 flex justify-between items-center hover:bg-brand-paper transition-colors cursor-pointer"
              >
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-semibold text-brand-charcoal font-sans truncate">{entry.title}</p>
                  <p className="text-[11px] text-brand-clay font-sans mt-0.5">
                    {entry.entry_type === "content" ? "Content" : "Event"}
                    {entry.status === "needs_posting" ? " · Needs posting" : entry.status === "posted" ? " · Posted" : ""}
                  </p>
                </div>
                <span className="text-xs text-brand-clay font-sans shrink-0">
                  {new Date(entry.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-24 right-6 z-[70] bg-brand-rust text-white rounded-full p-4 shadow-xl hover:bg-[#A34E2F] transition-colors cursor-pointer flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold"
      >
        <Plus className="w-5 h-5" />
        <span>Add</span>
      </button>

      {isAddOpen && (
        <CalendarEntrySheet
          inventory={inventory}
          defaultDate={selectedDate}
          onClose={() => setIsAddOpen(false)}
          onSubmit={onAddEntry}
        />
      )}

      {editingEntry && (
        <CalendarEntrySheet
          inventory={inventory}
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSubmit={(data) => {
            onUpdateEntry(editingEntry.id, data);
            setEditingEntry(null);
          }}
        />
      )}

      {postingEntry && (
        <MarkPostedSheet
          entry={postingEntry}
          onClose={() => setPostingEntry(null)}
          onSubmit={(postedPlatforms) => {
            onMarkPosted(postingEntry.id, postedPlatforms);
            setPostingEntry(null);
          }}
        />
      )}
    </div>
  );
}

function EntryCard({ entry, inventoryItem, formatCurrency, onEdit, onMarkPosted, onDelete }) {
  const platforms = Array.isArray(entry.platforms) ? entry.platforms : [];

  return (
    <div className="bg-brand-paper rounded-xl border border-[#ECE6DD] p-4 space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] uppercase tracking-wider font-sans px-2 py-0.5 rounded-full ${
                entry.entry_type === "content"
                  ? "bg-brand-rust/10 text-brand-rust"
                  : "bg-brand-sage/10 text-brand-sage"
              }`}
            >
              {entry.entry_type === "content" ? "Content" : "Event"}
            </span>
            {entry.status === "needs_posting" && (
              <span className="text-[10px] uppercase tracking-wider font-sans text-brand-clay">Needs posting</span>
            )}
            {entry.status === "posted" && (
              <span className="text-[10px] uppercase tracking-wider font-sans text-brand-sage">Posted</span>
            )}
          </div>
          <h4 className="font-serif font-semibold text-brand-charcoal mt-2">{entry.title}</h4>
          {entry.notes && (
            <p className="text-xs text-brand-clay font-sans mt-1 leading-relaxed">{entry.notes}</p>
          )}
          {platforms.length > 0 && (
            <p className="text-[11px] text-brand-clay font-sans mt-1.5">
              {platforms.map(platformLabel).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {entry.entry_type === "content" && entry.status === "needs_posting" && inventoryItem && (
        <div className="flex flex-wrap gap-2 pt-1">
          <ShareProductButton
            item={inventoryItem}
            formatCurrency={formatCurrency}
            imageUrl={entry.image_url || inventoryItem.image_url}
          />
          <button
            type="button"
            onClick={onMarkPosted}
            className="text-xs font-sans uppercase tracking-wider font-semibold px-3 py-2 rounded-lg bg-brand-charcoal text-white cursor-pointer"
          >
            Mark posted
          </button>
        </div>
      )}

      <div className="flex gap-3 pt-1 border-t border-[#F2ECE4]">
        <button type="button" onClick={onEdit} className="text-xs text-brand-clay hover:text-brand-charcoal font-sans cursor-pointer">
          Edit
        </button>
        <button type="button" onClick={onDelete} className="text-xs text-brand-rust/80 hover:text-brand-rust font-sans cursor-pointer">
          Remove
        </button>
      </div>
    </div>
  );
}
