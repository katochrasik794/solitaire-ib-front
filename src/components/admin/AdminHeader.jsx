import React, { useState } from 'react';
import { FiBell, FiUser, FiSettings, FiLogOut, FiMenu } from 'react-icons/fi';
import { useAdmin } from '../../hooks/useAdmin';
import authUtils from '../../utils/auth';

const AdminHeader = () => {
  const { sidebarOpen, toggleAdminSidebar, adminUser, adminLogout } = useAdmin();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 w-full font-sans">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Left side - Logo and Mobile Menu */}
          <div className="flex items-center">
            {/* Menu button (visible on all screens) */}
            <button
              onClick={toggleAdminSidebar}
              className="p-2 rounded-md text-dark-base/50 hover:text-dark-base hover:bg-neutral-100 focus:outline-none"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <FiMenu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center ml-3 lg:ml-0 gap-3">
              <div className="flex-shrink-0">
                <img src="/favicon.png" alt="Solitaire IB Admin" className="h-10 w-auto" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-dark-base font-heading">Admin Panel</span>
              </div>
            </div>
          </div>

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="p-2 text-dark-base/50 hover:text-dark-base hover:bg-neutral-100 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500">
              <FiBell className="h-5 w-5" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center p-2 text-dark-base/50 hover:text-dark-base hover:bg-neutral-100 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <FiUser className="h-5 w-5" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-neutral-200">
                    <p className="text-sm font-medium text-dark-base">{adminUser.name}</p>
                    <p className="text-sm text-dark-base/60">{adminUser.email}</p>
                  </div>

                  <button className="flex items-center w-full px-4 py-2 text-sm text-dark-base/80 hover:bg-neutral-100">
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
                    className="flex items-center w-full px-4 py-2 text-sm text-dark-base/80 hover:bg-neutral-100"
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
