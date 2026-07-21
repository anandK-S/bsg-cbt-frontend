const fs = require('fs');

const enPath = 'src/translations/en.ts';
const hiPath = 'src/translations/hi.ts';

const extraEn = `
  // Candidate Dashboard
  "welcome": "Welcome",
  "id": "ID",
  "dist": "Dist",
  "availableExams": "Available Exams",
  "new": "New",
  "searchExams": "Search exams...",
  "allCategories": "All Categories",
  "allExaminers": "All Examiners",
  "youreAllCaughtUp": "You're all caught up!",
  "noNewExams": "There are no new exams assigned to you at the moment.",
  "mins": "mins",
  "noDescription": "No description provided.",
  "createdBy": "Created By:",
  "unknownExaminer": "Unknown Examiner",
  "scheduledFor": "Scheduled For:",
  "published": "Published:",
  "qs": "Qs",
  "testIsClosed": "Test is Closed",
  "startsSoon": "Starts Soon - View Timer",
  "startExamNow": "Start Exam Now",
  "general": "General",
`;

const extraHi = `
  // Candidate Dashboard
  "welcome": "स्वागत है",
  "id": "आईडी",
  "dist": "जिला",
  "availableExams": "उपलब्ध परीक्षाएं",
  "new": "नई",
  "searchExams": "परीक्षाएं खोजें...",
  "allCategories": "सभी श्रेणियां",
  "allExaminers": "सभी परीक्षक",
  "youreAllCaughtUp": "आपने सब पूरा कर लिया है!",
  "noNewExams": "इस समय आपको कोई नई परीक्षा नहीं सौंपी गई है।",
  "mins": "मिनट",
  "noDescription": "कोई विवरण नहीं दिया गया।",
  "createdBy": "निर्माता:",
  "unknownExaminer": "अज्ञात परीक्षक",
  "scheduledFor": "निर्धारित समय:",
  "published": "प्रकाशित:",
  "qs": "प्रश्न",
  "testIsClosed": "परीक्षण बंद है",
  "startsSoon": "जल्द शुरू होगा - टाइमर देखें",
  "startExamNow": "अभी परीक्षा शुरू करें",
  "general": "सामान्य",
`;

let enContent = fs.readFileSync(enPath, 'utf8');
enContent = enContent.replace('};', extraEn + '};');
fs.writeFileSync(enPath, enContent);

let hiContent = fs.readFileSync(hiPath, 'utf8');
hiContent = hiContent.replace('};', extraHi + '};');
fs.writeFileSync(hiPath, hiContent);

console.log("Dictionaries updated");
