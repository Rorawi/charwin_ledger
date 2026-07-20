async function run() {
  const url = 'https://ugtkutrgmhtydhhyypny.supabase.co/rest/v1/app_settings?select=*';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVndGt1dHJnbWh0eWRoaHl5cG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMjc1NjcsImV4cCI6MjA5ODYwMzU2N30.5YwVEa41JXlPYNogNKhCPxs9bxcEJbqL11E3T9Sa-ZI';
  
  try {
    const response = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });
    console.log('=== app_settings ===');
    console.log(await response.json());
  } catch (e) {
    console.error(e);
  }

  try {
    const calUrl = 'https://ugtkutrgmhtydhhyypny.supabase.co/rest/v1/calendar_entries?select=*&limit=5';
    const response = await fetch(calUrl, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });
    console.log('=== calendar_entries ===');
    console.log(await response.json());
  } catch (e) {
    console.error(e);
  }
}

run();
