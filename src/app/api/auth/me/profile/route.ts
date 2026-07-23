import { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { camelCaseResponse } from '@/utils/apiResponse';
import { getUserFromRequest } from '@/utils/authServer';

export async function PUT(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, profileImage, password, bsgId, section, district, unitName, unitNumber } = await req.json();

    const updateData: any = {
      name,
      profile_image: profileImage,
      bsg_id: bsgId,
      section: section,
      district: district,
      unit_name: unitName,
      unit_number: unitNumber
    };

    // Update profile in profiles table
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', auth.id)
      .select('*')
      .single();

    if (profileError) throw profileError;

    // If password is provided, update auth user password
    if (password) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        auth.id,
        { password }
      );
      if (passwordError) throw passwordError;
    }

    // Map to frontend expected format
    const userData = {
      _id: updatedProfile.id,
      name: updatedProfile.name,
      email: auth.email,
      role: updatedProfile.role,
      bsgId: updatedProfile.bsg_id,
      district: updatedProfile.district,
      unitNumber: updatedProfile.unit_number,
      unitName: updatedProfile.unit_name,
      profileImage: updatedProfile.profile_image
    };

    return camelCaseResponse(userData);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return camelCaseResponse({ message: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
