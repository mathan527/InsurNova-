'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { policyAPI } from '@/lib/api';
import { Shield, Check, X, Info, TrendingUp, Zap } from 'lucide-react';

export default function PolicyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [policy, setPolicy] = useState<any>(null);
  const [exclusions, setExclusions] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [selectedCoverage, setSelectedCoverage] = useState(50000);
  const [calculatedPremium, setCalculatedPremium] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [policyRes, exclusionsRes, tiersRes] = await Promise.all([
        policyAPI.getPolicy().catch(() => ({ data: { policy: null } })),
        policyAPI.getExclusions(),
        policyAPI.getPricing(),
      ]);

      setPolicy(policyRes.data.policy);
      setExclusions(exclusionsRes.data.rules);
      setTiers(tiersRes.data.tiers);

      if (policyRes.data.policy) {
        setSelectedCoverage(policyRes.data.policy.coverage);
      }

      calculatePremium(selectedCoverage);
    } catch (error) {
      console.error('Error loading policy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePremium = async (coverage: number) => {
    try {
      const response = await policyAPI.calculatePremium({ coverage });
      setCalculatedPremium(response.data.pricing);
    } catch (error) {
      console.error('Error calculating premium:', error);
    }
  };

  const handleCoverageChange = (value: number) => {
    setSelectedCoverage(value);
    calculatePremium(value);
  };

  const handleActivatePolicy = async () => {
    if (!calculatedPremium) return;

    setActivating(true);
    try {
      await policyAPI.activatePolicy({
        premium: calculatedPremium.monthly_premium,
        coverage: selectedCoverage,
      });

      alert('✅ Policy activated successfully!');
      loadData();
    } catch (error: any) {
      alert('❌ ' + (error.response?.data?.message || 'Error activating policy'));
    } finally {
      setActivating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  const coveredEvents = [
    { name: 'Heavy Rain', icon: '🌧️', description: 'Rainfall > 50mm in 24 hours', severity: 'High' },
    { name: 'Extreme Heat', icon: '🌡️', description: 'Temperature > 40°C', severity: 'High' },
    { name: 'Air Pollution', icon: '🌫️', description: 'AQI > 150 (Unhealthy)', severity: 'Medium' },
    { name: 'Government Curfew', icon: '🚨', description: 'Movement restrictions imposed', severity: 'Medium' },
  ];

  const excludedEvents = exclusions?.excluded || [];
  const partialEvents = exclusions?.partial || [];
  const excludedDetails = exclusions?.details || {};

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Heat Shimmer Background */}
      <div className="heat-shimmer"></div>

      <div className="content-wrapper max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Choose Your Protection
          </h1>
          <p className="text-white/70 text-lg">Automated parametric insurance for gig workers</p>
        </div>

        {/* Current Policy Status */}
        {policy && (
          <div className="glass-card p-6 border-2 border-green-500/50 glow-green">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-green-400" />
                  <span>Active Policy</span>
                </h2>
                <p className="text-white/60 mt-1">Your current coverage is active</p>
              </div>
              <div className="text-right">
                <p className="text-white/70">Coverage</p>
                <p className="text-3xl font-bold">₹{policy.coverage?.toLocaleString('en-IN')}</p>
                <p className="text-sm text-white/60 mt-1">₹{policy.premium}/month</p>
              </div>
            </div>
          </div>
        )}

        {/* Covered Events */}
        <div className="glass-card p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold flex items-center justify-center space-x-2">
              <Check className="w-8 h-8 text-green-400" />
              <span>Covered Events</span>
            </h2>
            <p className="text-white/60 mt-2">You're protected against these events</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {coveredEvents.map((event, index) => (
              <div key={index} className="glass p-6 hover:bg-white/20 transition-all space-y-3">
                <div className="text-5xl text-center">{event.icon}</div>
                <h3 className="font-bold text-lg text-center">{event.name}</h3>
                <p className="text-sm text-white/60 text-center">{event.description}</p>
                <div className="flex justify-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    event.severity === 'High' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {event.severity} Risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exclusions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fully Excluded */}
          <div className="glass-card p-8 space-y-4 border-2 border-red-500/30">
            <div className="text-center">
              <h2 className="text-2xl font-bold flex items-center justify-center space-x-2 text-red-400">
                <X className="w-6 h-6" />
                <span>Excluded Events</span>
              </h2>
              <p className="text-white/60 text-sm mt-2">Not covered for financial sustainability</p>
            </div>

            <div className="space-y-3">
              {excludedEvents.map((event: string) => (
                <div key={event} className="glass-dark p-4 flex items-start space-x-3 group relative">
                  <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold capitalize">{event}</p>
                    <p className="text-sm text-white/60 mt-1">
                      {excludedDetails[event]?.reason || 'Excluded for financial sustainability'}
                    </p>
                  </div>
                  <div className="group-hover:opacity-100 opacity-0 transition-opacity">
                    <div className="absolute right-4 top-4 glass-dark p-2 rounded-full">
                      <Info className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partial Coverage */}
          <div className="glass-card p-8 space-y-4 border-2 border-yellow-500/30">
            <div className="text-center">
              <h2 className="text-2xl font-bold flex items-center justify-center space-x-2 text-yellow-400">
                <Info className="w-6 h-6" />
                <span>Partial Coverage</span>
              </h2>
              <p className="text-white/60 text-sm mt-2">Reduced payout for these events</p>
            </div>

            <div className="space-y-3">
              {partialEvents.map((event: string) => (
                <div key={event} className="glass-dark p-4 flex items-start space-x-3">
                  <Info className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold capitalize">{event}</p>
                    <p className="text-sm text-white/60 mt-1">
                      {excludedDetails[event]?.reason || 'Partial coverage applies'}
                    </p>
                    {excludedDetails[event]?.payoutMultiplier && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                          {(excludedDetails[event].payoutMultiplier * 100)}% payout
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Premium Calculator */}
        <div className="glass-card p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Select Your Coverage</h2>
            <p className="text-white/60 mt-2">Adjust the slider to customize your plan</p>
          </div>

          {/* Coverage Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Coverage Amount</span>
              <span className="text-3xl font-bold">₹{selectedCoverage.toLocaleString('en-IN')}</span>
            </div>

            <input
              type="range"
              min="10000"
              max="200000"
              step="10000"
              value={selectedCoverage}
              onChange={(e) => handleCoverageChange(Number(e.target.value))}
              className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(168, 85, 247) ${((selectedCoverage - 10000) / (200000 - 10000)) * 100}%, rgba(255,255,255,0.1) ${((selectedCoverage - 10000) / (200000 - 10000)) * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />

            <div className="flex justify-between text-sm text-white/50">
              <span>₹10,000</span>
              <span>₹2,00,000</span>
            </div>
          </div>

          {/* Pricing Display */}
          {calculatedPremium && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass p-6 space-y-2 hover:scale-105 transition-transform">
                <div className="flex items-center space-x-2 text-white/70">
                  <Zap className="w-5 h-5" />
                  <span>Monthly Plan</span>
                </div>
                <p className="text-4xl font-bold">₹{calculatedPremium.monthly_premium}</p>
                <p className="text-sm text-white/60">Billed monthly</p>
              </div>

              <div className="glass p-6 space-y-2 hover:scale-105 transition-transform border-2 border-green-500/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-white/70">
                    <TrendingUp className="w-5 h-5" />
                    <span>Annual Plan</span>
                  </div>
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold">
                    Save ₹{calculatedPremium.savings_annual}
                  </span>
                </div>
                <p className="text-4xl font-bold">₹{calculatedPremium.annual_premium}</p>
                <p className="text-sm text-white/60">Billed annually (15% off)</p>
              </div>
            </div>
          )}

          {/* Activate Button */}
          <div className="text-center pt-4">
            <button
              onClick={handleActivatePolicy}
              disabled={activating}
              className="btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activating ? (
                <div className="flex items-center space-x-2">
                  <div className="spinner w-5 h-5"></div>
                  <span>Activating...</span>
                </div>
              ) : (
                <>
                  {policy ? 'Update Plan' : 'Activate Plan'} →
                </>
              )}
            </button>
            <p className="text-sm text-white/50 mt-3">
              {policy ? 'Changes take effect immediately' : 'Start your coverage today'}
            </p>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-2xl font-bold text-center">Quick Select Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier: any, index: number) => (
              <div
                key={index}
                onClick={() => handleCoverageChange(tier.coverage)}
                className={`glass p-6 cursor-pointer hover:bg-white/20 transition-all space-y-3 ${
                  tier.recommended ? 'border-2 border-purple-500/50' : ''
                }`}
              >
                {tier.recommended && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
                    Recommended
                  </span>
                )}
                <p className="text-2xl font-bold">₹{tier.coverage?.toLocaleString('en-IN')}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Monthly</span>
                    <span className="font-semibold">₹{tier.monthly}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Annual</span>
                    <span className="font-semibold">₹{tier.annual}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
