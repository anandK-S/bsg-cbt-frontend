const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  'https://wgvmxvqejklwaldqfjwb.supabase.co',
  'sb_publishable_l4DzN0oqe3pkY8VxR1gVBg_n3WO6Qir'
);

async function testCreateExam() {
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
    const res = await axios.post('https://bsg-cbt.vercel.app/api/exams', {
      title: "Test Exam API",
      description: "Testing API",
      category: "Test",
      durationMinutes: 10,
      durationSeconds: 600,
      passingMarks: 50,
      passingCriteriaType: 'percentage'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Create Exam Success:", res.data);
  } catch (err) {
    console.error("Create Exam Error:", err.response?.status, err.response?.data);
  }
}

testCreateExam();
