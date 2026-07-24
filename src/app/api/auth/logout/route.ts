import { NextRequest } from 'next/server';
import { camelCaseResponse } from '@/utils/apiResponse';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (auth) {
      await supabaseAdmin.from('profiles').update({ last_logout: new Date().toISOString() }).eq('id', auth.id);
    }
    return camelCaseResponse({ message: 'Logged out successfully' });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
