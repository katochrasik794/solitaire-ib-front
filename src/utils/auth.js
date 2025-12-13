// Authentication utility functions for admin token management

const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '/api').toString().trim().replace(/\/$/, '');

export const authUtils = {
  // Token storage keys
  TOKEN_KEY: 'adminToken',
  ADMIN_INFO_KEY: 'adminInfo',

  // Set authentication token in both localStorage and cookies
  setAuthToken: async (token) => {
    try {
      // Store in localStorage for JavaScript access
      localStorage.setItem(authUtils.TOKEN_KEY, token);

      // Set httpOnly cookie via server endpoint for additional security
      const response = await fetch(`${API_BASE}/admin/set-cookie`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('Failed to set httpOnly cookie');
      }

      return true;
    } catch (error) {
      console.error('Error setting auth token:', error);
      return false;
    }
  },

  // Get authentication token from localStorage
  getAuthToken: () => {
    try {
      return localStorage.getItem(authUtils.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  // Get admin info from localStorage
  getAdminInfo: () => {
    try {
      const adminInfo = localStorage.getItem(authUtils.ADMIN_INFO_KEY);
      return adminInfo ? JSON.parse(adminInfo) : null;
    } catch (error) {
      console.error('Error getting admin info:', error);
      return null;
    }
  },

  // Set admin info in localStorage
  setAdminInfo: (adminInfo) => {
    try {
      localStorage.setItem(authUtils.ADMIN_INFO_KEY, JSON.stringify(adminInfo));
      return true;
    } catch (error) {
      console.error('Error setting admin info:', error);
      return false;
    }
  },

  // Clear all authentication data
  clearAuthToken: async () => {
    try {
      // Clear localStorage
      localStorage.removeItem(authUtils.TOKEN_KEY);
      localStorage.removeItem(authUtils.ADMIN_INFO_KEY);

      // Clear httpOnly cookie via server
      const response = await fetch(`${API_BASE}/admin/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Don't throw error if logout fails - cookies might have expired
      if (!response.ok) {
        console.warn('Logout request failed, but clearing local storage');
      }

      return true;
    } catch (error) {
      console.error('Error clearing auth token:', error);
      return false;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    try {
      const token = authUtils.getAuthToken();
      const adminInfo = authUtils.getAdminInfo();

      if (!token || !adminInfo) {
        return false;
      }

      // Check if token is expired (basic check)
      if (authUtils.isTokenExpired(token)) {
        authUtils.clearAuthToken();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Basic token expiration check (JWT tokens contain expiration in payload)
  isTokenExpired: (token) => {
    try {
      if (!token) return true;

      // Decode JWT payload (basic implementation)
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Check if token has expired (with 5 minute buffer)
      const currentTime = Date.now() / 1000;
      return (payload.exp - 300) < currentTime; // 5 minute buffer
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if we can't decode
    }
  },

  // Get authorization header for API requests
  getAuthHeader: () => {
    const token = authUtils.getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  // Refresh admin info from server
  refreshAdminInfo: async () => {
    try {
      const token = authUtils.getAuthToken();

      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE}/admin/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        authUtils.setAdminInfo(data.data.admin);
        return data.data.admin;
      } else if (response.status === 401) {
        // Token is invalid, clear everything
        await authUtils.clearAuthToken();
        return null;
      }

      return null;
    } catch (error) {
      console.error('Error refreshing admin info:', error);
      return null;
    }
  }
};

export default authUtils;
