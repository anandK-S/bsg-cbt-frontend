const fs = require('fs');
const path = require('path');
const p = path.resolve('src/app/exams/[id]/take/page.tsx');
let content = fs.readFileSync(p, 'utf8');
content = content.replace(/className="min-h-screen flex items-center justify-center bg-gray-50"/g, 'className="fixed inset-0 flex items-center justify-center bg-gray-50 z-50"');
fs.writeFileSync(p, content, 'utf8');
