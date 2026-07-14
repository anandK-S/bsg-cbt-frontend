import axios from 'axios';

if (typeof window !== 'undefined') {
  axios.interceptors.request.use((config) => {
    if (config.url && config.url.startsWith('http://localhost:5000')) {
      const hostname = window.location.hostname;
      config.url = config.url.replace('http://localhost:5000', `http://${hostname}:5000`);
    }
    return config;
  });
}
