import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService, claimsService } from '../services';
import { formatCurrency } from '../utils/helpers';

export default function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+1 234 567 8900',
    occupation: 'Delivery Driver',
    city: 'New York',
    state: 'NY',
    country: 'USA',
  });

  const [riskProfile, setRiskProfile] = useState({
    churnScore: 0.15,
    fraudRisk: 0.08,
    claimHistory: {
      total: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
    },
  });

  const [wallet, setWallet] = useState({ balance: 0, currency: 'INR' });

  const approvalRate =
    riskProfile.claimHistory.total > 0
      ? (riskProfile.claimHistory.approved / riskProfile.claimHistory.total) * 100
      : 0;

  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [deliveryError, setDeliveryError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await userService.getProfile();
        const { user: backendUser, deliveryStats } = response.data || {};

        if (!isMounted) return;

        if (backendUser) {
          setFormData((prev) => ({
            ...prev,
            name: backendUser.name || prev.name,
            email: backendUser.email || prev.email,
            phone: backendUser.phone || prev.phone,
            occupation: backendUser.occupation || prev.occupation,
            city: backendUser.location?.city || prev.city,
            state: backendUser.location?.state || prev.state,
            country: backendUser.location?.country || prev.country,
          }));
        }

        if (deliveryStats) {
          setDeliveryInfo(deliveryStats);
        } else {
          setDeliveryInfo(null);
        }

        // Load wallet balance for profile view
        try {
          const walletResponse = await userService.getWallet();
          if (isMounted) {
            setWallet({
              balance: walletResponse.data?.balance || 0,
              currency: walletResponse.data?.currency || 'INR',
            });
          }
        } catch (walletError) {
          if (isMounted) {
            setWallet({ balance: 2450.75, currency: 'INR' });
          }
        }
      } catch (error) {
        if (isMounted) {
          setDeliveryError('Unable to load delivery information from providers (mock).');
        }
      } finally {
        if (isMounted) {
          setLoadingDelivery(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadClaimsSummary() {
      try {
        const response = await claimsService.getAll();
        const apiClaims = response.data?.claims || [];

        if (!isMounted) return;

        const summary = apiClaims.reduce(
          (acc, claim) => {
            acc.total += 1;
            const status = (claim.status || '').toUpperCase();

            if (status === 'APPROVED' || status === 'PAID') {
              acc.approved += 1;
            } else if (status === 'PENDING') {
              acc.pending += 1;
            } else if (status === 'REJECTED') {
              acc.rejected += 1;
            }

            return acc;
          },
          { total: 0, approved: 0, pending: 0, rejected: 0 }
        );

        setRiskProfile((prev) => ({
          ...prev,
          claimHistory: summary,
        }));
      } catch (error) {
        // If claims fail to load, keep default zeros
        // Optionally log error to console for debugging
        // console.error('Failed to load claims summary', error);
      }

      return () => {
        isMounted = false;
      };
    }

    loadClaimsSummary();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // TODO: API call to save profile
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary">
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} className="btn-primary">
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </div>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!editing}
                className="input-field disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </div>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editing}
                className="input-field disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </div>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!editing}
                className="input-field disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Occupation
                </div>
              </label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                disabled={!editing}
                className="input-field disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!editing}
                  className="input-field disabled:bg-gray-50 disabled:text-gray-600"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={!editing}
                  className="input-field disabled:bg-gray-50 disabled:text-gray-600"
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={!editing}
                  className="input-field disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KYC Status */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Verification</h3>
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Verified</p>
                <p className="text-sm text-green-700">Identity confirmed</p>
              </div>
            </div>
          </div>

          {/* Wallet */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Balance</h3>
            <div className="text-center p-6 bg-gradient-to-br from-[#0095B6] to-[#007798] rounded-xl text-white">
              <p className="text-sm opacity-90 mb-2">Available Balance</p>
              <p className="text-3xl font-bold">{formatCurrency(wallet.balance)}</p>
            </div>
          </div>

          {/* Delivery Activity (Mock from Swiggy/Zomato APIs) */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Activity</h3>
            <p className="text-xs text-gray-500 mb-3">
              Data fetched from mock Swiggy/Zomato and other e-commerce APIs.
            </p>
            {loadingDelivery ? (
              <p className="text-sm text-gray-500">Loading delivery details...</p>
            ) : deliveryError ? (
              <p className="text-sm text-red-500">{deliveryError}</p>
            ) : deliveryInfo ? (
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Provider:</span> {deliveryInfo.provider}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {deliveryInfo.date}
                </p>
                <p>
                  <span className="font-medium">Start Time:</span> {deliveryInfo.startTime}
                </p>
                <p>
                  <span className="font-medium">End Time:</span> {deliveryInfo.endTime}
                </p>
                <p>
                  <span className="font-medium">Amount per Day:</span> {deliveryInfo.currency}{' '}
                  {deliveryInfo.dailyAmount}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No delivery data available for today.</p>
            )}
          </div>
        </div>
      </div>

      {/* Risk Profile */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Risk Profile</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-2">Churn Score</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-blue-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${riskProfile.churnScore * 100}%` }}
                />
              </div>
              <span className="text-lg font-bold text-blue-700">
                {(riskProfile.churnScore * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-2">Low risk of cancellation</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-900 font-medium mb-2">Fraud Risk</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-green-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${riskProfile.fraudRisk * 100}%` }}
                />
              </div>
              <span className="text-lg font-bold text-green-700">
                {(riskProfile.fraudRisk * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-green-700 mt-2">Very low fraud risk</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-900 font-medium mb-2">Approval Rate</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-purple-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full"
                  style={{
                    width: `${approvalRate}%`,
                  }}
                />
              </div>
              <span className="text-lg font-bold text-purple-700">
                {approvalRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-purple-700 mt-2">Excellent claim history</p>
          </div>
        </div>

        {/* Claim History Summary */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim History</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{riskProfile.claimHistory.total}</p>
              <p className="text-sm text-gray-600">Total Claims</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {riskProfile.claimHistory.approved}
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {riskProfile.claimHistory.pending}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{riskProfile.claimHistory.rejected}</p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
