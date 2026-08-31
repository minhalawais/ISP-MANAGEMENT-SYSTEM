import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, CheckCircle, Clock, TrendingUp, Bell, Smartphone, QrCode, WifiOff, Wifi, AlertTriangle, Shield, Timer, RotateCcw, Power, Shuffle } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig.ts';
import { Sidebar } from '../../components/sideNavbar.tsx';
import { Topbar } from '../../components/topNavbar.tsx';
import { useOptionalAdminChrome } from '../../context/AdminLayoutContext.tsx';
import { getRole } from '../../utils/auth.ts';

interface WhatsAppConfig {
    configured: boolean;
    provider_type?: string;
    api_key?: string;
    server_address?: string;
    auto_send_invoices?: boolean;
    auto_send_deadline_alerts?: boolean;
    auto_send_complaint_updates?: boolean;
    auto_send_customer_onboarding?: boolean;
    deadline_check_time?: string;
    deadline_alert_days_before?: number;
    daily_quota_limit?: number;
    quota_buffer?: number;
    connection_status?: string;
    last_connection_test?: string;
    // Evolution fields
    instance_name?: string;
    phone_connected?: boolean;
    phone_number?: string;
    // Anti-ban
    min_delay_seconds?: number;
    max_delay_seconds?: number;
    send_window_start?: string;
    send_window_end?: string;
    enable_spintax?: boolean;
    // Warm-up
    warmup_complete?: boolean;
    warmup_start_date?: string;
    current_daily_limit?: number;
    sending_paused?: boolean;
}

