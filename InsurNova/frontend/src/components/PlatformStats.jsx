/**
 * PlatformStats.jsx
 * Simulated Zomato / Zepto / Swiggy delivery partner data.
 * Animates digits during simulations.
 */
import { useState, useEffect } from 'react';

const PLATFORMS = {
  ZOMATO: {
    name: 'Zomato',
    emoji: '🔴',
    color: '#E23744',
    baseDeliveries: 28,
    baseHours: 8.5,
    baseEarnings: 720,
  },
  ZEPTO: {
    name: 'Zepto',
    emoji: '🟢',
    color: '#5C2D91',
    baseDeliveries: 45,
    baseHours: 10,
    baseEarnings: 850,
  },
  SWIGGY: {
    name: 'Swiggy',
    emoji: '🟠',
    color: '#FC8019',
    baseDeliveries: 32,
    baseHours: 9,
    baseEarnings: 780,
  },
};

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const target = parseFloat(value);
    const start = displayed;
    const steps = 30;
    const delta = (target - start) / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplayed(target);
        clearInterval(timer);
      } else {
        setDisplayed(prev => parseFloat((prev + delta).toFixed(1)));
      }
    }, 20);

    return () => clearInterval(timer);
  }, [value]);

  const formatted =
    suffix === '₹' ? `₹${Math.round(displayed).toLocaleString()}` :
    typeof displayed === 'number' && !Number.isInteger(displayed)
      ? displayed.toFixed(1)
      : Math.round(displayed);

  return (
    <span className="font-mono font-bold animate-count-up">
      {prefix}{suffix === '₹' ? '' : formatted}{suffix !== '₹' ? suffix : ''}
    </span>
  );
}

/**
 * @param {boolean} props.isDisrupted — when simulation running, apply drop
 * @param {number} props.disruptionPct — 0–1, how much activity is affected
 */
export default function PlatformStats({ isDisrupted = false, disruptionPct = 0 }) {
  const [selectedPlatform, setSelectedPlatform] = useState('ZOMATO');
  const platform = PLATFORMS[selectedPlatform];

  const factor = isDisrupted ? Math.max(0.1, 1 - disruptionPct) : 1;
  const deliveries = Math.round(platform.baseDeliveries * factor);
  const hours = parseFloat((platform.baseHours * (isDisrupted ? Math.max(0.3, factor) : 1)).toFixed(1));
  const earnings = Math.round(platform.baseEarnings * factor);
  const dropPct = isDisrupted ? Math.round((1 - factor) * 100) : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <span className="section-title mb-0">🛵 Platform Integration</span>
        {isDisrupted && (
          <span className="badge badge-danger">−{dropPct}% disrupted</span>
        )}
      </div>

      {/* Platform selector */}
      <div className="flex gap-2 mb-5">
        {Object.entries(PLATFORMS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => setSelectedPlatform(key)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200`}
            style={{
              background: selectedPlatform === key ? `${p.color}22` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selectedPlatform === key ? p.color : 'rgba(255,255,255,0.08)'}`,
              color: selectedPlatform === key ? p.color : 'var(--text-muted)',
            }}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Deliveries Today', value: deliveries, suffix: '', color: 'var(--neon-cyan)' },
          { label: 'Active Hours', value: hours, suffix: 'h', color: 'var(--neon-purple)' },
          { label: 'Est. Earnings', value: earnings, suffix: '₹', color: 'var(--neon-green)' },
        ].map((m, i) => (
          <div
            key={i}
            className="text-center rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-xl" style={{ color: m.color }}>
              {m.suffix === '₹'
                ? `₹${earnings.toLocaleString()}`
                : <><AnimatedNumber value={m.value} />{m.suffix}</>
              }
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Delivery Rate</span>
            <span style={{ color: 'var(--neon-cyan)' }}>{Math.round(factor * 100)}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{
              width: `${Math.round(factor * 100)}%`,
              background: factor > 0.7 ? 'var(--neon-cyan)' : factor > 0.4 ? 'var(--neon-yellow)' : 'var(--neon-red)',
            }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Earnings vs Baseline</span>
            <span style={{ color: isDisrupted ? 'var(--neon-red)' : 'var(--neon-green)' }}>
              {isDisrupted ? `−${dropPct}%` : '+0% (normal)'}
            </span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{
              width: `${Math.round(factor * 100)}%`,
              background: 'var(--neon-green)',
            }} />
          </div>
        </div>
      </div>

      {/* Verified loss */}
      {isDisrupted && (
        <div className="mt-4 p-3 rounded-lg animate-fade-in-up" style={{
          background: 'rgba(255,59,92,0.06)',
          border: '1px solid rgba(255,59,92,0.2)',
        }}>
          <p className="text-xs" style={{ color: 'var(--neon-red)' }}>
            ⚠ Verified Loss: <span className="font-mono font-bold">
              ₹{Math.round(platform.baseEarnings * disruptionPct).toLocaleString()}
            </span> due to disruption event
          </p>
        </div>
      )}
    </div>
  );
}
