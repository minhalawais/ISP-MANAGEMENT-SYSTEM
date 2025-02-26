import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Key } from 'react-feather';
import axiosInstance from '../utils/axiosConfig.ts';
import { toast } from 'react-toastify';
import { getToken } from '../utils/auth.ts';
import { Sidebar } from '../components/sideNavbar.tsx';
import { Topbar } from '../components/topNavbar.tsx';
const UserProfile: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  useEffect(() => {
    document.title = "MBA NET - User Profile";
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = getToken();
      const response = await axiosInstance.get('http://127.0.0.1:5000/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserData(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch user data', error);
      toast.error('Failed to load user profile');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.put('/user/profile', formData);
      setUserData(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error('Failed to update profile');
    }
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
    <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar toggleSidebar={toggleSidebar} />
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-purple-600 text-white">
          <h2 className="text-2xl font-bold">User Profile</h2>
        </div>
        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="tel"
                  id="contact_number"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="text-purple-600" />
                <span className="font-medium">Name:</span>
                <span>{userData.first_name} {userData.last_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="text-purple-600" />
                <span className="font-medium">Email:</span>
                <span>{userData.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="text-purple-600" />
                <span className="font-medium">Contact Number:</span>
                <span>{userData.contact_number}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Key className="text-purple-600" />
                <span className="font-medium">Role:</span>
                <span>{userData.role}</span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default UserProfile;
