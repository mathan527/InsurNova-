'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { statusAPI, mockAPI } from '@/lib/api';
import { TrendingUp, Shield, AlertTriangle, Award, Cloud, Wind, Droplets, ThermometerSun, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [aqi, setAqi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [dashResponse, weatherResponse, aqiResponse] = await Promise.all([
        statusAPI.getDashboard(),
        mockAPI.getWeather('Mumbai').catch(() => null),
        mockAPI.getAQI('Mumbai').catch(() => null),
      ]);
      
      setDashboard(dashResponse.data.dashboard);
      setWeather(weatherResponse?.data);
      setAqi(aqiResponse?.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-card p-8">
          <p className="text-white/70">Unable to load dashboard data</p>
        </div>
      </div>
    );
  }

  const metrics = dashboard.metrics || {};
  const policy = dashboard.policy;
  const claims = dashboard.claims || {};
  const alerts = dashboard.alerts || [];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background Animation */}
      <div className="rain">
        {[...Array(30)].map((_, i) => (
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

      <div className="content-wrapper max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Welcome back, {user?.name}! 👋</h1>
          <p className="text-white/70">Here's your insurance overview</p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert: any, index: number) => (
              <div
                key={index}
                className={`glass-card p-4 flex items-start space-x-3 ${
                  alert.type === 'error' ? 'border-red-500/50' :
                  alert.type === 'warning' ? 'border-yellow-500/50' :
                  'border-blue-500/50'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                  alert.type === 'error' ? 'text-red-400' :
                  alert.type === 'warning' ? 'text-yellow-400' :
                  'text-blue-400'
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{alert.message}</p>
                  {alert.action && (
                    <button className="text-sm text-blue-400 hover:text-blue-300 mt-1">
                      {alert.action} →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Earnings Protected</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">₹{metrics.earnings_protected?.toLocaleString('en-IN') || 0}</p>
            <div className="text-xs text-green-400">Total payout received</div>
          </div>

          <div className="glass-card p-6 space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Active Coverage</span>
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold">₹{metrics.active_coverage?.toLocaleString('en-IN') || 0}</p>
            <div className="text-xs text-blue-400">
              {policy?.status === 'active' ? 'Policy active' : 'No active policy'}
            </div>
          </div>

          <div className="glass-card p-6 space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Risk Level</span>
              <AlertTriangle className={`w-5 h-5 ${getRiskColor(metrics.risk_level)}`} />
            </div>
            <p className={`text-3xl font-bold capitalize ${getRiskColor(metrics.risk_level)}`}>
              {metrics.risk_level || 'Low'}
            </p>
            <div className="text-xs text-white/60">Current environment risk</div>
          </div>

          <div className="glass-card p-6 space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Trust Score</span>
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold">{metrics.trust_score || 0}<span className="text-xl text-white/50">/100</span></p>
            <div className="w-full bg-white/10 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${metrics.trust_score || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Risk Widget */}
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <Activity className="w-6 h-6 text-blue-400" />
                <span>Live Risk Monitor</span>
              </h2>

              {/* Weather */}
              {weather?.data && (
                <div className="glass p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cloud className="w-5 h-5 text-blue-300" />
                      <span className="font-semibold">Weather</span>
                    </div>
                    <span className="text-sm text-white/60">{weather.data.condition}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <ThermometerSun className="w-4 h-4" />
                      <span>{weather.data.temperature}°C</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Droplets className="w-4 h-4" />
                      <span>{weather.data.rainfall_mm}mm</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Wind className="w-4 h-4" />
                      <span>{weather.data.wind_speed_kmh}km/h</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        weather.data.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                        weather.data.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {weather.data.severity}
                      </span>
                    </div>
                  </div>
                  {weather.data.alert && (
                    <div className="text-xs text-yellow-400 mt-2">⚠️ {weather.data.alert}</div>
                  )}
                </div>
              )}

              {/* AQI */}
              {aqi?.data && (
                <div className="glass p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wind className="w-5 h-5 text-gray-300" />
                      <span className="font-semibold">Air Quality</span>
                    </div>
                    <span className="text-sm text-white/60">{aqi.data.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{aqi.data.aqi}</span>
                    <span className={`px-3 py-1 rounded text-sm ${
                      aqi.data.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                      aqi.data.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                      aqi.data.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {aqi.data.severity}
                    </span>
                  </div>
                  <div className="text-xs text-white/60">{aqi.data.health_advice}</div>
                </div>
              )}
            </div>
          </div>

          {/* Center Column - Policy Card */}
          <div className="space-y-6">
            {policy ? (
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <span>Your Policy</span>
                </h2>

                <div className={`glass p-4 ${policy.status === 'active' ? 'border-2 border-green-500/50 glow-green' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      policy.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-500/50' :
                      'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                    }`}>
                      {policy.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-white/70 text-sm">Monthly Premium</span>
                      <p className="text-2xl font-bold">₹{policy.premium?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-white/70 text-sm">Coverage Amount</span>
                      <p className="text-2xl font-bold">₹{policy.coverage?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-white/70 text-sm">Claims Made</span>
                      <p className="text-xl font-semibold">{policy.claims_made || 0}</p>
                    </div>
                  </div>
                </div>

                {policy.covered_events && policy.covered_events.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm text-white/70">Covered Events</span>
                    <div className="flex flex-wrap gap-2">
                      {policy.covered_events.map((event: string) => (
                        <span key={event} className="px-3 py-1 glass-dark rounded-full text-sm capitalize">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {policy.end_date && (
                  <div className="text-xs text-white/60">
                    Valid until {new Date(policy.end_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card p-6 text-center space-y-4">
                <Shield className="w-16 h-16 text-white/30 mx-auto" />
                <h3 className="text-xl font-bold">No Active Policy</h3>
                <p className="text-white/60">Activate a policy to get coverage</p>
                <button 
                  onClick={() => router.push('/policy')}
                  className="btn-primary"
                >
                  View Plans
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Claims Timeline */}
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-2xl font-bold">Recent Claims</h2>

              {claims.recent && claims.recent.length > 0 ? (
                <div className="space-y-3">
                  {claims.recent.map((claim: any, index: number) => (
                    <div 
                      key={index} 
                      className={`glass p-4 space-y-2 hover:bg-white/15 transition-all cursor-pointer ${
                        claim.status === 'approved' || claim.status === 'paid' ? 'animate-pulse-glow' : ''
                      } ${
                        claim.status === 'rejected' ? 'animate-shake' : ''
                      }`}
                      onClick={() => router.push('/claims')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold capitalize">{claim.event?.type || claim.event_type}</span>
                        <span className={`status-badge status-${claim.status}`}>
                          {claim.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </span>
                        <span className="font-bold text-lg">₹{claim.amount?.toLocaleString('en-IN')}</span>
                      </div>
                      {claim.decision_reason && (
                        <p className="text-xs text-white/50 line-clamp-2">{claim.decision_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/60">
                  <p>No claims yet</p>
                  <p className="text-sm mt-2">Claims are processed automatically when events occur</p>
                </div>
              )}

              {claims.total > 0 && (
                <div className="glass p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Total Claims</span>
                    <span className="font-semibold">{claims.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Approved</span>
                    <span className="text-green-400 font-semibold">{claims.approved}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Total Payout</span>
                    <span className="font-bold">₹{claims.total_payout?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
