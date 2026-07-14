'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { claimsAPI } from '@/lib/api';
import { FileText, Eye, X, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ClaimsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [claims, setClaims] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [claimsRes, statsRes] = await Promise.all([
        claimsAPI.getClaims(),
        claimsAPI.getStats(),
      ]);

      setClaims(claimsRes.data.claims);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewClaimDetails = async (claimId: string) => {
    try {
      const response = await claimsAPI.getClaim(claimId);
      setSelectedClaim(response.data.claim);
      setShowDrawer(true);
    } catch (error) {
      console.error('Error loading claim details:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Pollution Fog Background */}
      <div className="pollution-fog"></div>

      <div className="content-wrapper max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold flex items-center space-x-3">
            <FileText className="w-10 h-10 text-blue-400" />
            <span>Claims History</span>
          </h1>
          <p className="text-white/70">All your claims processed automatically</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Total Claims</span>
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>

            <div className="glass-card p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Approved</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
            </div>

            <div className="glass-card p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Rejected</span>
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
            </div>

            <div className="glass-card p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Total Payout</span>
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold">₹{stats.total_payout?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}

        {/* Claims Table */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-2xl font-bold">All Claims</h2>

          {claims.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-white/70 font-semibold">Date</th>
                    <th className="text-left p-3 text-white/70 font-semibold">Event</th>
                    <th className="text-left p-3 text-white/70 font-semibold">Status</th>
                    <th className="text-right p-3 text-white/70 font-semibold">Amount</th>
                    <th className="text-center p-3 text-white/70 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim, index) => (
                    <tr 
                      key={claim._id || index}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3 text-sm">
                        {new Date(claim.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(claim.status)}
                          <span className="font-semibold capitalize">
                            {claim.event?.type || claim.event_type}
                          </span>
                        </div>
                        {claim.event?.severity && (
                          <span className="text-xs text-white/50">
                            Severity: {claim.event.severity}%
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`status-badge status-${claim.status}`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-lg">
                        ₹{claim.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => viewClaimDetails(claim._id)}
                          className="glass-dark px-4 py-2 rounded-lg hover:bg-white/20 transition-all inline-flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 text-lg">No claims yet</p>
              <p className="text-white/40 text-sm mt-2">
                Claims are processed automatically when events occur in your area
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Claim Details Drawer */}
      {showDrawer && selectedClaim && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDrawer(false)}
        >
          <div 
            className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Claim Details</h2>
              <button
                onClick={() => setShowDrawer(false)}
                className="glass-dark p-2 rounded-lg hover:bg-white/20 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Status Badge */}
            <div className="mb-6 text-center">
              <span className={`status-badge status-${selectedClaim.status} text-lg px-6 py-2`}>
                {selectedClaim.status}
              </span>
            </div>

            {/* Event Details */}
            <div className="glass p-6 space-y-4 mb-6">
              <h3 className="text-xl font-bold border-b border-white/10 pb-2">Event Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-white/70 text-sm">Event Type</span>
                  <p className="font-semibold capitalize text-lg">{selectedClaim.event_type}</p>
                </div>
                <div>
                  <span className="text-white/70 text-sm">Severity</span>
                  <p className="font-semibold text-lg">{selectedClaim.event?.severity || 'N/A'}%</p>
                </div>
                <div>
                  <span className="text-white/70 text-sm">Date Occurred</span>
                  <p className="font-semibold">
                    {new Date(selectedClaim.event?.timestamp || selectedClaim.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-white/70 text-sm">Source</span>
                  <p className="font-semibold capitalize">{selectedClaim.event?.source || 'System'}</p>
                </div>
              </div>
            </div>

            {/* Risk Score */}
            <div className="glass p-6 space-y-4 mb-6">
              <h3 className="text-xl font-bold border-b border-white/10 pb-2">Risk Evaluation</h3>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">Risk Score</span>
                  <span className="text-3xl font-bold">{selectedClaim.risk_score}/100</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      selectedClaim.risk_score >= 75 ? 'bg-red-500' :
                      selectedClaim.risk_score >= 50 ? 'bg-orange-500' :
                      selectedClaim.risk_score >= 25 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${selectedClaim.risk_score}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Exclusion Check */}
            <div className="glass p-6 space-y-4 mb-6">
              <h3 className="text-xl font-bold border-b border-white/10 pb-2">Exclusion Check</h3>
              <div className="flex items-start space-x-3">
                {selectedClaim.exclusion_result?.excluded ? (
                  <>
                    <XCircle className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-400">Event Excluded</p>
                      <p className="text-sm text-white/70 mt-1">{selectedClaim.exclusion_result.reason}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-400">Event Covered</p>
                      <p className="text-sm text-white/70 mt-1">{selectedClaim.exclusion_result?.reason || 'This event is covered under your policy'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Fraud Check */}
            <div className="glass p-6 space-y-4 mb-6">
              <h3 className="text-xl font-bold border-b border-white/10 pb-2">Fraud Detection</h3>
              <div className="flex items-start space-x-3">
                {selectedClaim.fraud_check?.passed ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-400">Verification Passed</p>
                      <p className="text-sm text-white/70 mt-1">{selectedClaim.fraud_check.reason}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-400">Fraud Detected</p>
                      <p className="text-sm text-white/70 mt-1">{selectedClaim.fraud_check?.reason}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Final Decision */}
            <div className={`glass p-6 space-y-4 border-2 ${
              selectedClaim.status === 'approved' || selectedClaim.status === 'paid' ? 'border-green-500/50 glow-green' :
              selectedClaim.status === 'rejected' ? 'border-red-500/50 glow-red' :
              'border-yellow-500/50'
            }`}>
              <h3 className="text-xl font-bold border-b border-white/10 pb-2">Final Decision</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Amount</span>
                  <span className="text-3xl font-bold">₹{selectedClaim.amount?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-white/70 text-sm">Reasoning</span>
                  <p className="mt-2 p-4 glass-dark rounded-lg text-sm leading-relaxed">
                    {selectedClaim.decision_reason}
                  </p>
                </div>
                {selectedClaim.processed_at && (
                  <div className="text-sm text-white/50">
                    Processed: {new Date(selectedClaim.processed_at).toLocaleString('en-IN')}
                  </div>
                )}
                {selectedClaim.paid_at && (
                  <div className="text-sm text-green-400">
                    ✓ Paid: {new Date(selectedClaim.paid_at).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowDrawer(false)}
                className="btn-secondary px-8"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
