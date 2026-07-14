/**
 * Claim Service - Orchestrates the complete claim decision pipeline
 * Event → Risk → Exclusion → Fraud → Decision → Payout
 */

const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const User = require('../models/User');
const Event = require('../models/Event');

const riskService = require('./riskService');
const exclusionService = require('./exclusionService');
const fraudService = require('./fraudService');

class ClaimService {
  /**
   * Process a new event and create claims for affected users
   * @param {Object} eventData - Event data
   * @returns {Object} Processing result
   */
  async processEvent(eventData) {
    try {
      // Create event record
      const event = new Event(eventData);
      await event.save();
      
      // Find affected users with active policies in the event location
      const affectedUsers = await this._findAffectedUsers(event);
      
      if (affectedUsers.length === 0) {
        event.processed = true;
        await event.save();
        return {
          success: true,
          message: 'No affected users found',
          event: event._id
        };
      }
      
      // Process claims for each affected user
      const claimResults = [];
      for (const user of affectedUsers) {
        const result = await this.processClaim(user, event);
        claimResults.push(result);
      }
      
      // Mark event as processed
      event.processed = true;
      event.affected_users = affectedUsers.map(u => u._id);
      await event.save();
      
      return {
        success: true,
        event: event._id,
        affected_users: affectedUsers.length,
        claims_processed: claimResults.length,
        claims: claimResults
      };
      
    } catch (error) {
      console.error('Error processing event:', error);
      throw error;
    }
  }
  
  /**
   * Process individual claim through the pipeline
   */
  async processClaim(user, event) {
    try {
      // Get user's active policy
      const policy = await Policy.findOne({ 
        user: user._id, 
        status: 'active' 
      });
      
      if (!policy) {
        return {
          success: false,
          user: user._id,
          reason: 'No active policy found'
        };
      }
      
      // STEP 1: Risk Evaluation
      const riskResult = riskService.evaluateRisk(event);
      
      if (!riskResult.shouldProcess) {
        return {
          success: false,
          user: user._id,
          reason: 'Risk score too low to process claim'
        };
      }
      
      // STEP 2: Exclusion Check
      const exclusionResult = exclusionService.checkExclusion(event);
      
      // STEP 3: Fraud Check
      const fraudResult = await fraudService.checkFraud(user, event, policy);
      
      // STEP 4: Calculate payout
      const basePayout = (policy.coverage * riskResult.payoutPercentage) / 100;
      const adjustedPayout = exclusionService.calculateAdjustedPayout(
        basePayout, 
        exclusionResult
      );
      
      // STEP 5: Make decision
      const decision = this._makeDecision(
        riskResult,
        exclusionResult,
        fraudResult,
        adjustedPayout
      );
      
      // STEP 6: Create claim record
      const claim = new Claim({
        user: user._id,
        policy: policy._id,
        event: event._id,
        event_type: event.type,
        amount: adjustedPayout,
        status: decision.status,
        risk_score: riskResult.riskScore,
        exclusion_result: {
          excluded: exclusionResult.excluded,
          reason: exclusionResult.reason
        },
        fraud_check: {
          passed: fraudResult.passed,
          reason: fraudResult.reason
        },
        decision_reason: decision.reason,
        processed_at: new Date()
      });
      
      await claim.save();
      
      // Update policy stats
      policy.claims_made += 1;
      if (decision.status === 'approved' || decision.status === 'paid') {
        policy.total_payout += adjustedPayout;
      }
      await policy.save();
      
      // Update user trust score
      const newTrustScore = fraudService.adjustTrustScore(
        user.trust_score,
        decision.status === 'approved',
        !fraudResult.passed
      );
      user.trust_score = newTrustScore;
      await user.save();
      
      // Auto-approve if all checks pass
      if (decision.status === 'approved') {
        claim.status = 'paid';
        claim.paid_at = new Date();
        await claim.save();
      }
      
      return {
        success: true,
        claim: claim._id,
        status: claim.status,
        amount: adjustedPayout,
        decision: decision.reason
      };
      
    } catch (error) {
      console.error('Error processing claim:', error);
      throw error;
    }
  }
  
  /**
   * Make final claim decision based on all checks
   */
  _makeDecision(riskResult, exclusionResult, fraudResult, payout) {
    // Fully excluded - reject
    if (exclusionResult.excluded) {
      return {
        status: 'rejected',
        reason: `Claim rejected: ${exclusionResult.reason}`
      };
    }
    
    // Fraud detected - reject
    if (!fraudResult.passed) {
      return {
        status: 'rejected',
        reason: `Claim rejected: ${fraudResult.reason}`
      };
    }
    
    // Zero payout - reject
    if (payout <= 0) {
      return {
        status: 'rejected',
        reason: 'Claim rejected: Payout amount is zero or negative'
      };
    }
    
    // Partial exclusion - approve with reduced payout
    if (exclusionResult.partial) {
      return {
        status: 'approved',
        reason: `Claim approved with partial payout: ${exclusionResult.reason}`
      };
    }
    
    // All checks passed - approve
    return {
      status: 'approved',
      reason: `Claim approved: Risk score ${riskResult.riskScore}/100, ${riskResult.riskLevel} risk level. ${riskResult.analysis}`
    };
  }
  
  /**
   * Find users affected by an event
   */
  async _findAffectedUsers(event) {
    // In production, this would use geolocation matching
    // For now, return all users with active policies
    const activePolicies = await Policy.find({ status: 'active' }).populate('user');
    return activePolicies.map(p => p.user).filter(Boolean);
  }
  
  /**
   * Get claim statistics
   */
  async getClaimStats(userId) {
    const claims = await Claim.find({ user: userId });
    
    const stats = {
      total: claims.length,
      approved: claims.filter(c => c.status === 'approved' || c.status === 'paid').length,
      rejected: claims.filter(c => c.status === 'rejected').length,
      pending: claims.filter(c => c.status === 'pending').length,
      total_payout: claims
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0)
    };
    
    return stats;
  }
}

module.exports = new ClaimService();
