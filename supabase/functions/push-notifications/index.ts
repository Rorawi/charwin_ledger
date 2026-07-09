import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "npm:web-push@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:hello@threadledger.app";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getThresholds() {
  const defaults = {
    contentAgeThresholdDays: Number(Deno.env.get("CONTENT_AGE_DAYS") || 7),
    debtAgeThresholdDays: Number(Deno.env.get("DEBT_AGE_DAYS") || 30),
  };

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "notification_thresholds")
    .maybeSingle();

  if (data?.value) {
    return {
      contentAgeThresholdDays: data.value.contentAgeThresholdDays ?? defaults.contentAgeThresholdDays,
      debtAgeThresholdDays: data.value.debtAgeThresholdDays ?? defaults.debtAgeThresholdDays,
    };
  }
  return defaults;
}

function daysSince(dateStr: string) {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

function parsePurchases(row: { items: unknown; date?: string; amount_owed?: number; name?: string }) {
  let raw = row.items;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.map((entry: { date?: string; finalAmount?: number; remainingAmount?: number }) => ({
    date: entry.date || row.date,
    finalAmount: Number(entry.finalAmount) || 0,
  }));
}

async function sendToAll(payload: { title: string; body: string; tag: string; url?: string }) {
  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs?.length) return { sent: 0 };

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }
  return { sent };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const thresholds = await getThresholds();
  const results: Record<string, unknown> = {};

  // 1. Unposted content older than threshold
  const { data: contentEntries } = await supabase
    .from("calendar_entries")
    .select("*")
    .eq("entry_type", "content")
    .eq("status", "needs_posting");

  const staleContent = (contentEntries || []).filter(
    (e) => daysSince(e.created_at || e.target_date) >= thresholds.contentAgeThresholdDays
  );

  if (staleContent.length > 0) {
    results.content = await sendToAll({
      title: "Thread Ledger",
      body: `You have ${staleContent.length} product${staleContent.length === 1 ? "" : "s"} waiting to be shared.`,
      tag: "unposted-content",
      url: "/?drawer=calendar",
    });
  }

  // 2. Overdue debts
  const { data: debts } = await supabase.from("debts").select("*").eq("status", "active");
  for (const debt of debts || []) {
    const owed = Number(debt.amount_owed) || 0;
    if (owed <= 0) continue;
    const purchases = parsePurchases(debt);
    const oldest = purchases.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())[0];
    if (!oldest?.date) continue;
    if (daysSince(oldest.date) >= thresholds.debtAgeThresholdDays) {
      results[`debt-${debt.id}`] = await sendToAll({
        title: "Thread Ledger",
        body: `${debt.name} still owes ₵${Math.round(owed)} — sent over ${thresholds.debtAgeThresholdDays} days ago.`,
        tag: `debt-${debt.id}`,
        url: "/",
      });
    }
  }

  // 3. Out of stock
  const { data: inventory } = await supabase.from("inventory").select("*").eq("quantity", 0);
  for (const item of inventory || []) {
    results[`stock-${item.id}`] = await sendToAll({
      title: "Thread Ledger",
      body: `${item.name} is out of stock.`,
      tag: `stock-${item.id}`,
      url: "/?drawer=calendar",
    });
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
