/**
 * Fraud Agent
 * Detects fraudulent claims using ML model and rule-based checks
 */

const BaseAgent = require('../base-agent');
const axios = require('axios');
const config = require('../../shared/config');
const { FraudCheckResult } = require('../../shared/types');

class FraudAgent extends BaseAgent {
  constructor() {
    super('FraudAgent');
    this.mlApiUrl = config.mlApi.url;
    this.fraudThreshold = config.agents.fraudThreshold;
  }

  async execute(input) {
    const { user, policy, event, claimHistory = [] } = input;

    try {
      // Extract features
      const features = this.extractFraudFeatures(user, policy, event, claimHistory);

      // Call ML fraud detection model
      const mlPrediction = await this.callFraudModel(features);

      // Rule-based fraud checks
      const ruleBasedChecks = this.performRuleBasedChecks(user, policy, event, claimHistory);

      // Combine ML and rule-based results
      const fraudScore = Math.max(mlPrediction.fraudScore, ruleBasedChecks.score);
      const reasons = [...mlPrediction.reasons, ...ruleBasedChecks.reasons];
      const isFraudulent = fraudScore >= this.fraudThreshold;

      const result = new FraudCheckResult(
        isFraudulent,
        fraudScore,
        reasons,
        mlPrediction.confidence
      );

      this.logger.info('Fraud check completed', {
        isFraudulent,
        fraudScore,
        reasonCount: reasons.length
      });

      return this.success(result);

    } catch (error) {
      this.logger.error('Fraud detection failed', { error });
      return this.error('Fraud detection failed', error);
    }
  }

  /**
   * Extract features for fraud detection model
   */
  extractFraudFeatures(user, policy, event, claimHistory) {
    const now = Date.now();
    const policyStartTime = new Date(policy.startDate).getTime();
    const claimTimestamp = new Date(event.timestamp).getTime();

    return {
      // User behavior features
      user_claim_count: claimHistory.length,
      user_fraud_risk: user.riskProfile?.fraudRisk || 0,
      user_account_age_days: Math.floor((now - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      kyc_verified: user.kycVerified ? 1 : 0,

      // Policy features
      policy_age_hours: (claimTimestamp - policyStartTime) / (1000 * 60 * 60),
      policy_coverage_amount: policy.coverage.maxPayoutPerEvent,

      // Claim timing features
      claims_last_7_days: claimHistory.filter(c => 
        (now - new Date(c.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
      ).length,
      claims_last_30_days: claimHistory.filter(c => 
        (now - new Date(c.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000
      ).length,
      
      // Event characteristics
      event_severity: event.severity,
      event_type: event.type,
      
      // Location consistency
      location_matches_policy: this.checkLocationMatch(event.location, policy.location) ? 1 : 0,
      location_matches_user: this.checkLocationMatch(event.location, user.location) ? 1 : 0,

      // Temporal features
      claim_hour: new Date(event.timestamp).getHours(),
      claim_day_of_week: new Date(event.timestamp).getDay(),
      is_weekend: [0, 6].includes(new Date(event.timestamp).getDay()) ? 1 : 0,
      is_night: (new Date(event.timestamp).getHours() < 6 || new Date(event.timestamp).getHours() > 22) ? 1 : 0
    };
  }

  /**
   * Call ML Fraud Detection Model
   */
  async callFraudModel(features) {
    try {
      const response = await axios.post(
        `${this.mlApiUrl}/predict/fraud`,
        { features },
        { timeout: config.mlApi.timeout }
      );

      return {
        fraudScore: response.data.fraud_score,
        confidence: response.data.confidence,
        reasons: response.data.reasons || []
      };
    } catch (error) {
      this.logger.warn('ML fraud model call failed, using fallback', { error: error.message });
      return {
        fraudScore: 0.3,
        confidence: 0.5,
        reasons: []
      };
    }
  }

  /**
   * Rule-based fraud detection checks
   */
  performRuleBasedChecks(user, policy, event, claimHistory) {
    const reasons = [];
    let score = 0;

    const now = Date.now();
    const policyStartTime = new Date(policy.startDate).getTime();
    const hoursSincePolicy = (now - policyStartTime) / (1000 * 60 * 60);

    // RULE 1: Claim immediately after policy purchase
    if (hoursSincePolicy < 24) {
      reasons.push('Claim within 24 hours of policy purchase');
      score += 0.4;
    }

    // RULE 2: Too many claims in short period
    const recentClaims = claimHistory.filter(c => 
      (now - new Date(c.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    );
    if (recentClaims.length > 3) {
      reasons.push(`${recentClaims.length} claims in last 7 days`);
      score += 0.5;
    }

    // RULE 3: KYC not verified
    if (!user.kycVerified) {
      reasons.push('User KYC not verified');
      score += 0.3;
    }

    // RULE 4: Location mismatch
    const locationMatch = this.checkLocationMatch(event.location, policy.location);
    if (!locationMatch) {
      reasons.push('Event location does not match policy coverage area');
      score += 0.4;
    }

    // RULE 5: Unusual claim pattern (always max severity)
    const maxSeverityClaims = claimHistory.filter(c => 
      c.assessment?.severity >= 90
    );
    if (maxSeverityClaims.length >= 2 && event.severity >= 90) {
      reasons.push('Pattern of maximum severity claims');
      score += 0.3;
    }

    // RULE 6: High-value claim from new user
    const userAge = (now - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (userAge < 7 && policy.coverage.maxPayoutPerEvent > 5000) {
      reasons.push('High-value claim from new user account');
      score += 0.4;
    }

    return {
      score: Math.min(score, 1.0),
      reasons
    };
  }

  /**
   * Check if locations match
   */
  checkLocationMatch(loc1, loc2) {
    if (!loc1 || !loc2) return false;
    
    return loc1.city === loc2.city && loc1.state === loc2.state;
  }

  validateInput(input) {
    if (!input.user || !input.policy || !input.event) {
      throw new Error('User, policy, and event are required');
    }
    return true;
  }
}

module.exports = FraudAgent;
