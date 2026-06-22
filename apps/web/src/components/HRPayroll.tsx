import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Users, Play, Check, X, CreditCard, Sparkles } from 'lucide-react';

export const HRPayroll: React.FC = () => {
  const { employees, runPayroll, updateLeave, logApiCall, auditLogs } = useErp();
  const [selectedPeriod, setSelectedPeriod] = useState('June 2026');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if leave request has already been handled in the audit logs
  const hasBeenHandled = auditLogs.some(log => 
    log.module === 'HR & Payroll' && 
    (log.action === 'Leave Request Approved' || log.action === 'Leave Request Rejected') &&
    log.details.includes('Rutvee Bhut')
  );

  // Mock leave request alert
  const [leaveRequest, setLeaveRequest] = useState<any>(() => {
    if (hasBeenHandled) return null;
    return {
      empId: 'emp-103',
      empName: 'Rutvee Bhut',
      days: 4,
      reason: 'Annual Family Vacation',
      startDate: '2026-07-02'
    };
  });

  const handleRunPayroll = async () => {
    const start = performance.now();
    setIsProcessing(true);

    setTimeout(async () => {
      await runPayroll(selectedPeriod);
      setIsProcessing(false);
      alert(`Payroll for ${selectedPeriod} processed successfully. Double-entry journal vouchers logged to Ledger.`);
      logApiCall('POST', '/api/v1/hr/payroll/run', 200, Math.round(performance.now() - start));
    }, 1500);
  };

  const handleLeaveDecision = async (approve: boolean) => {
    const start = performance.now();
    await updateLeave(leaveRequest.empId, leaveRequest.days, approve);
    setLeaveRequest(null);
    logApiCall('POST', `/api/v1/hr/leave/${approve ? 'approve' : 'reject'}`, 200, Math.round(performance.now() - start));
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Overview Header */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-400" /> HR & Payroll Administration (F-04)
        </h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          Manage employee records, approve leave balance requests, and process monthly payroll. The payroll engine automates tax withholding, benefit calculations, and general ledger journal postings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Processing Console */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold text-slate-200 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-450" /> Payroll Processing Engine
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Select the fiscal period to execute gross-to-net salary disbursements for active employees.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Fiscal Pay Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:outline-none"
                >
                  <option value="June 2026">June 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="August 2026">August 2026</option>
                </select>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-xs space-y-2">
                <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Cost Projection Summary</span>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Payroll Count</span>
                  <span className="text-slate-200 font-mono">4 Employees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projected Gross Cost</span>
                  <span className="text-slate-250 font-semibold font-mono">$43,750.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Taxes (15%)</span>
                  <span className="text-slate-250 font-semibold font-mono">$6,562.50</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleRunPayroll}
            disabled={isProcessing}
            className={`w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 text-slate-100 font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-6 ${
              isProcessing ? 'animate-pulse cursor-wait' : ''
            }`}
          >
            <Play className="w-4 h-4" /> {isProcessing ? 'Calculating Tax & Ledger Entries...' : 'Execute Payroll Batch'}
          </button>
        </div>

        {/* Leave Requests & HR Approvals */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" /> Pending HR Action Items
            </h3>
            
            {leaveRequest ? (
              <div className="bg-purple-500/5 border border-purple-500/15 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-purple-400 font-semibold block">Leave Request Approval Required</span>
                    <h4 className="text-lg font-display font-semibold text-slate-200 mt-1">{leaveRequest.empName}</h4>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/35 rounded-lg text-xs font-semibold">
                    {leaveRequest.days} Days Requested
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-900">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Planned Start Date</span>
                    <span className="text-slate-350 block mt-1">{leaveRequest.startDate}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-900">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Leave Description</span>
                    <span className="text-slate-350 block mt-1 truncate">{leaveRequest.reason}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => handleLeaveDecision(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4" /> Approve Leave
                  </button>
                  <button 
                    onClick={() => handleLeaveDecision(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-350 px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <X className="w-4 h-4" /> Deny Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl text-center text-slate-500 text-xs space-y-2">
                <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                <span className="block text-slate-350 font-medium">All leave requests processed</span>
                <span>No active approval queues found.</span>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 mt-6 leading-relaxed">
            Approving leave deducts days from the employee's annual allocation and switches their ledger profile status to 'Leave' during that period.
          </div>
        </div>
      </div>

      {/* Employee Registry */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-display font-semibold text-slate-200 mb-4">Corporate Employee Directory</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-bold">
                <th className="pb-3">Name / Role</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Salary (Annual)</th>
                <th className="pb-3">Leave Balance</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Last Pay Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-900/30 transition-all">
                  <td className="py-3.5 space-y-1">
                    <div className="font-semibold text-slate-200">{emp.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{emp.email} | ID: {emp.id}</div>
                  </td>
                  <td className="py-3.5 text-slate-300 font-medium">{emp.department}</td>
                  <td className="py-3.5 font-mono font-medium text-slate-300">${emp.salary.toLocaleString()}</td>
                  <td className="py-3.5 text-slate-350 font-mono">{emp.leaveBalance} Days</td>
                  <td className="py-3.5">
                    {emp.status === 'Active' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">Active</span>
                    )}
                    {emp.status === 'Leave' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">On Leave</span>
                    )}
                    {emp.status === 'Onboarding' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">Onboarding</span>
                    )}
                  </td>
                  <td className="py-3.5">
                    {emp.payrollHistory.length > 0 ? (
                      <div className="space-y-1 font-mono text-[10px]">
                        <span className="text-slate-300 block">{emp.payrollHistory[0].period}</span>
                        <span className="text-slate-500 block">Net: ${emp.payrollHistory[0].netPay}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No processed payroll</span>
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
