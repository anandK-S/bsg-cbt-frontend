const fs = require('fs');
const filePath = 'src/app/exams/[id]/take/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  { old: '>Time Left<', new: '>{t("timeLeft")}<' },
  { old: 'Question No. ', new: '{t("questionNo")} ' },
  { old: 'Section: ', new: '{t("section")}: ' },
  { old: 'Marks: ', new: '{t("marks")}: ' },
  { old: 'Type: ', new: '{t("type")}: ' },
  { old: '>Question Palette<', new: '>{t("questionPalette")}<' },
  { old: '>Not Visited<', new: '>{t("notVisited")}<' },
  { old: '>Not Answered<', new: '>{t("notAnswered")}<' },
  { old: '>Answered<', new: '>{t("answered")}<' },
  { old: '>Marked for Review<', new: '>{t("markedForReview")}<' },
  { old: '>Answered & Marked for Review (will be considered for evaluation)<', new: '>{t("answeredAndMarked")} (will be considered for evaluation)<' },
  { old: 'placeholder={language === \\'hi\\' ? "अपना उत्तर यहाँ लिखें..." : "Type your answer here..."}', new: 'placeholder={t("typeYourAnswer")}' },
  { old: 'Security Warning', new: '{t("securityWarning")}' },
  { old: 'Resume Exam & Fullscreen', new: '{t("resumeExam")}' }
];

replacements.forEach(({ old, new: replacement }) => {
  content = content.replace(old, replacement);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully patched take/page.tsx with global LanguageContext translations');
