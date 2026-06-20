import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true, // Crucial for sending/receiving the HTTP-only JWT cookie
});

// Interceptor to unwrap standard response format or throw raw error messages
api.interceptors.response.use(
  (response) => {
    // Unwrap the NestJS standard response wrapper if present
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    // If it's a standard NestJS HTTP exception format, extract the message
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(Array.isArray(message) ? message[0] : message));
  }
);
