const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  'https://wgvmxvqejklwaldqfjwb.supabase.co',
  'sb_secret_FNqdX4v85TOTgPc9w9lrBg_XjjOt0ty'
);

async function testAdmin() {
  const { data, error } = await supabaseAdmin.from('exams').insert([
    {
      title: "Test Exam API Admin",
      description: "Testing API",
      category: "Test",
      duration_minutes: 10,
      passing_marks: 50,
      creator_id: '885e55d2-7d87-4b17-8c54-b37be90ebff1'
    }
  ]).select().single();
  
  if (error) {
    console.error("Admin Insert Error:", error.message);
  } else {
    console.log("Admin Insert Success:", data.id);
  }
}

testAdmin();
