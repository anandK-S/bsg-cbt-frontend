'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function CreateExam() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/exams',
        { title, description, durationMinutes },
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
          <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700">Duration (Minutes)</label>
          <input
            type="number"
            id="durationMinutes"
            required
            min="1"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-bsg-blue focus:border-bsg-blue sm:text-sm"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
          />
        </div>

        <div className="flex justify-end">
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
