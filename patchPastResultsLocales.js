const fs = require('fs');

const enPath = 'src/translations/en.ts';
const hiPath = 'src/translations/hi.ts';

const extraEn = `
  // Past Results
  "pastResultsDesc": "Review your completed examinations and feedback.",
  "filters": "Filters",
  "status": "Status",
  "allResults": "All Results",
  "passedOnly": "Passed Only",
  "failedOnly": "Failed Only",
  "disqualifiedOnly": "Disqualified Only",
  "examiner": "Examiner",
  "date": "Date",
  "clearFilters": "Clear Filters",
  "noResultsYet": "No Results Yet",
  "noResultsDesc": "You haven't completed any exams. Check your dashboard for available exams.",
  "goToDashboard": "Go to Dashboard",
  "unknownExam": "Unknown Exam",
  "timeTaken": "Time Taken",
  "disqualified": "DISQUALIFIED",
  "passed": "PASSED",
  "failed": "FAILED",
  "downloadCertificate": "Download Certificate",
  "viewFeedback": "View Feedback",
`;

const extraHi = `
  // Past Results
  "pastResultsDesc": "अपनी पूर्ण परीक्षाओं और फीडबैक की समीक्षा करें।",
  "filters": "फ़िल्टर",
  "status": "स्थिति",
  "allResults": "सभी परिणाम",
  "passedOnly": "केवल उत्तीर्ण",
  "failedOnly": "केवल अनुत्तीर्ण",
  "disqualifiedOnly": "केवल अयोग्य",
  "examiner": "परीक्षक",
  "date": "दिनांक",
  "clearFilters": "फ़िल्टर साफ़ करें",
  "noResultsYet": "अभी कोई परिणाम नहीं",
  "noResultsDesc": "आपने कोई परीक्षा पूरी नहीं की है। उपलब्ध परीक्षाओं के लिए अपना डैशबोर्ड जांचें।",
  "goToDashboard": "डैशबोर्ड पर जाएं",
  "unknownExam": "अज्ञात परीक्षा",
  "timeTaken": "लिया गया समय",
  "disqualified": "अयोग्य",
  "passed": "उत्तीर्ण",
  "failed": "अनुत्तीर्ण",
  "downloadCertificate": "प्रमाणपत्र डाउनलोड करें",
  "viewFeedback": "फ़ीडबैक देखें",
`;

let enContent = fs.readFileSync(enPath, 'utf8');
enContent = enContent.replace('};', extraEn + '};');
fs.writeFileSync(enPath, enContent);

let hiContent = fs.readFileSync(hiPath, 'utf8');
hiContent = hiContent.replace('};', extraHi + '};');
fs.writeFileSync(hiPath, hiContent);

console.log("Dictionaries updated");
