import { NextRequest } from 'next/server';
import { camelCaseResponse } from '@/utils/apiResponse';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getUserFromRequest(req);
    if (!auth || auth.profile?.role !== 'Admin') {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { newPassword } = body;

    // We removed the minimum 6 chars check as requested by the user
    if (!newPassword) {
      return camelCaseResponse({ message: 'Password is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: newPassword });

    if (error) throw error;

    await supabaseAdmin.from('audit_logs').insert({
      user_id: auth.id,
      action: `USER_PASSWORD_RESET`,
      details: `Admin ${auth.email} reset password for user ${id}`
    });

    return camelCaseResponse({ message: 'Password reset successfully' });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
