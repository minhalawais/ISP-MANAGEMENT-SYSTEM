import React, { useState, useEffect } from 'react';
import { RefreshCw, MessageSquare, CheckCircle2, XCircle, Clock, Send, TrendingUp, Filter, Wifi, WifiOff, Shield } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig.ts';
import { Sidebar } from '../../components/sideNavbar.tsx';
import { Topbar } from '../../components/topNavbar.tsx';
import { useOptionalAdminChrome } from '../../context/AdminLayoutContext.tsx';

interface WhatsAppMessage {
    id: string;
    customer_name: string;
    mobile: string;
    message_type: string;
    message_content: string;
    media_type: string;
    priority: number;
    status: string;
    retry_count: number;
    error_message?: string;
    sent_at?: string;
    created_at: string;
}

interface QueueStats {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    failed_permanent: number;
    delivered: number;
    read: number;
    successful: number;
    processing: number;
    retry_wait: number;
    unknown: number;
}

interface QuotaStats {
    messages_sent: number;
    effective_limit: number;
    remaining: number;
    percentage_used: number;
    can_send: boolean;
}

const WhatsAppQueueDashboard: React.FC = () => {
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
    const [quotaStats, setQuotaStats] = useState<QuotaStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const hasChrome = useOptionalAdminChrome();
    const [connectionStatus, setConnectionStatus] = useState<{connected: boolean; phone_number?: string; warmup_complete?: boolean; warmup_start_date?: string; current_daily_limit?: number} | null>(null);

    useEffect(() => {
        document.title = 'WhatsApp Queue';
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => {
            clearInterval(interval);
        };
    }, [currentPage, filter]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const fetchData = async () => {
        try {
            setRefreshing(true);

            const messagesResponse = await axiosInstance.get('/api/whatsapp/queue', {
                params: {
                    page: currentPage,
                    per_page: 50,
                    status: filter !== 'all' ? filter : undefined
                }
            });

            setMessages(messagesResponse.data.messages);
            setTotalPages(messagesResponse.data.pages);

            const statsResponse = await axiosInstance.get('/api/whatsapp/queue/stats');
            setQueueStats(statsResponse.data);

            const quotaResponse = await axiosInstance.get('/api/whatsapp/quota');
            setQuotaStats(quotaResponse.data);

            // Fetch connection status
            try {
                const connResp = await axiosInstance.get('/api/whatsapp/instance/status');
                setConnectionStatus(connResp.data);
            } catch {
                setConnectionStatus(null);
            }

            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error('Error fetching WhatsApp data:', error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    const retryMessage = async (messageId: string) => {
        try {
            await axiosInstance.post(`/api/whatsapp/retry/${messageId}`);
            alert('Message queued for retry');
            fetchData();
        } catch (error) {
            console.error('Error retrying message:', error);
            alert('Failed to retry message');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            delivered: 'bg-sky-50 text-sky-700 border-sky-200',
            read: 'bg-blue-50 text-blue-700 border-blue-200',
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            processing: 'bg-violet-50 text-violet-700 border-violet-200',
            retry_wait: 'bg-amber-50 text-amber-700 border-amber-200',
            unknown: 'bg-orange-50 text-orange-700 border-orange-200',
            failed: 'bg-rose-50 text-rose-600 border-rose-200',
            failed_permanent: 'bg-slate-100 text-slate-500 border-slate-200'
        };
        return styles[status as keyof typeof styles] || styles.pending;
    };

    const getPriorityBadge = (priority: number) => {
        if (priority === 0) return { label: 'High', color: 'bg-rose-50 text-rose-600 border-rose-200' };
        if (priority === 10) return { label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { label: 'Low', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    };

    if (loading) {
        return (
            <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex h-screen bg-slate-50 overflow-hidden"}>
                {!hasChrome && (
                    <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
                )}
                <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex-1 flex flex-col overflow-hidden"}>
                    {!hasChrome && <Topbar toggleSidebar={toggleSidebar} />}
                    <main className={
                        hasChrome
                            ? "px-0 pb-0 sm:px-6 sm:pb-6 py-6 flex justify-center items-center min-h-[50vh]"
                            : `flex-1 overflow-y-auto bg-slate-50 px-0 pb-0 sm:px-6 sm:pb-6 pt-20 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0 lg:ml-20'} flex justify-center items-center`
                    }>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-emerald-600"></div>
                            <p className="text-[13px] text-slate-500">Loading dashboard...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex h-screen bg-slate-50 overflow-hidden"}>
            {!hasChrome && (
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
            )}
            <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex-1 flex flex-col overflow-hidden"}>
                {!hasChrome && <Topbar toggleSidebar={toggleSidebar} />}
                <main className={
                    hasChrome
                        ? "px-0 pb-0 sm:px-6 sm:pb-6 py-4"
                        : `flex-1 overflow-y-auto bg-slate-50 px-0 pb-0 sm:px-6 sm:pb-6 pt-20 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0 lg:ml-20'}`
                }>
                    <div className="max-w-[1400px] mx-auto space-y-4">
                    <div className="bg-white rounded-[10px] border border-slate-200 p-5 flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-[15px] font-medium text-slate-900 flex items-center gap-2">
                                <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                                </span>
                                WhatsApp Queue
                            </h1>
                            <p className="text-[11px] text-slate-400 mt-1">Monitor and manage your message queue efficiently</p>
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={refreshing}
                            className="h-9 px-4 text-[13px] font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors duration-150 flex items-center gap-1.5"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {/* Connection & Warm-up Status Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Connection Status */}
                        <div className="bg-white rounded-[10px] border border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${connectionStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                    <div>
                                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em]">WhatsApp Status</p>
                                        <p className="text-[15px] font-semibold text-slate-900 mt-0.5">
                                            {connectionStatus?.connected ? 'Connected' : 'Disconnected'}
                                        </p>
                                        {connectionStatus?.connected && connectionStatus?.phone_number && (
                                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                <Wifi className="w-3 h-3" /> {connectionStatus.phone_number}
                                            </p>
                                        )}
                                        {!connectionStatus?.connected && (
                                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                <WifiOff className="w-3 h-3" /> Go to Settings to connect
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                    {connectionStatus?.connected ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-slate-400" />}
                                </span>
                            </div>
                        </div>

                        {/* Warm-up Progress */}
                        <div className="bg-white rounded-[10px] border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-amber-500" />
                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em]">Warm-up Status</p>
                                </div>
                                <span className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-amber-500" />
                                </span>
                            </div>
                            {connectionStatus?.warmup_complete ? (
                                <>
                                    <p className="text-[15px] font-semibold text-emerald-700">Complete ✓</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Full {connectionStatus.current_daily_limit} msgs/day</p>
                                </>
                            ) : connectionStatus?.connected ? (
                                <>
                                    <p className="text-[15px] font-semibold text-amber-600">
                                        {connectionStatus.current_daily_limit} msgs/day
                                    </p>
                                    <div className="mt-2 bg-amber-100 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min((connectionStatus.current_daily_limit || 20) / 2, 100)}%` }} />
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">Gradually increasing over 4 weeks</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-[15px] font-semibold text-slate-400">—</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Connect WhatsApp to start warm-up</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-[10px] border border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em]">Pending</p>
                                    <p className="text-[22px] font-semibold text-slate-900 mt-1 tabular-nums">{queueStats?.pending || 0}</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Messages in queue</p>
                                </div>
                                <span className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[10px] border border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em]">Successful</p>
                                    <p className="text-[22px] font-semibold text-slate-900 mt-1 tabular-nums">{queueStats?.successful || 0}</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Sent, delivered, or read</p>
                                </div>
                                <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[10px] border border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em]">Failed</p>
                                    <p className="text-[22px] font-semibold text-slate-900 mt-1 tabular-nums">{queueStats?.failed || 0}</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Delivery failed</p>
                                </div>
                                <span className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                                    <XCircle className="w-4 h-4 text-rose-600" />
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[10px] border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em]">Daily Quota</p>
                                <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                                </span>
                            </div>
                            <p className="text-[22px] font-semibold text-slate-900 tabular-nums">
                                {quotaStats?.messages_sent || 0}
                                <span className="text-[13px] text-slate-400 font-medium ml-1">/ {quotaStats?.effective_limit || 195}</span>
                            </p>
                            <div className="mt-3 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-emerald-600 h-full rounded-full"
                                    style={{ width: `${Math.min(quotaStats?.percentage_used || 0, 100)}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1.5">
                                {quotaStats?.remaining || 0} messages remaining today
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[10px] border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <h3 className="text-[13px] font-medium text-slate-900">Filter Messages</h3>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            {['all', 'pending', 'processing', 'retry_wait', 'sent', 'delivered', 'read', 'unknown', 'failed', 'failed_permanent'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setFilter(status);
                                        setCurrentPage(1);
                                    }}
                                    className={`h-8 px-3 rounded-md text-[12px] font-medium transition-colors duration-150 ${filter === status
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    {status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em] py-2.5 px-4">Customer</th>
                                        <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em] py-2.5 px-4">Mobile</th>
                                        <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em] py-2.5 px-4">Type</th>
                                        <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em] py-2.5 px-4">Message</th>
                                        <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em] py-2.5 px-4">Priority</th>
                                        <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em] py-2.5 px-4">Status</th>
                                        <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em] py-2.5 px-4">Created</th>
                                        <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em] py-2.5 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {messages.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-12 text-slate-500">
                                                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                                <p className="text-[13px] font-medium text-slate-600">No messages found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        messages.map((message) => {
                                            const priorityInfo = getPriorityBadge(message.priority);
                                            return (
                                                <tr key={message.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-100">
                                                    <td className="py-3 px-4 text-[13px] font-medium text-slate-800">{message.customer_name}</td>
                                                    <td className="py-3 px-4 text-[13px] text-slate-600">{message.mobile}</td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex text-[10px] px-2 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200 font-medium">
                                                            {message.message_type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-[13px] text-slate-500 max-w-xs truncate">{message.message_content}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex text-[10px] px-2 py-0.5 rounded border font-medium ${priorityInfo.color}`}>
                                                            {priorityInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex text-[10px] px-2 py-0.5 rounded border font-medium ${getStatusBadge(message.status)}`}>
                                                            {message.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-[11px] text-slate-400 tabular-nums">
                                                        {new Date(message.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {(['failed', 'failed_permanent', 'unknown'] as string[]).includes(message.status) && (
                                                            <button
                                                                onClick={() => retryMessage(message.id)}
                                                                className="text-[12px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors duration-150"
                                                            >
                                                                <Send className="w-3.5 h-3.5" />
                                                                Retry
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-200">
                                <div className="text-[12px] text-slate-500 font-medium">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 px-3 text-[12px] font-medium border border-slate-200 text-slate-600 rounded-md hover:border-slate-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-8 px-3 text-[12px] font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default WhatsAppQueueDashboard;
