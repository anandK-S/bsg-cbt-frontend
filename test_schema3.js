const axios = require('axios');
async function fetchOpenAPI() {
  const res = await axios.get('https://wgvmxvqejklwaldqfjwb.supabase.co/rest/v1/?apikey=sb_secret_FNqdX4v85TOTgPc9w9lrBg_XjjOt0ty');
  console.log("attempt_answers:", Object.keys(res.data.definitions.attempt_answers.properties));
}
fetchOpenAPI().catch(console.error);
