import React from 'react';
import { useErp } from '../context/ErpContext';
import { ShieldAlert } from 'lucide-react';

export const AuditCompliance: React.FC = () => {
  const { auditLogs } = useErp();

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Overview */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-purple-400" /> Audit Logs & Activity History (F-09)
        </h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          AMX-ERP maintains a comprehensive, chronological ledger of all user and administrative actions. 
          Use this panel to track transactions, payroll executions, purchase orders, and authentication logs.
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-display font-semibold text-slate-200 mb-4">Activity Logs</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-bold">
                <th className="pb-3">Log ID / Timestamp</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Module</th>
                <th className="pb-3">Action Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/30 transition-all">
                  <td className="py-3.5 space-y-1">
                    <span className="text-slate-300 font-semibold block">{log.id}</span>
                    <span className="text-[10px] text-slate-500 block">{new Date(log.timestamp).toLocaleString()}</span>
                  </td>
                  <td className="py-3.5 text-slate-350">{log.userId}</td>
                  <td className="py-3.5">
                    <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 block w-fit font-bold">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-400 max-w-md truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
