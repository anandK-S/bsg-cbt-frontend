import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import Groq from 'groq-sdk';
import mammoth from 'mammoth';

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

    let pdfUploadUri = null;
    let pdfUploadMime = null;
    let tempFilePath = null;

    if (file.name.toLowerCase().endsWith('.pdf')) {
      try {
        // Since raw text extraction scrambles layout, we will upload the PDF natively using File API
        const tempFilename = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`;
        tempFilePath = join(tmpdir(), tempFilename);
        await writeFile(tempFilePath, buffer);
        isNativeGeminiFile = true;
        mimeType = 'application/pdf';
        pdfUploadMime = 'application/pdf';
      } catch (err) {
        console.error("PDF setup error", err);
        return camelCaseResponse({ message: 'Failed to prepare PDF file on the server.' }, { status: 500 });
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
        model: 'gemini-1.5-pro', // Using the stable pro model via the generative-ai SDK
        generationConfig: { 
          responseMimeType: 'application/json',
          maxOutputTokens: 8192 // Ensure the model doesn't stop early for large documents
        }
      });
      
      const contents = [];
      
      if (isNativeGeminiFile && tempFilePath) {
        const fileManager = new GoogleAIFileManager(apiKey);
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
          mimeType: pdfUploadMime,
          displayName: file.name,
        });
        
        // Wait for the uploaded PDF to become ACTIVE before generating content
        let fileState = await fileManager.getFile(uploadResult.file.name);
        let retries = 0;
        while (fileState.state === 'PROCESSING' && retries < 15) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          fileState = await fileManager.getFile(uploadResult.file.name);
          retries++;
        }
        
        if (fileState.state === 'FAILED') {
          throw new Error("Google AI failed to process the PDF document.");
        }
        
        contents.push({
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri
          }
        });
        contents.push(prompt);
      } else if (isNativeGeminiFile && mimeType.startsWith('image/')) {
        contents.push({
          inlineData: { data: base64Data, mimeType }
        });
        contents.push(prompt);
      } else {
        contents.push(`Document content:\n${textContent}\n\n${prompt}`);
      }

      const response = await model.generateContent(contents);
      
      // Cleanup temp file if exists
      if (tempFilePath) {
        try { await unlink(tempFilePath); } catch (e) { console.error("Cleanup error", e); }
      }
      
      return response.response.text();
    };

    const callGroq = async () => {
      const groq = new Groq({ apiKey: groqKey });
      const messages: any[] = [];

      let finalContent = textContent;

      if (mimeType.startsWith('image/')) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
          ]
        });
      } else {
        messages.push({
          role: 'user',
          content: `Document content:\n${finalContent}\n\n${prompt}`
        });
      }

      const response = await groq.chat.completions.create({
        messages,
        model: mimeType.startsWith('image/') ? 'llama-3.2-90b-vision-preview' : 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      
      return response.choices[0]?.message?.content;
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
