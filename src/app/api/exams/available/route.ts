import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });

    const now = new Date().toISOString();

    const { data: allExams, error } = await supabaseAdmin
      .from('exams')
      .select('*, creator_id(name)');

    if (error) throw error;

    const currentTime = new Date().getTime();
    
    // Manually filter exams based on status and scheduled dates to bypass RLS for candidates
    const exams = allExams.filter((exam: any) => {
      if (exam.status === 'Published') return true;
      if (exam.status === 'Draft' && exam.scheduled_start_date) {
        const startDate = new Date(exam.scheduled_start_date).getTime();
        const endDate = exam.scheduled_end_date ? new Date(exam.scheduled_end_date).getTime() : Infinity;
        if (currentTime >= startDate && currentTime <= endDate) {
          return true;
        }
      }
      return false;
    });

    // Fetch question counts and marks
    const { data: qData } = await supabaseAdmin.from('questions').select('exam_id, marks');
    const countsMap: Record<string, number> = {};
    const marksMap: Record<string, number> = {};
    if (qData) {
      qData.forEach((q: any) => {
        countsMap[q.exam_id] = (countsMap[q.exam_id] || 0) + 1;
        marksMap[q.exam_id] = (marksMap[q.exam_id] || 0) + (q.marks || 1);
      });
    }

    const formattedExams = exams.map(exam => {
      const maxScore = marksMap[exam.id] || 0;
      return {
        _id: exam.id,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.duration_minutes,
        durationSeconds: exam.duration_seconds,
        status: exam.status,
        questionCount: countsMap[exam.id] || 0,
        maxScore,
        creatorName: exam.creator_id ? (exam.creator_id as any).name : 'Unknown',
        scheduledStartDate: exam.scheduled_start_date,
        scheduledEndDate: exam.scheduled_end_date,
        createdAt: exam.created_at,
        category: exam.category,
      };
    });

    return camelCaseResponse(formattedExams);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
