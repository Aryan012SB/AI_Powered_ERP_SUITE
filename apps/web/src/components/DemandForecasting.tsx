import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, Sliders, Play, TrendingUp, Sparkles } from 'lucide-react';

export const DemandForecasting: React.FC = () => {
  const { logApiCall } = useErp();
  const [horizon, setHorizon] = useState<number>(90);
  const [seasonalityMode, setSeasonalityMode] = useState<'additive' | 'multiplicative'>('additive');
  const [epochs, setEpochs] = useState<number>(50);
  const [isTraining, setIsTraining] = useState(false);

  // Seed forecasting values
  const getForecastData = () => {
    const data = [];
    const baseSales = 2200;
    const startDate = new Date('2026-04-01');

    // Historical (60 days)
    for (let i = 0; i < 60; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const trend = 15 * i;
      const noise = Math.sin(i * 0.5) * 200 + (Math.random() * 100 - 50);
      data.push({
        date: date.toISOString().split('T')[0],
        Actuals: Math.round(baseSales + trend + noise),
        Prophet: null,
        LSTM: null,
        lowerBound: null,
        upperBound: null
      });
    }

    // Forecast Horizon
    
    const forecastStart = new Date(startDate);
    forecastStart.setDate(startDate.getDate() + 60);

    for (let i = 0; i < horizon; i++) {
      const date = new Date(forecastStart);
      date.setDate(forecastStart.getDate() + i);
      
      const trend = 15 * (60 + i);
      const seasonalityFactor = seasonalityMode === 'additive' ? 220 : 380;
      const wave = Math.sin((60 + i) * 0.5) * seasonalityFactor;
      
      // LSTM captures tighter volatility
      const lstmVal = Math.round(baseSales + trend + wave + (Math.sin(i * 0.9) * 50));
      // Prophet captures broader confidence bounds
      const prophetVal = Math.round(baseSales + trend + wave);
      
      const lower = Math.round(prophetVal - (150 + i * 2.5));
      const upper = Math.round(prophetVal + (150 + i * 2.5));

      data.push({
        date: date.toISOString().split('T')[0],
        Actuals: null,
        Prophet: prophetVal,
        LSTM: lstmVal,
        lowerBound: lower,
        upperBound: upper
      });
    }

    return data;
  };

  const data = getForecastData();

  const handleRetrain = () => {
    const start = performance.now();
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
      logApiCall('POST', '/api/v1/ml/forecast/retrain', 200, Math.round(performance.now() - start));
      alert(`ML Model Retrained successfully: \n- Prophet seasonality configured: ${seasonalityMode} \n- LSTM network epochs trained: ${epochs} \n- Final validation MAPE: 8.42%`);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Overview Header */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-400" /> AI Demand Forecasting Engine (F-06)
        </h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          Predict enterprise inventory demand and resource consumption. Combines additive time-series models (Prophet) with recurrent neural networks (LSTM) to capture seasonal trends and high-volatility shifts.
        </p>
      </div>

      {/* Forecasting Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Param Tuner */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-lg font-display font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" /> Hyperparameter Tuner
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-2">
                  Forecast Horizon ({horizon} Days)
                </label>
                <input 
                  type="range" 
                  min={30} 
                  max={120} 
                  step={30} 
                  value={horizon}
                  onChange={(e) => setHorizon(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>30D</span>
                  <span>60D</span>
                  <span>90D</span>
                  <span>120D</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-2">
                  LSTM Epochs Count ({epochs})
                </label>
                <input 
                  type="range" 
                  min={10} 
                  max={150} 
                  step={10} 
                  value={epochs}
                  onChange={(e) => setEpochs(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>10 Epochs</span>
                  <span>80</span>
                  <span>150 Epochs</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-2">
                  Prophet Seasonality Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSeasonalityMode('additive')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      seasonalityMode === 'additive' 
                        ? 'bg-purple-600/10 border-purple-500/30 text-purple-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Additive
                  </button>
                  <button
                    onClick={() => setSeasonalityMode('multiplicative')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      seasonalityMode === 'multiplicative' 
                        ? 'bg-purple-600/10 border-purple-500/30 text-purple-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Multiplicative
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleRetrain}
            disabled={isTraining}
            className={`w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 text-slate-100 font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-6 ${
              isTraining ? 'animate-pulse cursor-wait' : ''
            }`}
          >
            <Play className="w-4 h-4" /> {isTraining ? 'Training PyTorch Network...' : 'Retrain Forecast Models'}
          </button>
        </div>

        {/* Forecast Graph (Recharts) */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display font-semibold text-slate-250">90-Day Demand Trend Forecasting</h3>
              <span className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" /> Model Target SLA Met (MAPE &lt; 12%)
              </span>
            </div>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={['dataMin - 500', 'dataMax + 500']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  
                  {/* Historical */}
                  <Line type="monotone" dataKey="Actuals" name="Historical Sales" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                  
                  {/* Forecast Lines */}
                  <Line type="monotone" dataKey="Prophet" name="Prophet Predict" stroke="#c084fc" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="LSTM" name="LSTM Neural Net" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center mt-4 border-t border-slate-900 pt-4">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900">
              <span className="text-[9px] text-slate-500 block uppercase font-bold">LSTM Validation MAPE</span>
              <span className="text-lg font-bold font-mono text-emerald-400 block mt-1">8.42%</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900">
              <span className="text-[9px] text-slate-500 block uppercase font-bold">Prophet Validation MAPE</span>
              <span className="text-lg font-bold font-mono text-purple-400 block mt-1">10.15%</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900">
              <span className="text-[9px] text-slate-500 block uppercase font-bold">Training Duration</span>
              <span className="text-lg font-bold font-mono text-slate-200 block mt-1">1.82s</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900">
              <span className="text-[9px] text-slate-500 block uppercase font-bold">Model Engine Status</span>
              <span className="text-lg font-bold font-mono text-blue-400 block mt-1 flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 animate-bounce" /> Sync
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
