import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Bell, Mail, Phone, Globe, Send, Sparkles } from 'lucide-react';

export const NotificationEngine: React.FC = () => {
  const { notifications, triggerNotification, logApiCall } = useErp();
  const [recipient, setRecipient] = useState('https://webhook.site/amdox-erp');
  const [message, setMessage] = useState('Critical Alert: Production SLA Latency Warning');
  const [notifType, setNotifType] = useState<'In-app' | 'Email' | 'SMS' | 'Webhook'>('Webhook');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = performance.now();
    setIsSending(true);

    setTimeout(async () => {
      await triggerNotification(notifType, recipient, message);
      setIsSending(false);
      alert(`${notifType} notification dispatched to ${recipient}.`);
      logApiCall('POST', '/api/v1/notify/send', 200, Math.round(performance.now() - start));
    }, 1000);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'In-app': return <Bell className="w-4 h-4 text-purple-400" />;
      case 'Email': return <Mail className="w-4 h-4 text-blue-400" />;
      case 'SMS': return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'Webhook': return <Globe className="w-4 h-4 text-amber-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
          <Bell className="w-6 h-6 text-purple-400" /> Enterprise Notification Engine (F-10)
        </h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          Broadcast alerts across multi-channel endpoints: in-app sockets, transactional SMTP email, Twilio SMS networks, and outbound webhooks. Features automatic backoff-and-retry pipelines on network drops.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification Simulator */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between">
          <form onSubmit={handleSend} className="space-y-4">
            <h3 className="text-lg font-display font-semibold text-slate-200 flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-400" /> Dispatch Webhook / Alert
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Alert Channel</label>
                <select
                  value={notifType}
                  onChange={(e: any) => {
                    setNotifType(e.target.value);
                    if (e.target.value === 'Webhook') setRecipient('https://webhook.site/amdox-erp');
                    else if (e.target.value === 'Email') setRecipient('ops-leads@amdox.io');
                    else if (e.target.value === 'SMS') setRecipient('+1 (555) 438-9801');
                    else setRecipient('admin@amdox.io');
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-350 focus:outline-none"
                >
                  <option value="Webhook">Webhook Endpoint</option>
                  <option value="Email">Transactional Email</option>
                  <option value="SMS">SMS (Twilio)</option>
                  <option value="In-app">In-App Notification</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Target Endpoint / Recipient</label>
                <input 
                  type="text" 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. url, email or phone number"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Message Body</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Notification details..."
                  required
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSending}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 text-slate-100 font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 mt-4"
            >
              <Send className="w-3.5 h-3.5" /> {isSending ? 'Transmitting Packet...' : 'Fire Notification'}
            </button>
          </form>

          <div className="text-[10px] text-slate-500 text-center mt-4">
            Webhook payloads are signed with HMAC SHA-256 headers for security.
          </div>
        </div>

        {/* Channels Monitor */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Channel Uptime & Retry Logs
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">AWS SES (Email)</span>
                <span className="text-sm font-semibold text-emerald-400 block mt-1">Operational</span>
                <span className="text-[9px] text-slate-500 block mt-1">Uptime 100%</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Twilio (SMS)</span>
                <span className="text-sm font-semibold text-emerald-400 block mt-1">Operational</span>
                <span className="text-[9px] text-slate-500 block mt-1">Latency 0.9s</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Webhook Broker</span>
                <span className="text-sm font-semibold text-emerald-400 block mt-1">Operational</span>
                <span className="text-[9px] text-slate-500 block mt-1">Retry Queue: 0</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">WebSocket Sockets</span>
                <span className="text-sm font-semibold text-blue-400 block mt-1">Connected</span>
                <span className="text-[9px] text-slate-500 block mt-1">12 Sockets</span>
              </div>
            </div>

            <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl mt-6 space-y-2 text-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Retry Policy Specifications</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                 Outbound webhook targets that return 5xx errors enter an exponential backoff retry loop (tries: 1, 2, 4, 8, 16 minutes). After 5 attempts, alerts propagate to standard PagerDuty fallback triggers.
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 mt-6 leading-relaxed">
            All outbound notification logs are stored in TimescaleDB cluster for SOC 2 security compliance tracking.
          </div>
        </div>
      </div>

      {/* Notification Logs */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-display font-semibold text-slate-200 mb-4">Outbound Delivery Event Logs</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-bold">
                <th className="pb-3">Channel / Timestamp</th>
                <th className="pb-3">Recipient Address</th>
                <th className="pb-3">Notification Message</th>
                <th className="pb-3">Delivery Status</th>
                <th className="pb-3 text-right">Retry Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
              {notifications.map((notif) => (
                <tr key={notif.id} className="hover:bg-slate-900/30 transition-all">
                  <td className="py-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-350">
                      {getIcon(notif.type)}
                      <span>{notif.type}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 block">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                  </td>
                  <td className="py-3.5 text-slate-400 truncate max-w-xs">{notif.recipient}</td>
                  <td className="py-3.5 text-slate-300 font-sans">{notif.message}</td>
                  <td className="py-3.5">
                    {notif.status === 'Success' && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">Success</span>
                    )}
                    {notif.status === 'Failed' && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-450 font-bold">Failed</span>
                    )}
                  </td>
                  <td className="py-3.5 text-right font-semibold text-slate-400">{notif.attempts} attempt(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
