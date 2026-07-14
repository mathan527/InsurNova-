const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Claim = require('../models/Claim');
const claimService = require('../services/claimService');

/**
 * @route   GET /api/claims
 * @desc    Get user's claims
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const claims = await Claim.find({ user: req.user._id })
      .populate('event', 'type severity timestamp')
      .sort('-createdAt')
      .limit(50);
    
    res.json({
      success: true,
      count: claims.length,
      claims
    });
    
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching claims'
    });
  }
});

/**
 * @route   GET /api/claims/:id
 * @desc    Get single claim details
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const claim = await Claim.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    })
      .populate('event')
      .populate('policy');
    
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }
    
    res.json({
      success: true,
      claim
    });
    
  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching claim'
    });
  }
});

/**
 * @route   GET /api/claims/stats
 * @desc    Get claim statistics
 * @access  Private
 */
router.get('/user/stats', protect, async (req, res) => {
  try {
    const stats = await claimService.getClaimStats(req.user._id);
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Get claim stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching claim statistics'
    });
  }
});

module.exports = router;
