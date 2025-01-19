import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, ChevronDown, Settings, LogOut } from 'react-feather';
import { getToken } from '../../utils/auth.ts';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig.ts';

interface TopbarProps {
  toggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ toggleSidebar }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = getToken();
      const response = await axiosInstance.get('http://147.93.53.119/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserData(response.data);
    } catch (error) {
      console.error('Failed to fetch user data', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/logout');
      localStorage.removeItem('access_token');
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button 
              className="text-purple-600 hover:text-purple-800 transition-colors duration-200 mr-4" 
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-purple-600">Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-purple-600 hover:text-purple-800 transition-colors duration-200 relative">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
            </button>
            <div className="relative">
              <button 
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors duration-200"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <User className="h-6 w-6" />
                <span className="hidden md:block font-medium">{userData?.first_name} {userData?.last_name}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <a href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-100">
                    <User className="h-4 w-4 mr-2" />
                    Your Profile
                  </a>
                  <a href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-100">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </a>
                  <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-100">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

