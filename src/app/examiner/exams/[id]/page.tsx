'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { API_URL } from '@/utils/apiConfig';
import { Settings, ListChecks, BarChart2, Users, FileText, ChevronUp, ChevronDown, CheckCircle, Upload, Save, Eye, ArrowLeft, Trash2, Edit2, Mic, BookOpen, Calendar, Clock, Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  issueCertificate?: boolean;
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
  const { language, setLanguage, t } = useLanguage();
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
    issueCertificate?: boolean;
    scheduledStartDate?: string;
    scheduledEndDate?: string;
  }>({});
  
  const [isSavingBasic, setIsSavingBasic] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'basic' | 'questions' | 'results' | 'stats' | 'anandai'>('questions');
  const [configExpanded, setConfigExpanded] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(true);

  const [results, setResults] = useState<ResultData[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // AI Import State
  const [showAiModal, setShowAiModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [aiError, setAiError] = useState('');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Anand AI State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditStatus, setAuditStatus] = useState('Initializing Anand AI...');
  const [auditResults, setAuditResults] = useState<any>(null);
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);
  const [anandError, setAnandError] = useState('');

  // Manual Question State
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  interface ManualQuestionState {
    text: string;
    textHindi?: string;
    options: string[];
    optionsHindi?: string[];
    correctOptionIndex: number;
    acceptableAnswers: string[];
    category: string;
    section: string;
    marks: number;
    type: string;
    mediaUrl: string;
  }
  const [manualQuestion, setManualQuestion] = useState<ManualQuestionState>({
    text: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    acceptableAnswers: [''],
    category: '',
    section: '',
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
        issueCertificate: data.issueCertificate !== false,
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
        issueCertificate: editForm.issueCertificate,
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
    setImportProgress(0);
    setAiError('');
    
    // Fake progress bar that climbs to 90%
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        const next = prev + (90 - prev) * 0.1;
        return next > 90 ? 90 : next;
      });
    }, 1000);

    const formData = new FormData();
    formData.append('file', importFile);
    
    try {
      await axios.post(`${API_URL}/api/exams/${examId}/questions/import`, formData, { 
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      clearInterval(progressInterval);
      setImportProgress(100);
      
      setTimeout(() => {
        setShowAiModal(false);
        setImportFile(null);
        fetchExam();
      }, 500);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      if (axios.isAxiosError(err)) {
        setAiError(err.response?.data?.message || 'Failed to import questions. Ensure Gemini API key is valid.');
      } else {
        setAiError('Failed to import questions.');
      }
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
      if (manualQuestion.textHindi) formData.append('textHindi', manualQuestion.textHindi);
      formData.append('marks', manualQuestion.marks.toString());
      formData.append('type', manualQuestion.type);
      if (manualQuestion.category) formData.append('category', manualQuestion.category);
      if (manualQuestion.section) formData.append('section', manualQuestion.section);
      if (manualQuestion.mediaUrl) formData.append('mediaUrl', manualQuestion.mediaUrl);
      
      if (manualQuestion.type === 'Subjective') {
        formData.append('acceptableAnswers', JSON.stringify(manualQuestion.acceptableAnswers.filter(a => a.trim() !== '')));
      } else {
        formData.append('options', JSON.stringify(manualQuestion.options));
        if (manualQuestion.optionsHindi) formData.append('optionsHindi', JSON.stringify(manualQuestion.optionsHindi));
        formData.append('correctOptionIndex', manualQuestion.correctOptionIndex.toString());
      }
      
      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      if (editingQuestionId) {
        await axios.put(
          `${API_URL}/api/exams/${examId}/questions/${editingQuestionId}`,
          formData,
          { 
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      } else {
        await axios.post(
          `${API_URL}/api/exams/${examId}/questions`,
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
        section: '',
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

  const handleAnandAiAudit = async () => {
    setIsAuditing(true);
    setAuditProgress(0);
    setAnandError('');
    setAuditResults(null);
    setAuditStatus('Analyzing Exam Settings & Schedule...');

    const interval = setInterval(() => {
      setAuditProgress(p => {
        const next = p + (90 - p) * 0.05;
        if (next > 30 && next < 60) setAuditStatus('Evaluating Question Translations & Clarity...');
        if (next > 60) setAuditStatus('Finalizing Anand AI Suggestions...');
        return next > 90 ? 90 : next;
      });
    }, 800);

    try {
      const { data } = await axios.post(`${API_URL}/api/exams/${examId}/anand-ai/audit`, {}, { withCredentials: true });
      clearInterval(interval);
      setAuditProgress(100);
      setAuditStatus('Audit Complete!');
      
      setTimeout(() => {
        setAuditResults(data);
        setIsAuditing(false);
      }, 600);
    } catch (err: unknown) {
      clearInterval(interval);
      setIsAuditing(false);
      if (axios.isAxiosError(err)) {
        setAnandError(err.response?.data?.message || 'Failed to complete Anand AI Audit.');
      } else {
        setAnandError('Failed to complete Anand AI Audit.');
      }
    }
  };

  const handleApplyAnandFixes = async () => {
    if (!auditResults) return;
    setIsApplyingFixes(true);
    try {
      await axios.post(`${API_URL}/api/exams/${examId}/anand-ai/apply`, {
        examUpdates: auditResults.examUpdates,
        questionUpdates: auditResults.questionUpdates
      }, { withCredentials: true });
      
      setAuditResults(null);
      alert('All Anand AI fixes applied successfully!');
      fetchExam();
    } catch (err) {
      console.error('Apply AI Fixes Error:', err);
      alert('Failed to apply AI fixes.');
    } finally {
      setIsApplyingFixes(false);
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

  const handleDeleteAllQuestions = async () => {
    setIsDeletingAll(true);
    try {
      await axios.delete(`${API_URL}/api/exams/${examId}/questions/all`, { withCredentials: true });
      setShowDeleteAllModal(false);
      fetchExam();
    } catch (err) {
      console.error("Delete All Error:", err);
      alert("Failed to delete all questions");
    } finally {
      setIsDeletingAll(false);
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

  const updateOptionText = (index: number, text: string, lang: 'en' | 'hi' = 'en') => {
    if (lang === 'en') {
      const newOptions = [...manualQuestion.options];
      newOptions[index] = text;
      setManualQuestion({...manualQuestion, options: newOptions});
    } else {
      const newOptions = [...(manualQuestion.optionsHindi || manualQuestion.options.map(()=>''))];
      newOptions[index] = text;
      setManualQuestion({...manualQuestion, optionsHindi: newOptions});
    }
  };

  const addOption = () => {
    setManualQuestion({ ...manualQuestion, options: [...manualQuestion.options, ''] });
  };

  const removeOption = (index: number) => {
    if (manualQuestion.options.length <= 2) {
      setManualError('Must have at least 2 options');
      return;
    }
    const newOptions = manualQuestion.options.filter((_: any, i: number) => i !== index);
    const newOptionsHindi = (manualQuestion.optionsHindi || manualQuestion.options.map(()=>'')).filter((_: any, i: number) => i !== index);
    const newCorrectIndex = manualQuestion.correctOptionIndex === index ? 0 : manualQuestion.correctOptionIndex > index ? manualQuestion.correctOptionIndex - 1 : manualQuestion.correctOptionIndex;
    setManualQuestion({
      ...manualQuestion,
      options: newOptions,
      optionsHindi: newOptionsHindi,
      correctOptionIndex: newCorrectIndex
    });
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-bsg-blue font-semibold text-xl">Loading configuration...</div>;
  if (!exam) return null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-gray-50">
      
      {/* Premium Gradient Header */}
      <div className="bg-gradient-to-r from-bsg-blue to-bsg-blue-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header row */}
          <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/examiner" className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors flex-shrink-0">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">{exam.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-full ${exam.status === 'Published' ? 'bg-green-400/20 text-green-200 border border-green-300/30' : 'bg-white/20 text-blue-100 border border-white/20'}`}>{exam.status}</span>
                  <span className="text-blue-200 text-sm font-medium">{exam.questions.length} Questions</span>
                  {exam.category && <span className="text-blue-300 text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full">{exam.category}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1 bg-white/10 p-1 rounded-lg border border-white/20">
                <button 
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-white text-bsg-blue shadow-sm' : 'text-blue-100 hover:text-white'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('hi')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${language === 'hi' ? 'bg-white text-bsg-blue shadow-sm' : 'text-blue-100 hover:text-white'}`}
                >
                  HI
                </button>
              </div>

              {exam.status === 'Draft' ? (
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="bg-green-500 hover:bg-green-400 text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50 text-sm"
                >
                  <CheckCircle size={16} /> {isPublishing ? 'Publishing...' : 'Publish Test'}
                </button>
              ) : (
                <button 
                  onClick={handleUnpublish}
                  disabled={isPublishing}
                  className="bg-orange-400 hover:bg-orange-300 text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50 text-sm"
                >
                  <Trash2 size={16} /> {isPublishing ? 'Unpublishing...' : 'Unpublish'}
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Tabs */}
          <div className="flex space-x-1 overflow-x-auto pb-px">
            {['basic', 'questions', 'anandai', 'results', 'stats'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-6 font-black text-sm uppercase tracking-wide border-b-4 transition-colors ${activeTab === tab ? 'border-white text-white' : 'border-transparent text-blue-200 hover:text-white hover:border-white/30'}`}
              >
                {tab === 'basic' ? (
                  <span className="flex items-center gap-2"><Settings size={16} /> Basic Settings</span>
                ) : tab === 'questions' ? (
                  <span className="flex items-center gap-2"><ListChecks size={16} /> Questions</span>
                ) : tab === 'anandai' ? (
                  <span className="flex items-center gap-2 text-bsg-gold"><span className="text-lg">✨</span> Anand AI</span>
                ) : tab === 'results' ? (
                  <span className="flex items-center gap-2"><Users size={16} /> Results</span>
                ) : (
                  <span className="flex items-center gap-2"><BarChart2 size={16} /> Statistics</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* BASIC SETTINGS TAB */}
        {activeTab === 'basic' && (
          <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
            
            {/* General Information */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-bsg-blue">
                  <BookOpen size={20} />
                </div>
                <h2 className="text-xl font-black text-gray-900">General Information</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Exam Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all font-medium text-sm"
                    placeholder="e.g., Rajya Puraskar Mock Test 2026"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all min-h-[100px] text-sm font-medium resize-none"
                    placeholder="Provide a brief description or instructions for the candidates..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select
                    value={editForm.category || 'General'}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all font-medium text-sm appearance-none bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Scout">Scout</option>
                    <option value="Guide">Guide</option>
                    <option value="Rover">Rover</option>
                    <option value="Ranger">Ranger</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Timing & Scoring */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <Clock size={20} />
                </div>
                <h2 className="text-xl font-black text-gray-900">Timing & Scoring</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Duration <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all">
                      <input
                        type="number"
                        min="0"
                        value={Math.floor((editForm.durationMinutes || 0) / 60)}
                        onChange={(e) => {
                          const hrs = parseInt(e.target.value) || 0;
                          const mins = (editForm.durationMinutes || 0) % 60;
                          setEditForm({ ...editForm, durationMinutes: (hrs * 60) + mins });
                        }}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-center font-bold text-gray-900"
                        placeholder="0"
                      />
                      <span className="text-xs font-bold text-gray-500 ml-1">hr</span>
                    </div>
                    <span className="text-gray-300 font-bold">:</span>
                    <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={(editForm.durationMinutes || 0) % 60}
                        onChange={(e) => {
                          const hrs = Math.floor((editForm.durationMinutes || 0) / 60);
                          const mins = parseInt(e.target.value) || 0;
                          setEditForm({ ...editForm, durationMinutes: (hrs * 60) + mins });
                        }}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-center font-bold text-gray-900"
                        placeholder="0"
                      />
                      <span className="text-xs font-bold text-gray-500 ml-1">min</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-400 mt-2">Leave fields empty to default to 0.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Passing Criteria (%) <span className="text-red-500">*</span></label>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all w-32">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editForm.passPercentage || 50}
                      onChange={(e) => setEditForm({ ...editForm, passPercentage: parseInt(e.target.value) || 0 })}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-center font-bold text-gray-900"
                    />
                    <span className="text-sm font-bold text-gray-500 ml-1">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduling & Access */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Calendar size={20} />
                </div>
                <h2 className="text-xl font-black text-gray-900">Scheduling & Access</h2>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3 text-sm text-bsg-blue">
                <span className="text-xl shrink-0">💡</span>
                <p className="font-medium mt-0.5">If you set a Start Date, the exam will automatically publish at that time and unpublish at the End Date — even if the exam is in Draft status.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Scheduled Start Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={editForm.scheduledStartDate ? new Date(new Date(editForm.scheduledStartDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditForm({ ...editForm, scheduledStartDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium text-sm"
                  />
                  <p className="text-xs font-medium text-gray-400 mt-1.5">Candidates cannot start before this time.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Scheduled End Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={editForm.scheduledEndDate ? new Date(new Date(editForm.scheduledEndDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditForm({ ...editForm, scheduledEndDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium text-sm"
                  />
                  <p className="text-xs font-medium text-gray-400 mt-1.5">Candidates cannot start after this time.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      checked={editForm.allowMultipleAttempts || false}
                      onChange={(e) => setEditForm({ ...editForm, allowMultipleAttempts: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600 transition-all"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">Allow Multiple Attempts</span>
                    <span className="block text-xs font-medium text-gray-500 mt-0.5">Candidates can take this exam more than once.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      checked={editForm.releaseResultsInstantly ?? true}
                      onChange={(e) => setEditForm({ ...editForm, releaseResultsInstantly: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600 transition-all"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">Release Results Instantly</span>
                    <span className="block text-xs font-medium text-gray-500 mt-0.5">If disabled, candidates will not see their scores until you release them.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      checked={editForm.issueCertificate || false}
                      onChange={(e) => setEditForm({ ...editForm, issueCertificate: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600 transition-all"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">Issue Certificate on Pass</span>
                    <span className="block text-xs font-medium text-gray-500 mt-0.5">Passing candidates will receive a downloadable certificate.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button 
                onClick={handleSaveBasicSettings}
                className="bg-bsg-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-bsg-blue-dark transition-colors shadow-sm flex items-center gap-2"
              >
                <Save size={18} /> Save Settings
              </button>
            </div>
          </div>
        )}

        {/* QUESTION MANAGER */}
        {activeTab === 'questions' && (
          <div className="max-w-5xl">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
              <h1 className="text-3xl font-black text-gray-900 shrink-0">Question Manager</h1>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 w-full xl:w-auto hide-scrollbar">
                <Link
                  href={`/examiner/exams/${examId}/print`}
                  className="bg-gray-800 text-white font-black px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors shadow-sm flex items-center gap-2 shrink-0 whitespace-nowrap"
                >
                  <FileText size={18} /> Print Master Paper
                </Link>
                {exam.questions.length > 0 && (
                  <button 
                    onClick={() => setShowDeleteAllModal(true)}
                    className="bg-red-500 text-white font-black px-4 py-2.5 rounded-xl hover:bg-red-600 transition-colors shadow-sm flex items-center gap-2 shrink-0 whitespace-nowrap"
                  >
                    <Trash2 size={18} /> Delete All
                  </button>
                )}
                <button 
                  onClick={() => setShowAiModal(true)}
                  className="bg-bsg-gold text-bsg-blue-dark font-black px-4 py-2.5 rounded-xl hover:bg-yellow-500 transition-colors shadow-sm flex items-center gap-2 shrink-0 whitespace-nowrap"
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
                      section: '',
                      marks: 1,
                      type: 'SingleChoice',
                      mediaUrl: '',
                      textHindi: '',
                      optionsHindi: ['', '', '', '']
                    });
                    setMediaFile(null);
                    setShowManualModal(true);
                  }}
                  className="bg-bsg-blue text-white font-black px-4 py-2.5 rounded-xl hover:bg-bsg-blue-dark transition-colors shadow-sm flex items-center gap-2 shrink-0 whitespace-nowrap"
                >
                  + Add Manual
                </button>
              </div>
            </div>

            {/* Category Filter */}
            {exam.questions.length > 0 && (
              <div className="mb-6 flex justify-end">
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-900 font-medium focus:border-bsg-blue outline-none"
                >
                  <option value="All">All Categories</option>
                  {Array.from(new Set(exam.questions.map(q => q.questionId.category).filter(Boolean))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

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
                {exam.questions
                  .filter(q => categoryFilter === 'All' || q.questionId.category === categoryFilter)
                  .map((q, idx) => (
                  <div key={q.questionId._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-lg bg-bsg-blue/10 text-bsg-blue font-black flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-gray-900 font-bold text-lg">
                            {language === 'hi' && q.questionId.textHindi ? q.questionId.textHindi : q.questionId.text}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {q.questionId.section && <span className="text-xs font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-md">Section: {q.questionId.section}</span>}
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-200 px-2 py-0.5 rounded-md">Category: {q.questionId.category || 'General'}</span>
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
                              section: q.questionId.section || '',
                              marks: q.marks || 1,
                              type: q.questionId.type || 'SingleChoice',
                              mediaUrl: q.questionId.mediaUrl || '',
                              textHindi: q.questionId.textHindi || '',
                              optionsHindi: q.questionId.optionsHindi?.length ? [...q.questionId.optionsHindi] : ['', '', '', '']
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
                    <div className="p-5">
                      {q.questionId.mediaUrl && (
                        <div className="mb-4 flex justify-center">
                          <img src={`${API_URL}${q.questionId.mediaUrl}`} alt="Question Media" className="max-h-48 max-w-full rounded-xl border border-gray-200 shadow-sm object-contain" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.questionId.options.map((opt: string, optIdx: number) => {
                          const displayOpt = language === 'hi' && q.questionId.optionsHindi && q.questionId.optionsHindi[optIdx] 
                                             ? q.questionId.optionsHindi[optIdx] 
                                             : opt;
                          return (
                            <div key={optIdx} className={`px-4 py-3 rounded-xl border-2 flex items-center gap-3 ${q.questionId.correctOptionIndex === optIdx ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white'}`}>
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${q.questionId.correctOptionIndex === optIdx ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {['A', 'B', 'C', 'D'][optIdx]}
                              </span>
                              <span className={`font-medium ${q.questionId.correctOptionIndex === optIdx ? 'text-green-900 font-bold' : 'text-gray-700'}`}>
                                {displayOpt}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANAND AI TAB */}
        {activeTab === 'anandai' && (
          <div className="max-w-5xl">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden relative">
              
              {/* Dynamic Motto Header */}
              <div className="bg-gradient-to-r from-bsg-blue-dark via-bsg-blue to-purple-800 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 blur-xl bg-white rounded-full translate-x-1/2 -translate-y-1/2 w-64 h-64"></div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-widest mb-2 relative z-10 drop-shadow-md">
                  {language === 'hi' ? 'सेवा' : 'SERVICE'}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-4 relative z-10">
                  <span className="text-xl">✨</span>
                  <h3 className="text-xl font-bold text-blue-100">Anand AI Auditor</h3>
                </div>
                <p className="text-blue-200 mt-2 max-w-xl mx-auto font-medium relative z-10">
                  Your smart assistant. Anand AI will scan your exam settings, schedule, and every single question to fix missing translations, correct broken text, and optimize configurations.
                </p>
              </div>

              <div className="p-8 md:p-12">
                {!isAuditing && !auditResults && (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <span className="text-4xl">🤖</span>
                    </div>
                    <h4 className="text-2xl font-black text-gray-900 mb-3">Ready to Audit?</h4>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                      Click below to let Anand AI deeply analyze your exam. This usually takes 10-20 seconds.
                    </p>
                    {anandError && <div className="mb-6 p-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 max-w-md mx-auto">{anandError}</div>}
                    <button 
                      onClick={handleAnandAiAudit}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-black px-10 py-4 rounded-full shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
                    >
                      Run Anand AI Audit
                    </button>
                  </div>
                )}

                {isAuditing && (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 mx-auto mb-6 relative">
                      <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                      <span className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">🤖</span>
                    </div>
                    
                    <h4 className="text-xl font-black text-purple-700 mb-2 transition-all duration-300">
                      {auditStatus}
                    </h4>
                    
                    <div className="w-full max-w-md mx-auto bg-gray-100 rounded-full h-4 mt-6 overflow-hidden border border-gray-200">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden" 
                        style={{ width: `${auditProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-[pulse_1s_ease-in-out_infinite]"></div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-400 mt-3">{Math.round(auditProgress)}% Complete</p>
                  </div>
                )}

                {auditResults && !isAuditing && (
                  <div className="animate-fade-in-up">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 flex gap-4 items-start">
                      <div className="text-green-500 bg-white p-2 rounded-full shadow-sm">
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-green-800 mb-1">Audit Complete</h4>
                        <p className="text-green-700 font-medium">{auditResults.generalFeedback}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      {auditResults.examUpdates && Object.keys(auditResults.examUpdates).length > 0 && (
                        <div>
                          <h5 className="font-black text-gray-900 mb-4 border-b pb-2">Exam Settings Fixes</h5>
                          <ul className="space-y-3">
                            {Object.entries(auditResults.examUpdates).map(([key, val]) => (
                              <li key={key} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-purple-600 uppercase block mb-1">{key}</span>
                                <span className="text-gray-800 font-medium">{val as string}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {auditResults.questionUpdates && auditResults.questionUpdates.length > 0 && (
                        <div>
                          <h5 className="font-black text-gray-900 mb-4 border-b pb-2">Question Fixes ({auditResults.questionUpdates.length})</h5>
                          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {auditResults.questionUpdates.map((q: any, idx: number) => (
                              <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-sm text-gray-800 font-bold mb-2 break-words line-clamp-2">EN: {q.text}</p>
                                <p className="text-sm text-gray-600 font-medium break-words line-clamp-2 border-t border-dashed border-gray-200 pt-2">HI: {q.textHindi}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center gap-4 border-t border-gray-100 pt-8">
                      <button 
                        onClick={() => setAuditResults(null)}
                        className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                        disabled={isApplyingFixes}
                      >
                        Discard
                      </button>
                      <button 
                        onClick={handleApplyAnandFixes}
                        disabled={isApplyingFixes}
                        className="bg-bsg-blue hover:bg-bsg-blue-dark text-white font-black px-10 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isApplyingFixes ? 'Applying...' : <><CheckCircle size={20} /> Accept & Apply All Fixes</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS TAB */}
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
                          await axios.put(`${API_URL}/api/exams/${examId}`, { releaseResultsInstantly: true }, { withCredentials: true });
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
                            {!exam?.releaseResultsInstantly && (
                              <button
                                onClick={async () => {
                                  try {
                                    await axios.put(`${API_URL}/api/attempts/results/${result._id}/release`, {}, { withCredentials: true });
                                    setResults(results.map(r => r._id === result._id ? { ...r, isReleased: !(r as any).isReleased } : r));
                                  } catch (err) {
                                    alert('Failed to toggle result release');
                                  }
                                }}
                                className={`font-black px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${(result as any).isReleased ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                              >
                                {(result as any).isReleased ? 'Released' : 'Unreleased'}
                              </button>
                            )}
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
                    ? Math.round(results.reduce((acc, curr) => acc + ((curr.score / curr.totalMarks) * 100 || 0), 0) / results.length) 
                    : 0}%
                </p>
              </div>
            </div>
            
            {results.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-black text-gray-900 mb-6">Score Distribution</h3>
                  <div className="h-[300px] w-full">
                    {(() => {
                      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } = require('recharts');
                      const distribution = [
                        { name: '0-20%', count: 0 },
                        { name: '21-40%', count: 0 },
                        { name: '41-60%', count: 0 },
                        { name: '61-80%', count: 0 },
                        { name: '81-100%', count: 0 }
                      ];
                      results.forEach(r => {
                        const pct = (r.score / r.totalMarks) * 100;
                        if (pct <= 20) distribution[0].count++;
                        else if (pct <= 40) distribution[1].count++;
                        else if (pct <= 60) distribution[2].count++;
                        else if (pct <= 80) distribution[3].count++;
                        else distribution[4].count++;
                      });
                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={distribution}>
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="count" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-black text-gray-900 mb-6">Pass vs Fail Ratio</h3>
                  <div className="h-[300px] w-full relative">
                    {(() => {
                      const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } = require('recharts');
                      const passed = results.filter(r => (r.score / r.totalMarks) * 100 >= (exam.passingMarks || 50)).length;
                      const failed = results.length - passed;
                      const data = [
                        { name: 'Passed', value: passed, color: '#10B981' }, // green-500
                        { name: 'Failed', value: failed, color: '#EF4444' }  // red-500
                      ];
                      
                      return (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                              >
                                {data.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-gray-900">{Math.round((passed / results.length) * 100)}%</span>
                            <span className="text-sm font-bold text-gray-400">Pass Rate</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-bold text-gray-600">Passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm font-bold text-gray-600">Failed</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-black text-gray-900 mb-6">Questions by Section</h3>
                  <div className="h-[300px] w-full relative">
                    {(() => {
                      const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = require('recharts');
                      const sectionsMap: Record<string, number> = {};
                      exam.questions?.forEach((q: any) => {
                        const sec = q.questionId?.section || 'General';
                        sectionsMap[sec] = (sectionsMap[sec] || 0) + 1;
                      });
                      
                      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
                      const data = Object.keys(sectionsMap).map((sec, i) => ({
                        name: sec,
                        value: sectionsMap[sec],
                        color: colors[i % colors.length]
                      }));

                      if (data.length === 0) {
                        return <div className="h-full flex items-center justify-center text-gray-400 font-bold">No sections defined</div>;
                      }
                      
                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              stroke="none"
                              labelLine={false}
                              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                return percent > 0.05 ? (
                                  <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                    {`${(percent * 100).toFixed(0)}%`}
                                  </text>
                                ) : null;
                              }}
                            >
                              {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-16 text-center text-gray-500">
                <BarChart2 size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="font-bold text-xl text-gray-900 mb-2">No Data Available</p>
                <p>Statistics will appear here once candidates complete the exam.</p>
              </div>
            )}
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
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-black text-gray-700">Question Text</label>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!('webkitSpeechRecognition' in window)) {
                        alert("Voice dictation is not supported in this browser. Please use Chrome.");
                        return;
                      }
                      const recognition = new (window as any).webkitSpeechRecognition();
                      recognition.lang = 'en-US';
                      recognition.interimResults = false;
                      recognition.onresult = (event: any) => {
                        const transcript = event.results[0][0].transcript;
                        setManualQuestion(prev => ({...prev, text: prev.text + (prev.text ? ' ' : '') + transcript}));
                      };
                      recognition.start();
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-bsg-blue hover:text-bsg-blue-dark bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Mic size={14} /> Dictate
                  </button>
                  <button 
                    type="button"
                    onClick={async () => {
                      if (!manualQuestion.text && !manualQuestion.textHindi) return;
                      
                      try {
                        // Detect if we should translate En -> Hi or Hi -> En
                        const isHiToEn = manualQuestion.textHindi && !manualQuestion.text;
                        const sourceLang = isHiToEn ? 'hi' : 'en';
                        const targetLang = isHiToEn ? 'en' : 'hi';
                        const sourceText = isHiToEn ? manualQuestion.textHindi : manualQuestion.text;

                        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(sourceText!)}`);
                        const data = await res.json();
                        const translatedText = data[0].map((item: any) => item[0]).join('');
                        
                        if (isHiToEn) {
                          setManualQuestion(prev => ({...prev, text: translatedText}));
                        } else {
                          setManualQuestion(prev => ({...prev, textHindi: translatedText}));
                        }
                        
                        if (manualQuestion.type !== 'Subjective') {
                          const sourceOptions = isHiToEn ? (manualQuestion.optionsHindi || []) : manualQuestion.options;
                          const translatedOptions = await Promise.all(sourceOptions.map(async (opt: string) => {
                             if (!opt) return '';
                             const oRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(opt)}`);
                             const oData = await oRes.json();
                             return oData[0].map((item: any) => item[0]).join('');
                          }));
                          
                          if (isHiToEn) {
                            setManualQuestion(prev => ({...prev, options: translatedOptions}));
                          } else {
                            setManualQuestion(prev => ({...prev, optionsHindi: translatedOptions}));
                          }
                        }
                      } catch (err) {
                        alert('Translation failed. Please try manually.');
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors ml-2 shadow-sm border border-green-200"
                  >
                    ⚡ Auto-Translate
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-bsg-blue mb-1 uppercase tracking-wider">English</label>
                    <textarea
                      value={manualQuestion.text}
                      onChange={(e) => setManualQuestion({...manualQuestion, text: e.target.value})}
                      className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-bsg-blue focus:ring-4 focus:ring-bsg-blue/10 outline-none resize-none"
                      rows={3}
                      placeholder="e.g., What is the capital of France?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-green-600 mb-1 uppercase tracking-wider">Hindi (Optional)</label>
                    <textarea
                      value={manualQuestion.textHindi || ''}
                      onChange={(e) => setManualQuestion({...manualQuestion, textHindi: e.target.value})}
                      className="w-full bg-green-50/30 border-2 border-green-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none resize-none"
                      rows={3}
                      placeholder="उदा., फ्रांस की राजधानी क्या है?"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Media Upload (Optional Image)</label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setMediaFile(e.target.files ? e.target.files[0] : null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full bg-gray-50 border-2 border-dashed ${mediaFile ? 'border-bsg-blue bg-blue-50' : 'border-gray-300 group-hover:border-bsg-blue group-hover:bg-blue-50'} rounded-xl px-4 py-6 text-center transition-all flex flex-col items-center justify-center`}>
                      <span className="text-3xl mb-2">{mediaFile ? '🖼️' : '📁'}</span>
                      <span className={`text-sm font-bold ${mediaFile ? 'text-bsg-blue' : 'text-gray-500 group-hover:text-bsg-blue'}`}>
                        {mediaFile ? mediaFile.name : 'Click or drag image to upload'}
                      </span>
                      {!mediaFile && <span className="text-xs text-gray-400 mt-1 font-medium">JPEG, PNG up to 5MB</span>}
                    </div>
                  </div>
                  {manualQuestion.mediaUrl && !mediaFile && (
                    <div className="mt-3 relative rounded-lg overflow-hidden border border-gray-200 inline-block max-w-[200px]">
                      <img src={manualQuestion.mediaUrl.startsWith('http') ? manualQuestion.mediaUrl : `${API_URL}${manualQuestion.mediaUrl}`} alt="Current Media" className="w-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate font-bold text-center">
                        Current Image
                      </div>
                    </div>
                  )}
                  {mediaFile && (
                    <div className="mt-3 relative rounded-lg overflow-hidden border border-gray-200 inline-block max-w-[200px]">
                      <img src={URL.createObjectURL(mediaFile)} alt="New Media" className="w-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-bsg-blue/80 text-white text-[10px] px-2 py-1 truncate font-bold text-center">
                        New Image
                      </div>
                    </div>
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
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOptionText(idx, e.target.value)}
                          className="flex-1 bg-transparent font-medium text-gray-900 outline-none py-1 border-b border-dashed border-gray-300 focus:border-bsg-blue"
                          placeholder={`Option (EN) ${idx + 1}`}
                        />
                        <input
                          type="text"
                          value={manualQuestion.optionsHindi?.[idx] || ''}
                          onChange={(e) => {
                            const newOptionsHi = [...(manualQuestion.optionsHindi || [])];
                            newOptionsHi[idx] = e.target.value;
                            setManualQuestion({...manualQuestion, optionsHindi: newOptionsHi});
                          }}
                          className="flex-1 bg-green-50/30 font-medium text-gray-900 outline-none py-1 border-b border-dashed border-green-300 focus:border-green-500"
                          placeholder={`Option (HI) ${idx + 1}`}
                        />
                      </div>
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
                disabled={isImporting}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-bsg-blue/10 file:text-bsg-blue hover:file:bg-bsg-blue/20 disabled:opacity-50"
              />
            </div>

            {isImporting && (
              <div className="mb-6">
                <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                  <span>Extracting & Translating...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                  <div 
                    className="bg-bsg-blue h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                    style={{ width: `${importProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center font-medium">Large documents with many questions take time. Please do not close this window.</p>
              </div>
            )}

            {aiError && !isImporting && <div className="mb-6 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{aiError}</div>}
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

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Delete All Questions?</h3>
            <p className="text-gray-500 font-medium mb-6">
              Are you absolutely sure you want to delete all {exam.questions.length} questions from this exam? 
              <strong className="block mt-2 text-red-500">This action cannot be undone!</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteAllModal(false)} 
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isDeletingAll}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAllQuestions} 
                disabled={isDeletingAll}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-black shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingAll ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
