import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiUser, FiSettings, FiLogOut, FiMenu } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';

const Header = () => {
  const { sidebarOpen, toggleSidebar, user, logout } = useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <motion.header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Mobile Menu */}
          <div className="flex items-center">
            {/* Menu button (visible on all screens) */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#8B5CF6]"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <FiMenu className="h-6 w-6" />
            </button>
          </div>

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]">
              <FiBell className="h-5 w-5" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              >
                <FiUser className="h-5 w-5" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <FiSettings className="mr-3 h-4 w-4" />
                    Account
                  </button>
                  
                  <button 
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logout();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiLogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </motion.header>
  );
};

export default Header;
