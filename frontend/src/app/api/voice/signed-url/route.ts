import { NextResponse } from 'next/server';
// Explicit scripted playback; no microphone or external voice provider.
export async function GET() { return NextResponse.json({ demo: true }); }
