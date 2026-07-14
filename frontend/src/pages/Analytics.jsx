import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('6months');

  const claimsOverTime = [
    { month: 'Oct', claims: 12, payouts: 8500 },
    { month: 'Nov', claims: 15, payouts: 10200 },
    { month: 'Dec', claims: 10, payouts: 7800 },
    { month: 'Jan', claims: 18, payouts: 12500 },
    { month: 'Feb', claims: 14, payouts: 9800 },
    { month: 'Mar', claims: 16, payouts: 11200 },
  ];

  const eventTypeDistribution = [
    { name: 'Rain', value: 35, color: '#3b82f6' },
    { name: 'Heat', value: 25, color: '#ef4444' },
    { name: 'Pollution', value: 20, color: '#10b981' },
    { name: 'Storm', value: 15, color: '#f59e0b' },
    { name: 'Flood', value: 5, color: '#8b5cf6' },
  ];

  const approvalRates = [
    { month: 'Oct', approved: 85, rejected: 15 },
    { month: 'Nov', approved: 88, rejected: 12 },
    { month: 'Dec', approved: 92, rejected: 8 },
    { month: 'Jan', approved: 87, rejected: 13 },
    { month: 'Feb', approved: 90, rejected: 10 },
    { month: 'Mar', approved: 91, rejected: 9 },
  ];

  const stats = [
    {
      title: 'Approval Rate',
      value: '89%',
      change: '+3.2%',
      trending: 'up',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Avg Processing Time',
      value: '2.4s',
      change: '-15%',
      trending: 'up',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Fraud Detection',
      value: '98.5%',
      change: '+1.2%',
      trending: 'up',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Insights and trends from your insurance data</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="input-field w-auto"
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span
                  className={`text-sm font-medium ${
                    stat.trending === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims & Payouts Over Time */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Claims & Payouts Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={claimsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="claims"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Claims"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="payouts"
                stroke="#10b981"
                strokeWidth={2}
                name="Payouts ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Event Type Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {eventTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval vs Rejection Rate</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={approvalRates}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="approved" fill="#10b981" name="Approved %" />
            <Bar dataKey="rejected" fill="#ef4444" name="Rejected %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📈 Top Insight</h3>
          <p className="text-blue-800">
            Claims have increased by 15% this month, primarily driven by rain events in urban
            areas. Premium adjustments follow the formula: Weekly Premium = Base Premium + Risk Adjustment - Trust Discount.
          </p>
        </div>

        <div className="card bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Performance</h3>
          <p className="text-green-800">
            Average processing time has decreased by 15% thanks to ML model optimizations. Fraud
            detection accuracy remains at 98.5%.
          </p>
        </div>
      </div>
    </div>
  );
}
