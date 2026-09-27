import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ demo: true, error: 'Demo without sign-in. Open /dashboard.' }, { status: 403 });
}
