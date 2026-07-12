import React from 'react';
import { useErp } from '../context/ErpContext';
import { Bell, Mail, Phone, Globe } from 'lucide-react';

export const NotificationEngine: React.FC = () => {
  const { notifications } = useErp();

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
          <Bell className="w-6 h-6 text-purple-400" /> Notification Logs (F-10)
        </h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          AMX-ERP monitors alert broadcasts and transactional notifications sent across standard corporate communication channels.
        </p>
      </div>

      {/* Notification Logs */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-display font-semibold text-slate-200 mb-4">Outbound Alert Logs</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-bold">
                <th className="pb-3">Channel / Timestamp</th>
                <th className="pb-3">Recipient Address</th>
                <th className="pb-3">Notification Message</th>
                <th className="pb-3">Delivery Status</th>
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
                    <span className="text-[9px] text-slate-500 block">{new Date(notif.timestamp).toLocaleString()}</span>
                  </td>
                  <td className="py-3.5 text-slate-400 truncate max-w-xs">{notif.recipient}</td>
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
  );
};
