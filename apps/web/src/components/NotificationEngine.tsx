import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Bell, Mail, Phone, Globe, Send } from 'lucide-react';

export const NotificationEngine: React.FC = () => {
  const { notifications, triggerNotification, logApiCall } = useErp();
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [notifType, setNotifType] = useState<'In-app' | 'Email' | 'SMS' | 'Webhook'>('Email');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !message) return;

    const start = performance.now();
    setIsSending(true);

    setTimeout(async () => {
      await triggerNotification(notifType, recipient, message);
      setIsSending(false);
      setRecipient('');
      setMessage('');
      alert(`Success: ${notifType} notification sent to ${recipient}.`);
      logApiCall('POST', '/api/v1/notify/send', 200, Math.round(performance.now() - start));
    }, 800);
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
          <Bell className="w-6 h-6 text-purple-400" /> Notifications Manager (F-10)
        </h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          Broadcast alerts across multi-channel endpoints: In-app sockets, transactional Email, SMS networks, and outbound Webhooks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simple Push Notification Form */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-1">
          <h3 className="text-lg font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-purple-400" /> Push New Notification
          </h3>
          
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Select Channel</label>
              <select
                value={notifType}
                onChange={(e: any) => setNotifType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-350 focus:outline-none"
              >
                <option value="Email">Email Message</option>
                <option value="In-app">In-App Alert</option>
                <option value="SMS">SMS / Text Message</option>
                <option value="Webhook">Webhook Endpoint</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Recipient Address / Target</label>
              <input 
                type="text" 
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. admin@amdox.io or +15551234"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Message Content</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter alert message details..."
                required
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSending}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 text-slate-100 font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 mt-4"
            >
              <Send className="w-3.5 h-3.5" /> {isSending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>

        {/* Notification Logs */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-display font-semibold text-slate-200 mb-4">Outbound Alert Logs</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="pb-3">Channel / Timestamp</th>
                  <th className="pb-3">Recipient Address</th>
                  <th className="pb-3">Message</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-slate-900/30 transition-all">
                    <td className="py-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-355">
                        {getIcon(notif.type)}
                        <span>{notif.type}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block">{new Date(notif.timestamp).toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 text-slate-400 truncate max-w-[120px]">{notif.recipient}</td>
                    <td className="py-3.5 text-slate-300 font-sans">{notif.message}</td>
                    <td className="py-3.5">
                      {notif.status === 'Success' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">Success</span>
                      )}
                      {notif.status === 'Failed' && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-455 font-bold">Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
