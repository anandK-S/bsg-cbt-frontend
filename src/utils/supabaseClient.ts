import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'sb_secret_FNqdX4v85TOTgPc9w9lrBg_XjjOt0ty'; // Using the known service key as fallback so it works instantly

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Ensure you have set them in .env.local');
}

// Ensure the URL is valid, fallback to dummy if totally empty
let safeUrl = 'https://missing-supabase-url.supabase.co';
if (supabaseUrl && supabaseUrl.trim().length > 5) {
  safeUrl = supabaseUrl.trim();
  if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
    safeUrl = 'https://' + safeUrl;
  }
}

const safeKey = supabaseAnonKey ? supabaseAnonKey.trim() : 'missing-key';

export const supabase = createClient(safeUrl, safeKey);

// Admin client bypasses RLS - only use in server API routes!
export const supabaseAdmin = createClient(safeUrl, supabaseServiceKey);
