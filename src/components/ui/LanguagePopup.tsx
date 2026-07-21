'use client';

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Languages, Globe } from 'lucide-react';

export default function LanguagePopup() {
  const { hasSelectedLanguage, setLanguage, t } = useLanguage();

  if (hasSelectedLanguage) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative text-center border border-gray-100 animate-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-black text-gray-900 mb-2">{t('selectLanguage')}</h2>
        <p className="text-gray-500 mb-8 font-medium">{t('selectLanguageDesc')}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setLanguage('en')}
            className="relative flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-2xl hover:border-bsg-blue hover:bg-gradient-to-br hover:from-blue-50 hover:to-white hover:shadow-lg transition-all active:scale-95 group overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-bsg-blue/5 rounded-full blur-xl group-hover:bg-bsg-blue/10 transition-all"></div>
            <span className="text-3xl font-black text-gray-300 group-hover:text-bsg-blue mb-3 transition-colors">A</span>
            <span className="font-extrabold text-gray-700 group-hover:text-bsg-blue transition-colors">English</span>
          </button>
          
          <button
            onClick={() => setLanguage('hi')}
            className="relative flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-2xl hover:border-bsg-blue hover:bg-gradient-to-br hover:from-blue-50 hover:to-white hover:shadow-lg transition-all active:scale-95 group overflow-hidden"
          >
            <div className="absolute top-0 left-0 -ml-4 -mt-4 w-16 h-16 bg-bsg-blue/5 rounded-full blur-xl group-hover:bg-bsg-blue/10 transition-all"></div>
            <span className="text-3xl font-black text-gray-300 group-hover:text-bsg-blue mb-3 transition-colors">अ</span>
            <span className="font-extrabold text-gray-700 group-hover:text-bsg-blue transition-colors">हिंदी</span>
          </button>
        </div>
      </div>
    </div>
  );
}
