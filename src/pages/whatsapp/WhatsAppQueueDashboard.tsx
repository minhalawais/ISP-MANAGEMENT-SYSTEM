import React, { useState, useEffect } from 'react';
import { RefreshCw, MessageSquare, CheckCircle2, XCircle, Clock, Send, TrendingUp, Filter } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig.ts';
import { Sidebar } from '../../components/sideNavbar.tsx';
import { Topbar } from '../../components/topNavbar.tsx';

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

    useEffect(() => {
        document.title = 'WhatsApp Queue - MBA NET';
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
            sent: 'bg-[#B3C8CF] text-[#2A5C8A] border border-[#89A8B2]',
            pending: 'bg-[#F1F0E8] text-[#656565] border border-[#E5E1DA]',
            failed: 'bg-red-50 text-red-700 border border-red-200',
            failed_permanent: 'bg-gray-100 text-gray-600 border border-gray-300'
        };
        return styles[status as keyof typeof styles] || styles.pending;
    };

    const getPriorityBadge = (priority: number) => {
        if (priority === 0) return { label: 'High', color: 'bg-red-100 text-red-700 border border-red-200' };
        if (priority === 10) return { label: 'Medium', color: 'bg-[#F1F0E8] text-[#656565] border border-[#E5E1DA]' };
        return { label: 'Low', color: 'bg-[#B3C8CF] text-[#2A5C8A] border border-[#89A8B2]' };
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-[#F1F0E8]">
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Topbar toggleSidebar={toggleSidebar} />
                    <main className="flex-1 overflow-y-auto p-6 mt-14 flex justify-center items-center">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E5E1DA] border-t-[#89A8B2]"></div>
                            <p className="text-[#656565] font-medium">Loading dashboard...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F1F0E8] ml-20">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar toggleSidebar={toggleSidebar} />
                <main className="flex-1 overflow-y-auto p-6 mt-14">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-[#89A8B2] to-[#B3C8CF] p-3 rounded-2xl shadow-lg">
                                <MessageSquare className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-[#2A5C8A]">WhatsApp Queue</h1>
                                <p className="text-[#656565] mt-2 text-lg">Monitor and manage your message queue efficiently</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={refreshing}
                            className="flex items-center gap-2 bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] hover:from-[#7A98A2] hover:to-[#A3B8BF] text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 font-medium"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-[#F1F0E8] hover:shadow-2xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[#656565] text-sm font-medium uppercase tracking-wide">Pending</p>
                                    <p className="text-4xl font-bold text-[#2A5C8A] mt-2">{queueStats?.pending || 0}</p>
                                    <p className="text-xs text-[#89A8B2] mt-1">Messages in queue</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-4 rounded-2xl shadow-lg">
                                    <Clock className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-[#F1F0E8] hover:shadow-2xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[#656565] text-sm font-medium uppercase tracking-wide">Sent</p>
                                    <p className="text-4xl font-bold text-[#2A5C8A] mt-2">{queueStats?.sent || 0}</p>
                                    <p className="text-xs text-[#89A8B2] mt-1">Successfully delivered</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-400 to-green-500 p-4 rounded-2xl shadow-lg">
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-[#F1F0E8] hover:shadow-2xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[#656565] text-sm font-medium uppercase tracking-wide">Failed</p>
                                    <p className="text-4xl font-bold text-[#2A5C8A] mt-2">{queueStats?.failed || 0}</p>
                                    <p className="text-xs text-[#89A8B2] mt-1">Delivery failed</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-400 to-red-500 p-4 rounded-2xl shadow-lg">
                                    <XCircle className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-[#F1F0E8] hover:shadow-2xl transition-all duration-300 hover:scale-105">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[#656565] text-sm font-medium uppercase tracking-wide">Daily Quota</p>
                                    <div className="bg-gradient-to-br from-[#89A8B2] to-[#B3C8CF] p-2 rounded-xl">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-bold text-[#2A5C8A]">{quotaStats?.messages_sent || 0}</p>
                                    <p className="text-[#656565] text-lg">/ {quotaStats?.effective_limit || 195}</p>
                                </div>
                                <div className="mt-4 bg-[#E5E1DA] rounded-full h-3 overflow-hidden shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] h-full transition-all duration-500 rounded-full"
                                        style={{ width: `${Math.min(quotaStats?.percentage_used || 0, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-[#89A8B2] mt-2 font-medium">
                                    {quotaStats?.remaining || 0} messages remaining today
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-5 rounded-2xl shadow-xl border-2 border-[#F1F0E8] mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Filter className="w-5 h-5 text-[#89A8B2]" />
                            <h3 className="text-lg font-semibold text-[#2A5C8A]">Filter Messages</h3>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            {['all', 'pending', 'sent', 'failed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setFilter(status);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${filter === status
                                        ? 'bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] text-white shadow-lg scale-105'
                                        : 'bg-[#F1F0E8] text-[#656565] hover:bg-[#E5E1DA] hover:scale-105'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Messages Table */}
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-[#F1F0E8] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-[#B3C8CF] to-[#89A8B2]">
                                    <tr>
                                        <th className="text-left text-xs font-bold text-white uppercase tracking-wider py-4 px-6">Customer</th>
                                        <th className="text-left text-xs font-bold text-white uppercase tracking-wider py-4 px-6">Mobile</th>
                                        <th className="text-left text-xs font-bold text-white uppercase tracking-wider py-4 px-6">Type</th>
                                        <th className="text-left text-xs font-bold text-white uppercase tracking-wider py-4 px-6">Message</th>
                                        <th className="text-left text-xs font-bold text-white uppercase tracking-wider py-4 px-6">Priority</th>
                                        <th className="text-left text-xs font-bold text-white uppercase tracking-wider py-4 px-6">Status</th>
                                        <th className="text-left text-xs font-bold text-white uppercase tracking-wider py-4 px-6">Created</th>
                                        <th className="text-left text-xs font-bold text-white uppercase tracking-wider py-4 px-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E1DA]">
                                    {messages.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-12 text-[#656565]">
                                                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[#B3C8CF]" />
                                                <p className="text-lg font-medium">No messages found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        messages.map((message) => {
                                            const priorityInfo = getPriorityBadge(message.priority);
                                            return (
                                                <tr key={message.id} className="hover:bg-[#F1F0E8] transition-colors">
                                                    <td className="py-4 px-6 text-[#2A5C8A] font-semibold">{message.customer_name}</td>
                                                    <td className="py-4 px-6 text-[#656565]">{message.mobile}</td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-xs px-3 py-1.5 rounded-full bg-[#E5E1DA] text-[#656565] font-medium">
                                                            {message.message_type}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-[#656565] max-w-xs truncate">{message.message_content}</td>
                                                    <td className="py-4 px-6">
                                                        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${priorityInfo.color}`}>
                                                            {priorityInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${getStatusBadge(message.status)}`}>
                                                            {message.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-[#656565] text-sm">
                                                        {new Date(message.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {(message.status === 'failed' || message.status === 'failed_permanent') && (
                                                            <button
                                                                onClick={() => retryMessage(message.id)}
                                                                className="text-[#89A8B2] hover:text-[#7A98A2] font-semibold text-sm flex items-center gap-1 transition-colors"
                                                            >
                                                                <Send className="w-4 h-4" />
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="bg-gradient-to-r from-[#F1F0E8] to-[#E5E1DA] px-6 py-4 flex items-center justify-between border-t-2 border-[#E5E1DA]">
                                <div className="text-sm text-[#656565] font-medium">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] text-white font-semibold hover:from-[#7A98A2] hover:to-[#A3B8BF] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] text-white font-semibold hover:from-[#7A98A2] hover:to-[#A3B8BF] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default WhatsAppQueueDashboard;