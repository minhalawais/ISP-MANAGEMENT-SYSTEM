"use client"

import React, { useMemo, useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Table } from '../../components/table/table.tsx';
import { Modal } from '../../components/modal.tsx';
import { Topbar } from '../../components/topNavbar.tsx';
import { Sidebar } from '../../components/sideNavbar.tsx';
import { getToken } from '../../utils/auth.ts';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig.ts';

interface SubZone {
  id: string;
  area_id: string;
  area_name: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface Area {
  id: string;
  name: string;
}

const SubZoneManagement: React.FC = () => {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  
  const [subZones, setSubZones] = useState<SubZone[]>([]);
  const [area, setArea] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SubZone | null>(null);
  const [formData, setFormData] = useState<Partial<SubZone>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    document.title = "MBA NET - Sub-Zone Management";
    fetchData();
  }, [areaId]);

  const fetchData = async () => {
    setIsLoading(true);
    const token = getToken();
    try {
      // Fetch sub-zones for this area
      const subZonesResponse = await axiosInstance.get(`/sub-zones/by-area/${areaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubZones(subZonesResponse.data);

      // Fetch area details
      const areasResponse = await axiosInstance.get('/areas/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const foundArea = areasResponse.data.find((a: Area) => a.id === areaId);
      setArea(foundArea || null);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to fetch sub-zones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const token = getToken();

    try {
      if (editingItem) {
        await axiosInstance.put(`/sub-zones/update/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Sub-zone updated successfully');
      } else {
        await axiosInstance.post('/sub-zones/add', { ...formData, area_id: areaId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Sub-zone added successfully');
      }
      setIsModalVisible(false);
      setEditingItem(null);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Failed to save sub-zone', error);
      toast.error('Failed to save sub-zone');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sub-zone?')) return;
    
    const token = getToken();
    try {
      await axiosInstance.delete(`/sub-zones/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Sub-zone deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete sub-zone', error);
      toast.error('Failed to delete sub-zone');
    }
  };

  const columns = useMemo<ColumnDef<SubZone>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
      },
      {
        header: 'Description',
        accessorKey: 'description',
        cell: info => (
          <div className="max-w-xs overflow-hidden overflow-ellipsis whitespace-nowrap" title={info.getValue() as string}>
            {info.getValue() as string || 'No description'}
          </div>
        ),
      },
      {
        header: 'Status',
        accessorKey: 'is_active',
        cell: info => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue() ? 'bg-emerald-green/10 text-emerald-green' : 'bg-coral-red/10 text-coral-red'
          }`}>
            {info.getValue() ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      {
        header: 'Actions',
        cell: info => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingItem(info.row.original);
                setFormData(info.row.original);
                setIsModalVisible(true);
              }}
              className="p-2 text-white bg-electric-blue rounded-md hover:bg-btn-hover transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-2 text-white bg-coral-red rounded-md hover:bg-coral-red/80 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <div className="flex h-screen bg-light-sky/50">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-light-sky/50 p-6 pt-20 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-0 lg:ml-20'
        }`}>
          <div className="container mx-auto">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => navigate('/areas')}
                  className="p-2 rounded-lg bg-light-sky hover:bg-light-sky/70 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-deep-ocean" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-deep-ocean flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-electric-blue" />
                    Sub-Zones for {area?.name || 'Loading...'}
                  </h1>
                  <p className="text-slate-gray">Manage sub-zones within this area</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setFormData({});
                    setIsModalVisible(true);
                  }}
                  className="bg-electric-blue text-white px-4 py-2.5 rounded-lg hover:bg-btn-hover transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Plus className="h-5 w-5" /> Add Sub-Zone
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="mb-8">
              <Table
                data={subZones}
                columns={columns}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                isLoading={isLoading}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Modal for Add/Edit */}
      <Modal
        isVisible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setEditingItem(null);
          setFormData({});
        }}
        title={editingItem ? 'Edit Sub-Zone' : 'Add Sub-Zone'}
        isLoading={isLoading}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-deep-ocean mb-1">
              Sub-Zone Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter sub-zone name"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-ocean mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description (optional)"
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-gray/20 rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalVisible(false);
                setEditingItem(null);
                setFormData({});
              }}
              className="px-4 py-2.5 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 bg-electric-blue text-white rounded-lg hover:bg-btn-hover transition-colors flex items-center gap-2"
            >
              {isLoading ? 'Saving...' : editingItem ? 'Update Sub-Zone' : 'Add Sub-Zone'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubZoneManagement;
