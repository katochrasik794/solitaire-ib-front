import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiActivity,
  FiGrid,
  FiBarChart2,
  FiPercent,
  FiUsers,
  FiGitBranch,
  FiDollarSign,
  FiCreditCard,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiDatabase,
  FiTrendingUp,
  FiClock
} from 'react-icons/fi';
import { useApp } from '../../context/AppContext';

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);
  const isDesktop = vw >= 1024; // tailwind lg breakpoint

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (!isDesktop) {
      document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDesktop, sidebarOpen]);


  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'IB Dashboard',
      icon: FiActivity,
      path: '/'
    },
    {
      id: 'pip-calculator',
      label: 'Pip Calculator',
      icon: FiPercent,
      path: '/pip-calculator'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: FiUsers,
      path: '/clients',
      badge: 'New'
    },
    {
      id: 'client-accounts',
      label: 'Client accounts',
      icon: FiUser,
      path: '/client-accounts'
    },
    {
      id: 'client-transactions',
      label: 'Client transactions',
      icon: FiDatabase,
      path: '/client-transactions'
    },
    {
      id: 'transactions-pending',
      label: 'Transactions pending payment',
      icon: FiClock,
      path: '/transactions-pending'
    },
    {
      id: 'performance-statistics',
      label: 'Performance statistics',
      icon: FiTrendingUp,
      path: '/performance-statistics'
    },
    {
      id: 'claim-rewards',
      label: 'Claim Rewards',
      icon: FiDollarSign,
      path: '/claim-rewards'
    },
    {
      id: 'reward-history',
      label: 'Reward history',
      icon: FiDollarSign,
      path: '/reward-history'
    },
    {
      id: 'my-commission',
      label: 'My Commission',
      icon: FiDollarSign,
      path: '/my-commission'
    },
    {
      id: 'withdrawals',
      label: 'Withdrawals',
      icon: FiCreditCard,
      path: '/withdrawals'
    },
    {
      id: 'withdrawal-history',
      label: 'Withdrawal History',
      icon: FiBarChart2,
      path: '/withdrawal-history'
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path;
  };

  const handleLogout = async () => {
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

      // Clear all auth data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('user');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('app_user');
      localStorage.removeItem('userToken');

      // Clear any cached data
      localStorage.removeItem('commission_analytics_cache');
      localStorage.removeItem('commission_analytics_cache_timestamp');
      localStorage.removeItem('dashboard_cache');
      localStorage.removeItem('dashboard_cache_timestamp');

      // Redirect to login with full page reload to ensure complete cleanup
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const sidebarVariants = isDesktop
    ? { open: { width: 280, x: 0 }, closed: { width: 80, x: 0 } }
    : { open: { width: '70vw', x: 0 }, closed: { width: 0, x: '-100%' } };

  const contentVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden bg-transparent backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={sidebarOpen ? 'open' : 'closed'}
        initial="closed"
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 lg:z-30 overflow-hidden shadow-xl ${!isDesktop && !sidebarOpen ? 'pointer-events-none' : ''}`}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <motion.div
              variants={contentVariants}
              animate={sidebarOpen ? 'open' : 'closed'}
              className="flex items-center"
            >
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                <img
                  src="/ib_images/logo.svg"
                  alt="Solitaire Partners"
                  className="h-8 w-auto"
                />
              </div>
              {sidebarOpen && (
                <span className="ml-3 text-lg font-semibold text-gray-900">
                  Solitaire Partners
                </span>
              )}
            </motion.div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {sidebarOpen ? (
                <FiChevronLeft className="h-5 w-5" />
              ) : (
                <FiChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                onClick={() => {
                  // Close the sidebar on navigation for mobile screens
                  if (!isDesktop) setSidebarOpen(false);
                }}
              >
                <div className="flex items-center">
                  <item.icon className="h-5 w-5 flex-shrink-0" />

                  <motion.span
                    variants={contentVariants}
                    animate={sidebarOpen ? 'open' : 'closed'}
                    className="ml-3 truncate"
                  >
                    {item.label}
                  </motion.span>
                </div>

                {item.badge && sidebarOpen && (
                  <motion.span
                    variants={contentVariants}
                    animate={sidebarOpen ? 'open' : 'closed'}
                    className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </Link>
            ))}
          </nav>

          {/* Footer with Sign out */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <FiLogOut className="h-5 w-5 flex-shrink-0" />
              <motion.span
                variants={contentVariants}
                animate={sidebarOpen ? 'open' : 'closed'}
                className="ml-3 truncate"
              >
                Sign out
              </motion.span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
