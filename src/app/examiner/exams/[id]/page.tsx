'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { API_URL } from '@/utils/apiConfig';
import { Settings, ListChecks, BarChart2, Users, FileText, ChevronUp, ChevronDown, CheckCircle, Upload, Save, Eye, ArrowLeft, Trash2, Edit2 } from 'lucide-react';

interface ExamDetailsData {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  durationSeconds?: number;
  durationUnit: string;
  passingMarks: number;
  allowMultipleAttempts?: boolean;
  releaseResultsInstantly?: boolean;
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
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
  
  const [editForm, setEditForm] = useState<{
    title?: string;
    description?: string;
    category?: string;
    durationHours?: number | '';
    durationMinutes?: number | '';
    durationSeconds?: number | '';
    allowMultipleAttempts?: boolean;
    releaseResultsInstantly?: boolean;
    scheduledStartDate?: string;
    scheduledEndDate?: string;
  }>({});
  
  const [isSavingBasic, setIsSavingBasic] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'basic' | 'questions' | 'results' | 'stats'>('questions');
  const [configExpanded, setConfigExpanded] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(true);

  const [results, setResults] = useState<ResultData[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // AI Import State
  const [showAiModal, setShowAiModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [aiError, setAiError] = useState('');

  // Manual Question State
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [manualQuestion, setManualQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    acceptableAnswers: [''],
    category: '',
    marks: 1,
    type: 'SingleChoice',
    mediaUrl: ''
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [manualError, setManualError] = useState('');

  const fetchExam = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/exams/${examId}?t=${new Date().getTime()}`, {
        withCredentials: true,
      });
      setExam(data);
      
      const totalSecs = data.durationSeconds || (data.durationMinutes * 60);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      
      setEditForm({
        title: data.title,
        description: data.description,
        category: data.category,
        durationHours: h || '',
        durationMinutes: m || '',
        durationSeconds: s || '',
        allowMultipleAttempts: data.allowMultipleAttempts,
        releaseResultsInstantly: data.releaseResultsInstantly !== false,
        scheduledStartDate: data.scheduledStartDate ? new Date(data.scheduledStartDate).toISOString().slice(0,16) : '',
        scheduledEndDate: data.scheduledEndDate ? new Date(data.scheduledEndDate).toISOString().slice(0,16) : '',
      });
    } catch (error) {
      console.error('Error fetching exam:', error);
      router.push('/examiner');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasicSettings = async () => {
    setIsSavingBasic(true);
    try {
      const h = Number(editForm.durationHours) || 0;
      const m = Number(editForm.durationMinutes) || 0;
      const s = Number(editForm.durationSeconds) || 0;
      const totalSeconds = (h * 3600) + (m * 60) + s;
      
      if (totalSeconds <= 0) {
        alert("Please enter a valid exam duration greater than 0.");
        setIsSavingBasic(false);
        return;
      }
      
      if (editForm.scheduledStartDate && editForm.scheduledEndDate && new Date(editForm.scheduledStartDate) > new Date(editForm.scheduledEndDate)) {
        alert("Start Date cannot be after End Date.");
        setIsSavingBasic(false);
        return;
      }

      const payload = {
        ...editForm,
        durationMinutes: Math.ceil(totalSeconds / 60),
        durationSeconds: totalSeconds,
        scheduledStartDate: editForm.scheduledStartDate || null,
        scheduledEndDate: editForm.scheduledEndDate || null,
      };

      await axios.put(`${API_URL}/api/exams/${examId}`, payload, { withCredentials: true });
      fetchExam();
      alert('Basic settings updated successfully');
    } catch (error) {
      console.error('Error updating exam:', error);
      alert('Failed to update basic settings');
    } finally {
      setIsSavingBasic(false);
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
          const { data } = await axios.get(`${API_URL}/api/attempts/${examId}/result`, {
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
      await axios.post(`${API_URL}/api/exams/${examId}/questions/import`, formData, { 
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
    if (manualQuestion.type !== 'Subjective' && manualQuestion.options.some(opt => !opt.trim())) return setManualError('All 4 options are required');
    if (manualQuestion.type === 'Subjective' && manualQuestion.acceptableAnswers.some(ans => !ans.trim())) return setManualError('All acceptable answers must be filled');

    setIsSavingManual(true);
    setManualError('');

    try {
      const formData = new FormData();
      formData.append('text', manualQuestion.text);
      formData.append('marks', manualQuestion.marks.toString());
      formData.append('type', manualQuestion.type);
      if (manualQuestion.category) formData.append('category', manualQuestion.category);
      if (manualQuestion.mediaUrl) formData.append('mediaUrl', manualQuestion.mediaUrl);
      
      if (manualQuestion.type === 'Subjective') {
        formData.append('acceptableAnswers', JSON.stringify(manualQuestion.acceptableAnswers.filter(a => a.trim() !== '')));
      } else {
        formData.append('options', JSON.stringify(manualQuestion.options));
        formData.append('correctOptionIndex', manualQuestion.correctOptionIndex.toString());
      }
      
      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      if (editingQuestionId) {
        await axios.put(
          `\/api/exams/${examId}/questions/${editingQuestionId}`,
          formData,
          { 
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      } else {
        await axios.post(
          `\/api/exams/${examId}/questions`,
          formData,
          { 
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      }
      setShowManualModal(false);
      setEditingQuestionId(null);
      setManualQuestion({
        text: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        acceptableAnswers: [''],
        category: '',
        marks: 1,
        type: 'SingleChoice',
        mediaUrl: ''
      });
      setMediaFile(null);
      fetchExam();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setManualError(err.response?.data?.message || err.message || 'Failed to save question');
      } else {
        setManualError('Failed to save question');
      }
    } finally {
      setIsSavingManual(false);
    }
  };

  const handlePublish = async () => {
    if (exam && exam.questions.length === 0) {
      alert("You cannot publish an exam with 0 questions. Please add some questions first.");
      return;
    }
    if (!confirm("Are you sure you want to publish this exam? Candidates will be able to take it.")) return;
    setIsPublishing(true);
    try {
      await axios.put(`${API_URL}/api/exams/${examId}/status`, { status: 'Published' }, { withCredentials: true });
      fetchExam();
    } catch (err) {
      console.error("Publish Error:", err);
      alert("Failed to publish exam");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm("Are you sure you want to unpublish this exam? It will be moved to Draft status.")) return;
    setIsPublishing(true);
    try {
      await axios.put(`${API_URL}/api/exams/${examId}/status`, { status: 'Draft' }, { withCredentials: true });
      fetchExam();
    } catch (err) {
      console.error("Unpublish Error:", err);
      alert("Failed to unpublish exam");
    } finally {
      setIsPublishing(false);
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
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-gray-50">
      
      {/* Top Header & Horizontal Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header row */}
          <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/examiner" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-bsg-blue hover:text-white transition-colors flex-shrink-0">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{exam.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-full ${exam.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{exam.status}</span>
                  <span className="text-sm font-medium text-gray-500">{exam.questions.length} Questions</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {exam.status === 'Draft' ? (
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <CheckCircle size={18} /> {isPublishing ? 'Publishing...' : 'Publish Test'}
                </button>
              ) : (
                <button 
                  onClick={handleUnpublish}
                  disabled={isPublishing}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Trash2 size={18} /> {isPublishing ? 'Unpublishing...' : 'Unpublish'}
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Tabs */}
          <div className="flex space-x-8 overflow-x-auto custom-scrollbar mt-2">
            <button 
              onClick={() => setActiveTab('basic')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'basic' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <Settings size={18} /> Basic Settings
            </button>
            <button 
              onClick={() => setActiveTab('questions')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'questions' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <ListChecks size={18} /> Question Manager
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'results' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <Users size={18} /> Results Table
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'stats' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <BarChart2 size={18} /> Statistics
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
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
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-bsg-blue focus:outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                      <input 
                        type="text" 
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                        placeholder="e.g. Science, Math"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-bsg-blue focus:outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Duration <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            min="0"
                            className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium"
                            value={editForm.durationHours}
                            onChange={(e) => setEditForm({...editForm, durationHours: e.target.value ? parseInt(e.target.value) : ''})}
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-3.5 text-xs text-gray-400 font-bold uppercase">hr</span>
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            min="0"
                            className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium"
                            value={editForm.durationMinutes}
                            onChange={(e) => setEditForm({...editForm, durationMinutes: e.target.value ? parseInt(e.target.value) : ''})}
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-3.5 text-xs text-gray-400 font-bold uppercase">min</span>
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            min="0"
                            className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-colors text-gray-900 font-medium"
                            value={editForm.durationSeconds}
                            onChange={(e) => setEditForm({...editForm, durationSeconds: e.target.value ? parseInt(e.target.value) : ''})}
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-3.5 text-xs text-gray-400 font-bold uppercase">sec</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Scheduled Start Date</label>
                      <input 
                        type="datetime-local" 
                        value={editForm.scheduledStartDate || ''}
                        onChange={(e) => setEditForm({...editForm, scheduledStartDate: e.target.value})}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-bsg-blue focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Scheduled End Date</label>
                      <input 
                        type="datetime-local" 
                        value={editForm.scheduledEndDate || ''}
                        onChange={(e) => setEditForm({...editForm, scheduledEndDate: e.target.value})}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-bsg-blue focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea 
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      rows={4}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-bsg-blue focus:outline-none resize-none transition-all"
                    />
                  </div>
                  <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={editForm.allowMultipleAttempts || false}
                          onChange={(e) => setEditForm({...editForm, allowMultipleAttempts: e.target.checked})}
                        />
                        <div className={`block w-12 h-6 rounded-full transition-colors ${editForm.allowMultipleAttempts ? 'bg-bsg-blue' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editForm.allowMultipleAttempts ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-700 block group-hover:text-bsg-blue transition-colors">Allow Multiple Attempts</span>
                        <span className="text-xs text-gray-500">If enabled, candidates can take this exam more than once.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={editForm.releaseResultsInstantly !== false}
                          onChange={(e) => setEditForm({...editForm, releaseResultsInstantly: e.target.checked})}
                        />
                        <div className={`block w-12 h-6 rounded-full transition-colors ${editForm.releaseResultsInstantly !== false ? 'bg-bsg-blue' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editForm.releaseResultsInstantly !== false ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-700 block group-hover:text-bsg-blue transition-colors">Release Results Instantly</span>
                        <span className="text-xs text-gray-500">If disabled, candidates won't see their scores.</span>
                      </div>
                    </label>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-6">
                    <button 
                      onClick={async () => {
                        if (confirm("Are you sure you want to permanently delete this exam? This action cannot be undone.")) {
                          try {
                            await axios.delete(`${API_URL}/api/exams/${examId}`, { withCredentials: true });
                            router.push('/examiner');
                          } catch (err) {
                            alert('Failed to delete exam');
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-700 font-bold px-4 py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={18} /> Delete Exam
                    </button>
                    <button 
                      onClick={handleSaveBasicSettings}
                      disabled={isSavingBasic}
                      className="bg-bsg-blue hover:bg-bsg-blue-dark text-white font-black px-8 py-3 rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSavingBasic ? 'Saving...' : <><Save size={18} /> Save Configuration</>}
                    </button>
                  </div>
                </div>
              </div>
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
                  onClick={() => {
                    setEditingQuestionId(null);
                    setManualQuestion({
                      text: '',
                      options: ['', '', '', ''],
                      correctOptionIndex: 0,
                      acceptableAnswers: [''],
                      category: '',
                      marks: 1,
                      type: 'SingleChoice',
                      mediaUrl: ''
                    });
                    setMediaFile(null);
                    setShowManualModal(true);
                  }}
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
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingQuestionId(q.questionId._id);
                            setManualQuestion({
                              text: q.questionId.text,
                              options: q.questionId.options.length ? [...q.questionId.options] : ['', '', '', ''],
                              correctOptionIndex: q.questionId.correctOptionIndex || 0,
                              acceptableAnswers: q.questionId.acceptableAnswers?.length ? [...q.questionId.acceptableAnswers] : [''],
                              category: q.questionId.category || '',
                              marks: q.marks || 1,
                              type: q.type || 'SingleChoice',
                              mediaUrl: q.questionId.mediaUrl || ''
                            });
                            setMediaFile(null);
                            setShowManualModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-bsg-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Question"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm("Are you sure you want to delete this question?")) {
                              try {
                                await axios.delete(`${API_URL}/api/exams/${examId}/questions/${q.questionId._id}`, { withCredentials: true });
                                fetchExam(); // refresh
                              } catch (err) {
                                alert('Failed to delete question');
                              }
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 size={16} />
                        </button>
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
                      {q.questionId.mediaUrl && (
                        <div className="mt-6 flex justify-center">
                          <img src={`${API_URL}${q.questionId.mediaUrl}`} alt="Question Media" className="max-h-48 max-w-full rounded-xl border border-gray-200 shadow-sm object-contain" />
                        </div>
                      )}
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
              <div className="flex flex-wrap items-center gap-3">
                {!exam?.releaseResultsInstantly && (
                  <button 
                    onClick={async () => {
                      if (confirm("Are you sure you want to release all scores to candidates now?")) {
                        try {
                          await axios.put(`${API_URL}/api/exams/${examId}/status`, { releaseResultsInstantly: true }, { withCredentials: true });
                          fetchExam();
                          alert("Results have been released to candidates!");
                        } catch (err) {
                          alert("Failed to release results.");
                        }
                      }
                    }}
                    className="flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-bold transition-colors"
                  >
                    <CheckCircle size={16} /> Release Results to Candidates
                  </button>
                )}
                <button 
                  onClick={async () => {
                    if (confirm("Are you sure you want to clear ALL results for this exam? This cannot be undone.")) {
                      try {
                        await axios.delete(`${API_URL}/api/attempts/${examId}/results`, { withCredentials: true });
                        const { data } = await axios.get(`${API_URL}/api/attempts/${examId}/result`, { withCredentials: true });
                        setResults(Array.isArray(data) ? data : []);
                      } catch (err) {
                        alert('Failed to clear results');
                      }
                    }
                  }}
                  disabled={results.length === 0}
                  className="bg-red-50 text-red-600 font-black px-5 py-2.5 rounded-xl hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={18} /> Clear All Results
                </button>
                <button 
                  onClick={handleExportToCSV}
                  disabled={results.length === 0}
                  className="bg-green-600 text-white font-black px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <FileText size={18} /> Export to CSV
                </button>
              </div>
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
                          <td className="px-8 py-5 whitespace-nowrap text-right flex items-center justify-end gap-3">
                            <Link href={`/exams/${result._id}/review`} className="text-bsg-blue hover:text-bsg-blue-dark font-black hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                              <Eye size={16} /> Review
                            </Link>
                            <button
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this candidate's result?")) {
                                  try {
                                    await axios.delete(`${API_URL}/api/attempts/result/${result._id}`, { withCredentials: true });
                                    setResults(results.filter(r => r._id !== result._id));
                                  } catch (err) {
                                    alert('Failed to delete result');
                                  }
                                }
                              }}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="Delete Result"
                            >
                              <Trash2 size={16} />
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl max-w-2xl shadow-2xl relative flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-3xl">
              <h2 className="text-2xl font-black text-gray-900">{editingQuestionId ? 'Edit Question' : 'Add Question'}</h2>
              <button onClick={() => setShowManualModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
                <span className="text-gray-500 font-bold">×</span>
              </button>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
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
                    list="bsg-categories"
                    value={manualQuestion.category}
                    onChange={(e) => setManualQuestion({...manualQuestion, category: e.target.value})}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-bsg-blue outline-none"
                    placeholder="e.g., Pravesh, Pratham Sopan"
                  />
                  <datalist id="bsg-categories">
                    <option value="Pravesh" />
                    <option value="Pratham Sopan" />
                    <option value="Dwitiya Sopan" />
                    <option value="Tritiya Sopan" />
                    <option value="Rajya Puraskar" />
                    <option value="Rashtrapati Scout/Guide" />
                    <option value="First Aid" />
                    <option value="Pioneering" />
                    <option value="Mapping" />
                    <option value="Campcraft" />
                  </datalist>
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
                    <option value="Subjective">Short Answer (Subjective)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Media Upload (Optional Image)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMediaFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-900 font-medium focus:border-bsg-blue outline-none"
                  />
                  {manualQuestion.mediaUrl && !mediaFile && (
                    <div className="mt-2 text-xs text-blue-600 truncate">Current: {manualQuestion.mediaUrl}</div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-black text-gray-700">
                    {manualQuestion.type === 'Subjective' ? 'Acceptable Answers' : 'Options (Select the correct one)'}
                  </label>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (manualQuestion.type === 'Subjective') {
                        setManualQuestion({...manualQuestion, acceptableAnswers: [...manualQuestion.acceptableAnswers, '']});
                      } else {
                        addOption();
                      }
                    }} 
                    className="text-bsg-blue text-sm font-bold hover:underline"
                  >
                    + Add {manualQuestion.type === 'Subjective' ? 'Answer' : 'Option'}
                  </button>
                </div>
                <div className="space-y-3">
                  {manualQuestion.type === 'Subjective' ? (
                    manualQuestion.acceptableAnswers.map((ans, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 bg-white transition-all focus-within:border-bsg-blue">
                        <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-black text-bsg-blue">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={ans}
                          onChange={(e) => {
                            const newAns = [...manualQuestion.acceptableAnswers];
                            newAns[idx] = e.target.value;
                            setManualQuestion({...manualQuestion, acceptableAnswers: newAns});
                          }}
                          className="flex-1 bg-transparent font-medium text-gray-900 outline-none"
                          placeholder="e.g. Paris"
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            if (manualQuestion.acceptableAnswers.length <= 1) {
                              setManualError('Must have at least 1 acceptable answer');
                              return;
                            }
                            setManualQuestion({...manualQuestion, acceptableAnswers: manualQuestion.acceptableAnswers.filter((_, i) => i !== idx)});
                          }}
                          className="text-gray-400 hover:text-red-500 p-2"
                          title="Remove answer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    manualQuestion.options.map((opt, idx) => (
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
                  )))}
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
            <h3 className="text-2xl font-black text-gray-900 mb-6">AI Import Questions</h3>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Upload File (.txt, .pdf, .docx, images)</label>
              <input 
                type="file" 
                accept=".txt,.pdf,.docx,image/*"
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
