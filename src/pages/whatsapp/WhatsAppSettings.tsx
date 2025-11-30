import React, { useState, useEffect } from 'react';
import { Settings, Save, TestTube, CheckCircle, XCircle, Clock, TrendingUp, Zap, Bell } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig.ts';
import { Sidebar } from '../../components/sideNavbar.tsx';
import { Topbar } from '../../components/topNavbar.tsx';

interface WhatsAppConfig {
    configured: boolean;
    api_key?: string;
    server_address?: string;
    auto_send_invoices?: boolean;
    auto_send_deadline_alerts?: boolean;
    message_send_time?: string;
    deadline_check_time?: string;
    deadline_alert_days_before?: number;
    daily_quota_limit?: number;
    quota_buffer?: number;
    connection_status?: string;
    last_connection_test?: string;
}

const WhatsAppSettings: React.FC = () => {
    const [config, setConfig] = useState<WhatsAppConfig>({ configured: false });
    const [formData, setFormData] = useState({
        api_key: '923234689090-72755279-84da-4dec-9d36-406c3cbd9895',
        server_address: 'https://myapi.pk/',
        auto_send_invoices: true,
        auto_send_deadline_alerts: true,
        message_send_time: '09:00',
        deadline_check_time: '09:00',
        deadline_alert_days_before: 2,
        daily_quota_limit: 200,
        quota_buffer: 5
    });
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        console.log('Page is loaded');
        document.title = 'WhatsApp Settings - MBA NET';
        fetchConfig();
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const fetchConfig = async () => {
        try {
            const response = await axiosInstance.get('/api/whatsapp/config');
            setConfig(response.data);

            if (response.data.configured) {
                setFormData({
                    api_key: response.data.api_key || formData.api_key,
                    server_address: response.data.server_address || formData.server_address,
                    auto_send_invoices: response.data.auto_send_invoices ?? true,
                    auto_send_deadline_alerts: response.data.auto_send_deadline_alerts ?? true,
                    message_send_time: response.data.message_send_time || '09:00',
                    deadline_check_time: response.data.deadline_check_time || '09:00',
                    deadline_alert_days_before: response.data.deadline_alert_days_before || 2,
                    daily_quota_limit: response.data.daily_quota_limit || 200,
                    quota_buffer: response.data.quota_buffer || 5
                });
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await axiosInstance.put('/api/whatsapp/config', formData);
            alert('Configuration saved successfully!');
            fetchConfig();
            setSaving(false);
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Failed to save configuration');
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        if (!formData.api_key || !formData.server_address) {
            alert('Please fill in API credentials first');
            return;
        }

        try {
            setTesting(true);
            setTestResult(null);

            const response = await axiosInstance.post('/api/whatsapp/config/test-connection');

            setTestResult({
                success: response.data.success,
                message: response.data.message || (response.data.success ? 'Connection successful!' : 'Connection failed')
            });

            setTesting(false);
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Connection test failed'
            });
            setTesting(false);
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
                                <Settings className="w-8 h-8 text-white" />
                            </div>
                            WhatsApp Settings
                        </h1>
                        <p className="text-[#656565] mt-2 text-lg">Configure your WhatsApp messaging system</p>
                    </div>

                    <div className="max-w-6xl space-y-6">
                        {/* API Configuration */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-[#F1F0E8]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-[#89A8B2] to-[#B3C8CF] p-3 rounded-xl shadow-lg">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#2A5C8A]">API Configuration</h2>
                                    <p className="text-sm text-[#656565]">Set up your WhatsApp API credentials</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-[#2A5C8A] mb-2">API Key</label>
                                    <input
                                        type="text"
                                        value={formData.api_key}
                                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-[#E5E1DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] text-[#2A5C8A]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[#2A5C8A] mb-2">Server Address</label>
                                    <input
                                        type="text"
                                        value={formData.server_address}
                                        onChange={(e) => setFormData({ ...formData, server_address: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-[#E5E1DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] text-[#2A5C8A]"
                                    />
                                </div>
                            </div>

                            {/* Test Connection */}
                            <div className="mt-6">
                                <button
                                    onClick={handleTestConnection}
                                    disabled={testing}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] text-white font-semibold hover:from-[#7A98A2] hover:to-[#A3B8BF] disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"
                                >
                                    {testing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            <TestTube className="w-5 h-5" />
                                            Test Connection
                                        </>
                                    )}
                                </button>

                                {testResult && (
                                    <div className={`mt-4 p-4 rounded-xl border-2 flex items-center gap-3 ${testResult.success
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-red-50 border-red-200'
                                        }`}>
                                        {testResult.success ? (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <XCircle className="w-6 h-6 text-red-600" />
                                        )}
                                        <p className={`font-semibold ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                            {testResult.message}
                                        </p>
                                    </div>
                                )}

                                {config.connection_status && (
                                    <div className="mt-4 text-sm text-[#656565]">
                                        <p>Last Test: {config.last_connection_test ? new Date(config.last_connection_test).toLocaleString() : 'Never'}</p>
                                        <p className={`font-semibold ${config.connection_status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                            Status: {config.connection_status}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Automation Settings */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-[#F1F0E8]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-[#89A8B2] to-[#B3C8CF] p-3 rounded-xl shadow-lg">
                                    <Bell className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#2A5C8A]">Automation</h2>
                                    <p className="text-sm text-[#656565]">Configure automatic messaging</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-[#F1F0E8] rounded-xl border-2 border-[#E5E1DA]">
                                    <div>
                                        <p className="font-semibold text-[#2A5C8A]">Auto-send Invoices</p>
                                        <p className="text-sm text-[#656565]">Automatically send generated invoices to customers</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.auto_send_invoices}
                                            onChange={(e) => setFormData({ ...formData, auto_send_invoices: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-[#E5E1DA] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#B3C8CF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#89A8B2] peer-checked:to-[#B3C8CF]"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-[#F1F0E8] rounded-xl border-2 border-[#E5E1DA]">
                                    <div>
                                        <p className="font-semibold text-[#2A5C8A]">Auto-send Deadline Alerts</p>
                                        <p className="text-sm text-[#656565]">Send automatic reminders before payment due dates</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.auto_send_deadline_alerts}
                                            onChange={(e) => setFormData({ ...formData, auto_send_deadline_alerts: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-[#E5E1DA] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#B3C8CF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#89A8B2] peer-checked:to-[#B3C8CF]"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Settings */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-[#F1F0E8]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-[#89A8B2] to-[#B3C8CF] p-3 rounded-xl shadow-lg">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#2A5C8A]">Schedule Settings</h2>
                                    <p className="text-sm text-[#656565]">Configure when messages are sent</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-[#2A5C8A] mb-2">Message Send Time</label>
                                    <input
                                        type="time"
                                        value={formData.message_send_time}
                                        onChange={(e) => setFormData({ ...formData, message_send_time: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-[#E5E1DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] text-[#2A5C8A]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[#2A5C8A] mb-2">Deadline Check Time</label>
                                    <input
                                        type="time"
                                        value={formData.deadline_check_time}
                                        onChange={(e) => setFormData({ ...formData, deadline_check_time: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-[#E5E1DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] text-[#2A5C8A]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[#2A5C8A] mb-2">Alert Days Before</label>
                                    <input
                                        type="number"
                                        value={formData.deadline_alert_days_before}
                                        onChange={(e) => setFormData({ ...formData, deadline_alert_days_before: parseInt(e.target.value) })}
                                        min="1"
                                        max="7"
                                        className="w-full px-4 py-3 border-2 border-[#E5E1DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] text-[#2A5C8A]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quota Settings */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-[#F1F0E8]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-[#89A8B2] to-[#B3C8CF] p-3 rounded-xl shadow-lg">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#2A5C8A]">Quota Management</h2>
                                    <p className="text-sm text-[#656565]">Configure daily message limits</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-[#2A5C8A] mb-2">Daily Quota Limit</label>
                                    <input
                                        type="number"
                                        value={formData.daily_quota_limit}
                                        onChange={(e) => setFormData({ ...formData, daily_quota_limit: parseInt(e.target.value) })}
                                        min="1"
                                        max="500"
                                        className="w-full px-4 py-3 border-2 border-[#E5E1DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] text-[#2A5C8A]"
                                    />
                                    <p className="text-xs text-[#656565] mt-2">Maximum messages per day (recommended: 200)</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[#2A5C8A] mb-2">Safety Buffer</label>
                                    <input
                                        type="number"
                                        value={formData.quota_buffer}
                                        onChange={(e) => setFormData({ ...formData, quota_buffer: parseInt(e.target.value) })}
                                        min="0"
                                        max="50"
                                        className="w-full px-4 py-3 border-2 border-[#E5E1DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-[#F1F0E8] text-[#2A5C8A]"
                                    />
                                    <p className="text-xs text-[#656565] mt-2">Reserved buffer to prevent quota overflow</p>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-[#F1F0E8] rounded-xl border-2 border-[#E5E1DA]">
                                <p className="text-sm text-[#656565]">
                                    <span className="font-semibold text-[#2A5C8A]">Effective Limit: </span>
                                    {formData.daily_quota_limit - formData.quota_buffer} messages/day
                                </p>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] text-white font-bold text-lg hover:from-[#7A98A2] hover:to-[#A3B8BF] disabled:opacity-50 transition-all shadow-xl hover:shadow-2xl flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-6 h-6" />
                                        Save Configuration
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default WhatsAppSettings;