const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://wgvmxvqejklwaldqfjwb.supabase.co',
  'sb_secret_FNqdX4v85TOTgPc9w9lrBg_XjjOt0ty'
);

async function testQuery() {
  const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1);
      
  console.log("Data:", data);
  console.log("Error:", error);
}

testQuery();
