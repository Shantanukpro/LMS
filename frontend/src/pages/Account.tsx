import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useColorMode } from '../contexts/ThemeContext';
import { usersAPI } from '../services/api';
import { Upload, User as UserIcon } from 'lucide-react';

const Spinner = () => (
  <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const Account: React.FC = () => {
  const { user, isAuthenticated, devSignIn, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { mode } = useColorMode();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('profile_picture', file);
      if (!user?.id) throw new Error('User ID missing');
      const data = await usersAPI.updateProfile(user.id, formData);
      updateUser({ profile_picture: data.profile_picture });
    } catch (err) {
      console.error('Failed to upload profile picture', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
      <div className={`rounded-lg border p-6 flex flex-col md:flex-row gap-8 ${
        mode === 'dark'
          ? 'border-white/10 bg-white/5'
          : 'border-gray-200 bg-white'
      }`}>
        
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center gap-4 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/10 pb-6 md:pb-0 md:pr-8">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-md">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt={user?.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-white font-bold">{user?.username?.charAt(0)?.toUpperCase()}</span>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Spinner />
              </div>
            )}
          </div>
          <div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              disabled={uploading}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Upload size={16} />
              Change Photo
            </button>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
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
