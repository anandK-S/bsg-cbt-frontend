import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';

export async function POST(req: Request) {
  try {
    const { email, bsgId, registerType } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check email
    const { data: existingEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'User already registered' }, { status: 409 });
    }

    // Check BSG ID for candidates
    if (registerType === 'Candidate' && bsgId) {
      const { data: existingBsgId } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('bsg_id', bsgId)
        .single();

      if (existingBsgId) {
        return NextResponse.json({ error: 'BSG ID already registered' }, { status: 409 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
