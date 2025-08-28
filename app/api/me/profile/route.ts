// app/api/me/profile/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';

async function requireUserFromAuthHeader(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  
  if (!token) {
    return null;
  }

  try {
    // Verify token via Supabase Auth API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables not configured');
      return null;
    }

    const url = `${supabaseUrl}/auth/v1/user`;
    const res = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${token}`, 
        apikey: supabaseAnonKey 
      }
    });

    if (res.ok) {
      const user = await res.json();
      return user;
    }
  } catch (error) {
    console.error('Token verification error:', error);
  }
  
  return null;
}

export async function GET(req: Request) {
  try {
    const user = await requireUserFromAuthHeader(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = (await clientPromise).db(process.env.MONGODB_DB || 'fitbear');
    const doc = await db.collection('profiles').findOne(
      { user_id: user.id }, 
      { projection: { _id: 0 } }
    );
    
    return NextResponse.json(doc || {}, { status: 200 });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUserFromAuthHeader(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate required fields
    if (!body.name || !body.height_cm || !body.weight_kg || !body.activity_level) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, height_cm, weight_kg, activity_level' 
      }, { status: 400 });
    }

    const db = (await clientPromise).db(process.env.MONGODB_DB || 'fitbear');
    const now = new Date();
    
    // Clean and validate the profile data
    const profileData = {
      name: String(body.name).trim(),
      gender: body.gender || null,
      height_cm: Number(body.height_cm),
      weight_kg: Number(body.weight_kg),
      waist_cm: body.waist_cm ? Number(body.waist_cm) : null,
      activity_level: String(body.activity_level),
      veg_flag: Boolean(body.veg_flag),
      jain_flag: Boolean(body.jain_flag || false),
      halal_flag: Boolean(body.halal_flag || false),
      eggetarian_flag: Boolean(body.eggetarian_flag || false),
      allergies_json: Array.isArray(body.allergies_json) ? body.allergies_json : [],
      conditions_json: Array.isArray(body.conditions_json) ? body.conditions_json : [],
      budget_level: body.budget_level || null,
      cuisines_json: Array.isArray(body.cuisines_json) ? body.cuisines_json : [],
      locale: body.locale || 'en-IN',
      user_id: user.id,
      updated_at: now
    };

    await db.collection('profiles').updateOne(
      { user_id: user.id },
      { 
        $set: profileData, 
        $setOnInsert: { created_at: now } 
      },
      { upsert: true }
    );

    const saved = await db.collection('profiles').findOne(
      { user_id: user.id }, 
      { projection: { _id: 0 } }
    );

    console.log('[PROFILE] upsert success', { user_id: user.id, hasProfile: !!saved });
    return NextResponse.json(saved, { status: 200 });
  } catch (error: any) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}