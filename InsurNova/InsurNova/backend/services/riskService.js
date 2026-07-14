/**
 * Risk Service - Evaluates event severity and calculates risk scores
 */

class RiskService {
  /**
   * Calculate risk score based on event type and severity
   * @param {Object} event - Event object with type and severity
   * @returns {Object} Risk assessment result
   */
  evaluateRisk(event) {
    const { type, severity, metadata } = event;
    
    let baseRisk = severity;
    let multiplier = 1;
    let riskLevel = 'low';
    
    // Type-specific risk multipliers
    const riskMultipliers = {
      'rain': 1.2,
      'heat': 1.3,
      'pollution': 1.1,
      'curfew': 1.5,
      'pandemic': 2.0,
      'war': 3.0,
      'lockdown': 2.5,
      'terrorism': 3.0
    };
    
    multiplier = riskMultipliers[type] || 1;
    
    // Calculate final risk score (0-100)
    let riskScore = Math.min(baseRisk * multiplier, 100);
    
    // Determine risk level
    if (riskScore >= 75) {
      riskLevel = 'critical';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 25) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    
    // Calculate recommended payout percentage
    let payoutPercentage = 0;
    if (riskScore >= 80) {
      payoutPercentage = 100;
    } else if (riskScore >= 60) {
      payoutPercentage = 75;
    } else if (riskScore >= 40) {
      payoutPercentage = 50;
    } else if (riskScore >= 20) {
      payoutPercentage = 25;
    }
    
    return {
      riskScore: Math.round(riskScore),
      riskLevel,
      payoutPercentage,
      shouldProcess: riskScore >= 20, // Only process if risk is significant
      analysis: this._generateAnalysis(type, severity, riskScore)
    };
  }
  
  /**
   * Generate human-readable risk analysis
   */
  _generateAnalysis(type, severity, riskScore) {
    const analyses = {
      'rain': `Heavy rainfall detected with ${severity}% intensity. Risk score: ${Math.round(riskScore)}/100. Potential impact on gig worker mobility.`,
      'heat': `Extreme heat conditions detected at ${severity}% severity. Risk score: ${Math.round(riskScore)}/100. Health and safety concerns for outdoor workers.`,
      'pollution': `Air quality index indicates ${severity}% pollution level. Risk score: ${Math.round(riskScore)}/100. Hazardous conditions for deliveries.`,
      'curfew': `Government curfew imposed with ${severity}% severity. Risk score: ${Math.round(riskScore)}/100. Work restrictions in effect.`,
      'pandemic': `Pandemic conditions at ${severity}% severity. Risk score: ${Math.round(riskScore)}/100. Major health risk assessment.`,
      'war': `Conflict situation detected at ${severity}% severity. Risk score: ${Math.round(riskScore)}/100. Extreme danger zone.`,
      'lockdown': `Lockdown measures at ${severity}% severity. Risk score: ${Math.round(riskScore)}/100. Movement restrictions apply.`,
      'terrorism': `Security threat at ${severity}% severity. Risk score: ${Math.round(riskScore)}/100. Critical safety concern.`
    };
    
    return analyses[type] || `Event type: ${type}, Severity: ${severity}%, Risk score: ${Math.round(riskScore)}/100`;
  }
}

module.exports = new RiskService();
