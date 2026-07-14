'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, TrendingDown, Shield, AlertTriangle, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/dashboard');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.admin_stats);
    } catch (error) {
      console.error('Error loading admin stats:', error);
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-card p-8">
          <p className="text-white/70">Unable to load admin data</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#22c55e', '#ef4444', '#eab308', '#8b5cf6'];

  // Prepare chart data
  const claimsChartData = [
    { name: 'Approved', value: stats.claims.approved },
    { name: 'Rejected', value: stats.claims.rejected },
    { name: 'Pending', value: stats.claims.pending },
  ];

  const eventTypeData = stats.claims_by_event?.map((item: any) => ({
    name: item._id,
    claims: item.count,
    amount: item.total_amount || 0,
  })) || [];

  const exclusionImpact = [
    { name: 'Fully Excluded', value: stats.exclusions.total_excluded },
    { name: 'Partial Coverage', value: stats.exclusions.partial_coverage },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Pollution Fog Background */}
      <div className="pollution-fog"></div>

      <div className="content-wrapper max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-white/70 text-lg">Platform analytics and insights</p>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Total Users</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold">{stats.users.total}</p>
            <div className="text-xs text-green-400">{stats.users.active} active</div>
          </div>

          <div className="glass-card p-6 space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Premium Collected</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">₹{stats.financial.total_premium_collected?.toLocaleString('en-IN')}</p>
            <div className="text-xs text-white/60">Total revenue</div>
          </div>

          <div className="glass-card p-6 space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Claims Paid</span>
              <DollarSign className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-3xl font-bold">₹{stats.financial.total_claims_paid?.toLocaleString('en-IN')}</p>
            <div className="text-xs text-white/60">Total payouts</div>
          </div>

          <div className="glass-card p-6 space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Loss Ratio</span>
              <TrendingDown className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold">{stats.financial.loss_ratio}%</p>
            <div className="text-xs text-white/60">Claims/Premium ratio</div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-3xl font-bold">Financial Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 space-y-4">
              <div className="flex items-center space-x-2 text-white/70">
                <Shield className="w-5 h-5" />
                <span>Total Coverage</span>
              </div>
              <p className="text-4xl font-bold">₹{stats.financial.total_coverage_provided?.toLocaleString('en-IN')}</p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="glass p-6 space-y-4">
              <div className="flex items-center space-x-2 text-white/70">
                <TrendingUp className="w-5 h-5" />
                <span>Revenue</span>
              </div>
              <p className="text-4xl font-bold">₹{stats.financial.total_premium_collected?.toLocaleString('en-IN')}</p>
              <div className="text-sm text-green-400">Premium collected</div>
            </div>

            <div className="glass p-6 space-y-4">
              <div className="flex items-center space-x-2 text-white/70">
                <DollarSign className="w-5 h-5" />
                <span>Expenses</span>
              </div>
              <p className="text-4xl font-bold">₹{stats.financial.total_claims_paid?.toLocaleString('en-IN')}</p>
              <div className="text-sm text-red-400">Claims paid out</div>
            </div>
          </div>

          <div className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Profitability</h3>
              <span className={`text-2xl font-bold ${
                stats.financial.total_premium_collected - stats.financial.total_claims_paid > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ₹{(stats.financial.total_premium_collected - stats.financial.total_claims_paid)?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all ${
                  stats.financial.loss_ratio < 70 ? 'bg-green-500' : 
                  stats.financial.loss_ratio < 85 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}
                style={{ width: `${100 - stats.financial.loss_ratio}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-white/60 mt-2">
              <span>Healthy: &lt;70%</span>
              <span>Caution: 70-85%</span>
              <span>Risk: &gt;85%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Claims Statistics */}
          <div className="glass-card p-8 space-y-6">
            <h2 className="text-2xl font-bold">Claims Statistics</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="glass p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.claims.approved}</p>
                <p className="text-xs text-white/60">Approved</p>
              </div>
              <div className="glass p-4 text-center">
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.claims.rejected}</p>
                <p className="text-xs text-white/60">Rejected</p>
              </div>
              <div className="glass p-4 text-center">
                <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.claims.pending}</p>
                <p className="text-xs text-white/60">Pending</p>
              </div>
            </div>

            <div className="glass p-6">
              <h3 className="text-lg font-bold mb-4 text-center">Claims Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={claimsChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {claimsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Claims by Event Type */}
          <div className="glass-card p-8 space-y-6">
            <h2 className="text-2xl font-bold">Claims by Event Type</h2>

            {eventTypeData.length > 0 ? (
              <div className="glass p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="claims" fill="#8b5cf6" name="Claims Count" />
                    <Bar dataKey="amount" fill="#22c55e" name="Total Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="glass p-6 text-center text-white/60">
                No claims data available yet
              </div>
            )}

            <div className="space-y-2">
              {eventTypeData.map((event: any, index: number) => (
                <div key={index} className="glass p-4 flex justify-between items-center">
                  <span className="font-semibold capitalize">{event.name}</span>
                  <div className="text-right">
                    <p className="font-bold">{event.claims} claims</p>
                    <p className="text-sm text-white/60">₹{event.amount?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Exclusion Impact */}
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-3xl font-bold">Exclusion Logic Impact</h2>
          <p className="text-white/60">Financial sustainability through smart exclusions</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 space-y-4 border-2 border-red-500/30">
              <div className="flex items-center space-x-2 text-red-400">
                <XCircle className="w-6 h-6" />
                <span className="font-bold text-lg">Fully Excluded</span>
              </div>
              <p className="text-5xl font-bold">{stats.exclusions.total_excluded}</p>
              <p className="text-sm text-white/60">Claims blocked (war, terrorism)</p>
            </div>

            <div className="glass p-6 space-y-4 border-2 border-yellow-500/30">
              <div className="flex items-center space-x-2 text-yellow-400">
                <AlertTriangle className="w-6 h-6" />
                <span className="font-bold text-lg">Partial Coverage</span>
              </div>
              <p className="text-5xl font-bold">{stats.exclusions.partial_coverage}</p>
              <p className="text-sm text-white/60">Reduced payouts (pandemic, lockdown)</p>
            </div>

            <div className="glass p-6 space-y-4 border-2 border-green-500/30">
              <div className="flex items-center space-x-2 text-green-400">
                <TrendingUp className="w-6 h-6" />
                <span className="font-bold text-lg">Money Saved</span>
              </div>
              <p className="text-5xl font-bold">₹{stats.exclusions.money_saved?.toLocaleString('en-IN')}</p>
              <p className="text-sm text-white/60">Protected from catastrophic events</p>
            </div>
          </div>
        </div>

        {/* Fraud Detection */}
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-3xl font-bold">Fraud Detection Impact</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Fraud Cases Detected</h3>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-6xl font-bold text-red-400 mb-2">{stats.fraud.detected}</p>
              <p className="text-lg text-white/60">{stats.fraud.percentage}% of total claims</p>
              <div className="w-full bg-white/10 rounded-full h-3 mt-4">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats.fraud.percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="glass p-6">
              <h3 className="text-xl font-bold mb-4">Fraud Checks</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 glass-dark rounded-lg">
                  <span>Trust Score Check</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex items-center justify-between p-3 glass-dark rounded-lg">
                  <span>Event Timing Check</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex items-center justify-between p-3 glass-dark rounded-lg">
                  <span>Claim Frequency Check</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex items-center justify-between p-3 glass-dark rounded-lg">
                  <span>Source Verification</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Claims */}
        {stats.recent_claims && stats.recent_claims.length > 0 && (
          <div className="glass-card p-8 space-y-6">
            <h2 className="text-2xl font-bold">Recent Claims</h2>
            <div className="space-y-3">
              {stats.recent_claims.slice(0, 5).map((claim: any, index: number) => (
                <div key={index} className="glass p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{claim.user?.name || 'Unknown User'}</p>
                    <p className="text-sm text-white/60 capitalize">{claim.event?.type} • {new Date(claim.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-bold">₹{claim.amount?.toLocaleString('en-IN')}</p>
                  </div>
                  <span className={`status-badge status-${claim.status}`}>
                    {claim.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
