import { createContext, useReducer, useEffect } from 'react';
import { api } from '../utils/api';

// Initial admin state
const initialAdminState = {
  // Authentication
  adminUser: {
    name: '',
    email: '',
    role: 'admin',
    isAuthenticated: false,
    permissions: ['read', 'write', 'delete', 'approve']
  },
  adminToken: null,

  // IB Management
  ibs: [
    {
      id: 1,
      name: 'IB Partner 1',
      email: 'ib1@example.com',
      status: 'active',
      joinDate: '2024-01-15',
      totalClients: 25,
      totalVolume: 1500000,
      commission: 20,
      performance: 'excellent'
    },
    {
      id: 2,
      name: 'IB Partner 2',
      email: 'ib2@example.com',
      status: 'pending',
      joinDate: '2024-02-20',
      totalClients: 8,
      totalVolume: 450000,
      commission: 15,
      performance: 'good'
    },
    {
      id: 3,
      name: 'IB Partner 3',
      email: 'ib3@example.com',
      status: 'suspended',
      joinDate: '2023-12-10',
      totalClients: 0,
      totalVolume: 0,
      commission: 10,
      performance: 'inactive'
    }
  ],

  // IB Requests
  ibRequests: [
    {
      id: 1,
      name: 'New IB Applicant',
      email: 'applicant@example.com',
      applicationDate: '2024-03-15',
      status: 'pending',
      documents: ['id_proof', 'address_proof'],
      comments: 'Strong background in finance'
    }
  ],

  // Trading Data
  symbols: [
    { symbol: 'EURUSD', pipValue: 10, spread: 1.2, status: 'active' },
    { symbol: 'GBPUSD', pipValue: 10, spread: 1.5, status: 'active' },
    { symbol: 'USDJPY', pipValue: 9.5, spread: 1.0, status: 'active' },
    { symbol: 'XAUUSD', pipValue: 1, spread: 25, status: 'active' }
  ],

  // Financial Data
  budgets: [
    { ibId: 1, monthlyBudget: 50000, spent: 35000, remaining: 15000 },
    { ibId: 2, monthlyBudget: 25000, spent: 12000, remaining: 13000 }
  ],

  settlements: [
    { id: 1, ibName: 'IB Partner 1', amount: 2500, date: '2024-03-15', status: 'completed' },
    { id: 2, ibName: 'IB Partner 2', amount: 1200, date: '2024-03-14', status: 'pending' }
  ],

  // UI State
  activeAdminMenu: 'dashboard',
  sidebarOpen: false, // Closed by default, will be set based on screen size
  expandedMenus: [],
  loading: false,
  notifications: []
};

