'use client';

import { useState } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-bsg-blue" />
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Portal Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage global configuration for the CBT platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">General Preferences</h2>
          <p className="text-sm text-gray-500">Update system-wide settings.</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Platform Name</label>
              <input 
                type="text" 
                defaultValue="BSG CBT Portal"
                className="w-full sm:max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-shadow outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Support Email</label>
              <input 
                type="email" 
                defaultValue="support@bsg-india.org"
                className="w-full sm:max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-shadow outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-bsg-blue border-gray-300 rounded focus:ring-bsg-blue" />
                <span className="text-sm font-medium text-gray-700">Enable Maintenance Mode</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">If enabled, candidates will not be able to log in or start exams.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            {saved ? (
              <span className="text-green-600 font-medium text-sm flex items-center gap-1">
                <AlertCircle size={16} /> Settings saved successfully
              </span>
            ) : (
              <span></span>
            )}
            
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center gap-2 bg-bsg-blue hover:bg-blue-800 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save size={18} /> Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
