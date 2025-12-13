import React from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { useAdmin } from '../../hooks/useAdmin';

const AdminLayout = ({ children }) => {
  const { sidebarOpen } = useAdmin();

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      <div className="flex">
        {sidebarOpen && <AdminSidebar />}
        <main className="flex-1 bg-gray-50 min-h-screen overflow-x-hidden overflow-y-auto transition-all duration-300 ease-in-out">
          <div className="px-3 sm:px-4 lg:px-6 xl:px-8 py-5 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
