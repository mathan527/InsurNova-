/**
 * Simulator.jsx — Production-Grade Simulation Engine
 * One-click scenarios: Rainstorm, AQI Spike, Curfew
 * Full pipeline animation + AI predictions + explainability
 */
import { useState, useCallback, useRef } from 'react';
import { eventsService } from '../services';
import { predictRisk, predictFraud } from '../services/mlApi';
import ClaimPipeline from '../components/ClaimPipeline';
import ExclusionEngine, { isExcluded, isPartialCoverage, getExclusionReason } from '../components/ExclusionEngine';
import FraudPanel from '../components/FraudPanel';
import ExplainableAI from '../components/ExplainableAI';
import LiveMonitor from '../components/LiveMonitor';

const QUICK_SCENARIOS = [
  {
    id: 'rainstorm',
    icon: '🌧️',
    label: 'Simulate Rainstorm',
    desc: 'Rainfall 140mm, AQI 45, High severity',
    color: 'var(--neon-cyan)',
    params: {
      eventType: 'RAIN', severity: 80, duration: 12,
      rainfall: 140, aqi: 45, temperature: 22,
      windSpeed: 45, humidity: 90, coverageAmount: 1500,
    },
  },
  {
    id: 'aqi',
    icon: '🌫️',
    label: 'Simulate AQI Spike',
    desc: 'AQI 350 (Hazardous), visibility zero',
    color: 'var(--neon-yellow)',
    params: {
      eventType: 'POLLUTION', severity: 70, duration: 8,
      rainfall: 10, aqi: 350, temperature: 32,
      windSpeed: 5, humidity: 40, coverageAmount: 1000,
    },
  },
  {
    id: 'curfew',
    icon: '🚧',
    label: 'Simulate Curfew',
    desc: 'Section 144 imposed, zero mobility',
    color: 'var(--neon-purple)',
    params: {
      eventType: 'CURFEW', severity: 95, duration: 24,
      rainfall: 0, aqi: 80, temperature: 28,
      windSpeed: 10, humidity: 50, coverageAmount: 2000,
    },
  },
];

const EVENT_TYPES = ['RAIN', 'HEAT', 'POLLUTION', 'CURFEW', 'FLOOD', 'STORM', 'PANDEMIC', 'WAR', 'TERRORISM'];

function SliderField({ label, name, min, max, value, onChange, unit = '' }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
        <span className="text-sm font-mono font-bold" style={{ color: 'var(--neon-cyan)' }}>{value}{unit}</span>
      </div>
      <input
        type="range" name={name} min={min} max={max}
        value={value} onChange={onChange}
        style={{
          background: `linear-gradient(to right, var(--neon-cyan) 0%, var(--neon-cyan) ${pct}%, rgba(0,212,255,0.12) ${pct}%, rgba(0,212,255,0.12) 100%)`,
        }}
      />
    </div>
  );
}

