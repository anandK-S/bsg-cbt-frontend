const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/api/attempts/[id]/heartbeat/route.ts',
  'src/app/api/attempts/[id]/result/route.ts',
  'src/app/api/attempts/[id]/submit/route.ts',
  'src/app/api/exams/[id]/questions/all/route.ts',
  'src/app/api/exams/[id]/questions/route.ts',
  'src/app/api/exams/[id]/start/route.ts',
  'src/app/api/exams/[id]/status/route.ts',
  'src/app/api/exams/[id]/route.ts',
  'src/app/api/questions/[id]/route.ts',
  'src/app/api/users/examiner/[id]/insights/route.ts'
];

filesToFix.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace the signature
  content = content.replace(
    /({ params }: { params: { id: string } })/g,
    '{ params }: { params: Promise<{ id: string }> }'
  );

  // Insert `const { id } = await params;` right after try { or function body
  // It's tricky to do with regex. Let's just replace all `params.id` with `(await params).id`
  // Wait, if we just replace `params.id` with `(await params).id`, that is perfectly valid and much simpler!
  content = content.replace(/params\.id/g, '(await params).id');
  
  fs.writeFileSync(fullPath, content);
  console.log(`Fixed ${relPath}`);
});
