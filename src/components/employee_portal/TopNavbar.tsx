import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, ChevronDown, Settings, LogOut } from 'lucide-react';
import { getToken, removeToken } from '../../utils/auth.ts';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig.ts';
import MBALogo from '../../assets/mba_logo.tsx';

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
      const response = await axiosInstance.get('/user/profile', {
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
      await axiosInstance.post('/auth/logout');
      removeToken();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-40">
      <div className="max-w mx-2 px-2 sm:px-2 lg:px-2">
        <div className="flex items-center justify-between h-16">
          <div className="h-10 w-32 -mt-1" style={{ width: '193px', height: '66px' }}>
            <MBALogo variant="landscape" />
          </div>
          
          <div className="flex items-center space-x-6">

            <div className="relative">
              <button 
                className="flex items-center space-x-3 text-gray-700 hover:text-purple-600 transition-colors duration-200"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{userData?.first_name} {userData?.last_name}</p>
                  <p className="text-xs text-gray-500">{userData?.role}</p>
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100">
                  <a 
                    href="/profile" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors duration-150"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Your Profile
                  </a>
                  <div className="h-px bg-gray-200 my-1"></div>
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                  >
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