// Admin reducer
const adminReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ADMIN_AUTH':
      return {
        ...state,
        adminUser: { ...state.adminUser, ...action.payload }
      };

    case 'ADMIN_LOGIN':
      return {
        ...state,
        adminUser: {
          ...state.adminUser,
          ...action.payload.user,
          isAuthenticated: true
        },
        adminToken: action.payload.token
      };

    case 'ADMIN_LOGOUT':
      return {
        ...initialAdminState
      };

    case 'SET_ACTIVE_ADMIN_MENU':
      return {
        ...state,
        activeAdminMenu: action.payload
      };

    case 'TOGGLE_ADMIN_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };

    case 'SET_SIDEBAR_STATE':
      return {
        ...state,
        sidebarOpen: action.payload
      };

    case 'TOGGLE_MENU_EXPANSION':
      return {
        ...state,
        expandedMenus: state.expandedMenus.includes(action.payload)
          ? state.expandedMenus.filter(id => id !== action.payload)
          : [...state.expandedMenus, action.payload]
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'ADD_IB':
      return {
        ...state,
        ibs: [...state.ibs, { ...action.payload, id: Date.now() }]
      };

    case 'UPDATE_IB':
      return {
        ...state,
        ibs: state.ibs.map(ib =>
          ib.id === action.payload.id ? { ...ib, ...action.payload } : ib
        )
      };

    case 'DELETE_IB':
      return {
        ...state,
        ibs: state.ibs.filter(ib => ib.id !== action.payload)
      };

    case 'APPROVE_IB_REQUEST': {
      const approvedRequest = state.ibRequests.find(req => req.id === action.payload);
      if (approvedRequest) {
        const newIb = {
          id: Date.now(),
          name: approvedRequest.name,
          email: approvedRequest.email,
          status: 'active',
          joinDate: new Date().toISOString().split('T')[0],
          totalClients: 0,
          totalVolume: 0,
          commission: 15,
          performance: 'new'
        };
        return {
          ...state,
          ibs: [...state.ibs, newIb],
          ibRequests: state.ibRequests.filter(req => req.id !== action.payload)
        };
      }
      return state;
    }

    case 'REJECT_IB_REQUEST':
      return {
        ...state,
        ibRequests: state.ibRequests.filter(req => req.id !== action.payload)
      };

    case 'UPDATE_SYMBOL':
      return {
        ...state,
        symbols: state.symbols.map(symbol =>
          symbol.symbol === action.payload.symbol ? { ...symbol, ...action.payload } : symbol
        )
      };

    case 'ADD_SETTLEMENT':
      return {
        ...state,
        settlements: [...state.settlements, { ...action.payload, id: Date.now() }]
      };

    case 'UPDATE_SETTLEMENT_STATUS':
      return {
        ...state,
        settlements: state.settlements.map(settlement =>
          settlement.id === action.payload.id
            ? { ...settlement, status: action.payload.status }
            : settlement
        )
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

// Context
const AdminContext = createContext();

// Provider
export const AdminProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialAdminState);

  useEffect(() => {
    try {
      // Support both legacy and new storage keys so refresh doesn't log out
      const storedUserLegacy = localStorage.getItem('admin_user');
      const storedTokenLegacy = localStorage.getItem('admin_token');

      const storedToken = localStorage.getItem('adminToken');
      const storedInfo = localStorage.getItem('adminInfo');

      let user = null;
      let token = null;

      if (storedToken && storedInfo) {
        token = storedToken;
        try { user = JSON.parse(storedInfo); } catch {}
      }

      if (!user || !token) {
        if (storedUserLegacy && storedTokenLegacy) {
          token = storedTokenLegacy;
          try { user = JSON.parse(storedUserLegacy); } catch {}
        }
      }

      if (user && token) {
        dispatch({
          type: 'ADMIN_LOGIN',
          payload: {
            user,
            token
          }
        });
      }
    } catch (error) {
      // ignore malformed storage
    }

    // Set initial sidebar state based on screen size
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      dispatch({ type: 'SET_SIDEBAR_STATE', payload: !isMobile });
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const value = {
    ...state,
    dispatch,
    // Helper functions
    adminLogin: async (credentials) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await api.admin.login(credentials);
        const adminData = response?.data?.admin;
        const token = response?.data?.token;

        if (!adminData || !token) {
          throw new Error('Invalid server response');
        }

        const adminUser = {
          id: adminData.id,
          email: adminData.email,
          name: adminData.fullName,
          role: 'admin',
          permissions: state.adminUser.permissions
        };

        localStorage.setItem('admin_user', JSON.stringify(adminUser));
        localStorage.setItem('admin_token', token);
        // Also store as adminToken for components that expect this key
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminInfo', JSON.stringify(adminUser));

        dispatch({
          type: 'ADMIN_LOGIN',
          payload: {
            user: adminUser,
            token
          }
        });

        return { admin: adminUser, token };
      } catch (error) {
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    adminLogout: () => {
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      dispatch({ type: 'ADMIN_LOGOUT' });
    },
    setActiveAdminMenu: (menu) => dispatch({ type: 'SET_ACTIVE_ADMIN_MENU', payload: menu }),
    toggleAdminSidebar: () => dispatch({ type: 'TOGGLE_ADMIN_SIDEBAR' }),
    setSidebarState: (state) => dispatch({ type: 'SET_SIDEBAR_STATE', payload: state }),
    toggleMenuExpansion: (menuId) => dispatch({ type: 'TOGGLE_MENU_EXPANSION', payload: menuId }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),

    // IB Management
    addIB: (ib) => dispatch({ type: 'ADD_IB', payload: ib }),
    updateIB: (ib) => dispatch({ type: 'UPDATE_IB', payload: ib }),
    deleteIB: (id) => dispatch({ type: 'DELETE_IB', payload: id }),

    // IB Requests
    approveIBRequest: (id) => dispatch({ type: 'APPROVE_IB_REQUEST', payload: id }),
    rejectIBRequest: (id) => dispatch({ type: 'REJECT_IB_REQUEST', payload: id }),

    // Trading Management
    updateSymbol: (symbol) => dispatch({ type: 'UPDATE_SYMBOL', payload: symbol }),

    // Financial Management
    addSettlement: (settlement) => dispatch({ type: 'ADD_SETTLEMENT', payload: settlement }),
    updateSettlementStatus: (id, status) =>
      dispatch({ type: 'UPDATE_SETTLEMENT_STATUS', payload: { id, status } }),

    // Notifications
    addNotification: (notification) => dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    removeNotification: (id) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

// Export context for use in hook
export default AdminContext;
