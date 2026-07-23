import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: exam, error } = await supabaseAdmin
      .from('exams')
      .select('*, creator:profiles!exams_creator_id_fkey(id, name)')
      .eq('id', id)
      .single();

    if (error || !exam) {
      return camelCaseResponse({ message: 'Exam not found', error: error?.message || 'No exam returned' }, { status: 404 });
    }

    if (auth.profile?.role === 'Examiner' && exam.creator_id !== auth.id) {
      return camelCaseResponse({ message: 'Not authorized' }, { status: 403 });
    }

    // Fetch questions manually if needed
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('exam_id', id);

    const formattedQuestions = (questions || []).map(q => ({
      questionId: {
        ...q,
        _id: q.id,
        correctOptionIndex: q.correct_option_index,
        acceptableAnswers: q.acceptable_answers,
        mediaUrl: q.media_url,
        textHindi: q.text_hindi,
        optionsHindi: q.options_hindi
      },
      marks: q.marks || 1
    }));

    return camelCaseResponse({ 
      ...exam, 
      _id: exam.id, 
      creatorId: exam.creator_id,
      creatorName: exam.creator ? exam.creator.name : 'Unknown',
      durationMinutes: exam.duration_minutes,
      durationSeconds: exam.duration_seconds,
      questions: formattedQuestions 
    });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || (auth.profile?.role !== 'Examiner' && auth.profile?.role !== 'Admin')) {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};
    
    // Map camelCase to snake_case for Supabase
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.durationMinutes !== undefined) updateData.duration_minutes = body.durationMinutes;
    if (body.durationSeconds !== undefined) updateData.duration_seconds = body.durationSeconds;
    if (body.passingMarks !== undefined) updateData.passing_marks = body.passingMarks;
    if (body.passingCriteriaType !== undefined) updateData.passing_criteria_type = body.passingCriteriaType;
    if (body.allowMultipleAttempts !== undefined) updateData.allow_multiple_attempts = body.allowMultipleAttempts;
    if (body.releaseResultsInstantly !== undefined) updateData.release_results_instantly = body.releaseResultsInstantly;
    if (body.issueCertificate !== undefined) updateData.issue_certificate = body.issueCertificate;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.testKey !== undefined) updateData.test_key = body.testKey;

    const { data, error } = await supabase
      .from('exams')
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

    const { error } = await supabase.from('exams').delete().eq('id', (await params).id);
    if (error) throw error;

    return camelCaseResponse({ message: 'Exam deleted successfully' });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
