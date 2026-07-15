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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-bsg-blue mb-6">Create New Exam</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Exam Title</label>
          <input
            type="text"
            id="title"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-bsg-blue focus:border-bsg-blue sm:text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Rajya Puraskar Mock Test 2026"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-bsg-blue focus:border-bsg-blue sm:text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the exam..."
          />
        </div>

        <div>
          <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700">Duration</label>
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              id="durationMinutes"
              required
              min="1"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-bsg-blue focus:border-bsg-blue sm:text-sm"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
            />
            <select
              value={durationUnit}
              onChange={(e) => setDurationUnit(e.target.value)}
              className="block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-bsg-blue focus:border-bsg-blue sm:text-sm"
            >
              <option value="sec">Seconds</option>
              <option value="min">Minutes</option>
              <option value="hour">Hours</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="passingMarks" className="block text-sm font-medium text-gray-700">Passing Marks (%)</label>
          <input
            type="number"
            id="passingMarks"
            required
            min="1"
            max="100"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-bsg-blue focus:border-bsg-blue sm:text-sm"
            value={passingMarks}
            onChange={(e) => setPassingMarks(e.target.value === '' ? '' : parseInt(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Scheduled Start Date (Optional)</label>
            <input
              type="datetime-local"
              id="startDate"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-bsg-blue focus:border-bsg-blue sm:text-sm"
              value={scheduledStartDate}
              onChange={(e) => setScheduledStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Scheduled End Date (Optional)</label>
            <input
              type="datetime-local"
              id="endDate"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-bsg-blue focus:border-bsg-blue sm:text-sm"
              value={scheduledEndDate}
            />
          </div>
        </div>

        <div className="md:col-span-2 pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={allowMultipleAttempts}
                        onChange={(e) => setAllowMultipleAttempts(e.target.checked)}
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${allowMultipleAttempts ? 'bg-bsg-blue' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${allowMultipleAttempts ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-700 block group-hover:text-bsg-blue transition-colors">Allow Multiple Attempts</span>
                      <span className="text-xs text-gray-500">If enabled, candidates can take this exam more than once.</span>
                    </div>
                  </label>
                </div>

                <div className="md:col-span-2 pt-4 flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-bsg-blue border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-bsg-blue-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bsg-blue"
          >
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  );
}
