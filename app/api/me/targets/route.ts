// app/api/me/targets/route.ts
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
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
    
    const user = await requireUserFromAuthHeader(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = (await clientPromise).db(process.env.MONGODB_DB || 'fitbear');
    const doc = await db.collection('targets').findOne(
      { user_id: user.id, date }, 
      { projection: { _id: 0 } }
    );
    
    return NextResponse.json(doc || {}, { status: 200 });
  } catch (error: any) {
    console.error('Targets GET error:', error);
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

    const db = (await clientPromise).db(process.env.MONGODB_DB || 'fitbear');
    const date = body.date || new Date().toISOString().slice(0, 10);
    const now = new Date();

    // Validate and clean targets data
    const targetsData = {
      date,
      tdee_kcal: body.tdee_kcal ? Number(body.tdee_kcal) : null,
      kcal_budget: body.kcal_budget ? Number(body.kcal_budget) : null,
      protein_g: body.protein_g ? Number(body.protein_g) : null,
      carb_g: body.carb_g ? Number(body.carb_g) : null,
      fat_g: body.fat_g ? Number(body.fat_g) : null,
      fiber_g: body.fiber_g ? Number(body.fiber_g) : null,
      water_ml: body.water_ml ? Number(body.water_ml) : null,
      steps_target: body.steps_target ? Number(body.steps_target) : null,
      user_id: user.id,
      updated_at: now
    };

    await db.collection('targets').updateOne(
      { user_id: user.id, date },
      { 
        $set: targetsData, 
        $setOnInsert: { created_at: now } 
      },
      { upsert: true }
    );

    const saved = await db.collection('targets').findOne(
      { user_id: user.id, date }, 
      { projection: { _id: 0 } }
    );

    console.log('[TARGETS] upsert success', { user_id: user.id, date, hasTargets: !!saved });
    return NextResponse.json(saved, { status: 200 });
  } catch (error: any) {
    console.error('Targets PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}