// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseBrowser = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anon) {
    console.warn('Supabase environment variables not configured');
    // Return a dummy client for development
    return createClient('https://dummy.supabase.co', 'dummy-anon-key');
  }
  
  return createClient(url, anon, {
    auth: { 
      persistSession: true, 
      autoRefreshToken: true, 
      storageKey: 'fitbear.auth' 
    }
  });
};

// For direct imports - create instance
export const supabase = supabaseBrowser();