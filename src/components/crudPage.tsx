import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { FaPlus, FaFileExport, FaPen, FaTrash } from 'react-icons/fa';
import { Table } from './table/table.tsx'
import { Modal } from './modal.tsx';
import { Topbar } from './topNavbar.tsx';
import { Sidebar } from './sideNavbar.tsx';
import { getToken } from '../utils/auth.ts';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosConfig.ts';

interface CRUDPageProps<T> {
  title: string;
  endpoint: string;
  columns: ColumnDef<T>[];
  FormComponent: React.ComponentType<{
    formData: Partial<T>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    isEditing: boolean;
    validateBeforeSubmit?: (formData: Partial<T>) => string | null;
  }>;
  onDataChange?: () => void;
  validateBeforeSubmit?: (formData: Partial<T>) => string | null;
}

export function CRUDPage<T extends { id: string; is_active?: boolean }>({ 
  title, 
  endpoint, 
  columns, 
  FormComponent,
  onDataChange,
  validateBeforeSubmit,
}: CRUDPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Partial<T>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const token = getToken();
      const response = await axiosInstance.get(`http://127.0.0.1:5000/${endpoint}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error(`Failed to fetch ${title}`, error);
      toast.error(`Failed to fetch ${title}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = getToken();
      await axiosInstance.put(`http://127.0.0.1:5000/${endpoint}/update/${id}`, 
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${title} status updated successfully`);
      await fetchData();
    } catch (error) {
      console.error(`Failed to update ${title} status`, error);
      toast.error(`Failed to update ${title} status`);
    }
  };

  const handleBulkStatusChange = async (newStatus: boolean) => {
    try {
      const token = getToken();
      await Promise.all(selectedRows.map(id => 
        axiosInstance.put(`http://127.0.0.1:5000/${endpoint}/update/${id}`, 
          { is_active: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ));
      toast.success(`${title} status updated successfully`);
      await fetchData();
      setSelectedRows([]);
    } catch (error) {
      console.error(`Failed to update ${title} status`, error);
      toast.error(`Failed to update ${title} status`);
    }
  };

  const showModal = (item: T | null) => {
    console.log('showModal', item);
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
    
    if (validateBeforeSubmit) {
      const validationError = validateBeforeSubmit(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }
    }

    try {
      const token = getToken();
      if (editingItem) {
        await axiosInstance.put(`http://127.0.0.1:5000/${endpoint}/update/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`${title} updated successfully`);
      } else {
        await axiosInstance.post(`http://127.0.0.1:5000/${endpoint}/add`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`${title} added successfully`);
      }
      await fetchData();
      handleCancel();
    } catch (error) {
      console.error('Operation failed', error);
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) {
      try {
        const token = getToken();
        await axiosInstance.delete(`http://127.0.0.1:5000/${endpoint}/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`${title} deleted successfully`);
        await fetchData();
      } catch (error) {
        console.error('Delete operation failed', error);
        toast.error('Delete operation failed');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            <div className="flex justify-between mb-4">
              <div className="space-x-2">
                <button
                  onClick={() => handleBulkStatusChange(true)}
                  disabled={selectedRows.length === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Activate Selected
                </button>
                <button
                  onClick={() => handleBulkStatusChange(false)}
                  disabled={selectedRows.length === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Deactivate Selected
                </button>
              </div>
              <button
                onClick={() => showModal(null)}
                className="bg-[#8b5cf6] text-white px-4 py-2 rounded-lg hover:bg-[#7c3aed] transition duration-300 flex items-center"
              >
                <FaPlus className="mr-2" /> Add New {title}
              </button>
            </div>
            <Table 
              data={data} 
              columns={memoizedColumns} 
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              handleToggleStatus={handleToggleStatus}
            />
          </div>
        </main>
      </div>
      <Modal
        isVisible={isModalVisible}
        onClose={handleCancel}
        title={editingItem ? `Edit ${title}` : `Add New ${title}`}
      >
        <form onSubmit={handleSubmit}>
          <FormComponent
            formData={formData}
            handleInputChange={handleInputChange}
            isEditing={!!editingItem}
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#8b5cf6] text-base font-medium text-white hover:bg-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8b5cf6] sm:ml-3 sm:w-auto sm:text-sm"
            >
              {editingItem ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}