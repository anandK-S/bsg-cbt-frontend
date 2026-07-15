'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Settings, ListChecks, BarChart2, Users, FileText, ChevronUp, ChevronDown, CheckCircle, Upload, Save, Eye, ArrowLeft, Trash2 } from 'lucide-react';

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
  
  const [activeTab, setActiveTab] = useState<'basic' | 'questions' | 'results' | 'stats'>('questions');
  const [configExpanded, setConfigExpanded] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(true);

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
    marks: 1,
    type: 'SingleChoice',
    mediaUrl: ''
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
    fetchExam();
  }, [isAuthenticated, user, router, examId]);

  useEffect(() => {
    if (activeTab === 'results' || activeTab === 'stats') {
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
      await axios.post(`http://localhost:5000/api/exams/${examId}/questions/import`, formData, { 
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowAiModal(false);
      setImportFile(null);
      fetchExam();
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
        marks: 1,
        type: 'SingleChoice',
        mediaUrl: ''
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

  const handleExportToCSV = () => {
    if (results.length === 0) return;

    const headers = ['Candidate Name', 'BSG ID', 'Score', 'Total Marks', 'Date'];
    const csvContent = [
      headers.join(','),
      ...results.map(r => [
        `"${r.candidateId?.name || 'Unknown'}"`,
        `"${r.candidateId?.bsgId || 'N/A'}"`,
        r.score,
        r.totalMarks,
        `"${new Date(r.createdAt).toLocaleString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exam?.title?.replace(/\s+/g, '_') || 'exam'}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateOptionText = (index: number, text: string) => {
    const newOptions = [...manualQuestion.options];
    newOptions[index] = text;
    setManualQuestion({ ...manualQuestion, options: newOptions });
  };

  const addOption = () => {
    setManualQuestion({ ...manualQuestion, options: [...manualQuestion.options, ''] });
  };

  const removeOption = (index: number) => {
    if (manualQuestion.options.length <= 2) {
      setManualError('A question must have at least 2 options');
      return;
    }
    const newOptions = manualQuestion.options.filter((_, i) => i !== index);
    let newCorrectIndex = manualQuestion.correctOptionIndex;
    if (newCorrectIndex === index) {
      newCorrectIndex = 0;
    } else if (newCorrectIndex > index) {
      newCorrectIndex -= 1;
    }
    setManualQuestion({ ...manualQuestion, options: newOptions, correctOptionIndex: newCorrectIndex });
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-bsg-blue font-semibold text-xl">Loading configuration...</div>;
  if (!exam) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] bg-gray-50">
      
      {/* Test Manager Sidebar */}
      <div className="w-full md:w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <Link href="/examiner" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-bsg-blue hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1 truncate">
            <h2 className="text-sm font-black text-gray-900 truncate" title={exam.title}>{exam.title}</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">{exam.status}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Test Configuration Section */}
          <div>
            <button 
              onClick={() => setConfigExpanded(!configExpanded)}
              className="w-full flex items-center justify-between text-xs font-black text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-900 transition-colors"
            >
              Test Configuration
              {configExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {configExpanded && (
              <div className="space-y-1">
                <button 
                  onClick={() => setActiveTab('basic')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${activeTab === 'basic' ? 'bg-bsg-blue/10 text-bsg-blue' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Settings size={18} /> Basic Settings
                </button>
                <button 
                  onClick={() => setActiveTab('questions')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${activeTab === 'questions' ? 'bg-bsg-blue/10 text-bsg-blue' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ListChecks size={18} /> Question Manager
                </button>
              </div>
            )}
          </div>

          {/* Progress & Results Section */}
          <div>
            <button 
              onClick={() => setProgressExpanded(!progressExpanded)}
              className="w-full flex items-center justify-between text-xs font-black text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-900 transition-colors"
            >
              Test Progress & Results
              {progressExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {progressExpanded && (
              <div className="space-y-1">
                <button 
                  onClick={() => setActiveTab('results')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${activeTab === 'results' ? 'bg-bsg-blue/10 text-bsg-blue' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Users size={18} /> Results Table
                </button>
                <button 
                  onClick={() => setActiveTab('stats')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${activeTab === 'stats' ? 'bg-bsg-blue/10 text-bsg-blue' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <BarChart2 size={18} /> Statistics
                </button>
              </div>
            )}
          </div>
        </div>
        
        {exam.status === 'Draft' && (
          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={handlePublish}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle size={18} /> Publish Test
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden p-6 md:p-10">
        
        {/* BASIC SETTINGS */}
        {activeTab === 'basic' && (
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black text-gray-900 mb-6">Basic Settings</h1>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4 border-b border-gray-100 pb-2">Initial Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Test Name</label>
                    <input 
                      type="text" 
                      value={exam.title}
                      readOnly
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                      <input 
                        type="text" 
                        value={exam.category || 'Uncategorized'}
                        readOnly
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Duration (Minutes)</label>
                      <input 
                        type="number" 
                        value={exam.durationMinutes}
                        readOnly
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea 
                      value={exam.description}
                      readOnly
                      rows={4}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium italic">* Editing basic settings is restricted after exam creation to maintain data integrity.</p>
            </div>
          </div>
        )}

        {/* QUESTION MANAGER */}
        {activeTab === 'questions' && (
          <div className="max-w-5xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-3xl font-black text-gray-900">Question Manager</h1>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowAiModal(true)}
                  className="bg-bsg-gold text-bsg-blue-dark font-black px-5 py-2.5 rounded-xl hover:bg-yellow-500 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Upload size={18} /> AI Import
                </button>
                <button 
                  onClick={() => setShowManualModal(true)}
                  className="bg-bsg-blue text-white font-black px-5 py-2.5 rounded-xl hover:bg-bsg-blue-dark transition-colors shadow-sm flex items-center gap-2"
                >
                  + Add Manual Question
                </button>
              </div>
            </div>

            {exam.questions.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                  <FileText size={40} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-500 mb-6">Start building your test by manually adding questions or importing them using our AI engine.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exam.questions.map((q, idx) => (
                  <div key={q.questionId._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-lg bg-bsg-blue/10 text-bsg-blue font-black flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-gray-900 font-bold text-lg">{q.questionId.text}</p>
                          <div className="flex flex-wrap gap-3 mt-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-200 px-2 py-0.5 rounded-md">Category: {q.questionId.category || 'General'}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-200 px-2 py-0.5 rounded-md">Type: {q.type || 'SingleChoice'}</span>
                            <span className="text-xs font-bold text-bsg-blue uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">Marks: {q.marks || 1}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.questionId.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className={`px-4 py-3 rounded-xl border-2 flex items-center gap-3 ${q.questionId.correctOptionIndex === optIdx ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${q.questionId.correctOptionIndex === optIdx ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {['A', 'B', 'C', 'D'][optIdx]}
                            </span>
                            <span className={`font-medium ${q.questionId.correctOptionIndex === optIdx ? 'text-green-900 font-bold' : 'text-gray-700'}`}>
                              {opt}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESULTS TABLE */}
        {activeTab === 'results' && (
          <div className="max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-3xl font-black text-gray-900">Results Database</h1>
              <button 
                onClick={handleExportToCSV}
                disabled={results.length === 0}
                className="bg-green-600 text-white font-black px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <FileText size={18} /> Export to CSV
              </button>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Candidate Details</th>
                      <th className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-8 py-5 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {loadingResults ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-10 text-center font-bold text-gray-500">Loading results...</td>
                      </tr>
                    ) : results.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-16 text-center">
                          <div className="text-4xl mb-4">📭</div>
                          <p className="font-bold text-gray-900 text-lg">No attempts recorded yet.</p>
                          <p className="text-gray-500">Candidates have not yet completed this exam.</p>
                        </td>
                      </tr>
                    ) : (
                      results.map((result) => (
                        <tr key={result._id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-8 py-5 whitespace-nowrap">
                            <div className="text-sm font-black text-gray-900">{result.candidateId?.name || 'Unknown Candidate'}</div>
                            <div className="text-sm text-gray-500 font-medium mt-0.5">BSG ID: {result.candidateId?.bsgId || 'N/A'}</div>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <span className="px-4 py-1.5 inline-flex text-sm font-black rounded-full bg-blue-50 text-bsg-blue border border-blue-100">
                              {result.score} / {result.totalMarks}
                            </span>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500 font-medium">
                            {new Date(result.createdAt).toLocaleString()}
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-right">
                            <button className="text-bsg-blue hover:text-bsg-blue-dark font-black hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ml-auto">
                              <Eye size={16} /> Review
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STATISTICS */}
        {activeTab === 'stats' && (
          <div className="max-w-5xl">
            <h1 className="text-3xl font-black text-gray-900 mb-6">Test Statistics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total Participants</p>
                <p className="text-5xl font-black text-gray-900">{results.length}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Average Score</p>
                <p className="text-5xl font-black text-bsg-blue">
                  {results.length > 0 
                    ? Math.round(results.reduce((acc, curr) => acc + (curr.score / curr.totalMarks * 100), 0) / results.length) 
                    : 0}%
                </p>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-16 text-center text-gray-500">
              <BarChart2 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="font-bold text-xl text-gray-900 mb-2">Advanced Analytics</p>
              <p>Question-by-question analysis will be available here when more data is collected.</p>
            </div>
          </div>
        )}

      </div>

      {/* Manual Question Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl relative my-8 flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
              <h3 className="text-2xl font-black text-gray-900">Add Manual Question</h3>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-900">
                <Trash2 size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Question Text</label>
                <textarea
                  value={manualQuestion.text}
                  onChange={(e) => setManualQuestion({...manualQuestion, text: e.target.value})}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-bsg-blue focus:ring-4 focus:ring-bsg-blue/10 outline-none resize-none"
                  rows={3}
                  placeholder="e.g., What is the capital of France?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Category (Optional)</label>
                  <input
                    type="text"
                    value={manualQuestion.category}
                    onChange={(e) => setManualQuestion({...manualQuestion, category: e.target.value})}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-bsg-blue outline-none"
                    placeholder="e.g., Geography"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={manualQuestion.marks}
                    onChange={(e) => setManualQuestion({...manualQuestion, marks: parseInt(e.target.value) || 1})}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-bsg-blue outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Question Type</label>
                  <select
                    value={manualQuestion.type}
                    onChange={(e) => setManualQuestion({...manualQuestion, type: e.target.value})}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-bsg-blue outline-none"
                  >
                    <option value="SingleChoice">Single Choice</option>
                    <option value="MultipleChoice">Multiple Choice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Media URL (Optional Image)</label>
                  <input
                    type="text"
                    value={manualQuestion.mediaUrl}
                    onChange={(e) => setManualQuestion({...manualQuestion, mediaUrl: e.target.value})}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-bsg-blue outline-none"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-black text-gray-700">Options (Select the correct one)</label>
                  <button type="button" onClick={addOption} className="text-bsg-blue text-sm font-bold hover:underline">+ Add Option</button>
                </div>
                <div className="space-y-3">
                  {manualQuestion.options.map((opt, idx) => (
                    <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${manualQuestion.correctOptionIndex === idx ? 'border-bsg-blue bg-blue-50/50' : 'border-gray-200 bg-white'}`}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type={manualQuestion.type === 'MultipleChoice' ? 'checkbox' : 'radio'}
                          name="correctOption"
                          checked={manualQuestion.correctOptionIndex === idx}
                          onChange={() => setManualQuestion({...manualQuestion, correctOptionIndex: idx})}
                          className="w-5 h-5 text-bsg-blue focus:ring-bsg-blue border-gray-300"
                        />
                        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-500">
                          {String.fromCharCode(65 + idx)}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOptionText(idx, e.target.value)}
                        className="flex-1 bg-transparent font-medium text-gray-900 outline-none"
                        placeholder={`Option ${idx + 1}`}
                      />
                      <button 
                        type="button" 
                        onClick={() => removeOption(idx)}
                        className="text-gray-400 hover:text-red-500 p-2"
                        title="Remove option"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {manualError && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
                  {manualError}
                </div>
              )}
            </div>

            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end gap-4">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSave}
                disabled={isSavingManual}
                className="bg-bsg-blue hover:bg-bsg-blue-dark text-white px-8 py-3 rounded-xl font-black shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {isSavingManual ? 'Saving...' : <><Save size={18} /> Save Question</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Import Modal (Simplified for brevity in UI rewrite) */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-2xl font-black text-gray-900 mb-6">AI Import Questions</h3>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Upload File (.txt, .pdf, .docx)</label>
              <input 
                type="file" 
                accept=".txt,.pdf,.docx"
                onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-bsg-blue/10 file:text-bsg-blue hover:file:bg-bsg-blue/20"
              />
            </div>
            {aiError && <div className="mb-6 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{aiError}</div>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAiModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
              <button 
                onClick={handleAiImport} 
                disabled={isImporting || !importFile}
                className="bg-bsg-gold text-bsg-blue-dark hover:bg-yellow-500 px-6 py-2.5 rounded-xl font-black shadow-md transition-all disabled:opacity-50"
              >
                {isImporting ? 'Processing AI...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
