"use client"

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { VendorForm } from '../../components/forms/vendorForm.tsx';
import {
  Phone, Mail, CreditCard, User, BarChart2,
  KeyRound, ShieldOff, ShieldCheck, Copy, X, CheckCircle,
  Users, DollarSign, FileText, TrendingUp, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig.ts';
import { getToken } from '../../utils/auth.ts';
import { toast } from 'react-toastify';
import { useCompany } from '../../context/CompanyContext.tsx';

interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  cnic: string;
  picture: string;
  cnic_front_image: string;
  cnic_back_image: string;
  agreement_document: string;
  is_active: boolean;
  vendor_company_id: string | null;
  is_provisioned: boolean;
  created_at: string;
}

interface VendorStats {
  active_customers: number;
  monthly_revenue: number;
  pending_invoices: number;
  net_profit: number;
  open_complaints: number;
  total_employees: number;
}

interface CredentialModalData {
  username: string;
  new_password: string;
  vendor_name: string;
}

// ── Credentials Modal ─────────────────────────────────────────────────────────
const CredentialsModal: React.FC<{
  data: CredentialModalData;
  onClose: () => void;
}> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Username: ${data.username}\nPassword: ${data.new_password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[fadeInScale_0.2s_ease-out]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Password Reset</p>
              <p className="text-emerald-100 text-sm">{data.vendor_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Share these credentials with the vendor immediately. The password will not be shown again.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Username</p>
              <p className="text-slate-800 font-mono font-bold text-lg">{data.username}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">New Password</p>
              <p className="text-slate-800 font-mono font-bold text-lg tracking-wider">{data.new_password}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                ${copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Credentials'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const VendorManagement: React.FC = () => {
  const navigate = useNavigate();
  const { setPageTitle } = useCompany();
  const [vendorStats, setVendorStats] = useState<Record<string, VendorStats>>({});
  const [credModal, setCredModal] = useState<CredentialModalData | null>(null);
  const [loadingActions, setLoadingActions] = useState<Record<string, string>>({});

  useEffect(() => {
    setPageTitle("Vendor Management");
    fetchVendorSummary();
  }, [setPageTitle]);

  const fetchVendorSummary = useCallback(async () => {
    try {
      const token = getToken();
      const res = await axiosInstance.get('/vendors/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsMap: Record<string, VendorStats> = {};
      (res.data || []).forEach((v: any) => {
        if (v.id) statsMap[v.id] = v.stats || {};
      });
      setVendorStats(statsMap);
    } catch {
      // Non-critical: table still works without stats
    }
  }, []);

  const handleResetCredentials = useCallback(async (vendorId: string) => {
    setLoadingActions(prev => ({ ...prev, [vendorId]: 'reset' }));
    try {
      const token = getToken();
      const res = await axiosInstance.post(`/vendors/${vendorId}/reset-credentials`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCredModal({
        username: res.data.username,
        new_password: res.data.new_password,
        vendor_name: res.data.vendor_name,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to reset credentials');
    } finally {
      setLoadingActions(prev => ({ ...prev, [vendorId]: '' }));
    }
  }, []);

  const handleToggleBlock = useCallback(async (
    vendorId: string,
    currentStatus: boolean,
    refetchFn: () => void
  ) => {
    const action = currentStatus ? 'suspend' : 'activate';
    setLoadingActions(prev => ({ ...prev, [vendorId]: action }));
    try {
      const token = getToken();
      await axiosInstance.put(
        `/vendors/update/${vendorId}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      toast.success(`Vendor ${currentStatus ? 'suspended' : 'reactivated'} successfully`);
      refetchFn();
      fetchVendorSummary();
    } catch {
      toast.error(`Failed to ${action} vendor`);
    } finally {
      setLoadingActions(prev => ({ ...prev, [vendorId]: '' }));
    }
  }, [fetchVendorSummary]);

  const columns = useMemo<ColumnDef<Vendor>[]>(
    () => [
      // ── Vendor name + avatar
      {
        header: 'Vendor',
        accessorKey: 'name',
        cell: info => (
          <div className="flex items-center gap-3">
            {info.row.original.picture ? (
              <img
                src={`/vendors/file/${info.row.original.id}/picture`}
                alt={info.getValue() as string}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {(info.getValue() as string).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-800 text-sm">{info.getValue() as string}</p>
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {info.row.original.cnic}
              </p>
            </div>
          </div>
        ),
      },
      // ── Contact
      {
        header: 'Contact',
        accessorKey: 'phone',
        cell: info => (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-600 text-sm">
              <Phone className="h-3.5 w-3.5 text-blue-400" />
              {info.getValue() as string}
            </div>
            {info.row.original.email && (
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Mail className="h-3 w-3 text-slate-400" />
                {info.row.original.email}
              </div>
            )}
          </div>
        ),
      },
      // ── Live KPI stats
      {
        header: 'Customers',
        id: 'customers',
        cell: info => {
          const stats = vendorStats[info.row.original.id];
          if (!stats) return <span className="text-slate-300 text-xs">—</span>;
          return (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <span className="font-semibold text-slate-700 text-sm">{stats.active_customers}</span>
            </div>
          );
        },
      },
      {
        header: 'Revenue',
        id: 'revenue',
        cell: info => {
          const stats = vendorStats[info.row.original.id];
          if (!stats) return <span className="text-slate-300 text-xs">—</span>;
          return (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="font-semibold text-slate-700 text-sm">
                Rs. {(stats.monthly_revenue || 0).toLocaleString()}
              </span>
            </div>
          );
        },
      },
      {
        header: 'Pending',
        id: 'pending',
        cell: info => {
          const stats = vendorStats[info.row.original.id];
          if (!stats) return <span className="text-slate-300 text-xs">—</span>;
          const count = stats.pending_invoices || 0;
          return (
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex min-w-[88px] items-center justify-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold
                ${count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                <FileText className="w-3 h-3" />
                {count} invoices
              </span>
            </div>
          );
        },
      },
      // ── Status pill
      {
        header: 'Status',
        accessorKey: 'is_active',
        cell: info => (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
            ${info.getValue() ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${info.getValue() ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {info.getValue() ? 'Active' : 'Suspended'}
          </span>
        ),
      },
      // ── Actions (3 buttons — rendered outside CRUDPage action column)
      {
        header: 'Actions',
        id: 'vendor_actions',
        cell: info => {
          const vendor = info.row.original;
          const busy = loadingActions[vendor.id];
          return (
            <div className="flex items-center gap-1.5">
              {/* Dashboard */}
              <button
                onClick={() => navigate(`/vendors/${vendor.id}/dashboard`)}
                title="View Analytics Dashboard"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600
                  rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Dashboard
              </button>

              {/* Reset Password */}
              <button
                onClick={() => handleResetCredentials(vendor.id)}
                disabled={busy === 'reset'}
                title="Reset portal credentials"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600
                  rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {busy === 'reset' ? '...' : 'Reset'}
              </button>

              {/* Block / Unblock — needs refetch callback injected via CRUDPage */}
              <button
                onClick={() => {
                  // Dispatch a custom event CRUDPage can listen to for refetch
                  const evt = new CustomEvent('vendorToggleBlock', {
                    detail: { vendorId: vendor.id, currentStatus: vendor.is_active }
                  });
                  window.dispatchEvent(evt);
                }}
                disabled={busy === 'suspend' || busy === 'activate'}
                title={vendor.is_active ? 'Suspend vendor account' : 'Reactivate vendor account'}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-150 hover:scale-105 disabled:opacity-50
                  ${vendor.is_active
                    ? 'bg-red-50 hover:bg-red-100 text-red-600'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                  }`}
              >
                {vendor.is_active
                  ? <><ShieldOff className="w-3.5 h-3.5" />Suspend</>
                  : <><ShieldCheck className="w-3.5 h-3.5" />Unblock</>
                }
              </button>
            </div>
          );
        },
      },
    ],
    [vendorStats, loadingActions, navigate, handleResetCredentials]
  );

  // Listen for block toggle event from columns (so we can get the refetch callback)
  const [blockQueue, setBlockQueue] = useState<{ vendorId: string; currentStatus: boolean } | null>(null);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setBlockQueue({ vendorId: e.detail.vendorId, currentStatus: e.detail.currentStatus });
    };
    window.addEventListener('vendorToggleBlock', handler as EventListener);
    return () => window.removeEventListener('vendorToggleBlock', handler as EventListener);
  }, []);

  return (
    <>
      {/* Credentials modal */}
      {credModal && (
        <CredentialsModal data={credModal} onClose={() => setCredModal(null)} />
      )}

      <CRUDPage<Vendor>
        title="Vendor"
        endpoint="vendors"
        columns={columns}
        FormComponent={VendorForm}
        useFormData={true}
        validateBeforeSubmit={(formData) => {
          if (!formData.name?.trim()) return "Vendor name is required";
          if (!formData.phone?.trim()) return "Phone number is required";
          if (!formData.cnic?.trim()) return "CNIC is required";
          return null;
        }}
        onDataChange={() => fetchVendorSummary()}
        onCredentialReset={(vendorId: string, refetch: () => void) => {
          if (blockQueue && blockQueue.vendorId === vendorId) {
            handleToggleBlock(blockQueue.vendorId, blockQueue.currentStatus, refetch);
            setBlockQueue(null);
          }
        }}
      />
    </>
  );
};

export default VendorManagement;
