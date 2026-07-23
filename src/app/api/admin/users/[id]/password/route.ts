import { NextRequest } from 'next/server';
import { camelCaseResponse } from '@/utils/apiResponse';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || auth.profile?.role !== 'Admin') {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return camelCaseResponse({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(params.id, { password: newPassword });

    if (error) throw error;

    await supabaseAdmin.from('audit_logs').insert({
      user_id: auth.id,
      action: `USER_PASSWORD_RESET`,
      details: `Admin ${auth.email} reset password for user ${params.id}`
    });

    return camelCaseResponse({ message: 'Password reset successfully' });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
