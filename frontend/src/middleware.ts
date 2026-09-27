import { NextResponse } from 'next/server';
// Synthetic local workshop template. No authentication is implemented.
export function middleware() { return NextResponse.next(); }
