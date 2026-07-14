import { useState, useEffect } from 'react';
import { Search, Filter, Eye, X } from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusColor, formatEventType } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { claimsService } from '../services';

const getClaimAmount = (claim) => {
  if (!claim?.amount) return 0;
  if (typeof claim.amount === 'number') return claim.amount;
  return claim.amount.paid || claim.amount.approved || claim.amount.calculated || 0;
};

export default function Claims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedClaim, setSelectedClaim] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadClaims() {
      try {
        const response = await claimsService.getAll();
        const apiClaims = response.data?.claims || [];
        if (!isMounted) return;
        setClaims(
          apiClaims.map((claim) => ({
            ...claim,
            date: claim.date ? new Date(claim.date) : new Date(),
          }))
        );
      } catch (err) {
        if (isMounted) {
          setError('Failed to load claims from backend. Showing none.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadClaims();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.eventType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || claim.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED', 'FRAUD_DETECTED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Claims</h1>
          <p className="text-gray-600 mt-1">Manage and track your insurance claims in INR</p>
        </div>
      </div>

      <div className="card border-l-4 border-l-[#0095B6]">
        <p className="text-sm text-gray-700">
          Claim payouts are aligned to pricing and policy trends. Amounts are displayed in INR.
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by claim ID or event type..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Claim ID
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Event Type
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Severity
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">
                      No claims found
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
                    <tr key={claim.claimId} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {claim.claimId}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{formatEventType(claim.eventType)}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${claim.severity}%` }}
                            />
                          </div>
                          <span>{claim.severity}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {formatCurrency(getClaimAmount(claim), 'INR')}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`badge badge-${getStatusColor(claim.status)}`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {formatDateTime(claim.date)}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{selectedClaim.claimId}</h2>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                <span className={`badge badge-${getStatusColor(selectedClaim.status)} text-lg`}>
                  {selectedClaim.status}
                </span>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Event Type</h3>
                  <p className="text-gray-900">{formatEventType(selectedClaim.eventType)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Severity</h3>
                  <p className="text-gray-900">{selectedClaim.severity}%</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Calculated Amount</h3>
                  <p className="text-gray-900 font-semibold">
                    {formatCurrency(getClaimAmount(selectedClaim), 'INR')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date</h3>
                  <p className="text-gray-900">{formatDateTime(selectedClaim.date)}</p>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Risk Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(selectedClaim.assessment.riskScore * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payout %</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedClaim.assessment.payoutPercentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Confidence</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(selectedClaim.assessment.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Loss Verification */}
              {selectedClaim.assessment?.lossVerification && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Verified Loss Breakdown</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-900 mb-2">
                      <strong>Platform:</strong> {selectedClaim.assessment.lossVerification.platform || 'Delivery Platform'}
                    </p>
                    <p className="text-xs text-blue-800">
                      Payout calculated based on actual earnings loss verified from platform data
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Baseline Earnings</p>
                      <p className="text-xl font-bold text-gray-700">
                        {formatCurrency(selectedClaim.assessment.lossVerification.baselineEarnings, 'INR')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">30-day average</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Actual Earnings</p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatCurrency(selectedClaim.assessment.lossVerification.actualEarnings, 'INR')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">During disruption</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Verified Loss</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(selectedClaim.assessment.lossVerification.verifiedLoss, 'INR')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedClaim.assessment.lossVerification.lossPercentage}% decrease
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payout Formula */}
              {selectedClaim.assessment?.payoutFormula && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Calculation</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-mono text-gray-700 mb-2">
                      {selectedClaim.assessment.payoutFormula.formula}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatCurrency(selectedClaim.assessment.payoutFormula.verifiedLoss, 'INR')} × {(selectedClaim.assessment.payoutFormula.riskPercentage * 100).toFixed(0)}% × {selectedClaim.assessment.payoutFormula.trustMultiplier} × {selectedClaim.assessment.payoutFormula.exclusionFactor} = {formatCurrency(getClaimAmount(selectedClaim), 'INR')}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Risk %</p>
                      <p className="text-lg font-bold text-blue-600">
                        {(selectedClaim.assessment.payoutFormula.riskPercentage * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Trust Score</p>
                      <p className="text-lg font-bold text-green-600">
                        {selectedClaim.assessment.payoutFormula.trustScore}
                      </p>
                      <p className="text-xs text-gray-500">×{selectedClaim.assessment.payoutFormula.trustMultiplier}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Exclusion</p>
                      <p className="text-lg font-bold text-orange-600">
                        {(selectedClaim.assessment.payoutFormula.exclusionFactor * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Fraud Risk</p>
                      <p className="text-lg font-bold text-red-600">
                        {(selectedClaim.assessment.payoutFormula.fraudRisk * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fraud Check */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fraud Detection</h3>
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-1 p-4 rounded-lg ${
                      selectedClaim.fraudCheck.isFraudulent
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}
                  >
                    <p className="text-sm text-gray-600 mb-1">Fraud Status</p>
                    <p
                      className={`text-lg font-semibold ${
                        selectedClaim.fraudCheck.isFraudulent ? 'text-red-700' : 'text-green-700'
                      }`}
                    >
                      {selectedClaim.fraudCheck.isFraudulent ? 'Fraudulent' : 'Legitimate'}
                    </p>
                  </div>
                  <div className="flex-1 p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Fraud Score</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(selectedClaim.fraudCheck.fraudScore * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              {selectedClaim.explanation && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Explanation</h3>
                  <p className="text-gray-700">{selectedClaim.explanation.summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
