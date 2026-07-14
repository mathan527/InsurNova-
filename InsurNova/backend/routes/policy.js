const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Policy = require('../models/Policy');
const pricingService = require('../services/pricingService');
const exclusionService = require('../services/exclusionService');

/**
 * @route   GET /api/policy
 * @desc    Get user's current policy
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const policy = await Policy.findOne({ user: req.user._id, status: { $ne: 'cancelled' } })
      .sort('-createdAt');
    
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'No policy found'
      });
    }
    
    res.json({
      success: true,
      policy
    });
    
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching policy'
    });
  }
});

/**
 * @route   POST /api/policy/activate
 * @desc    Activate or update policy
 * @access  Private
 */
router.post('/activate', protect, async (req, res) => {
  try {
    const { premium, coverage } = req.body;
    
    if (!premium || !coverage) {
      return res.status(400).json({
        success: false,
        message: 'Premium and coverage are required'
      });
    }
    
    // Find or create policy
    let policy = await Policy.findOne({ user: req.user._id, status: { $ne: 'cancelled' } });
    
    if (policy) {
      // Update existing policy
      policy.premium = premium;
      policy.coverage = coverage;
      policy.status = 'active';
      policy.start_date = new Date();
      policy.end_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      policy.updatedAt = new Date();
    } else {
      // Create new policy
      policy = new Policy({
        user: req.user._id,
        premium,
        coverage,
        status: 'active',
        covered_events: ['rain', 'heat', 'pollution', 'curfew'],
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }
    
    await policy.save();
    
    // Update user's active policy
    req.user.active_policy = policy._id;
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Policy activated successfully',
      policy
    });
    
  } catch (error) {
    console.error('Activate policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating policy'
    });
  }
});

/**
 * @route   GET /api/policy/pricing
 * @desc    Get pricing tiers
 * @access  Public
 */
router.get('/pricing', (req, res) => {
  try {
    const tiers = pricingService.getPricingTiers();
    
    res.json({
      success: true,
      tiers
    });
    
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pricing'
    });
  }
});

/**
 * @route   GET /api/policy/exclusions
 * @desc    Get exclusion rules
 * @access  Public
 */
router.get('/exclusions', (req, res) => {
  try {
    const rules = exclusionService.getExclusionRules();
    
    res.json({
      success: true,
      rules
    });
    
  } catch (error) {
    console.error('Get exclusions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exclusions'
    });
  }
});

/**
 * @route   POST /api/policy/calculate
 * @desc    Calculate premium for given coverage
 * @access  Public
 */
router.post('/calculate', (req, res) => {
  try {
    const { coverage, events } = req.body;
    
    if (!coverage) {
      return res.status(400).json({
        success: false,
        message: 'Coverage amount is required'
      });
    }
    
    const pricing = pricingService.calculatePremium(coverage, events);
    
    res.json({
      success: true,
      pricing
    });
    
  } catch (error) {
    console.error('Calculate premium error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating premium'
    });
  }
});

module.exports = router;
