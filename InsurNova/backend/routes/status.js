const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');

/**
 * @route   GET /api/status
 * @desc    Get dashboard status/metrics for user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get active policy
    const policy = await Policy.findOne({ user: userId, status: 'active' });
    
    // Get claims
    const claims = await Claim.find({ user: userId });
    const recentClaims = await Claim.find({ user: userId })
      .populate('event', 'type severity timestamp')
      .sort('-createdAt')
      .limit(5);
    
    // Calculate metrics
    const totalEarningsProtected = policy ? policy.total_payout : 0;
    const activeCoverage = policy ? policy.coverage : 0;
    const trustScore = req.user.trust_score;
    
    // Calculate risk level based on recent events/claims
    let riskLevel = 'low';
    const pendingClaims = claims.filter(c => c.status === 'pending').length;
    const recentRejections = claims
      .filter(c => c.status === 'rejected')
      .filter(c => new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .length;
    
    if (pendingClaims > 3 || recentRejections > 2) {
      riskLevel = 'high';
    } else if (pendingClaims > 0 || recentRejections > 0) {
      riskLevel = 'medium';
    }
    
    // Get claim stats
    const approvedClaims = claims.filter(c => c.status === 'approved' || c.status === 'paid');
    const rejectedClaims = claims.filter(c => c.status === 'rejected');
    const totalPayout = claims
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);
    
    // Get alerts
    const alerts = [];
    
    if (!policy || policy.status !== 'active') {
      alerts.push({
        type: 'warning',
        message: 'No active policy. Activate a plan to get coverage.',
        action: 'Activate Policy'
      });
    }
    
    if (trustScore < 50) {
      alerts.push({
        type: 'error',
        message: 'Low trust score. This may affect claim approvals.',
        action: 'View Details'
      });
    }
    
    if (policy && new Date(policy.end_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      alerts.push({
        type: 'info',
        message: 'Policy expiring soon. Renew to continue coverage.',
        action: 'Renew Now'
      });
    }
    
    res.json({
      success: true,
      dashboard: {
        metrics: {
          earnings_protected: totalEarningsProtected,
          active_coverage: activeCoverage,
          risk_level: riskLevel,
          trust_score: trustScore
        },
        policy: policy ? {
          id: policy._id,
          premium: policy.premium,
          coverage: policy.coverage,
          status: policy.status,
          start_date: policy.start_date,
          end_date: policy.end_date,
          claims_made: policy.claims_made,
          covered_events: policy.covered_events
        } : null,
        claims: {
          total: claims.length,
          approved: approvedClaims.length,
          rejected: rejectedClaims.length,
          pending: pendingClaims,
          total_payout: totalPayout,
          recent: recentClaims
        },
        alerts
      }
    });
    
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching status'
    });
  }
});

module.exports = router;
