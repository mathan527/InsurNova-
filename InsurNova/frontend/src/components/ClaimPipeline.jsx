/**
 * ClaimPipeline.jsx
 * Animated 5-stage parametric insurance claim pipeline.
 * Trigger → Policy Check → Exclusion Check → Fraud Check → Payout
 */
import { useState, useEffect } from 'react';

const STAGES = [
  { id: 'trigger',    label: 'Trigger',   icon: '⚡', desc: 'Weather event detected' },
  { id: 'policy',     label: 'Policy',    icon: '📋', desc: 'Coverage validated' },
  { id: 'exclusion',  label: 'Exclusion', icon: '🛡️', desc: 'Exclusion engine check' },
  { id: 'fraud',      label: 'Fraud',     icon: '🔍', desc: 'ML fraud analysis' },
  { id: 'payout',     label: 'Payout',    icon: '💰', desc: 'Parametric payout' },
];

const STAGE_DELAY = 600; // ms between stages

/**
 * @param {object} props
 * @param {boolean} props.running — true when simulation is active
 * @param {string|null} props.blockedAt — stage id where pipeline is blocked
 * @param {object} props.stageData — { trigger: {...}, policy: {...}, ... }
 * @param {function} props.onComplete — called when pipeline finishes
 */
export default function ClaimPipeline({ running = false, blockedAt = null, stageData = {}, onComplete }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [statuses, setStatuses] = useState(STAGES.map(() => 'pending'));

  useEffect(() => {
    if (!running) {
      setActiveIndex(-1);
      setStatuses(STAGES.map(() => 'pending'));
      return;
    }

    let cancelled = false;

    async function animate() {
      const newStatuses = STAGES.map(() => 'pending');
      // Reset
      setStatuses([...newStatuses]);
      setActiveIndex(-1);

      for (let i = 0; i < STAGES.length; i++) {
        if (cancelled) return;
        await delay(STAGE_DELAY);

        const stage = STAGES[i];
        setActiveIndex(i);
        newStatuses[i] = 'active';
        setStatuses([...newStatuses]);

        await delay(STAGE_DELAY);
        if (cancelled) return;

        if (blockedAt === stage.id) {
          newStatuses[i] = 'blocked';
          setStatuses([...newStatuses]);
          if (onComplete) onComplete('blocked', stage.id);
          return;
        }

        newStatuses[i] = 'success';
        setStatuses([...newStatuses]);
      }

      if (!cancelled && onComplete) onComplete('success', null);
    }

    animate();
    return () => { cancelled = true; };
  }, [running, blockedAt]);

  const getNodeClass = (status) => {
    switch (status) {
      case 'active':  return 'pipeline-node pipeline-node-active';
      case 'success': return 'pipeline-node pipeline-node-success';
      case 'blocked': return 'pipeline-node pipeline-node-blocked';
      default:        return 'pipeline-node pipeline-node-pending';
    }
  };

  const getConnectorClass = (leftStatus) => {
    if (leftStatus === 'success') return 'pipeline-connector pipeline-connector-done';
    if (leftStatus === 'active')  return 'pipeline-connector pipeline-connector-active';
    return 'pipeline-connector pipeline-connector-pending';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <span className="section-title mb-0">⚡ Claim Processing Pipeline</span>
        {running && (
          <span className="badge badge-info">
            <span className="live-dot mr-1" style={{ display: 'inline-block' }} />
            Processing
          </span>
        )}
        {!running && statuses.some(s => s === 'success') && !statuses.some(s => s === 'blocked') && (
          <span className="badge badge-success">✓ Complete</span>
        )}
        {statuses.some(s => s === 'blocked') && (
          <span className="badge badge-danger">⛔ Blocked</span>
        )}
      </div>

      {/* Pipeline row */}
      <div className="flex items-center gap-0">
        {STAGES.map((stage, i) => (
          <div key={stage.id} className="flex items-center flex-1 min-w-0">
            {/* Stage node */}
            <div className="pipeline-stage flex-shrink-0" style={{ minWidth: 60 }}>
              <div className={getNodeClass(statuses[i])}>
                <span style={{ fontSize: 18 }}>{stage.icon}</span>
              </div>
              <div className="text-center mt-1">
                <div className="text-xs font-semibold whitespace-nowrap" style={{
                  color: statuses[i] === 'success' ? 'var(--neon-green)' :
                         statuses[i] === 'blocked' ? 'var(--neon-red)' :
                         statuses[i] === 'active'  ? 'var(--neon-cyan)' :
                                                     'var(--text-muted)',
                }}>
                  {stage.label}
                </div>
              </div>
            </div>

            {/* Connector (not after last) */}
            {i < STAGES.length - 1 && (
              <div className={`flex-1 mx-1 ${getConnectorClass(statuses[i])}`} style={{ minWidth: 20 }} />
            )}
          </div>
        ))}
      </div>

      {/* Stage detail cards */}
      <div className="grid grid-cols-5 gap-2 mt-5">
        {STAGES.map((stage, i) => {
          const data = stageData[stage.id];
          const status = statuses[i];
          if (status === 'pending') return (
            <div key={stage.id} className="text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>—</p>
            </div>
          );

          return (
            <div
              key={stage.id}
              className="rounded-lg p-2 text-xs animate-fade-in-up"
              style={{
                background: status === 'blocked' ? 'rgba(255,59,92,0.08)' :
                            status === 'success' ? 'rgba(0,255,136,0.06)' :
                                                   'rgba(0,212,255,0.06)',
                border: `1px solid ${
                  status === 'blocked' ? 'rgba(255,59,92,0.25)' :
                  status === 'success' ? 'rgba(0,255,136,0.2)' :
                                         'rgba(0,212,255,0.2)'
                }`,
              }}
            >
              <p className="font-semibold mb-1" style={{
                color: status === 'blocked' ? 'var(--neon-red)' :
                       status === 'success' ? 'var(--neon-green)' :
                                              'var(--neon-cyan)',
              }}>
                {status === 'blocked' ? '⛔ BLOCKED' :
                 status === 'success' ? '✓ OK' :
                                        '⟳ ...'}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
                {data?.detail || stage.desc}
              </p>
              {data?.value !== undefined && (
                <p className="font-mono mt-1" style={{ color: 'var(--neon-cyan)', fontSize: 11 }}>
                  {data.value}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Blocked reason */}
      {statuses.some(s => s === 'blocked') && (
        <div className="mt-4 p-3 rounded-lg animate-fade-in-up" style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.3)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--neon-red)' }}>
            ⛔ Pipeline Halted: {stageData.exclusion?.reason || 'Exclusion condition triggered — no payout issued.'}
          </p>
        </div>
      )}
    </div>
  );
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
