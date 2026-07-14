const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const Event = require('../models/Event');

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await Policy.countDocuments({ status: 'active' });
    
    // Policy stats
    const activePolicies = await Policy.find({ status: 'active' });
    const totalPremiumCollected = activePolicies.reduce((sum, p) => sum + p.premium, 0);
    const totalCoverageProvided = activePolicies.reduce((sum, p) => sum + p.coverage, 0);
    
    // Claim stats
    const allClaims = await Claim.find();
    const approvedClaims = allClaims.filter(c => c.status === 'approved' || c.status === 'paid');
    const rejectedClaims = allClaims.filter(c => c.status === 'rejected');
    const totalClaimsPaid = allClaims
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);
    
    // Loss ratio (claims paid / premium collected)
    const lossRatio = totalPremiumCollected > 0 
      ? ((totalClaimsPaid / totalPremiumCollected) * 100).toFixed(2)
      : 0;
    
    // Event stats
    const totalEvents = await Event.countDocuments();
    const eventsByType = await Event.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // Claims by event type
    const claimsByEvent = await Claim.aggregate([
      { $group: { _id: '$event_type', count: { $sum: 1 }, total_amount: { $sum: '$amount' } } }
    ]);
    
    // Exclusion impact
    const excludedClaims = allClaims.filter(c => c.exclusion_result?.excluded);
    const partialClaims = allClaims.filter(c => c.exclusion_result?.excluded === false && c.decision_reason?.includes('partial'));
    const moneySavedFromExclusions = excludedClaims.reduce((sum, c) => {
      // Estimate what would have been paid
      const policy = activePolicies.find(p => p._id.equals(c.policy));
      return sum + (policy ? policy.coverage * 0.5 : 0);
    }, 0);
    
    // Fraud detection impact
    const fraudRejected = allClaims.filter(c => c.fraud_check?.passed === false);
    
    // Recent activity
    const recentClaims = await Claim.find()
      .populate('user', 'name email')
      .populate('event', 'type severity')
      .sort('-createdAt')
      .limit(10);
    
    res.json({
      success: true,
      admin_stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        financial: {
          total_premium_collected: totalPremiumCollected,
          total_claims_paid: totalClaimsPaid,
          loss_ratio: parseFloat(lossRatio),
          total_coverage_provided: totalCoverageProvided
        },
        claims: {
          total: allClaims.length,
          approved: approvedClaims.length,
          rejected: rejectedClaims.length,
          pending: allClaims.filter(c => c.status === 'pending').length
        },
        events: {
          total: totalEvents,
          by_type: eventsByType
        },
        exclusions: {
          total_excluded: excludedClaims.length,
          partial_coverage: partialClaims.length,
          money_saved: Math.round(moneySavedFromExclusions)
        },
        fraud: {
          detected: fraudRejected.length,
          percentage: allClaims.length > 0 
            ? ((fraudRejected.length / allClaims.length) * 100).toFixed(2)
            : 0
        },
        claims_by_event: claimsByEvent,
        recent_claims: recentClaims
      }
    });
    
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin statistics'
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (paginated)
 * @access  Private (Admin only)
 */
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');
    
    const total = await User.countDocuments();
    
    res.json({
      success: true,
      users,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_users: total
      }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

module.exports = router;
