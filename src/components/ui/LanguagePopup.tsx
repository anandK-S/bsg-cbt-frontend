'use client';

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

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
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-2xl hover:border-bsg-blue hover:bg-blue-50 transition-all active:scale-95 group"
          >
            <span className="text-4xl mb-3">🇬🇧</span>
            <span className="font-extrabold text-gray-900 group-hover:text-bsg-blue">English</span>
          </button>
          
          <button
            onClick={() => setLanguage('hi')}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-2xl hover:border-bsg-blue hover:bg-blue-50 transition-all active:scale-95 group"
          >
            <span className="text-4xl mb-3">🇮🇳</span>
            <span className="font-extrabold text-gray-900 group-hover:text-bsg-blue">हिंदी</span>
          </button>
        </div>
      </div>
    </div>
  );
}
