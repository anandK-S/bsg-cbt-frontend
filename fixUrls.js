const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  let c = fs.readFileSync(file, 'utf8');
  if (c.includes('http://localhost:5000') && !file.includes('apiConfig')) {
    c = c.replace(/['"]http:\/\/localhost:5000([^'"]*)['"]/g, '`${API_URL}$1`');
    c = c.replace(/`http:\/\/localhost:5000([^`]*)`/g, '`${API_URL}$1`');
    
    if (!c.includes('import { API_URL }')) {
        if (c.includes("import axios from 'axios';")) {
          c = c.replace("import axios from 'axios';", "import axios from 'axios';\nimport { API_URL } from '@/utils/apiConfig';");
        } else if (c.includes('import axios from "axios";')) {
          c = c.replace('import axios from "axios";', 'import axios from "axios";\nimport { API_URL } from "@/utils/apiConfig";');
        } else {
          c = "import { API_URL } from '@/utils/apiConfig';\n" + c;
        }
    }
    fs.writeFileSync(file, c);
    console.log('Fixed', file);
  }
});
