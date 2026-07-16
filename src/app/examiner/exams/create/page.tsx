'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';

export default function CreateExam() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationHours, setDurationHours] = useState<number | ''>('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(60);
  const [durationSeconds, setDurationSeconds] = useState<number | ''>('');
  const [passingMarks, setPassingMarks] = useState<number | ''>(50);
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(false);
  const [releaseResultsInstantly, setReleaseResultsInstantly] = useState(true);
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [scheduledEndDate, setScheduledEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Duration
    const h = Number(durationHours) || 0;
    const m = Number(durationMinutes) || 0;
    const s = Number(durationSeconds) || 0;
    const totalSeconds = (h * 3600) + (m * 60) + s;
    
    if (totalSeconds <= 0) {
      alert("Please enter a valid exam duration greater than 0.");
      return;
    }

    if (scheduledStartDate && scheduledEndDate && new Date(scheduledStartDate) > new Date(scheduledEndDate)) {
      alert("Start Date cannot be after End Date.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        '\/api/exams',
        { 
          title, 
          description, 
          durationMinutes: Math.ceil(totalSeconds / 60),
          durationSeconds: totalSeconds,
          passingMarks,
          allowMultipleAttempts,
          releaseResultsInstantly,
          scheduledStartDate: scheduledStartDate || undefined,
          scheduledEndDate: scheduledEndDate || undefined
        },
        { withCredentials: true }
      );
      router.push(`/examiner/exams/${data._id}`); // Redirect to manage this exam
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">Create New Exam</h1>
        <p className="text-gray-500 font-medium text-sm sm:text-base">Set up the basic parameters for your new assessment.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="p-6 sm:p-10 space-y-8">
          
          {/* Title & Description */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">General Information</h3>
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-1">Exam Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="title"
                required
                className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Rajya Puraskar Mock Test 2026"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                id="description"
                required
                rows={3}
                className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a brief description or instructions for the candidates..."
              />
            </div>
          </div>

          {/* Timing & Scoring */}
          <div className="space-y-6 pt-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Timing & Scoring</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Duration <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="0"
                      className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium"
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-3.5 text-xs text-gray-400 font-bold uppercase">hr</span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="0"
                      className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-3.5 text-xs text-gray-400 font-bold uppercase">min</span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="0"
                      className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium"
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-3.5 text-xs text-gray-400 font-bold uppercase">sec</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 font-medium">Leave fields empty to default to 0.</p>
              </div>

              <div>
                <label htmlFor="passingMarks" className="block text-sm font-bold text-gray-700 mb-1">Passing Criteria (%) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  id="passingMarks"
                  required
                  min="1"
                  max="100"
                  className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="e.g. 50"
                />
              </div>
            </div>
          </div>

          {/* Scheduling & Access */}
          <div className="space-y-6 pt-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Scheduling & Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-bold text-gray-700 mb-1">Scheduled Start Date <span className="font-normal text-gray-400">(Optional)</span></label>
                <input
                  type="datetime-local"
                  id="startDate"
                  className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium"
                  value={scheduledStartDate}
                  onChange={(e) => setScheduledStartDate(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Candidates cannot start before this time.</p>
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-bold text-gray-700 mb-1">Scheduled End Date <span className="font-normal text-gray-400">(Optional)</span></label>
                <input
                  type="datetime-local"
                  id="endDate"
                  className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium"
                  value={scheduledEndDate}
                  onChange={(e) => setScheduledEndDate(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Candidates cannot start after this time.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-bsg-blue focus:ring-bsg-blue rounded border-gray-300"
                    checked={allowMultipleAttempts}
                    onChange={(e) => setAllowMultipleAttempts(e.target.checked)}
                  />
                  <span className="text-sm font-bold text-gray-700">Allow Multiple Attempts<span className="block text-xs font-normal text-gray-500 mt-0.5">If enabled, candidates can take this exam more than once.</span></span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-bsg-blue focus:ring-bsg-blue rounded border-gray-300"
                    checked={releaseResultsInstantly}
                    onChange={(e) => setReleaseResultsInstantly(e.target.checked)}
                  />
                  <span className="text-sm font-bold text-gray-700">Release Results Instantly<span className="block text-xs font-normal text-gray-500 mt-0.5">If disabled, candidates will not see their scores until you release them.</span></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 sm:px-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white py-2.5 px-6 border border-gray-300 rounded-xl shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-bsg-blue hover:bg-bsg-blue-dark border border-transparent rounded-xl shadow-md py-2.5 px-8 text-sm font-bold text-white transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bsg-blue disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Creating...
              </>
            ) : 'Create Exam & Continue \u2192'}
          </button>
        </div>
      </form>
    </div>
  );
}
