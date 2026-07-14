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
          <div className="bg-[#0c1527] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#0c1527]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-white tracking-tight">{selectedClaim.claimId}</h2>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Status */}
              <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Claim Status</h3>
                <span className={`badge badge-${getStatusColor(selectedClaim.status)} text-lg px-4 py-1`}>
                  {selectedClaim.status}
                </span>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00d4ff] mb-1">Event Type</h3>
                  <p className="text-lg font-semibold text-white">{formatEventType(selectedClaim.eventType)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00d4ff] mb-1">Severity</h3>
                  <p className="text-lg font-semibold text-white">{selectedClaim.severity}% Index</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00d4ff] mb-1">Calculated Payout</h3>
                  <p className="text-xl font-bold text-[#00ff88]">
                    {formatCurrency(getClaimAmount(selectedClaim), 'INR')}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00d4ff] mb-1">Event Date</h3>
                  <p className="text-base text-gray-300">{formatDateTime(selectedClaim.date)}</p>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">AI Risk Assessment</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Risk Score</p>
                    <p className="text-2xl font-black text-white">
                      {(selectedClaim.assessment.riskScore * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Payout %</p>
                    <p className="text-2xl font-black text-[#00ff88]">
                      {selectedClaim.assessment.payoutPercentage}%
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Confidence</p>
                    <p className="text-2xl font-black text-[#00d4ff]">
                      {(selectedClaim.assessment.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Loss Verification */}
              {selectedClaim.assessment?.lossVerification && (
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Verified Loss Breakdown</h3>
                  <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/20 rounded-xl p-4 mb-6">
                    <p className="text-sm text-[#00d4ff] mb-1 font-bold">
                      Verified via {selectedClaim.assessment.lossVerification.platform || 'Platform'} API
                    </p>
                    <p className="text-xs text-gray-400">
                      Real-time earnings verification cross-referenced with weather sensor data
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Baseline</p>
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(selectedClaim.assessment.lossVerification.baselineEarnings, 'INR')}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">30-day avg</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Actual</p>
                      <p className="text-lg font-bold text-orange-400">
                        {formatCurrency(selectedClaim.assessment.lossVerification.actualEarnings, 'INR')}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">Disruption window</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Real Loss</p>
                      <p className="text-lg font-bold text-[#ff3b5c]">
                        {formatCurrency(selectedClaim.assessment.lossVerification.verifiedLoss, 'INR')}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {selectedClaim.assessment.lossVerification.lossPercentage}% decrease
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payout Formula */}
              {selectedClaim.assessment?.payoutFormula && (
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Payout Algorithm</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-6 font-mono text-xs">
                    <div className="flex justify-between text-[#00d4ff] mb-2 uppercase font-bold">
                      <span>Formula Logic</span>
                      <span className="text-[10px] text-gray-500">V2.4_PRICING</span>
                    </div>
                    <p className="text-white mb-3">
                      {selectedClaim.assessment.payoutFormula.formula}
                    </p>
                    <div className="h-px bg-white/5 my-3" />
                    <p className="text-gray-400 text-center italic">
                      {formatCurrency(selectedClaim.assessment.payoutFormula.verifiedLoss, 'INR')} × {(selectedClaim.assessment.payoutFormula.riskPercentage * 100).toFixed(0)}% × {selectedClaim.assessment.payoutFormula.trustMultiplier} × {selectedClaim.assessment.payoutFormula.exclusionFactor} = <span className="text-[#00ff88] font-bold">{formatCurrency(getClaimAmount(selectedClaim), 'INR')}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Risk</p>
                      <p className="text-lg font-black text-[#00d4ff]">
                        {(selectedClaim.assessment.payoutFormula.riskPercentage * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Trust</p>
                      <p className="text-lg font-black text-[#00ff88]">
                        {selectedClaim.assessment.payoutFormula.trustScore}
                      </p>
                      <p className="text-[10px] text-gray-500">×{selectedClaim.assessment.payoutFormula.trustMultiplier}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Excl.</p>
                      <p className="text-lg font-black text-orange-500">
                        {(selectedClaim.assessment.payoutFormula.exclusionFactor * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Fraud</p>
                      <p className="text-lg font-black text-[#ff3b5c]">
                        {(selectedClaim.assessment.payoutFormula.fraudRisk * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fraud Check */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#ff3b5c] mb-4">🔍 AI Fraud Sentinel</h3>
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                  <div className={`w-full sm:flex-1 p-5 rounded-2xl ${selectedClaim.fraudCheck.isFraudulent ? 'bg-[#ff3b5c]/10 border border-[#ff3b5c]/30' : 'bg-[#00ff88]/10 border border-[#00ff88]/30'}`}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Verdict</p>
                    <p className={`text-xl font-black ${selectedClaim.fraudCheck.isFraudulent ? 'text-[#ff3b5c]' : 'text-[#00ff88]'}`}>
                      {selectedClaim.fraudCheck.isFraudulent ? '⚠ FLAG FRAUDULENT' : '✓ CLEAN VERDICT'}
                    </p>
                  </div>
                  <div className="w-full sm:w-40 p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Score</p>
                    <p className={`text-3xl font-black ${selectedClaim.fraudCheck.fraudScore > 0.7 ? 'text-[#ff3b5c]' : selectedClaim.fraudCheck.fraudScore > 0.4 ? 'text-orange-500' : 'text-[#00ff88]'}`}>
                      {(selectedClaim.fraudCheck.fraudScore * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Fraud flags */}
                {selectedClaim.fraudCheck.flags?.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedClaim.fraudCheck.flags.map((flag) => (
                      <span key={flag} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-100 text-red-700 border border-red-200">
                        🚨 {flag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Fraud reasons */}
                {selectedClaim.fraudCheck.reasons?.length > 0 && (
                  <ul className="space-y-1.5 mb-4">
                    {selectedClaim.fraudCheck.reasons.map((r, i) => (
                      <li key={i} className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex gap-2">
                        <span className="text-red-400 mt-0.5">▸</span> {r}
                      </li>
                    ))}
                  </ul>
                )}

                {/* GPS Spoofing Evidence Card */}
                {selectedClaim.fraudCheck.gpsEvidence && (
                  <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 mt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">📡</span>
                      <h4 className="font-bold text-red-800 text-sm">GPS Spoofing Evidence</h4>
                      <span className="ml-auto text-xs font-mono bg-red-200 text-red-900 px-2 py-0.5 rounded-full">
                        Spoof App: {selectedClaim.fraudCheck.gpsEvidence.spoofAppDetected}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white rounded-lg p-3 border border-red-200">
                        <p className="text-gray-500 mb-1 font-semibold">📍 Reported Location</p>
                        <p className="font-mono text-gray-800">{selectedClaim.fraudCheck.gpsEvidence.reportedZone}</p>
                        <p className="font-mono text-gray-500">{selectedClaim.fraudCheck.gpsEvidence.reportedLat}°N, {selectedClaim.fraudCheck.gpsEvidence.reportedLng}°E</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-orange-200">
                        <p className="text-gray-500 mb-1 font-semibold">🛵 Platform Last Ping</p>
                        <p className="font-mono text-gray-800">{selectedClaim.fraudCheck.gpsEvidence.platformZone}</p>
                        <p className="font-mono text-gray-500">{selectedClaim.fraudCheck.gpsEvidence.platformLat}°N, {selectedClaim.fraudCheck.gpsEvidence.platformLng}°E</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-red-200">
                        <p className="text-gray-500 mb-1 font-semibold">📏 Distance Gap</p>
                        <p className="font-bold text-red-700 text-base">{selectedClaim.fraudCheck.gpsEvidence.distanceGapKm} km</p>
                        <p className="text-gray-500">in {selectedClaim.fraudCheck.gpsEvidence.timeGapSeconds}s</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-red-200">
                        <p className="text-gray-500 mb-1 font-semibold">⚡ Implied Speed</p>
                        <p className="font-bold text-red-700 text-base">{selectedClaim.fraudCheck.gpsEvidence.impliedSpeedKmh.toLocaleString()} km/h</p>
                        <p className="text-gray-500">Physically impossible</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Explanation */}
              {selectedClaim.explanation && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assessment Summary</h3>
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
