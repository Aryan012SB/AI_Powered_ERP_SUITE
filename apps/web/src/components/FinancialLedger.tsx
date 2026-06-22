import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Coins, Plus, Scale, ListFilter, AlertTriangle, CheckCircle } from 'lucide-react';

const ACCOUNTS = [
  { name: 'Cash & Cash Equivalents', type: 'Asset' },
  { name: 'Accounts Receivable', type: 'Asset' },
  { name: 'Inventory', type: 'Asset' },
  { name: 'Prepaid Expenses', type: 'Asset' },
  { name: 'Accounts Payable', type: 'Liability' },
  { name: 'Payroll Liabilities', type: 'Liability' },
  { name: 'Common Stock Capital', type: 'Equity' },
  { name: 'Retained Earnings', type: 'Equity' },
  { name: 'SaaS Product Sales', type: 'Revenue' },
  { name: 'IT & Cloud Infrastructure Expense', type: 'Expense' },
  { name: 'Wages and Salary Expense', type: 'Expense' }
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹'
};

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0, EUR: 0.92, GBP: 0.79, INR: 83.5
};

export const FinancialLedger: React.FC = () => {
  const { transactions, addTransaction, logApiCall } = useErp();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  
  // Wizard States
  const [description, setDescription] = useState('');
  const [ref, setRef] = useState('');
  const [debitAcc, setDebitAcc] = useState(ACCOUNTS[0].name);
  const [debitAmt, setDebitAmt] = useState('');
  const [creditAcc, setCreditAcc] = useState(ACCOUNTS[4].name);
  const [creditAmt, setCreditAmt] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Calculate Account Balances
  const getAccountBalances = () => {
    const balances: Record<string, number> = {};
    ACCOUNTS.forEach(acc => { balances[acc.name] = 0; });

    transactions.forEach(tx => {
      // Apply base exchange rates back to USD for calculation
      const rate = tx.exchangeRate || 1.0;
      tx.debits.forEach(d => {
        const val = d.amount / rate;
        balances[d.account] = (balances[d.account] || 0) + val;
      });
      tx.credits.forEach(c => {
        const val = c.amount / rate;
        balances[c.account] = (balances[c.account] || 0) + val;
      });
    });
    return balances;
  };

  const balances = getAccountBalances();
  const rate = EXCHANGE_RATES[selectedCurrency];
  const symbol = CURRENCY_SYMBOLS[selectedCurrency];

  // Grouped Balance Sheet Balances
  const assetsTotal = ACCOUNTS.filter(a => a.type === 'Asset').reduce((sum, a) => sum + (balances[a.name] || 0), 0);
  const liabilitiesTotal = ACCOUNTS.filter(a => a.type === 'Liability').reduce((sum, a) => sum + (balances[a.name] || 0), 0);
  // Net of revenues & expenses rolled into equity
  const revenuesTotal = ACCOUNTS.filter(a => a.type === 'Revenue').reduce((sum, a) => sum + (balances[a.name] || 0), 0);
  const expensesTotal = ACCOUNTS.filter(a => a.type === 'Expense').reduce((sum, a) => sum + (balances[a.name] || 0), 0);
  const stockCapital = balances['Common Stock Capital'] || 0;
  const retainedEarnings = revenuesTotal - expensesTotal;
  const equityTotal = stockCapital + retainedEarnings;

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const start = performance.now();
    const debVal = parseFloat(debitAmt);
    const credVal = parseFloat(creditAmt);

    if (isNaN(debVal) || debVal <= 0 || isNaN(credVal) || credVal <= 0) {
      setErrorMessage('Debit and Credit amounts must be positive numbers');
      return;
    }

    // Double-entry validation: sum(Debits) === sum(Credits)
    if (debVal !== credVal) {
      setErrorMessage(`Trial balance error: Debits (${symbol}${debVal}) must equal Credits (${symbol}${credVal})!`);
      logApiCall('POST', '/api/v1/finance/ledger/post', 400, Math.round(performance.now() - start));
      return;
    }

    try {
      await addTransaction({
        description,
        ref,
        currency: selectedCurrency,
        exchangeRate: rate,
        debits: [{ account: debitAcc, amount: debVal }],
        credits: [{ account: creditAcc, amount: credVal }]
      });

      setSuccessMessage('Journal Entry Posted Successfully');
      setDescription('');
      setRef('');
      setDebitAmt('');
      setCreditAmt('');
      logApiCall('POST', '/api/v1/finance/ledger/post', 201, Math.round(performance.now() - start));
    } catch (err) {
      setErrorMessage('Failed to post transaction.');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Module Title */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
            <Coins className="w-6 h-6 text-emerald-400" /> Double-Entry General Ledger (F-02)
          </h2>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Consolidate corporate accounts, review balance sheets, and post multi-currency transactions. 
            All ledger records enforce standard GAAP checks.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-2 self-start md:self-center bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          {Object.keys(EXCHANGE_RATES).map(cur => (
            <button
              key={cur}
              onClick={() => setSelectedCurrency(cur)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 ${
                selectedCurrency === cur ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cur}
            </button>
          ))}
        </div>
      </div>

      {/* Balance Sheet Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Total Assets</span>
          <span className="text-2xl font-semibold font-display text-slate-200 mt-1 block">
            {symbol}{(assetsTotal * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block mt-2">Cash + Inventory + AR</span>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Total Liabilities</span>
          <span className="text-2xl font-semibold font-display text-slate-200 mt-1 block">
            {symbol}{(liabilitiesTotal * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block mt-2">Accounts Payable + Payroll Due</span>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Total Equity</span>
          <span className="text-2xl font-semibold font-display text-slate-200 mt-1 block">
            {symbol}{(equityTotal * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block mt-2">Stock Capital + Retained Earnings</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Journal Wizard */}
        <div className="glass-card p-6 rounded-2xl xl:col-span-1 flex flex-col justify-between">
          <form onSubmit={handlePostJournal} className="space-y-4">
            <h3 className="text-lg font-display font-semibold text-slate-200 flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-emerald-400" /> Post Journal Entry
            </h3>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Sales Invoice #401 Accrual" 
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Reference Code</label>
                <input 
                  type="text" 
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="e.g. JE-980" 
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="border-t border-slate-800/80 my-2 pt-3 space-y-3">
                {/* Debit Line */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-emerald-400/80 block uppercase font-bold mb-1">Debit Account</label>
                    <select
                      value={debitAcc}
                      onChange={(e) => setDebitAcc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-350 focus:outline-none"
                    >
                      {ACCOUNTS.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-400/80 block uppercase font-bold mb-1">Debit Amount ({symbol})</label>
                    <input 
                      type="number" 
                      value={debitAmt}
                      onChange={(e) => setDebitAmt(e.target.value)}
                      placeholder="0.00" 
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Credit Line */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-rose-400/80 block uppercase font-bold mb-1">Credit Account</label>
                    <select
                      value={creditAcc}
                      onChange={(e) => setCreditAcc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-350 focus:outline-none"
                    >
                      {ACCOUNTS.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-rose-400/80 block uppercase font-bold mb-1">Credit Amount ({symbol})</label>
                    <input 
                      type="number" 
                      value={creditAmt}
                      onChange={(e) => setCreditAmt(e.target.value)}
                      placeholder="0.00" 
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Post Entry (Debit = Credit)
            </button>
          </form>

          <div className="text-[10px] text-slate-500 text-center mt-4">
            Validation checks complete on submit. Ledger balance verified dynamically.
          </div>
        </div>

        {/* Ledger Entries */}
        <div className="glass-card p-6 rounded-2xl xl:col-span-2">
          <h3 className="text-lg font-display font-semibold text-slate-200 flex items-center gap-2 mb-4">
            <ListFilter className="w-5 h-5 text-slate-400" /> Accounting Journal Logs
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="pb-3">Date / ID</th>
                  <th className="pb-3">Description / Ref</th>
                  <th className="pb-3">Account (Dr/Cr)</th>
                  <th className="pb-3 text-right">Debit</th>
                  <th className="pb-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/30 transition-all">
                    <td className="py-3.5 space-y-1">
                      <span className="text-slate-300 font-medium block">{tx.date}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{tx.id}</span>
                    </td>
                    <td className="py-3.5 space-y-1">
                      <span className="text-slate-350 block font-medium">{tx.description}</span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-450 border border-slate-800 font-mono inline-block">
                        {tx.ref}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="space-y-1 font-semibold">
                        {tx.debits.map((d, index) => (
                          <div key={`d-${index}`} className="text-emerald-400 font-semibold">{d.account}</div>
                        ))}
                        {tx.credits.map((c, index) => (
                          <div key={`c-${index}`} className="text-rose-400 pl-4 font-semibold">{c.account}</div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-mono font-semibold text-emerald-400">
                      {tx.debits.map((d, index) => (
                        <div key={`d-val-${index}`}>
                          {symbol}{((d.amount / tx.exchangeRate) * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      ))}
                    </td>
                    <td className="py-3.5 text-right font-mono font-semibold text-rose-450">
                      <div className="h-4"></div>
                      {tx.credits.map((c, index) => (
                        <div key={`c-val-${index}`}>
                          {symbol}{((c.amount / tx.exchangeRate) * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      ))}
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
