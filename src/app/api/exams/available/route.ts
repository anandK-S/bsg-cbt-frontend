import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const now = new Date().toISOString();

    const { data: exams, error } = await supabase
      .from('exams')
      .select('*, creator_id(name)')
      .or(`status.eq.Published,and(scheduled_start_date.lte.${now},scheduled_end_date.gte.${now})`);

    if (error) throw error;

    // Fetch question counts
    const { data: qCounts } = await supabase.from('questions').select('exam_id');
    const countsMap: Record<string, number> = {};
    if (qCounts) {
      qCounts.forEach((q: any) => {
        countsMap[q.exam_id] = (countsMap[q.exam_id] || 0) + 1;
      });
    }

    const formattedExams = exams.map(exam => {
      // Mock score logic since questions might not be fetched here easily without a join
      const maxScore = countsMap[exam.id] ? countsMap[exam.id] * 2 : 50; // simple mock
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

    return NextResponse.json(formattedExams);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
