import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60; // Max timeout for Vercel Hobby plan

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return camelCaseResponse({ message: 'GEMINI_API_KEY is not configured on the server' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Convert file to Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    
    // Determine mimeType (Google Generative AI expects specific mimetypes)
    let mimeType = file.type || 'application/octet-stream';
    if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (file.name.endsWith('.txt')) mimeType = 'text/plain';

    const prompt = `You are an expert exam question extractor. 
Extract all questions from the provided document and return a strict JSON array of objects.
Do not include markdown codeblocks around the output. Just return the JSON array.
Each object must follow this exact schema:
{
  "text": "The actual question text",
  "type": "SingleChoice" | "MultipleChoice" | "TrueFalse" | "Subjective",
  "options": ["Option A", "Option B", "Option C", "Option D"], // Optional for Subjective/TrueFalse
  "correct_option_index": 0, // 0-indexed integer indicating correct option. Optional for Subjective
  "marks": 1, // Integer, default 1
  "category": "General", // The category if mentioned, else 'General'
  "acceptable_answers": ["answer1"] // For Subjective questions only
}
Ensure 'options' only contains string options if the type is SingleChoice or MultipleChoice. 
Determine the correct answer based on context, or pick 0 if unsure.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonString = response.text || '[]';
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
      type: ['SingleChoice', 'MultipleChoice', 'TrueFalse', 'Subjective'].includes(q.type) ? q.type : 'SingleChoice',
      options: Array.isArray(q.options) ? q.options : [],
      correct_option_index: typeof q.correct_option_index === 'number' ? q.correct_option_index : 0,
      marks: typeof q.marks === 'number' ? q.marks : 1,
      category: q.category || 'General',
      acceptable_answers: Array.isArray(q.acceptable_answers) ? q.acceptable_answers : []
    }));

    const { error: insertError } = await supabaseAdmin.from('questions').insert(insertData);

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return camelCaseResponse({ message: 'Failed to save questions to database' }, { status: 500 });
    }

    return camelCaseResponse({ message: 'Successfully imported questions', count: insertData.length });
  } catch (error: any) {
    console.error("AI Import error:", error);
    return camelCaseResponse({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
