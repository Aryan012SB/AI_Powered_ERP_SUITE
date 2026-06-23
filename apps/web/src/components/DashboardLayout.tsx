import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { 
  AuthManager 
} from './AuthManager';
import { FinancialLedger } from './FinancialLedger';
import { APARAutomation } from './APARAutomation';
import { HRPayroll } from './HRPayroll';
import { SupplyChain } from './SupplyChain';
import { DemandForecasting } from './DemandForecasting';
import { ProjectManager } from './ProjectManager';
import { BusinessIntelligence } from './BusinessIntelligence';
import { AuditCompliance } from './AuditCompliance';
import { NotificationEngine } from './NotificationEngine';
import { ApiGateway } from './ApiGateway';

import { AuthForm } from './AuthForm';

import { 
  Building2, BarChart2, Coins, FileText, Users, 
  Package, Brain, Briefcase, ShieldAlert, Bell, Network,
  Wifi, WifiOff, ShieldCheck, Shield, ChevronDown, LogOut
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { activeTenant, tenants, setTenant, verifyAuditTrail, currentUser, logout } = useErp();
  const [activeTab, setActiveTab] = useState('bi');
  const [isOnline, setIsOnline] = useState(true);
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [isChainValid, setIsChainValid] = useState<boolean | null>(true);

  if (!currentUser) {
    return <AuthForm />;
  }

  // Tab items
  const allMenuItems = [
    { id: 'bi', name: 'Business Intelligence', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'ledger', name: 'General Ledger', icon: <Coins className="w-4 h-4" /> },
    { id: 'ap_ar', name: 'AP / AR Automation', icon: <FileText className="w-4 h-4" /> },
    { id: 'hr', name: 'HR & Payroll', icon: <Users className="w-4 h-4" /> },
    { id: 'supply', name: 'Supply Chain', icon: <Package className="w-4 h-4" /> },
    { id: 'forecasting', name: 'AI Demand Forecast', icon: <Brain className="w-4 h-4" /> },
    { id: 'projects', name: 'Project Tracking', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'audit', name: 'Audit & Compliance', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'notify', name: 'Notification logs', icon: <Bell className="w-4 h-4" /> },
    { id: 'gateway', name: 'API Gateway', icon: <Network className="w-4 h-4" /> },
    { id: 'auth', name: 'Identity & MFA', icon: <Shield className="w-4 h-4" /> },
  ];

  const menuItems = allMenuItems;

  const handleVerifyChain = async () => {
    setIsVerifyingChain(true);
    setTimeout(async () => {
      const ok = await verifyAuditTrail();
      setIsChainValid(ok);
      setIsVerifyingChain(false);
    }, 1000);
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'auth': return <AuthManager />;
      case 'ledger': return <FinancialLedger />;
      case 'ap_ar': return <APARAutomation />;
      case 'hr': return <HRPayroll />;
      case 'supply': return <SupplyChain />;
      case 'forecasting': return <DemandForecasting />;
      case 'projects': return <ProjectManager />;
      case 'bi': return <BusinessIntelligence />;
      case 'audit': return <AuditCompliance />;
      case 'notify': return <NotificationEngine />;
      case 'gateway': return <ApiGateway />;
      default: return <BusinessIntelligence />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/35 flex items-center justify-center font-display font-black text-purple-400">
              AMX
            </div>
            <div>
              <span className="text-sm font-semibold tracking-wider font-display block text-slate-200">Amdox ERP</span>
              <span className="text-[10px] text-purple-400 uppercase tracking-widest font-mono">AMX-ERP-2026</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-230px)]">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3.5 transition-all duration-150 ${
                  activeTab === item.id 
                    ? 'bg-purple-600/15 text-purple-300 border border-purple-500/25' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>
        {/* User Session Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center font-display font-semibold text-purple-400 text-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-200 block truncate">{currentUser.name}</span>
              <span className="text-[10px] text-slate-500 block truncate">{currentUser.email}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/25 bg-slate-950/40 hover:bg-rose-500/5 text-slate-400 hover:text-rose-450 text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> SIGN OUT
          </button>
        </div>

        {/* Group 4 Team Info Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="font-bold uppercase tracking-wider">Group 4 Team</span>
            <span className="font-mono text-purple-400">April 2026</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400">
            <span title="himanshudevatwal@gmail.com">Himanshu D.</span>
            <span title="rutveeb.15@gmail.com">Rutvee B.</span>
            <span title="rmpatidar98@gmail.com">Radhey M.</span>
            <span title="bitthaltejra2@gmail.com">Bitthal T.</span>
            <span title="112aryansolanki@gmail.com">Aryan S.</span>
          </div>

          <div className="text-[9px] text-center text-slate-500 border-t border-slate-900 pt-2 font-mono">
            SLA: 99.9% | Latency &lt; 300ms
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        {/* Header Ribbon */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/40 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-widest block font-bold">Workspace Context</span>
              <span className="text-sm font-semibold font-display text-slate-200">{activeTenant.name}</span>
            </div>
          </div>

          {/* Controls & Switchers */}
          <div className="flex items-center gap-3.5">
            {/* PWA Sync / Offline Simulator */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
                isOnline 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-450'
              }`}
              title="Toggle PWA Offline Caching Simulation (F-12)"
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>ONLINE (SYNC ACTIVE)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>OFFLINE (PWA CACHING)</span>
                </>
              )}
            </button>

            {/* Cryptographic Ledger Verify Badge */}
            <button
              onClick={handleVerifyChain}
              disabled={isVerifyingChain}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 transition ${
                isVerifyingChain ? 'bg-slate-800 border-slate-700 text-slate-500' :
                isChainValid === true ? 'bg-purple-600/15 border-purple-500/30 text-purple-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
              title="Click to check Ledger SHA-256 chain integrity"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isVerifyingChain ? 'VERIFYING...' : 'LEDGER SECURE'}</span>
            </button>

            {/* Tenant Selection Dropdown */}
            <div className="relative flex items-center">
              <select
                value={activeTenant.id}
                onChange={(e) => setTenant(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-350 focus:outline-none appearance-none cursor-pointer"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 pointer-events-none" />
            </div>
          </div>
        </header>

        {/* Dynamic Workspace Sheet */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
};
