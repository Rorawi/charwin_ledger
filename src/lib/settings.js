export const DEFAULT_SETTINGS = {
  reminderFrequencyDays: 3,
  contentAgeThresholdDays: 7,
  debtAgeThresholdDays: 30,
  pushEnabled: false,
  pushPermissionRequested: false,
  lastReminderDismissedAt: null,
  sessionInteractionCount: 0,
};

const STORAGE_KEY = "thread-ledger-settings";

export function loadSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to save settings", e);
  }
}

export function updateSettings(partial) {
  const current = loadSettings();
  const next = { ...current, ...partial };
  saveSettings(next);
  return next;
}

export function shouldShowReminder(settings, unpostedCount) {
  if (unpostedCount <= 0) return false;
  if (!settings.lastReminderDismissedAt) return settings.sessionInteractionCount >= 3;
  const daysSince =
    (Date.now() - new Date(settings.lastReminderDismissedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= settings.reminderFrequencyDays;
}
