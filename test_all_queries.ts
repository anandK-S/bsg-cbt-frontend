import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_FNqdX4v85TOTgPc9w9lrBg_XjjOt0ty';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAll() {
  console.log('Testing users query...');
  const usersRes = await supabase.from('profiles').select('*').limit(1);
  console.log('Users error:', usersRes.error);

  console.log('Testing exams query...');
  const examsRes = await supabase.from('exams').select('*, profiles!creator_id(name)').limit(1);
  console.log('Exams error:', examsRes.error);

  console.log('Testing settings query...');
  const settingsRes = await supabase.from('settings').select('*').limit(1);
  console.log('Settings error:', settingsRes.error);

  console.log('Testing audit query...');
  const auditRes = await supabase.from('audit_logs').select(`
    *,
    profiles (id, name, email, role)
  `).limit(1);
  console.log('Audit error:', auditRes.error);
}

testAll();
