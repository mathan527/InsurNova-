const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Claim  = require('../models/Claim');

// ── Mock claims shown when MongoDB is offline ─────────────────────────────────
const MOCK_CLAIMS = [
  {
    claimId: 'CLM-2024-001',
    eventType: 'rain',
    severity: 78,
    status: 'APPROVED',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    amount: { paid: 3200, approved: 3200, calculated: 3200 },
    assessment: { riskScore: 0.78, payoutPercentage: 80, confidence: 0.91,
      lossVerification: { platform: 'Zomato', baselineEarnings: 4000, actualEarnings: 800, verifiedLoss: 3200, lossPercentage: 80 },
      payoutFormula: { formula: 'VerifiedLoss × RiskPct × TrustMultiplier × ExclusionFactor', verifiedLoss: 3200, riskPercentage: 0.80, trustMultiplier: 1.05, exclusionFactor: 0.95, trustScore: 82, fraudRisk: 0.04 }
    },
    fraudCheck: { isFraudulent: false, fraudScore: 0.04 },
    explanation: { summary: 'Heavy rainfall event verified via IMD sensor data. Earnings loss confirmed from platform delivery logs.' }
  },
  {
    claimId: 'CLM-2024-002',
    eventType: 'heat',
    severity: 62,
    status: 'PAID',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    amount: { paid: 2100, approved: 2100, calculated: 2100 },
    assessment: { riskScore: 0.62, payoutPercentage: 70, confidence: 0.87,
      lossVerification: { platform: 'Zomato', baselineEarnings: 3000, actualEarnings: 900, verifiedLoss: 2100, lossPercentage: 70 },
      payoutFormula: { formula: 'VerifiedLoss × RiskPct × TrustMultiplier × ExclusionFactor', verifiedLoss: 2100, riskPercentage: 0.70, trustMultiplier: 1.02, exclusionFactor: 0.97, trustScore: 82, fraudRisk: 0.06 }
    },
    fraudCheck: { isFraudulent: false, fraudScore: 0.06 },
    explanation: { summary: 'Extreme heat wave (AQI 185) reduced outdoor working hours. Platform data confirms 70% earnings drop.' }
  },
  {
    claimId: 'CLM-2024-003',
    eventType: 'pollution',
    severity: 45,
    status: 'PENDING',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    amount: { paid: 0, approved: 0, calculated: 1500 },
    assessment: { riskScore: 0.45, payoutPercentage: 60, confidence: 0.79,
      lossVerification: { platform: 'Swiggy', baselineEarnings: 2500, actualEarnings: 1000, verifiedLoss: 1500, lossPercentage: 60 },
      payoutFormula: { formula: 'VerifiedLoss × RiskPct × TrustMultiplier × ExclusionFactor', verifiedLoss: 1500, riskPercentage: 0.60, trustMultiplier: 1.0, exclusionFactor: 0.95, trustScore: 74, fraudRisk: 0.09 }
    },
    fraudCheck: { isFraudulent: false, fraudScore: 0.09 },
    explanation: { summary: 'AQI crossed 300 threshold triggering pollution coverage. Claim under review by AI assessor.' }
  },
  {
    claimId: 'CLM-2024-004',
    eventType: 'curfew',
    severity: 90,
    status: 'REJECTED',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    amount: { paid: 0, approved: 0, calculated: 4500 },
    assessment: { riskScore: 0.90, payoutPercentage: 0, confidence: 0.95,
      lossVerification: { platform: 'Zomato', baselineEarnings: 5000, actualEarnings: 500, verifiedLoss: 4500, lossPercentage: 90 },
      payoutFormula: { formula: 'VerifiedLoss × RiskPct × TrustMultiplier × ExclusionFactor', verifiedLoss: 4500, riskPercentage: 0.90, trustMultiplier: 0.80, exclusionFactor: 0.00, trustScore: 82, fraudRisk: 0.72 }
    },
    fraudCheck: { isFraudulent: true, fraudScore: 0.72,
      flags: ['GPS_ANOMALY', 'LOCATION_MISMATCH'],
      reasons: ['Claim location outside registered service area', 'GPS coordinates inconsistent with platform logs']
    },
    explanation: { summary: 'Fraud detection flagged GPS anomalies. Claim location did not match registered service area during curfew window.' }
  },
  {
    claimId: 'CLM-2024-005',
    eventType: 'rain',
    severity: 85,
    status: 'FRAUD_DETECTED',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    amount: { paid: 0, approved: 0, calculated: 6800 },
    assessment: { riskScore: 0.85, payoutPercentage: 0, confidence: 0.97,
      lossVerification: { platform: 'Swiggy', baselineEarnings: 7000, actualEarnings: 200, verifiedLoss: 6800, lossPercentage: 97 },
      payoutFormula: { formula: 'VerifiedLoss × RiskPct × TrustMultiplier × ExclusionFactor', verifiedLoss: 6800, riskPercentage: 0.85, trustMultiplier: 0.60, exclusionFactor: 0.00, trustScore: 41, fraudRisk: 0.94 }
    },
    fraudCheck: {
      isFraudulent: true,
      fraudScore: 0.94,
      flags: ['GPS_SPOOFING', 'VELOCITY_ANOMALY', 'FAKE_LOCATION', 'PLATFORM_DATA_MISMATCH'],
      reasons: [
        'GPS coordinates teleported 12km in 4 seconds — physically impossible',
        'Mock GPS app signature detected (FakeGPS v3.2)',
        'Device reported location: Velachery, Chennai — Platform last active ping: Tambaram (18km gap)',
        'Claim event zone not triggered at reported coordinates per IMD sensor grid',
        'Swiggy API reports 0 deliveries during claimed loss window (contradicts claim)'
      ],
      gpsEvidence: {
        reportedLat: 12.9816, reportedLng: 80.2209, reportedZone: 'Velachery, Chennai',
        platformLat: 12.9229, platformLng: 80.1275, platformZone: 'Tambaram, Chennai',
        distanceGapKm: 18.4, timeGapSeconds: 4,
        impliedSpeedKmh: 16560, spoofAppDetected: 'FakeGPS Pro v3.2'
      }
    },
    explanation: { summary: 'AI fraud engine detected GPS spoofing via mock location app. Device coordinates do not match platform ping history or IMD rain event zone. Claim rejected and flagged for investigation.' }
  },
];

