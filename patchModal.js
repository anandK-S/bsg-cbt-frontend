const fs = require('fs');
const filePath = 'src/app/examiner/exams/[id]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update the translation button logic
const oldTranslateBtn = `                  <button 
                    type="button"
                    onClick={async () => {
                      if (!manualQuestion.text) return;
                      try {
                        const { data } = await axios.post(\`\${API_URL}/api/exams/translate\`, { text: manualQuestion.text }, { withCredentials: true });
                        if (data.translatedText) {
                          setManualQuestion(prev => ({...prev, text: \`\${prev.text}\\n\${data.translatedText}\`}));
                        }
                      } catch (err) {
                        alert('Translation failed');
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors ml-2"
                  >
                    Aa Translate to Hindi
                  </button>`;

const newTranslateBtn = `                  <button 
                    type="button"
                    onClick={async () => {
                      if (!manualQuestion.text) return;
                      try {
                        // Free client-side Google Translate API (No API key, No Server Load)
                        const res = await fetch(\`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=\${encodeURIComponent(manualQuestion.text)}\`);
                        const data = await res.json();
                        const translatedText = data[0].map((item) => item[0]).join('');
                        setManualQuestion(prev => ({...prev, textHindi: translatedText}));
                        
                        if (manualQuestion.type !== 'Subjective') {
                          const translatedOptions = await Promise.all(manualQuestion.options.map(async (opt) => {
                             if (!opt) return '';
                             const oRes = await fetch(\`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=\${encodeURIComponent(opt)}\`);
                             const oData = await oRes.json();
                             return oData[0].map((item) => item[0]).join('');
                          }));
                          setManualQuestion(prev => ({...prev, optionsHindi: translatedOptions}));
                        }
                      } catch (err) {
                        alert('Translation failed. Please try manually.');
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors ml-2 shadow-sm border border-green-200"
                  >
                    ⚡ Auto-Translate to Hindi
                  </button>`;

content = content.replace(oldTranslateBtn, newTranslateBtn);

// 2. Add Hindi Question Text Area
const oldTextArea = `                <textarea
                  value={manualQuestion.text}
                  onChange={(e) => setManualQuestion({...manualQuestion, text: e.target.value})}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-bsg-blue focus:ring-4 focus:ring-bsg-blue/10 outline-none resize-none"
                  rows={3}
                  placeholder="e.g., What is the capital of France?"
                />`;

const newTextArea = `                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-bsg-blue mb-1 uppercase tracking-wider">English</label>
                    <textarea
                      value={manualQuestion.text}
                      onChange={(e) => setManualQuestion({...manualQuestion, text: e.target.value})}
                      className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-bsg-blue focus:ring-4 focus:ring-bsg-blue/10 outline-none resize-none"
                      rows={3}
                      placeholder="e.g., What is the capital of France?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-green-600 mb-1 uppercase tracking-wider">Hindi (Optional)</label>
                    <textarea
                      value={manualQuestion.textHindi || ''}
                      onChange={(e) => setManualQuestion({...manualQuestion, textHindi: e.target.value})}
                      className="w-full bg-green-50/30 border-2 border-green-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none resize-none"
                      rows={3}
                      placeholder="उदा., फ्रांस की राजधानी क्या है?"
                    />
                  </div>
                </div>`;

content = content.replace(oldTextArea, newTextArea);

// 3. Add Hindi Options
const oldOptionMapping = `                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOptionText(idx, e.target.value)}
                        className="flex-1 bg-transparent font-medium text-gray-900 outline-none"
                        placeholder={\`Option \${idx + 1}\`}
                      />`;

const newOptionMapping = `                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOptionText(idx, e.target.value)}
                          className="flex-1 bg-transparent font-medium text-gray-900 outline-none py-1 border-b border-dashed border-gray-300 focus:border-bsg-blue"
                          placeholder={\`Option (EN) \${idx + 1}\`}
                        />
                        <input
                          type="text"
                          value={manualQuestion.optionsHindi?.[idx] || ''}
                          onChange={(e) => {
                            const newOptionsHi = [...(manualQuestion.optionsHindi || [])];
                            newOptionsHi[idx] = e.target.value;
                            setManualQuestion({...manualQuestion, optionsHindi: newOptionsHi});
                          }}
                          className="flex-1 bg-green-50/30 font-medium text-gray-900 outline-none py-1 border-b border-dashed border-green-300 focus:border-green-500"
                          placeholder={\`Option (HI) \${idx + 1}\`}
                        />
                      </div>`;

content = content.replace(oldOptionMapping, newOptionMapping);

// Initialize optionsHindi when adding new options
content = content.replace(
  "setManualQuestion({...manualQuestion, options: [...manualQuestion.options, '']})",
  "setManualQuestion({...manualQuestion, options: [...manualQuestion.options, ''], optionsHindi: [...(manualQuestion.optionsHindi || []), '']})"
);

// Remove from optionsHindi when removing options
content = content.replace(
  "options: manualQuestion.options.filter((_, i) => i !== index)",
  "options: manualQuestion.options.filter((_, i) => i !== index), optionsHindi: manualQuestion.optionsHindi?.filter((_, i) => i !== index)"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully patched modal UI with Hindi auto-translate logic');