export default function Simulator() {
  const [formData, setFormData] = useState({
    eventType: 'RAIN', severity: 50, duration: 6,
    temperature: 25, rainfall: 100, aqi: 120,
    windSpeed: 20, humidity: 60, coverageAmount: 1000,
  });

  const [simState, setSimState] = useState({
    running: false,
    blockedAt: null,
    stageData: {},
    result: null,
    fraudTrigger: 0,
    fraudFeatures: {},
    riskResult: null,
    completed: false,
  });

  const [logs, setLogs] = useState([]);
  const logsRef = useRef([]);

  const addLog = useCallback((type, msg) => {
    const entry = { type, msg };
    logsRef.current = [...logsRef.current, entry];
    setLogs([...logsRef.current]);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'eventType' ? value : parseFloat(value) }));
  };

  const applyScenario = (scenario) => {
    setFormData(scenario.params);
    setSimState(s => ({ ...s, result: null, running: false, completed: false, blockedAt: null, stageData: {} }));
  };

  const runSimulation = useCallback(async () => {
    const f = formData;
    setSimState(s => ({ ...s, running: true, result: null, completed: false, blockedAt: null, stageData: {} }));
    logsRef.current = [];
    addLog('ai', `[SIM] Starting simulation: ${f.eventType}`);

    // ── 1. Exclusion check (before pipeline)
    const excl = isExcluded(f.eventType);
    const partial = isPartialCoverage(f.eventType);
    const exclusionFactor = excl ? 0 : partial ? 0.5 : 1.0;
    const exclusionReason = getExclusionReason(f.eventType);

    // ── 2. AI Risk Prediction (real API call)
    addLog('ai', `[ML] Calling /predict/risk → rainfall=${f.rainfall}mm, AQI=${f.aqi}`);
    const riskResult = await predictRisk({
      rainfall: f.rainfall, aqi: f.aqi,
      deliveryRate: 1 - f.severity / 100,
      locationRisk: f.severity / 100,
      temperature: f.temperature,
      windSpeed: f.windSpeed,
      humidity: f.humidity,
    });
    addLog('ai', `[ML] Risk score: ${riskResult.riskScore.toFixed(3)} | ${riskResult.latencyMs}ms | model: ${riskResult.modelName}`);

    const riskScore = riskResult.riskScore;

    // ── 3. Fraud detection (real API call)
    const fraudFeatures = {
      claimFrequency: 2,
      gpsAnomaly: f.severity > 80,
      timeSincePolicy: 30,
      claimAmountRatio: riskScore,
      eventType: f.eventType,
    };
    addLog('ai', `[ML] Calling /predict/fraud → gpsAnomaly=${fraudFeatures.gpsAnomaly}`);
    const fraudResult = await predictFraud(fraudFeatures);
    addLog(fraudResult.fraudScore > 0.5 ? 'fraud' : 'info',
      `[ML] Fraud score: ${fraudResult.fraudScore.toFixed(3)} | ${fraudResult.latencyMs}ms`);

    // ── 4. Payout calculation
    const trustScore = 75;
    const trustMultiplier = 0.7 + (trustScore / 100) * 0.3;
    const baselineEarnings = f.coverageAmount;
    const actualEarnings = baselineEarnings * (1 - riskScore);
    const verifiedLoss = baselineEarnings - actualEarnings;
    let calculatedAmount = verifiedLoss * riskScore * trustMultiplier * exclusionFactor;
    if (fraudResult.isFraudulent) calculatedAmount *= 0.1; // fraud penalty
    calculatedAmount = Math.min(Math.max(0, calculatedAmount), f.coverageAmount);

    const payoutPercentage = Math.round((calculatedAmount / f.coverageAmount) * 100);

    // ── 5. Stage data
    const stageData = {
      trigger: {
        detail: `${f.eventType} event — severity ${f.severity}%`,
        value: `Severity: ${f.severity}%`,
      },
      policy: {
        detail: 'Active policy found — coverage valid',
        value: `₹${f.coverageAmount.toLocaleString()}`,
      },
      exclusion: excl
        ? { detail: exclusionReason || 'Exclusion triggered', value: 'BLOCKED' }
        : partial
          ? { detail: '50% pandemic cap applied', value: 'Factor: 0.5' }
          : { detail: 'No exclusions triggered', value: 'Factor: 1.0' },
      fraud: {
        detail: fraudResult.isFraudulent
          ? `Fraud detected: ${fraudResult.reasons.join(', ')}`
          : 'No fraud detected',
        value: `Score: ${(fraudResult.fraudScore * 100).toFixed(0)}`,
      },
      payout: {
        detail: calculatedAmount > 0 ? 'Parametric payout authorized' : 'No payout',
        value: calculatedAmount > 0 ? `₹${Math.round(calculatedAmount).toLocaleString()}` : '₹0',
      },
    };

    const result = {
      riskScore, fraudScore: fraudResult.fraudScore,
      payoutPercentage,
      calculatedAmount: Math.round(calculatedAmount),
      confidence: riskResult.confidence,
      verifiedLoss: Math.round(verifiedLoss),
      trustScore,
      trustMultiplier: Math.round(trustMultiplier * 100) / 100,
      exclusionFactor,
      isExcluded: excl,
    };

    if (calculatedAmount > 0) {
      addLog('success', `[PAYOUT] ₹${result.calculatedAmount.toLocaleString()} authorized → ${f.eventType}`);
    } else if (excl) {
      addLog('risk', `[EXCLUSION] Pipeline halted — ${f.eventType} is excluded`);
    } else {
      addLog('risk', `[PAYOUT] No payout — risk/exclusion conditions not met`);
    }

    // Backend call (best-effort)
    try {
      await eventsService.quickClaim({ eventType: f.eventType, severity: f.severity });
      addLog('info', `[API] Claim created in backend`);
    } catch {
      addLog('info', `[API] Backend claim skipped (offline)`);
    }

    setSimState({
      running: true, // pipeline takes over timing
      blockedAt: excl ? 'exclusion' : fraudResult.isFraudulent ? 'fraud' : null,
      stageData,
      result,
      fraudTrigger: Date.now(),
      fraudFeatures,
      riskResult,
      completed: false,
    });
  }, [formData, addLog]);

  const handlePipelineComplete = (status) => {
    setSimState(s => ({ ...s, running: false, completed: true }));
    addLog(status === 'success' ? 'success' : 'risk', `[SIM] Pipeline ${status}`);
  };

  const f = formData;
  const { result, stageData, running, blockedAt, fraudTrigger, fraudFeatures, riskResult, completed } = simState;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">⚡ Simulation Engine</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Trigger parametric events — watch the AI pipeline in action
          </p>
        </div>
      </div>

      {/* Quick scenario buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {QUICK_SCENARIOS.map(scenario => (
          <button
            key={scenario.id}
            onClick={() => applyScenario(scenario)}
            className="text-left p-4 rounded-2xl transition-all duration-200 group"
            style={{
              background: `${scenario.color}08`,
              border: `1px solid ${scenario.color}25`,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${scenario.color}60`; e.currentTarget.style.background = `${scenario.color}14`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${scenario.color}25`; e.currentTarget.style.background = `${scenario.color}08`; }}
          >
            <div style={{ fontSize: 28 }}>{scenario.icon}</div>
            <div className="font-semibold mt-2" style={{ color: scenario.color }}>{scenario.label}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{scenario.desc}</div>
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
            Event Parameters
          </h2>

          {/* Event type */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Event Type
            </label>
            <select name="eventType" value={f.eventType} onChange={handleChange} className="input-field">
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <SliderField label="Severity" name="severity" min={0} max={100} value={f.severity} onChange={handleChange} unit="%" />
          <SliderField label="Rainfall" name="rainfall" min={0} max={400} value={f.rainfall} onChange={handleChange} unit="mm" />
          <SliderField label="AQI" name="aqi" min={0} max={500} value={f.aqi} onChange={handleChange} unit="" />
          <SliderField label="Temperature" name="temperature" min={-10} max={55} value={f.temperature} onChange={handleChange} unit="°C" />
          <SliderField label="Wind Speed" name="windSpeed" min={0} max={150} value={f.windSpeed} onChange={handleChange} unit="km/h" />
          <SliderField label="Humidity" name="humidity" min={0} max={100} value={f.humidity} onChange={handleChange} unit="%" />

          <div className="mb-5">
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Coverage Amount (₹)
            </label>
            <input type="number" name="coverageAmount" min={100} max={10000} step={100}
              value={f.coverageAmount} onChange={handleChange} className="input-field"
            />
          </div>

          <button
            onClick={runSimulation}
            disabled={running}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Running AI Pipeline...
              </>
            ) : (
              <>▶ Run Simulation</>
            )}
          </button>
        </div>

        {/* Results panel */}
        <div className="space-y-5">
          {result ? (
            <>
              {/* Payout hero */}
              <div className="rounded-2xl p-6" style={{
                background: result.calculatedAmount > 0
                  ? 'linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,184,148,0.08))'
                  : 'linear-gradient(135deg, rgba(255,59,92,0.12), rgba(255,107,53,0.08))',
                border: `1px solid ${result.calculatedAmount > 0 ? 'rgba(0,255,136,0.3)' : 'rgba(255,59,92,0.3)'}`,
              }}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  {result.calculatedAmount > 0 ? '💰 Parametric Payout' : '⛔ No Payout Issued'}
                </p>
                <p className="text-4xl font-bold font-mono" style={{
                  color: result.calculatedAmount > 0 ? 'var(--neon-green)' : 'var(--neon-red)',
                }}>
                  ₹{result.calculatedAmount.toLocaleString()}
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  {result.payoutPercentage}% of ₹{f.coverageAmount.toLocaleString()} coverage limit
                </p>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Risk Score', value: `${(result.riskScore * 100).toFixed(0)}%`, color: result.riskScore > 0.6 ? 'var(--neon-red)' : result.riskScore > 0.4 ? 'var(--neon-yellow)' : 'var(--neon-green)' },
                    { label: 'Trust', value: `×${result.trustMultiplier}`, color: 'var(--neon-cyan)' },
                    { label: 'Exclusion', value: `×${result.exclusionFactor}`, color: result.exclusionFactor < 1 ? 'var(--neon-yellow)' : 'var(--neon-green)' },
                  ].map((m, i) => (
                    <div key={i} className="text-center p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <div className="text-lg font-mono font-bold" style={{ color: m.color }}>{m.value}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center" style={{ minHeight: 200 }}>
              <div style={{ fontSize: 48 }}>⚡</div>
              <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                Select a scenario or configure parameters and run simulation
              </p>
            </div>
          )}

          {/* Exclusion Engine */}
          <ExclusionEngine activeEventType={f.eventType} />
        </div>
      </div>

      {/* Pipeline — full width */}
      <ClaimPipeline
        running={running || (completed && result)}
        blockedAt={blockedAt}
        stageData={stageData}
        onComplete={handlePipelineComplete}
      />

      {/* Bottom grid: Fraud + Explainable AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FraudPanel claimFeatures={fraudFeatures} trigger={fraudTrigger} />
        <ExplainableAI
          simulationResult={result}
          features={formData}
          eventType={f.eventType}
        />
      </div>

      {/* Live monitor */}
      <LiveMonitor externalLogs={logs} />
    </div>
  );
}
