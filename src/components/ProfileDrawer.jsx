"use client";

import { X, ScrollText, Calendar, Bell, ChevronRight, ChevronLeft } from "lucide-react";
import SummaryView from "./SummaryView";
import CalendarView from "./CalendarView";
import NotificationsView from "./NotificationsView";

const SECTIONS = [
  { id: "summary", label: "Summary", icon: ScrollText, description: "Cash position and ledger overview" },
  { id: "calendar", label: "Calendar", icon: Calendar, description: "Content plans and occasions" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Reminders and alerts" },
];

export default function ProfileDrawer({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  onBackToMenu,
  // Summary props
  formatCurrency,
  summaryTotals,
  categoryBreakdown,
  expenses,
  // Calendar props
  calendarEntries,
  inventory,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onMarkPosted,
  // Notifications props
  notifications,
  settings,
  onUpdateSettings,
  onEnablePush,
  onDisablePush,
  pushSupported,
  pushPermission,
  onNavigateToUnposted,
  calendarFilterUnposted,
}) {
  if (!isOpen) return null;

  const activeMeta = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div
        className="absolute inset-0 bg-[#1A1816]/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <aside className="relative w-full max-w-sm bg-brand-paper h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-[#ECE6DD]">
        {/* Header */}
        <div className="px-5 pt-10 pb-4 border-b border-[#F2ECE4] shrink-0">
          <div className="flex items-center justify-between">
            {activeSection ? (
              <button
                type="button"
                onClick={onBackToMenu}
                className="flex items-center gap-1 text-brand-clay hover:text-brand-charcoal transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs font-sans uppercase tracking-wider">Menu</span>
              </button>
            ) : (
              <p className="text-[10px] uppercase tracking-widest text-brand-clay font-sans">Your ledger</p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-brand-cream text-brand-clay transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="font-serif text-2xl font-bold text-brand-charcoal mt-3">
            {activeSection ? activeMeta?.label : "Profile"}
          </h2>
          {!activeSection && (
            <p className="text-sm text-brand-clay font-sans mt-1 leading-relaxed">
              Summary, planning, and gentle reminders — all in one place.
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!activeSection ? (
            <nav className="px-4 py-5 space-y-2">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const badge =
                  section.id === "notifications" && notifications.length > 0
                    ? notifications.length
                    : null;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => onSectionChange(section.id)}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-[#ECE6DD] bg-brand-cream/50 hover:bg-brand-cream transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-paper border border-[#ECE6DD] flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-brand-charcoal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-brand-charcoal">{section.label}</p>
                      <p className="text-xs text-brand-clay font-sans mt-0.5">{section.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {badge && (
                        <span className="text-[10px] font-semibold bg-brand-rust/10 text-brand-rust px-2 py-0.5 rounded-full">
                          {badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-brand-clay/60 group-hover:text-brand-charcoal transition-colors" />
                    </div>
                  </button>
                );
              })}
            </nav>
          ) : activeSection === "summary" ? (
            <div className="px-4 py-5">
              <SummaryView
                formatCurrency={formatCurrency}
                totals={summaryTotals}
                categoryBreakdown={categoryBreakdown}
                expenses={expenses}
              />
            </div>
          ) : activeSection === "calendar" ? (
            <CalendarView
              entries={calendarEntries}
              inventory={inventory}
              formatCurrency={formatCurrency}
              onAddEntry={onAddEntry}
              onUpdateEntry={onUpdateEntry}
              onDeleteEntry={onDeleteEntry}
              onMarkPosted={onMarkPosted}
              filterUnposted={calendarFilterUnposted}
            />
          ) : (
            <NotificationsView
              notifications={notifications}
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onEnablePush={onEnablePush}
              onDisablePush={onDisablePush}
              pushSupported={pushSupported}
              pushPermission={pushPermission}
              onNavigateToUnposted={onNavigateToUnposted}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
