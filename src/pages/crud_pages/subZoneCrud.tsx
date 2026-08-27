"use client"

import React, { useMemo, useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Table } from '../../components/table/table.tsx';
import { Modal } from '../../components/modal.tsx';
import { MODAL_CANCEL_BTN, MODAL_FOOTER, MODAL_INPUT, MODAL_LABEL, MODAL_PRIMARY_BTN } from '../../components/ui/modalStyles.ts';
import { Topbar } from '../../components/topNavbar.tsx';
import { useOptionalAdminChrome } from '../../context/AdminLayoutContext.tsx';
import { Sidebar } from '../../components/sideNavbar.tsx';
import { getToken } from '../../utils/auth.ts';
import { toast } from "../../utils/notify.ts";
import axiosInstance from '../../utils/axiosConfig.ts';
import { useCompany } from '../../context/CompanyContext.tsx';
import { CRUD_FILTER_CONFIGS } from '../../config/crudFilterConfigs.ts';
import { useCrudTableFilters } from '../../hooks/useCrudTableFilters.ts';
import { useCrudPeriodFilter } from '../../hooks/useCrudPeriodFilter.ts';
import { getCrudPeriodConfig } from '../../config/crudPeriodConfigs.ts';
import { CrudStatsSection } from '../../components/crud/CrudStatsSection.tsx';
import { computeCrudStats } from '../../utils/crudFilterParams.ts';
import { filterRowsByPktPeriod, periodForTextSearch } from '../../utils/crudPeriodUtils.ts';
import type { StatCardDef } from '../../types/crudFilters.ts';

interface SubZone {
  id: string;
  area_id: string;
  area_name: string;
  name: string;
  description: string;
  is_active: boolean;
  is_public: boolean;
}

interface Area {
  id: string;
  name: string;
}

const SubZoneManagement: React.FC = () => {
  const { setPageTitle } = useCompany();
  const { areaId } = useParams<{ areaId?: string }>();
  const navigate = useNavigate();
  
  const [subZones, setSubZones] = useState<SubZone[]>([]);
  const [area, setArea] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SubZone | null>(null);
  const [formData, setFormData] = useState<Partial<SubZone>>({});
  const hasChrome = useOptionalAdminChrome();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [computedStats, setComputedStats] = useState<Record<string, number>>({ total: 0 });
  const filterConfig = CRUD_FILTER_CONFIGS['sub-zone'];
  const periodConfig = getCrudPeriodConfig('sub-zone');
  const tableFilters = useCrudTableFilters({ config: filterConfig });
  const periodFilter = useCrudPeriodFilter({ config: periodConfig });
  const [searchText, setSearchText] = useState("");

  const periodScopedData = useMemo(
    () =>
      filterRowsByPktPeriod(
        subZones as unknown as Record<string, unknown>[],
        periodFilter.period,
        periodConfig.dateField,
      ) as SubZone[],
    [subZones, periodFilter.period, periodConfig.dateField],
  );

  const displaySubZones = useMemo(
    () =>
      filterRowsByPktPeriod(
        subZones as unknown as Record<string, unknown>[],
        periodForTextSearch(periodFilter.period, searchText),
        periodConfig.dateField,
      ) as SubZone[],
    [subZones, periodFilter.period, periodConfig.dateField, searchText],
  );

  useEffect(() => {
    setComputedStats(computeCrudStats(periodScopedData, filterConfig.statCards));
  }, [periodScopedData, filterConfig.statCards]);

  const statCards: StatCardDef[] = useMemo(
    () =>
      filterConfig.statCards.map((card) => ({
        ...card,
        value: computedStats[card.id] ?? computedStats.total ?? 0,
      })),
    [filterConfig.statCards, computedStats],
  );

  useEffect(() => {
    setPageTitle("Sub-Zone Management");
    fetchData();
  }, [areaId, setPageTitle]);

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
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return String(row.getValue(columnId)) === String(filterValue);
        },
        cell: info => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue() ? 'bg-emerald-green/10 text-emerald-green' : 'bg-coral-red/10 text-coral-red'
          }`}>
            {info.getValue() ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      { header: 'Website', accessorKey: 'is_public', cell: info => info.getValue<boolean>() ? 'Published' : 'Private' },
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
    <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex h-screen bg-light-sky/50"}>
      {!hasChrome && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      )}
      <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex-1 flex flex-col overflow-hidden"}>
        {!hasChrome && <Topbar toggleSidebar={toggleSidebar} />}
        <main className={
          hasChrome
            ? "px-6 py-6"
            : `flex-1 overflow-x-hidden overflow-y-auto bg-light-sky/50 px-6 pb-6 pt-20 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-0 lg:ml-20'
        }`
        }>
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

              <CrudStatsSection
                cards={statCards}
                activeStatId={tableFilters.activeStatId}
                onStatClick={tableFilters.applyStatFilter}
                period={periodFilter.period}
                periodLabel={periodFilter.label}
                periodActive={periodFilter.isActive}
                onSetPeriod={periodFilter.setPeriod}
                onSetPeriodAll={periodFilter.setAll}
              />
            </div>

            {/* Table */}
            <div className="mb-8">
              <Table
                data={displaySubZones}
                columns={columns}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                isLoading={isLoading}
                quickFilters={filterConfig.quickFilters}
                filterState={tableFilters.filterState}
                onQuickFilterChange={tableFilters.setQuickFilter}
                onClearFilters={tableFilters.clearAllFilters}
                hasActiveFilters={tableFilters.hasAnyActiveFilters}
                inlineFilterFields={tableFilters.inlineFields}
                controlledColumnFilters={tableFilters.mergedColumnFilters}
                onControlledColumnFiltersChange={tableFilters.handleColumnFiltersChange}
                onSearchTextChange={setSearchText}
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
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
          <div>
            <label className={MODAL_LABEL}>
              Sub-Zone Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter sub-zone name"
                className={`${MODAL_INPUT} pl-9`}
                required
              />
            </div>
          </div>

          <div>
            <label className={MODAL_LABEL}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description (optional)"
              rows={3}
              className={`${MODAL_INPUT} h-auto py-2 resize-y`}
            />
          </div>
          <div>
            <label className={MODAL_LABEL}>Public website coverage</label>
            <select value={String(formData.is_public === true)} onChange={(e) => setFormData({ ...formData, is_public: e.target.value === 'true' })} className={MODAL_INPUT}>
              <option value="false">Private operational sub-area</option>
              <option value="true">Publish on website</option>
            </select>
          </div>
          </div>

          <div className={MODAL_FOOTER}>
            <button
              type="button"
              onClick={() => {
                setIsModalVisible(false);
                setEditingItem(null);
                setFormData({});
              }}
              className={MODAL_CANCEL_BTN}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={MODAL_PRIMARY_BTN}
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
