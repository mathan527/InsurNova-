/**
 * Exclusion Service - Checks if events fall under excluded categories
 */

class ExclusionService {
  constructor() {
    // Excluded event types for financial sustainability
    this.excludedEvents = {
      'war': {
        excluded: true,
        reason: 'War and armed conflict are excluded for financial sustainability',
        category: 'catastrophic'
      },
      'terrorism': {
        excluded: true,
        reason: 'Terrorism-related events are excluded for financial sustainability',
        category: 'catastrophic'
      },
      'pandemic': {
        excluded: 'partial',
        reason: 'Pandemic events receive partial coverage (50% payout) for financial sustainability',
        category: 'catastrophic',
        payoutMultiplier: 0.5
      },
      'lockdown': {
        excluded: 'partial',
        reason: 'Major lockdowns receive partial coverage (60% payout) for financial sustainability',
        category: 'catastrophic',
        payoutMultiplier: 0.6
      }
    };
    
    // Covered events
    this.coveredEvents = ['rain', 'heat', 'pollution', 'curfew'];
  }
  
  /**
   * Check if an event is excluded or partially excluded
   * @param {Object} event - Event object
   * @returns {Object} Exclusion check result
   */
  checkExclusion(event) {
    const { type, severity } = event;
    
    // Normalize type for lookup (e.g., PANDEMIC -> pandemic)
    const typeKey = (type || '').toString().toLowerCase();

    // Check if event type is in exclusion list
    const exclusion = this.excludedEvents[typeKey];
    
    if (!exclusion) {
      // Event is fully covered
      return {
        excluded: false,
        partial: false,
        payoutMultiplier: 1.0,
        reason: `${type} is a covered event`,
        category: 'covered'
      };
    }
    
    if (exclusion.excluded === true) {
      // Fully excluded - no payout
      return {
        excluded: true,
        partial: false,
        payoutMultiplier: 0,
        reason: exclusion.reason,
        category: exclusion.category,
        tooltipText: exclusion.reason
      };
    }
    
    if (exclusion.excluded === 'partial') {
      // Partial coverage - reduced payout
      return {
        excluded: false,
        partial: true,
        payoutMultiplier: exclusion.payoutMultiplier,
        reason: exclusion.reason,
        category: exclusion.category,
        tooltipText: `${exclusion.reason}. Payout reduced to ${exclusion.payoutMultiplier * 100}%`
      };
    }
    
    return {
      excluded: false,
      partial: false,
      payoutMultiplier: 1.0,
      reason: 'Event processing normal',
      category: 'covered'
    };
  }
  
  /**
   * Get all exclusion rules for display
   */
  getExclusionRules() {
    return {
      excluded: Object.keys(this.excludedEvents).filter(
        key => this.excludedEvents[key].excluded === true
      ),
      partial: Object.keys(this.excludedEvents).filter(
        key => this.excludedEvents[key].excluded === 'partial'
      ),
      covered: this.coveredEvents,
      details: this.excludedEvents
    };
  }
  
  /**
   * Calculate final payout after exclusion check
   */
  calculateAdjustedPayout(basePayout, exclusionResult) {
    if (exclusionResult.excluded) {
      return 0;
    }
    
    return Math.round(basePayout * exclusionResult.payoutMultiplier);
  }
}

module.exports = new ExclusionService();
