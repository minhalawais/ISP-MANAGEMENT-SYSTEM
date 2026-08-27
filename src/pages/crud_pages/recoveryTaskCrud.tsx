import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, RefreshCw, X } from 'lucide-react';
import { CRUDPage } from '../../components/crudPage.tsx';
import { RecoveryTaskForm } from '../../components/forms/recoveryTaskForm.tsx';
import { useCompany } from "../../context/CompanyContext.tsx";
import { getToken } from '../../utils/auth.ts';
import axiosInstance from '../../utils/axiosConfig.ts';
import { toast } from "../../utils/notify.ts";
import {
  canOwnerSettleRecovery,
  recoveryStatusLabel,
} from '../../utils/recoveryStatus.ts';

interface RecoveryTask {
  id: string;
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  customer_internet_id: string;
  total_amount: number;
  collected_amount?: number | null;
  payment_id?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_proof?: string | null;
  has_payment_proof?: boolean;
  assigned_to: string;
  assigned_to_name: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  is_assigned?: boolean;
  settled_at?: string | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'collected': return 'bg-amber-100 text-amber-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const RecoveryTaskManagement: React.FC = () => {
  const { setPageTitle } = useCompany();
  const [collections, setCollections] = useState<RecoveryTask[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'assigned' | 'adhoc'>('all');
  const [settleTarget, setSettleTarget] = useState<RecoveryTask | null>(null);
  const [settling, setSettling] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofMime, setProofMime] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);

  useEffect(() => {
    setPageTitle("Recovery Task Management");
  }, [setPageTitle]);

  const loadCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const token = getToken();
      const params =
        collectionFilter === 'assigned'
          ? '?assigned=true'
          : collectionFilter === 'adhoc'
            ? '?assigned=false'
            : '';
      const res = await axiosInstance.get(`/recovery-tasks/collections${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollections(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to load collections');
    } finally {
      setCollectionsLoading(false);
    }
  }, [collectionFilter]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections, refreshKey]);

  useEffect(() => {
    let objectUrl: string | null = null;
    const loadProof = async () => {
      setProofUrl(null);
      setProofMime(null);
      if (!settleTarget?.payment_id || !settleTarget.has_payment_proof) {
        setProofLoading(false);
        return;
      }
      setProofLoading(true);
      try {
        const token = getToken();
        const res = await axiosInstance.get(`/payments/proof-image/${settleTarget.payment_id}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        });
        objectUrl = URL.createObjectURL(res.data);
        setProofUrl(objectUrl);
        setProofMime(res.data.type || null);
      } catch {
        setProofUrl(null);
        setProofMime(null);
      } finally {
        setProofLoading(false);
      }
    };
    loadProof();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [settleTarget]);

  const handleSettle = async () => {
    if (!settleTarget) return;
    setSettling(true);
    try {
      const token = getToken();
      await axiosInstance.post(
        `/recovery-tasks/${settleTarget.id}/settle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Recovery settled successfully");
      setSettleTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e.response?.data || "Failed to settle recovery");
    } finally {
      setSettling(false);
    }
  };

  const columns = useMemo<ColumnDef<RecoveryTask>[]>(
    () => [
      {
        header: 'Invoice',
        accessorKey: 'invoice_number',
        cell: info => {
          const row = info.row.original;
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-deep-ocean text-sm">{row.invoice_number || '-'}</span>
              <span className="text-xs text-slate-gray">{row.customer_name}</span>
              <span className="text-xs text-electric-blue">{row.customer_internet_id}</span>
            </div>
          );
        },
      },
      {
        header: 'Amount',
        accessorKey: 'total_amount',
        cell: info => {
          const row = info.row.original;
          const value = info.getValue() as number | null;
          if (!value) return <span className="text-gray-400">-</span>;
          return (
            <div className="flex flex-col text-sm">
              <span className="font-semibold text-emerald-green">
                PKR {value.toLocaleString()}
              </span>
              {row.collected_amount != null && (
                <span className="text-xs text-amber-700">
                  Collected PKR {Number(row.collected_amount).toLocaleString()}
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigned_to_name',
        cell: info => <span className="text-sm">{(info.getValue() as string) || '-'}</span>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: info => {
          const row = info.row.original;
          const value = info.getValue() as string | null;
          if (!value) return <span className="text-gray-400">-</span>;
          return (
            <div className="flex flex-col gap-1.5 items-start">
              <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(value)}`}>
                {recoveryStatusLabel(value)}
              </span>
              {canOwnerSettleRecovery(value) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettleTarget(row);
                  }}
                  className="h-8 px-2.5 text-xs font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700"
                >
                  Settle
                </button>
              )}
            </div>
          );
        },
      },
      {
        header: 'Notes',
        accessorKey: 'notes',
        cell: info => {
          const value = info.getValue() as string | null;
          if (!value) return <span className="text-gray-400">-</span>;
          return (
            <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-sm" title={value}>
              {value}
            </div>
          );
        },
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        cell: info => {
          const value = info.getValue() as string | null;
          if (!value) return <span className="text-gray-400">-</span>;
          return <span className="text-sm">{new Date(value).toLocaleDateString()}</span>;
        },
      },
    ],
    []
  );

  return (
    <div className="relative">
      <CRUDPage<RecoveryTask>
        key={refreshKey}
        title="Recovery Task"
        endpoint="recovery-tasks"
        filterModuleKey="recovery-task"
        columns={columns}
        FormComponent={RecoveryTaskForm}
      />

      <div className="fixed bottom-4 right-4 z-40 w-full max-w-xl max-h-[45vh] overflow-hidden bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-electric-blue" />
            <h2 className="text-sm font-semibold text-deep-ocean">Collections</h2>
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'assigned', 'adhoc'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setCollectionFilter(f)}
                className={`h-8 px-2 text-xs rounded-md ${
                  collectionFilter === f
                    ? 'bg-electric-blue text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {f === 'all' ? 'All' : f === 'assigned' ? 'Assigned' : 'Ad-hoc'}
              </button>
            ))}
            <button
              type="button"
              onClick={loadCollections}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${collectionsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 text-sm">
          {collectionsLoading && collections.length === 0 ? (
            <p className="p-4 text-slate-500 text-xs">Loading…</p>
          ) : collections.length === 0 ? (
            <p className="p-4 text-slate-500 text-xs">No collections yet</p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-white sticky top-0 text-xs text-slate-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Employee</th>
                  <th className="text-left px-3 py-2 font-medium">Invoice</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {collections.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{c.assigned_to_name || '—'}</td>
                    <td className="px-3 py-2">
                      <div>{c.invoice_number}</div>
                      <div className="text-xs text-slate-500">{c.customer_name}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      PKR {Number(c.collected_amount ?? c.total_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {c.is_assigned === false ? 'Ad-hoc' : 'Assigned'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(c.status)}`}>
                        {recoveryStatusLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {canOwnerSettleRecovery(c.status) && (
                        <button
                          type="button"
                          onClick={() => setSettleTarget(c)}
                          className="h-8 px-2 text-xs bg-amber-600 text-white rounded-md"
                        >
                          Settle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {settleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-deep-ocean">Settle collection</h3>
              <button type="button" onClick={() => setSettleTarget(null)} className="p-1 rounded hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-2 text-sm max-h-[70vh] overflow-y-auto">
              <p><span className="text-slate-500">Invoice:</span> {settleTarget.invoice_number}</p>
              <p><span className="text-slate-500">Collector:</span> {settleTarget.assigned_to_name}</p>
              <p>
                <span className="text-slate-500">Amount:</span>{' '}
                <span className="font-semibold">
                  PKR {Number(settleTarget.collected_amount ?? 0).toLocaleString()}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Method:</span>{' '}
                {(settleTarget.payment_method || '—').replace(/_/g, ' ')}
              </p>

              {settleTarget.has_payment_proof && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-slate-600 mb-1.5">Payment proof</p>
                  {proofLoading ? (
                    <p className="text-xs text-slate-500">Loading proof…</p>
                  ) : proofUrl ? (
                    proofMime === 'application/pdf' ? (
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center px-3 text-xs font-medium bg-electric-blue text-white rounded-md"
                      >
                        Open PDF proof
                      </a>
                    ) : (
                      <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <img
                          src={proofUrl}
                          alt="Payment proof"
                          className="max-h-56 w-full object-contain rounded-lg border border-slate-200 bg-slate-50"
                        />
                      </a>
                    )
                  ) : (
                    <p className="text-xs text-slate-500">Proof attached but could not be previewed.</p>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-500 pt-1">
                Marks payment paid, clears employee cash hold, and credits bank if transfer.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setSettleTarget(null)}
                className="h-9 px-3 text-sm border border-slate-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={settling}
                onClick={handleSettle}
                className="h-9 px-3 text-sm bg-amber-600 text-white rounded-md disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                {settling ? 'Settling…' : 'Confirm settle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoveryTaskManagement;
