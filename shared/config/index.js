/**
 * Configuration Management
 * Centralized configuration with validation
 */

require('dotenv').config();

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  logLevel: process.env.LOG_LEVEL || 'info',

  // Database - Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  },

  // Legacy MongoDB config (deprecated - kept for reference)
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/insurnova',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/insurnova_test'
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || null
  },

  // ML API
  mlApi: {
    url: process.env.ML_API_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.ML_API_TIMEOUT, 10) || 30000
  },

  // External APIs
  externalApis: {
    weather: {
      apiKey: process.env.WEATHER_API_KEY,
      url: process.env.WEATHER_API_URL
    },
    pollution: {
      apiKey: process.env.POLLUTION_API_KEY,
      url: process.env.POLLUTION_API_URL
    }
  },

  // Payment Gateway
  payment: {
    gatewayUrl: process.env.PAYMENT_GATEWAY_URL,
    apiKey: process.env.PAYMENT_API_KEY,
    secret: process.env.PAYMENT_SECRET
  },

  // Notification
  notification: {
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    }
  },

  // Agent Thresholds
  agents: {
    riskThreshold: parseFloat(process.env.RISK_THRESHOLD) || 0.7,
    fraudThreshold: parseFloat(process.env.FRAUD_THRESHOLD) || 0.8,
    churnThreshold: parseFloat(process.env.CHURN_THRESHOLD) || 0.6,
    minPayoutAmount: parseFloat(process.env.MIN_PAYOUT_AMOUNT) || 1,
    maxPayoutAmount: parseFloat(process.env.MAX_PAYOUT_AMOUNT) || 10000
  },

  // Feature Flags
  features: {
    enableFraudCheck: process.env.ENABLE_FRAUD_CHECK === 'true',
    enableChurnPrediction: process.env.ENABLE_CHURN_PREDICTION === 'true',
    enableExplanation: process.env.ENABLE_EXPLANATION === 'true'
  }
};

// Validation
const validateConfig = () => {
  const required = ['supabase.url', 'supabase.serviceKey'];
  const missing = [];

  required.forEach(key => {
    const keys = key.split('.');
    let value = config;
    for (const k of keys) {
      value = value[k];
      if (value === undefined) {
        missing.push(key);
        break;
      }
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};

validateConfig();

module.exports = config;
