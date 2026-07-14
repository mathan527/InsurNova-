/**
 * Dashboard.jsx — Production-Grade AI Dashboard
 * Full premium redesign with live AI panels.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Wallet, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import AIVisibilityPanel from '../components/AIVisibilityPanel';
import FraudPanel from '../components/FraudPanel';
import PlatformStats from '../components/PlatformStats';
import LiveMonitor from '../components/LiveMonitor';
import { policiesService, claimsService, userService } from '../services';

function StatCard({ title, value, icon: Icon, iconBg, link, delta }) {
  return (
    <div className="card group" style={{ cursor: link ? 'pointer' : 'default' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: iconBg }}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {delta && (
          <span className="text-xs font-semibold" style={{ color: delta > 0 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{title}</p>
      <p className="stat-value">{value}</p>
      {link && (
        <Link to={link} className="mt-3 flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all"
          style={{ color: 'var(--neon-cyan)' }}>
          View details <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activePolicies: 0, pendingClaims: 0, totalCoverage: 0, walletBalance: 0 });
  const [claimsData, setClaimsData] = useState([]);
  const [recentClaims, setRecentClaims] = useState([]);
  const [deliveryStats, setDeliveryStats] = useState(null);
  const [activeEventType, setActiveEventType] = useState(null);

  // AI panel features for dashboard (ambient)
  const aiFeatures = {
    rainfall: 85,
    aqi: 140,
    deliveryRate: 0.78,
    locationRisk: 0.48,
    temperature: 29,
    windSpeed: 18,
    humidity: 68,
  };

  useEffect(() => {
    async function load() {
      try {
        const [polRes, clmRes] = await Promise.allSettled([
          policiesService.getAll(),
          claimsService.getAll(),
        ]);

        const policies = polRes.status === 'fulfilled' ? (polRes.value.data?.policies || []) : [];
        const claims = clmRes.status === 'fulfilled' ? (clmRes.value.data?.claims || []) : [];

        const activePolicies = policies.filter(p => p.status === 'ACTIVE').length;
        const pendingClaims = claims.filter(c => c.status === 'PENDING' || c.status === 'PROCESSING').length;
        const totalCoverage = policies.reduce((s, p) => s + (p.coverage?.totalCoverageLimit || 0), 0);

        let walletBalance = 0;
        try {
          const wr = await userService.getWallet();
          walletBalance = wr.data?.balance || 0;
        } catch (_) {}

        setStats({ activePolicies, pendingClaims, totalCoverage, walletBalance });
        setRecentClaims(claims.slice(0, 5));
        setClaimsData(buildMonthly(claims));

        try {
          const pr = await userService.getProfile();
          setDeliveryStats(pr.data?.deliveryStats || null);
        } catch (_) {}
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const buildMonthly = (claims) => {
    const today = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      const month = d.toLocaleString('en-US', { month: 'short' });
      const monthClaims = claims.filter(c => {
        const cd = new Date(c.date);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      });
      return {
        month,
        approved: monthClaims.filter(c => c.status === 'APPROVED' || c.status === 'PAID').length,
        rejected: monthClaims.filter(c => c.status === 'REJECTED' || c.status === 'FRAUD_DETECTED').length,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Hero header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">AI Operations Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Live system overview — InsurNova Parametric Intelligence v2.1
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="live-dot" />
          <span className="text-xs font-semibold" style={{ color: 'var(--neon-green)' }}>ALL SYSTEMS ONLINE</span>
          <Link to="/simulator" className="btn-primary flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4" /> Run Simulation
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard title="Active Policies" value={stats.activePolicies}
          icon={Shield} iconBg="linear-gradient(135deg, #0095b6, #005a79)"
          link="/policies" delta={12} />
        <StatCard title="Pending Claims" value={stats.pendingClaims}
          icon={FileText} iconBg="linear-gradient(135deg, #f59e0b, #d97706)"
          link="/claims" />
        <StatCard title="Total Coverage" value={formatCurrency(stats.totalCoverage)}
          icon={TrendingUp} iconBg="linear-gradient(135deg, #6366f1, #4f46e5)" />
        <StatCard title="Wallet Balance" value={formatCurrency(stats.walletBalance)}
          icon={Wallet} iconBg="linear-gradient(135deg, #00ff88, #00b894)" />
      </div>

      {/* AI Panel + Platform Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AIVisibilityPanel features={aiFeatures} />
        </div>
        <PlatformStats
          isDisrupted={false}
          disruptionPct={0}
        />
      </div>

      {/* Fraud Panel + Claims Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FraudPanel claimFeatures={{ claimFrequency: 2, gpsAnomaly: false, timeSincePolicy: 45, claimAmountRatio: 0.4, eventType: 'RAIN' }} trigger={1} />

        <div className="card">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Claims Trend (6 months)
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={claimsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
              />
              <Bar dataKey="approved" fill="var(--neon-green)" name="Approved" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" fill="var(--neon-red)" name="Rejected" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent claims table */}
      {recentClaims.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Claims
            </h2>
            <Link to="/claims" className="text-sm" style={{ color: 'var(--neon-cyan)' }}>View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Event', 'Date', 'Amount', 'Status'].map(h => (
                    <th key={h} className="pb-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentClaims.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-3" style={{ color: 'var(--text-primary)' }}>{c.eventType || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.date ? formatDate(c.date) : '—'}</td>
                    <td className="font-mono" style={{ color: 'var(--neon-cyan)' }}>
                      {formatCurrency(c.amount?.paid || c.amount?.calculated || 0)}
                    </td>
                    <td>
                      <span className={`badge ${
                        c.status === 'PAID' || c.status === 'APPROVED' ? 'badge-success' :
                        c.status === 'PENDING' || c.status === 'PROCESSING' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Monitor */}
      <LiveMonitor externalLogs={[]} />

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/claims', icon: '📋', label: 'File a Claim', desc: 'Submit a new insurance claim', color: 'var(--neon-cyan)' },
          { to: '/simulator', icon: '⚡', label: 'Test Coverage', desc: 'Simulate event scenarios with AI', color: 'var(--neon-yellow)' },
          { to: '/ai-monitor', icon: '🧠', label: 'AI Monitor', desc: 'Live system & model health', color: 'var(--neon-purple)' },
        ].map((a, i) => (
          <Link
            key={i}
            to={a.to}
            className="card flex items-center gap-4 transition-all duration-200 group"
            style={{ textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${a.color}40`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
          >
            <div className="text-3xl">{a.icon}</div>
            <div>
              <p className="font-semibold" style={{ color: a.color }}>{a.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
