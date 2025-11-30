import React, { useState, useEffect } from 'react';
import { Users, Send, MessageCircle, Search, Filter, CheckCircle2, Eye } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig.ts';
import { Sidebar } from '../../components/sideNavbar.tsx';
import { Topbar } from '../../components/topNavbar.tsx';

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

    useEffect(() => {
        document.title = 'Bulk Message Sender - MBA NET';
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
            await axiosInstance.post('/api/whatsapp/send-bulk', {
                customer_ids: Array.from(selectedCustomers),
                message,
                priority,
            });
            alert(`Successfully queued ${selectedCustomers.size} messages!`);
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
        <div className="flex h-screen bg-[#F1F0E8] ml-20">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar toggleSidebar={toggleSidebar} />
                <main className="flex-1 overflow-y-auto p-6 mt-14">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-[#2A5C8A] flex items-center gap-3">
                            <div className="bg-gradient-to-br from-[#89A8B2] to-[#B3C8CF] p-3 rounded-2xl shadow-lg">
                                <Send className="w-8 h-8 text-white" />
                            </div>
                            Bulk Message Sender
                        </h1>
                        <p className="text-[#656565] mt-2 text-lg">Send messages to multiple customers at once</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Customer Selection Panel */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-[#F1F0E8]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-br from-[#89A8B2] to-[#B3C8CF] p-3 rounded-xl shadow-lg">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#2A5C8A]">Select Recipients</h2>
                                        <p className="text-sm text-[#656565]">{selectedCustomers.size} customers selected</p>
                                    </div>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-3.5 w-5 h-5 text-[#89A8B2]" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-[#E5E1DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] text-[#2A5C8A] placeholder-[#89A8B2]"
                                />
                            </div>

                            {/* Select All/None */}
                            <div className="flex gap-3 mb-4">
                                <button
                                    onClick={selectAll}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] text-white font-semibold hover:from-[#7A98A2] hover:to-[#A3B8BF] transition-all shadow-md"
                                >
                                    Select All ({filteredCustomers.length})
                                </button>
                                <button
                                    onClick={deselectAll}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#E5E1DA] text-[#656565] font-semibold hover:bg-[#D5D1CA] transition-all"
                                >
                                    Deselect All
                                </button>
                            </div>

                            {/* Customer List */}
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredCustomers.length === 0 ? (
                                    <div className="text-center py-12 text-[#656565]">
                                        <Users className="w-16 h-16 mx-auto mb-4 text-[#B3C8CF]" />
                                        <p className="text-lg font-medium">No customers found</p>
                                    </div>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedCustomers.has(customer.id)
                                                ? 'bg-gradient-to-r from-[#B3C8CF] to-[#89A8B2] border-[#89A8B2] shadow-lg scale-[1.02]'
                                                : 'bg-[#F1F0E8] border-[#E5E1DA] hover:border-[#B3C8CF] hover:shadow-md'
                                                }`}
                                            onClick={() => toggleCustomer(customer.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedCustomers.has(customer.id)}
                                                onChange={() => toggleCustomer(customer.id)}
                                                className="w-5 h-5 rounded border-2 border-[#89A8B2] text-[#89A8B2] focus:ring-[#89A8B2]"
                                            />
                                            <div className="flex-1">
                                                <p className={`font-semibold ${selectedCustomers.has(customer.id) ? 'text-white' : 'text-[#2A5C8A]'}`}>
                                                    {customer.first_name} {customer.last_name}
                                                </p>
                                                <p className={`text-sm ${selectedCustomers.has(customer.id) ? 'text-white/90' : 'text-[#656565]'}`}>
                                                    {customer.phone_1}
                                                </p>
                                            </div>
                                            {selectedCustomers.has(customer.id) && (
                                                <CheckCircle2 className="w-5 h-5 text-white" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Message Composition Panel */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-[#F1F0E8]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-[#89A8B2] to-[#B3C8CF] p-3 rounded-xl shadow-lg">
                                    <MessageCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#2A5C8A]">Compose Message</h2>
                                    <p className="text-sm text-[#656565]">Create your message content</p>
                                </div>
                            </div>

                            {/* Template Selector */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-[#2A5C8A] mb-2">Use Template (Optional)</label>
                                <select
                                    onChange={(e) => {
                                        const template = templates.find(t => t.id === e.target.value);
                                        if (template) {
                                            setMessage(template.template_text);
                                            setPriority(template.default_priority);
                                        }
                                    }}
                                    className="w-full px-4 py-3 border-2 border-[#E5E1DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] text-[#2A5C8A]"
                                >
                                    <option value="">Select a template...</option>
                                    {templates.map(template => (
                                        <option key={template.id} value={template.id}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Message Input */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-[#2A5C8A] mb-2">Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message... Use {{customer_name}}, {{first_name}}, {{plan_name}} as placeholders"
                                    rows={8}
                                    className="w-full px-4 py-3 border-2 border-[#E5E1DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent resize-none bg-[#F1F0E8] text-[#2A5C8A] placeholder-[#89A8B2]"
                                />
                                <p className="text-sm text-[#656565] mt-2">{message.length} characters</p>
                            </div>

                            {/* Priority Selector */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-[#2A5C8A] mb-2">Priority</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[0, 10, 20].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${priority === p
                                                ? 'bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] text-white shadow-lg scale-105'
                                                : 'bg-[#E5E1DA] text-[#656565] hover:bg-[#D5D1CA]'
                                                }`}
                                        >
                                            {p === 0 ? 'High' : p === 10 ? 'Medium' : 'Low'}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-[#656565] mt-2">{getPriorityLabel(priority)}</p>
                            </div>

                            {/* Preview Button */}
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="w-full mb-4 px-4 py-3 rounded-xl bg-[#E5E1DA] text-[#2A5C8A] font-semibold hover:bg-[#D5D1CA] transition-all flex items-center justify-center gap-2"
                            >
                                <Eye className="w-5 h-5" />
                                {showPreview ? 'Hide' : 'Show'} Preview
                            </button>

                            {/* Preview */}
                            {showPreview && selectedCustomers.size > 0 && (
                                <div className="mb-6 p-4 bg-[#F1F0E8] border-2 border-[#E5E1DA] rounded-xl">
                                    <h3 className="text-sm font-semibold text-[#2A5C8A] mb-3">Preview (First Customer):</h3>
                                    <div className="bg-white p-4 rounded-lg border border-[#B3C8CF]">
                                        <p className="text-[#656565] whitespace-pre-wrap">
                                            {replacePlaceholders(
                                                message,
                                                customers.find(c => c.id === Array.from(selectedCustomers)[0]) || customers[0]
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Send Button */}
                            <button
                                onClick={handleSend}
                                disabled={sending || selectedCustomers.size === 0 || !message.trim()}
                                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] text-white font-bold text-lg hover:from-[#7A98A2] hover:to-[#A3B8BF] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
                            >
                                {sending ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-6 h-6" />
                                        Queue {selectedCustomers.size} Message{selectedCustomers.size !== 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 8px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: #F1F0E8;
                            border-radius: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #B3C8CF;
                            border-radius: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #89A8B2;
                        }
                    `}</style>
                </main>
            </div>
        </div>
    );
};

export default BulkMessageSender;