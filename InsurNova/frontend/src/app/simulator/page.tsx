'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventsAPI } from '@/lib/api';
import { Zap, ArrowRight, CheckCircle, XCircle, TrendingUp, Shield, AlertTriangle, Activity } from 'lucide-react';

export default function SimulatorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [eventType, setEventType] = useState('rain');
  const [severity, setSeverity] = useState(50);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showPipeline, setShowPipeline] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const eventTypes = [
    { value: 'rain', label: 'Heavy Rain', icon: '🌧️', color: 'blue' },
    { value: 'heat', label: 'Extreme Heat', icon: '🌡️', color: 'orange' },
    { value: 'pollution', label: 'Air Pollution', icon: '🌫️', color: 'gray' },
    { value: 'curfew', label: 'Govt Curfew', icon: '🚨', color: 'yellow' },
    { value: 'pandemic', label: 'Pandemic', icon: '😷', color: 'purple' },
    { value: 'war', label: 'War/Conflict', icon: '⚔️', color: 'red' },
  ];

  const handleSimulate = async () => {
    setSimulating(true);
    setShowPipeline(true);
    setResult(null);

    try {
      // Small delay for animation effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await eventsAPI.simulateEvent({
        type: eventType,
        severity: severity,
        location: { city: 'Mumbai', state: 'Maharashtra' }
      });

      setResult(response.data.simulation);
    } catch (error: any) {
      console.error('Simulation error:', error);
      setResult({
        error: true,
        message: error.response?.data?.message || 'Simulation failed'
      });
    } finally {
      setSimulating(false);
    }
  };

  const getPipelineSteps = () => {
    if (!result) return [];

    return [
      {
        label: 'Event Detected',
        icon: Zap,
        status: 'complete',
        data: `${eventType} at ${severity}% severity`,
        color: 'blue'
      },
      {
        label: 'Risk Evaluation',
        icon: TrendingUp,
        status: result.risk ? 'complete' : 'pending',
        data: result.risk ? `${result.risk.riskScore}/100 - ${result.risk.riskLevel} risk` : null,
        color: result.risk?.riskScore >= 75 ? 'red' : result.risk?.riskScore >= 50 ? 'orange' : 'green'
      },
      {
        label: 'Exclusion Check',
        icon: Shield,
        status: result.exclusion ? 'complete' : 'pending',
        data: result.exclusion?.excluded ? 'Event Excluded' : 'Event Covered',
        color: result.exclusion?.excluded ? 'red' : 'green'
      },
      {
        label: 'Claim Decision',
        icon: Activity,
        status: result.decision ? 'complete' : 'pending',
        data: result.decision || 'Processing...',
        color: result.decision === 'approved' ? 'green' : 'red'
      },
      {
        label: 'Payout',
        icon: result.payout > 0 ? CheckCircle : XCircle,
        status: result.payout !== undefined ? 'complete' : 'pending',
        data: result.payout !== undefined ? `₹${result.payout.toLocaleString('en-IN')}` : null,
        color: result.payout > 0 ? 'green' : 'red'
      }
    ];
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  const selectedEvent = eventTypes.find(e => e.value === eventType);
  const pipelineSteps = getPipelineSteps();

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Animated Background based on event type */}
      {eventType === 'rain' && (
        <div className="rain">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="rain-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 2 + 1}s`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
      {eventType === 'heat' && <div className="heat-shimmer"></div>}
      {eventType === 'pollution' && <div className="pollution-fog"></div>}

      <div className="content-wrapper max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Event Simulator
          </h1>
          <p className="text-white/70 text-lg">Test how events are processed through our AI automation pipeline</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left - Controls */}
          <div className="space-y-6">
            <div className="glass-card p-8 space-y-6">
              <h2 className="text-2xl font-bold">Configure Event</h2>

              {/* Event Type Selector */}
              <div className="space-y-3">
                <label className="block text-white/70 font-semibold">Event Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {eventTypes.map((event) => (
                    <button
                      key={event.value}
                      onClick={() => setEventType(event.value)}
                      className={`glass p-4 rounded-lg transition-all ${
                        eventType === event.value
                          ? 'bg-white/30 border-2 border-white/50 scale-105'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <div className="text-3xl mb-2">{event.icon}</div>
                      <div className="font-semibold text-sm">{event.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-white/70 font-semibold">Intensity / Severity</label>
                  <span className="text-3xl font-bold">{severity}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      ${severity < 25 ? 'rgb(34, 197, 94)' : 
                        severity < 50 ? 'rgb(234, 179, 8)' : 
                        severity < 75 ? 'rgb(249, 115, 22)' : 
                        'rgb(239, 68, 68)'} 0%, 
                      ${severity < 25 ? 'rgb(34, 197, 94)' : 
                        severity < 50 ? 'rgb(234, 179, 8)' : 
                        severity < 75 ? 'rgb(249, 115, 22)' : 
                        'rgb(239, 68, 68)'} ${severity}%, 
                      rgba(255,255,255,0.1) ${severity}%, 
                      rgba(255,255,255,0.1) 100%)`
                  }}
                />

                <div className="flex justify-between text-sm text-white/50">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Critical</span>
                </div>
              </div>

              {/* Simulate Button */}
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {simulating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="spinner w-5 h-5"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Simulate Event</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </button>
            </div>

            {/* Event Preview */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-xl font-bold">Event Preview</h3>
              <div className="glass p-4 space-y-3">
                <div className="text-5xl text-center mb-4">{selectedEvent?.icon}</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70">Type</span>
                    <span className="font-semibold">{selectedEvent?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Severity</span>
                    <span className={`font-bold ${
                      severity >= 75 ? 'text-red-400' :
                      severity >= 50 ? 'text-orange-400' :
                      severity >= 25 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {severity}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Location</span>
                    <span className="font-semibold">Mumbai, Maharashtra</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Pipeline Visualization */}
          <div className="space-y-6">
            {showPipeline ? (
              <div className="glass-card p-8 space-y-6">
                <h2 className="text-2xl font-bold">Processing Pipeline</h2>

                <div className="space-y-4">
                  {pipelineSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = step.status === 'complete';
                    const isPending = step.status === 'pending';

                    return (
                      <div key={index}>
                        <div className={`glass p-4 transition-all duration-500 ${
                          isActive ? 'bg-white/20 border-2 border-' + step.color + '-500/50' : ''
                        } ${isPending ? 'opacity-50' : ''}`}>
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${
                              isActive ? 'bg-' + step.color + '-500/20' : 'bg-white/10'
                            }`}>
                              <Icon className={`w-6 h-6 ${
                                isActive ? 'text-' + step.color + '-400' : 'text-white/50'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg">{step.label}</h3>
                              {step.data && (
                                <p className="text-sm text-white/70 mt-1">{step.data}</p>
                              )}
                            </div>
                            {isActive && (
                              <CheckCircle className={`w-6 h-6 text-${step.color}-400`} />
                            )}
                          </div>
                        </div>

                        {/* Arrow between steps */}
                        {index < pipelineSteps.length - 1 && (
                          <div className="flex justify-center py-2">
                            <ArrowRight className="w-6 h-6 text-white/30" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="glass-card p-8 text-center space-y-4">
                <Activity className="w-16 h-16 text-white/30 mx-auto" />
                <h3 className="text-xl font-bold">Pipeline Ready</h3>
                <p className="text-white/60">Configure an event and click simulate to see the processing pipeline</p>
              </div>
            )}

            {/* Result */}
            {result && !result.error && (
              <div className={`glass-card p-8 space-y-4 border-2 ${
                result.decision === 'approved' ? 'border-green-500/50 glow-green animate-pulse-glow' : 'border-red-500/50 glow-red animate-shake'
              }`}>
                <h2 className="text-2xl font-bold text-center">Final Result</h2>

                <div className="text-center">
                  <div className={`text-6xl mb-4 ${
                    result.decision === 'approved' ? 'animate-pulse-glow' : 'animate-shake'
                  }`}>
                    {result.decision === 'approved' ? '✅' : '❌'}
                  </div>
                  <p className={`text-3xl font-bold mb-2 ${
                    result.decision === 'approved' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.decision === 'approved' ? 'APPROVED' : 'REJECTED'}
                  </p>
                  <p className="text-5xl font-bold mb-4">
                    ₹{result.payout?.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="glass p-4">
                  <p className="text-sm text-white/70 mb-2">Reasoning:</p>
                  <p className="text-white leading-relaxed">{result.reason}</p>
                </div>

                {result.coverage > 0 && (
                  <div className="text-sm text-white/50 text-center">
                    Coverage: ₹{result.coverage.toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            )}

            {result?.error && (
              <div className="glass-card p-8 border-2 border-red-500/50 text-center">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 font-bold text-xl">{result.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
