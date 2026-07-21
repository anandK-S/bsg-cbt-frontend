const fs = require('fs');

const enPath = 'src/translations/en.ts';
const hiPath = 'src/translations/hi.ts';

const extraEn = `
  // Live Monitoring
  "liveMonitoringTitle": "Live Monitoring",
  "liveMonitoringDesc": "Real-time candidate activity tracking",
  "cancelAllActive": "Cancel All Active",
  "liveSessions": "Live Sessions",
  "activeNow": "Active Now",
  "warnings": "Warnings",
  "autoRefreshing": "Auto-refreshing every 10s",
  "lastCheck": "Last check:",
  "forceRefresh": "Force Refresh",
  "noActiveCandidates": "No Active Candidates",
  "noActiveCandidatesDesc": "No candidates are currently taking your exams. Sessions appear here automatically once they start.",
  "checkAgain": "Check Again",
  "statusLive": "Status",
  "lastPing": "Last Ping",
  "cancelExam": "Cancel Exam",
  "connectingLiveFeed": "Connecting to live feed...",
  "offline": "Offline",
  "active": "Active",
  "blocked": "Blocked",
  "completed": "Completed"
`;

const extraHi = `
  // Live Monitoring
  "liveMonitoringTitle": "लाइव मॉनिटरिंग",
  "liveMonitoringDesc": "वास्तविक समय के उम्मीदवार गतिविधि ट्रैकिंग",
  "cancelAllActive": "सभी सक्रिय रद्द करें",
  "liveSessions": "लाइव सत्र",
  "activeNow": "अभी सक्रिय",
  "warnings": "चेतावनी",
  "autoRefreshing": "प्रत्येक 10 सेकंड में ऑटो-रिफ्रेश हो रहा है",
  "lastCheck": "अंतिम जांच:",
  "forceRefresh": "बलपूर्वक रीफ़्रेश करें",
  "noActiveCandidates": "कोई सक्रिय उम्मीदवार नहीं",
  "noActiveCandidatesDesc": "वर्तमान में कोई भी उम्मीदवार आपकी परीक्षा नहीं दे रहा है। शुरू होने के बाद सत्र यहाँ स्वचालित रूप से दिखाई देते हैं।",
  "checkAgain": "फिर से जांचें",
  "statusLive": "स्थिति",
  "lastPing": "अंतिम पिंग",
  "cancelExam": "परीक्षा रद्द करें",
  "connectingLiveFeed": "लाइव फ़ीड से कनेक्ट हो रहा है...",
  "offline": "ऑफ़लाइन",
  "active": "सक्रिय",
  "blocked": "अवरुद्ध",
  "completed": "पूरा हुआ"
`;

function patchLocales() {
  let en = fs.readFileSync(enPath, 'utf8');
  let hi = fs.readFileSync(hiPath, 'utf8');

  en = en.replace('};', extraEn + '\n};');
  hi = hi.replace('};', extraHi + '\n};');

  fs.writeFileSync(enPath, en);
  fs.writeFileSync(hiPath, hi);
  console.log('Locales patched successfully for Live Monitoring.');
}

patchLocales();
