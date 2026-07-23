import { NextRequest } from 'next/server';
import { camelCaseResponse } from '@/utils/apiResponse';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || auth.profile?.role !== 'Admin') {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { adminPassword } = body;

    if (!adminPassword) {
      return camelCaseResponse({ message: 'Admin password is required to delete users.' }, { status: 400 });
    }

    // Verify admin's password by attempting to sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: auth.email!,
      password: adminPassword,
    });

    if (signInError) {
      return camelCaseResponse({ message: 'Invalid admin password.' }, { status: 401 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(params.id);

    if (error) throw error;

    await supabaseAdmin.from('audit_logs').insert({
      user_id: auth.id,
      action: `USER_DELETED`,
      details: `Admin ${auth.email} deleted user ${params.id}`
    });

    return camelCaseResponse({ message: 'User deleted successfully.' });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
