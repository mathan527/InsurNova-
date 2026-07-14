/**
 * Pricing Service - Calculates premiums based on coverage and risk
 */

class PricingService {
  constructor() {
    // Base rates per 1000 rupees of coverage
    this.baseRates = {
      'rain': 2.5,
      'heat': 3.0,
      'pollution': 2.0,
      'curfew': 4.0
    };
    
    // Risk multipliers based on location, platform, etc.
    this.riskMultipliers = {
      high_risk_city: 1.5,
      medium_risk_city: 1.2,
      low_risk_city: 1.0
    };
  }
  
  /**
   * Calculate premium for a given coverage amount
   * @param {Number} coverage - Coverage amount in rupees
   * @param {Array} coveredEvents - List of covered event types
   * @param {Object} options - Additional pricing options
   * @returns {Object} Pricing details
   */
  calculatePremium(coverage, coveredEvents = ['rain', 'heat', 'pollution', 'curfew'], options = {}) {
    let totalRate = 0;
    
    // Calculate base rate from covered events
    coveredEvents.forEach(eventType => {
      const rate = this.baseRates[eventType] || 0;
      totalRate += rate;
    });
    
    // Apply risk multiplier
    const riskCategory = options.riskCategory || 'medium_risk_city';
    const riskMultiplier = this.riskMultipliers[riskCategory] || 1.0;
    
    // Calculate monthly premium
    const monthlyPremium = Math.round((coverage / 1000) * totalRate * riskMultiplier);
    
    // Calculate annual premium with discount
    const annualPremium = Math.round(monthlyPremium * 12 * 0.85); // 15% discount for annual
    
    return {
      coverage,
      monthly_premium: monthlyPremium,
      annual_premium: annualPremium,
      covered_events: coveredEvents,
      base_rate: totalRate,
      risk_multiplier: riskMultiplier,
      savings_annual: Math.round(monthlyPremium * 12 - annualPremium)
    };
  }
  
  /**
   * Get pricing tiers for display
   */
  getPricingTiers() {
    const coverageLevels = [10000, 25000, 50000, 100000];
    const tiers = [];
    
    coverageLevels.forEach(coverage => {
      const pricing = this.calculatePremium(coverage);
      tiers.push({
        name: `₹${coverage.toLocaleString('en-IN')} Coverage`,
        coverage,
        monthly: pricing.monthly_premium,
        annual: pricing.annual_premium,
        recommended: coverage === 50000
      });
    });
    
    return tiers;
  }
  
  /**
   * Calculate optimal coverage based on average earnings
   */
  recommendCoverage(averageMonthlyEarnings) {
    // Recommend coverage of 2x monthly earnings
    const recommended = averageMonthlyEarnings * 2;
    
    // Round to nearest standard tier
    const standardTiers = [10000, 25000, 50000, 100000, 200000];
    const closestTier = standardTiers.reduce((prev, curr) => {
      return Math.abs(curr - recommended) < Math.abs(prev - recommended) ? curr : prev;
    });
    
    return {
      recommended_coverage: closestTier,
      reasoning: `Based on average monthly earnings of ₹${averageMonthlyEarnings.toLocaleString('en-IN')}, we recommend 2x coverage`,
      pricing: this.calculatePremium(closestTier)
    };
  }
}

module.exports = new PricingService();
