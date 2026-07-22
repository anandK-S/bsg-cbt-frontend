const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgvmxvqejklwaldqfjwb.supabase.co',
  'sb_publishable_l4DzN0oqe3pkY8VxR1gVBg_n3WO6Qir'
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
    const res = await axios.get('https://bsg-cbt.vercel.app/api/exams/9c3edf83-013d-42c0-97b6-5e6827c01210', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Fetch Exam Success, HTTP 200:");
    console.log(res.data);
  } catch (err) {
    console.error("Fetch Exam Error Status:", err.response?.status);
    console.error("Fetch Exam Error Data:", err.response?.data);
  }
}

testFetchExam();
