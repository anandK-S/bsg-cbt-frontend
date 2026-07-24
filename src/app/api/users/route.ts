import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || auth.profile?.role !== 'Admin') {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const { data: users, error } = await supabaseAdmin.from('profiles').select('*');

    if (error) throw error;

    // Map `id` to `_id` for frontend compatibility
    const formattedUsers = users.map((u: any) => ({ 
      ...u, 
      _id: u.id, 
      bsgId: u.bsg_id,
      lastLogin: u.last_login,
      lastLogout: u.last_logout,
      lockedUntil: u.locked_until,
      failedLoginAttempts: u.failed_login_attempts
    }));

    return camelCaseResponse(formattedUsers);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
