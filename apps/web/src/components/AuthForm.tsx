import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Lock, Mail, User, Building2, LogIn, UserPlus } from 'lucide-react';

export const AuthForm: React.FC = () => {
  const { login, register, tenants } = useErp();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [tenantId, setTenantId] = useState(tenants[0].id);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegister && (!name || !tenantId))) {
      alert('Please fill out all fields.');
      return;
    }

    setIsLoading(true);
    if (isRegister) {
      const ok = await register(name, email, password, tenantId);
      if (ok) {
        alert('Account created successfully! You can now log in.');
        setIsRegister(false);
        setPassword('');
      }
    } else {
      await login(email, password);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden font-sans select-none">
      {/* Background decoration elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px]" />

      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative z-10 space-y-6 animate-slide-up">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/35 flex items-center justify-center font-display font-black text-2xl text-purple-400 mx-auto shadow-inner">
            AMX
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-100 tracking-tight">AMX-ERP Portal</h1>
            <p className="text-xs text-slate-400">AI-Powered Cloud Enterprise Resource Suite</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/80 rounded-2xl border border-slate-850">
          <button
            onClick={() => { setIsRegister(false); setPassword(''); }}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              !isRegister 
                ? 'bg-purple-600/15 text-purple-300 border border-purple-500/20 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            onClick={() => { setIsRegister(true); setPassword(''); }}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              isRegister 
                ? 'bg-purple-600/15 text-purple-300 border border-purple-500/20 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Full Name</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                required
              />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Tenant Assignment</label>
              <div className="relative flex items-center">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl pl-11 pr-8 py-3 text-sm text-slate-250 focus:outline-none focus:border-purple-500 transition appearance-none cursor-pointer"
                  required
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 text-slate-100 font-semibold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-purple-600/10 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        {!isRegister && (
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850 text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Standard Demo Account</span>
            <span className="text-xs text-slate-350 block font-mono">admin@amdox.io / password</span>
          </div>
        )}

        <div className="text-center text-[10px] text-slate-650 font-mono">
          Secure Level-3 Assurance | End-to-End Cryptography
        </div>
      </div>
    </div>
  );
};
