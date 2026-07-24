import { NextRequest } from 'next/server';
import { camelCaseResponse } from '@/utils/apiResponse';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || auth.profile?.role !== 'Admin') {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    // Fetch audit logs
    const { data: logs, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Fetch profiles for the users in the logs
    const userIds = [...new Set(logs.map(log => log.user_id))].filter(Boolean);
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role')
      .in('id', userIds);

    const profileMap = (profiles || []).reduce((acc: any, profile: any) => {
      acc[profile.id] = profile;
      return acc;
    }, {});

    const formattedLogs = logs.map(log => ({
      _id: log.id,
      userId: profileMap[log.user_id] ? { _id: profileMap[log.user_id].id, name: profileMap[log.user_id].name, email: profileMap[log.user_id].email, role: profileMap[log.user_id].role } : null,
      action: log.action,
      details: log.details,
      timestamp: log.timestamp
    }));

    return camelCaseResponse(formattedLogs);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
