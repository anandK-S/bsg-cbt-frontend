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
    const { name, email, bsgId, section, district, role, status } = body;

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        name,
        bsg_id: bsgId,
        section,
        district,
        role,
        status
      })
      .eq('id', params.id);

    if (profileError) throw profileError;

    // Update Auth Email if changed
    if (email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(params.id, { email });
      if (authError) throw authError;
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: auth.id,
      action: `USER_UPDATED`,
      details: `Admin ${auth.email} updated user ${params.id}`
    });

    // Fetch updated user to return
    const { data: user } = await supabaseAdmin.from('profiles').select('*').eq('id', params.id).single();

    return camelCaseResponse({ message: 'User updated successfully', user: { ...user, _id: user.id, bsgId: user.bsg_id } });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
