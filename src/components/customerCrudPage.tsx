import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import { ColumnDef } from '@tanstack/react-table';
import { FaPlus, FaFileExport, FaPen, FaTrash, FaEye } from 'react-icons/fa';
import { Table } from './table/table.tsx';
import { Modal } from './modal.tsx';
import { Topbar } from './topNavbar.tsx';
import { Sidebar } from './sideNavbar.tsx';
import { getToken } from '../utils/auth.ts';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../utils/axiosConfig.ts';

interface CRUDPageProps<T> {
  title: string;
  endpoint: string;
  columns: ColumnDef<T>[];
  FormComponent: React.ComponentType<{
    formData: Partial<T>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isEditing: boolean;
  }>;
  onSubmit: (data: Partial<T>, isEditing: boolean) => Promise<void>;
}

export function CRUDPage<T extends { id: string }>({ title, endpoint, columns, FormComponent }: CRUDPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Partial<T>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`http://147.93.53.119:5000/${endpoint}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error(`Failed to fetch ${title}`, error);
      toast.error(`Failed to fetch ${title}`, {
        style: { background: '#F1F0E8', color: '#B3C8CF' },
      });
    }
  };

  const showModal = (item: T | null) => {
    setEditingItem(item);
    setFormData(item || {});
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = getToken();
      const formDataToSend = new FormData();
    
      Object.keys(formData).forEach(key => {
        if (formData[key] != null) {
          if (key === 'cnic_image' && formData[key] instanceof File) {
            formDataToSend.append(key, formData[key], formData[key].name);
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      console.log('FormData contents:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }

      if (editingItem) {
        await axiosInstance.put(
          `http://147.93.53.119:5000/${endpoint}/update/${editingItem.id}`, 
          formDataToSend,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        toast.success(`${title} updated successfully`, {
          style: { background: '#E5E1DA', color: '#89A8B2' },
        });
      } else {
        await axiosInstance.post(
          `http://147.93.53.119:5000/${endpoint}/add`,
          formDataToSend,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        toast.success(`${title} added successfully`, {
          style: { background: '#E5E1DA', color: '#89A8B2' },
        });
      }
      fetchData();
      handleCancel();
    } catch (error) {
      console.error('Operation failed', error);
      toast.error('Operation failed', {
        style: { background: '#F1F0E8', color: '#B3C8CF' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) {
      try {
        const token = getToken();
        await axiosInstance.delete(`http://147.93.53.119:5000/${endpoint}/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`${title} deleted successfully`, {
          style: { background: '#E5E1DA', color: '#89A8B2' },
        });
        fetchData();
      } catch (error) {
        console.error('Delete operation failed', error);
        toast.error('Delete operation failed', {
          style: { background: '#F1F0E8', color: '#B3C8CF' },
        });
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = getToken();
      await axiosInstance.patch(`http://147.93.53.119:5000/${endpoint}/toggle-status/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${title} status updated successfully`, {
        style: { background: '#E5E1DA', color: '#89A8B2' },
      });
      fetchData();
    } catch (error) {
      console.error('Toggle status failed', error);
      toast.error(`Failed to update ${title} status`, {
        style: { background: '#F1F0E8', color: '#B3C8CF' },
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, cnic_image: e.target.files![0] }));
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const memoizedColumns = useMemo(() => {
    return [
      ...columns,
      {
        header: 'Active',
        accessorKey: 'is_active',
        cell: (info: any) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleToggleStatus(info.row.original.id, info.getValue())}
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                info.getValue() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {info.getValue() ? 'Active' : 'Inactive'}
            </button>
          </div>
        ),
      },
      {
        header: 'Actions',
        cell: (info: any) => (
          <div className="flex space-x-2">
            <button onClick={() => showModal(info.row.original)} className="text-indigo-600 hover:text-indigo-900">
              <FaPen />
            </button>
            <button onClick={() => handleDelete(info.row.original.id)} className="text-red-600 hover:text-red-900">
              <FaTrash />
            </button>
            <button onClick={() => window.location.href = `/customers/${info.row.original.id}`} className="text-blue-600 hover:text-blue-900">
              <FaEye />
            </button>
          </div>
        ),
      },
    ];
  }, [columns]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 pt-20 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold text-center text-[#8b5cf6] mb-8">{title} Management</h1>
            <div className="flex justify-end mb-4 space-x-4">
              <button
                onClick={() => showModal(null)}
                className="bg-[#8b5cf6] text-white px-4 py-2 rounded-lg hover:bg-[#7c3aed] transition duration-300 flex items-center"
              >
                <FaPlus className="mr-2" /> Add New {title}
              </button>
              <CSVLink
                data={data}
                filename={`${title.toLowerCase()}.csv`}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300 flex items-center"
              >
                <FaFileExport className="mr-2" /> Export to CSV
              </CSVLink>
            </div>
            <Table data={data} columns={memoizedColumns} />
          </div>
        </main>
      </div>
      <Modal
        isVisible={isModalVisible}
        onClose={handleCancel}
        title={editingItem ? `Edit ${title}` : `Add New ${title}`}
        isLoading={isLoading}
      >
        <form onSubmit={handleSubmit}>
          <FormComponent
            formData={formData}
            handleInputChange={handleInputChange}
            handleFileChange={handleFileChange}
            isEditing={!!editingItem}
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#8b5cf6] text-base font-medium text-white hover:bg-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8b5cf6] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                editingItem ? 'Update' : 'Add'
              )}
            </button>
          </div>
        </form>
      </Modal>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

