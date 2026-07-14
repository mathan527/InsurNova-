/**
 * Risk Agent
 * Evaluates event severity and predicts payout percentage using ML model
 */

const BaseAgent = require('../base-agent');
const axios = require('axios');
const config = require('../../shared/config');
const { RiskAssessment, RiskLevel } = require('../../shared/types');

class RiskAgent extends BaseAgent {
  constructor() {
    super('RiskAgent');
    this.mlApiUrl = config.mlApi.url;
  }

  async execute(input) {
    const { event, policy, user } = input;

    try {
      // Prepare features for ML model
      const features = this.extractFeatures(event, policy, user);

      // Call ML model for risk prediction
      const prediction = await this.callRiskModel(features);

      // Calculate payout percentage based on policy structure
      const payoutPercentage = this.calculatePayoutPercentage(
        event.severity,
        prediction.riskScore,
        policy.coverage.payoutStructure
      );

      // Determine risk level
      const riskLevel = this.determineRiskLevel(prediction.riskScore);

      const assessment = new RiskAssessment(
        prediction.riskScore,
        event.severity,
        payoutPercentage,
        prediction.confidence
      );

      assessment.riskLevel = riskLevel;
      assessment.estimatedLoss = (policy.coverage.maxPayoutPerEvent * payoutPercentage) / 100;

      this.logger.info('Risk assessment completed', {
        riskScore: assessment.riskScore,
        payoutPercentage: assessment.payoutPercentage,
        riskLevel: riskLevel
      });

      return this.success(assessment);

    } catch (error) {
      this.logger.error('Risk assessment failed', { error });
      return this.error('Risk assessment failed', error);
    }
  }

  /**
   * Extract features for ML model
   */
  extractFeatures(event, policy, user) {
    return {
      // Event features
      event_type: event.type,
      severity: event.severity,
      duration: event.duration || 0,
      temperature: event.metadata?.temperature || 0,
      rainfall: event.metadata?.rainfall || 0,
      pollution_index: event.metadata?.pollutionIndex || 0,
      wind_speed: event.metadata?.windSpeed || 0,
      humidity: event.metadata?.humidity || 0,

      // Policy features
      policy_age_days: Math.floor((Date.now() - new Date(policy.startDate).getTime()) / (1000 * 60 * 60 * 24)),
      coverage_limit: policy.coverage.maxPayoutPerEvent,
      deductible: policy.coverage.deductible || 0,

      // User features
      user_claim_history: user.riskProfile?.claimHistory || 0,
      user_fraud_risk: user.riskProfile?.fraudRisk || 0,

      // Location features
      location_city: event.location?.city || 'unknown',
      location_state: event.location?.state || 'unknown',

      // Temporal features
      hour_of_day: new Date(event.timestamp).getHours(),
      day_of_week: new Date(event.timestamp).getDay(),
      month: new Date(event.timestamp).getMonth() + 1
    };
  }

  /**
   * Call ML Risk Model API
   */
  async callRiskModel(features) {
    try {
      const response = await axios.post(
        `${this.mlApiUrl}/predict/risk`,
        { features },
        { timeout: config.mlApi.timeout }
      );

      return {
        riskScore: response.data.risk_score,
        confidence: response.data.confidence
      };
    } catch (error) {
      this.logger.error('ML API call failed', { error: error.message });
      
      // Fallback: Use rule-based risk calculation
      this.logger.warn('Using fallback rule-based risk calculation');
      return this.fallbackRiskCalculation(features);
    }
  }

  /**
   * Fallback rule-based risk calculation
   */
  fallbackRiskCalculation(features) {
    let riskScore = features.severity / 100; // Base risk from severity

    // Adjust based on event type
    const eventTypeMultiplier = {
      'RAIN': 1.0,
      'HEAT': 1.1,
      'POLLUTION': 1.2,
      'CURFEW': 1.3,
      'FLOOD': 1.5,
      'STORM': 1.4
    };

    riskScore *= (eventTypeMultiplier[features.event_type] || 1.0);

    // Adjust based on duration
    if (features.duration > 24) {
      riskScore *= 1.2;
    }

    // Cap between 0 and 1
    riskScore = Math.min(Math.max(riskScore, 0), 1);

    return {
      riskScore: riskScore,
      confidence: 0.6 // Lower confidence for fallback
    };
  }

  /**
   * Calculate payout percentage based on policy structure
   */
  calculatePayoutPercentage(severity, riskScore, payoutStructure) {
    if (!payoutStructure || !payoutStructure.thresholds) {
      // Default: linear relationship
      return Math.min(severity, 100);
    }

    // Find matching threshold
    const thresholds = payoutStructure.thresholds.sort((a, b) => b.triggerValue - a.triggerValue);
    
    for (const threshold of thresholds) {
      if (severity >= threshold.triggerValue) {
        return threshold.payoutPercentage;
      }
    }

    return 0; // Below minimum threshold
  }

  /**
   * Determine risk level category
   */
  determineRiskLevel(riskScore) {
    if (riskScore >= 0.8) return RiskLevel.CRITICAL;
    if (riskScore >= 0.6) return RiskLevel.HIGH;
    if (riskScore >= 0.3) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  validateInput(input) {
    if (!input.event || !input.policy) {
      throw new Error('Event and policy are required');
    }
    return true;
  }
}

module.exports = RiskAgent;
