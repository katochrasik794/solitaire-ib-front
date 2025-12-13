import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import { useApp } from '../../context/AppContext';

const Layout = ({ children }) => {
  const { sidebarOpen } = useApp();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Leave space for the fixed sidebar on large screens only
  const sidebarOffset = vw >= 1024 ? (sidebarOpen ? 280 : 80) : 0; // lg breakpoint

  return (
    <div className="min-h-screen bg-neutral-50 font-sans" style={{ paddingLeft: sidebarOffset }}>
      <Header />
      {/* Fixed sidebar sits outside normal flow; we reserve space via padding-left above */}
      <Sidebar />
      <motion.main
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="min-h-screen w-full"
      >
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default Layout;
