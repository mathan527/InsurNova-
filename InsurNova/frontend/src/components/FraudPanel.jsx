/**
 * FraudPanel.jsx
 * Real-time fraud detection display.
 * Calls /predict/fraud and shows animated gauge, reason chips, trust score.
 */
import { useState, useEffect } from 'react';
import { predictFraud } from '../services/mlApi';

function SpeedometerGauge({ score }) {
  // score: 0-1
  const angle = -135 + score * 270; // -135° (left) to +135° (right)
  const color =
    score < 0.3 ? 'var(--neon-green)' :
    score < 0.6 ? 'var(--neon-yellow)' :
                  'var(--neon-red)';

  const cx = 70, cy = 70, r = 55;
  const toRad = (d) => (d * Math.PI) / 180;
  // Arc: from -225° to +45° (270deg sweep)
  const startAngle = -225;
  const endAngle   = 45;
  const arcX1 = cx + r * Math.cos(toRad(startAngle));
  const arcY1 = cy + r * Math.sin(toRad(startAngle));
  const arcX2 = cx + r * Math.cos(toRad(endAngle));
  const arcY2 = cy + r * Math.sin(toRad(endAngle));

  // Needle
  const needleLen = 42;
  const needleAngle = -135 + score * 270;
  const nx = cx + needleLen * Math.cos(toRad(needleAngle));
  const ny = cy + needleLen * Math.sin(toRad(needleAngle));

  return (
    <svg width="140" height="90" viewBox="0 0 140 100" className="shrink-0">
      {/* Background arc */}
      <path
        d={`M ${arcX1} ${arcY1} A ${r} ${r} 0 1 1 ${arcX2} ${arcY2}`}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Color arc (partial) */}
      {[
        { pct: 0.33, color: 'var(--neon-green)' },
        { pct: 0.33, color: 'var(--neon-yellow)' },
        { pct: 0.34, color: 'var(--neon-red)' },
      ].map((seg, i) => {
        const start = -225 + i * 90;
        const end = start + 88;
        const sx = cx + r * Math.cos(toRad(start));
        const sy = cy + r * Math.sin(toRad(start));
        const ex = cx + r * Math.cos(toRad(end));
        const ey = cy + r * Math.sin(toRad(end));
        return (
          <path
            key={i}
            d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`}
            fill="none"
            stroke={seg.color}
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.5"
          />
        );
      })}

      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={nx} y2={ny}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        style={{ transition: 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      />
      <circle cx={cx} cy={cy} r={5} fill={color} />

      {/* Score text */}
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize="14" fontWeight="bold" fill={color} fontFamily="JetBrains Mono">
        {(score * 100).toFixed(0)}%
      </text>
    </svg>
  );
}

function ReasonChip({ reason }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: 'rgba(255,59,92,0.1)',
        border: '1px solid rgba(255,59,92,0.25)',
        color: 'var(--neon-red)',
      }}
    >
      ⚠ {reason}
    </span>
  );
}

/**
 * @param {object} props.claimFeatures — features for fraud prediction
 * @param {boolean} props.trigger — increment to re-run prediction
 */
export default function FraudPanel({ claimFeatures = {}, trigger = 0 }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function run() {
      setLoading(true);
      const res = await predictFraud(claimFeatures);
      setResult(res);
      setLoading(false);
    }
    run();
  }, [trigger, JSON.stringify(claimFeatures)]);

  const fraudScore = result?.fraudScore ?? 0;
  const trustScore = parseFloat((1 - fraudScore).toFixed(3));
  const riskLevel =
    fraudScore < 0.3 ? 'LOW'    :
    fraudScore < 0.6 ? 'MEDIUM' : 'HIGH';

  const riskColor =
    fraudScore < 0.3 ? 'var(--neon-green)' :
    fraudScore < 0.6 ? 'var(--neon-yellow)' :
                       'var(--neon-red)';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <span className="section-title mb-0">🔍 Fraud Detection</span>
        <div className="flex items-center gap-2">
          {result && (
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{
              background: 'rgba(0,0,0,0.3)',
              color: result.latencyMs < 300 ? 'var(--neon-green)' : 'var(--neon-yellow)',
            }}>
              {result.latencyMs}ms
            </span>
          )}
          <span className={`badge ${result?.source === 'live' ? 'badge-info' : 'badge-gray'}`}>
            {result?.source === 'live' ? '🟢 LIVE' : '🟡 FALLBACK'}
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && result && (
        <div className="animate-fade-in-up">
          {/* Gauge + Score summary */}
          <div className="flex items-center gap-4 mb-5">
            <SpeedometerGauge score={fraudScore} />
            <div>
              <div className="text-2xl font-bold font-mono" style={{ color: riskColor }}>
                {(fraudScore * 100).toFixed(0)}
                <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>/ 100</span>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Fraud Score</div>
              <div className="mt-2">
                <span
                  className="badge text-sm font-bold"
                  style={{
                    background: fraudScore < 0.3 ? 'rgba(0,255,136,0.12)' : fraudScore < 0.6 ? 'rgba(255,214,10,0.12)' : 'rgba(255,59,92,0.12)',
                    color: riskColor,
                    border: `1px solid ${riskColor}40`,
                  }}
                >
                  {riskLevel} RISK
                </span>
              </div>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}>
              <div className="text-lg font-bold font-mono" style={{ color: 'var(--neon-green)' }}>
                {(trustScore * 100).toFixed(0)}%
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Trust Score</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <div className="text-lg font-bold font-mono" style={{ color: 'var(--neon-cyan)' }}>
                {(result.confidence * 100).toFixed(0)}%
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Confidence</div>
            </div>
          </div>

          {/* Reason chips */}
          {result.reasons && result.reasons.length > 0 ? (
            <div className="mb-4">
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Detection Reasons:</p>
              <div className="flex flex-wrap gap-2">
                {result.reasons.map((r, i) => <ReasonChip key={i} reason={r} />)}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}>
              <p className="text-xs" style={{ color: 'var(--neon-green)' }}>✓ No anomalies detected</p>
            </div>
          )}

          {/* Model info */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              🤖 Model: <span style={{ color: 'var(--neon-cyan)' }}>{result.modelName}</span>
              &nbsp;·&nbsp; Endpoint: <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>/predict/fraud</span>
            </p>
            {result.isFraudulent && (
              <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.3)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--neon-red)' }}>
                  ⛔ Claim flagged as potentially fraudulent — manual review required
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
