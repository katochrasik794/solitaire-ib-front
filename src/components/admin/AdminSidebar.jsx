import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiPercent,
  FiPieChart,
  FiSettings,
  FiChevronLeft,
  FiCreditCard,
  FiGlobe,
  FiList,
  FiLink,
  FiUser,
  FiEye,
  FiLayers,
  FiGift,
  FiBarChart,
  FiClock
} from 'react-icons/fi';
import { useAdmin } from '../../hooks/useAdmin';

const AdminSidebar = () => {
  const {
    sidebarOpen,
    setActiveAdminMenu,
    toggleAdminSidebar
  } = useAdmin();

  const location = useLocation();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'IB Dashboard',
      icon: FiHome,
      path: '/admin'
    },
    {
      id: 'ib-overview',
      label: 'IB Overview',
      icon: FiEye,
      path: '/admin/ib-management'
    },
    {
      id: 'ib-requests',
      label: 'IB Requests',
      icon: FiUserCheck,
      path: '/admin/ib-management/requests'
    },
    {
      id: 'ib-profiles',
      label: 'IB Profiles',
      icon: FiUsers,
      path: '/admin/ib-management/profiles'
    },
    {
      id: 'traders-profile',
      label: 'Traders Profile',
      icon: FiUser,
      path: '/admin/ib-management/traders'
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: FiLayers,
      path: '/admin/ib-management/commissions'
    },
    {
      id: 'commission-structures',
      label: 'Commission Structures',
      icon: FiPercent,
      path: '/admin/ib-management/commission-structures'
    },
    {
      id: 'all-symbols',
      label: 'All Symbols',
      icon: FiList,
      path: '/admin/ib-management/all-symbols'
    },
    {
      id: 'symbols',
      label: 'Symbols & Pip Values',
      icon: FiSettings,
      path: '/admin/trading-management/symbols'
    },
    {
      id: 'ib-withdrawals',
      label: 'IB Withdrawals',
      icon: FiCreditCard,
      path: '/admin/trading-management/ib-withdrawals'
    },
    {
      id: 'withdrawal-history',
      label: 'Withdrawal History',
      icon: FiClock,
      path: '/admin/reports/withdrawal-history'
    },
    {
      id: 'client-linking',
      label: 'Client Linking',
      icon: FiLink,
      path: '/admin/trading-management/client-linking'
    },
    {
      id: 'trading-groups',
      label: 'Trading Groups',
      icon: FiLayers,
      path: '/admin/group-management/trading-groups'
    },
    {
      id: 'commission-distribution',
      label: 'Commission Distribution',
      icon: FiPieChart,
      path: '/admin/group-management/commission-distribution'
    },
    {
      id: 'claimed-rewards',
      label: 'Claimed Rewards',
      icon: FiGift,
      path: '/admin/rewards/claims'
    },
    {
      id: 'ib-reports',
      label: 'IB Reports',
      icon: FiBarChart,
      path: '/admin/ib-reports'
    }
  ];

  const isActive = (path) => {
    // Check exact match first
    if (location.pathname === path) {
      return true;
    }

    // Check if current path starts with this path (for child routes like /profiles/:id)
    // But only if no other menu item has a more specific match
    if (location.pathname.startsWith(path + '/')) {
      // Find the most specific matching path
      const matchingPaths = menuItems
        .map(item => item.path)
        .filter(p => location.pathname === p || location.pathname.startsWith(p + '/'))
        .sort((a, b) => b.split('/').length - a.split('/').length); // Sort by specificity (longer = more specific)

      // Only return true if this is the most specific match
      return matchingPaths.length > 0 && matchingPaths[0] === path;
    }

    return false;
  };

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 right-0 bottom-0 top-16 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleAdminSidebar}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:sticky top-16 lg:top-0 left-0 h-[calc(100vh-4rem)] lg:h-screen bg-white border-r border-gray-200 z-50 lg:z-auto overflow-hidden shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 lg:translate-x-0 lg:w-64 xl:w-72' : '-translate-x-full lg:-translate-x-full lg:w-0'
          } ${sidebarOpen ? 'block' : 'block lg:hidden'}`}
      >
        <div className="flex flex-col h-full w-64 xl:w-72">
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <div className="flex items-center min-w-0">
<<<<<<< HEAD
                <img src="/favicon.png" alt="Solitaire IB Admin" className="h-7 w-auto flex-shrink-0" />
                <div className="ml-2 leading-tight min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 truncate">Admin Panel</span>
                  <span className="block text-xs font-medium text-gray-600 truncate">Solitaire IB</span>
=======
                <img src="/ib_images/logo.webp" alt="Soliataire Cabinet Admin" className="h-7 w-auto flex-shrink-0" />
                <div className="ml-2 leading-tight min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 truncate">Admin Panel</span>
                  <span className="block text-xs font-medium text-gray-600 truncate">Soliataire Cabinet</span>
>>>>>>> 91d101c6ddfc32096611f195ff1c356c17ad46f1
                </div>
              </div>

              <button
                onClick={toggleAdminSidebar}
                className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 flex-shrink-0 lg:hidden"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {menuItems.map((item) => {
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => {
                      setActiveAdminMenu(item.id);
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        toggleAdminSidebar();
                      }
                    }}
                    className={`flex items-center rounded-lg text-sm font-medium transition-colors px-3 py-2 ${active ? 'bg-[#8B5CF6] text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="ml-3 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 p-2">
              <div className="flex items-center px-3 py-1 text-sm text-gray-700">
                <FiGlobe className="h-4 w-4 flex-shrink-0" />
                <span className="ml-2 truncate">English</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
