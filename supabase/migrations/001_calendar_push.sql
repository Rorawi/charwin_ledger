-- Calendar entries (content plans + general events)
CREATE TABLE IF NOT EXISTS calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('content', 'event')),
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  target_date DATE NOT NULL,
  platforms JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'needs_posting' CHECK (status IN ('needs_posting', 'posted')),
  posted_platforms JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_target_date ON calendar_entries (target_date);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_status ON calendar_entries (status);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_inventory ON calendar_entries (inventory_id);

-- Web push subscriptions (single-user app, no auth)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Optional image URL on inventory for share
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS image_url TEXT;

-- RLS: allow anon access (matches existing app pattern)
ALTER TABLE calendar_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read calendar_entries" ON calendar_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert calendar_entries" ON calendar_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update calendar_entries" ON calendar_entries FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete calendar_entries" ON calendar_entries FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read push_subscriptions" ON push_subscriptions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert push_subscriptions" ON push_subscriptions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update push_subscriptions" ON push_subscriptions FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete push_subscriptions" ON push_subscriptions FOR DELETE TO anon USING (true);

-- App settings (notification thresholds synced from client)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read app_settings" ON app_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon upsert app_settings" ON app_settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update app_settings" ON app_settings FOR UPDATE TO anon USING (true);
