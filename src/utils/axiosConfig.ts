// axiosConfig.ts

import axios from 'axios';
import { toast } from 'react-toastify';
import { removeToken } from './auth.ts';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:5000/',
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      toast.error('Session expired. Redirecting to login.');
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;