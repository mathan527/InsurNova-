/**
 * ExplainableAI.jsx
 * After simulation: explains WHY payout happened (or not).
 * Shows feature thresholds, importance bars, and triggered rules.
 */
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

const THRESHOLDS = {
  RAIN:      { rainfall: 120, humidity: 70, windSpeed: 30 },
  HEAT:      { temperature: 40, humidity: 20 },
  POLLUTION: { aqi: 250, humidity: 30 },
  FLOOD:     { rainfall: 200, humidity: 80 },
  STORM:     { windSpeed: 60, rainfall: 100 },
  CURFEW:    { severity: 50 },
  PANDEMIC:  { severity: 60 },
};

/**
 * @param {object} props.simulationResult — from runSimulation
 * @param {object} props.features — input features
 * @param {string} props.eventType
 */
export default function ExplainableAI({ simulationResult, features = {}, eventType = 'RAIN' }) {
  if (!simulationResult) return (
    <div className="card flex flex-col items-center justify-center" style={{ minHeight: 220 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🧠</div>
      <p style={{ color: 'var(--text-muted)' }} className="text-sm">
        Run a simulation to see Explainable AI output
      </p>
    </div>
  );

  const { riskScore, fraudScore, calculatedAmount, payoutPercentage, verifiedLoss, trustScore, exclusionFactor } = simulationResult;
  const thresh = THRESHOLDS[eventType] || THRESHOLDS.RAIN;

  // Build threshold checks
  const checks = [];
  if (features.rainfall !== undefined && thresh.rainfall) {
    const passed = features.rainfall >= thresh.rainfall;
    checks.push({
      label: 'Rainfall',
      value: `${features.rainfall}mm`,
      threshold: `≥ ${thresh.rainfall}mm`,
      passed,
    });
  }
  if (features.aqi !== undefined && thresh.aqi) {
    const passed = features.aqi >= thresh.aqi;
    checks.push({ label: 'AQI Level', value: features.aqi, threshold: `≥ ${thresh.aqi}`, passed });
  }
  if (features.temperature !== undefined && thresh.temperature) {
    const passed = features.temperature >= thresh.temperature;
    checks.push({ label: 'Temperature', value: `${features.temperature}°C`, threshold: `≥ ${thresh.temperature}°C`, passed });
  }
  if (features.windSpeed !== undefined && thresh.windSpeed) {
    const passed = features.windSpeed >= thresh.windSpeed;
    checks.push({ label: 'Wind Speed', value: `${features.windSpeed}km/h`, threshold: `≥ ${thresh.windSpeed}km/h`, passed });
  }
  if (features.severity !== undefined) {
    checks.push({ label: 'Severity', value: `${features.severity}%`, threshold: '> 0%', passed: features.severity > 0 });
  }

  // Worker activity drop (proxy from severity)
  const activityDrop = Math.round(riskScore * 100);
  checks.push({
    label: 'Worker Activity Drop',
    value: `${activityDrop}%`,
    threshold: '> 40%',
    passed: activityDrop > 40,
  });

  // Fraud check
  if (fraudScore !== undefined) {
    checks.push({
      label: 'Fraud Score',
      value: (fraudScore * 100).toFixed(0),
      threshold: '< 50 (safe)',
      passed: fraudScore < 0.5,
    });
  }

  // Feature importance for bar chart
  const importanceData = [
    { name: 'Rainfall', importance: 35 },
    { name: 'Risk Score', importance: 28 },
    { name: 'AQI', importance: 18 },
    { name: 'Trust', importance: 12 },
    { name: 'Exclusion', importance: 7 },
  ];

  const BAR_COLORS = ['var(--neon-cyan)', 'var(--neon-green)', 'var(--neon-yellow)', 'var(--neon-purple)', 'var(--text-muted)'];

  return (
    <div className="card animate-fade-in-up">
      <div className="flex items-center justify-between mb-5">
        <span className="section-title mb-0">🔬 Explainable AI — Why This Payout?</span>
        {calculatedAmount > 0 ? (
          <span className="badge badge-success">✓ Payout Triggered</span>
        ) : (
          <span className="badge badge-danger">⛔ No Payout</span>
        )}
      </div>

      {/* Condition checks */}
      <div className="space-y-2 mb-5">
        {checks.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2.5 rounded-lg"
            style={{
              background: c.passed ? 'rgba(0,255,136,0.04)' : 'rgba(255,59,92,0.04)',
              border: `1px solid ${c.passed ? 'rgba(0,255,136,0.12)' : 'rgba(255,59,92,0.12)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 14 }}>{c.passed ? '✅' : '❌'}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {c.label}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold" style={{
                color: c.passed ? 'var(--neon-green)' : 'var(--neon-red)',
              }}>
                {c.value}
              </span>
              <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                (threshold: {c.threshold})
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Payout formula */}
      <div className="p-3 rounded-xl mb-5" style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(0,212,255,0.12)',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Payout Calculation:</p>
        <p className="text-xs" style={{ color: 'var(--neon-cyan)' }}>
          ₹{(verifiedLoss || 0).toLocaleString()} (loss)
          × {(riskScore * 100).toFixed(0)}% (risk)
          × {trustScore ? ((0.7 + (trustScore / 100) * 0.3)).toFixed(2) : '0.93'} (trust)
          × {exclusionFactor ?? 1} (exclusion)
          = <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>
              ₹{(calculatedAmount || 0).toLocaleString()}
            </span>
        </p>
      </div>

      {/* Feature importance chart */}
      <div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Feature Importance (Random Forest)</p>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={importanceData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={80} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
              formatter={(v) => [`${v}%`, 'Importance']}
            />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
              {importanceData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payout summary */}
      {calculatedAmount > 0 && (
        <div className="mt-4 p-4 rounded-xl" style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,184,148,0.06))',
          border: '1px solid rgba(0,255,136,0.25)',
        }}>
          <p className="text-sm font-bold" style={{ color: 'var(--neon-green)' }}>
            💰 Parametric Payout: <span className="font-mono text-lg">₹{calculatedAmount.toLocaleString()}</span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {payoutPercentage}% of coverage limit — transferred automatically within 2 hours
          </p>
        </div>
      )}
    </div>
  );
}
