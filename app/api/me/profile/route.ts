// app/api/me/profile/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import clientPromise from '../../../../lib/mongodb';

export async function GET(req: Request) {
  try {
    const user = await requireUser(req as any);
    const db = (await clientPromise).db(process.env.MONGODB_DB);
    const doc = await db.collection('profiles').findOne(
      { user_id: user.user.id }, 
      { projection: { _id: 0 } }
    );
    return NextResponse.json(doc ?? {}, { status: 200 });
  } catch (error: any) {
    if (error.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser(req as any);
    let body: any;
    
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    const db = (await clientPromise).db(process.env.MONGODB_DB);
    const now = new Date();
    const update = { 
      ...body, 
      user_id: user.user.id, 
      updated_at: now 
    };
    
    await db.collection('profiles').updateOne(
      { user_id: user.user.id },
      { 
        $set: update, 
        $setOnInsert: { created_at: now } 
      },
      { upsert: true }
    );
    
    const saved = await db.collection('profiles').findOne(
      { user_id: user.user.id }, 
      { projection: { _id: 0 } }
    );
    
    return NextResponse.json(saved, { status: 200 });
  } catch (error: any) {
    if (error.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}