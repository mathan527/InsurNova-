const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['rain', 'heat', 'pollution', 'curfew', 'pandemic', 'war', 'lockdown', 'terrorism']
  },
  severity: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  location: {
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  source: {
    type: String,
    enum: ['weather_api', 'aqi_api', 'govt_api', 'news_api', 'manual'],
    default: 'manual'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  processed: {
    type: Boolean,
    default: false
  },
  affected_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

module.exports = mongoose.model('Event', eventSchema);
