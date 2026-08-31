import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Send, MessageCircle, Search, CheckCircle2, Eye, Filter, X, MapPin, ChevronDown } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig.ts';
import { Sidebar } from '../../components/sideNavbar.tsx';
import { Topbar } from '../../components/topNavbar.tsx';
import { useOptionalAdminChrome } from '../../context/AdminLayoutContext.tsx';
import {
    countActiveAudienceFilters,
    EMPTY_WHATSAPP_AUDIENCE_FILTERS,
    filterWhatsAppAudience,
    WhatsAppAudienceCustomer,
    WhatsAppAudienceFilters,
} from '../../utils/whatsappBulkAudience.ts';

interface FilterOption { id: string; name: string; area_id?: string; }

interface AudienceResponse {
    customers: WhatsAppAudienceCustomer[];
    filters: {
        areas: FilterOption[];
        sub_areas: FilterOption[];
        plans: FilterOption[];
        isps: FilterOption[];
        connection_types: string[];
    };
    total: number;
}

interface Template {
    id: string;
    name: string;
    template_text: string;
    default_priority: number;
    message_type?: string;
    category?: string;
}

const EMPTY_AUDIENCE: AudienceResponse = {
    customers: [],
    filters: { areas: [], sub_areas: [], plans: [], isps: [], connection_types: [] },
    total: 0,
};

const MAX_CAMPAIGN_SIZE = 500;

interface MultiFilterProps {
    label: string;
    options: FilterOption[];
    selected: string[];
    onChange: (values: string[]) => void;
}

