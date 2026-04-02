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
  LayoutDashboard,
} from 'lucide-react';
import { useColorMode } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  { name: 'Labs',        icon: Building2,      path: '/labs',        adminOnly: true },
  { name: 'PCs',         icon: Monitor,        path: '/pcs',         adminOnly: true },
  { name: 'Equipment',   icon: Cpu,            path: '/equipment',   adminOnly: true },
  { name: 'Software',    icon: Grid,           path: '/software',    adminOnly: true },
  { name: 'Maintenance', icon: Wrench,         path: '/maintenance', adminOnly: false },
  { name: 'Inventory',   icon: Package,        path: '/inventory',   adminOnly: true },
];

const Sidebar = () => {
  const location = useLocation();
  const { mode, toggleMode } = useColorMode();
  const { user } = useAuth();

  // Filter menu items based on user role
  const visibleItems = menuItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <aside
      className="peer group fixed left-0 top-16 z-40 h-[calc(100vh-64px)]
                 w-16 hover:w-60
                 bg-white dark:bg-gray-900
                 border-r border-gray-100 dark:border-gray-800
                 shadow-sm
                 transition-all duration-300 ease-out
                 flex flex-col"
      aria-label="Sidebar"
    >
      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-0.5 scrollbar-hide">
        {/* eslint-disable-next-line no-unused-vars */}
        {visibleItems.map(({ name, icon: Icon, path }) => {
          const active =
            location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));

          return (
            <NavLink
              key={name}
              to={path}
              title={name}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2.5
                transition-all duration-150 ease-in-out
                group/item relative
                ${active
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100'
                }
              `}
            >
              {/* Active indicator bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-blue-500 dark:bg-blue-400" />
              )}

              <Icon
                size={18}
                className={`shrink-0 transition-colors duration-150
                  ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover/item:text-gray-600 dark:group-hover/item:text-gray-300'}
                `}
              />
              <span
                className="nav-label opacity-0 -translate-x-1 
                           group-hover:opacity-100 group-hover:translate-x-0 
                           transition-all duration-200 ease-out"
              >
                {name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Theme toggle anchored to the bottom */}
      <div className="px-2 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={toggleMode}
          title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5
                     text-gray-500 dark:text-gray-400
                     hover:bg-gray-50 dark:hover:bg-gray-800
                     hover:text-gray-800 dark:hover:text-gray-100
                     transition-all duration-150"
        >
          {mode === 'dark'
            ? <Sun  size={18} className="shrink-0 text-amber-400" />
            : <Moon size={18} className="shrink-0 text-indigo-400" />
          }
          <span className="nav-label opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out">
            {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
