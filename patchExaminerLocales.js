const fs = require('fs');

const enPath = 'src/translations/en.ts';
const hiPath = 'src/translations/hi.ts';

const extraEn = `
  // Examiner Dashboard
  "examinerPortal": "EXAMINER PORTAL",
  "welcomeExaminer": "Welcome",
  "newTest": "New Test",
  "totalTests": "TOTAL TESTS",
  "drafts": "DRAFTS",
  "myTests": "My Tests",
  "helpTutorials": "Help & Tutorials",
  "allStatus": "All Status",
  "newestFirst": "Newest First",
  "oldestFirst": "Oldest First",
  "manageTest": "Manage Test",
  "createNewExam": "Create New Exam",
  "examTitle": "Exam Title",
  "enterExamTitle": "Enter a title for this exam...",
  "cancel": "Cancel",
  "createExam": "Create Exam",
`;

const extraHi = `
  // Examiner Dashboard
  "examinerPortal": "परीक्षक पोर्टल",
  "welcomeExaminer": "स्वागत है",
  "newTest": "नया टेस्ट",
  "totalTests": "कुल टेस्ट",
  "drafts": "ड्राफ्ट",
  "myTests": "मेरे टेस्ट",
  "helpTutorials": "सहायता और ट्यूटोरियल",
  "allStatus": "सभी स्थिति",
  "newestFirst": "सबसे नए पहले",
  "oldestFirst": "सबसे पुराने पहले",
  "manageTest": "टेस्ट प्रबंधित करें",
  "createNewExam": "नई परीक्षा बनाएँ",
  "examTitle": "परीक्षा का शीर्षक",
  "enterExamTitle": "इस परीक्षा के लिए एक शीर्षक दर्ज करें...",
  "cancel": "रद्द करें",
  "createExam": "परीक्षा बनाएँ",
`;

function patchLocales() {
  let en = fs.readFileSync(enPath, 'utf8');
  let hi = fs.readFileSync(hiPath, 'utf8');

  en = en.replace('};', extraEn + '\n};');
  hi = hi.replace('};', extraHi + '\n};');

  fs.writeFileSync(enPath, en);
  fs.writeFileSync(hiPath, hi);
  console.log('Locales patched successfully for Examiner Dashboard.');
}

patchLocales();
