import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Edit2, MapPin, Plus, Sparkles, X, XCircle } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import { policiesService } from '../services';

const DEFAULT_POLICIES = [
  {
    policyId: 'POLICY-1-DEFAULT',
    policyType: 'policy 1',
    status: 'ACTIVE',
    coverage: {
      eventTypes: ['RAIN', 'HEAT', 'POLLUTION', 'FLOOD'],
      maxPayoutPerEvent: 1000,
      totalCoverageLimit: 10000,
      deductible: 0,
    },
    premium: {
      amount: 25,
      frequency: 'weekly',
      nextDueDate: new Date('2026-04-11'),
      isPaid: true,
    },
    startDate: new Date('2026-04-04'),
    endDate: new Date('2027-04-03'),
    location: { city: 'Bengaluru', state: 'KA', country: 'India' },
  },
];

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    policyType: '',
    eventTypes: [],
    maxPayoutPerEvent: 1000,
    totalCoverageLimit: 10000,
    deductible: 50,
    premiumFrequency: 'weekly',
    trustScore: 65,
    riskLevel: 'medium',
  });

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await policiesService.getAll();
        const apiPolicies = response.data?.policies || [];
        if (apiPolicies.length > 0) {
          setPolicies(apiPolicies);
        } else {
          // Fallback demo policy when none exist in backend
          setPolicies(DEFAULT_POLICIES);
        }
      } catch (err) {
        // Keep default demo policy on error
        setPolicies(DEFAULT_POLICIES);
      }
    };

    fetchPolicies();
  }, []);

  const eventTypeOptions = [
    { value: 'RAIN', label: 'Rain' },
    { value: 'HEAT', label: 'Heat Wave' },
    { value: 'POLLUTION', label: 'Pollution' },
    { value: 'FLOOD', label: 'Flood' },
    { value: 'STORM', label: 'Storm' },
    { value: 'CURFEW', label: 'Curfew' },
    { value: 'PANDEMIC', label: 'PANDEMIC (50% Payout)' },
  ];

  const openCreateModal = () => {
    setEditingPolicy(null);
    setFormData({
      policyType: '',
      eventTypes: [],
      maxPayoutPerEvent: 1000,
      totalCoverageLimit: 10000,
      deductible: 50,
      premiumFrequency: 'weekly',
      trustScore: 65,
      riskLevel: 'medium',
    });
    setShowModal(true);
  };

  const openEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      policyType: policy.policyType,
      eventTypes: policy.coverage.eventTypes,
      maxPayoutPerEvent: policy.coverage.maxPayoutPerEvent,
      totalCoverageLimit: policy.coverage.totalCoverageLimit,
      deductible: policy.coverage.deductible,
      premiumFrequency: policy.premium.frequency,
      trustScore: policy.trustScore || 65,
      riskLevel: policy.riskLevel || 'medium',
    });
    setShowModal(true);
  };

  const toggleEventType = (eventType) => {
    if (formData.eventTypes.includes(eventType)) {
      setFormData({
        ...formData,
        eventTypes: formData.eventTypes.filter((e) => e !== eventType),
      });
    } else {
      setFormData({
        ...formData,
        eventTypes: [...formData.eventTypes, eventType],
      });
    }
  };

  const calculatePremium = () => {
    const baseWeeklyPremium = 10;
    const riskAdjustments = { low: 2, medium: 6, high: 12 };
    const trustDiscounts = { low: 4, medium: 3, high: 2 };

    const riskAdjustment = riskAdjustments[formData.riskLevel] || 6;
    const trustDiscount = trustDiscounts[formData.riskLevel] || 3;
    const eventMultiplier = Math.max(1, Math.round((formData.eventTypes.length || 1) * 0.7));

    const weeklyPremium = Math.max(baseWeeklyPremium + (riskAdjustment * eventMultiplier) - trustDiscount, 1);

    return weeklyPremium;
  };

  const getDisplayEndDate = (policy) => {
    const start = new Date(policy.startDate);
    const end = new Date(policy.endDate);
    const oneDayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((end - start) / oneDayMs);

    // For older policies stored as start + 365 days, show an inclusive range by subtracting one day
    if (diffDays >= 365) {
      return new Date(end.getTime() - oneDayMs);
    }

    return end;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.eventTypes.length === 0) {
      return;
    }

    const newPolicy = {
      policyId: editingPolicy ? editingPolicy.policyId : `POL-${Date.now()}`,
      policyType: formData.policyType || 'Custom Policy',
      status: 'ACTIVE',
      coverage: {
        eventTypes: formData.eventTypes,
        maxPayoutPerEvent: formData.maxPayoutPerEvent,
        totalCoverageLimit: formData.totalCoverageLimit,
        deductible: formData.deductible,
      },
      premium: {
        amount: calculatePremium(),
        frequency: 'weekly',
        nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isPaid: true,
      },
      pricingModel: {
        currency: 'INR',
        formula: 'Weekly Premium = Base Premium + Risk Adjustment - Trust Discount',
      },
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      location: { city: 'Bengaluru', state: 'KA', country: 'India' },
    };

    if (editingPolicy) {
      setPolicies(
        policies.map((p) => (p.policyId === editingPolicy.policyId ? newPolicy : p))
      );
    } else {
      setPolicies([...policies, newPolicy]);
    }

    setShowModal(false);
  };

  const filteredPolicies = policies.filter(
    (policy) =>
      !(
        policy.policyType === 'PARAMETRIC' &&
        Array.isArray(policy.coverage?.eventTypes) &&
        policy.coverage.eventTypes.includes('ANY')
      )
  );

  const visiblePolicies =
    filteredPolicies.length > 0 ? filteredPolicies : DEFAULT_POLICIES;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policies</h1>
          <p className="text-gray-600 mt-1">Manage your insurance</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Policy
        </button>
      </div>

      {/* Hide backend PARAMETRIC/ANY policy cards from this view; if that leaves nothing, show default policy 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visiblePolicies.map((policy) => (
          <div key={policy.policyId} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{policy.policyType}</h3>
                <p className="text-sm text-gray-500">{policy.policyId}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(policy)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit policy"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <span className={`badge badge-${getStatusColor(policy.status)}`}>
                  {policy.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Max Payout per Event</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(policy.coverage.maxPayoutPerEvent)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Coverage Limit</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(policy.coverage.totalCoverageLimit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Deductible</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(policy.coverage.deductible)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Covered Events</p>
              <div className="flex flex-wrap gap-2">
                {policy.coverage.eventTypes.map((event) => (
                  <span key={event} className="badge badge-info">
                    {event}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Premium</span>
                <span className="font-bold text-lg text-gray-900">
                  {formatCurrency(policy.premium.amount)}/{policy.premium.frequency}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Trend pricing applied in INR
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Next Payment</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900">
                    {formatDate(policy.premium.nextDueDate)}
                  </span>
                  {policy.premium.isPaid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {policy.location.city}, {policy.location.state}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(policy.startDate)} - {formatDate(getDisplayEndDate(policy))}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Standard Exclusions</p>
              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                <li>War, civil unrest, or terrorism</li>
                <li>Pandemics / epidemics and nationwide government lockdowns (claims capped at 50% payout)</li>
                <li>Nuclear or radioactive events</li>
                <li>Full platform shutdown (e.g., Swiggy/Zomato outage)</li>
              </ul>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Policy Name</label>
                <input
                  type="text"
                  value={formData.policyType}
                  onChange={(e) => setFormData({ ...formData, policyType: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Custom Coverage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Event Types to Cover
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {eventTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleEventType(option.value)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        formData.eventTypes.includes(option.value)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Payout per Event
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    value={formData.maxPayoutPerEvent}
                    onChange={(e) =>
                      setFormData({ ...formData, maxPayoutPerEvent: parseInt(e.target.value || '0', 10) })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Coverage Limit
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={formData.totalCoverageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, totalCoverageLimit: parseInt(e.target.value || '0', 10) })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deductible</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="25"
                    value={formData.deductible}
                    onChange={(e) =>
                      setFormData({ ...formData, deductible: parseInt(e.target.value || '0', 10) })
                    }
                    className="input-field"
                    required
                  />
                </div>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trust Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={formData.trustScore}
                      onChange={(e) => setFormData({ ...formData, trustScore: parseInt(e.target.value || '0', 10) })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                    <select
                      value={formData.riskLevel}
                      onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Premium Payment Frequency
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="weekly"
                      checked={formData.premiumFrequency === 'weekly'}
                      onChange={(e) => setFormData({ ...formData, premiumFrequency: e.target.value })}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span>Weekly</span>
                  </label>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#0095B6] to-[#007798] rounded-xl p-6 text-white">
                <p className="text-sm opacity-90 mb-2">Estimated Premium</p>
                <p className="text-4xl font-bold">{formatCurrency(calculatePremium())}</p>
                <p className="text-sm opacity-75 mt-2">per week</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary">
                  {editingPolicy ? 'Update Policy' : 'Create Policy'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
