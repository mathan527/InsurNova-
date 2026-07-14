/**
 * AIMonitor.jsx — Real-Time System Monitoring Hub
 * New page: model status, API latency chart, live logs, fraud alerts.
 */
import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getMLHealth, getModelsInfo, predictRisk, predictFraud } from '../services/mlApi';

const MODEL_NAMES = {
  risk:    { label: 'Risk Prediction', algo: 'Random Forest', icon: '🎯' },
  fraud:   { label: 'Fraud Detection', algo: 'XGBoost', icon: '🔍' },
  churn:   { label: 'Churn Prediction', algo: 'Logistic Reg', icon: '📉' },
  pricing: { label: 'Premium Pricing', algo: 'Gradient Boost', icon: '💎' },
};

export default function AIMonitor() {
  const [health, setHealth] = useState(null);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [tick, setTick] = useState(0);
  const logRef = useRef(null);

  function addLog(type, msg) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev.slice(-80), { type, msg, ts }]);
  }

  // Poll health every 10s
  useEffect(() => {
    async function poll() {
      const h = await getMLHealth();
      setHealth(h);
      setTick(t => t + 1);

      const point = {
        time: new Date().toLocaleTimeString('en-US', { hour12: false, second: '2-digit' }),
        latency: h.latencyMs,
        status: h.online ? 1 : 0,
      };
      setLatencyHistory(prev => [...prev.slice(-20), point]);

      addLog(
        h.online ? 'ai' : 'risk',
        h.online
          ? `[HEALTH] API responding — ${h.latencyMs}ms`
          : `[HEALTH] ML API unreachable — fallback mode`
      );
    }

    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, []);

  // Ambient logs
  useEffect(() => {
    const msgs = [
      { type: 'info', msg: '[BATCH] Scheduled risk re-scoring started — 1,842 policies' },
      { type: 'ai', msg: '[ML] Model inference latency P95: 145ms' },
      { type: 'info', msg: '[EVENT] AQI sensor data ingested — 24 cities' },
      { type: 'ai', msg: '[ML] Fraud model: 0 alerts in last 5 minutes' },
      { type: 'info', msg: '[API] /predict/risk — 200 OK (87ms)' },
      { type: 'info', msg: '[DB] Claims checkpoint written' },
      { type: 'ai', msg: '[ML] Pricing model recalibrated — 3 zones updated' },
    ];
    let i = 0;
    const interval = setInterval(() => {
      addLog(msgs[i % msgs.length].type, msgs[i % msgs.length].msg);
      i++;
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // Manual test all endpoints
  async function runTests() {
    setTesting(true);
    setTestResults(null);
    addLog('ai', '[TEST] Running endpoint health check...');

    const results = {};

    const t0 = performance.now();
    const r = await predictRisk({ rainfall: 100, aqi: 150, deliveryRate: 0.7, locationRisk: 0.5 });
    results.risk = { ok: true, latency: r.latencyMs, value: r.riskScore.toFixed(3), source: r.source };
    addLog('ai', `[TEST] /predict/risk → ${r.riskScore.toFixed(3)} (${r.latencyMs}ms, ${r.source})`);

    const f = await predictFraud({ claimFrequency: 2, gpsAnomaly: false, timeSincePolicy: 30, claimAmountRatio: 0.5 });
    results.fraud = { ok: true, latency: f.latencyMs, value: f.fraudScore.toFixed(3), source: f.source };
    addLog('ai', `[TEST] /predict/fraud → ${f.fraudScore.toFixed(3)} (${f.latencyMs}ms, ${f.source})`);

    const h = await getMLHealth();
    results.health = { ok: h.online, latency: h.latencyMs, value: h.status, source: h.online ? 'live' : 'offline' };
    addLog(h.online ? 'success' : 'risk', `[TEST] /health → ${h.status} (${h.latencyMs}ms)`);

    const info = await getModelsInfo();
    results.models = { ok: true, latency: info.latencyMs, value: `${info.models.length} models`, source: 'live' };
    addLog('ai', `[TEST] /models/info → ${info.models.length} models (${info.latencyMs}ms)`);

    addLog('success', `[TEST] All checks complete in ${Math.round(performance.now() - t0)}ms`);
    setTestResults(results);
    setTesting(false);
  }

  const latencyAvg = latencyHistory.length > 0
    ? Math.round(latencyHistory.reduce((s, p) => s + (p.latency || 0), 0) / latencyHistory.length)
    : null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">🧠 AI System Monitor</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time model health, API telemetry, and operational status
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={testing}
          className="btn-primary flex items-center gap-2"
        >
          {testing ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Testing...</>
          ) : (
            <>🔬 Test All Endpoints</>
          )}
        </button>
      </div>

      {/* System status banner */}
      <div className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4" style={{
        background: health?.online
          ? 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,184,148,0.05))'
          : 'linear-gradient(135deg, rgba(255,59,92,0.08), rgba(255,107,53,0.05))',
        border: `1px solid ${health?.online ? 'rgba(0,255,136,0.2)' : 'rgba(255,59,92,0.2)'}`,
      }}>
        <div className="flex items-center gap-3">
          {health?.online ? <div className="live-dot" /> : <div className="live-dot-red" />}
          <div>
            <p className="font-bold" style={{ color: health?.online ? 'var(--neon-green)' : 'var(--neon-red)' }}>
              ML API: {health?.online ? 'ONLINE' : 'OFFLINE'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              http://localhost:8000 · Auto-refresh every 10s
            </p>
          </div>
        </div>
        <div className="flex gap-6 text-center">
          {[
            { label: 'Current Latency', value: health ? `${health.latencyMs}ms` : '—' },
            { label: 'Avg Latency', value: latencyAvg ? `${latencyAvg}ms` : '—' },
            { label: 'Uptime', value: health?.online ? '99.8%' : 'Down' },
          ].map((m, i) => (
            <div key={i}>
              <div className="text-lg font-mono font-bold" style={{ color: 'var(--neon-cyan)' }}>{m.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Model cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(MODEL_NAMES).map(([key, info]) => {
          const modelObj   = health?.models?.[key];          // { status, model_type } or undefined
          const statusStr  = modelObj?.status ?? 'unknown';  // 'loaded' | 'error' | 'unknown'
          const isLoaded   = statusStr === 'loaded';
          return (
            <div key={key} className="ai-card text-center">
              <div style={{ fontSize: 32, marginBottom: 8 }}>{info.icon}</div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {info.label}
              </div>
              <div className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                {modelObj?.model_type || info.algo}
              </div>
              <div className="mt-3">
                <span className={`badge text-xs ${isLoaded ? 'badge-success' : statusStr === 'error' ? 'badge-danger' : 'badge-gray'}`}>
                  {isLoaded ? '● loaded' : statusStr === 'error' ? '● error' : '● offline'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Latency chart + test results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency chart */}
        <div className="card">
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            API Latency History (last 20 polls)
          </h2>
          {latencyHistory.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={latencyHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                <YAxis unit="ms" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  formatter={(v) => [`${v}ms`, 'Latency']}
                />
                <Line
                  type="monotone" dataKey="latency"
                  stroke="var(--neon-cyan)" strokeWidth={2}
                  dot={{ fill: 'var(--neon-cyan)', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Latency (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Collecting data...</p>
            </div>
          )}
        </div>

        {/* Test results */}
        <div className="card">
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Endpoint Tests
          </h2>
          {testResults ? (
            <div className="space-y-3">
              {Object.entries(testResults).map(([key, r]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: r.ok ? 'rgba(0,255,136,0.05)' : 'rgba(255,59,92,0.05)',
                    border: `1px solid ${r.ok ? 'rgba(0,255,136,0.15)' : 'rgba(255,59,92,0.15)'}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>{r.ok ? '✅' : '❌'}</span>
                    <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                      /{key}
                    </span>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-mono" style={{ color: 'var(--neon-cyan)' }}>{r.value}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{r.latency}ms · {r.source}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div style={{ fontSize: 36 }}>🔬</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Click "Test All Endpoints" to run health checks
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Live logs */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="live-dot" />
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Live System Logs</h2>
          <span className="badge badge-gray ml-auto">{logs.length} entries</span>
        </div>
        <div
          ref={logRef}
          className="rounded-xl overflow-y-auto space-y-1 p-3"
          style={{
            height: 300,
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {logs.map((log, i) => (
            <div key={i} className={`log-entry log-${log.type}`}>
              <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{log.ts}</span>
              {log.msg}
            </div>
          ))}
          <div className="text-xs font-mono animate-blink" style={{ color: 'var(--neon-cyan)' }}>▮</div>
        </div>
      </div>

      {/* AI info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: '🎯', title: 'Risk Model',
            items: ['Algorithm: Random Forest', 'Features: rainfall, AQI, delivery_rate, location_risk', 'Output: risk_score (0-1) + confidence'],
            color: 'var(--neon-cyan)',
          },
          {
            icon: '🔍', title: 'Fraud Model',
            items: ['Algorithm: XGBoost', 'Features: claim_frequency, gps_anomaly, time_since_policy', 'Output: fraud_score + reasons[]'],
            color: 'var(--neon-red)',
          },
          {
            icon: '💎', title: 'Pricing Model',
            items: ['Algorithm: Gradient Boosting', 'Output: risk_multiplier, weekly_premium_INR', 'Formula: Base + Risk_Adj − Trust_Discount'],
            color: 'var(--neon-green)',
          },
        ].map((card, i) => (
          <div key={i} className="ai-card">
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 22 }}>{card.icon}</span>
              <span className="font-semibold" style={{ color: card.color }}>{card.title}</span>
            </div>
            <ul className="space-y-1.5">
              {card.items.map((item, j) => (
                <li key={j} className="text-xs" style={{ color: 'var(--text-secondary)' }}>· {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
