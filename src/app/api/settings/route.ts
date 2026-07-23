import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET() {
  try {
    const { data, error } = await supabase.from('settings').select('*').limit(1).single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore no rows error
    
    return camelCaseResponse(data || {
      platformName: "BSG CBT",
      maintenanceMode: false,
      termsUrl: "",
      supportEmail: "support@bsg-india.org"
    });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || auth.profile?.role !== 'Admin') {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    
    // Check if settings row exists
    const { data: existing } = await supabaseAdmin.from('settings').select('id').limit(1).single();

    let error;
    if (existing) {
      const res = await supabaseAdmin.from('settings').update({
        platform_name: body.platformName,
        support_email: body.supportEmail,
        maintenance_mode: body.maintenanceMode,
        max_failed_login_attempts: body.maxFailedLoginAttempts
      }).eq('id', existing.id);
      error = res.error;
    } else {
      const res = await supabaseAdmin.from('settings').insert({
        id: 1,
        platform_name: body.platformName,
        support_email: body.supportEmail,
        maintenance_mode: body.maintenanceMode,
        max_failed_login_attempts: body.maxFailedLoginAttempts
      });
      error = res.error;
    }

    if (error) throw error;

    await supabaseAdmin.from('audit_logs').insert({
      user_id: auth.id,
      action: `SETTINGS_UPDATED`,
      details: `Admin ${auth.email} updated global settings`
    });

    const { data: updatedSettings } = await supabaseAdmin.from('settings').select('*').limit(1).single();

    return camelCaseResponse(updatedSettings);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
