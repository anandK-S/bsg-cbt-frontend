import { camelCaseResponse } from '@/utils/apiResponse';
import { NextResponse } from 'next/server';

export async function GET() {
  return camelCaseResponse({
    platformName: "BSG CBT",
    maintenanceMode: false,
    termsUrl: "",
    supportEmail: "support@bsg.org"
  });
}

export async function PUT() {
  return camelCaseResponse({ message: "Settings updated (mocked)" });
}
