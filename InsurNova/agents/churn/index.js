/**
 * Churn Agent
 * Predicts likelihood of user churning/cancelling policy
 */

const BaseAgent = require('../base-agent');
const axios = require('axios');
const config = require('../../shared/config');

class ChurnAgent extends BaseAgent {
  constructor() {
    super('ChurnAgent');
    this.mlApiUrl = config.mlApi.url;
    this.churnThreshold = config.agents.churnThreshold;
  }

  async execute(input) {
    const { userId, policyId, claimApproved } = input;

    try {
      // Get user and policy data
      const { User, Policy, Claim } = require('../../shared/database/models');
      
      const user = await User.findOne({ userId });
      const policy = await Policy.findOne({ policyId });
      const claims = await Claim.find({ userId }).sort({ createdAt: -1 });

      if (!user || !policy) {
        throw new Error('User or policy not found');
      }

      // Extract features
      const features = this.extractChurnFeatures(user, policy, claims, claimApproved);

      // Call ML model
      const prediction = await this.callChurnModel(features);

      const isHighRisk = prediction.churnScore >= this.churnThreshold;

      // Update user risk profile
      await User.findOneAndUpdate(
        { userId },
        { 'riskProfile.churnScore': prediction.churnScore }
      );

      this.logger.info('Churn prediction completed', {
        userId,
        churnScore: prediction.churnScore,
        isHighRisk
      });

      // If high churn risk, trigger retention actions
      if (isHighRisk) {
        this.logger.warn('High churn risk detected', { userId, churnScore: prediction.churnScore });
        // Could trigger retention campaigns, discounts, etc.
      }

      return this.success({
        churnScore: prediction.churnScore,
        isHighRisk,
        confidence: prediction.confidence,
        factors: prediction.factors
      });

    } catch (error) {
      this.logger.error('Churn prediction failed', { error });
      return this.error('Churn prediction failed', error);
    }
  }

  /**
   * Extract features for churn prediction
   */
  extractChurnFeatures(user, policy, claims, claimApproved) {
    const now = Date.now();
    const userAge = Math.floor((now - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const policyAge = Math.floor((now - new Date(policy.startDate).getTime()) / (1000 * 60 * 60 * 24));

    // Claim statistics
    const totalClaims = claims.length;
    const approvedClaims = claims.filter(c => c.status === 'PAID' || c.status === 'APPROVED').length;
    const rejectedClaims = claims.filter(c => c.status === 'REJECTED' || c.status === 'EXCLUDED').length;
    const fraudDetectedClaims = claims.filter(c => c.status === 'FRAUD_DETECTED').length;

    const avgClaimAmount = claims.length > 0 
      ? claims.reduce((sum, c) => sum + (c.amount?.paid || 0), 0) / claims.length 
      : 0;

    const daysSinceLastClaim = claims.length > 0
      ? Math.floor((now - new Date(claims[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      // User features
      user_age_days: userAge,
      kyc_verified: user.kycVerified ? 1 : 0,
      wallet_balance: user.wallet?.balance || 0,

      // Policy features
      policy_age_days: policyAge,
      policy_status: policy.status === 'ACTIVE' ? 1 : 0,
      premium_amount: policy.premium?.amount || 0,
      premium_is_paid: policy.premium?.isPaid ? 1 : 0,
      coverage_amount: policy.coverage?.maxPayoutPerEvent || 0,

      // Claim history
      total_claims: totalClaims,
      approved_claims: approvedClaims,
      rejected_claims: rejectedClaims,
      fraud_detected_claims: fraudDetectedClaims,
      approval_rate: totalClaims > 0 ? approvedClaims / totalClaims : 0,
      rejection_rate: totalClaims > 0 ? rejectedClaims / totalClaims : 0,
      avg_claim_amount: avgClaimAmount,
      days_since_last_claim: daysSinceLastClaim,

      // Recent activity
      last_claim_approved: claimApproved ? 1 : 0,
      claims_last_30_days: claims.filter(c => 
        (now - new Date(c.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000
      ).length,

      // Engagement
      days_until_policy_end: Math.floor((new Date(policy.endDate).getTime() - now) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Call ML Churn Model
   */
  async callChurnModel(features) {
    try {
      const response = await axios.post(
        `${this.mlApiUrl}/predict/churn`,
        { features },
        { timeout: config.mlApi.timeout }
      );

      return {
        churnScore: response.data.churn_score,
        confidence: response.data.confidence,
        factors: response.data.factors || []
      };
    } catch (error) {
      this.logger.warn('ML churn model call failed, using fallback', { error: error.message });
      return this.fallbackChurnPrediction(features);
    }
  }

  /**
   * Fallback churn prediction
   */
  fallbackChurnPrediction(features) {
    let churnScore = 0.3; // Base score

    // High rejection rate increases churn
    if (features.rejection_rate > 0.5) {
      churnScore += 0.3;
    }

    // No recent claims might indicate disengagement
    if (features.days_since_last_claim > 90) {
      churnScore += 0.2;
    }

    // Premium not paid
    if (!features.premium_is_paid) {
      churnScore += 0.3;
    }

    // Low engagement
    if (features.total_claims === 0 && features.policy_age_days > 60) {
      churnScore += 0.2;
    }

    return {
      churnScore: Math.min(churnScore, 1.0),
      confidence: 0.6,
      factors: ['Using fallback prediction']
    };
  }

  validateInput(input) {
    if (!input.userId || !input.policyId) {
      throw new Error('userId and policyId are required');
    }
    return true;
  }
}

module.exports = ChurnAgent;
