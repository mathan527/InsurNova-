/**
 * Exclusion Agent
 * Checks if claim is excluded based on policy exclusions and conditions
 */

const BaseAgent = require('../base-agent');
const { ExclusionCheckResult, ExclusionReason } = require('../../shared/types');

class ExclusionAgent extends BaseAgent {
  constructor() {
    super('ExclusionAgent');
  }

  async execute(input) {
    const { event, policy, timestamp } = input;

    try {
      const enrichedEvent = await this.enrichWithExternalSignals(event);

      const exclusions = [];
      const details = {};
      details.externalSignals = enrichedEvent.metadata?.externalSignals || {};

      const eventToUse = enrichedEvent;

      // Check 1: Policy Active Status
      if (policy.status !== 'ACTIVE') {
        exclusions.push('POLICY_NOT_ACTIVE');
        details.policyStatus = policy.status;
      }

      // Check 2: Policy Date Range
      const eventDate = new Date(timestamp || eventToUse.timestamp);
      const startDate = new Date(policy.startDate);
      const endDate = new Date(policy.endDate);

      if (eventDate < startDate || eventDate > endDate) {
        exclusions.push(ExclusionReason.POLICY_EXPIRED);
        details.eventDate = eventDate;
        details.policyPeriod = { start: startDate, end: endDate };
      }

      // Check 3: Event Type Coverage
      if (policy.coverage.eventTypes && !policy.coverage.eventTypes.includes(eventToUse.type)) {
        exclusions.push('EVENT_TYPE_NOT_COVERED');
        details.eventType = eventToUse.type;
        details.coveredTypes = policy.coverage.eventTypes;
      }

      // Check 4: Geographic Coverage
      if (policy.location) {
        const isWithinCoverage = this.checkGeographicCoverage(event.location, policy.location);
        if (!isWithinCoverage) {
          exclusions.push(ExclusionReason.GEOGRAPHIC_RESTRICTION);
          details.eventLocation = event.location;
          details.policyLocation = policy.location;
        }
      }

      // Check 5: Specific Exclusions (War, Terrorism, Pandemic, etc.)
      if (policy.exclusions && policy.exclusions.length > 0) {
        const { fullExclusions, partialExclusions } = this.checkSpecificExclusions(eventToUse, policy.exclusions);

        if (fullExclusions.length > 0) {
          exclusions.push(...fullExclusions);
          details.specificExclusions = fullExclusions;
        }

        if (partialExclusions.length > 0) {
          details.partialExclusions = partialExclusions;
        }
      }

      // Check 6: Coverage Limit Check
      const totalPaid = await this.getTotalPaidAmount(policy.policyId);
      if (totalPaid >= policy.coverage.totalCoverageLimit) {
        exclusions.push(ExclusionReason.COVERAGE_LIMIT_EXCEEDED);
        details.totalPaid = totalPaid;
        details.coverageLimit = policy.coverage.totalCoverageLimit;
      }

      // Check 7: Waiting Period (if applicable)
      const waitingPeriod = policy.metadata?.waitingPeriodDays || 0;
      const daysSinceStart = Math.floor((eventDate - startDate) / (1000 * 60 * 60 * 24));
      if (daysSinceStart < waitingPeriod) {
        exclusions.push('WAITING_PERIOD_NOT_MET');
        details.waitingPeriod = waitingPeriod;
        details.daysSinceStart = daysSinceStart;
      }

      const isExcluded = exclusions.length > 0;

      const result = new ExclusionCheckResult(
        isExcluded,
        exclusions,
        details
      );

      this.logger.info('Exclusion check completed', {
        isExcluded,
        exclusionCount: exclusions.length,
        exclusions
      });

      return this.success(result);

    } catch (error) {
      this.logger.error('Exclusion check failed', { error });
      return this.error('Exclusion check failed', error);
    }
  }

