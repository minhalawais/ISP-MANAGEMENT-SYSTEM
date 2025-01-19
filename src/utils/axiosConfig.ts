// axiosConfig.ts

import axios from 'axios';
import { toast } from 'react-toastify';
import { removeToken } from './auth.ts';

const axiosInstance = axios.create({
  baseURL: 'http://147.93.53.119/api/',
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