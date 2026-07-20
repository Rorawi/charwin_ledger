"use client";

import { useState } from "react";
import { Bell, Package, Users, Clock, Check } from "lucide-react";

const ICONS = {
  content: Package,
  debt: Users,
  stock: Package,
  reminder: Clock,
};

export default function NotificationsView({
  notifications,
  settings,
  onUpdateSettings,
  onEnablePush,
  onDisablePush,
  pushSupported,
  pushPermission,
  onNavigateToUnposted,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handlePushToggle = async () => {
    if (settings.pushEnabled) {
      await onDisablePush();
      onUpdateSettings({ pushEnabled: false });
    } else {
      await onEnablePush();
    }
  };

  return (
    <div className="px-4 py-5 pb-28 space-y-6">
      <section>
        <p className="text-[10px] uppercase tracking-widest text-brand-clay font-sans mb-3">Recent</p>
        {notifications.length === 0 ? (
          <div className="bg-brand-cream rounded-xl border border-[#ECE6DD] px-4 py-8 text-center">
            <Bell className="w-6 h-6 text-brand-clay/40 mx-auto mb-2" />
            <p className="text-sm text-brand-clay font-sans italic">All quiet for now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              const isCopied = copiedId === n.id;

              const handleClick = () => {
                if (n.copyText) {
                  navigator.clipboard.writeText(n.copyText);
                  setCopiedId(n.id);
                  setTimeout(() => setCopiedId(null), 2000);
                } else if (n.action) {
                  n.action();
                }
              };

              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={handleClick}
                  className={`w-full text-left bg-brand-paper rounded-xl border transition-colors px-4 py-3.5 flex gap-3 ${
                    isCopied
                      ? "border-brand-sage bg-brand-sage/5"
                      : (n.action || n.copyText) ? "border-[#ECE6DD] hover:bg-brand-cream cursor-pointer" : "border-[#ECE6DD]"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isCopied ? "bg-brand-sage/10 border-brand-sage" : "bg-brand-cream border-[#ECE6DD]"}`}>
                    {isCopied ? <Check className="w-4 h-4 text-brand-sage" /> : <Icon className="w-4 h-4 text-brand-clay" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-brand-charcoal font-sans leading-relaxed">{n.message}</p>
                    <p className="text-[11px] font-sans mt-0.5 transition-colors" style={{ color: isCopied ? "#8E9A82" : "#8B7D6F" }}>
                      {isCopied ? "Reminder copied to clipboard!" : n.subtext}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-brand-paper rounded-2xl border border-[#ECE6DD] p-5 space-y-4">
        <h3 className="font-serif text-lg text-brand-charcoal">Reminder settings</h3>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-brand-clay font-sans">In-app reminder every (days)</span>
          <select
            value={settings.reminderFrequencyDays}
            onChange={(e) => onUpdateSettings({ reminderFrequencyDays: Number(e.target.value) })}
            className="mt-1.5 w-full bg-brand-cream rounded-xl border border-[#ECE6DD] px-3 py-2.5 text-sm font-sans text-brand-charcoal focus:outline-none focus:border-brand-rust"
          >
            <option value={2}>2 days</option>
            <option value={3}>3 days</option>
            <option value={4}>4 days</option>
            <option value={7}>7 days</option>
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-brand-clay font-sans">Push: unposted content after (days)</span>
          <select
            value={settings.contentAgeThresholdDays}
            onChange={(e) => onUpdateSettings({ contentAgeThresholdDays: Number(e.target.value) })}
            className="mt-1.5 w-full bg-brand-cream rounded-xl border border-[#ECE6DD] px-3 py-2.5 text-sm font-sans text-brand-charcoal focus:outline-none focus:border-brand-rust"
          >
            <option value={5}>5 days</option>
            <option value={7}>7 days</option>
            <option value={10}>10 days</option>
            <option value={14}>14 days</option>
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-brand-clay font-sans">Push: overdue debt after (days)</span>
          <select
            value={settings.debtAgeThresholdDays}
            onChange={(e) => onUpdateSettings({ debtAgeThresholdDays: Number(e.target.value) })}
            className="mt-1.5 w-full bg-brand-cream rounded-xl border border-[#ECE6DD] px-3 py-2.5 text-sm font-sans text-brand-charcoal focus:outline-none focus:border-brand-rust"
          >
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={45}>45 days</option>
            <option value={60}>60 days</option>
          </select>
        </label>
      </section>

      <section className="bg-brand-paper rounded-2xl border border-[#ECE6DD] p-5 space-y-3">
        <h3 className="font-serif text-lg text-brand-charcoal">Device notifications</h3>
        <p className="text-xs text-brand-clay font-sans leading-relaxed">
          Gentle reminders when added to your home screen. No spam — just unposted content, overdue balances, and out-of-stock items.
        </p>

        {!pushSupported ? (
          <p className="text-xs text-brand-clay font-sans italic">Not supported in this browser.</p>
        ) : (
          <>
            <button
              type="button"
              onClick={handlePushToggle}
              className={`w-full py-3 rounded-xl font-sans text-sm uppercase tracking-wider font-semibold cursor-pointer transition-colors ${
                settings.pushEnabled
                  ? "bg-brand-cream text-brand-charcoal border border-[#ECE6DD]"
                  : "bg-brand-charcoal text-white hover:bg-[#2A2622]"
              }`}
            >
              {settings.pushEnabled ? "Turn off notifications" : "Enable notifications"}
            </button>
            {pushPermission === "denied" && (
              <p className="text-[11px] text-brand-rust font-sans">Notifications are blocked in your browser settings.</p>
            )}
          </>
        )}

        {settings.pushEnabled && (
          <button type="button" onClick={onNavigateToUnposted} className="text-xs text-brand-clay hover:text-brand-charcoal font-sans underline cursor-pointer">
            View unposted content
          </button>
        )}
      </section>
    </div>
  );
}
