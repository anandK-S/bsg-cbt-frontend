import { NextRequest } from 'next/server';
import { camelCaseResponse } from '@/utils/apiResponse';
import { supabase } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || auth.profile?.role !== 'Admin') {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    // Fetch audit logs with the associated user profile
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        profiles (
          id, name, email, role
        )
      `)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const formattedLogs = logs.map(log => ({
      _id: log.id,
      userId: log.profiles ? { _id: log.profiles.id, name: log.profiles.name, email: log.profiles.email, role: log.profiles.role } : null,
      action: log.action,
      details: log.details,
      timestamp: log.timestamp
    }));

    return camelCaseResponse(formattedLogs);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
