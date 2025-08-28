import { NextResponse } from 'next/server';
import { assertNoMock } from '@/lib/mode';

export async function GET(req) {
  return NextResponse.json({ 
    message: "API endpoints active - use dedicated routes", 
    version: "2.0",
    endpoints: [
      "/api/health/app",
      "/api/whoami", 
      "/api/menu/scan",
      "/api/food/analyze",
      "/api/coach/ask",
      "/api/tts",
      "/api/stt"
    ]
  });
}

export async function POST(req) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // All endpoints moved to dedicated routes - no fallbacks
    assertNoMock("Legacy API route - use dedicated endpoints");
    
    if (pathname.includes('/menu/scan') || pathname.includes('/food/analyze')) {
      return NextResponse.json({ 
        error: "This endpoint has been moved. Use /api/menu/scan or /api/food/analyze with FormData image upload.",
        redirect: pathname.includes('/menu/scan') ? "/api/menu/scan" : "/api/food/analyze"
      }, { status: 400 });
    }

    if (pathname.includes('/coach/ask')) {
      return NextResponse.json({ 
        error: "This endpoint has been moved. Use /api/coach/ask with authenticated request.",
        redirect: "/api/coach/ask"
      }, { status: 400 });
    }

    // Profile endpoints moved to separate handlers
    if (pathname.includes('/me/profile') || pathname.includes('/me/targets')) {
      return NextResponse.json({ 
        error: "Profile endpoints require authentication and have been moved to dedicated handlers"
      }, { status: 401 });
    }

    return NextResponse.json({ 
      error: "Endpoint not found. Use dedicated API routes listed in GET /api/"
    }, { status: 404 });

  } catch (error) {
    if (error.message.includes('Mock path blocked')) {
      return NextResponse.json({ 
        error: "Mock/demo data blocked in production mode - use dedicated API routes"
      }, { status: 400 });
    }
    
    console.error('Legacy API Error:', error);
    return NextResponse.json({ 
      error: "Use dedicated API endpoints"
    }, { status: 500 });
  }
}

export async function PUT(req) {
  return POST(req);
}

export async function DELETE(req) {
  return POST(req);
}