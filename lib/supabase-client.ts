// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

export const supabaseBrowser = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder';
  
  return createClient(url, anon, {
    auth: { 
      persistSession: true, 
      autoRefreshToken: true, 
      storageKey: 'fitbear.auth' 
    }
  });
};

export const supabaseServer = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder';
  
  return createServerClient(url, anon, {
    cookies: {
      get() { return undefined; },
      set() { /* no-op */ },
    }
  });
};