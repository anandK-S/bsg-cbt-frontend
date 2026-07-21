const fs = require('fs');
const filePath = 'src/app/exams/[id]/take/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import useLanguage
const importAuthStore = `import { useAuthStore } from '@/store/useAuthStore';`;
const addImport = `import { useAuthStore } from '@/store/useAuthStore';\nimport { useLanguage } from '@/contexts/LanguageContext';`;
content = content.replace(importAuthStore, addImport);

// 2. Replace local language state with useLanguage
const localLangState = `const [language, setLanguage] = useState<'en' | 'hi'>('en');`;
const globalLangState = `const { language, setLanguage, t } = useLanguage();`;
content = content.replace(localLangState, globalLangState);

// 3. Update the static strings using t()
const replacements = [
  { old: 'Previous', new: '{t("previous")}' },
  { old: 'Clear Response', new: '{t("clearResponse")}' },
  { old: 'Mark for Review & Next', new: '{t("markForReview")}' },
  { old: "currentQuestionIndex === questions.length - 1 ? 'Save & Submit' : 'Save & Next'", new: 'currentQuestionIndex === questions.length - 1 ? t("saveAndSubmit") : t("saveAndNext")' },
  { old: '>Time Left<', new: '>{t("timeLeft")}<' },
  { old: 'Question No. ', new: '{t("questionNo")} ' },
  { old: 'Section: ', new: '{t("section")}: ' },
  { old: 'Marks: ', new: '{t("marks")}: ' },
  { old: 'Type: ', new: '{t("type")}: ' },
  { old: '>Question Palette<', new: '>{t("questionPalette")}<' },
  { old: 'Not Visited', new: '{t("notVisited")}' },
  { old: 'Not Answered', new: '{t("notAnswered")}' },
  { old: '>Answered<', new: '>{t("answered")}<' },
  { old: 'Marked for Review', new: '{t("markedForReview")}' },
  { old: 'Answered & Marked for Review (will be considered for evaluation)', new: '{t("answeredAndMarked")} (will be considered for evaluation)' },
  { old: 'placeholder={language === \\'hi\\' ? "अपना उत्तर यहाँ लिखें..." : "Type your answer here..."}', new: 'placeholder={t("typeYourAnswer")}' },
  { old: "isSubmitting ? 'Submitting...' : 'Submit'", new: 'isSubmitting ? t("submitting") : t("submit")' },
  { old: 'Security Warning', new: '{t("securityWarning")}' },
  { old: 'Resume Exam & Fullscreen', new: '{t("resumeExam")}' }
];

replacements.forEach(({ old, new: replacement }) => {
  content = content.replace(old, replacement);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully patched take/page.tsx with global LanguageContext translations');
