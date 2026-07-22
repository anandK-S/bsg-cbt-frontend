import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    platformName: "BSG CBT",
    maintenanceMode: false,
    termsUrl: "",
    supportEmail: "support@bsg.org"
  });
}

export async function PUT() {
  return NextResponse.json({ message: "Settings updated (mocked)" });
}
