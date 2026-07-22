const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgvmxvqejklwaldqfjwb.supabase.co',
  'sb_publishable_l4DzN0oqe3pkY8VxR1gVBg_n3WO6Qir'
);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'anandkumar.edunet@gmail.com',
    password: 'Anand@401'
  });
  console.log("Login Result:");
  console.log(JSON.stringify({ data, error }, null, 2));

  if (data?.user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    console.log("Profile Result:");
    console.log(JSON.stringify({ profile, profileError }, null, 2));
  }
}

testLogin();
