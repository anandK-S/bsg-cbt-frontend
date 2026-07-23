import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });

    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', (await params).id);

    if (error) throw error;
    return camelCaseResponse(questions);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || (auth.profile?.role !== 'Examiner' && auth.profile?.role !== 'Admin')) {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const text = formData.get('text') as string;
    const correctOptionIndex = formData.get('correctOptionIndex');
    const category = formData.get('category') as string;
    const marks = formData.get('marks');
    const type = formData.get('type') as string || 'SingleChoice';
    const textHindi = formData.get('textHindi') as string;
    
    // Parse JSON strings
    const optionsRaw = formData.get('options') as string;
    const options = optionsRaw ? JSON.parse(optionsRaw) : [];
    
    const optionsHindiRaw = formData.get('optionsHindi') as string;
    const optionsHindi = optionsHindiRaw ? JSON.parse(optionsHindiRaw) : [];

    const acceptableAnswersRaw = formData.get('acceptableAnswers') as string;
    const acceptableAnswers = acceptableAnswersRaw ? JSON.parse(acceptableAnswersRaw) : [];

    // Handle File Upload to Supabase Storage
    const file = formData.get('file') as File;
    let mediaUrl = formData.get('mediaUrl') as string;

    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exam-media')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('exam-media').getPublicUrl(fileName);
      mediaUrl = publicUrl;
    }

    const { data: question, error } = await supabaseAdmin.from('questions').insert([
      {
        exam_id: (await params).id,
        text,
        options,
        correct_option_index: correctOptionIndex !== null ? Number(correctOptionIndex) : null,
        acceptable_answers: acceptableAnswers,
        type,
        marks: marks ? Number(marks) : 1,
        category,
        media_url: mediaUrl,
        text_hindi: textHindi,
        options_hindi: optionsHindi,
      }
    ]).select().single();

    if (error) throw error;
    
    return camelCaseResponse(question, { status: 201 });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