  /**
   * Check if event location is within policy coverage area
   */
  checkGeographicCoverage(eventLocation, policyLocation) {
    // Simple city/state match
    if (policyLocation.city && eventLocation.city !== policyLocation.city) {
      // Check radius if coordinates available
      if (eventLocation.coordinates && policyLocation.radius) {
        const distance = this.calculateDistance(
          eventLocation.coordinates,
          policyLocation.coordinates || { latitude: 0, longitude: 0 }
        );
        return distance <= policyLocation.radius;
      }
      return false;
    }

    if (policyLocation.state && eventLocation.state !== policyLocation.state) {
      return false;
    }

    return true;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.latitude - coord1.latitude);
    const dLon = this.toRad(coord2.longitude - coord1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(coord1.latitude)) * Math.cos(this.toRad(coord2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check for specific exclusions like war, terrorism, pandemic
   */
  checkSpecificExclusions(event, policyExclusions) {
    const fullExclusions = [];
    const partialExclusions = [];

    // Check event metadata for exclusion indicators (including external API signals)
    const metadata = event.metadata || {};
    const external = metadata.externalSignals || {};

    // War exclusion (full)
    if (policyExclusions.includes(ExclusionReason.WAR)) {
      if (metadata.causedByWar || metadata.militaryAction || external.isWarZone === true) {
        fullExclusions.push(ExclusionReason.WAR);
      }
    }

    // Terrorism exclusion (full)
    if (policyExclusions.includes(ExclusionReason.TERRORISM)) {
      if (metadata.terroristActivity || metadata.politicallyMotivated || external.isTerrorEvent === true) {
        fullExclusions.push(ExclusionReason.TERRORISM);
      }
    }

    // Pandemic exclusion (partial: 50% payout)
    if (policyExclusions.includes(ExclusionReason.PANDEMIC)) {
      const isPandemicEvent = event.type === 'PANDEMIC';
      if (
        isPandemicEvent ||
        metadata.pandemicRelated ||
        metadata.publicHealthEmergency ||
        external.isPandemic === true
      ) {
        // Apply a 50% reduction so final payout is 50% of the base amount
        partialExclusions.push({
          reason: ExclusionReason.PANDEMIC,
          type: 'PARTIAL',
          percentage: 50
        });
      }
    }

    // Nuclear exclusion (full)
    if (policyExclusions.includes(ExclusionReason.NUCLEAR)) {
      if (metadata.nuclearIncident || metadata.radiationExposure) {
        fullExclusions.push(ExclusionReason.NUCLEAR);
      }
    }

    return { fullExclusions, partialExclusions };
  }

  /**
   * Get total amount paid for this policy
   */
  async getTotalPaidAmount(policyId) {
    try {
      const { Claim } = require('../../shared/database/models');
      const claims = await Claim.find({
        policyId,
        status: 'PAID'
      });

      return claims.reduce((total, claim) => total + (claim.amount.paid || 0), 0);
    } catch (error) {
      this.logger.warn('Failed to fetch total paid amount', { error });
      return 0;
    }
  }

  async enrichWithExternalSignals(event) {
    try {
      // In a real system, this is where we'd call government, WHO, or platform status APIs.
      // For now we simulate an "AI Exclusion Engine" using simple heuristics on the event.
      const cloned = { ...event, metadata: { ...(event.metadata || {}) } };

      const severity = cloned.severity || cloned.metadata?.severity || 0;
      const type = cloned.type;

      cloned.metadata.externalSignals = {
        isWarZone: false,
        isTerrorEvent: false,
        isPandemic: cloned.metadata.pandemicRelated === true,
        isNationwideLockdown: cloned.metadata.lockdownScope === 'NATIONAL',
        isPlatformOutage: cloned.metadata.platformStatus === 'DOWN',
        modelVersion: 'smart-exclusions-mock-v1',
        severity
      };

      this.logger.info('Smart exclusion signals evaluated', {
        type,
        severity,
        externalSignals: cloned.metadata.externalSignals
      });

      return cloned;
    } catch (error) {
      this.logger.warn('Failed to enrich event with external signals, continuing with local data', { error });
      return event;
    }
  }

  validateInput(input) {
    if (!input.event || !input.policy) {
      throw new Error('Event and policy are required');
    }
    return true;
  }
}

module.exports = ExclusionAgent;
