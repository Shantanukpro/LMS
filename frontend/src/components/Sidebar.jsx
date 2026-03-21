import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Building2,
  Monitor,
  Cpu,
  Grid,
  Wrench,
  Package,
  Sun,
  Moon,
} from 'lucide-react';
import { useColorMode } from '../contexts/ThemeContext';

const menuItems = [
  { name: 'Labs', icon: Building2, path: '/labs' },
  { name: 'PCs', icon: Monitor, path: '/pcs' },
  { name: 'Equipment', icon: Cpu, path: '/equipment' },
  { name: 'Software', icon: Grid, path: '/software' },
  { name: 'Maintenance', icon: Wrench, path: '/maintenance' },
  { name: 'Inventory', icon: Package, path: '/inventory' },
];

const Sidebar = () => {
  const location = useLocation();
  const { mode, toggleMode } = useColorMode();

  return (
    <aside
      className="peer group fixed left-0 top-16 z-40 h-[calc(100vh-64px)] w-16 hover:w-64 bg-black/30 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ease-out"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      aria-label="Sidebar"
    >
      <div className="flex h-full flex-col">
        {/* Spacer (top padding) */}
        <div className="px-3 py-4" />

        {/* Middle: Navigation */}
        <nav className="mt-2 flex-1 overflow-y-auto">
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <ul className="space-y-2 px-3 scrollbar-hide">
            {menuItems.map(({ name, icon: Icon, path }) => {
              const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
              return (
                <li key={name} className="group">
                  <NavLink
                    to={path}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 relative overflow-hidden ${
                      active
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 shadow-lg shadow-blue-500/20 border-l-4 border-l-blue-500 border border-white/20'
                        : 'hover:bg-white/10 border border-transparent hover:border-white/20'
                    }`}
                    title={name}
                    style={{ 
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      backgroundColor: active ? 'var(--accent-bg)' : 'transparent'
                    }}
                  >
                    {/* Glow effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300 rounded-xl"></div>
                    
                    <Icon size={20} className="shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110" style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }} />
                    <span
                      className="opacity-0 translate-x-[-6px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out whitespace-nowrap relative z-10"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {name}
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom: Theme toggle */}
        <div className="mt-auto px-3 pb-4">
          <button
            onClick={toggleMode}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 group relative overflow-hidden border border-transparent hover:border-white/20"
            title="Toggle theme"
            style={{ color: 'var(--text-secondary)', backgroundColor: 'transparent' }}
          >
            {/* Glow effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300 rounded-xl"></div>
            
            {mode === 'dark' ? (
              <Sun size={20} className="shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <Moon size={20} className="shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110" style={{ color: 'var(--text-secondary)' }} />
            )}
            <span className="opacity-0 translate-x-[-6px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out whitespace-nowrap relative z-10" style={{ color: 'var(--text-primary)' }}>
              {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
