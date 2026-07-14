'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations
const en = {
  translation: {
    dashboard: "Candidate Dashboard",
    availableExams: "Available Exams",
    pastResults: "Past Results",
    startExam: "Start Exam",
    timeRemaining: "Time Remaining",
    submitExam: "Submit Exam",
    markForReview: "Mark for Review",
    clearResponse: "Clear Response",
    nextQuestion: "Next Question",
    previousQuestion: "Previous Question",
    examInstructions: "Please read the instructions carefully before starting the exam.",
    warning: "Warning! Do not switch tabs or exit fullscreen.",
  }
};

// Hindi translations
const hi = {
  translation: {
    dashboard: "उम्मीदवार डैशबोर्ड",
    availableExams: "उपलब्ध परीक्षाएं",
    pastResults: "पिछले परिणाम",
    startExam: "परीक्षा शुरू करें",
    timeRemaining: "शेष समय",
    submitExam: "परीक्षा जमा करें",
    markForReview: "समीक्षा के लिए चिह्नित करें",
    clearResponse: "उत्तर हटाएं",
    nextQuestion: "अगला प्रश्न",
    previousQuestion: "पिछला प्रश्न",
    examInstructions: "कृपया परीक्षा शुरू करने से पहले निर्देशों को ध्यान से पढ़ें।",
    warning: "चेतावनी! टैब न बदलें या फ़ुलस्क्रीन से बाहर न निकलें।",
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      hi
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already safes from XSS
    }
  });

export default i18n;