const WhatsAppSettings: React.FC = () => {
    const canManage = ['super_admin', 'company_owner'].includes(getRole() || '');
    const [config, setConfig] = useState<WhatsAppConfig>({ configured: false });
    const [formData, setFormData] = useState({
        auto_send_invoices: true,
        auto_send_deadline_alerts: true,
        auto_send_complaint_updates: true,
        auto_send_customer_onboarding: true,
        deadline_check_time: '09:00',
        deadline_alert_days_before: 2,
        daily_quota_limit: 200,
        quota_buffer: 5,
        min_delay_seconds: 45,
        max_delay_seconds: 120,
        send_window_start: '09:00',
        send_window_end: '21:00',
        enable_spintax: true,
        sending_paused: false,
    });
    const [saving, setSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const hasChrome = useOptionalAdminChrome();

    // Evolution API states
    const [connecting, setConnecting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [restarting, setRestarting] = useState(false);
    const [qrCode, setQrCode] = useState<string>('');
    const [showQr, setShowQr] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        document.title = 'WhatsApp Settings';
        fetchConfig();

        // Periodically re-sync connection status so the UI stays accurate
        // even when the user isn't in the QR flow (e.g. after a webhook fires).
        const refreshInterval = setInterval(() => {
            fetchConfig();
        }, 30000); // every 30 seconds

        return () => {
            clearInterval(refreshInterval);
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const fetchConfig = async () => {
        try {
            const response = await axiosInstance.get('/api/whatsapp/config');
            setConfig(response.data);
            if (response.data.configured) {
                setFormData({
                    auto_send_invoices: response.data.auto_send_invoices ?? true,
                    auto_send_deadline_alerts: response.data.auto_send_deadline_alerts ?? true,
                    auto_send_complaint_updates: response.data.auto_send_complaint_updates ?? true,
                    auto_send_customer_onboarding: response.data.auto_send_customer_onboarding ?? true,
                    deadline_check_time: response.data.deadline_check_time || '09:00',
                    deadline_alert_days_before: response.data.deadline_alert_days_before || 2,
                    daily_quota_limit: response.data.daily_quota_limit || 200,
                    quota_buffer: response.data.quota_buffer || 5,
                    min_delay_seconds: response.data.min_delay_seconds ?? 45,
                    max_delay_seconds: response.data.max_delay_seconds ?? 120,
                    send_window_start: response.data.send_window_start || '09:00',
                    send_window_end: response.data.send_window_end || '21:00',
                    enable_spintax: response.data.enable_spintax ?? true,
                    sending_paused: response.data.sending_paused ?? false,
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
        } catch (error: any) {
            console.error('Error saving config:', error);
            alert(error?.response?.data?.error || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    // ─── Evolution API Handlers ──────────────────────────────────
    const handleConnect = async () => {
        try {
            setConnecting(true);
            const response = await axiosInstance.post('/api/whatsapp/instance/create');

            if (response.data.success) {
                // ── Case 1: Backend says already connected (e.g. genuine active session) ──
                // Call /instance/status to force-sync the DB connection state, THEN
                // refresh config. The status endpoint writes phone_connected=true to
                // the DB — without this the DB stays stale and config shows Disconnected.
                if (response.data.already_connected) {
                    try {
                        const statusResp = await axiosInstance.get('/api/whatsapp/instance/status');
                        // If status also confirms connected, no QR needed — stop here.
                        if (statusResp.data.connected) {
                            await fetchConfig();
                            return;
                        }
                    } catch {
                        // Status call failed — fall through to QR flow as a safe fallback.
                    }
                    // Status says not connected despite already_connected flag — start QR flow.
                    setShowQr(true);
                    startPolling();
                    return;
                }

                // ── Case 2: QR code already in the response (fast path) ─────────────────
                if (response.data.qr_code_base64) {
                    setQrCode(response.data.qr_code_base64);
                    setShowQr(true);
                    startPolling();
                    return;
                }

                // ── Case 3: QR not ready yet — show spinner and let polling fetch it ─────
                // This is the async path: Evolution is generating the QR in the background.
                // The polling loop will call GET /instance/qr every 5s until it arrives.
                setShowQr(true);
                startPolling();

                // Make one immediate attempt to fetch QR without blocking the spinner
                try {
                    const qrResp = await axiosInstance.get('/api/whatsapp/instance/qr');
                    if (qrResp.data.qr_code_base64) {
                        setQrCode(qrResp.data.qr_code_base64);
                    }
                } catch {
                    // Silently ignore — polling will retry in 5s
                }
            } else {
                alert(response.data.error || 'Failed to create instance');
            }
        } catch (error: any) {
            alert(error?.response?.data?.error || 'Failed to connect. Is Docker running?');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm('Are you sure you want to disconnect WhatsApp? Messages will stop sending.')) return;
        try {
            setDisconnecting(true);
            await axiosInstance.post('/api/whatsapp/instance/disconnect');
            setShowQr(false);
            setQrCode('');
            if (pollingRef.current) clearInterval(pollingRef.current);
            fetchConfig();
        } catch (error) {
            alert('Failed to disconnect');
        } finally {
            setDisconnecting(false);
        }
    };

    const handleRestart = async () => {
        try {
            setRestarting(true);
            await axiosInstance.post('/api/whatsapp/instance/restart');
            setTimeout(fetchConfig, 3000);
        } catch (error) {
            alert('Failed to restart instance');
        } finally {
            setRestarting(false);
        }
    };

    const startPolling = () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(async () => {
            try {
                const resp = await axiosInstance.get('/api/whatsapp/instance/status');
                if (resp.data.connected) {
                    // Stop polling immediately — don't wait for the next tick.
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                    }
                    setShowQr(false);
                    setQrCode('');
                    await fetchConfig();
                } else {
                    // Refresh QR while still waiting for scan
                    try {
                        const qrResp = await axiosInstance.get('/api/whatsapp/instance/qr');
                        if (qrResp.data.qr_code_base64) {
                            setQrCode(qrResp.data.qr_code_base64);
                        }
                    } catch (qrErr) {
                        console.warn('QR refresh failed:', qrErr);
                    }
                }
            } catch (err) {
                console.warn('Status poll failed:', err);
            }
        }, 5000);
    };

    // ─── Warm-up Helpers ─────────────────────────────────────────
    const getWarmupWeek = () => {
        if (!config.warmup_start_date) return 0;
        const days = Math.floor((Date.now() - new Date(config.warmup_start_date).getTime()) / 86400000);
        if (days < 7) return 1;
        if (days < 14) return 2;
        if (days < 21) return 3;
        return 4;
    };

    const getWarmupProgress = () => {
        if (config.warmup_complete) return 100;
        const week = getWarmupWeek();
        return Math.min(week * 25, 100);
    };

    const inputClass = "w-full h-9 px-3 border border-slate-200 rounded-md bg-white text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/[0.12] focus:border-emerald-600 hover:border-slate-300 transition-colors duration-150";
    const cardClass = "bg-white p-5 rounded-[10px] border border-slate-200";
    const sectionHeaderClass = "flex items-center gap-2.5 mb-4";
    const iconBoxClass = "w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center";

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

                    {/* Page Header */}
                    <div className={cardClass}>
                        <h1 className="text-[15px] font-medium text-slate-900 flex items-center gap-2">
                            <span className={iconBoxClass}><Settings className="w-4 h-4 text-emerald-600" /></span>
                            WhatsApp Settings
                        </h1>
                        <p className="text-[11px] text-slate-400 mt-1">Configure your WhatsApp messaging system with Evolution API</p>
                    </div>

                    {/* Legal Disclaimer */}
                    <div className="bg-rose-50 border border-rose-200 rounded-[10px] p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[12px] font-semibold text-rose-700">Important Disclaimer</p>
                            <p className="text-[11px] text-rose-600 mt-1 leading-relaxed">
                                This integration uses unofficial WhatsApp connections via Evolution API. Using personal numbers for automated billing violates Meta's Terms of Service.
                                You accept all risks of number bans. <strong>We recommend using a dedicated billing number.</strong>
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">

                        {/* ─── WhatsApp Connection Section ─── */}
                        <div className={cardClass}>
                            <div className={sectionHeaderClass}>
                                <span className={iconBoxClass}><Smartphone className="w-4 h-4 text-emerald-600" /></span>
                                <div>
                                    <h2 className="text-[13px] font-medium text-slate-900">WhatsApp Connection</h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Connect your WhatsApp number via QR code scan</p>
                                </div>
                            </div>

                            {/* Connection Status */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[10px] border border-slate-200 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${config.phone_connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                    <div>
                                        <p className="text-[13px] font-medium text-slate-700">
                                            {config.phone_connected ? 'Connected' : 'Disconnected'}
                                        </p>
                                        {config.phone_connected && config.phone_number && (
                                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                <Wifi className="w-3 h-3" /> {config.phone_number}
                                            </p>
                                        )}
                                        {!config.phone_connected && (
                                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                <WifiOff className="w-3 h-3" /> No WhatsApp number linked
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {!config.phone_connected ? (
                                        <button
                                            onClick={handleConnect}
                                            disabled={connecting || !canManage}
                                            className="h-9 px-4 rounded-md bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors duration-150 flex items-center gap-1.5"
                                        >
                                            {connecting ? (
                                                <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> Connecting...</>
                                            ) : (
                                                <><QrCode className="w-3.5 h-3.5" /> Connect WhatsApp</>
                                            )}
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleRestart}
                                                disabled={restarting || !canManage}
                                                className="h-9 px-3 rounded-md border border-slate-200 text-slate-600 text-[12px] font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors duration-150 flex items-center gap-1.5"
                                            >
                                                <RotateCcw className={`w-3.5 h-3.5 ${restarting ? 'animate-spin' : ''}`} /> Restart
                                            </button>
                                            <button
                                                onClick={handleDisconnect}
                                                disabled={disconnecting || !canManage}
                                                className="h-9 px-3 rounded-md border border-rose-200 text-rose-600 text-[12px] font-medium hover:bg-rose-50 disabled:opacity-50 transition-colors duration-150 flex items-center gap-1.5"
                                            >
                                                <Power className="w-3.5 h-3.5" /> Disconnect
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* QR Code Display */}
                            {showQr && (
                                <div className="flex flex-col items-center p-6 bg-slate-50 rounded-[10px] border border-slate-200 border-dashed">
                                    <QrCode className="w-6 h-6 text-slate-600 mb-2" />
                                    <p className="text-[13px] font-medium text-slate-700 mb-1">Scan QR Code</p>
                                    <p className="text-[11px] text-slate-400 mb-4">Open WhatsApp → Settings → Linked Devices → Link a Device</p>
                                    {qrCode ? (
                                        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                                            <img src={qrCode} alt="WhatsApp QR Code" className="w-56 h-56" />
                                        </div>
                                    ) : (
                                        <div className="w-56 h-56 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-emerald-600" />
                                        </div>
                                    )}
                                    <p className="text-[11px] text-slate-600 mt-3">Checking connection every 5 seconds...</p>
                                </div>
                            )}

                            {/* Warm-up Status */}
                            {config.phone_connected && !config.warmup_complete && (
                                <div className="mt-4 p-4 bg-amber-50 rounded-[10px] border border-amber-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-amber-600" />
                                            <p className="text-[12px] font-semibold text-amber-700">Number Warm-up Active</p>
                                        </div>
                                        <span className="text-[11px] font-medium text-amber-600">Week {getWarmupWeek()} of 4</span>
                                    </div>
                                    <div className="bg-amber-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${getWarmupProgress()}%` }} />
                                    </div>
                                    <p className="text-[11px] text-amber-600 mt-2">
                                        Current safe limit: <strong>{config.current_daily_limit} msgs/day</strong> · Gradually increasing to {formData.daily_quota_limit}
                                    </p>
                                </div>
                            )}

                            {config.phone_connected && config.warmup_complete && (
                                <div className="mt-4 p-3 bg-emerald-50 rounded-[10px] border border-emerald-200 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    <p className="text-[12px] text-emerald-700 font-medium">Warm-up complete · Full {formData.daily_quota_limit} msgs/day limit active</p>
                                </div>
                            )}
                        </div>

                        {/* ─── Anti-Ban Settings ─── */}
                        <div className={cardClass}>
                            <div className={sectionHeaderClass}>
                                <span className={iconBoxClass}><Shield className="w-4 h-4 text-emerald-600" /></span>
                                <div>
                                    <h2 className="text-[13px] font-medium text-slate-900">Anti-Ban Protection</h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Configure message delays & humanization to prevent bans</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Minimum Delay (seconds)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="15"
                                            max="180"
                                            value={formData.min_delay_seconds}
                                            onChange={(e) => setFormData({ ...formData, min_delay_seconds: parseInt(e.target.value) })}
                                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                        <span className="text-[13px] font-medium text-slate-700 tabular-nums w-12 text-right">{formData.min_delay_seconds}s</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Minimum wait between messages (recommended: 45s+)</p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Maximum Delay (seconds)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="30"
                                            max="300"
                                            value={formData.max_delay_seconds}
                                            onChange={(e) => setFormData({ ...formData, max_delay_seconds: parseInt(e.target.value) })}
                                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                        <span className="text-[13px] font-medium text-slate-700 tabular-nums w-12 text-right">{formData.max_delay_seconds}s</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Maximum wait between messages (recommended: 120s+)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Send Window Start</label>
                                    <input
                                        type="time"
                                        value={formData.send_window_start}
                                        onChange={(e) => setFormData({ ...formData, send_window_start: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Send Window End</label>
                                    <input
                                        type="time"
                                        value={formData.send_window_end}
                                        onChange={(e) => setFormData({ ...formData, send_window_end: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[10px] border border-slate-200">
                                <div className="flex items-center gap-2">
                                    <Shuffle className="w-4 h-4 text-slate-500" />
                                    <div>
                                        <p className="text-[13px] font-medium text-slate-700">Spintax Message Humanization</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Randomize message content so no two messages are identical</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.enable_spintax}
                                        onChange={(e) => setFormData({ ...formData, enable_spintax: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/[0.12] rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>

                            {/* Safety Summary */}
                            <div className="mt-4 p-3 bg-slate-100 rounded-[10px] border border-slate-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Timer className="w-3.5 h-3.5 text-slate-600" />
                                    <p className="text-[11px] font-semibold text-slate-700">Safety Summary</p>
                                </div>
                                <p className="text-[11px] text-slate-600">
                                    Messages will send between <strong>{formData.send_window_start}</strong> and <strong>{formData.send_window_end}</strong> with
                                    a random delay of <strong>{formData.min_delay_seconds}–{formData.max_delay_seconds}s</strong> between each message.
                                    {formData.enable_spintax && ' Spintax is ON — every message will be unique.'}
                                </p>
                            </div>
                        </div>

                        {/* ─── Automation ─── */}
                        <div className={cardClass}>
                            <div className={sectionHeaderClass}>
                                <span className={iconBoxClass}><Bell className="w-4 h-4 text-emerald-600" /></span>
                                <div>
                                    <h2 className="text-[13px] font-medium text-slate-900">Automation</h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Configure automatic messaging</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[10px] border border-slate-200">
                                    <div>
                                        <p className="text-[13px] font-medium text-slate-700">Pause All Sending</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Keep queued messages without dispatching them</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={formData.sending_paused} onChange={(e) => setFormData({ ...formData, sending_paused: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-500/[0.12] rounded-full peer peer-checked:bg-rose-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[10px] border border-slate-200">
                                    <div>
                                        <p className="text-[13px] font-medium text-slate-700">Auto-send Invoices</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Automatically send generated invoices to customers</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={formData.auto_send_invoices} onChange={(e) => setFormData({ ...formData, auto_send_invoices: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/[0.12] rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[10px] border border-slate-200">
                                    <div>
                                        <p className="text-[13px] font-medium text-slate-700">Auto-send Deadline Alerts</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Send automatic reminders before payment due dates</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={formData.auto_send_deadline_alerts} onChange={(e) => setFormData({ ...formData, auto_send_deadline_alerts: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/[0.12] rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[10px] border border-slate-200">
                                    <div>
                                        <p className="text-[13px] font-medium text-slate-700">Auto-send Complaint Updates</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Notify customers when tickets are opened or resolved</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={formData.auto_send_complaint_updates} onChange={(e) => setFormData({ ...formData, auto_send_complaint_updates: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/[0.12] rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[10px] border border-slate-200">
                                    <div>
                                        <p className="text-[13px] font-medium text-slate-700">Auto-send Customer Onboarding</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Welcome message when a new customer is created</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={formData.auto_send_customer_onboarding} onChange={(e) => setFormData({ ...formData, auto_send_customer_onboarding: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/[0.12] rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* ─── Schedule Settings ─── */}
                        <div className={cardClass}>
                            <div className={sectionHeaderClass}>
                                <span className={iconBoxClass}><Clock className="w-4 h-4 text-emerald-600" /></span>
                                <div>
                                    <h2 className="text-[13px] font-medium text-slate-900">Schedule Settings</h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Configure when messages are sent</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Deadline Check Time</label>
                                    <input type="time" value={formData.deadline_check_time} onChange={(e) => setFormData({ ...formData, deadline_check_time: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Alert Days Before Due</label>
                                    <input type="number" min="1" max="7" value={formData.deadline_alert_days_before} onChange={(e) => setFormData({ ...formData, deadline_alert_days_before: parseInt(e.target.value) })} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* ─── Quota Management ─── */}
                        <div className={cardClass}>
                            <div className={sectionHeaderClass}>
                                <span className={iconBoxClass}><TrendingUp className="w-4 h-4 text-emerald-600" /></span>
                                <div>
                                    <h2 className="text-[13px] font-medium text-slate-900">Quota Management</h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Configure daily message limits</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Daily Quota Limit</label>
                                    <input type="number" min="1" max="500" value={formData.daily_quota_limit} onChange={(e) => setFormData({ ...formData, daily_quota_limit: parseInt(e.target.value) })} className={inputClass} />
                                    <p className="text-[11px] text-slate-400 mt-1.5">Maximum messages per day after warm-up (recommended: 200)</p>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Safety Buffer</label>
                                    <input type="number" min="0" max="50" value={formData.quota_buffer} onChange={(e) => setFormData({ ...formData, quota_buffer: parseInt(e.target.value) })} className={inputClass} />
                                    <p className="text-[11px] text-slate-400 mt-1.5">Reserved buffer to prevent quota overflow</p>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-slate-50 rounded-[10px] border border-slate-200">
                                <p className="text-[13px] text-slate-600">
                                    <span className="font-medium text-slate-700">Effective Limit: </span>
                                    {config.phone_connected && !config.warmup_complete
                                        ? <><strong className="text-amber-600">{config.current_daily_limit}</strong> msgs/day (warm-up) → {formData.daily_quota_limit - formData.quota_buffer} after warm-up</>
                                        : <>{formData.daily_quota_limit - formData.quota_buffer} messages/day</>
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving || !canManage}
                                className="h-10 px-5 rounded-md bg-emerald-600 text-white text-[13px] font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors duration-150 flex items-center gap-1.5"
                            >
                                {saving ? (
                                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Saving...</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Save Configuration</>
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

export default WhatsAppSettings;
