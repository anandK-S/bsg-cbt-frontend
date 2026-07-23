import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';
import { GoogleGenAI } from '@google/genai';
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
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      return camelCaseResponse({ message: 'No AI API keys configured.' }, { status: 500 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let textContent = '';
    let isImage = false;
    let base64Data = '';
    let mimeType = file.type || 'application/octet-stream';

    // Parse file content
    if (file.name.toLowerCase().endsWith('.pdf')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        textContent = pdfData.text;
      } catch (err) {
        console.error("PDF parse error", err);
        return camelCaseResponse({ message: 'Failed to read PDF file' }, { status: 400 });
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
      isImage = true;
      base64Data = buffer.toString('base64');
      mimeType = file.type;
    } else {
      textContent = buffer.toString('utf-8');
    }

    const prompt = `You are an expert exam question extractor and translator. 
Extract all questions from the provided document/image. 
For each question, extract or generate the question and its options in BOTH English and Hindi.
If the document is only in English, translate it to Hindi. If it is only in Hindi, translate it to English.

Return a strict JSON array of objects. Do not include markdown codeblocks around the output. Just return the JSON array.
Each object must follow this exact schema:
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

    const callGemini = async () => {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const contents: any[] = [];
      
      if (isImage) {
        contents.push({
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        });
      } else {
        contents.push({
          role: 'user',
          parts: [
            { text: `Document content:\n${textContent}\n\n${prompt}` }
          ]
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          responseMimeType: "application/json",
        }
      });
      return response.text;
    };

    const callGroq = async () => {
      const groq = new Groq({ apiKey: groqKey });
      const messages: any[] = [];

      if (isImage) {
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
          content: `Document content:\n${textContent}\n\n${prompt}`
        });
      }

      const response = await groq.chat.completions.create({
        messages,
        model: isImage ? 'llama-3.2-90b-vision-preview' : 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      
      return response.choices[0]?.message?.content;
    };

    // Try Gemini First, Fallback to Groq
    try {
      if (!geminiKey) throw new Error("Gemini key missing, falling back to Groq");
      jsonString = await callGemini() || '';
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
        return camelCaseResponse({ message: 'AI processing failed on both Gemini and Groq' }, { status: 500 });
      }
    }

    let questionsData: any[] = [];
    try {
      questionsData = JSON.parse(jsonString);
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
