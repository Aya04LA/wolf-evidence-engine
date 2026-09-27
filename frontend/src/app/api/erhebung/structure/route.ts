import { NextResponse } from 'next/server';
// The UI uses its deterministic local keyword parser in demo mode.
export async function POST() {
  return NextResponse.json({ demo: true, mode: 'keyword-parser' }, { status: 503 });
}
