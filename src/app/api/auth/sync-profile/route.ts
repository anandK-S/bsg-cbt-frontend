import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, role, bsgId, section, district, unitNumber, unitName, rank } = body;

    if (!id || !email) {
      return NextResponse.json({ error: 'User ID and Email are required' }, { status: 400 });
    }

    const profileData: any = {
      id,
      name,
      role: role || 'Candidate',
    };

    if (role === 'Candidate') {
      if (bsgId) profileData.bsg_id = bsgId;
      if (section) profileData.section = section;
      if (district) profileData.district = district;
      if (unitNumber) profileData.unit_number = unitNumber;
      if (unitName) profileData.unit_name = unitName;
    } else if (role === 'Examiner') {
      if (rank) profileData.rank = rank;
    }

    // Force create or update the profile using service role (bypasses RLS)
    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (upsertError) {
      console.error("Profile sync error:", upsertError);
      return NextResponse.json({ error: 'Failed to sync profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sync Profile API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
