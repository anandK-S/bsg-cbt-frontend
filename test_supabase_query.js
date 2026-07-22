const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://wgvmxvqejklwaldqfjwb.supabase.co',
  'sb_secret_FNqdX4v85TOTgPc9w9lrBg_XjjOt0ty'
);

async function testQuery() {
  const { data, error } = await supabaseAdmin
      .from('exams')
      .select('*, creator:profiles!exams_creator_id_fkey(id, name)')
      .eq('id', '9c3edf83-013d-42c0-97b6-5e6827c01210')
      .single();
      
  console.log("Data:", data);
  console.log("Error:", error);
}

testQuery();
