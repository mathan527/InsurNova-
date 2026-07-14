const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Event = require('../models/Event');
const claimService = require('../services/claimService');
const riskService = require('../services/riskService');
const exclusionService = require('../services/exclusionService');

/**
 * @route   POST /api/events
 * @desc    Create and process new event (webhook for external APIs)
 * @access  Public (in production, secure with API key)
 */
router.post('/', async (req, res) => {
  try {
    const { type, severity, location, metadata, source } = req.body;
    
    if (!type || severity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Event type and severity are required'
      });
    }
    
    const eventData = {
      type,
      severity,
      location,
      metadata,
      source: source || 'manual',
      timestamp: new Date()
    };
    
    // Process event and create claims
    const result = await claimService.processEvent(eventData);
    
    res.json({
      success: true,
      message: 'Event processed successfully',
      ...result
    });
    
  } catch (error) {
    console.error('Process event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing event'
    });
  }
});

/**
 * @route   POST /api/events/simulate
 * @desc    Simulate event processing (for testing/simulator page)
 * @access  Private
 */
router.post('/simulate', protect, async (req, res) => {
  try {
    const { type, severity, location } = req.body;
    
    if (!type || severity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Event type and severity are required'
      });
    }
    
    const eventData = {
      type,
      severity,
      location: location || { city: 'Mumbai', state: 'Maharashtra' },
      source: 'simulator'
    };
    
    // Evaluate without creating actual claims
    const riskResult = riskService.evaluateRisk(eventData);
    const exclusionResult = exclusionService.checkExclusion(eventData);
    
    // Get user's policy
    const Policy = require('../models/Policy');
    const policy = await Policy.findOne({ user: req.user._id, status: 'active' });
    
    let simulatedPayout = 0;
    let decision = 'rejected';
    let reason = 'No active policy';
    
    if (policy) {
      const basePayout = (policy.coverage * riskResult.payoutPercentage) / 100;
      simulatedPayout = exclusionService.calculateAdjustedPayout(basePayout, exclusionResult);
      
      if (exclusionResult.excluded) {
        decision = 'rejected';
        reason = exclusionResult.reason;
      } else if (simulatedPayout > 0) {
        decision = 'approved';
        reason = `Payout approved based on ${riskResult.riskLevel} risk level`;
      } else {
        decision = 'rejected';
        reason = 'Risk score too low for payout';
      }
    }
    
    res.json({
      success: true,
      simulation: {
        event: eventData,
        risk: riskResult,
        exclusion: exclusionResult,
        decision,
        reason,
        payout: simulatedPayout,
        coverage: policy?.coverage || 0
      }
    });
    
  } catch (error) {
    console.error('Simulate event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error simulating event'
    });
  }
});

/**
 * @route   GET /api/events
 * @desc    Get recent events
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find()
      .sort('-timestamp')
      .limit(20);
    
    res.json({
      success: true,
      count: events.length,
      events
    });
    
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events'
    });
  }
});

module.exports = router;
