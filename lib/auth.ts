// lib/auth.ts
import { NextRequest } from 'next/server';

export async function requireUser(req: NextRequest) {
  // 1) Try bearer token
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length);
    // Verify token via Supabase Auth API
    const url = `${process.env.SUPABASE_URL}/auth/v1/user`;
    const res = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${token}`, 
        apikey: process.env.SUPABASE_ANON_KEY! 
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