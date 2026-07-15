import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http://localhost:5000')) {
    config.url = config.url.replace('http://localhost:5000', API_URL);
  }
  
  // Attach token if it exists (fixes cross-site cookie issues in some browsers)
  const token = useAuthStore.getState().user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});
