import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Ensure you have set them in .env.local');
}

// Use a dummy URL if missing to prevent SSR crashes, but warn heavily
const safeUrl = supabaseUrl || 'https://missing-supabase-url.supabase.co';
const safeKey = supabaseAnonKey || 'missing-key';

export const supabase = createClient(safeUrl, safeKey);
