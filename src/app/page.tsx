'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-bsg-blue text-white py-20 text-center px-4">
        <div className="max-w-4xl mx-auto">
          {/* Mock Logo Space */}
          <div className="w-24 h-24 bg-bsg-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 border-white">
            <span className="text-bsg-blue font-bold text-3xl">BSG</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Bharat Scouts and Guides (BSG)
          </h1>
          <p className="text-xl md:text-2xl text-bsg-gold font-semibold mb-8">
            Computer Based Test (CBT) Portal
          </p>
          <p className="text-md md:text-lg max-w-2xl mx-auto text-gray-200 mb-10 leading-relaxed">
            Welcome to the official online examination platform for BSG proficiency badges and certification exams. Secure, robust, and accessible.
          </p>
          
          <div className="flex justify-center gap-4">
            <Link 
              href="/login" 
              className="bg-bsg-gold text-bsg-blue hover:bg-bsg-gold-light font-bold px-8 py-3 rounded-lg shadow-md transition-colors"
            >
              Sign In to Exam
            </Link>
            <Link 
              href="/register" 
              className="bg-transparent border-2 border-white hover:bg-white hover:text-bsg-blue text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Register Candidate
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="max-w-7xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="text-3xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-bsg-blue mb-2">Anti-Cheat Tech</h3>
          <p className="text-gray-600 text-sm">
            Enforced fullscreen, copy/paste prevention, and tab-switching monitoring to ensure clean exams.
          </p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="text-3xl mb-4">📶</div>
          <h3 className="text-xl font-bold text-bsg-blue mb-2">Offline Resilient</h3>
          <p className="text-gray-600 text-sm">
            Saves state instantly using IndexedDB. If the browser crashes, you can resume exactly where you left off.
          </p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="text-3xl mb-4">🧠</div>
          <h3 className="text-xl font-bold text-bsg-blue mb-2">AI-Powered Feedback</h3>
          <p className="text-gray-600 text-sm">
            Receive detailed, qualitative reports from our Google Gemini tutor after submitting your test.
          </p>
        </div>
      </section>
    </div>
  );
}
