import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import mammoth from 'mammoth';

export const maxDuration = 60; // Max execution time for Vercel Hobby tier

export const maxDuration = 60; // Max timeout for Vercel

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || (auth.profile?.role !== 'Examiner' && auth.profile?.role !== 'Admin')) {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id: examId } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return camelCaseResponse({ message: 'No file uploaded' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const geminiKey2 = process.env.GEMINI_API_KEY_2;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !geminiKey2 && !groqKey) {
      return camelCaseResponse({ message: 'No AI API keys configured.' }, { status: 500 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let textContent = '';
    let isNativeGeminiFile = false;
    let base64Data = buffer.toString('base64');
    let mimeType = file.type || 'application/octet-stream';

    if (file.name.toLowerCase().endsWith('.pdf')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const PDFParser = require('pdf2json');
        
        textContent = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1);
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
          pdfParser.parseBuffer(buffer);
        });
      } catch (err) {
        console.error("PDF parse error", err);
        return camelCaseResponse({ message: 'Failed to read PDF file on the server.' }, { status: 400 });
      }
    } else if (file.name.toLowerCase().endsWith('.docx')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        textContent = result.value;
      } catch (err) {
        console.error("DOCX parse error", err);
        return camelCaseResponse({ message: 'Failed to read DOCX file' }, { status: 400 });
      }
    } else if (file.type.startsWith('image/')) {
      isNativeGeminiFile = true;
      mimeType = file.type;
    } else {
      textContent = buffer.toString('utf-8');
    }

    const prompt = `You are an expert exam question extractor and translator. 
Extract ALL questions from the provided document/image. 
For each question, extract or generate the question and its options in BOTH English and Hindi.
If the document is only in English, translate it to Hindi. If it is only in Hindi, translate it to English.

CRITICAL RULES:
1. You MUST extract EVERY SINGLE QUESTION sequentially exactly as they appear (e.g. Q.1, Q.2, up to Q.60).
2. DO NOT stop early. DO NOT truncate the list. If there are 60 questions, your JSON array MUST contain 60 objects.
3. PRESERVE THE CORRECT OPTION exactly. Look for "Correct Answer: Option X" and ensure it is accurately reflected in your JSON.
4. Return a strict JSON array of objects. Do not include markdown codeblocks around the output. Just return the JSON array.
5. Each object must follow this exact schema:
{
  "text": "The question text in English",
  "text_hindi": "The question text translated to Hindi",
  "type": "SingleChoice" | "MultipleChoice" | "TrueFalse" | "Subjective",
  "options": ["Option A", "Option B", "Option C", "Option D"], 
  "options_hindi": ["Option A in Hindi", "Option B in Hindi", "Option C in Hindi", "Option D in Hindi"],
  "correct_option_index": 0,
  "marks": 1,
  "category": "General",
  "acceptable_answers": ["answer1"]
}

Important Rules:
1. Ensure 'options' and 'options_hindi' match in length and correspond exactly.
2. If Subjective or TrueFalse, you can leave options empty.
3. Determine the correct answer based on context, or pick 0 if unsure.`;

    let jsonString = '';

    const callGemini = async (apiKey: string) => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        generationConfig: { 
          responseMimeType: 'application/json',
          maxOutputTokens: 8192
        }
      });
      
      // If image, do single shot
      if (isNativeGeminiFile && mimeType.startsWith('image/')) {
        const contents = [];
        contents.push({ inlineData: { data: base64Data, mimeType } });
        contents.push(prompt);
        const response = await model.generateContent(contents);
        return response.response.text();
      }
      
      // For text/PDFs, implement robust batch chunking to completely eliminate lazy LLM truncations
      // Split by "Q.1", "Q. 1", "Q.2", or fallback to 3000 chars
      const blocks = textContent.split(/(?=Q\.\s*\d+|Question\s*\d+)/gi);
      const chunks = [];
      let currentChunk = '';
      
      if (blocks.length > 2) {
        // Smart grouping: 10 questions per chunk
        for (let i = 0; i < blocks.length; i++) {
          currentChunk += blocks[i] + '\n';
          if ((i + 1) % 10 === 0 || i === blocks.length - 1) {
            chunks.push(currentChunk);
            currentChunk = '';
          }
        }
      } else {
        // Fallback dumb chunking
        for (let i = 0; i < textContent.length; i += 3000) {
          chunks.push(textContent.substring(i, i + 3000));
        }
      }

      let allQuestions: any[] = [];
      
      // Execute all chunks concurrently to prevent Vercel timeout
      const chunkPromises = chunks.map(async (chunk) => {
         if (!chunk.trim()) return [];
         const chunkPrompt = `${prompt}\n\nExtract ALL questions from this specific document chunk. DO NOT skip any.\n\nChunk Content:\n${chunk}`;
         try {
           const response = await model.generateContent(chunkPrompt);
           let raw = response.response.text().replace(/```json/gi, '').replace(/```/gi, '').trim();
           const firstBracket = raw.indexOf('[');
           const lastBracket = raw.lastIndexOf(']');
           if (firstBracket !== -1 && lastBracket !== -1) {
             raw = raw.substring(firstBracket, lastBracket + 1);
             const parsed = JSON.parse(raw);
             if (Array.isArray(parsed)) {
               return parsed;
             }
           }
         } catch (e) {
           console.error("Chunk parse error via Gemini", e);
         }
         return [];
      });
      
      const results = await Promise.all(chunkPromises);
      for (const result of results) {
        allQuestions = allQuestions.concat(result);
      }
      
      return JSON.stringify(allQuestions);
    };

    const callGroq = async () => {
      const groq = new Groq({ apiKey: groqKey });
      const messages: any[] = [];

      let finalContent = textContent;

      // For text/PDFs, implement robust batch chunking for Groq as well
      const blocks = textContent.split(/(?=Q\.\s*\d+|Question\s*\d+)/gi);
      const chunks = [];
      let currentChunk = '';
      
      if (blocks.length > 2) {
        for (let i = 0; i < blocks.length; i++) {
          currentChunk += blocks[i] + '\n';
          if ((i + 1) % 15 === 0 || i === blocks.length - 1) { // 15 per chunk for Groq (faster)
            chunks.push(currentChunk);
            currentChunk = '';
          }
        }
      } else {
        for (let i = 0; i < textContent.length; i += 3000) {
          chunks.push(textContent.substring(i, i + 3000));
        }
      }

      let allQuestions: any[] = [];
      
      const chunkPromises = chunks.map(async (chunk) => {
         if (!chunk.trim()) return [];
         const chunkMessages = [...messages, { role: 'user', content: `Chunk Content:\n${chunk}\n\n${prompt}` }];
         try {
           const response = await groq.chat.completions.create({
             messages: chunkMessages as any,
             model: 'llama-3.3-70b-versatile',
             response_format: { type: 'json_object' }
           });
           
           let raw = response.choices[0]?.message?.content || '';
           raw = raw.replace(/```json/gi, '').replace(/```/gi, '').trim();
           
           const parsed = JSON.parse(raw);
           if (Array.isArray(parsed)) {
             return parsed;
           } else if (parsed && typeof parsed === 'object') {
             const possibleArray = Object.values(parsed).find(val => Array.isArray(val));
             if (possibleArray) {
               return possibleArray;
             }
           }
         } catch (e) {
           console.error("Chunk parse error via Groq", e);
         }
         return [];
      });
      
      const results = await Promise.all(chunkPromises);
      for (const result of results) {
        allQuestions = allQuestions.concat(result);
      }
      
      return JSON.stringify(allQuestions);
    };

    // Try Gemini First, Fallback to Groq
    try {
      const primaryKey = geminiKey || geminiKey2;
      if (!primaryKey) throw new Error("Gemini key missing, falling back to Groq");
      try {
        jsonString = await callGemini(primaryKey) || '';
      } catch (e: any) {
        if (geminiKey && geminiKey2 && primaryKey === geminiKey) {
          console.warn("Primary Gemini key failed, trying GEMINI_API_KEY_2:", e.message);
          jsonString = await callGemini(geminiKey2) || '';
        } else {
          throw e;
        }
      }
    } catch (geminiError: any) {
      console.warn("Gemini AI failed, falling back to Groq:", geminiError.message);
      try {
        if (!groqKey) throw new Error("Groq key missing, cannot fallback");
        let groqRes = await callGroq() || '{}';
        // Groq JSON object mode returns an object. We must ensure it's an array.
        // E.g. { "questions": [...] }
        const parsedGroq = JSON.parse(groqRes);
        if (parsedGroq.questions && Array.isArray(parsedGroq.questions)) {
          jsonString = JSON.stringify(parsedGroq.questions);
        } else if (Array.isArray(parsedGroq)) {
          jsonString = groqRes;
        } else {
          // If it returns a single object that looks like a question
          if (parsedGroq.text) {
             jsonString = JSON.stringify([parsedGroq]);
          } else {
             // Find first array inside the object
             const arr = Object.values(parsedGroq).find(val => Array.isArray(val));
             jsonString = JSON.stringify(arr || []);
          }
        }
      } catch (groqError: any) {
        console.error("Groq AI also failed:", groqError.message);
        return camelCaseResponse({ 
          message: 'AI processing failed on both models',
          geminiError: geminiError.message,
          groqError: groqError.message 
        }, { status: 500 });
      }
    }

    let questionsData: any[] = [];
    try {
      const cleanJsonStr = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      questionsData = JSON.parse(cleanJsonStr);
    } catch (parseError) {
      console.error("Failed to parse JSON from AI:", jsonString);
      return camelCaseResponse({ message: 'AI returned invalid JSON format' }, { status: 500 });
    }

    if (!Array.isArray(questionsData) || questionsData.length === 0) {
      return camelCaseResponse({ message: 'No questions were extracted' }, { status: 400 });
    }

    // Map to Supabase Schema
    const insertData = questionsData.map((q: any) => ({
      exam_id: examId,
      text: q.text || 'Untitled Question',
      text_hindi: q.text_hindi || '',
      type: ['SingleChoice', 'MultipleChoice', 'TrueFalse', 'Subjective'].includes(q.type) ? q.type : 'SingleChoice',
      options: Array.isArray(q.options) ? q.options : [],
      options_hindi: Array.isArray(q.options_hindi) ? q.options_hindi : [],
      correct_option_index: typeof q.correct_option_index === 'number' ? q.correct_option_index : 0,
      marks: typeof q.marks === 'number' ? q.marks : 1,
      category: q.category || 'General',
      acceptable_answers: Array.isArray(q.acceptable_answers) ? q.acceptable_answers : []
    }));

    const { error: insertError } = await supabaseAdmin.from('questions').insert(insertData);

    if (insertError) {
      throw insertError;
    }

    return camelCaseResponse({ 
      success: true, 
      count: insertData.length,
      message: `Successfully imported ${insertData.length} questions`
    });
  } catch (error: any) {
    console.error("Error in AI import:", error);
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
