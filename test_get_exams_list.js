const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgvmxvqejklwaldqfjwb.supabase.co',
  'sb_publishable_l4DzN0oqe3pkY8VxR1gVBg_n3WO6Qir'
);

async function testFetchExams() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'exam@gmail.com',
    password: 'BsgCbt@123'
  });
  
  if (error) {
    console.error("Login failed:", error.message);
    return;
  }
  
  const token = data.session.access_token;
  
  try {
    const res = await axios.get('https://bsg-cbt.vercel.app/api/exams', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Fetch Exams Success. First exam:");
    console.log(res.data[0]);
  } catch (err) {
    console.error("Fetch Exams Error Status:", err.response?.status);
  }
}

testFetchExams();
