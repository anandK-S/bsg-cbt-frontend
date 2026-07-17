'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl p-8 sm:p-12 border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <ShieldCheck className="w-12 h-12 text-bsg-blue" />
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Privacy Policy</h1>
        </div>

        <div className="space-y-6 text-gray-600 font-medium leading-relaxed">
          <p>Your privacy and data security are our top priority at the Bharat Scouts and Guides (BSG) Computer Based Test (CBT) Portal.</p>
          
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Information Collection</h2>
          <p>We only collect information necessary for the administration of the CBT exams, such as your BSG ID, Name, Section, and District. This ensures you are eligible for the specific examination.</p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Examination Monitoring</h2>
          <p>During examinations, we monitor browser activity strictly to ensure test integrity. This includes tracking if you leave the exam window, switch tabs, or attempt to copy/paste text. All such activities are recorded for anti-cheat purposes.</p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Data Security</h2>
          <p>Passwords are securely hashed. We do not share your personal information with any third parties outside of the BSG administration.</p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Contact Us</h2>
          <p>If you have any questions regarding this Privacy Policy, please contact your examiner or the platform administration team.</p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link href="/" className="inline-flex items-center gap-2 text-bsg-blue hover:text-blue-800 font-bold transition-colors">
            <ArrowLeft size={20} /> Return to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
