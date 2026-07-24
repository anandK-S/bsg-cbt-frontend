import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

// GET /api/exams
export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });
    }
    let query = supabaseAdmin.from('exams').select('*, profiles(name)');
    if (auth.profile?.role === 'Examiner') {
      query = query.eq('creator_id', auth.id);
    }

    const { data: exams, error } = await query;

    if (error) throw error;

    // Fetch question counts
    const { data: qCounts } = await supabaseAdmin.from('questions').select('exam_id');
    const countsMap: Record<string, number> = {};
    if (qCounts) {
      qCounts.forEach((q: any) => {
        countsMap[q.exam_id] = (countsMap[q.exam_id] || 0) + 1;
      });
    }

    // Fetch attempt counts (completed results)
    const { data: attemptCountsData } = await supabaseAdmin.from('results').select('exam_id');
    const attemptCountsMap: Record<string, number> = {};
    if (attemptCountsData) {
      attemptCountsData.forEach((a: any) => {
        attemptCountsMap[a.exam_id] = (attemptCountsMap[a.exam_id] || 0) + 1;
      });
    }

    // Map Supabase 'id' to MongoDB '_id' and 'creator_id' to 'creatorId' for frontend compatibility
    const formattedExams = exams.map((exam) => ({
      ...exam,
      _id: exam.id,
      creatorId: exam.profiles ? { _id: exam.creator_id, name: exam.profiles.name } : exam.creator_id,
      durationMinutes: exam.duration_minutes,
      durationSeconds: exam.duration_seconds,
      questionCount: countsMap[exam.id] || 0,
      attemptCount: attemptCountsMap[exam.id] || 0,
      createdAt: exam.created_at,
    }));

    return camelCaseResponse(formattedExams);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/exams
export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || (auth.profile?.role !== 'Examiner' && auth.profile?.role !== 'Admin')) {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      title, description, category, durationMinutes, durationSeconds, durationUnit, 
      passingMarks, passingCriteriaType, scheduledStartDate, scheduledEndDate, 
      allowMultipleAttempts, releaseResultsInstantly, issueCertificate, testKey 
    } = body;

    const { data, error } = await supabaseAdmin.from('exams').insert([
      {
        title,
        description,
        category,
        duration_minutes: durationMinutes || 0,
        duration_seconds: durationSeconds || 0,
        duration_unit: durationUnit || 'min',
        passing_marks: passingMarks || 50,
        passing_criteria_type: passingCriteriaType || 'percentage',
        scheduled_start_date: scheduledStartDate,
        scheduled_end_date: scheduledEndDate,
        allow_multiple_attempts: allowMultipleAttempts || false,
        release_results_instantly: releaseResultsInstantly || false,
        issue_certificate: issueCertificate || false,
        test_key: testKey,
        creator_id: auth.id,
      }
    ]).select().single();

    if (error) throw error;
    const formattedExam = {
      ...data,
      _id: data.id,
      creatorId: data.creator_id,
    };

    return camelCaseResponse(formattedExam, { status: 201 });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
