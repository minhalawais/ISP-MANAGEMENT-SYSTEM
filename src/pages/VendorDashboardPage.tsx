"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getToken, getAssetUrl } from '../utils/auth.ts';
import axiosInstance from '../utils/axiosConfig.ts';
import { useCompany } from '../context/CompanyContext.tsx';
import { Sidebar } from '../components/sideNavbar.tsx';
import { Topbar } from '../components/topNavbar.tsx';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ArrowLeft, Users, DollarSign, FileText, TrendingUp,
  AlertCircle, Percent, KeyRound, ShieldOff, ShieldCheck,
  CheckCircle, Copy, X, RefreshCw, Building2, Phone,
  Mail, CreditCard, Activity, Wallet, UserCheck, BarChart2
} from 'lucide-react';
import { toast } from 'react-toastify';

// ─── Types ────────────────────────────────────────────────────────────────────
interface VendorRecord {
  id: string; name: string; phone: string; email: string;
  cnic: string; picture?: string; logo_url?: string | null; is_active: boolean; vendor_company_id: string | null;
  created_at: string;
}
interface CustomerMetrics { total_customers: number; active_customers: number; inactive_customers: number; new_this_month: number; }
interface RevenueMetrics { monthly_revenue: number; prev_monthly_revenue: number; revenue_growth: number; total_revenue: number; monthly_extra_income: number; }
interface InvoiceMetrics { pending_invoices: number; paid_invoices: number; overdue_invoices: number; pending_amount: number; collection_rate: number; }
interface ExpenseMetrics { monthly_expenses: number; total_expenses: number; monthly_isp_costs: number; }
interface Profitability { net_profit_monthly: number; profit_margin: number; }
interface SupportMetrics { open_complaints: number; resolved_this_month: number; }
interface StaffMetrics { total_employees: number; }

