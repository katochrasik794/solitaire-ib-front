// Force localhost in development mode
const getApiBaseUrl = () => {
  // If VITE_API_BASE_URL is explicitly set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // In production, use relative path
  if (import.meta.env.PROD) {
    return '/api';
  }
  // In development, always use localhost:5005
  return 'http://localhost:5005/api';
};

const API_BASE_URL = getApiBaseUrl();
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

// Create axios-like fetch wrapper
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available (use adminToken for admin routes)
    const isAdminRoute = endpoint.startsWith('/admin');
    const token = isAdminRoute 
      ? localStorage.getItem('adminToken') 
      : localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - clear tokens and redirect to login
        if (response.status === 401) {
          // Skip global 401 handling for login endpoints so the component can handle the error
          if (endpoint.includes('/login')) {
             const error = new Error((data && data.message) || `HTTP error! status: ${response.status}`);
             error.status = response.status;
             error.body = data;
             throw error;
          }

          const isAdminRoute = endpoint.startsWith('/admin') || window.location.pathname.startsWith('/admin');
          if (isAdminRoute) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('app_user');
            alert('Session expired. Please login again.');
            window.location.href = '/admin/login';
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('app_user');
            alert('Session expired. Please login again.');
            window.location.href = '/login';
          }
          return;
        }
        const error = new Error((data && data.message) || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.body = data;
        throw error;
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url);
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
const apiClient = new ApiClient();

// API endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    applyPartner: (payload) => apiClient.post('/auth/apply-partner', payload),
    register: (userData) => apiClient.post('/auth/register', userData),
    profile: () => apiClient.get('/auth/profile'),
  },

  admin: {
    login: (credentials) => apiClient.post('/admin/login', credentials),
  },

  // IB endpoints
  ib: {
    getAll: (params) => apiClient.get('/ib', params),
    getById: (id) => apiClient.get(`/ib/${id}`),
    create: (ibData) => apiClient.post('/ib', ibData),
    update: (id, ibData) => apiClient.put(`/ib/${id}`, ibData),
    updateStatus: (id, status) => apiClient.patch(`/ib/${id}/status`, { status }),
    updateStats: (id, stats) => apiClient.patch(`/ib/${id}/stats`, stats),
    getStats: () => apiClient.get('/ib/stats/overview'),
  },

  // Client endpoints
  client: {
    getAll: (params) => apiClient.get('/client', params),
    getById: (id) => apiClient.get(`/client/${id}`),
    create: (clientData) => apiClient.post('/client', clientData),
    update: (id, clientData) => apiClient.put(`/client/${id}`, clientData),
    updateTradingStats: (id, stats) => apiClient.patch(`/client/${id}/trading-stats`, stats),
    getStats: () => apiClient.get('/client/stats/overview'),
    getByIB: (ibId) => apiClient.get(`/client/ib/${ibId}`),
  },

  // Transaction endpoints
  transaction: {
    getAll: (params) => apiClient.get('/transaction', params),
    getById: (id) => apiClient.get(`/transaction/${id}`),
    create: (transactionData) => apiClient.post('/transaction', transactionData),
    updateStatus: (id, status) => apiClient.patch(`/transaction/${id}/status`, { status }),
    getStats: () => apiClient.get('/transaction/stats/overview'),
    getByDateRange: (startDate, endDate) => apiClient.get(`/transaction/date-range/${startDate}/${endDate}`),
    getByClient: (clientId) => apiClient.get(`/transaction/client/${clientId}`),
    getByIB: (ibId) => apiClient.get(`/transaction/ib/${ibId}`),
  },

  // Dashboard endpoints
  dashboard: {
    overview: () => apiClient.get('/dashboard/overview'),
    ibAnalytics: (params) => apiClient.get('/dashboard/ib-analytics', params),
    clientAnalytics: (params) => apiClient.get('/dashboard/client-analytics', params),
    financialAnalytics: (params) => apiClient.get('/dashboard/financial-analytics', params),
  },

  // Health check
  health: () => apiClient.get('/health'),
};

// Token management
export const tokenManager = {
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  removeToken: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Helper function to get API base URL for direct fetch calls
export const getApiBaseUrl = () => {
  // If VITE_API_BASE_URL is explicitly set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // In production, use relative path
  if (import.meta.env.PROD) {
    return '/api';
  }
  // In development, always use localhost:5005
  return 'http://localhost:5005/api';
};

// Helper function for direct fetch calls that need absolute URLs
export const apiFetch = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
  // Add auth token if available
  const isAdminRoute = endpoint.includes('/admin');
  const token = isAdminRoute 
    ? localStorage.getItem('adminToken') 
    : localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers
  });
};

export default apiClient;
