import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  FileText,
  Wallet,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { policiesService, claimsService, userService, deliveryService, fraudService, recommendationService } from '../services';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activePolicies: 0,
    pendingClaims: 0,
    totalCoverage: 0,
    walletBalance: 0,
  });

  const [recentClaims, setRecentClaims] = useState([]);

  const [claimsData, setClaimsData] = useState([]);

  const [statusData, setStatusData] = useState([]);

  const [userSection, setUserSection] = useState(null);
  const [financialSection, setFinancialSection] = useState(null);
  const [claimSection, setClaimSection] = useState(null);
  const [eventSection, setEventSection] = useState(null);
  const [riskSection, setRiskSection] = useState(null);
  const [fraudSection, setFraudSection] = useState(null);
  const [workSection, setWorkSection] = useState(null);
  const [analyticsSection, setAnalyticsSection] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch policies
        const policiesResponse = await policiesService.getAll();
        const policies = policiesResponse.data?.policies || [];
        const activePolicies = policies.filter(p => p.status === 'ACTIVE').length;
        const totalCoverage = policies.reduce((sum, p) => sum + (p.coverage?.totalCoverageLimit || 0), 0);

        // Fetch claims
        const claimsResponse = await claimsService.getAll();
        const claims = claimsResponse.data?.claims || [];
        const pendingClaims = claims.filter(c => c.status === 'PENDING' || c.status === 'PROCESSING').length;
        
        // Calculate status distribution
        const statusCounts = {
          APPROVED: claims.filter(c => c.status === 'APPROVED' || c.status === 'PAID').length,
          PENDING: claims.filter(c => c.status === 'PENDING' || c.status === 'PROCESSING').length,
          REJECTED: claims.filter(c => c.status === 'REJECTED' || c.status === 'FRAUD_DETECTED').length,
        };

        setStatusData([
          { name: 'Approved', value: statusCounts.APPROVED, color: '#10b981' },
          { name: 'Pending', value: statusCounts.PENDING, color: '#f59e0b' },
          { name: 'Rejected', value: statusCounts.REJECTED, color: '#ef4444' },
        ]);

        // Fetch wallet balance
        let walletBalance = 0;
        try {
          const walletResponse = await userService.getWallet();
          walletBalance = walletResponse.data?.balance || 0;
        } catch (err) {
          // Wallet endpoint might not exist, use default
          console.warn('Could not fetch wallet balance:', err.message);
        }

        // Set stats
        setStats({
          activePolicies,
          pendingClaims,
          totalCoverage,
          walletBalance,
        });

        // Set recent claims (last 5)
        setRecentClaims(claims.slice(0, 5));

        // Calculate monthly claims data for chart
        const monthlyData = calculateMonthlyData(claims);
        setClaimsData(monthlyData);

        // --- Enrich rich sections ---
        const profileResponse = await userService.getProfile();
        const user = profileResponse.data?.user;
        const deliveryStats = profileResponse.data?.deliveryStats;
        const activePolicy = policies.find((p) => p.status === 'ACTIVE') || policies[0] || null;

        // USER + POLICY DATA
        setUserSection({
          userName: user?.name || '—',
          platform: user?.platform || deliveryStats?.provider || '—',
          policyStatus: activePolicy?.status || '—',
          coverageAmount: activePolicy?.coverage?.maxPayoutPerEvent || 0,
          premium: activePolicy?.premium?.amount || 0,
          premiumFrequency: activePolicy?.premium?.frequency || 'weekly',
          validityStart: activePolicy?.startDate || null,
          validityEnd: activePolicy?.endDate || null,
        });

        // FINANCIAL DATA
        const totalPayoutReceived = claims.reduce(
          (sum, c) => sum + (c.amount?.paid || 0),
          0
        );
        const lastPayoutClaim = claims.find((c) => (c.amount?.paid || 0) > 0) || claims[0];
        const lastPayoutAmount = lastPayoutClaim?.amount?.paid || 0;
        const earningsImpacted = claims.reduce(
          (sum, c) => sum + (c.assessment?.lossVerification?.verifiedLoss || 0),
          0
        );
        const pendingPayout = claims
          .filter((c) => c.status === 'PENDING' || c.status === 'PROCESSING')
          .reduce((sum, c) => {
            const approved = c.amount?.approved ?? c.amount?.calculated ?? 0;
            const paid = c.amount?.paid || 0;
            return sum + Math.max(approved - paid, 0);
          }, 0);

        setFinancialSection({
          totalPayoutReceived,
          lastPayoutAmount,
          verifiedEarningsPerDay: deliveryStats?.dailyAmount || 0,
          earningsImpacted,
          pendingPayout,
        });

        // CLAIM DATA
        const approvedClaims = statusCounts.APPROVED;
        const rejectedClaims = statusCounts.REJECTED;
        const latestClaim = claims[0] || null;
        setClaimSection({
          totalClaims: claims.length,
          approvedClaims,
          rejectedClaims,
          latestStatus: latestClaim?.status || '—',
          history: claims,
        });

        // EVENT DATA
        setEventSection({
          eventType: latestClaim?.eventType || '—',
          severity: latestClaim?.severity ?? null,
          location: activePolicy?.location || user?.location || null,
          timestamp: latestClaim?.date || null,
        });

        // PLACEHOLDER RISK/FRAUD/WORK/ANALYTICS/NOTIFICATIONS/AI INSIGHTS
        setRiskSection({ riskScore: 0, riskLevel: 'medium', payoutPercentage: 0 });
        setFraudSection({
          trustScore: 100,
          fraudScore: 0,
          fraudStatus: 'safe',
          reason: 'No advanced risk checks yet',
        });
        setWorkSection({
          avgDailyEarnings: deliveryStats?.dailyAmount || 0,
          totalDeliveries: 0,
          workSchedule:
            deliveryStats?.startTime && deliveryStats?.endTime
              ? `${deliveryStats.startTime} – ${deliveryStats.endTime}`
              : '—',
          activeHours: 0,
        });
        setAnalyticsSection({
          earningsTrend: {
            daily: deliveryStats?.dailyAmount || 0,
            weekly: (deliveryStats?.dailyAmount || 0) * 6,
            monthly: (deliveryStats?.dailyAmount || 0) * 26,
          },
          claimsTrend: monthlyData,
          riskTrendScore: 0,
        });
        setNotifications([]);
        setAiInsights({
          recommendedPlan: null,
          bestWorkingHours:
            deliveryStats?.startTime && deliveryStats?.endTime
              ? `${deliveryStats.startTime} – ${deliveryStats.endTime}`
              : 'N/A',
          riskPrediction: 'medium',
          earningsInsights: `Est. daily earnings ₹${Math.round(
            deliveryStats?.dailyAmount || 0
          )}`,
        });

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Calculate monthly claims for chart
  const calculateMonthlyData = (claims) => {
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      
      const monthClaims = claims.filter(c => {
        const claimDate = new Date(c.date);
        return claimDate.getMonth() === date.getMonth() && 
               claimDate.getFullYear() === date.getFullYear();
      });

      last6Months.push({
        month: monthName,
        approved: monthClaims.filter(c => c.status === 'APPROVED' || c.status === 'PAID').length,
        rejected: monthClaims.filter(c => c.status === 'REJECTED' || c.status === 'FRAUD_DETECTED').length,
      });
    }

    return last6Months;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Policies',
      value: stats.activePolicies,
      icon: Shield,
      color: 'bg-blue-500',
      link: '/policies',
    },
    {
      title: 'Pending Claims',
      value: stats.pendingClaims,
      icon: FileText,
      color: 'bg-yellow-500',
      link: '/claims',
    },
    {
      title: 'Wallet Balance',
      value: formatCurrency(stats.walletBalance),
      icon: Wallet,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Welcome back! Here's your insurance overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              {stat.link && (
                <Link
                  to={stat.link}
                  className="mt-4 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  View details <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Claims Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={claimsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="approved" fill="#10b981" name="Approved" />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Claims Status Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Claims Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/claims"
          className="card hover:shadow-md transition-shadow flex items-center gap-4 p-4"
        >
          <div className="bg-primary-100 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">File a Claim</h3>
            <p className="text-sm text-gray-600">Submit a new insurance claim</p>
          </div>
        </Link>

        <Link
          to="/simulator"
          className="card hover:shadow-md transition-shadow flex items-center gap-4 p-4"
        >
          <div className="bg-green-100 p-3 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Test Coverage</h3>
            <p className="text-sm text-gray-600">Simulate event scenarios</p>
          </div>
        </Link>

        <Link
          to="/policies"
          className="card hover:shadow-md transition-shadow flex items-center gap-4 p-4"
        >
          <div className="bg-blue-100 p-3 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">View Policies</h3>
            <p className="text-sm text-gray-600">Manage your coverage</p>
          </div>
        </Link>
      </div>

      {/* Rich real-time sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {userSection && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">1. User &amp; Policy</h2>
            <p className="text-sm text-gray-600">{userSection.userName} · {userSection.platform}</p>
            <p className="text-sm text-gray-600 mt-2">Policy status: {userSection.policyStatus}</p>
            <p className="text-sm text-gray-600 mt-1">
              Coverage per event: {formatCurrency(userSection.coverageAmount)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Premium: {formatCurrency(userSection.premium)} / {userSection.premiumFrequency}
            </p>
          </div>
        )}

        {financialSection && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">2. Financial Data</h2>
            <p className="text-sm text-gray-600">
              Total payout received: {formatCurrency(financialSection.totalPayoutReceived)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Last payout: {formatCurrency(financialSection.lastPayoutAmount)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Verified earnings (per day): {formatCurrency(financialSection.verifiedEarningsPerDay)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Earnings impacted by events: {formatCurrency(financialSection.earningsImpacted)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Pending payout: {formatCurrency(financialSection.pendingPayout)}
            </p>
          </div>
        )}

        {claimSection && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">3. Claim Data</h2>
            <p className="text-sm text-gray-600">Total: {claimSection.totalClaims}</p>
            <p className="text-sm text-gray-600 mt-1">Approved: {claimSection.approvedClaims}</p>
            <p className="text-sm text-gray-600 mt-1">Rejected: {claimSection.rejectedClaims}</p>
            <p className="text-sm text-gray-600 mt-1">Latest status: {claimSection.latestStatus}</p>
          </div>
        )}


        {riskSection && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">5. Risk Data</h2>
            <p className="text-sm text-gray-600">Risk score: {riskSection.riskScore}</p>
            <p className="text-sm text-gray-600 mt-1">Level: {riskSection.riskLevel}</p>
            <p className="text-sm text-gray-600 mt-1">
              Payout percentage: {riskSection.payoutPercentage.toFixed(1)}%
            </p>
          </div>
        )}

        {fraudSection && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">6. Fraud / Trust</h2>
            <p className="text-sm text-gray-600">Trust score: {fraudSection.trustScore}</p>
            <p className="text-sm text-gray-600 mt-1">Fraud score: {fraudSection.fraudScore}</p>
            <p className="text-sm text-gray-600 mt-1">Status: {fraudSection.fraudStatus}</p>
            <p className="text-sm text-gray-600 mt-1">Reason: {fraudSection.reason}</p>
          </div>
        )}

        {workSection && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">7. Work &amp; Delivery</h2>
            <p className="text-sm text-gray-600">
              Avg daily earnings: {formatCurrency(workSection.avgDailyEarnings)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Total deliveries: {workSection.totalDeliveries}
            </p>
            <p className="text-sm text-gray-600 mt-1">Schedule: {workSection.workSchedule}</p>
            <p className="text-sm text-gray-600 mt-1">Active hours: {workSection.activeHours}</p>
          </div>
        )}


        {!!notifications.length && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">9. Notifications</h2>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {notifications.map((n, idx) => (
                <li key={idx}>{n.message}</li>
              ))}
            </ul>
          </div>
        )}

        {aiInsights && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">10. AI Insights</h2>
            {aiInsights.recommendedPlan && (
              <p className="text-sm text-gray-600">
                Recommended plan: {aiInsights.recommendedPlan.name} · Weekly premium:{' '}
                {formatCurrency(aiInsights.recommendedPlan.weeklyPremium)}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              Best working hours: {aiInsights.bestWorkingHours}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Risk prediction: {aiInsights.riskPrediction}
            </p>
            <p className="text-sm text-gray-600 mt-1">{aiInsights.earningsInsights}</p>
          </div>
        )}
      </div>
    </div>
  );
}
