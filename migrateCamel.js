const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('route.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const routes = walk('src/app/api');
let modifiedCount = 0;

routes.forEach(route => {
  let content = fs.readFileSync(route, 'utf8');
  
  if (content.includes('NextResponse.json(') && !content.includes('camelCaseResponse(')) {
    // Add import
    if (!content.includes("import { camelCaseResponse }")) {
      content = "import { camelCaseResponse } from '@/utils/apiResponse';\n" + content;
    }
    
    // Replace NextResponse.json(...) with camelCaseResponse(...)
    // Regex matches NextResponse.json( with any arguments until the closing ) 
    // It's tricky to match nested parentheses, so we'll just replace the string "NextResponse.json" with "camelCaseResponse"
    content = content.replace(/NextResponse\.json/g, 'camelCaseResponse');
    
    fs.writeFileSync(route, content);
    modifiedCount++;
    console.log('Modified:', route);
  }
});

console.log('Total files modified:', modifiedCount);
