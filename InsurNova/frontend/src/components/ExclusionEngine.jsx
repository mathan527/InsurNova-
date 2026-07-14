/**
 * ExclusionEngine.jsx
 * Always-visible panel showing policy exclusions.
 * When an excluded event type is detected, shows blocking banner.
 */

const EXCLUSIONS = [
  {
    id: 'war',
    icon: '⚔️',
    label: 'War / Armed Conflict',
    desc: 'No payout for losses arising from warfare, insurgency, or civil unrest.',
  },
  {
    id: 'pandemic',
    icon: '🦠',
    label: 'Pandemic / Epidemic',
    desc: 'Pandemic events receive a 50% payout cap under modified coverage terms.',
    partial: true,
  },
  {
    id: 'terrorism',
    icon: '💣',
    label: 'Terrorism',
    desc: 'Losses from terrorist acts or threats are excluded from coverage.',
  },
];

const PARTIAL_COVERAGE_TYPES = ['PANDEMIC'];
const EXCLUDED_TYPES = ['WAR', 'TERRORISM'];

export function isExcluded(eventType) {
  return EXCLUDED_TYPES.includes((eventType || '').toUpperCase());
}

export function isPartialCoverage(eventType) {
  return PARTIAL_COVERAGE_TYPES.includes((eventType || '').toUpperCase());
}

export function getExclusionReason(eventType) {
  const t = (eventType || '').toUpperCase();
  if (t === 'WAR') return 'War/Armed conflict is fully excluded from parametric coverage.';
  if (t === 'TERRORISM') return 'Terrorism events are excluded per Section 4.3 of the policy.';
  if (t === 'PANDEMIC') return 'Pandemic events trigger a 50% payout cap (partial coverage applies).';
  return null;
}

/**
 * @param {string|null} activeEventType — currently simulated event type
 */
export default function ExclusionEngine({ activeEventType = null }) {
  const excl = isExcluded(activeEventType);
  const partial = isPartialCoverage(activeEventType);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <span className="section-title mb-0">🛡️ Exclusion Engine</span>
        <span className="badge badge-gray text-xs">Policy v2.1</span>
      </div>

      {/* Exclusion list */}
      <div className="space-y-3 mb-4">
        {EXCLUSIONS.map((ex) => {
          const isActive = ex.partial
            ? isPartialCoverage(activeEventType)
            : isExcluded(activeEventType) && (
                (ex.id === 'war' && (activeEventType || '').toUpperCase() === 'WAR') ||
                (ex.id === 'terrorism' && (activeEventType || '').toUpperCase() === 'TERRORISM')
              );

          return (
            <div
              key={ex.id}
              className="flex gap-3 p-3 rounded-xl transition-all duration-300"
              style={{
                background: isActive
                  ? (ex.partial ? 'rgba(255,214,10,0.08)' : 'rgba(255,59,92,0.1)')
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${
                  isActive
                    ? (ex.partial ? 'rgba(255,214,10,0.3)' : 'rgba(255,59,92,0.3)')
                    : 'rgba(255,255,255,0.06)'
                }`,
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1.2 }}>{ex.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-semibold" style={{
                    color: isActive
                      ? (ex.partial ? 'var(--neon-yellow)' : 'var(--neon-red)')
                      : 'var(--text-primary)',
                  }}>
                    {isActive ? '❌' : '○'} {ex.label}
                  </span>
                  {ex.partial && (
                    <span className="badge badge-warning" style={{ fontSize: 9 }}>50% cap</span>
                  )}
                  {isActive && !ex.partial && (
                    <span className="badge badge-danger" style={{ fontSize: 9 }}>TRIGGERED</span>
                  )}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{ex.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Formula */}
      <div className="rounded-lg p-3 text-xs" style={{
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Payout Formula</p>
        <p style={{ color: 'var(--neon-cyan)' }}>
          Payout = Loss × RiskScore × TrustMultiplier × ExclusionFactor
        </p>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          ExclusionFactor: Full=1.0 | Pandemic=0.5 | Excluded=0
        </p>
      </div>

      {/* Active exclusion alert */}
      {excl && (
        <div className="mt-4 p-3 rounded-xl animate-fade-in-up" style={{
          background: 'rgba(255,59,92,0.1)',
          border: '1px solid rgba(255,59,92,0.4)',
        }}>
          <p className="text-sm font-bold" style={{ color: 'var(--neon-red)' }}>
            ⛔ PIPELINE HALTED
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {getExclusionReason(activeEventType)}
          </p>
        </div>
      )}

      {partial && (
        <div className="mt-4 p-3 rounded-xl animate-fade-in-up" style={{
          background: 'rgba(255,214,10,0.08)',
          border: '1px solid rgba(255,214,10,0.35)',
        }}>
          <p className="text-sm font-bold" style={{ color: 'var(--neon-yellow)' }}>
            ⚠️ PARTIAL COVERAGE
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Pandemic events trigger a 50% payout cap. Payout = calculated × 0.5
          </p>
        </div>
      )}
    </div>
  );
}
