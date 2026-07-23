import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || auth.profile?.role !== 'Admin') {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const { data: users, error } = await supabase.from('profiles').select('*');

    if (error) throw error;

    // Map `id` to `_id` for frontend compatibility
    const formattedUsers = users.map(u => ({ ...u, _id: u.id, bsgId: u.bsg_id }));

    return camelCaseResponse(formattedUsers);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
