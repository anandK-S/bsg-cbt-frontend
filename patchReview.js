const fs = require('fs');
const filePath = 'src/app/exams/[id]/review/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update Question Body
const oldQuestionText = `<h3 className="text-lg font-semibold text-gray-900 mb-6 whitespace-pre-wrap">{q.text}</h3>`;
const newQuestionText = `                    <div className="mb-6">
                      {q.viewedLanguage === 'hi' && (
                        <span className="inline-block bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 border border-green-200 print:bg-transparent print:border-black print:text-black">Answered in Hindi</span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 whitespace-pre-wrap">
                        {q.viewedLanguage === 'hi' && q.textHindi ? q.textHindi : q.text}
                      </h3>
                    </div>`;
content = content.replace(oldQuestionText, newQuestionText);

// Update Options mapping
const oldOptionsMap = `{q.options.map((opt: string, optIdx: number) => {`;
const newOptionsMap = `{(q.viewedLanguage === 'hi' && q.optionsHindi && q.optionsHindi.length > 0 ? q.optionsHindi : q.options).map((opt: string, optIdx: number) => {`;
content = content.replace(oldOptionsMap, newOptionsMap);

// Update Print Question Text
const oldPrintQuestionText = `<p className="font-medium">{q.text}</p>`;
const newPrintQuestionText = `<p className="font-medium">
                        {q.viewedLanguage === 'hi' && (
                          <span className="block text-[10px] uppercase font-bold mb-1">[Hindi Version]</span>
                        )}
                        {q.viewedLanguage === 'hi' && q.textHindi ? q.textHindi : q.text}
                      </p>`;
content = content.replace(oldPrintQuestionText, newPrintQuestionText);

// Update Print Options mapping
const oldPrintOptionsMap = `{(q.options || []).map((opt: string, optIdx: number) => {`;
const newPrintOptionsMap = `{((q.viewedLanguage === 'hi' && q.optionsHindi && q.optionsHindi.length > 0 ? q.optionsHindi : q.options) || []).map((opt: string, optIdx: number) => {`;
content = content.replace(oldPrintOptionsMap, newPrintOptionsMap);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully patched review page to show viewedLanguage');
