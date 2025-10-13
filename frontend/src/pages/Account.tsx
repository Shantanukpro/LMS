import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useColorMode } from '../contexts/ThemeContext';

const Account: React.FC = () => {
  const { user, isAuthenticated, devSignIn, logout } = useAuth();
  const navigate = useNavigate();
  const { mode } = useColorMode();

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className={`text-xl font-semibold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Account</h2>
        <p className={`mb-4 ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>You are not logged in.</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-500 transition-colors"
          >
            Go to Login
          </button>
          <button
            onClick={devSignIn}
            className={`px-4 py-2 rounded-md transition-colors ${
              mode === 'dark'
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
            title="Temporary dev sign-in"
          >
            Dev Sign-In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className={`text-xl font-semibold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>My Account</h2>
      <div className={`rounded-lg border p-4 ${
        mode === 'dark'
          ? 'border-white/10 bg-white/5'
          : 'border-gray-200 bg-white'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className={`text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Username</div>
            <div className={`font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.username}</div>
          </div>
          <div>
            <div className={`text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Role</div>
            <div className={`font-medium capitalize ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.role}</div>
          </div>
          <div className="sm:col-span-2">
            <div className={`text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Email</div>
            <div className={`font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.email || '—'}</div>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className={`px-4 py-2 rounded-md transition-colors ${
              mode === 'dark'
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;
