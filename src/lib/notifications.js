export function deriveNotifications({
  calendarEntries,
  customerProfiles,
  inventory,
  settings,
  formatCurrency,
  onNavigateToUnposted,
}) {
  const notifications = [];
  const now = Date.now();
  const contentThresholdMs = (settings.contentAgeThresholdDays || 7) * 86400000;
  const debtThresholdMs = (settings.debtAgeThresholdDays || 30) * 86400000;

  const unposted = calendarEntries.filter(
    (e) => e.entry_type === "content" && e.status === "needs_posting"
  );

  if (unposted.length > 0) {
    notifications.push({
      id: "unposted-content",
      type: "content",
      message: `You have ${unposted.length} product${unposted.length === 1 ? "" : "s"} ready to share.`,
      subtext: "Tap to view your content calendar.",
      action: onNavigateToUnposted,
    });
  }

  const staleContent = unposted.filter((e) => {
    const created = new Date(e.created_at || e.target_date).getTime();
    return now - created >= contentThresholdMs;
  });

  if (staleContent.length > 0) {
    notifications.push({
      id: "stale-content",
      type: "reminder",
      message: `${staleContent.length} item${staleContent.length === 1 ? "" : "s"} waiting over ${settings.contentAgeThresholdDays} days.`,
      subtext: "A gentle nudge to share when you have a moment.",
      action: onNavigateToUnposted,
    });
  }

  for (const profile of customerProfiles) {
    if (profile.status !== "active" || profile.amountOwed <= 0) continue;
    const oldestUnpaid = profile.purchases
      .filter((p) => p.remainingAmount > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    if (!oldestUnpaid) continue;
    const age = now - new Date(oldestUnpaid.date).getTime();
    if (age >= debtThresholdMs) {
      notifications.push({
        id: `debt-${profile.id}`,
        type: "debt",
        message: `${profile.name} still owes ${formatCurrency(profile.amountOwed)}.`,
        subtext: `Outstanding since ${new Date(oldestUnpaid.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
      });
    }
  }

  for (const item of inventory) {
    if (item.quantity === 0) {
      notifications.push({
        id: `stock-${item.id}`,
        type: "stock",
        message: `${item.name} is out of stock.`,
        subtext: "Consider restocking when you can.",
      });
    }
  }

  return notifications;
}

async function syncSettingsToDb(settings) {
  try {
    const { supabase } = await import("./supabase");
    await supabase.from("app_settings").upsert(
      {
        key: "notification_thresholds",
        value: {
          contentAgeThresholdDays: settings.contentAgeThresholdDays,
          debtAgeThresholdDays: settings.debtAgeThresholdDays,
        },
      },
      { onConflict: "key" }
    );
  } catch {
    // Table may not exist yet — settings still work locally
  }
}

export { syncSettingsToDb };
