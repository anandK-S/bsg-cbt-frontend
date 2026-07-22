import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

export const API_URL = ''; // Use relative paths for Next.js API routes

axios.interceptors.request.use((config) => {
  // We no longer need to replace localhost:5000 because we use relative paths
  
  // Attach token if it exists (fixes cross-site cookie issues in some browsers)
  const token = useAuthStore.getState().user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});
