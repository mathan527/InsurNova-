/**
 * AIVisibilityPanel.jsx
 * The show-stopping panel that proves real AI is running.
 * Calls /predict/risk live, displays model name, confidence, latency badge.
 */
import { useState, useEffect, useCallback } from 'react';
import { predictRisk } from '../services/mlApi';

const REFRESH_INTERVAL = 30000; // 30s auto-refresh

function ScoreRing({ score, color }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score);

  const strokeColor =
    score < 0.4 ? 'var(--neon-green)' :
    score < 0.7 ? 'var(--neon-yellow)' :
                  'var(--neon-red)';

  return (
    <svg width="120" height="120" viewBox="0 0 100 100" className="shrink-0">
      <circle className="score-ring-track" cx="50" cy="50" r={radius} />
      <circle
        className="score-ring-fill"
        cx="50" cy="50" r={radius}
        stroke={strokeColor}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.5s' }}
      />
      <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="bold" fill={strokeColor} fontFamily="JetBrains Mono">
        {(score * 100).toFixed(0)}
      </text>
      <text x="50" y="60" textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="Inter">
        RISK SCORE
      </text>
    </svg>
  );
}

function FeatureBar({ label, value, max, unit }) {
  const pct = Math.min(100, (value / max) * 100);
  const color =
    pct > 75 ? 'var(--neon-red)' :
    pct > 45 ? 'var(--neon-yellow)' :
               'var(--neon-cyan)';

  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="feature-bar-label">{label}</span>
        <span className="feature-bar-value">{value}{unit}</span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    </div>
  );
}

export default function AIVisibilityPanel({ features = {} }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const effectiveFeatures = {
    rainfall: features.rainfall ?? 80,
    aqi: features.aqi ?? 120,
    deliveryRate: features.deliveryRate ?? 0.75,
    locationRisk: features.locationRisk ?? 0.5,
    temperature: features.temperature ?? 28,
    windSpeed: features.windSpeed ?? 15,
    humidity: features.humidity ?? 65,
    ...features,
  };

  const runPrediction = useCallback(async () => {
    setLoading(true);
    const res = await predictRisk(effectiveFeatures);
    setResult(res);
    setLastUpdated(Date.now());
    setElapsed(0);
    setLoading(false);
  }, [JSON.stringify(effectiveFeatures)]);

  // Auto-refresh
  useEffect(() => {
    runPrediction();
    const interval = setInterval(runPrediction, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [runPrediction]);

  // Elapsed counter
  useEffect(() => {
    if (!lastUpdated) return;
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  const riskLabel =
    !result ? 'Calculating...' :
    result.riskScore < 0.4 ? 'LOW' :
    result.riskScore < 0.7 ? 'MEDIUM' : 'HIGH';

  const riskColor =
    !result ? 'var(--text-muted)' :
    result.riskScore < 0.4 ? 'var(--neon-green)' :
    result.riskScore < 0.7 ? 'var(--neon-yellow)' :
                             'var(--neon-red)';

  return (
    <div className="ai-card animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <span className="section-title mb-0">🧠 AI Risk Prediction</span>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{
                background: 'rgba(0,0,0,0.3)',
                color: result.latencyMs < 200 ? 'var(--neon-green)' :
                       result.latencyMs < 800 ? 'var(--neon-yellow)' : 'var(--neon-red)',
              }}
            >
              {result.latencyMs}ms
            </span>
          )}
          <span className={`badge ${result?.source === 'live' ? 'badge-info' : 'badge-gray'}`}>
            {result?.source === 'live' ? '🟢 LIVE API' : '🟡 FALLBACK'}
          </span>
          <button
            onClick={runPrediction}
            disabled={loading}
            className="btn-ghost text-xs px-2 py-1"
          >
            {loading ? '⟳' : '↻'} Refresh
          </button>
        </div>
      </div>

      {/* Score + Features row */}
      <div className="flex gap-6 items-start">
        {/* Ring gauge */}
        <div className="relative flex flex-col items-center">
          {loading ? (
            <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center" style={{ border: '2px solid var(--glass-border)' }}>
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ScoreRing score={result?.riskScore ?? 0.5} />
          )}
          <div className="mt-2 text-center">
            <div className="text-lg font-bold font-mono" style={{ color: riskColor }}>
              {riskLabel}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {result ? `${(result.confidence * 100).toFixed(0)}% confidence` : '—'}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="flex-1 min-w-0">
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Input Features →
          </p>
          <FeatureBar label="Rainfall" value={effectiveFeatures.rainfall} max={400} unit="mm" />
          <FeatureBar label="AQI" value={effectiveFeatures.aqi} max={500} unit="" />
          <FeatureBar label="Location Risk" value={Math.round(effectiveFeatures.locationRisk * 100)} max={100} unit="%" />
          <FeatureBar label="Humidity" value={effectiveFeatures.humidity} max={100} unit="%" />
        </div>
      </div>

      {/* Model info row */}
      <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>
            🤖 Model: <span className="font-semibold" style={{ color: 'var(--neon-cyan)' }}>{result?.modelName || '—'}</span>
          </span>
          <span>
            📡 Endpoint: <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>/predict/risk</span>
          </span>
          {result?.riskScore !== undefined && (
            <span>
              📊 Raw Score: <span className="font-mono" style={{ color: 'var(--neon-cyan)' }}>{result.riskScore.toFixed(4)}</span>
            </span>
          )}
          {lastUpdated && (
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
              Updated {elapsed}s ago
            </span>
          )}
        </div>

        {/* Raw JSON preview */}
        {result?.rawResponse && (
          <details className="mt-3">
            <summary className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              View raw API response ↓
            </summary>
            <pre className="mt-2 text-xs p-3 rounded-lg overflow-x-auto" style={{
              background: 'rgba(0,0,0,0.4)',
              color: 'var(--neon-cyan)',
              fontFamily: 'JetBrains Mono, monospace',
              border: '1px solid rgba(0,212,255,0.1)',
            }}>
              {JSON.stringify(result.rawResponse, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
