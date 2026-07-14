'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { statusAPI, mockAPI } from '@/lib/api';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { 
  TrendingUp, Shield, AlertTriangle, Award, Cloud, Wind, 
  Droplets, ThermometerSun, Activity, ArrowRight, FileText 
} from 'lucide-react';

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
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-lg text-white/70">Unable to load dashboard data</p>
        </Card>
      </div>
    );
  }

  const metrics = dashboard.metrics || {};
  const policy = dashboard.policy;
  const claims = dashboard.claims || {};
  const alerts = dashboard.alerts || [];

  return (
    <div className="min-h-screen">
      <div className="section animate-fade-in">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Welcome back, <span className="text-gradient">{user?.name}</span>! 👋
          </h1>
          <p className="text-lg text-gray-400">Here's your insurance overview for today</p>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-3 animate-slide-in-right">
            {alerts.map((alert: any, index: number) => (
              <Card 
                key={index}
                className={`p-4 border-l-4 ${
                  alert.type === 'error' ? 'border-red-500 bg-red-500/10' :
                  alert.type === 'warning' ? 'border-amber-500 bg-amber-500/10' :
                  'border-blue-500 bg-blue-500/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    alert.type === 'error' ? 'text-red-400' :
                    alert.type === 'warning' ? 'text-amber-400' :
                    'text-blue-400'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-white">{alert.message}</p>
                    {alert.action && (
                      <button className="text-sm text-primary-400 hover:text-primary-300 mt-2 inline-flex items-center gap-1 transition-colors">
                        {alert.action} <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid-stats mb-12 animate-slide-up">
          <StatCard
            icon={TrendingUp}
            label="Earnings Protected"
            value={`₹${metrics.earnings_protected?.toLocaleString('en-IN') || 0}`}
            iconColor="text-emerald-400"
          />
          
          <StatCard
            icon={Shield}
            label="Active Coverage"
            value={`₹${metrics.active_coverage?.toLocaleString('en-IN') || 0}`}
            iconColor="text-blue-400"
          />
          
          <StatCard
            icon={AlertTriangle}
            label="Risk Level"
            value={(metrics.risk_level || 'Low').toUpperCase()}
            iconColor={
              metrics.risk_level === 'critical' ? 'text-red-400' :
              metrics.risk_level === 'high' ? 'text-orange-400' :
              metrics.risk_level === 'medium' ? 'text-amber-400' :
              'text-emerald-400'
            }
          />
          
          <StatCard
            icon={Award}
            label="Trust Score"
            value={`${metrics.trust_score || 0}/100`}
            iconColor="text-purple-400"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Risk Monitor */}
          <Card className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold">Live Risk Monitor</h3>
            </div>

            <div className="space-y-4">
              {/* Weather Widget */}
              {weather?.data && (
                <div className="glass-subtle p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-blue-300" />
                      <span className="font-semibold">Weather</span>
                    </div>
                    <span className={`badge ${
                      weather.data.severity === 'high' ? 'badge-danger' :
                      weather.data.severity === 'medium' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {weather.data.severity}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <ThermometerSun className="w-4 h-4 text-amber-400" />
                      <span>{weather.data.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <span>{weather.data.rainfall_mm}mm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-gray-400" />
                      <span>{weather.data.wind_speed_kmh}km/h</span>
                    </div>
                    <div className="text-gray-400">{weather.data.condition}</div>
                  </div>
                  
                  {weather.data.alert && (
                    <div className="text-xs badge-warning w-full justify-start">
                      ⚠️ {weather.data.alert}
                    </div>
                  )}
                </div>
              )}

              {/* AQI Widget */}
              {aqi?.data && (
                <div className="glass-subtle p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="w-5 h-5 text-gray-300" />
                      <span className="font-semibold">Air Quality</span>
                    </div>
                    <span className={`badge ${
                      aqi.data.severity === 'critical' ? 'badge-danger' :
                      aqi.data.severity === 'high' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {aqi.data.severity}
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{aqi.data.aqi}</span>
                    <span className="text-sm text-gray-400">{aqi.data.category}</span>
                  </div>
                  
                  <p className="text-xs text-gray-400">{aqi.data.health_advice}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Policy Card */}
          <Card className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Your Policy</h3>
            </div>

            {policy ? (
              <div className="space-y-4">
                <div className={`glass-subtle p-4 rounded-xl border-2 ${
                  policy.status === 'active' 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : 'border-gray-500/50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-400">Status</span>
                    <span className={`badge ${
                      policy.status === 'active' ? 'badge-success' : 'badge-info'
                    }`}>
                      {policy.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Monthly Premium</p>
                      <p className="text-2xl font-bold">₹{policy.premium?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Coverage Amount</p>
                      <p className="text-2xl font-bold">₹{policy.coverage?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {policy.covered_events && policy.covered_events.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Covered Events</p>
                    <div className="flex flex-wrap gap-2">
                      {policy.covered_events.map((event: string) => (
                        <span key={event} className="badge badge-info capitalize">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  variant="secondary" 
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => router.push('/policy')}
                  className="w-full"
                >
                  Manage Policy
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <Shield className="w-16 h-16 text-gray-500 mx-auto" />
                <div>
                  <h4 className="text-lg font-semibold mb-2">No Active Policy</h4>
                  <p className="text-sm text-gray-400">Activate a plan to get coverage</p>
                </div>
                <Button 
                  variant="primary" 
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => router.push('/policy')}
                >
                  View Plans
                </Button>
              </div>
            )}
          </Card>

          {/* Recent Claims */}
          <Card className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold">Recent Claims</h3>
            </div>

            {claims.recent && claims.recent.length > 0 ? (
              <div className="space-y-3">
                {claims.recent.slice(0, 5).map((claim: any, index: number) => (
                  <div 
                    key={index} 
                    className="glass-subtle p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
                    onClick={() => router.push('/claims')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold capitalize group-hover:text-primary-400 transition-colors">
                        {claim.event?.type || claim.event_type}
                      </span>
                      <span className={`badge ${
                        claim.status === 'approved' || claim.status === 'paid' ? 'badge-success' :
                        claim.status === 'rejected' ? 'badge-danger' :
                        claim.status === 'pending' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </span>
                      <span className="font-bold">₹{claim.amount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}

                {claims.total > 0 && (
                  <div className="glass-subtle p-4 rounded-xl mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Claims</span>
                      <span className="font-semibold">{claims.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Approved</span>
                      <span className="text-emerald-400 font-semibold">{claims.approved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Payout</span>
                      <span className="font-bold">₹{claims.total_payout?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No claims yet</p>
                <p className="text-sm mt-1">Claims are processed automatically</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
