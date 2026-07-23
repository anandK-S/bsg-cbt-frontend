'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import Link from 'next/link';
import { ArrowLeft, Clock, Target, Calendar, Award, Users, BookOpen, ChevronRight } from 'lucide-react';

export default function CreateExam() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [presetCategory, setPresetCategory] = useState('General');
  const [durationHours, setDurationHours] = useState<number | ''>('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [durationSeconds, setDurationSeconds] = useState<number | ''>('');
  const [passingMarks, setPassingMarks] = useState<number | ''>(50);
  const [passingCriteriaType, setPassingCriteriaType] = useState<'percentage' | 'marks'>('percentage');
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(false);
  const [releaseResultsInstantly, setReleaseResultsInstantly] = useState(false);
  const [issueCertificate, setIssueCertificate] = useState(false);
  const [testKey, setTestKey] = useState('');
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [scheduledEndDate, setScheduledEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        `${API_URL}/api/exams`,
        { 
          title, 
          description,
          category,
          durationMinutes: Math.ceil(totalSeconds / 60),
          durationSeconds: totalSeconds,
          passingMarks,
          passingCriteriaType,
          allowMultipleAttempts,
          releaseResultsInstantly,
          issueCertificate,
          testKey: testKey || undefined,
          scheduledStartDate: scheduledStartDate || undefined,
          scheduledEndDate: scheduledEndDate || undefined
        },
        { withCredentials: true }
      );
      router.push(`/examiner/exams/${data._id}`);
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) => (
    <button
      type="button"
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:ring-offset-2 ${checked ? 'bg-bsg-blue' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  const SectionHeader = ({ icon: Icon, title, color = 'text-bsg-blue', bg = 'bg-blue-50' }: any) => (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
        <Icon size={18} className={color} />
      </div>
      <h3 className="text-base font-extrabold text-gray-900">{title}</h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 relative py-8 px-4 sm:px-6 lg:px-8">
      {/* Background orbs */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bsg-blue/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-20 right-0 w-72 h-72 bg-bsg-gold/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-56 h-56 bg-bsg-blue-light/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Back link */}
        <Link href="/examiner" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="bg-gradient-to-br from-bsg-blue to-bsg-blue-dark rounded-2xl p-6 sm:p-8 mb-6 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-bsg-gold opacity-20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">Create New Exam</h1>
            <p className="text-blue-100 font-medium text-sm sm:text-base">Set up the parameters for your new assessment.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── General Information ── */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-6 ring-1 ring-black/5">
            <SectionHeader icon={BookOpen} title="General Information" />
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-1.5">
                  Exam Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Rajya Puraskar Mock Test 2026"
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-all bg-gray-50"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a brief description or instructions for the candidates..."
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-all resize-y bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <select
                    value={presetCategory}
                    onChange={(e) => {
                      setPresetCategory(e.target.value);
                      if (e.target.value !== 'Custom') setCategory(e.target.value);
                      else setCategory('');
                    }}
                    className="w-1/2 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-all bg-gray-50"
                  >
                    <option value="General">General</option>
                    <option value="Pravesh">Pravesh</option>
                    <option value="Pratham Sopan">Pratham Sopan</option>
                    <option value="Dwitiya Sopan">Dwitiya Sopan</option>
                    <option value="Tritiya Sopan">Tritiya Sopan</option>
                    <option value="Rajya Puraskar">Rajya Puraskar</option>
                    <option value="Rashtrapati">Rashtrapati</option>
                    <option value="Custom">Custom...</option>
                  </select>
                  <input
                    type="text"
                    required
                    disabled={presetCategory !== 'Custom'}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder={presetCategory === 'Custom' ? 'Enter custom category' : 'Selected above'}
                    className="w-1/2 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-all bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Timing & Scoring ── */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-6 ring-1 ring-black/5">
            <SectionHeader icon={Clock} title="Timing & Scoring" color="text-purple-600" bg="bg-purple-50" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Duration <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-base font-bold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-all bg-gray-50"
                    />
                    <span className="absolute right-4 top-3.5 text-sm text-gray-400 font-bold">hr</span>
                  </div>
                  <span className="text-gray-300 font-bold text-xl">:</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-base font-bold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-all bg-gray-50"
                    />
                    <span className="absolute right-3 top-3.5 text-sm text-gray-400 font-bold">min</span>
                  </div>
                  <span className="text-gray-300 font-bold text-xl">:</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-base font-bold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-all bg-gray-50"
                    />
                    <span className="absolute right-3 top-3.5 text-sm text-gray-400 font-bold">sec</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400 font-medium">Leave fields empty to default to 0.</p>
              </div>

              <div>
                <label htmlFor="passingMarks" className="block text-sm font-bold text-gray-700 mb-2">
                  Passing Criteria <span className="text-red-500">*</span>
                </label>
                <div className="flex relative bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-bsg-blue/50 focus-within:border-bsg-blue transition-all overflow-hidden">
                  <input
                    type="number"
                    id="passingMarks"
                    required
                    min="1"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="50"
                    className="w-full py-3 px-4 text-base font-bold text-gray-900 text-center bg-transparent focus:outline-none"
                  />
                  <div className="border-l border-gray-200 flex items-center">
                    <select
                      value={passingCriteriaType}
                      onChange={(e) => setPassingCriteriaType(e.target.value as 'percentage' | 'marks')}
                      className="h-full bg-gray-50 py-3 pl-3 pr-8 text-sm font-bold text-gray-600 focus:outline-none appearance-none cursor-pointer"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.2rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                    >
                      <option value="percentage">%</option>
                      <option value="marks">Marks</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Scheduling ── */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-6 ring-1 ring-black/5">
            <SectionHeader icon={Calendar} title="Scheduling & Access" color="text-green-600" bg="bg-green-50" />
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-bsg-blue font-medium">
              💡 If you set a Start Date, the exam will <strong>automatically publish</strong> at that time and <strong>unpublish</strong> at the End Date — even if the exam is in Draft status.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label htmlFor="startDate" className="block text-sm font-bold text-gray-700 mb-1.5">
                  Scheduled Start Date <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={scheduledStartDate ? (() => { const dateStr = scheduledStartDate.includes('Z') || scheduledStartDate.includes('+') ? scheduledStartDate : scheduledStartDate + 'Z'; const d = new Date(new Date(dateStr).getTime() + (5.5 * 60 * 60 * 1000)); const p = (n: number) => n.toString().padStart(2, '0'); return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`; })() : ''}
                  onChange={(e) => setScheduledStartDate(e.target.value ? new Date(e.target.value + "+05:30").toISOString() : '')}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-all bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1">Candidates cannot start before this time.</p>
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-bold text-gray-700 mb-1.5">
                  Scheduled End Date <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={scheduledEndDate ? (() => { const dateStr = scheduledEndDate.includes('Z') || scheduledEndDate.includes('+') ? scheduledEndDate : scheduledEndDate + 'Z'; const d = new Date(new Date(dateStr).getTime() + (5.5 * 60 * 60 * 1000)); const p = (n: number) => n.toString().padStart(2, '0'); return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`; })() : ''}
                  onChange={(e) => setScheduledEndDate(e.target.value ? new Date(e.target.value + "+05:30").toISOString() : '')}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-all bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1">Candidates cannot start after this time.</p>
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="testKey" className="block text-sm font-bold text-gray-700 mb-1.5">
                Test Key / Password <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                id="testKey"
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                placeholder="Enter a password if you want to restrict access"
                className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-bsg-blue/50 focus:border-bsg-blue transition-all bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">If set, candidates must enter this exact password to start the exam.</p>
            </div>

            {/* Toggle options */}
            <div className="space-y-3">
              {[
                {
                  id: 'allowMultiple',
                  label: 'Allow Multiple Attempts',
                  desc: 'Candidates can take this exam more than once.',
                  checked: allowMultipleAttempts,
                  onChange: setAllowMultipleAttempts,
                  icon: Users,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  id: 'releaseInstantly',
                  label: 'Release Results Instantly',
                  desc: 'If disabled, candidates will not see their scores until you release them.',
                  checked: releaseResultsInstantly,
                  onChange: setReleaseResultsInstantly,
                  icon: Target,
                  color: 'text-green-600',
                  bg: 'bg-green-50',
                },
                {
                  id: 'issueCertificate',
                  label: 'Issue Certificate on Pass',
                  desc: 'Passing candidates will receive a downloadable certificate.',
                  checked: issueCertificate,
                  onChange: setIssueCertificate,
                  icon: Award,
                  color: 'text-bsg-gold',
                  bg: 'bg-amber-50',
                },
              ].map(opt => (
                <div key={opt.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${opt.bg} rounded-xl flex items-center justify-center`}>
                      <opt.icon size={16} className={opt.color} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={opt.checked} onChange={opt.onChange} id={opt.id} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Footer Actions ── */}
          <div className="flex flex-col sm:flex-row gap-3 pb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="sm:w-auto px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-bsg-gold hover:bg-yellow-500 text-bsg-blue-dark font-extrabold py-3 px-8 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-bsg-blue-dark border-t-transparent rounded-full animate-spin"></span>
                  Creating...
                </>
              ) : (
                <>
                  Create Exam & Continue
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
