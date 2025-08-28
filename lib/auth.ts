// lib/auth.ts
import { NextRequest } from 'next/server';

export async function requireUser(req: NextRequest) {
  // 1) Try bearer token
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length);
    
    // Check if Supabase environment variables are available
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not configured');
      throw Object.assign(new Error('Authentication service not configured'), { status: 500 });
    }
    
    // Verify token via Supabase Auth API
    const url = `${supabaseUrl}/auth/v1/user`;
    const res = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${token}`, 
        apikey: supabaseAnonKey 
      }
    });
    if (res.ok) {
      const user = await res.json();
      return { user };
    }
  }
  
  // 2) If you already had SSR cookie flow, keep it as a fallback (optional).
  throw Object.assign(new Error('Unauthorized'), { status: 401 });
}