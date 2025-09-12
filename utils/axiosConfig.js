import axios from 'axios';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, // Always include cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add API key
axiosInstance.interceptors.request.use(
  (config) => {
    // Add API key header if available
    const apiKey = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;
    if (apiKey) {
      config.headers['x-api-key'] = apiKey;
    }
    
    // Special handling for FormData (file uploads)
    if (config.data instanceof FormData) {
      // Remove Content-Type to let browser set it with boundary
      delete config.headers['Content-Type'];
    }
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Axios] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for consistent error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Log more details about the 401 error
      console.error('401 Unauthorized:', {
        url: error.config?.url,
        message: error.response?.data?.message || 'Authentication failed',
        headers: error.config?.headers
      });
      // 401 could mean: expired token, no token, wrong API key, or insufficient permissions
    }
    throw error;
  }
);

export default axiosInstance;