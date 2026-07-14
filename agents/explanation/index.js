/**
 * Explanation Agent
 * Generates human-readable explanations for claim decisions
 */

const BaseAgent = require('../base-agent');
const { Claim } = require('../../shared/database/models');

class ExplanationAgent extends BaseAgent {
  constructor() {
    super('ExplanationAgent');
  }

  async execute(input) {
    const { claim, decisions } = input;

    try {
      // Generate explanation based on decisions
      const explanation = this.generateExplanation(claim, decisions);

      // Update claim with explanation
      await Claim.findOneAndUpdate(
        { claimId: claim.claimId },
        { explanation }
      );

      this.logger.info('Explanation generated', { claimId: claim.claimId });

      return this.success(explanation);

    } catch (error) {
      this.logger.error('Explanation generation failed', { error });
      return this.error('Explanation generation failed', error);
    }
  }

  /**
   * Generate human-readable explanation
   */
  generateExplanation(claim, decisions) {
    const factors = [];
    let summary = '';
    let reasoning = '';

    // Analyze risk assessment
    if (decisions.risk) {
      const risk = decisions.risk;
      factors.push(`Event severity: ${risk.severity}/100`);
      factors.push(`Risk score: ${(risk.riskScore * 100).toFixed(1)}%`);
      factors.push(`Payout percentage: ${risk.payoutPercentage}%`);
      
      if (risk.riskLevel) {
        factors.push(`Risk level: ${risk.riskLevel}`);
      }

      reasoning += `The event was assessed with a severity of ${risk.severity} out of 100, `;
      reasoning += `resulting in a risk score of ${(risk.riskScore * 100).toFixed(1)}%. `;
      reasoning += `Based on your policy structure, this qualifies for a ${risk.payoutPercentage}% payout. `;
    }

    // Analyze fraud check
    if (decisions.fraud) {
      const fraud = decisions.fraud;
      if (fraud.isFraudulent) {
        factors.push(`Fraud detected (score: ${(fraud.fraudScore * 100).toFixed(1)}%)`);
        factors.push(...fraud.reasons);
        
        summary = '❌ Claim Rejected - Fraud Detected';
        reasoning += `However, our fraud detection system flagged this claim with a ${(fraud.fraudScore * 100).toFixed(1)}% fraud score. `;
        reasoning += `Reasons: ${fraud.reasons.join(', ')}. `;
      } else {
        factors.push(`Passed fraud verification (score: ${(fraud.fraudScore * 100).toFixed(1)}%)`);
      }
    }

    // Analyze exclusion check
    if (decisions.exclusion) {
      const exclusion = decisions.exclusion;
      if (exclusion.isExcluded) {
        factors.push('Coverage exclusions applied');
        factors.push(...exclusion.reasons);
        
        summary = '❌ Claim Rejected - Not Covered';
        reasoning += `This claim is not covered under your policy. `;
        reasoning += `Reasons: ${exclusion.reasons.join(', ')}. `;
      } else {
        factors.push('All coverage requirements met');
      }
    }

    // Analyze claim calculation
    if (decisions.claim && claim.amount) {
      factors.push(`Calculated payout: $${claim.amount}`);
      reasoning += `Your approved payout amount is $${claim.amount}. `;
    }

    // Generate summary if not already set
    if (!summary) {
      if (claim.status === 'PAID' || claim.status === 'APPROVED') {
        summary = `✅ Claim Approved - $${claim.amount} Payout`;
      } else if (claim.status === 'REJECTED') {
        summary = '❌ Claim Rejected';
      } else {
        summary = `ℹ️ Claim ${claim.status}`;
      }
    }

    // Add confidence information
    if (decisions.risk && decisions.risk.confidence) {
      reasoning += `This assessment was made with ${(decisions.risk.confidence * 100).toFixed(0)}% confidence based on our AI models and your policy terms.`;
    }

    return {
      summary,
      factors,
      reasoning: reasoning.trim(),
      generatedAt: new Date()
    };
  }

  validateInput(input) {
    if (!input.claim || !input.decisions) {
      throw new Error('Claim and decisions are required');
    }
    return true;
  }
}

module.exports = ExplanationAgent;
