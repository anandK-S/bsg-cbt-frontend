import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');

    let query = supabase
      .from('results')
      .select('*, profiles(name, section, district, profile_image, unit_name), exams(title)')
      .order('score', { ascending: false })
      .order('time_taken_seconds', { ascending: true })
      .limit(100);

    if (examId) {
      query = query.eq('exam_id', examId);
    }

    const { data: results, error } = await query;

    if (error) throw error;

    const formattedLeaderboard = results.map(r => ({
      _id: r.id,
      candidate: {
        _id: r.candidate_id,
        name: (r.profiles as any)?.name || 'Unknown',
        section: (r.profiles as any)?.section,
        district: (r.profiles as any)?.district,
        profileImage: (r.profiles as any)?.profile_image,
        unitName: (r.profiles as any)?.unit_name,
      },
      exam: {
        _id: r.exam_id,
        title: (r.exams as any)?.title || 'Exam',
      },
      score: r.score,
      totalMarks: r.total_marks,
      timeTaken: r.time_taken_seconds,
    }));

    return camelCaseResponse(formattedLeaderboard);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
