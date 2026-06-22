import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { ShieldAlert, RefreshCw, Download, Trash, UserCheck, CheckCircle2 } from 'lucide-react';

export const AuditCompliance: React.FC = () => {
  const { auditLogs, verifyAuditTrail, logApiCall } = useErp();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'Verified' | 'Failed' | null>(null);

  // GDPR states
  const [gdprUser, setGdprUser] = useState('usr-042');
  const [gdprActionMessage, setGdprActionMessage] = useState('');

  const handleVerify = async () => {
    const start = performance.now();
    setIsValidating(true);
    setValidationResult(null);

    // Simulate cryptographic verification delay
    setTimeout(async () => {
      const ok = await verifyAuditTrail();
      setIsValidating(false);
      setValidationResult(ok ? 'Verified' : 'Failed');
      logApiCall('POST', '/api/v1/compliance/audit/verify', 200, Math.round(performance.now() - start));
    }, 1500);
  };

  const handleGdprExport = () => {
    const start = performance.now();
    const mockGdprData = {
      subject_id: gdprUser,
      export_timestamp: new Date().toISOString(),
      personal_data: {
        identities: [
          { system: 'Keycloak OIDC', account: gdprUser, email: 'admin@amdox.io' }
        ],
        audit_records: auditLogs.filter(log => log.userId === gdprUser)
      },
      retention_policy: 'ISO 27001 / GDPR Article 30 aligned'
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mockGdprData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `GDPR_DSR_Export_${gdprUser}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setGdprActionMessage(`GDPR DSR Export completed for user: ${gdprUser}. JSON schema generated.`);
    logApiCall('POST', `/api/v1/compliance/dsr/export?subjectId=${gdprUser}`, 200, Math.round(performance.now() - start));
  };

  const handleGdprErasure = () => {
    const start = performance.now();
    // Simulate soft-delete / scrub logging
    setGdprActionMessage(`GDPR Right to Erasure: Soft-delete pipeline triggered for user '${gdprUser}'. Scrambling identifiable data logs...`);
    logApiCall('POST', `/api/v1/compliance/dsr/erase?subjectId=${gdprUser}`, 200, Math.round(performance.now() - start));
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Overview */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-purple-400" /> Audit & SOC 2 Compliance (F-09)
        </h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          AMX-ERP enforces an immutable audit trail. Every write action (finance postings, HR payroll runs, PO issuances) calculates a cryptographic block hash chained back to the previous log (SHA-256), satisfying SOC 2 CC7.2 trust criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ledger Integrity Panel */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold text-slate-200">Cryptographic Chain Verification</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Verify the mathematical integrity of the audit logs. The system re-hashes all historical blocks to confirm no logs were manipulated.
            </p>

            {validationResult === 'Verified' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Audit Trail Verified Integrity</span>
                </div>
                <p className="text-[10px] text-slate-400">All block hashes match their preceding linkages. Cryptographic audit is 100% secure.</p>
              </div>
            )}

            {validationResult === 'Failed' && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-4 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Verification Failure</span>
                </div>
                <p className="text-[10px] text-slate-400">Ledger chain links have been broken! Contact database security lead immediately.</p>
              </div>
            )}
          </div>

          <button 
            onClick={handleVerify}
            disabled={isValidating}
            className={`w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 text-slate-100 font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-6 ${
              isValidating ? 'animate-pulse cursor-wait' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} /> 
            {isValidating ? 'Hashing Blocks...' : 'Scan Cryptographic Ledger'}
          </button>
        </div>

        {/* GDPR DSR Portal */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold text-slate-200">GDPR Data Subject Request Pipeline</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Exert compliance with GDPR right-to-be-forgotten and data portability regulations. Select a user identifier to export or delete their profile datasets.
            </p>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[9px] text-slate-500 block uppercase font-bold mb-1">Subject Identifier (User/Employee)</label>
                <input 
                  type="text" 
                  value={gdprUser}
                  onChange={(e) => setGdprUser(e.target.value)}
                  placeholder="e.g. usr-042" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 self-end">
                <button
                  onClick={handleGdprExport}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Export Data
                </button>
                <button
                  onClick={handleGdprErasure}
                  className="bg-rose-600/10 hover:bg-rose-650 text-rose-300 border border-rose-500/25 px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition font-semibold"
                >
                  <Trash className="w-3.5 h-3.5" /> Right to Erasure
                </button>
              </div>
            </div>

            {gdprActionMessage && (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 p-4 rounded-xl text-[11px] leading-relaxed flex items-start gap-2 animate-fade-in">
                <UserCheck className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                <span>{gdprActionMessage}</span>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 mt-6 leading-relaxed">
            Note: DSR deletes scrub identifiable elements from transactions databases while preserving ledger aggregate counts for audit trail integrity.
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-display font-semibold text-slate-200 mb-4">Cryptographic Hash-Linked Audit Logs</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px] font-mono">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-bold">
                <th className="pb-3">Index / Timestamp</th>
                <th className="pb-3">User / Module</th>
                <th className="pb-3">Action Description</th>
                <th className="pb-3">Previous Block Hash</th>
                <th className="pb-3">Current Block Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/30 transition-all">
                  <td className="py-3.5 space-y-1">
                    <span className="text-slate-300 font-semibold block">{log.id}</span>
                    <span className="text-[9px] text-slate-500 block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </td>
                  <td className="py-3.5 space-y-1">
                    <span className="text-slate-350 block">{log.userId}</span>
                    <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[8px] text-slate-450 block w-fit font-bold">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-400 truncate max-w-xs">{log.details}</td>
                  <td className="py-3.5 text-slate-550 break-all max-w-[120px]">{log.prevHash.substr(0, 16)}...</td>
                  <td className="py-3.5 text-purple-400 font-semibold break-all max-w-[120px]">{log.hash.substr(0, 16)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
