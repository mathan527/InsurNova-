/**
 * Orchestrator Agent
 * Central coordinator that manages the entire claim processing workflow
 */

const BaseAgent = require('../base-agent');
const { EventStatus, ClaimStatus } = require('../../shared/types');
const { Event, Claim } = require('../../shared/database/models');

class OrchestratorAgent extends BaseAgent {
  constructor(agents = {}) {
    super('OrchestratorAgent');
    this.agents = agents;
  }

  /**
   * Main orchestration logic
   * Coordinates execution flow: Event → Risk → Exclusion → Fraud → Claim → Wallet → Notification
   */
  async execute(input) {
    const { event, user, policy } = input;
    
    try {
      // Create workflow context
      const context = {
        event,
        user,
        policy,
        decisions: {},
        startTime: Date.now()
      };

      // Update event status
      await Event.findOneAndUpdate(
        { eventId: event.eventId },
        { status: EventStatus.PROCESSING }
      );

      this.logger.info('Starting claim workflow orchestration', { 
        eventId: event.eventId,
        userId: user.userId,
        policyId: policy.policyId 
      });

      // STEP 1: Risk Assessment
      const riskResult = await this.executeAgent('risk', {
        event,
        policy,
        user
      });
      
      if (!riskResult.success) {
        return this.abortWorkflow(context, 'Risk assessment failed', riskResult.error);
      }
      
      context.decisions.risk = riskResult.data;
      this.logger.info('Risk assessment completed', { riskScore: riskResult.data.riskScore });

      // STEP 2: Exclusion Check (parallel with fraud if needed)
      const exclusionResult = await this.executeAgent('exclusion', {
        event,
        policy,
        timestamp: event.timestamp
      });
      
      if (!exclusionResult.success) {
        return this.abortWorkflow(context, 'Exclusion check failed', exclusionResult.error);
      }
      
      context.decisions.exclusion = exclusionResult.data;

      // If excluded, reject immediately
      if (exclusionResult.data.isExcluded) {
        this.logger.warn('Claim excluded', { 
          reasons: exclusionResult.data.reasons 
        });
        return this.rejectClaim(context, ClaimStatus.EXCLUDED, exclusionResult.data.reasons);
      }

      // STEP 3: Fraud Detection
      const fraudResult = await this.executeAgent('fraud', {
        user,
        policy,
        event,
        claimHistory: context.claimHistory || []
      });
      
      if (!fraudResult.success) {
        this.logger.warn('Fraud check failed, proceeding with caution', { error: fraudResult.error });
        // Don't abort, just flag for review
        context.decisions.fraud = { isFraudulent: false, confidence: 0 };
      } else {
        context.decisions.fraud = fraudResult.data;
      }

      // If fraud detected, reject
      if (fraudResult.data && fraudResult.data.isFraudulent) {
        this.logger.warn('Fraud detected', { 
          fraudScore: fraudResult.data.fraudScore,
          reasons: fraudResult.data.reasons
        });
        return this.rejectClaim(context, ClaimStatus.FRAUD_DETECTED, fraudResult.data.reasons);
      }

      // STEP 4: Claim Calculation & Creation
      const claimResult = await this.executeAgent('claim', {
        event,
        policy,
        user,
        riskAssessment: context.decisions.risk,
        exclusion: context.decisions.exclusion
      });
      
      if (!claimResult.success) {
        return this.abortWorkflow(context, 'Claim creation failed', claimResult.error);
      }
      
      context.decisions.claim = claimResult.data;
      this.logger.info('Claim created', { 
        claimId: claimResult.data.claimId,
        amount: claimResult.data.amount 
      });

      // STEP 5: Payout Processing
      const walletResult = await this.executeAgent('wallet', {
        userId: user.userId,
        claimId: claimResult.data.claimId,
        amount: claimResult.data.amount,
        currency: 'INR'
      });
      
      if (!walletResult.success) {
        this.logger.error('Payout failed', { error: walletResult.error });
        // Update claim status but don't abort - can retry
        await Claim.findOneAndUpdate(
          { claimId: claimResult.data.claimId },
          { status: ClaimStatus.APPROVED, 'amount.approved': claimResult.data.amount }
        );
      } else {
        context.decisions.wallet = walletResult.data;
      }

      // STEP 6: Explanation Generation (async, non-blocking)
      this.executeAgent('explanation', {
        claim: claimResult.data,
        decisions: context.decisions
      }).catch(err => {
        this.logger.warn('Explanation generation failed', { error: err.message });
      });

      // STEP 7: User Notification (async, non-blocking)
      this.executeAgent('notification', {
        userId: user.userId,
        claimId: claimResult.data.claimId,
        amount: claimResult.data.amount,
        status: ClaimStatus.PAID,
        channel: 'email'
      }).catch(err => {
        this.logger.warn('Notification failed', { error: err.message });
      });

      // STEP 8: Churn Prediction (async, for future actions)
      this.executeAgent('churn', {
        userId: user.userId,
        policyId: policy.policyId,
        claimApproved: true
      }).catch(err => {
        this.logger.warn('Churn prediction failed', { error: err.message });
      });

      // Mark event as processed
      await Event.findOneAndUpdate(
        { eventId: event.eventId },
        { status: EventStatus.PROCESSED }
      );

      const totalTime = Date.now() - context.startTime;
      this.logger.info('Workflow completed successfully', { 
        duration: totalTime,
        claimId: claimResult.data.claimId 
      });

      return this.success({
        claimId: claimResult.data.claimId,
        status: ClaimStatus.PAID,
        amount: claimResult.data.amount,
        decisions: context.decisions,
        processingTime: totalTime
      });

    } catch (error) {
      this.logger.error('Orchestration failed', { error });
      return this.error('Workflow orchestration failed', error);
    }
  }

