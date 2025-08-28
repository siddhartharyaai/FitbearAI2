// app/api/me/targets/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import clientPromise from '../../../../lib/mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const user = await requireUser(req as any);
    const db = (await clientPromise).db(process.env.MONGODB_DB);
    const doc = await db.collection('targets').findOne(
      { user_id: user.user.id, date }, 
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
    const body = await req.json();
    const db = (await clientPromise).db(process.env.MONGODB_DB);
    const date = body.date || new Date().toISOString().slice(0, 10);
    const now = new Date();
    
    await db.collection('targets').updateOne(
      { user_id: user.user.id, date },
      { 
        $set: { 
          ...body, 
          user_id: user.user.id, 
          date, 
          updated_at: now 
        }, 
        $setOnInsert: { created_at: now } 
      },
      { upsert: true }
    );
    
    const saved = await db.collection('targets').findOne(
      { user_id: user.user.id, date }, 
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