const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgvmxvqejklwaldqfjwb.supabase.co',
  'sb_publishable_l4DzN0oqe3pkY8VxR1gVBg_n3WO6Qir' // Anon key is enough for login
);

async function testFetchExam() {
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
    const res = await axios.get('https://bsg-cbt.vercel.app/api/exams/1f720dcd-d39c-4bda-af9f-5b6b55a7aa92', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Fetch Exam Success, HTTP 200:");
    console.log(res.data.title);
  } catch (err) {
    console.error("Fetch Exam Error:", err.response?.status, err.response?.data);
  }
}

testFetchExam();
