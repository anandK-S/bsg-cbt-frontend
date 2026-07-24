import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_FNqdX4v85TOTgPc9w9lrBg_XjjOt0ty';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      profiles(id, name, email, role)
    `)
    .limit(2);
    
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}

test();
