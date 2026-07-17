'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    platformName: 'BSG Portal',
    supportEmail: 'support@bsg-india.org',
    maintenanceMode: false,
    termsUrl: '',
    privacyUrl: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/settings`);
        setSettings({
          platformName: data.platformName || 'BSG Portal',
          supportEmail: data.supportEmail || 'support@bsg-india.org',
          maintenanceMode: data.maintenanceMode || false,
          termsUrl: data.termsUrl || '',
          privacyUrl: data.privacyUrl || ''
        });
      } catch (error) {
        console.error('Failed to load settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await axios.put(`${API_URL}/api/settings`, settings, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to update settings', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen text="Loading Settings..." />;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-bsg-blue" />
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Portal Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage global configuration for the BSG platform.</p>
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
                value={settings.platformName}
                onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                className="w-full sm:max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-shadow outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Support Email</label>
              <input 
                type="email" 
                value={settings.supportEmail}
                onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                className="w-full sm:max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-shadow outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Terms & Conditions URL</label>
              <input 
                type="url" 
                placeholder="https://"
                value={settings.termsUrl}
                onChange={(e) => setSettings({...settings, termsUrl: e.target.value})}
                className="w-full sm:max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-shadow outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Privacy Policy URL</label>
              <input 
                type="url" 
                placeholder="https://"
                value={settings.privacyUrl}
                onChange={(e) => setSettings({...settings, privacyUrl: e.target.value})}
                className="w-full sm:max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-shadow outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  className="w-4 h-4 text-bsg-blue border-gray-300 rounded focus:ring-bsg-blue" 
                />
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
