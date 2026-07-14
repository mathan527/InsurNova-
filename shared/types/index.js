/**
 * Shared Type Definitions for InsurNova
 * Central location for all type definitions used across agents
 */

// Event Types
const EventType = {
  RAIN: 'RAIN',
  HEAT: 'HEAT',
  POLLUTION: 'POLLUTION',
  CURFEW: 'CURFEW',
  FLOOD: 'FLOOD',
  STORM: 'STORM',
  PANDEMIC: 'PANDEMIC'
};

// Event Status
const EventStatus = {
  DETECTED: 'DETECTED',
  PROCESSING: 'PROCESSING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED'
};

// Claim Status
const ClaimStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PAID: 'PAID',
  FRAUD_DETECTED: 'FRAUD_DETECTED',
  EXCLUDED: 'EXCLUDED'
};

// Policy Status
const PolicyStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED'
};

// Agent Decision Types
const DecisionType = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  REVIEW: 'REVIEW',
  ESCALATE: 'ESCALATE'
};

// Risk Levels
const RiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Exclusion Reasons
const ExclusionReason = {
  WAR: 'WAR',
  TERRORISM: 'TERRORISM',
  PANDEMIC: 'PANDEMIC',
  NUCLEAR: 'NUCLEAR',
  GOVERNMENT_LOCKDOWN: 'GOVERNMENT_LOCKDOWN',
  PLATFORM_SHUTDOWN: 'PLATFORM_SHUTDOWN',
  POLICY_EXPIRED: 'POLICY_EXPIRED',
  COVERAGE_LIMIT_EXCEEDED: 'COVERAGE_LIMIT_EXCEEDED',
  GEOGRAPHIC_RESTRICTION: 'GEOGRAPHIC_RESTRICTION'
};

// Agent Response Interface
class AgentResponse {
  constructor(success, data, error = null, metadata = {}) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.metadata = metadata;
    this.timestamp = new Date();
  }
}

// Event Data Interface
class EventData {
  constructor(type, severity, location, timestamp, metadata = {}) {
    this.type = type;
    this.severity = severity;
    this.location = location;
    this.timestamp = timestamp;
    this.metadata = metadata;
  }
}

// Risk Assessment Result
class RiskAssessment {
  constructor(riskScore, severity, payoutPercentage, confidence) {
    this.riskScore = riskScore;
    this.severity = severity;
    this.payoutPercentage = payoutPercentage;
    this.confidence = confidence;
  }
}

// Fraud Check Result
class FraudCheckResult {
  constructor(isFraudulent, fraudScore, reasons, confidence) {
    this.isFraudulent = isFraudulent;
    this.fraudScore = fraudScore;
    this.reasons = reasons;
    this.confidence = confidence;
  }
}

// Exclusion Check Result
class ExclusionCheckResult {
  constructor(isExcluded, reasons, details) {
    this.isExcluded = isExcluded;
    this.reasons = reasons;
    this.details = details;
  }
}

// Claim Result
class ClaimResult {
  constructor(claimId, amount, status, approvalTimestamp) {
    this.claimId = claimId;
    this.amount = amount;
    this.status = status;
    this.approvalTimestamp = approvalTimestamp;
  }
}

module.exports = {
  EventType,
  EventStatus,
  ClaimStatus,
  PolicyStatus,
  DecisionType,
  RiskLevel,
  ExclusionReason,
  AgentResponse,
  EventData,
  RiskAssessment,
  FraudCheckResult,
  ExclusionCheckResult,
  ClaimResult
};
