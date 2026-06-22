import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2, Download, Trash2, Eye, ArrowUpDown } from 'lucide-react';


const REVENUE_DATA = [
  { month: 'Jan', Sales: 42000, Expense: 28000 },
  { month: 'Feb', Sales: 51000, Expense: 29000 },
  { month: 'Mar', Sales: 62000, Expense: 31000 },
  { month: 'Apr', Sales: 75000, Expense: 34000 },
  { month: 'May', Sales: 89000, Expense: 39000 },
  { month: 'Jun', Sales: 104000, Expense: 43000 }
];

export const BusinessIntelligence: React.FC = () => {
  const { transactions, logApiCall } = useErp();
  
  // Custom dashboard widget list
  const [widgets, setWidgets] = useState<string[]>([
    'revenue_trend', 'expense_split', 'sla_metrics', 'cash_position'
  ]);
  const [drilldownWidget, setDrilldownWidget] = useState<string | null>(null);

  const exportReport = (format: 'CSV' | 'JSON') => {
    const start = performance.now();
    
    // Construct CSV content of ledger accounts
    let content = '';
    if (format === 'CSV') {
      content = 'data:text/csv;charset=utf-8,ID,Date,Description,Reference,Amount,Currency\n';
      transactions.forEach(t => {
        content += `${t.id},${t.date},${t.description.replace(/,/g, ' ')},${t.ref},${t.debits[0]?.amount || 0},${t.currency}\n`;
      });
    } else {
      content = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    }

    // Trigger download
    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AMX_ERP_BI_Report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logApiCall('POST', `/api/v1/bi/reports/export?format=${format.toLowerCase()}`, 200, Math.round(performance.now() - start));
    alert(`BI Exporter: Generated ${format} document on client. Transferring payload...`);
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w !== id));
  };

  const addWidget = (id: string) => {
    if (!widgets.includes(id)) {
      setWidgets(prev => [...prev, id]);
    }
  };

  const reorderWidgets = () => {
    // Reverse/reorder simple simulator
    setWidgets(prev => [...prev].reverse());
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header Panel */}
      <div className="glass-card p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-purple-400" /> Business Intelligence & Analytics (F-08)
          </h2>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Drag-and-drop widgets, adjust analytic grids, execute drill-down transactions audit audits, and download corporate financial sheets.
          </p>
        </div>

        {/* Exporter Controls */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <button
            onClick={() => exportReport('CSV')}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-4 py-2.5 rounded-xl border border-slate-800 text-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-purple-400" /> Export CSV
          </button>
          <button
            onClick={() => exportReport('JSON')}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-4 py-2.5 rounded-xl border border-slate-800 text-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-purple-400" /> Export JSON
          </button>
          <button
            onClick={reorderWidgets}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-4 py-2.5 rounded-xl border border-slate-800 text-xs flex items-center gap-1.5 transition"
            title="Simulate Drag Grid Reordering"
          >
            <ArrowUpDown className="w-4 h-4 text-slate-400" /> Reorder Layout
          </button>
        </div>
      </div>

      {/* Widget Customizer Hub */}
      <div className="flex flex-wrap gap-2 items-center bg-slate-900/40 p-3 rounded-xl border border-slate-900 text-xs">
        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] mr-2">Available widgets:</span>
        <button 
          onClick={() => addWidget('revenue_trend')}
          className={`px-3 py-1.5 rounded-lg border font-medium transition ${
            widgets.includes('revenue_trend') ? 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-purple-600/10 border-purple-500/25 text-purple-300'
          }`}
        >
          + Revenue Trend
        </button>
        <button 
          onClick={() => addWidget('expense_split')}
          className={`px-3 py-1.5 rounded-lg border font-medium transition ${
            widgets.includes('expense_split') ? 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-purple-600/10 border-purple-500/25 text-purple-300'
          }`}
        >
          + Expense Allocations
        </button>
        <button 
          onClick={() => addWidget('sla_metrics')}
          className={`px-3 py-1.5 rounded-lg border font-medium transition ${
            widgets.includes('sla_metrics') ? 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-purple-600/10 border-purple-500/25 text-purple-300'
          }`}
        >
          + Gateway SLAs
        </button>
        <button 
          onClick={() => addWidget('cash_position')}
          className={`px-3 py-1.5 rounded-lg border font-medium transition ${
            widgets.includes('cash_position') ? 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-purple-600/10 border-purple-500/25 text-purple-300'
          }`}
        >
          + Cash Flow Ratio
        </button>
      </div>

      {/* Grid widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {widgets.map(wId => {
          if (wId === 'revenue_trend') {
            return (
              <div key={wId} className="glass-card p-6 rounded-2xl flex flex-col justify-between group relative animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold uppercase text-slate-400 font-display">Revenue Growth Trend</h3>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setDrilldownWidget('revenue_trend')}
                      className="text-slate-500 hover:text-slate-300 p-1 rounded" 
                      title="Drill Down Ledger"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeWidget(wId)} className="text-slate-500 hover:text-rose-450 p-1 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={REVENUE_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Area type="monotone" dataKey="Sales" stroke="#a855f7" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          }

          if (wId === 'expense_split') {
            return (
              <div key={wId} className="glass-card p-6 rounded-2xl flex flex-col justify-between group relative animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold uppercase text-slate-400 font-display">Sales vs Operating Cost</h3>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setDrilldownWidget('expense_split')}
                      className="text-slate-500 hover:text-slate-300 p-1 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeWidget(wId)} className="text-slate-500 hover:text-rose-450 p-1 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={REVENUE_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Bar dataKey="Expense" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          }

          if (wId === 'sla_metrics') {
            return (
              <div key={wId} className="glass-card p-6 rounded-2xl flex flex-col justify-between animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold uppercase text-slate-400 font-display">API Gateway Response Latency</h3>
                  <button onClick={() => removeWidget(wId)} className="text-slate-500 hover:text-rose-450 p-1 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center my-auto py-2">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">P95 LATENCY</span>
                    <span className="text-2xl font-bold font-mono text-emerald-450 mt-1 block">142ms</span>
                    <span className="text-[9px] text-slate-500 block mt-1">Target SLA &lt; 300ms</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">UPTIME RATE</span>
                    <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">99.98%</span>
                    <span className="text-[9px] text-slate-500 block mt-1">Target SLA 99.9%</span>
                  </div>
                </div>
              </div>
            );
          }

          if (wId === 'cash_position') {
            return (
              <div key={wId} className="glass-card p-6 rounded-2xl flex flex-col justify-between animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold uppercase text-slate-400 font-display">Liquidity Cash Position</h3>
                  <button onClick={() => removeWidget(wId)} className="text-slate-500 hover:text-rose-450 p-1 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 my-auto py-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Quick Acid Ratio</span>
                      <span className="font-mono text-slate-200">2.42x</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-900 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Cash-to-Liability Coverage</span>
                      <span className="font-mono text-slate-200">1.88x</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-900 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Drill-down ledger view overlay */}
      {drilldownWidget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card max-w-3xl w-full p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-lg font-display font-semibold text-slate-250">
                Drill-Down Analytics: Ledger Ledger References
              </h3>
              <button 
                onClick={() => setDrilldownWidget(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Close Drilldown
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Below are the accounting journal entries feeding into the active {drilldownWidget === 'revenue_trend' ? 'Sales Revenue Trend' : 'Operating Cost'} widgets.
            </p>

            <div className="max-h-60 overflow-y-auto border border-slate-900 rounded-xl">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="p-3">Tx ID</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Currency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-900/30">
                      <td className="p-3 text-slate-350">{t.id}</td>
                      <td className="p-3 text-slate-400">{t.description}</td>
                      <td className="p-3 text-emerald-400 font-semibold">${t.debits[0]?.amount}</td>
                      <td className="p-3 text-slate-400">{t.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