const MultiFilter: React.FC<MultiFilterProps> = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                onClick={() => setIsOpen((current) => !current)}
                className={`w-full h-9 px-3 border rounded-md text-[12px] font-medium flex items-center justify-between gap-2 transition-colors ${selected.length ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
            >
                <span className="truncate">{label}{selected.length ? ` (${selected.length})` : ''}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-30 mt-1 w-64 max-w-[80vw] bg-white border border-slate-200 rounded-md shadow-lg p-2">
                    <div className="max-h-56 overflow-y-auto" role="listbox" aria-multiselectable="true">
                        {options.length === 0 ? (
                            <p className="px-2 py-3 text-[12px] text-slate-400">No options available</p>
                        ) : options.map((option) => {
                            const checked = selected.includes(option.id);
                            return (
                                <label key={option.id} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-slate-50 cursor-pointer text-[12px] text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onChange(checked ? selected.filter((id) => id !== option.id) : [...selected, option.id])}
                                        className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600"
                                    />
                                    <span className="truncate">{option.name}</span>
                                </label>
                            );
                        })}
                    </div>
                    {selected.length > 0 && (
                        <button type="button" onClick={() => onChange([])} className="w-full mt-1 pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-500 hover:text-slate-800">
                            Clear {label.toLowerCase()}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const BulkMessageSender: React.FC = () => {
    const [audience, setAudience] = useState<AudienceResponse>(EMPTY_AUDIENCE);
    const [audienceLoading, setAudienceLoading] = useState(true);
    const [filters, setFilters] = useState<WhatsAppAudienceFilters>(EMPTY_WHATSAPP_AUDIENCE_FILTERS);
    const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
    const [templates, setTemplates] = useState<Template[]>([]);
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState(20);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [messageType, setMessageType] = useState('custom');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const hasChrome = useOptionalAdminChrome();

    useEffect(() => {
        document.title = 'Bulk Message Sender';
        fetchAudience();
        fetchTemplates();
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const fetchAudience = async () => {
        try {
            setAudienceLoading(true);
            const response = await axiosInstance.get('/api/whatsapp/bulk-audience');
            setAudience(response.data);
        } catch (error) {
            console.error('Error fetching WhatsApp audience:', error);
        } finally {
            setAudienceLoading(false);
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

    const filteredCustomers = useMemo(
        () => filterWhatsAppAudience(audience.customers, filters, searchQuery),
        [audience.customers, filters, searchQuery],
    );
    const activeFilterCount = countActiveAudienceFilters(filters);
    const hasUnresolvedTemplateFields = /\[Enter [^\]]+\]/i.test(message);

    const updateFilter = (key: keyof WhatsAppAudienceFilters, values: string[]) => {
        setFilters((current) => {
            const next = { ...current, [key]: values };
            if (key === 'areaIds' && values.length > 0) {
                const allowedSubAreas = new Set(
                    audience.filters.sub_areas
                        .filter((item) => item.area_id && values.includes(item.area_id))
                        .map((item) => item.id),
                );
                next.subAreaIds = current.subAreaIds.filter((id) => allowedSubAreas.has(id));
            }
            return next;
        });
    };

    const availableSubAreas = useMemo(() => (
        filters.areaIds.length === 0
            ? audience.filters.sub_areas
            : audience.filters.sub_areas.filter((item) => item.area_id && filters.areaIds.includes(item.area_id))
    ), [audience.filters.sub_areas, filters.areaIds]);

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
        const next = new Set(selectedCustomers);
        filteredCustomers.forEach((customer) => next.add(customer.id));
        if (next.size > MAX_CAMPAIGN_SIZE) {
            alert(`A campaign can contain up to ${MAX_CAMPAIGN_SIZE} customers. Narrow the filters or clear part of the current selection.`);
            return;
        }
        setSelectedCustomers(next);
    };

    const deselectMatching = () => {
        const matchingIds = new Set(filteredCustomers.map((customer) => customer.id));
        setSelectedCustomers(new Set(Array.from(selectedCustomers).filter((id) => !matchingIds.has(id))));
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
        if (hasUnresolvedTemplateFields) {
            alert('Complete the highlighted maintenance or restoration details before queuing this campaign.');
            return;
        }

        try {
            setSending(true);
            const response = await axiosInstance.post('/api/whatsapp/send-bulk', {
                customer_ids: Array.from(selectedCustomers),
                message,
                priority,
                message_type: messageType,
            });
            const queued = response.data.messages_queued || 0;
            const skipped = response.data.messages_skipped || 0;
            alert(`Queued ${queued} messages${skipped ? `; skipped ${skipped}` : ''}.`);
            setMessage('');
            setSelectedCustomers(new Set());
            setSending(false);
        } catch (error: any) {
            console.error('Error sending messages:', error);
            alert(error?.response?.data?.error || 'Failed to queue messages');
            setSending(false);
        }
    };

    const replacePlaceholders = (text: string, customer: WhatsAppAudienceCustomer) => {
        return text
            .replace(/\{\{customer_name\}\}/g, `${customer.first_name} ${customer.last_name}`)
            .replace(/\{\{first_name\}\}/g, customer.first_name)
            .replace(/\{\{plan_name\}\}/g, customer.packages[0]?.name || 'Internet Service')
            .replace(/\{\{area_name\}\}/g, customer.area_name || 'your area')
            .replace(/\{\{sub_area_name\}\}/g, customer.sub_area_name || 'your locality');
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
                                        <p className="text-[11px] text-slate-400 mt-0.5">{selectedCustomers.size} selected · {filteredCustomers.length} matching</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative mb-3">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search name, ID, phone, area or package"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-md bg-white text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/[0.12] focus:border-emerald-600 hover:border-slate-300 transition-colors duration-150"
                                />
                            </div>

                            <div className="mb-3 border-y border-slate-100 py-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                                        <Filter className="w-3.5 h-3.5" /> Audience filters
                                        {activeFilterCount > 0 && <span className="text-emerald-700">{activeFilterCount} active</span>}
                                    </div>
                                    {activeFilterCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setFilters(EMPTY_WHATSAPP_AUDIENCE_FILTERS)}
                                            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800"
                                        >
                                            <X className="w-3 h-3" /> Clear filters
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                                    <MultiFilter label="Areas" options={audience.filters.areas} selected={filters.areaIds} onChange={(values) => updateFilter('areaIds', values)} />
                                    <MultiFilter label="Sub-areas" options={availableSubAreas} selected={filters.subAreaIds} onChange={(values) => updateFilter('subAreaIds', values)} />
                                    <MultiFilter label="Packages" options={audience.filters.plans} selected={filters.planIds} onChange={(values) => updateFilter('planIds', values)} />
                                    <MultiFilter label="ISPs" options={audience.filters.isps} selected={filters.ispIds} onChange={(values) => updateFilter('ispIds', values)} />
                                    <MultiFilter
                                        label="Connection type"
                                        options={audience.filters.connection_types.map((value) => ({ id: value, name: value }))}
                                        selected={filters.connectionTypes}
                                        onChange={(values) => updateFilter('connectionTypes', values)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                <button
                                    onClick={selectAll}
                                    className="h-8 px-3 text-[12px] font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-150"
                                >
                                    Select matching ({filteredCustomers.length})
                                </button>
                                <button
                                    onClick={deselectMatching}
                                    className="h-8 px-3 text-[12px] font-medium border border-slate-200 text-slate-600 rounded-md hover:border-slate-300 hover:bg-slate-50 transition-colors duration-150"
                                >
                                    Clear matching
                                </button>
                                {selectedCustomers.size > 0 && (
                                    <button
                                        onClick={() => setSelectedCustomers(new Set())}
                                        className="h-8 px-3 text-[12px] font-medium text-slate-500 hover:text-slate-800"
                                    >
                                        Clear selection
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                {audienceLoading ? (
                                    <div className="text-center py-10 text-[12px] text-slate-400">Loading eligible customers...</div>
                                ) : filteredCustomers.length === 0 ? (
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
                                                onClick={(event) => event.stopPropagation()}
                                                className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/[0.12]"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-medium text-slate-700 truncate">
                                                    {customer.first_name} {customer.last_name}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">{customer.internet_id} · {customer.phone_1}</p>
                                                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3 shrink-0" />
                                                    {[customer.sub_area_name, customer.area_name].filter(Boolean).join(', ') || 'Area not assigned'}
                                                    {customer.packages[0]?.name ? ` · ${customer.packages[0].name}` : ''}
                                                </p>
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
                                    value={selectedTemplateId}
                                    onChange={(e) => {
                                        setSelectedTemplateId(e.target.value);
                                        const template = templates.find(t => t.id === e.target.value);
                                        if (template) {
                                            setMessage(template.template_text);
                                            setPriority(template.default_priority);
                                            setMessageType(template.message_type || 'custom');
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
                                    placeholder="Type your message... Placeholders: {{customer_name}}, {{first_name}}, {{area_name}}, {{sub_area_name}}, {{plan_name}}, {{company_name}}"
                                    rows={8}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-white text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/[0.12] focus:border-emerald-600 hover:border-slate-300 transition-colors duration-150 resize-none"
                                />
                                <p className="text-[11px] text-slate-400 mt-1.5 tabular-nums">{message.length} characters</p>
                                {hasUnresolvedTemplateFields && (
                                    <p className="text-[11px] font-medium text-amber-700 mt-1.5">Complete all [Enter ...] details before sending.</p>
                                )}
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
                                                audience.customers.find(c => c.id === Array.from(selectedCustomers)[0]) || audience.customers[0]
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSend}
                                disabled={sending || selectedCustomers.size === 0 || !message.trim() || hasUnresolvedTemplateFields || selectedCustomers.size > MAX_CAMPAIGN_SIZE}
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
