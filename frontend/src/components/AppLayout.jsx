import React from 'react';
import Sidebar from './Sidebar.jsx';
import HeaderBar from './HeaderBar.jsx';
import { useColorMode } from '../contexts/ThemeContext';

const AppLayout = ({ children }) => {
  const { mode } = useColorMode();

  // Sync Tailwind's dark mode class with ThemeContext
  React.useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      // Apply dark theme variables
      root.style.setProperty('--bg-main', '#0F172A');
      root.style.setProperty('--card-bg', '#1E293B');
      root.style.setProperty('--text-primary', '#F1F5F9');
      root.style.setProperty('--text-secondary', '#94A3B8');
      root.style.setProperty('--border-color', '#334155');
      root.style.setProperty('--hover-bg', '#1E293B');
      root.style.setProperty('--accent-bg', '#1E293B');
    } else {
      root.classList.remove('dark');
      // Apply light theme variables
      root.style.setProperty('--bg-main', '#F5F7FB');
      root.style.setProperty('--card-bg', '#FFFFFF');
      root.style.setProperty('--text-primary', '#1F2937');
      root.style.setProperty('--text-secondary', '#6B7280');
      root.style.setProperty('--border-color', '#E5E7EB');
      root.style.setProperty('--hover-bg', '#F9FAFB');
      root.style.setProperty('--accent-bg', '#F3F4F6');
    }
  }, [mode]);

  return (
    <div className={`min-h-screen transition-colors duration-300`} style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* Fixed header with logo + college name + top nav */}
      <HeaderBar />

      {/* Sidebar under the header */}
      <Sidebar />

      {/* Main content on the right, shifts when sidebar expands */}
      <main className="transition-all duration-300 ease-out ml-16 peer-hover:ml-64 pt-16">
        <div className="p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
