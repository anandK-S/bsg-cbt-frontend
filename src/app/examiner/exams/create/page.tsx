'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function CreateExam() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [durationUnit, setDurationUnit] = useState('min');
  const [passingMarks, setPassingMarks] = useState<number | ''>(50);
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(false);
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [scheduledEndDate, setScheduledEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/exams',
        { 
          title, 
          description, 
          durationMinutes,
          durationUnit,
          passingMarks,
          allowMultipleAttempts,
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
                <label htmlFor="durationMinutes" className="block text-sm font-bold text-gray-700 mb-1">Duration <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="durationMinutes"
                    required
                    min="1"
                    className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
                  />
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value)}
                    className="block w-32 border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-bold bg-gray-50"
                  >
                    <option value="min">Minutes</option>
                    <option value="hour">Hours</option>
                  </select>
                </div>
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

            <div className="pt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={allowMultipleAttempts}
                    onChange={(e) => setAllowMultipleAttempts(e.target.checked)}
                  />
                  <div className={`block w-14 h-7 rounded-full transition-colors duration-300 ${allowMultipleAttempts ? 'bg-bsg-blue' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${allowMultipleAttempts ? 'transform translate-x-7' : ''}`}></div>
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block group-hover:text-bsg-blue transition-colors">Allow Multiple Attempts</span>
                  <span className="text-xs font-medium text-gray-500 mt-0.5">If enabled, candidates can re-take this exam after submitting it.</span>
                </div>
              </label>
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
