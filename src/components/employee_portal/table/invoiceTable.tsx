import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import { ColumnDef } from '@tanstack/react-table';
import { FaPlus, FaFileExport } from 'react-icons/fa';
import { Table } from '../table/table.tsx';
import { Modal } from '../../modal.tsx';
import { Topbar } from '../../topNavbar.tsx';
import { Sidebar } from '../../sideNavbar.tsx';
import { getToken } from '../../../utils/auth.ts';
import { toast } from 'react-toastify';
import { FaPen, FaTrash, FaFileInvoice } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosConfig.ts';

interface CRUDPageProps<T> {
  title: string;
  endpoint: string;
  columns: ColumnDef<T>[];
  FormComponent: React.ComponentType<{
    formData: Partial<T>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    isEditing: boolean;
  }>;
}

export function CRUDPage<T extends { id: string }>({ title, endpoint, columns, FormComponent }: CRUDPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Partial<T>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken();
      const response = await axiosInstance.get(`/${endpoint}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error(`Failed to fetch ${title}`, error);
      toast.error(`Failed to fetch ${title}`);
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
    try {
      const token = getToken();
      if (editingItem) {
        await axiosInstance.put(`/${endpoint}/update/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`${title} updated successfully`);
      } else {
        console.log('formData', formData);
        await axiosInstance.post(`/${endpoint}/add`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`${title} added successfully`);
      }
      fetchData();
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
        await axiosInstance.delete(`/${endpoint}/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`${title} deleted successfully`);
        fetchData();
      } catch (error) {
        console.error('Delete operation failed', error);
        toast.error('Delete operation failed');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = getToken();
      await axiosInstance.patch(`/${endpoint}/toggle-status/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${title} status updated successfully`);
      fetchData();
    } catch (error) {
      console.error('Toggle status failed', error);
      toast.error('Failed to update status');
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
        header: 'Actions',
        cell: (info: any) => (
            <Link to={`/${endpoint}/${info.row.original.id}`} className="text-green-600 hover:text-green-900">
              <FaFileInvoice />
            </Link>
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
