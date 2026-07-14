const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  policy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  event_type: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  risk_score: {
    type: Number,
    min: 0,
    max: 100
  },
  exclusion_result: {
    excluded: { type: Boolean, default: false },
    reason: { type: String }
  },
  fraud_check: {
    passed: { type: Boolean, default: true },
    reason: { type: String }
  },
  decision_reason: {
    type: String
  },
  processed_at: {
    type: Date
  },
  paid_at: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Claim', claimSchema);
