import React, { useState } from 'react';
import { FiBell, FiUser, FiSettings, FiLogOut, FiMenu } from 'react-icons/fi';
import { useAdmin } from '../../hooks/useAdmin';
import authUtils from '../../utils/auth';

const AdminHeader = () => {
  const { sidebarOpen, toggleAdminSidebar, adminUser, adminLogout } = useAdmin();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Left side - Logo and Mobile Menu */}
          <div className="flex items-center">
            {/* Menu button (visible on all screens) */}
            <button
              onClick={toggleAdminSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#8B5CF6]"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <FiMenu className="h-5 w-5" />
            </button>
            
            {/* Logo */}
            <div className="flex items-center ml-3 lg:ml-0">
              <div className="flex-shrink-0">
                <img src="/ib_images/logo.webp" alt="Soliataire Cabinet Admin" className="h-7 w-auto" /> 
              </div>
              <h1 className="ml-2 text-lg font-bold text-[#8B5CF6]">Soliataire Cabinates</h1>
            </div>
          </div>

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center space-x-3">
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
                    <p className="text-sm font-medium text-gray-900">{adminUser.name}</p>
                    <p className="text-sm text-gray-500">{adminUser.email}</p>
                  </div>
                  
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <FiSettings className="mr-3 h-4 w-4" />
                    Settings
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        // Use new auth utilities for logout
                        await authUtils.clearAuthToken();
                        adminLogout();
                        setUserMenuOpen(false);
                      } catch (error) {
                        console.error('Logout error:', error);
                        // Force logout even if server request fails
                        await authUtils.clearAuthToken();
                        adminLogout();
                        setUserMenuOpen(false);
                      }
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
    </header>
  );
};

export default AdminHeader;
