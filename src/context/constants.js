// Context constants and types
export const initialState = {
  // Sidebar state
  sidebarOpen: true,
  activeMenu: 'dashboard',
  expandedMenus: [],
  
  // User state
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: null,
    isAuthenticated: false
  },
  
  // Theme and language
  theme: 'light',
  language: 'en',
  
  // Loading states
  loading: false,
  
  // Notifications
  notifications: []
};
