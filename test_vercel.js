const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  'https://wgvmxvqejklwaldqfjwb.supabase.co',
  'sb_publishable_l4DzN0oqe3pkY8VxR1gVBg_n3WO6Qir'
);

async function testAdmin() {
  // 1. Log in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'anandkumar.edunet@gmail.com',
    password: 'Anand@401'
  });
  
  if (error) {
    console.error("Login failed:", error.message);
    return;
  }
  
  const token = data.session.access_token;
  console.log("Logged in successfully. Fetching from Vercel...");
  
  try {
    const res = await axios.get('https://bsg-cbt.vercel.app/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Users API Success:", res.data);
  } catch (err) {
    console.error("Users API Error:", err.response?.status, err.response?.data);
  }

  try {
    const res = await axios.get('https://bsg-cbt.vercel.app/api/exams', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Exams API Success:", res.data);
  } catch (err) {
    console.error("Exams API Error:", err.response?.status, err.response?.data);
  }
}

testAdmin();
