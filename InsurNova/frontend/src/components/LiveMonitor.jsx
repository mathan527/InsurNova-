/**
 * LiveMonitor.jsx
 * Real-time system monitoring: scrolling logs, health pills, API latency.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { getMLHealth } from '../services/mlApi';

const MAX_LOGS = 60;

function HealthPill({ label, value, status }) {
  const color =
    status === 'ok'   ? 'var(--neon-green)' :
    status === 'warn' ? 'var(--neon-yellow)' :
                        'var(--neon-red)';

  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl" style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}30`,
      minWidth: 90,
    }}>
      <div className="text-xs font-mono font-bold" style={{ color }}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
    </div>
  );
}

export default function LiveMonitor({ externalLogs = [] }) {
  const [logs, setLogs] = useState([
    { type: 'info', msg: '[SYSTEM] InsurNova AI Platform initialized', ts: now() },
    { type: 'ai', msg: '[ML] Risk model loaded: Random Forest v2.1', ts: now() },
    { type: 'ai', msg: '[ML] Fraud model loaded: XGBoost v1.8', ts: now() },
    { type: 'info', msg: '[API] Listening on /predict/risk, /predict/fraud', ts: now() },
  ]);
  const [health, setHealth] = useState({ online: false, latencyMs: null, models: {} });
  const [activeClaims, setActiveClaims] = useState(0);
  const [eventsTriggered, setEventsTriggered] = useState(0);
  const [fraudAlerts, setFraudAlerts] = useState(0);
  const logRef = useRef(null);

  // Poll health
  useEffect(() => {
    async function checkHealth() {
      const h = await getMLHealth();
      setHealth(h);
      addLog(
        h.online ? 'info' : 'risk',
        h.online
          ? `[HEALTH] API online · latency ${h.latencyMs}ms`
          : `[HEALTH] ML API offline (${h.latencyMs}ms timeout)`
      );
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Ambient activity simulation
  useEffect(() => {
    const msgs = [
      { type: 'info', msg: '[EVENT] Weather sensor heartbeat received — Chennai' },
      { type: 'ai', msg: '[ML] Batch risk re-scoring complete — 247 policies updated' },
      { type: 'info', msg: '[API] GET /health → 200 OK' },
      { type: 'info', msg: '[DB] Claims index refreshed' },
      { type: 'ai', msg: '[ML] Fraud model inference queue: 0 pending' },
      { type: 'info', msg: '[EVENT] AQI sensor heartbeat — Bengaluru North' },
      { type: 'info', msg: '[API] Policy eligibility check passed for user #3847' },
    ];
    let i = 0;
    const interval = setInterval(() => {
      addLog(msgs[i % msgs.length].type, msgs[i % msgs.length].msg);
      i++;
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // External logs from simulation
  useEffect(() => {
    if (!externalLogs || externalLogs.length === 0) return;
    const last = externalLogs[externalLogs.length - 1];
    if (last) {
      addLog(last.type, last.msg);
      if (last.type === 'success') setEventsTriggered(n => n + 1);
      if (last.type === 'fraud') setFraudAlerts(n => n + 1);
      if (last.msg?.includes('claim')) setActiveClaims(n => n + 1);
    }
  }, [externalLogs.length]);

  // Auto-scroll
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = useCallback((type, msg) => {
    setLogs(prev => {
      const newLog = { type, msg, ts: now() };
      const updated = [...prev, newLog];
      return updated.slice(-MAX_LOGS);
    });
  }, []);

  const latencyStatus =
    !health.online ? 'error' :
    health.latencyMs < 200 ? 'ok' :
    health.latencyMs < 500 ? 'warn' : 'error';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {health.online ? <div className="live-dot" /> : <div className="live-dot-red" />}
          <span className="section-title mb-0">📡 System Monitoring</span>
        </div>
        <span className={`badge ${health.online ? 'badge-success' : 'badge-danger'}`}>
          {health.online ? '🟢 ONLINE' : '🔴 OFFLINE'}
        </span>
      </div>

      {/* Health pills row */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-4">
        <HealthPill
          label="API Latency"
          value={health.latencyMs ? `${health.latencyMs}ms` : '—'}
          status={latencyStatus}
        />
        <HealthPill
          label="Active Claims"
          value={activeClaims}
          status={activeClaims < 5 ? 'ok' : activeClaims < 10 ? 'warn' : 'error'}
        />
        <HealthPill
          label="Events Triggered"
          value={eventsTriggered}
          status="ok"
        />
        <HealthPill
          label="Fraud Alerts"
          value={fraudAlerts}
          status={fraudAlerts === 0 ? 'ok' : fraudAlerts < 3 ? 'warn' : 'error'}
        />
      </div>

      {/* Model status row */}
      {health.online && health.models && Object.keys(health.models).length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {Object.entries(health.models).map(([name, modelObj]) => {
            const statusStr = typeof modelObj === 'object' ? (modelObj?.status ?? 'unknown') : String(modelObj);
            const isLoaded  = statusStr === 'loaded';
            return (
              <span key={name} className={`badge text-xs ${isLoaded ? 'badge-success' : 'badge-gray'}`}>
                {name}: {isLoaded ? '✓ loaded' : statusStr}
              </span>
            );
          })}
        </div>
      )}

      {/* Live log feed */}
      <div
        ref={logRef}
        className="rounded-xl overflow-y-auto space-y-1 p-3"
        style={{
          height: 220,
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
  );
}

function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}
