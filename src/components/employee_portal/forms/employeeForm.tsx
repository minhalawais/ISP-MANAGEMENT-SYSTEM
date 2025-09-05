import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaEyeSlash, FaKey, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { debounce } from 'lodash';
import axiosInstance from '../../utils/axiosConfig.ts';
import { getToken } from '../../utils/auth.ts';

interface EmployeeFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isEditing: boolean;
}

export function EmployeeForm({ formData, handleInputChange, isEditing }: EmployeeFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    handleInputChange({
      target: {
        name: 'password',
        value: password
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const verifyUsername = useCallback(debounce(async (username: string) => {
    if (!username) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('loading');
    try {
      const token = getToken();
      const response = await axiosInstance.post('/employees/verify-username', { username }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsernameStatus(response.data.available ? 'valid' : 'invalid');
    } catch (error) {
      console.error('Error verifying username:', error);
      setUsernameStatus('invalid');
    }
  }, 300), []);

  const verifyEmail = useCallback(debounce(async (email: string) => {
    if (!email) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('loading');
    try {
      const token = getToken();
      const response = await axiosInstance.post('/employees/verify-email', { email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailStatus(response.data.available ? 'valid' : 'invalid');
    } catch (error) {
      console.error('Error verifying email:', error);
      setEmailStatus('invalid');
    }
  }, 300), []);

  useEffect(() => {
    if (!isEditing) {
      verifyUsername(formData.username);
      verifyEmail(formData.email);
    }
  }, [formData.username, formData.email, isEditing, verifyUsername, verifyEmail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    handleInputChange(e);
    if (e.target.name === 'username' && !isEditing) {
      verifyUsername(e.target.value);
    } else if (e.target.name === 'email' && !isEditing) {
      verifyEmail(e.target.value);
    }
  };

  const renderStatusIcon = (status: 'idle' | 'loading' | 'valid' | 'invalid') => {
    switch (status) {
      case 'loading':
        return <FaSpinner className="animate-spin text-gray-500" />;
      case 'valid':
        return <FaCheck className="text-green-500" />;
      case 'invalid':
        return <FaTimes className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="mt-2 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="first_name"
          value={formData.first_name || ''}
          onChange={handleChange}
          placeholder="First Name"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
        <input
          type="text"
          name="last_name"
          value={formData.last_name || ''}
          onChange={handleChange}
          placeholder="Last Name"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
      </div>

      <div className="relative">
        <input
          type="text"
          name="username"
          value={formData.username || ''}
          onChange={handleChange}
          placeholder="Username"
          className="w-full p-2 border border-gray-300 rounded-md pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {renderStatusIcon(usernameStatus)}
        </div>
      </div>

      <div className="relative">
        <input
          type="email"
          name="email"
          value={formData.email || ''}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 border border-gray-300 rounded-md pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {renderStatusIcon(emailStatus)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="contact_number"
          value={formData.contact_number || ''}
          onChange={handleChange}
          placeholder="Contact Number"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <input
          type="text"
          name="cnic"
          value={formData.cnic || ''}
          onChange={handleChange}
          placeholder="CNIC (e.g., 42201-1234567-1)"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password || ''}
          onChange={handleChange}
          placeholder="Password"
          className="w-full p-2 border border-gray-300 rounded-md pr-24 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required={!isEditing}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          <button
            type="button"
            onClick={generatePassword}
            className="p-1.5 text-gray-500 hover:text-purple-600 transition-colors"
            title="Generate Password"
          >
            <FaKey />
          </button>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 text-gray-500 hover:text-purple-600 transition-colors"
            title={showPassword ? "Hide Password" : "Show Password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      <select
        name="role"
        value={formData.role || ''}
        onChange={handleChange}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        required
      >
        <option value="">Select Role</option>
        <option value="auditor">Auditor</option>
        <option value="employee">Employee</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  );
}

