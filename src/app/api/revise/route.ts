import { NextRequest, NextResponse } from 'next/server';

/**
 * Forwards revision requests to the main generate route handler.
 * When the Python backend is unavailable, the frontend calls /api/revise
 * which is handled here as a thin proxy to the same Claude logic.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  // Rewrite as internal call to the generate route
  const internalUrl = new URL('/api/generate', req.url);
  const res = await fetch(internalUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instruction: body.instruction,
      scene: body.scene,
    }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
