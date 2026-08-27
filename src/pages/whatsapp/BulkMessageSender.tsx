import React, { useState, useEffect } from 'react';
import { Users, Send, MessageCircle, Search, CheckCircle2, Eye } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig.ts';
import { Sidebar } from '../../components/sideNavbar.tsx';
import { Topbar } from '../../components/topNavbar.tsx';
import { useOptionalAdminChrome } from '../../context/AdminLayoutContext.tsx';

interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    phone_1: string;
    service_plan_name?: string;
}

interface Template {
    id: string;
    name: string;
    template_text: string;
    default_priority: number;
}

const BulkMessageSender: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
    const [templates, setTemplates] = useState<Template[]>([]);
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState(20);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const hasChrome = useOptionalAdminChrome();

    useEffect(() => {
        document.title = 'Bulk Message Sender';
        fetchCustomers();
        fetchTemplates();
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const fetchCustomers = async () => {
        try {
            const response = await axiosInstance.get('/customers/list');
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await axiosInstance.get('/api/whatsapp/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        `${customer.first_name} ${customer.last_name} ${customer.phone_1}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleCustomer = (id: string) => {
        const newSelected = new Set(selectedCustomers);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedCustomers(newSelected);
    };

    const selectAll = () => {
        setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    };

    const deselectAll = () => {
        setSelectedCustomers(new Set());
    };

    const handleSend = async () => {
        if (selectedCustomers.size === 0) {
            alert('Please select at least one customer');
            return;
        }
        if (!message.trim()) {
            alert('Please enter a message');
            return;
        }

        try {
            setSending(true);
            const response = await axiosInstance.post('/api/whatsapp/send-bulk', {
                customer_ids: Array.from(selectedCustomers),
                message,
                priority,
            });
            const queued = response.data.messages_queued || 0;
            const skipped = response.data.messages_skipped || 0;
            alert(`Queued ${queued} messages${skipped ? `; skipped ${skipped}` : ''}.`);
            setMessage('');
            setSelectedCustomers(new Set());
            setSending(false);
        } catch (error) {
            console.error('Error sending messages:', error);
            alert('Failed to send messages');
            setSending(false);
        }
    };

    const replacePlaceholders = (text: string, customer: Customer) => {
        return text
            .replace(/\{\{customer_name\}\}/g, `${customer.first_name} ${customer.last_name}`)
            .replace(/\{\{first_name\}\}/g, customer.first_name)
            .replace(/\{\{plan_name\}\}/g, customer.service_plan_name || 'N/A');
    };

    const getPriorityLabel = (priority: number) => {
        switch (priority) {
            case 0: return 'High priority - will be sent immediately';
            case 10: return 'Medium priority - normal queue';
            case 20: return 'Low priority - sent during off-peak hours';
            default: return 'Normal priority';
        }
    };

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
                        <div className="bg-white rounded-[10px] border border-slate-200 p-5">
                            <h1 className="text-[15px] font-medium text-slate-900 flex items-center gap-2">
                                <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                    <Send className="w-4 h-4 text-emerald-600" />
                                </span>
                                Bulk Message Sender
                            </h1>
                            <p className="text-[11px] text-slate-400 mt-1">Send messages to multiple customers at once</p>
                        </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-[10px] border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                        <Users className="w-4 h-4 text-emerald-600" />
                                    </span>
                                    <div>
                                        <h2 className="text-[13px] font-medium text-slate-900">Select Recipients</h2>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{selectedCustomers.size} customers selected</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative mb-3">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-md bg-white text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/[0.12] focus:border-emerald-600 hover:border-slate-300 transition-colors duration-150"
                                />
                            </div>

                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={selectAll}
                                    className="h-8 px-3 text-[12px] font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-150"
                                >
                                    Select All ({filteredCustomers.length})
                                </button>
                                <button
                                    onClick={deselectAll}
                                    className="h-8 px-3 text-[12px] font-medium border border-slate-200 text-slate-600 rounded-md hover:border-slate-300 hover:bg-slate-50 transition-colors duration-150"
                                >
                                    Deselect All
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                {filteredCustomers.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500">
                                        <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                        <p className="text-[13px] font-medium text-slate-600">No customers found</p>
                                    </div>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors duration-150 ${selectedCustomers.has(customer.id)
                                                ? 'bg-emerald-50 border-emerald-200'
                                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            onClick={() => toggleCustomer(customer.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedCustomers.has(customer.id)}
                                                onChange={() => toggleCustomer(customer.id)}
                                                className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/[0.12]"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-medium text-slate-700 truncate">
                                                    {customer.first_name} {customer.last_name}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">{customer.phone_1}</p>
                                            </div>
                                            {selectedCustomers.has(customer.id) && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-[10px] border border-slate-200">
                            <div className="flex items-center gap-2.5 mb-4">
                                <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                                </span>
                                <div>
                                    <h2 className="text-[13px] font-medium text-slate-900">Compose Message</h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Create your message content</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Use Template (Optional)</label>
                                <select
                                    onChange={(e) => {
                                        const template = templates.find(t => t.id === e.target.value);
                                        if (template) {
                                            setMessage(template.template_text);
                                            setPriority(template.default_priority);
                                        }
                                    }}
                                    className="w-full h-9 px-3 border border-slate-200 rounded-md bg-white text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/[0.12] focus:border-emerald-600 hover:border-slate-300 transition-colors duration-150"
                                >
                                    <option value="">Select a template...</option>
                                    {templates.map(template => (
                                        <option key={template.id} value={template.id}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message… Placeholders: {{customer_name}}, {{first_name}}, {{plan_name}}, {{company_name}}, {{company_domain}}, {{company_url}}, {{invoice_link}}"
                                    rows={8}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-white text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/[0.12] focus:border-emerald-600 hover:border-slate-300 transition-colors duration-150 resize-none"
                                />
                                <p className="text-[11px] text-slate-400 mt-1.5 tabular-nums">{message.length} characters</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Priority</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0, 10, 20].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={`h-9 px-3 rounded-md text-[12px] font-medium transition-colors duration-150 ${priority === p
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            {p === 0 ? 'High' : p === 10 ? 'Medium' : 'Low'}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1.5">{getPriorityLabel(priority)}</p>
                            </div>

                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="w-full mb-3 h-9 px-4 rounded-md border border-slate-200 text-[13px] font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors duration-150 flex items-center justify-center gap-1.5"
                            >
                                <Eye className="w-4 h-4" />
                                {showPreview ? 'Hide' : 'Show'} Preview
                            </button>

                            {showPreview && selectedCustomers.size > 0 && (
                                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-[10px]">
                                    <h3 className="text-[11px] font-medium text-slate-600 mb-2">Preview (First Customer)</h3>
                                    <div className="bg-white p-3 rounded-md border border-slate-200">
                                        <p className="text-[13px] text-slate-600 whitespace-pre-wrap">
                                            {replacePlaceholders(
                                                message,
                                                customers.find(c => c.id === Array.from(selectedCustomers)[0]) || customers[0]
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSend}
                                disabled={sending || selectedCustomers.size === 0 || !message.trim()}
                                className="w-full h-10 px-4 rounded-md bg-emerald-600 text-white text-[13px] font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2"
                            >
                                {sending ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Queue {selectedCustomers.size} Message{selectedCustomers.size !== 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default BulkMessageSender;
