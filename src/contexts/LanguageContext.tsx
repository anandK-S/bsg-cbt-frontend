'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../translations/en';
import { hi } from '../translations/hi';

type Language = 'en' | 'hi';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
  hasSelectedLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setIsClient(true);
    const storedLang = localStorage.getItem('bsg_language') as Language;
    if (storedLang === 'en' || storedLang === 'hi') {
      setLanguageState(storedLang);
      setHasSelectedLanguage(true);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setHasSelectedLanguage(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bsg_language', lang);
    }
  };

  const t = (key: keyof Translations): string => {
    if (!isClient) return en[key] || key; // Default to English for SSR
    
    const dictionary = language === 'hi' ? hi : en;
    return dictionary[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, hasSelectedLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
