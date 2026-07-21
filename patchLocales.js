const fs = require('fs');

const enPath = 'src/translations/en.ts';
const hiPath = 'src/translations/hi.ts';

const extraEn = `
  // Landing Page
  "welcomeTo": "Welcome to the",
  "bsgPortal": "BSG Portal",
  "landingDesc": "The official, highly secure examination portal engineered specifically for Bharat Scout & Guide testing.",
  "startExamination": "Start Examination",
  "candidateRegistration": "Candidate Registration",
  "secureExamination": "Secure Examination",
  "secureExamDesc": "Strict monitoring during BSG exam to maintain highest integrity.",
  "reliableOffline": "Reliable & Offline-Safe",
  "reliableOfflineDesc": "Data is auto-saved locally ensuring uninterrupted Bharat Scout and Guide tests.",
  "instantInsights": "Instant Insights",
  "instantInsightsDesc": "Get immediate scoring and detailed feedback on BSG exam performance.",
  "developerArchitect": "Developer & Architect",
  "termsConditions": "Terms & Conditions",
  "privacyPolicy": "Privacy Policy",
  "signIn": "Sign In",
  
  // Login Page
  "welcomeBack": "Welcome Back!",
  "signInToAccount": "Sign in to your account to continue",
  "emailAddress": "Email Address",
  "enterEmail": "Enter your email",
  "password": "Password",
  "enterPassword": "Enter your password",
  "loggingIn": "Logging In...",
  "dontHaveAccount": "Don't have an account?",
  
  // Register Page
  "createAccount": "Create an Account",
  "joinBsgPortal": "Join the BSG Portal to start your examination journey",
  "fullName": "Full Name",
  "enterFullName": "Enter your full name",
  "bsgId": "BSG ID (Optional)",
  "enterBsgId": "Enter your BSG ID",
  "confirmPassword": "Confirm Password",
  "reEnterPassword": "Re-enter your password",
  "alreadyHaveAccount": "Already have an account?",
  "creatingAccount": "Creating Account...",
  "district": "District",
  "enterDistrict": "Enter your district",
`;

const extraHi = `
  // Landing Page
  "welcomeTo": "स्वागत है",
  "bsgPortal": "BSG पोर्टल में",
  "landingDesc": "भारत स्काउट और गाइड परीक्षण के लिए विशेष रूप से डिज़ाइन किया गया आधिकारिक, अत्यधिक सुरक्षित परीक्षा पोर्टल।",
  "startExamination": "परीक्षा प्रारंभ करें",
  "candidateRegistration": "उम्मीदवार पंजीकरण",
  "secureExamination": "सुरक्षित परीक्षा",
  "secureExamDesc": "उच्चतम सत्यनिष्ठा बनाए रखने के लिए BSG परीक्षा के दौरान सख्त निगरानी।",
  "reliableOffline": "विश्वसनीय और ऑफ़लाइन-सुरक्षित",
  "reliableOfflineDesc": "डेटा स्वचालित रूप से स्थानीय रूप से सहेजा जाता है, जिससे निर्बाध परीक्षण सुनिश्चित होता है।",
  "instantInsights": "त्वरित परिणाम",
  "instantInsightsDesc": "BSG परीक्षा प्रदर्शन पर तत्काल स्कोरिंग और विस्तृत प्रतिक्रिया प्राप्त करें।",
  "developerArchitect": "डेवलपर और आर्किटेक्ट",
  "termsConditions": "नियम और शर्तें",
  "privacyPolicy": "गोपनीयता नीति",
  "signIn": "लॉग इन करें",
  
  // Login Page
  "welcomeBack": "वापसी पर स्वागत है!",
  "signInToAccount": "जारी रखने के लिए अपने खाते में साइन इन करें",
  "emailAddress": "ईमेल पता",
  "enterEmail": "अपना ईमेल दर्ज करें",
  "password": "पासवर्ड",
  "enterPassword": "अपना पासवर्ड दर्ज करें",
  "loggingIn": "लॉग इन हो रहा है...",
  "dontHaveAccount": "क्या आपके पास खाता नहीं है?",
  
  // Register Page
  "createAccount": "खाता बनाएं",
  "joinBsgPortal": "अपनी परीक्षा यात्रा शुरू करने के लिए BSG पोर्टल से जुड़ें",
  "fullName": "पूरा नाम",
  "enterFullName": "अपना पूरा नाम दर्ज करें",
  "bsgId": "BSG ID (वैकल्पिक)",
  "enterBsgId": "अपनी BSG ID दर्ज करें",
  "confirmPassword": "पासवर्ड की पुष्टि करें",
  "reEnterPassword": "अपना पासवर्ड फिर से दर्ज करें",
  "alreadyHaveAccount": "क्या आपके पास पहले से खाता है?",
  "creatingAccount": "खाता बनाया जा रहा है...",
  "district": "जिला",
  "enterDistrict": "अपना जिला दर्ज करें",
`;

let enContent = fs.readFileSync(enPath, 'utf8');
enContent = enContent.replace('};', extraEn + '};');
fs.writeFileSync(enPath, enContent);

let hiContent = fs.readFileSync(hiPath, 'utf8');
hiContent = hiContent.replace('};', extraHi + '};');
fs.writeFileSync(hiPath, hiContent);

console.log("Dictionaries updated");
