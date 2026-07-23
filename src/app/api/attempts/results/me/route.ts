import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Stub for now
  return camelCaseResponse([]);
}
