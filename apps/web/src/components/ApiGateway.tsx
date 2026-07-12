import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Network, Send, Key, Database, RefreshCw, Terminal } from 'lucide-react';

const REST_ENDPOINTS = [
  { path: 'GET /api/v1/finance/ledger/accounts', desc: 'List ledger accounts and balances', defaultResponse: { status: 200, body: { accounts: ['Cash & Cash Equivalents', 'Accounts Receivable', 'Accounts Payable', 'Common Stock Capital'], baseCurrency: 'USD' } } },
  { path: 'POST /api/v1/finance/ap/ocr-ingest', desc: 'Ingest invoice file to trigger OCR', defaultResponse: { status: 202, body: { status: 'Ingested', jobId: 'job-9872a', ocrModel: 'LayoutLMv3-v1.4' } } },
  { path: 'POST /api/v1/ml/forecast/predict', desc: 'Fetch demand forecasting Linear Regression values', defaultResponse: { status: 200, body: { model: 'Linear Regression (OLS)', forecastHorizonDays: 90, MAPE: '4.25%', predictions: [ { date: '2026-06-22', demand: 2850 }, { date: '2026-06-23', demand: 2890 } ] } } },
  { path: 'GET /api/v1/compliance/audit/logs', desc: 'Get SHA-256 hash-chained audit logs', defaultResponse: { status: 200, body: { totalLogs: 3, verificationStatus: 'SECURE_CC7.2', hashChainRoot: 'k_R2390a-Z2f_891eFJKW9A7B6C5D4e3f2g1h0i' } } }
];

export const ApiGateway: React.FC = () => {
  const { apiHistory, logApiCall } = useErp();
  const [selectedRestIndex, setSelectedRestIndex] = useState(0);
  const [restResponse, setRestResponse] = useState<any>(null);
  const [isRestLoading, setIsRestLoading] = useState(false);

  // GraphQL
  const [gqlQuery, setGqlQuery] = useState(`query GetTenantDetails {
  tenant(id: "t-amdox") {
    name
    provider
    domain
    mfaEnabled
  }
}`);
  const [gqlResponse, setGqlResponse] = useState<any>(null);
  const [isGqlLoading, setIsGqlLoading] = useState(false);

  const handleRestSend = () => {
    const start = performance.now();
    setIsRestLoading(true);
    setRestResponse(null);

    const ep = REST_ENDPOINTS[selectedRestIndex];
    const [method, url] = ep.path.split(' ');

    setTimeout(() => {
      const duration = Math.round(performance.now() - start);
      setRestResponse(ep.defaultResponse);
      setIsRestLoading(false);
      logApiCall(method, url, ep.defaultResponse.status, duration);
    }, 600);
  };

  const handleGqlSend = () => {
    const start = performance.now();
    setIsGqlLoading(true);
    setGqlResponse(null);

    setTimeout(() => {
      const duration = Math.round(performance.now() - start);
      const res = {
        data: {
          tenant: {
            name: "Amdox Technologies",
            provider: "Keycloak 25.0",
            domain: "amdox.io",
            mfaEnabled: true
          }
        }
      };
      setGqlResponse(res);
      setIsGqlLoading(false);
      logApiCall('POST', '/graphql', 200, duration);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Overview */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
          <Network className="w-6 h-6 text-purple-400" /> API Gateway Console (F-11)
        </h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          The API Gateway orchestrates incoming traffic, validates JWT identity claims, controls rate limiting, and forwards endpoints. Read the REST API Swagger Docs or run queries in the GraphQL client below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Swagger REST Playground */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-lg font-display font-semibold text-slate-200 flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-purple-400" /> Swagger REST OpenAPI Sandbox
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Target Endpoint</label>
                <select
                  value={selectedRestIndex}
                  onChange={(e) => setSelectedRestIndex(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:outline-none"
                >
                  {REST_ENDPOINTS.map((ep, idx) => (
                    <option key={idx} value={idx}>{ep.path} ({ep.desc})</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Authorization Header</span>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 font-mono text-[9px] text-slate-400 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS1hbWRveC0yMDI2LXYxIn0...</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500 block">Response JSON</span>
                  {isRestLoading && <span className="text-[9px] text-purple-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Transmitting...</span>}
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 font-mono text-[10px] h-32 overflow-y-auto text-emerald-400">
                  {restResponse ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(restResponse, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-650 italic">Execute endpoint to fetch payload details...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleRestSend}
            disabled={isRestLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-slate-100 font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" /> Send REST Request
          </button>
        </div>

        {/* GraphQL Apollo Playground */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-lg font-display font-semibold text-slate-200 flex items-center gap-2 mb-2">
              <Terminal className="w-5 h-5 text-purple-400" /> Apollo GraphQL Playground
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Query Editor</label>
                <textarea
                  value={gqlQuery}
                  onChange={(e) => setGqlQuery(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[9px] text-purple-300 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-500 block">Response Output</label>
                  {isGqlLoading && <span className="text-[9px] text-purple-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Querying...</span>}
                </div>
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[9px] h-44 overflow-y-auto text-emerald-400">
                  {gqlResponse ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(gqlResponse, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-650 italic">Execute GraphQL query to fetch payload details...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGqlSend}
            disabled={isGqlLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-slate-100 font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" /> Execute GraphQL Query
          </button>
        </div>
      </div>

      {/* Network Traffic Inspector */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-display font-semibold text-slate-200 mb-4">Live API Network Traffic Inspector</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-bold">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Request URL / Resource</th>
                <th className="pb-3">Response Status</th>
                <th className="pb-3 text-right">Server Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
              {apiHistory.length > 0 ? (
                apiHistory.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-900/30 transition-all">
                    <td className="py-3.5 text-slate-400">{log.timestamp}</td>
                    <td className="py-3.5 font-bold">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] border ${
                        log.method === 'POST' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                        log.method === 'GET' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        'bg-slate-800 border-slate-750 text-slate-400'
                      }`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-300">{log.url}</td>
                    <td className="py-3.5">
                      <span className={`font-bold ${log.status >= 200 && log.status < 300 ? 'text-emerald-400' : 'text-rose-450'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className={`py-3.5 text-right font-semibold ${log.duration > 300 ? 'text-rose-400' : 'text-emerald-450'}`}>
                      {log.duration}ms
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 italic">No network traffic detected yet. Run endpoints to populate logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
