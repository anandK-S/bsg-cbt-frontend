import { NextRequest } from 'next/server';
import { camelCaseResponse } from '@/utils/apiResponse';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || auth.profile?.role !== 'Admin') {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, rank, bsgId } = body;

    if (!email || !password || !name) {
      return camelCaseResponse({ message: 'Name, email, and password are required' }, { status: 400 });
    }

    // 1. Create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: 'Examiner'
      }
    });

    if (authError) throw authError;

    // 2. The database trigger automatically creates the profile. Update it with rank and bsgId.
    const profileUpdate: any = { role: 'Examiner' };
    if (rank) profileUpdate.rank = rank;
    if (bsgId) profileUpdate.bsg_id = bsgId;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', authData.user.id);

    if (profileError) {
       // Cleanup if profile update fails (though trigger usually handles the row creation)
       await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
       throw profileError;
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: auth.id,
      action: `EXAMINER_CREATED`,
      details: `Admin ${auth.email} created Examiner ${email}`
    });

    return camelCaseResponse({ message: 'Examiner created successfully.' });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
