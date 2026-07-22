const fs = require('fs');
const content = fs.readFileSync('src/app/examiner/exams/[id]/page.tsx', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('handleAiImport')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
