import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: "AI import is temporarily disabled during migration" }, { status: 400 });
}
