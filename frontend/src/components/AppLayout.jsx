import React from 'react';
import Sidebar from './Sidebar.jsx';
import HeaderBar from './HeaderBar.jsx';
import { useColorMode } from '../contexts/ThemeContext';
import bgImage from '../assets/tech_lab_bg.png';

const AppLayout = ({ children }) => {
  const { mode } = useColorMode();

  React.useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300 overflow-x-hidden">
      {/* ── Global Animated Tech Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-[-15%] opacity-15 dark:opacity-20"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: 'panBackground 40s ease-in-out infinite alternate',
          }}
        />
        {/* Soft edge gradient to blend into main background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f8fafc]/30 to-[#f8fafc] dark:via-[#030712]/30 dark:to-[#030712] pointer-events-none" />
      </div>

      <HeaderBar />
      <Sidebar />
      {/* Main content area — offset for fixed sidebar (w-16) and fixed header (h-16) */}
      <main className="relative z-10 transition-all duration-300 ease-out ml-16 peer-hover:ml-60 pt-16">
        <div className="p-6 sm:p-8 max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
