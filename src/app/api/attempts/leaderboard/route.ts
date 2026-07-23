import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');

    let query = supabase
      .from('results')
      .select('*, profiles(name, section, district, profile_image, unit_name, bsg_id)')
      .is('violation_reason', null);

    if (examId) {
      query = query.eq('exam_id', examId);
    }

    const { data: results, error } = await query;

    if (error) throw error;

    // Aggregate by candidate
    const candidateMap = new Map<string, any>();

    results.forEach(r => {
      const candidateId = r.candidate_id;
      if (!candidateMap.has(candidateId)) {
        candidateMap.set(candidateId, {
          _id: candidateId,
          name: (r.profiles as any)?.name || 'Unknown',
          bsgId: (r.profiles as any)?.bsg_id || '',
          section: (r.profiles as any)?.section || '',
          district: (r.profiles as any)?.district || '',
          totalScore: 0,
          totalMarksPossible: 0,
          examsTaken: 0,
          timeTaken: 0,
        });
      }
      
      const candidate = candidateMap.get(candidateId);
      candidate.totalScore += r.score;
      candidate.totalMarksPossible += r.total_marks;
      candidate.examsTaken += 1;
      candidate.timeTaken += r.time_taken_seconds || 0;
    });

    const aggregatedLeaderboard = Array.from(candidateMap.values())
      .map(candidate => ({
        ...candidate,
        percentage: candidate.totalMarksPossible > 0 ? ((candidate.totalScore / candidate.totalMarksPossible) * 100).toFixed(1) : '0.0',
      }))
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return a.timeTaken - b.timeTaken;
      })
      .slice(0, 100);

    return camelCaseResponse(aggregatedLeaderboard);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
