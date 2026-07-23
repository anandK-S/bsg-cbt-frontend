import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || (auth.profile?.role !== 'Examiner' && auth.profile?.role !== 'Admin')) {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const updateData: any = {};
    
    if (formData.has('text')) updateData.text = formData.get('text');
    if (formData.has('correctOptionIndex')) updateData.correct_option_index = Number(formData.get('correctOptionIndex'));
    if (formData.has('category')) updateData.category = formData.get('category');
    if (formData.has('marks')) updateData.marks = Number(formData.get('marks'));
    if (formData.has('type')) updateData.type = formData.get('type');
    if (formData.has('textHindi')) updateData.text_hindi = formData.get('textHindi');
    
    if (formData.has('options')) updateData.options = JSON.parse(formData.get('options') as string);
    if (formData.has('optionsHindi')) updateData.options_hindi = JSON.parse(formData.get('optionsHindi') as string);
    if (formData.has('acceptableAnswers')) updateData.acceptable_answers = JSON.parse(formData.get('acceptableAnswers') as string);

    // Handle File Upload to Supabase Storage if a new file is provided
    const file = formData.get('file') as File;
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exam-media')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('exam-media').getPublicUrl(fileName);
      updateData.media_url = publicUrl;
    } else if (formData.has('mediaUrl')) {
      updateData.media_url = formData.get('mediaUrl');
    }

    const { data, error } = await supabaseAdmin
      .from('questions')
      .update(updateData)
      .eq('id', (await params).id)
      .select()
      .single();

    if (error) throw error;
    
    return camelCaseResponse(data);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || (auth.profile?.role !== 'Examiner' && auth.profile?.role !== 'Admin')) {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('questions').delete().eq('id', (await params).id);
    if (error) throw error;

    return camelCaseResponse({ message: 'Question deleted successfully' });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
