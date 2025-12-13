import { createContext, useContext, useReducer, useEffect } from 'react';
import { initialState } from './constants';

const AppContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
    
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        sidebarOpen: action.payload
      };
    
    case 'SET_ACTIVE_MENU':
      return {
        ...state,
        activeMenu: action.payload
      };
    
    case 'TOGGLE_MENU_EXPANSION': {
      const menu = action.payload;
      const expandedMenus = state.expandedMenus.includes(menu)
        ? state.expandedMenus.filter(m => m !== menu)
        : [...state.expandedMenus, menu];
      return {
        ...state,
        expandedMenus
      };
    }
    
    case 'SET_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        user: { ...state.user, isAuthenticated: action.payload }
      };
    
    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    appReducer,
    initialState,
    (init) => {
      try {
        const savedUser = localStorage.getItem('app_user');
        const token = localStorage.getItem('token');
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;

        if (parsedUser) {
          return {
            ...init,
            user: {
              ...init.user,
              ...parsedUser,
              isAuthenticated: !!token && (parsedUser.isAuthenticated ?? true)
            }
          };
        }

        if (token) {
          return {
            ...init,
            user: {
              ...init.user,
              isAuthenticated: true
            }
          };
        }
      } catch (e) {
        // ignore parsing errors
      }
      return init;
    }
  );

  // On mount, collapse sidebar on small screens
  useEffect(() => {
    try {
      const w = window.innerWidth;
      if (w < 1024 && state.sidebarOpen) {
        dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false });
      }
    } catch {}
  }, []);

  // Persist user state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('app_user', JSON.stringify(state.user));
    } catch (e) {
      // ignore storage errors
    }
  }, [state.user]);

  const value = {
    ...state,
    dispatch,
    // Helper functions
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setSidebarOpen: (open) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open }),
    setActiveMenu: (menu) => dispatch({ type: 'SET_ACTIVE_MENU', payload: menu }),
    toggleMenuExpansion: (menu) => dispatch({ type: 'TOGGLE_MENU_EXPANSION', payload: menu }),
    setUser: (user) => dispatch({ type: 'SET_USER', payload: user }),
    setAuthenticated: (auth) => dispatch({ type: 'SET_AUTHENTICATED', payload: auth }),
    setLanguage: (lang) => dispatch({ type: 'SET_LANGUAGE', payload: lang }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    addNotification: (notification) => dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    removeNotification: (id) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    logout: async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Call logout API to destroy session on server
        if (token) {
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          } catch (error) {
            // Continue with logout even if API call fails
            console.warn('Logout API call failed:', error);
          }
        }
        
        // Clear all auth data
        dispatch({ type: 'SET_AUTHENTICATED', payload: false });
        dispatch({ type: 'SET_USER', payload: { name: '', email: '', avatar: null } });
        
        try {
          localStorage.removeItem('app_user');
          localStorage.removeItem('token');
          localStorage.removeItem('userToken');
          localStorage.removeItem('user');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          // Clear cached data
          localStorage.removeItem('commission_analytics_cache');
          localStorage.removeItem('commission_analytics_cache_timestamp');
          localStorage.removeItem('dashboard_cache');
          localStorage.removeItem('dashboard_cache_timestamp');
        } catch (e) {
          // ignore storage errors
        }
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if there's an error
        try {
          localStorage.clear();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        } catch (e) {
          // ignore errors
        }
      }
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
