import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { User, Bell, CheckSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

const HeaderBar = () => {
  const { isAuthenticated, user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(3); // Mock unread count

  const handleMusterClick = () => {
    // Handle muster functionality
    console.log('Muster clicked');
  };

  const handleNotificationsClick = () => {
    // Handle notifications functionality
    console.log('Notifications clicked');
    setUnreadNotifications(0); // Clear notifications on click
  };
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/20 backdrop-blur-lg border-b border-white/10 shadow-lg shadow-black/20">
      <div className="mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left Section - Logo and Institute Title */}
        <div className="flex items-center gap-3 min-w-0">
          <img src={logo} alt="YBIT" className="h-9 w-9 rounded-sm object-contain" />
          <h1 className="text-sm sm:text-base md:text-lg font-semibold text-white truncate">
            Yashwantrao Bhonsale Institute Of Technology
          </h1>
        </div>

        {/* Right nav: Dashboard + Muster + Notifications + Account/Login (large screens) */}
        <nav className="hidden lg:block">
          <ul className="flex items-center gap-4 text-sm">
            {/* Dashboard Button - Glass Style */}
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl transition-all duration-200 font-medium ${
                    isActive 
                      ? 'bg-white/20 text-white shadow-lg shadow-white/10 border border-white/20' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10'
                  }`
                }
              >
                Dashboard
              </NavLink>
            </li>
            
            {/* Muster Button - Primary Gradient Style */}
            <li>
              <button
                onClick={handleMusterClick}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
              >
                <CheckSquare size={16} />
                <span className="hidden sm:inline">Muster</span>
              </button>
            </li>

            {/* Notifications Button - Circular Glass Style */}
            <li>
              <button
                onClick={handleNotificationsClick}
                className="relative w-10 h-10 flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 group border border-white/10 hover:border-white/20"
                title="Notifications"
              >
                <Bell size={18} className="group-hover:scale-110 transition-transform duration-200" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse shadow-lg border border-white/20">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
            </li>

            {/* User Profile - Glass Style with Avatar */}
            {isAuthenticated ? (
              <li>
                <NavLink
                  to="/account"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 font-medium ${
                      isActive 
                        ? 'bg-white/20 text-white shadow-lg shadow-white/10 border border-white/20' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10'
                    }`
                  }
                  title={user?.username || 'Account'}
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="hidden sm:inline">{user?.username || 'Account'}</span>
                </NavLink>
              </li>
            ) : (
              <li>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl transition-all duration-200 font-medium ${
                      isActive 
                        ? 'bg-white/20 text-white shadow-lg shadow-white/10 border border-white/20' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10'
                    }`
                }
                >
                  Login
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* Mobile Navigation - Show on smaller screens */}
        <nav className="lg:hidden flex items-center gap-3">
          {/* Mobile Muster Button */}
          <button
            onClick={handleMusterClick}
            className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
            title="Muster"
          >
            <CheckSquare size={16} />
          </button>

          {/* Mobile Notifications Button */}
          <button
            onClick={handleNotificationsClick}
            className="relative w-9 h-9 flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 group border border-white/10 hover:border-white/20"
            title="Notifications"
          >
            <Bell size={16} className="group-hover:scale-110 transition-transform duration-200" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse shadow-lg border border-white/20">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {/* Mobile Account/Login */}
          {isAuthenticated ? (
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/20 text-white shadow-lg shadow-white/10 border border-white/20' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10'
                }`
              }
              title={user?.username || 'Account'}
            >
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User size={12} className="text-white" />
              </div>
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                    ? 'bg-white/20 text-white shadow-lg shadow-white/10 border border-white/20' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10'
                }`
              }
            >
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default HeaderBar;
