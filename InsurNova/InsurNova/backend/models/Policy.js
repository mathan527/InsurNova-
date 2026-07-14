const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  premium: {
    type: Number,
    required: true,
    min: 0
  },
  coverage: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'cancelled'],
    default: 'inactive'
  },
  covered_events: [{
    type: String,
    enum: ['rain', 'heat', 'pollution', 'curfew', 'pandemic'],
  }],

  // Plan metadata
  plan: {
    type: String,
    enum: ['starter', 'pro', 'elite', 'custom'],
    default: 'custom',
  },

  // Payment tracking
  payment_id: { type: String },
  order_id:   { type: String },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date,
  },

  // Activation timestamps (set when payment completes)
  activated_at: { type: Date },
  valid_until:  { type: Date },
  claims_made: {
    type: Number,
    default: 0
  },
  total_payout: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Default covered events
policySchema.pre('save', function(next) {
  if (this.isNew && (!this.covered_events || this.covered_events.length === 0)) {
    this.covered_events = ['rain', 'heat', 'pollution', 'curfew'];
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Policy', policySchema);
