/**
 * Pricing Agent
 * India-focused weekly premium calculation in INR.
 * Formula: weekly_premium = base_weekly_premium + risk_adjustment - trust_discount
 */

const BaseAgent = require('../base-agent');
const axios = require('axios');
const config = require('../../shared/config');

class PricingAgent extends BaseAgent {
  constructor() {
    super('PricingAgent');
    this.mlApiUrl = config.mlApi.url;
  }

  async execute(input) {
    const { userId, policyId, eventType, coverageAmount } = input;

    try {
      // Get user and historical data
      const { User, Policy, Claim } = require('../../shared/database/models');
      
      const user = (await User.findOne({ userId })) || {
        userId,
        kycVerified: false,
        trustScore: 60,
        riskProfile: { fraudRisk: 0.2, churnScore: 0.2 },
        createdAt: new Date(),
        location: { city: 'Bengaluru', state: 'KA' }
      };
      const existingPolicies = await Policy.find({ userId });
      const claims = await Claim.find({ userId });

      // Extract features for pricing model
      const features = this.extractPricingFeatures(user, existingPolicies, claims, eventType, coverageAmount);

      // Call ML pricing model
      const prediction = await this.callPricingModel(features);

      // Calculate final premium with India-first pricing ideology.
      const basePremium = this.calculateBasePremium(eventType, coverageAmount);
      const riskAdjustment = prediction.riskAdjustment;
      const trustDiscount = prediction.trustDiscount;
      const finalPremium = Math.max(
        Math.round((basePremium + riskAdjustment - trustDiscount) * 100) / 100,
        1
      );
      const riskMultiplier = basePremium > 0 ? finalPremium / basePremium : 1;

      this.logger.info('Premium calculated', {
        userId,
        basePremium,
        riskAdjustment,
        trustDiscount,
        riskMultiplier,
        finalPremium
      });

      return this.success({
        premium: finalPremium,
        currency: 'INR',
        formula: 'weekly_premium = base_weekly_premium + risk_adjustment - trust_discount',
        basePremium,
        riskAdjustment,
        trustDiscount,
        riskMultiplier,
        lossRatio: prediction.lossRatio,
        confidence: prediction.confidence
      });

    } catch (error) {
      this.logger.error('Pricing calculation failed', { error });
      return this.error('Pricing calculation failed', error);
    }
  }

  /**
   * Extract features for pricing model
   */
  extractPricingFeatures(user, policies, claims, eventType, coverageAmount) {
    const now = Date.now();

    // Calculate loss ratio
    const totalPremiumsPaid = policies.reduce((sum, p) => sum + (p.premium?.amount || 0), 0);
    const totalClaimsPaid = claims.reduce((sum, c) => sum + (c.amount?.paid || 0), 0);
    const lossRatio = totalPremiumsPaid > 0 ? totalClaimsPaid / totalPremiumsPaid : 0;

    return {
      // User risk profile
      user_fraud_risk: user.riskProfile?.fraudRisk || 0,
      user_churn_score: user.riskProfile?.churnScore || 0,
      user_claim_history: claims.length,
      kyc_verified: user.kycVerified ? 1 : 0,

      // Historical performance
      loss_ratio: lossRatio,
      total_claims: claims.length,
      approved_claims: claims.filter(c => c.status === 'PAID').length,
      rejected_claims: claims.filter(c => c.status === 'REJECTED').length,
      avg_claim_amount: claims.length > 0 
        ? claims.reduce((sum, c) => sum + (c.amount?.paid || 0), 0) / claims.length 
        : 0,

      // Policy characteristics
      event_type: eventType,
      coverage_amount: coverageAmount,
      existing_policies_count: policies.filter(p => p.status === 'ACTIVE').length,
      trust_score: user.trustScore || 60,
      avg_daily_earnings: user.avgDailyEarnings || 1200,
      working_hours: user.workingHours || 8,
      platform: (user.platform || 'swiggy').toLowerCase(),
      event_risk: this.getEventRisk(eventType),

      // Location risk
      location_city: user.location?.city || 'unknown',
      location_state: user.location?.state || 'unknown',

      // User tenure
      user_age_days: Math.floor((now - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Call ML Pricing Model
   */
  async callPricingModel(features) {
    try {
      const response = await axios.post(
        `${this.mlApiUrl}/predict/pricing`,
        { features },
        { timeout: config.mlApi.timeout }
      );

      const responseData = response.data || {};

      // New India pricing response shape.
      if (
        typeof responseData.risk_adjustment_inr === 'number' &&
        typeof responseData.trust_discount_inr === 'number'
      ) {
        return {
          riskAdjustment: responseData.risk_adjustment_inr,
          trustDiscount: responseData.trust_discount_inr,
          lossRatio: responseData.predicted_loss_ratio ?? features.loss_ratio,
          confidence: responseData.confidence ?? 0.8
        };
      }

      // Backward-compatible shape (multiplier-only model).
      const basePremium = this.calculateBasePremium(features.event_type, features.coverage_amount);
      const safeMultiplier = Number(responseData.risk_multiplier) || 1;
      const inferredPremium = Math.max(basePremium * safeMultiplier, 1);
      const inferredRiskAdjustment = Math.max(inferredPremium - basePremium, 0);
      const inferredTrustDiscount = features.trust_score >= 80 ? 4 : features.trust_score >= 60 ? 3 : 2;

      return {
        riskAdjustment: inferredRiskAdjustment,
        trustDiscount: inferredTrustDiscount,
        lossRatio: responseData.predicted_loss_ratio ?? features.loss_ratio,
        confidence: responseData.confidence ?? 0.75
      };
    } catch (error) {
      this.logger.warn('ML pricing model call failed, using fallback', { error: error.message });
      return this.fallbackPricing(features);
    }
  }

  /**
   * Calculate base premium
   */
  calculateBasePremium(eventType, coverageAmount) {
    return 10;
  }

  /**
   * Fallback pricing calculation
   */
  fallbackPricing(features) {
    const riskAdjustment = Math.max(
      1,
      Math.min(
        20,
        1.5 +
          (features.loss_ratio * 7) +
          (features.user_fraud_risk * 6) +
          (features.event_risk * 5) +
          ((1 - features.kyc_verified) * 2)
      )
    );

    const trustDiscount = Math.max(
      1,
      Math.min(
        10,
        1 +
          ((features.trust_score || 60) / 100) * 4 +
          (features.kyc_verified ? 1 : 0) +
          Math.min(features.user_age_days / 365, 2)
      )
    );

    const basePremium = this.calculateBasePremium(features.event_type, features.coverage_amount);
    const fallbackPremium = Math.max(basePremium + riskAdjustment - trustDiscount, 1);

    return {
      riskAdjustment: Math.round(riskAdjustment * 100) / 100,
      trustDiscount: Math.round(trustDiscount * 100) / 100,
      lossRatio: features.loss_ratio,
      confidence: 0.78,
      riskMultiplier: Math.round((fallbackPremium / basePremium) * 1000) / 1000
    };
  }

  getEventRisk(eventType) {
    const riskMap = {
      RAIN: 0.35,
      HEAT: 0.45,
      POLLUTION: 0.5,
      CURFEW: 0.6,
      FLOOD: 0.85,
      STORM: 0.75,
      PANDEMIC: 0.9
    };

    return riskMap[eventType] ?? 0.5;
  }

  validateInput(input) {
    if (!input.userId || !input.eventType || !input.coverageAmount) {
      throw new Error('userId, eventType, and coverageAmount are required');
    }
    return true;
  }
}

module.exports = PricingAgent;
