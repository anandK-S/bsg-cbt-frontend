const axios = require('axios');
async function fetchOpenAPI() {
  const res = await axios.get('https://wgvmxvqejklwaldqfjwb.supabase.co/rest/v1/?apikey=sb_secret_FNqdX4v85TOTgPc9w9lrBg_XjjOt0ty');
  console.log(Object.keys(res.data.definitions));
  
  if (res.data.definitions.results) console.log("results:", Object.keys(res.data.definitions.results.properties));
  if (res.data.definitions.attempt_responses) console.log("attempt_responses:", Object.keys(res.data.definitions.attempt_responses.properties));
}
fetchOpenAPI().catch(console.error);
