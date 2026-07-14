'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface ExamDetailsData {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: string;
  category?: string;
  questions: any[];
}

interface ResultData {
  _id: string;
  totalMarks: number;
  score: number;
  createdAt: string;
  candidateId?: {
    name: string;
    bsgId: string;
  };
}

export default function ExamDetails() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<ExamDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'questions' | 'results'>('questions');
  const [results, setResults] = useState<ResultData[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  
  // AI Import State
  const [showAiModal, setShowAiModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [aiError, setAiError] = useState('');

  // Manual Question State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualQuestion, setManualQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    category: '',
    marks: 1
  });
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [manualError, setManualError] = useState('');

  const fetchExam = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/exams/${examId}?t=${new Date().getTime()}`, {
        withCredentials: true,
      });
      setExam(data);
    } catch (error) {
      console.error('Error fetching exam:', error);
      router.push('/examiner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchExam();
  }, [isAuthenticated, user, router, examId]);

  useEffect(() => {
    if (activeTab === 'results') {
      const fetchResults = async () => {
        setLoadingResults(true);
        try {
          const { data } = await axios.get(`http://localhost:5000/api/attempts/${examId}/result`, {
            withCredentials: true,
          });
          setResults(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Error fetching results:", error);
        } finally {
          setLoadingResults(false);
        }
      };
      fetchResults();
    }
  }, [activeTab, examId]);

  const handleAiImport = async () => {
    if (!importFile) {
      setAiError('Please select a file to import (.txt, .pdf, .docx).');
      return;
    }
    
    setIsImporting(true);
    setAiError('');
    
    const formData = new FormData();
    formData.append('file', importFile);
    
    try {
      await axios.post(
        `http://localhost:5000/api/exams/${examId}/questions/import`,
        formData,
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      setShowAiModal(false);
      setImportFile(null);
      fetchExam(); // Refresh questions
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setAiError(err.response?.data?.message || 'Failed to import questions. Ensure Gemini API key is valid.');
      } else {
        setAiError('Failed to import questions.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleManualSave = async () => {
    if (!manualQuestion.text.trim()) return setManualError('Question text is required');
    if (manualQuestion.options.some(opt => !opt.trim())) return setManualError('All 4 options are required');
    // Removed category requirement as it's optional in the DB

    setIsSavingManual(true);
    setManualError('');

    try {
      await axios.post(
        `http://localhost:5000/api/exams/${examId}/questions`,
        manualQuestion,
        { withCredentials: true }
      );
      setShowManualModal(false);
      setManualQuestion({
        text: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        category: '',
        marks: 1
      });
      fetchExam();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setManualError(err.response?.data?.message || err.message || 'Failed to add question');
      } else {
        setManualError('Failed to add question');
      }
    } finally {
      setIsSavingManual(false);
    }
  };

  const handlePublish = async () => {
    try {
      await axios.put(`http://localhost:5000/api/exams/${examId}/status`, { status: 'Published' }, { withCredentials: true });
      fetchExam();
    } catch (err) {
      console.error("Publish Error:", err);
      alert("Failed to publish exam");
    }
  };

  if (loading) return <div className="p-8 text-center text-bsg-blue font-semibold">Loading Exam Details...</div>;
  if (!exam) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <Link href={user?.role === 'Admin' ? '/admin' : '/examiner/dashboard'} className="text-bsg-blue hover:text-bsg-blue-light font-semibold mb-6 inline-block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900">{exam.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-bsg-blue text-white text-xs font-bold uppercase tracking-wide">
              {exam.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 text-xs font-bold uppercase tracking-wide">
              {exam.durationMinutes} Minutes
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${exam.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {exam.status}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {exam.status === 'Draft' && (
            <button 
              onClick={handlePublish}
              className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg shadow-sm hover:bg-green-500 transition-colors"
            >
              🚀 Publish Exam
            </button>
          )}
          <button 
            onClick={() => setShowAiModal(true)}
            className="bg-bsg-gold text-bsg-blue-dark font-bold px-6 py-2 rounded-lg shadow-sm hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">✨</span> AI Import Questions
          </button>
          <button 
            onClick={() => setShowManualModal(true)}
            className="bg-bsg-blue text-white font-bold px-6 py-2 rounded-lg shadow-sm hover:bg-bsg-blue-light transition-colors"
          >
            + Manual Question
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('questions')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'questions' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Manage Questions
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'results' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Candidate Results & Analytics
        </button>
      </div>

      {activeTab === 'questions' ? (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Questions ({exam.questions.length})</h3>
        </div>
        
        {exam.questions.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-lg font-medium">No questions added yet.</p>
            <p className="text-sm mt-1">Use the AI Import button to instantly generate questions from a syllabus or past paper!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {exam.questions.map((q: any, idx: number) => {
              const qData = q.questionId;
              if (!qData) return null; // Prevent crash if a question was deleted from the DB but still referenced
              
              return (
                <li key={qData._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <span className="bg-gray-200 text-gray-700 font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0 mt-1">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-lg font-semibold text-gray-900 leading-snug">{qData.text}</p>
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {qData.options.map((opt: string, oIdx: number) => (
                              <div 
                                key={oIdx} 
                                className={`px-4 py-3 rounded-lg border text-sm font-medium ${qData.correctOptionIndex === oIdx ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-200 text-gray-600'}`}
                              >
                                {String.fromCharCode(65 + oIdx)}. {opt}
                                {qData.correctOptionIndex === oIdx && <span className="ml-2 inline-block">✓</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2 shrink-0">
                      <span className="text-sm font-bold text-bsg-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {q.marks} Marks
                      </span>
                      <button className="text-gray-400 hover:text-red-500 font-medium text-sm transition-colors mt-2">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      ) : (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Candidate Performance</h3>
        </div>
        {loadingResults ? (
          <div className="p-12 text-center text-gray-500 font-medium">Loading results...</div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-medium">No results yet.</p>
            <p className="text-sm mt-1">Candidates have not yet completed this exam.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">BSG ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Percentage</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Taken</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((res: ResultData) => {
                  const percentage = res.totalMarks > 0 ? ((res.score / res.totalMarks) * 100).toFixed(0) : 0;
                  const isPassed = Number(percentage) >= 50;
                  return (
                    <tr key={res._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {res.candidateId?.name || 'Unknown User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {res.candidateId?.bsgId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {res.score} / {res.totalMarks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(res.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* AI Import Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Background Overlay */}
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={() => !isImporting && setShowAiModal(false)}></div>
          
          {/* Modal Panel */}
          <div className="relative bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-2xl z-10 my-8">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-bsg-gold text-white sm:mx-0 sm:h-10 sm:w-10 text-xl shadow-inner">
                  ✨
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-extrabold text-gray-900" id="modal-title">
                    AI Question Import (Gemini 2.5)
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Upload your syllabus, reading material, or old question paper below (PDF, Word, or TXT). Our AI will automatically extract text and generate multiple-choice questions!
                    </p>
                    {aiError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                        {aiError}
                      </div>
                    )}
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-3 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                          </svg>
                          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-500">PDF, DOCX, TXT (MAX. 10MB)</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                          disabled={isImporting}
                        />
                      </label>
                    </div>
                    {importFile && (
                      <div className="mt-3 text-sm text-green-700 font-medium flex items-center justify-center bg-green-50 p-2 rounded border border-green-200">
                        Selected File: {importFile.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row-reverse gap-2">
              <button
                type="button"
                onClick={handleAiImport}
                disabled={isImporting}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2 bg-bsg-blue text-base font-bold text-white hover:bg-bsg-blue-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bsg-blue sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
              >
                {isImporting ? 'Generating...' : 'Generate Questions'}
              </button>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                disabled={isImporting}
                className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bsg-blue sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Question Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={() => !isSavingManual && setShowManualModal(false)}></div>
          <div className="relative bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-2xl z-10 my-8">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 sm:mx-0 sm:h-10 sm:w-10 text-xl shadow-inner">
                  ➕
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-extrabold text-gray-900" id="modal-title">
                    Add Manual Question
                  </h3>
                  <div className="mt-4 space-y-4">
                    {manualError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                        {manualError}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Question Text</label>
                      <textarea
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg shadow-sm p-3 text-sm focus:ring-bsg-blue focus:border-bsg-blue resize-none"
                        placeholder="e.g., What is the capital of France?"
                        value={manualQuestion.text}
                        onChange={(e) => setManualQuestion({ ...manualQuestion, text: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Category (Optional)</label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg shadow-sm p-2 text-sm focus:ring-bsg-blue focus:border-bsg-blue"
                          placeholder="e.g., Geography"
                          value={manualQuestion.category}
                          onChange={(e) => setManualQuestion({ ...manualQuestion, category: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Marks</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full border border-gray-300 rounded-lg shadow-sm p-2 text-sm focus:ring-bsg-blue focus:border-bsg-blue"
                          value={manualQuestion.marks}
                          onChange={(e) => setManualQuestion({ ...manualQuestion, marks: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Options (Select the correct one)</label>
                      <div className="space-y-3">
                        {manualQuestion.options.map((opt, idx) => (
                          <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg border ${manualQuestion.correctOptionIndex === idx ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                            <input
                              type="radio"
                              name="correctOption"
                              checked={manualQuestion.correctOptionIndex === idx}
                              onChange={() => setManualQuestion({ ...manualQuestion, correctOptionIndex: idx })}
                              className="w-5 h-5 text-green-600 focus:ring-green-500 border-gray-300 ml-2"
                            />
                            <span className="font-bold text-gray-500 w-6 text-center">{String.fromCharCode(65 + idx)}.</span>
                            <input
                              type="text"
                              className="flex-1 border-0 bg-transparent focus:ring-0 text-sm font-medium"
                              placeholder={`Option ${idx + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...manualQuestion.options];
                                newOpts[idx] = e.target.value;
                                setManualQuestion({ ...manualQuestion, options: newOpts });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row-reverse gap-2">
              <button
                type="button"
                onClick={handleManualSave}
                disabled={isSavingManual}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2 bg-bsg-blue text-base font-bold text-white hover:bg-bsg-blue-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bsg-blue sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
              >
                {isSavingManual ? 'Saving...' : 'Save Question'}
              </button>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                disabled={isSavingManual}
                className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bsg-blue sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