interface VendorStats {
  customer_metrics: CustomerMetrics;
  revenue_metrics: RevenueMetrics;
  invoice_metrics: InvoiceMetrics;
  expense_metrics: ExpenseMetrics;
  profitability: Profitability;
  support_metrics: SupportMetrics;
  staff_metrics: StaffMetrics;
}
interface TrendPoint { month: string; revenue: number; expenses: number; profit: number; }
interface GrowthPoint { month: string; new_customers: number; total_customers: number; }
interface AccountInfo { username: string; is_active: boolean; email: string; last_login: string | null; }
interface CredentialResult { username: string; new_password: string; vendor_name: string; }

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: number;
}> = ({ label, value, sub, icon, color, trend }) => (
  <div className={`relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100
    hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -mr-8 -mt-8 ${color}`} />
    <div className="flex items-start justify-between">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
        <div className="text-current opacity-100">{icon}</div>
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
          ${trend >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Metric Row ───────────────────────────────────────────────────────────────
const MetricRow: React.FC<{ label: string; value: string | number; highlight?: 'green' | 'red' | 'amber' }> = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className={`text-sm font-semibold
      ${highlight === 'green' ? 'text-emerald-600' :
        highlight === 'red' ? 'text-red-500' :
        highlight === 'amber' ? 'text-amber-600' :
        'text-slate-700'}`}>
      {value}
    </span>
  </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-blue-500' }) => (
  <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5">
    <div className={`${color} h-2 rounded-full transition-all duration-500`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

// ─── Credentials Reset Modal ──────────────────────────────────────────────────
const CredentialsModal: React.FC<{ data: CredentialResult; onClose: () => void }> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(`Username: ${data.username}\nPassword: ${data.new_password}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Password Reset Successfully</p>
              <p className="text-emerald-100 text-sm">{data.vendor_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm">Share these credentials with the vendor <strong>immediately</strong>. The password will not be shown again.</p>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4 border">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Username</p>
              <p className="font-mono font-bold text-lg text-slate-800">{data.username}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">New Password</p>
              <p className="font-mono font-bold text-lg text-slate-800 tracking-widest">{data.new_password}</p>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all
                ${copied ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Credentials'}
            </button>
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-200 rounded-xl animate-pulse ${className}`} />
);

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
const VendorDashboardPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<TrendPoint[]>([]);
  const [customerGrowth, setCustomerGrowth] = useState<GrowthPoint[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [credModal, setCredModal] = useState<CredentialResult | null>(null);
  const [actionBusy, setActionBusy] = useState('');
  const [imgError, setImgError] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { setPageTitle } = useCompany();

  useEffect(() => { setPageTitle('Vendor Dashboard'); }, [setPageTitle]);

  const loadAll = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Load vendor record first
      const vRes = await axiosInstance.get(`/vendors/${vendorId}`, { headers });
      const v: VendorRecord = vRes.data;
      setVendor(v);

      if (v.vendor_company_id) {
        const vcId = v.vendor_company_id;
        // Load all analytics in parallel
        const [statsRes, trendRes, growthRes, accountRes] = await Promise.allSettled([
          axiosInstance.get(`/vendors/${vcId}/stats`, { headers }),
          axiosInstance.get(`/vendors/${vcId}/revenue-trend?months=6`, { headers }),
          axiosInstance.get(`/vendors/${vcId}/customer-growth?months=6`, { headers }),
          axiosInstance.get(`/vendors/${vendorId}/account-info`, { headers }),
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (trendRes.status === 'fulfilled') setRevenueTrend(trendRes.value.data || []);
        if (growthRes.status === 'fulfilled') setCustomerGrowth(growthRes.value.data || []);
        if (accountRes.status === 'fulfilled') setAccountInfo(accountRes.value.data);
      }
    } catch (err: any) {
      toast.error('Failed to load vendor dashboard');
      if (err?.response?.status === 404) navigate('/vendor-management');
    } finally {
      setLoading(false);
    }
  }, [vendorId, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleResetCredentials = async () => {
    if (!vendorId) return;
    setActionBusy('reset');
    try {
      const token = getToken();
      const res = await axiosInstance.post(`/vendors/${vendorId}/reset-credentials`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCredModal({ username: res.data.username, new_password: res.data.new_password, vendor_name: res.data.vendor_name });
      toast.success('Credentials reset successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to reset credentials');
    } finally {
      setActionBusy('');
    }
  };

  const handleToggleBlock = async () => {
    if (!vendor || !vendorId) return;
    const action = vendor.is_active ? 'suspend' : 'activate';
    setActionBusy(action);
    try {
      const token = getToken();
      await axiosInstance.put(`/vendors/update/${vendorId}`,
        { is_active: !vendor.is_active },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      toast.success(`Vendor ${vendor.is_active ? 'suspended' : 'reactivated'} successfully`);
      await loadAll();
    } catch {
      toast.error(`Failed to ${action} vendor`);
    } finally {
      setActionBusy('');
    }
  };

  const fmt = (n?: number | null) => `Rs. ${(n || 0).toLocaleString()}`;
  const fmtNum = (n?: number | null) => (n || 0).toLocaleString();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 overflow-y-auto">

          {/* ── HEADER ──────────────────────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={() => navigate('/vendor-management')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Vendor Management
              </button>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Vendor identity */}
                <div className="flex items-center gap-5">
                  {!imgError && (vendor?.logo_url || vendor?.picture) ? (
                    <img
                      src={getAssetUrl(vendor.logo_url || `/vendors/file/${vendor.id}/picture`)!}
                      alt={vendor.name}
                      className="w-16 h-16 rounded-2xl object-contain border-2 border-slate-700 shadow-lg shadow-blue-500/20 bg-white p-1"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
                      flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div>
                    {loading ? (
                      <>
                        <Skeleton className="h-7 w-48 mb-2 bg-slate-700" />
                        <Skeleton className="h-4 w-64 bg-slate-700" />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <h1 className="text-2xl font-bold text-white">{vendor?.name}</h1>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                            ${vendor?.is_active
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${vendor?.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {vendor?.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-400 text-sm">
                          {vendor?.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{vendor.phone}</span>}
                          {vendor?.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{vendor.email}</span>}
                          {vendor?.cnic && <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />{vendor.cnic}</span>}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={loadAll}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600
                      text-slate-200 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={handleResetCredentials}
                    disabled={actionBusy === 'reset'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30
                      text-amber-300 border border-amber-500/30 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4" />
                    {actionBusy === 'reset' ? 'Resetting...' : 'Reset Password'}
                  </button>
                  <button
                    onClick={handleToggleBlock}
                    disabled={!!actionBusy}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50
                      ${vendor?.is_active
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'}`}
                  >
                    {vendor?.is_active
                      ? <><ShieldOff className="w-4 h-4" />{actionBusy === 'suspend' ? 'Suspending...' : 'Suspend Account'}</>
                      : <><ShieldCheck className="w-4 h-4" />{actionBusy === 'activate' ? 'Activating...' : 'Reactivate Account'}</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

            {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                  label="Active Customers"
                  value={fmtNum(stats?.customer_metrics.active_customers)}
                  sub={`+${stats?.customer_metrics.new_this_month || 0} this month`}
                  icon={<Users className="w-5 h-5 text-blue-500" />}
                  color="bg-blue-500"
                />
                <StatCard
                  label="Monthly Revenue"
                  value={fmt(stats?.revenue_metrics.monthly_revenue)}
                  icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
                  color="bg-emerald-500"
                  trend={stats?.revenue_metrics.revenue_growth}
                />
                <StatCard
                  label="Pending Invoices"
                  value={fmtNum(stats?.invoice_metrics.pending_invoices)}
                  sub={fmt(stats?.invoice_metrics.pending_amount) + ' owed'}
                  icon={<FileText className="w-5 h-5 text-amber-500" />}
                  color="bg-amber-500"
                />
                <StatCard
                  label="Net Profit"
                  value={fmt(stats?.profitability.net_profit_monthly)}
                  icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
                  color="bg-purple-500"
                />
                <StatCard
                  label="Open Complaints"
                  value={fmtNum(stats?.support_metrics.open_complaints)}
                  sub={`${stats?.support_metrics.resolved_this_month || 0} resolved this month`}
                  icon={<AlertCircle className="w-5 h-5 text-red-500" />}
                  color="bg-red-500"
                />
                <StatCard
                  label="Profit Margin"
                  value={`${stats?.profitability.profit_margin || 0}%`}
                  icon={<Percent className="w-5 h-5 text-teal-500" />}
                  color="bg-teal-500"
                />
              </div>
            )}

            {/* ── CHARTS ──────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              {/* Revenue/Expense/Profit Trend */}
              <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Revenue & Profit Trend</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Last 6 months performance</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-blue-500"><span className="w-3 h-1.5 rounded-full bg-blue-500" />Revenue</span>
                    <span className="flex items-center gap-1.5 text-red-400"><span className="w-3 h-1.5 rounded-full bg-red-400" />Expenses</span>
                    <span className="flex items-center gap-1.5 text-emerald-500"><span className="w-3 h-1.5 rounded-full bg-emerald-500" />Profit</span>
                  </div>
                </div>
                {loading ? <Skeleton className="h-64" /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, '']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRevenue)" dot={false} />
                      <Area type="monotone" dataKey="expenses" stroke="#F87171" strokeWidth={2} fill="none" dot={false} />
                      <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} fill="url(#colorProfit)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Customer Growth */}
              <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-slate-800">Customer Growth</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Monthly new customer additions</p>
                </div>
                {loading ? <Skeleton className="h-64" /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={customerGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#818CF8" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="new_customers" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="New Customers" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── DETAIL METRIC CARDS ──────────────────────────────────────────── */}
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Invoice Health */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="font-bold text-slate-800">Invoice Health</h3>
                  </div>
                  <div className="space-y-0.5">
                    <MetricRow label="Paid Invoices" value={fmtNum(stats?.invoice_metrics.paid_invoices)} highlight="green" />
                    <MetricRow label="Pending Invoices" value={fmtNum(stats?.invoice_metrics.pending_invoices)} highlight={stats?.invoice_metrics.pending_invoices ? 'amber' : undefined} />
                    <MetricRow label="Overdue Invoices" value={fmtNum(stats?.invoice_metrics.overdue_invoices)} highlight={stats?.invoice_metrics.overdue_invoices ? 'red' : undefined} />
                    <MetricRow label="Pending Amount" value={fmt(stats?.invoice_metrics.pending_amount)} />
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-500">Collection Rate</span>
                        <span className="text-sm font-semibold text-slate-700">{stats?.invoice_metrics.collection_rate || 0}%</span>
                      </div>
                      <ProgressBar value={stats?.invoice_metrics.collection_rate || 0} color="bg-emerald-500" />
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className="font-bold text-slate-800">Financial Breakdown</h3>
                  </div>
                  <div className="space-y-0.5">
                    <MetricRow label="Total Revenue (All Time)" value={fmt(stats?.revenue_metrics.total_revenue)} />
                    <MetricRow label="Monthly Revenue" value={fmt(stats?.revenue_metrics.monthly_revenue)} highlight="green" />
                    <MetricRow label="Extra Income" value={fmt(stats?.revenue_metrics.monthly_extra_income)} />
                    <MetricRow label="Monthly Expenses" value={fmt(stats?.expense_metrics.monthly_expenses)} highlight="red" />
                    <MetricRow label="ISP Costs" value={fmt(stats?.expense_metrics.monthly_isp_costs)} />
                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <MetricRow
                        label="Net Profit (Monthly)"
                        value={fmt(stats?.profitability.net_profit_monthly)}
                        highlight={(stats?.profitability.net_profit_monthly || 0) >= 0 ? 'green' : 'red'}
                      />
                    </div>
                  </div>
                </div>

                {/* Operations */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="font-bold text-slate-800">Operations</h3>
                  </div>
                  <div className="space-y-0.5">
                    <MetricRow label="Total Customers" value={fmtNum(stats?.customer_metrics.total_customers)} />
                    <MetricRow label="Active Customers" value={fmtNum(stats?.customer_metrics.active_customers)} highlight="green" />
                    <MetricRow label="Inactive Customers" value={fmtNum(stats?.customer_metrics.inactive_customers)} />
                    <MetricRow label="New This Month" value={`+${fmtNum(stats?.customer_metrics.new_this_month)}`} highlight="green" />
                    <MetricRow label="Open Complaints" value={fmtNum(stats?.support_metrics.open_complaints)} highlight={stats?.support_metrics.open_complaints ? 'amber' : undefined} />
                    <MetricRow label="Resolved This Month" value={fmtNum(stats?.support_metrics.resolved_this_month)} highlight="green" />
                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <MetricRow label="Staff Count" value={fmtNum(stats?.staff_metrics.total_employees)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ACCOUNT MANAGEMENT PANEL ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 bg-slate-900 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Vendor Account Management</h3>
                  <p className="text-slate-400 text-xs">Control the vendor's portal access and credentials</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Account info */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1.5">Portal Username</p>
                        <p className="font-mono font-bold text-slate-800 text-lg">
                          {loading ? '...' : (accountInfo?.username || 'Not available')}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1.5">Account Status</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
                          ${vendor?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          <span className={`w-2 h-2 rounded-full ${vendor?.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {vendor?.is_active ? 'Active — Can Log In' : 'Suspended — Login Blocked'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-blue-800 text-sm leading-relaxed">
                        <strong>How it works:</strong> This vendor has an independent portal at the same URL.
                        They log in with their credentials and see only their own company's data.
                        You can suspend their access at any time — they will be blocked immediately.
                        Resetting their password will generate a new secure password you must share with them.
                      </p>
                    </div>
                  </div>

                  {/* Action panel */}
                  <div className="space-y-3">
                    <button
                      onClick={handleResetCredentials}
                      disabled={!!actionBusy}
                      className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl
                        bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm
                        transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/25
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <KeyRound className="w-5 h-5" />
                      {actionBusy === 'reset' ? 'Resetting...' : 'Reset Portal Password'}
                    </button>

                    <button
                      onClick={handleToggleBlock}
                      disabled={!!actionBusy}
                      className={`w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl
                        font-semibold text-sm transition-all duration-200 hover:shadow-lg
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${vendor?.is_active
                          ? 'bg-red-500 hover:bg-red-600 text-white hover:shadow-red-500/25'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-emerald-500/25'
                        }`}
                    >
                      {vendor?.is_active
                        ? <><ShieldOff className="w-5 h-5" />{actionBusy === 'suspend' ? 'Suspending...' : 'Suspend Vendor Access'}</>
                        : <><ShieldCheck className="w-5 h-5" />{actionBusy === 'activate' ? 'Activating...' : 'Restore Vendor Access'}</>
                      }
                    </button>

                    <button
                      onClick={() => navigate('/vendor-management')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                        bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
                    >
                      <BarChart2 className="w-4 h-4" />
                      Back to All Vendors
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Credentials Modal */}
      {credModal && <CredentialsModal data={credModal} onClose={() => setCredModal(null)} />}
    </div>
  );
};

export default VendorDashboardPage;
