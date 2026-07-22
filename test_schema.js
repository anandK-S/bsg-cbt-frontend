const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgvmxvqejklwaldqfjwb.supabase.co',
  'sb_secret_FNqdX4v85TOTgPc9w9lrBg_XjjOt0ty'
);

async function getCols() {
  const { data, error } = await supabase.rpc('get_columns_for_table', { table_name: 'exam_attempts' });
  if (error) {
    // try direct query if rpc doesn't exist
    const { data: d2, error: e2 } = await supabase.from('exam_attempts').select('*').limit(1);
    console.log(e2);
  } else {
    console.log(data);
  }
}
// Actually let's just insert a dummy row and rollback, or just use the postgrest openapi spec!
async function fetchOpenAPI() {
  const axios = require('axios');
  const res = await axios.get('https://wgvmxvqejklwaldqfjwb.supabase.co/rest/v1/?apikey=sb_secret_FNqdX4v85TOTgPc9w9lrBg_XjjOt0ty');
  const attempts = res.data.definitions.exam_attempts.properties;
  console.log(Object.keys(attempts));
}
fetchOpenAPI().catch(console.error);
