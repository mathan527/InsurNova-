/**
 * Fraud Service - Validates event authenticity and user trust scores
 */

class FraudService {
  /**
   * Check for potential fraud in a claim
   * @param {Object} user - User object with trust_score
   * @param {Object} event - Event object
   * @param {Object} policy - Policy object
   * @returns {Object} Fraud check result
   */
  async checkFraud(user, event, policy) {
    const checks = [];
    let fraudScore = 0;
    let maxScore = 0;
    
    // Check 1: User trust score
    maxScore += 30;
    const trustCheck = this._checkTrustScore(user.trust_score);
    checks.push(trustCheck);
    if (trustCheck.passed) fraudScore += 30;
    
    // Check 2: Event timing patterns
    maxScore += 20;
    const timingCheck = await this._checkEventTiming(user._id, event);
    checks.push(timingCheck);
    if (timingCheck.passed) fraudScore += 20;
    
    // Check 3: Claim frequency
    maxScore += 30;
    const frequencyCheck = await this._checkClaimFrequency(user._id, policy);
    checks.push(frequencyCheck);
    if (frequencyCheck.passed) fraudScore += 30;
    
    // Check 4: Event source verification
    maxScore += 20;
    const sourceCheck = this._checkEventSource(event);
    checks.push(sourceCheck);
    if (sourceCheck.passed) fraudScore += 20;
    
    // Calculate final fraud confidence
    const confidenceScore = (fraudScore / maxScore) * 100;
    const passed = confidenceScore >= 60; // Must pass 60% of checks
    
    return {
      passed,
      confidenceScore: Math.round(confidenceScore),
      checks,
      reason: passed 
        ? 'Fraud checks passed successfully' 
        : this._generateFailureReason(checks),
      recommendation: passed ? 'approve' : 'review'
    };
  }
  
  /**
   * Check user trust score
   */
  _checkTrustScore(trustScore) {
    const passed = trustScore >= 50;
    return {
      name: 'Trust Score Check',
      passed,
      score: trustScore,
      message: passed 
        ? `User trust score is ${trustScore}/100 - acceptable`
        : `User trust score is ${trustScore}/100 - below threshold`
    };
  }
  
  /**
   * Check if claim timing is suspicious
   */
  async _checkEventTiming(userId, event) {
    // Simulate checking if user has suspiciously timed claims
    // In production, this would query the database for patterns
    const hourOfDay = new Date(event.timestamp).getHours();
    
    // Flag if too many claims at unusual hours (2am-5am)
    const suspiciousHours = hourOfDay >= 2 && hourOfDay <= 5;
    
    return {
      name: 'Event Timing Check',
      passed: !suspiciousHours,
      message: suspiciousHours 
        ? 'Event occurred during unusual hours - needs review'
        : 'Event timing appears normal'
    };
  }
  
  /**
   * Check claim frequency patterns
   */
  async _checkClaimFrequency(userId, policy) {
    // In production, query actual claim count
    const claimsMade = policy.claims_made || 0;
    const maxAllowedPerMonth = 10;
    
    const passed = claimsMade < maxAllowedPerMonth;
    
    return {
      name: 'Claim Frequency Check',
      passed,
      count: claimsMade,
      message: passed 
        ? `Claim frequency normal (${claimsMade}/${maxAllowedPerMonth} this month)`
        : `Too many claims this month (${claimsMade}/${maxAllowedPerMonth})`
    };
  }
  
  /**
   * Verify event source authenticity
   */
  _checkEventSource(event) {
    const trustedSources = ['weather_api', 'aqi_api', 'govt_api', 'news_api'];
    const passed = trustedSources.includes(event.source);
    
    return {
      name: 'Event Source Check',
      passed,
      source: event.source,
      message: passed 
        ? `Event from trusted source: ${event.source}`
        : `Event from unverified source: ${event.source}`
    };
  }
  
  /**
   * Generate detailed failure reason
   */
  _generateFailureReason(checks) {
    const failedChecks = checks.filter(c => !c.passed);
    if (failedChecks.length === 0) return 'All checks passed';
    
    const reasons = failedChecks.map(c => c.message).join('; ');
    return `Fraud concerns: ${reasons}`;
  }
  
  /**
   * Update user trust score based on claim outcome
   */
  adjustTrustScore(currentScore, claimApproved, fraudDetected) {
    let newScore = currentScore;
    
    if (fraudDetected) {
      newScore -= 10; // Penalize for fraudulent behavior
    } else if (claimApproved) {
      newScore += 1; // Small reward for legitimate claims
    }
    
    // Keep score in valid range
    return Math.max(0, Math.min(100, newScore));
  }
}

module.exports = new FraudService();