function isMongoOffline(err) {
  const msg = err?.message || '';
  return msg.includes('ECONNREFUSED') || msg.includes('buffering timed out') ||
    msg.includes('ETIMEDOUT') || msg.includes('MongoNetworkError') ||
    msg.includes('topology was destroyed') || err?.name === 'MongoNetworkError';
}

/**
 * @route   GET /api/claims
 * @desc    Get user's claims (with offline fallback)
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const claims = await Claim.find({ user: req.user._id })
      .populate('event', 'type severity timestamp')
      .sort('-createdAt')
      .limit(50);

    res.json({ success: true, count: claims.length, claims });

  } catch (error) {
    if (isMongoOffline(error) || req.user._fromJWT) {
      console.warn('[Claims] MongoDB offline — returning mock claims');
      return res.json({ success: true, count: MOCK_CLAIMS.length, claims: MOCK_CLAIMS, _mock: true });
    }
    console.error('Get claims error:', error);
    res.status(500).json({ success: false, message: 'Error fetching claims' });
  }
});

/**
 * @route   GET /api/claims/:id
 * @desc    Get single claim details
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const claim = await Claim.findOne({ _id: req.params.id, user: req.user._id })
      .populate('event').populate('policy');

    if (!claim) {
      // Check mock
      const mock = MOCK_CLAIMS.find(c => c.claimId === req.params.id);
      if (mock) return res.json({ success: true, claim: mock });
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    res.json({ success: true, claim });

  } catch (error) {
    if (isMongoOffline(error)) {
      const mock = MOCK_CLAIMS.find(c => c.claimId === req.params.id);
      if (mock) return res.json({ success: true, claim: mock });
    }
    console.error('Get claim error:', error);
    res.status(500).json({ success: false, message: 'Error fetching claim' });
  }
});

/**
 * @route   GET /api/claims/user/stats
 * @desc    Get claim statistics
 * @access  Private
 */
router.get('/user/stats', protect, async (req, res) => {
  try {
    const total  = await Claim.countDocuments({ user: req.user._id });
    const paid   = await Claim.countDocuments({ user: req.user._id, status: 'PAID' });
    const pending = await Claim.countDocuments({ user: req.user._id, status: 'PENDING' });
    res.json({ success: true, stats: { total, paid, pending } });
  } catch (error) {
    if (isMongoOffline(error)) {
      return res.json({ success: true, stats: { total: MOCK_CLAIMS.length, paid: 1, pending: 1 }, _mock: true });
    }
    console.error('Get claim stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching claim statistics' });
  }
});

module.exports = router;
