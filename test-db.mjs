import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ugtkutrgmhtydhhyypny.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVndGt1dHJnbWh0eWRoaHl5cG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMjc1NjcsImV4cCI6MjA5ODYwMzU2N30.5YwVEa41JXlPYNogNKhCPxs9bxcEJbqL11E3T9Sa-ZI',
  { realtime: { mode: 'manual' } }
);

const { data, error } = await supabase
  .from('debts')
  .select('id, name, amount_owed, status, payments')
  .eq('name', 'Gideon')
  .single();

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('\n=== Gideon in DB ===');
  console.log('amount_owed:', data.amount_owed);
  console.log('status:', data.status);
  console.log('payments type:', typeof data.payments);
  if (typeof data.payments === 'string') {
    try {
      const parsed = JSON.parse(data.payments);
      console.log('payments (parsed) count:', parsed.length);
      console.log('payments (parsed):', parsed);
    } catch (e) {
      console.log('payments (raw, invalid JSON):', data.payments?.substring(0, 100));
    }
  } else {
    console.log('payments (not a string):', data.payments);
  }
}
