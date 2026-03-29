import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, Bell, CheckSquare, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationInbox from './Notifications/NotificationInbox';
import logo from '../assets/logo.png';

const HeaderBar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMusterClick = () => navigate('/muster/register');

  /* Shared nav-link class factory */
  const navLinkCls = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
     ${isActive
       ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
       : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
     }`;

  const iconBtnCls = `relative flex items-center justify-center w-9 h-9 rounded-lg text-sm text-gray-500 dark:text-gray-400
    hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200
    transition-all duration-150`;

  return (
    <header className="
      fixed top-0 left-0 right-0 z-50 h-16
      bg-white dark:bg-gray-900
      border-b border-gray-100 dark:border-gray-800
      shadow-[0_1px_3px_rgba(0,0,0,0.06)]
      font-sans
    ">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">

        {/* ── Left: Logo + Title ── */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <img
            src={logo}
            alt="YBIT"
            className="h-8 w-8 rounded-lg object-contain"
          />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 leading-tight truncate max-w-[260px]">
              Yashwantrao Bhonsale Institute of Technology
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase">
              Lab Management System
            </p>
          </div>
        </div>

        {/* ── Right: Nav actions ── */}
        <div className="flex items-center gap-1">

          {/* Dashboard link — desktop only */}
          <div className="hidden md:flex items-center">
            <NavLink to="/" className={navLinkCls}>
              <LayoutDashboard size={15} />
              Dashboard
            </NavLink>
          </div>

          {/* Muster — desktop only */}
          <div className="hidden md:flex items-center">
            <button
              onClick={handleMusterClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200`}
            >
              <CheckSquare size={15} />
              Muster
            </button>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Notifications */}
          {isAuthenticated && <NotificationInbox />}

          {/* Profile / Login */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1">
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition-all duration-150 border
                   ${isActive
                     ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                     : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                   }`
                }
                title={user?.username || 'Account'}
              >
                {/* Avatar: initials circle or image */}
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt={user?.username} className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.charAt(0)?.toUpperCase() ?? <User size={13} />
                  )}
                </div>
                <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300 font-medium max-w-[100px] truncate">
                  {user?.username || 'Account'}
                </span>
              </NavLink>
              <button
                onClick={handleLogout}
                className={iconBtnCls}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="px-4 py-1.5 text-sm font-semibold rounded-lg
                bg-blue-600 hover:bg-blue-700 text-white
                transition-all duration-150 shadow-sm"
            >
              Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
