import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Before every request, grab the token and attach it
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;