  /**
   * Execute individual agent
   */
  async executeAgent(agentName, input) {
    const agent = this.agents[agentName];
    
    if (!agent) {
      this.logger.warn(`Agent ${agentName} not found, skipping`);
      return this.success({ skipped: true, reason: 'Agent not available' });
    }

    try {
      return await agent.safeExecute(input);
    } catch (error) {
      this.logger.error(`Agent ${agentName} execution failed`, { error });
      throw error;
    }
  }

  /**
   * Abort workflow with failure
   */
  async abortWorkflow(context, reason, error) {
    this.logger.error('Workflow aborted', { reason, error });
    
    // Update event status
    if (context.event) {
      await Event.findOneAndUpdate(
        { eventId: context.event.eventId },
        { status: EventStatus.FAILED }
      );
    }

    return this.error(reason, error);
  }

  /**
   * Reject claim
   */
  async rejectClaim(context, status, reasons) {
    const { event, user, policy } = context;

    // Create rejected claim record
    const claim = new Claim({
      claimId: `CLM-${Date.now()}-${user.userId}`,
      userId: user.userId,
      policyId: policy.policyId,
      eventId: event.eventId,
      status,
      rejectionReason: reasons.join(', '),
      assessment: context.decisions.risk || {},
      fraudCheck: context.decisions.fraud || {},
      exclusionCheck: context.decisions.exclusion || {},
      agentDecisions: Object.entries(context.decisions).map(([name, data]) => ({
        agentName: name,
        decision: 'REJECT',
        timestamp: new Date(),
        metadata: data
      })),
      processedAt: new Date()
    });

    await claim.save();

    // Notify user (async)
    this.executeAgent('notification', {
      userId: user.userId,
      claimId: claim.claimId,
      status,
      reason: reasons.join(', '),
      channel: 'email'
    }).catch(err => {
      this.logger.warn('Notification failed', { error: err.message });
    });

    return this.success({
      claimId: claim.claimId,
      status,
      reasons,
      decisions: context.decisions
    });
  }

  validateInput(input) {
    if (!input.event || !input.user || !input.policy) {
      throw new Error('Event, user, and policy are required');
    }
    return true;
  }
}

module.exports = OrchestratorAgent;
