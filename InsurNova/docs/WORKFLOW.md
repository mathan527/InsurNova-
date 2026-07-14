# Event Processing Workflow

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EVENT DETECTED                              │
│         (Rain, Heat, Pollution, Curfew, Flood, Storm)              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                               │
│   • Fetch Event, User, Policy from database                        │
│   • Initialize workflow context                                    │
│   • Set event status = PROCESSING                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      STEP 1: RISK AGENT                            │
│   • Extract features (event + policy + user + temporal)            │
│   • Call ML Risk Model (HTTP POST /predict/risk)                   │
│   • Calculate payout percentage based on severity                  │
│   • Determine risk level (LOW/MEDIUM/HIGH/CRITICAL)                │
│                                                                     │
│   Output: { riskScore, severity, payoutPercentage, confidence }   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                     ┌───────┴────────┐
                     │   SUCCESS?      │
                     └───────┬────────┘
                             │ YES
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   STEP 2: EXCLUSION AGENT                          │
│   • Check policy active status                                     │
│   • Verify event date within policy period                         │
│   • Validate event type is covered                                 │
│   • Check geographic coverage                                      │
│   • Check specific exclusions (war, terrorism, pandemic, etc.)     │
│   • Verify coverage limit not exceeded                             │
│   • Check waiting period                                           │
│                                                                     │
│   Output: { isExcluded, reasons[], details }                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                     ┌───────┴────────┐
                     │   EXCLUDED?     │
                     └───────┬────────┘
                             │
                    NO ◄─────┴─────► YES
                     │                │
                     │                ▼
                     │    ┌────────────────────┐
                     │    │ REJECT CLAIM       │
                     │    │ Status: EXCLUDED   │
                     │    │ Notify User        │
                     │    │ Save to DB         │
                     │    └────────────────────┘
                     │                │
                     │                ▼
                     │            [END]
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP 3: FRAUD AGENT                             │
│   • Extract fraud features (user behavior + timing + patterns)     │
│   • Call ML Fraud Model (HTTP POST /predict/fraud)                 │
│   • Run rule-based checks:                                         │
│     - Claim within 24h of policy purchase?                         │
│     - Too many claims in short period?                             │
│     - KYC not verified?                                            │
│     - Location mismatch?                                           │
│     - Pattern of max severity claims?                              │
│   • Combine ML + rule-based scores                                 │
│                                                                     │
│   Output: { isFraudulent, fraudScore, reasons[], confidence }     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                     ┌───────┴────────┐
                     │  FRAUDULENT?    │
                     └───────┬────────┘
                             │
                    NO ◄─────┴─────► YES
                     │                │
                     │                ▼
                     │    ┌────────────────────────┐
                     │    │ REJECT CLAIM           │
                     │    │ Status: FRAUD_DETECTED │
                     │    │ Notify User            │
                     │    │ Flag User Account      │
                     │    │ Save to DB             │
                     │    └────────────────────────┘
                     │                │
                     │                ▼
                     │            [END]
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP 4: CLAIM AGENT                             │
│   • Calculate claim amount:                                        │
│     amount = (maxPayout × payoutPercentage / 100) - deductible    │
│   • Validate amount ≥ MIN_PAYOUT_AMOUNT                           │
│   • Cap amount at MAX_PAYOUT_AMOUNT                                │
│   • Generate unique Claim ID                                       │
│   • Create Claim record in database                                │
│   • Set status = APPROVED                                          │
│                                                                     │
│   Output: { claimId, amount, status: 'APPROVED' }                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                     ┌───────┴────────┐
                     │   SUCCESS?      │
                     └───────┬────────┘
                             │ YES
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP 5: WALLET AGENT                            │
│   • Generate unique Transaction ID                                 │
│   • Create Transaction record (status: PROCESSING)                 │
│   • Call Payment Gateway API:                                      │
│     - Real gateway (production)                                    │
│     - Simulation (development)                                     │
│   • Process payout                                                 │
│   • Update Transaction status:                                     │
│     - COMPLETED (if success)                                       │
│     - FAILED (if error)                                            │
│   • Update Claim status = PAID                                     │
│   • Update User wallet balance                                     │
│                                                                     │
│   Output: { transactionId, gatewayTxnId, status }                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
         ┌───────────────────────────────────────┐
         │  PARALLEL ASYNC OPERATIONS            │
         │  (Non-blocking, can fail gracefully)  │
         └───────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
   ┌────────────────┐ ┌────────────┐ ┌─────────────┐
   │ NOTIFICATION   │ │ EXPLANATION│ │   CHURN     │
   │    AGENT       │ │   AGENT    │ │   AGENT     │
   │                │ │            │ │             │
   │ • Get user     │ │ • Analyze  │ │ • Get user  │
   │   email/phone  │ │   all      │ │   history   │
   │ • Build message│ │   decisions│ │ • Call ML   │
   │ • Send email   │ │ • Generate │ │   model     │
   │   via SendGrid │ │   summary  │ │ • Update    │
   │ • Send SMS     │ │ • List     │ │   risk      │
   │   via Twilio   │ │   factors  │ │   profile   │
   │ • Log result   │ │ • Create   │ │ • Trigger   │
   │                │ │   reasoning│ │   retention │
   │                │ │ • Update   │ │   if needed │
   │                │ │   claim    │ │             │
   └────────────────┘ └────────────┘ └─────────────┘
            │                │                │
            └────────────────┴────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FINALIZATION                                    │
│   • Update Event status = PROCESSED                                │
│   • Calculate total processing time                                │
│   • Log workflow completion                                        │
│   • Return result to caller                                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                   ┌─────────────────┐
                   │   SUCCESS ✅     │
                   │                 │
                   │ Claim: PAID     │
                   │ User: Notified  │
                   │ Time: ~2-4s     │
                   └─────────────────┘
```

---

## Decision Branching Logic

### Branch 1: Risk Assessment Failure
```
Risk Agent Error
    ↓
Orchestrator Logs Error
    ↓
Event Status = FAILED
    ↓
Return Error Response
```

### Branch 2: Claim Excluded
```
Exclusion Check → isExcluded = true
    ↓
Create Claim Record (status: EXCLUDED)
    ↓
Notify User (rejection email)
    ↓
Return Success (claim rejected with reason)
```

### Branch 3: Fraud Detected
```
Fraud Check → isFraudulent = true
    ↓
Create Claim Record (status: FRAUD_DETECTED)
    ↓
Flag User Account
    ↓
Notify User (under review)
    ↓
Escalate to Manual Review
    ↓
Return Success (claim flagged)
```

### Branch 4: Payout Failed
```
Wallet Agent → Payment Gateway Error
    ↓
Transaction Status = FAILED
    ↓
Claim Status = APPROVED (not PAID)
    ↓
Log Error for Retry
    ↓
Notify Admin
    ↓
Return Partial Success (approved but not paid)
```

---

## Execution Order & Parallelization

### Sequential Steps (Must Complete in Order)
1. **Risk Agent** → Must complete before exclusion check
2. **Exclusion Agent** → Must complete before fraud check
3. **Fraud Agent** → Must complete before claim creation
4. **Claim Agent** → Must complete before payout
5. **Wallet Agent** → Must complete before finalization

### Parallel Steps (Can Run Simultaneously)
- **Notification Agent** ∥ **Explanation Agent** ∥ **Churn Agent**
  - These run asynchronously after wallet agent
  - Failures don't block main workflow
  - Logged for monitoring but not critical

---

## Timing Breakdown

Typical processing times (development environment):

```
┌──────────────────────┬──────────┐
│ Step                 │   Time   │
├──────────────────────┼──────────┤
│ Database Fetch       │   50ms   │
│ Risk Agent           │  200ms   │
│ Exclusion Agent      │  100ms   │
│ Fraud Agent          │  250ms   │
│ Claim Agent          │   80ms   │
│ Wallet Agent         │  1200ms  │ ← Slowest (payment gateway)
│ Notification (async) │  300ms   │
│ Explanation (async)  │   50ms   │
│ Churn (async)        │  150ms   │
│ Database Update      │   40ms   │
├──────────────────────┼──────────┤
│ TOTAL (Sequential)   │ ~2000ms  │
│ TOTAL (with async)   │ ~2500ms  │
└──────────────────────┴──────────┘
```

---

## Error Handling Strategy

### Level 1: Agent-Level Errors
```javascript
try {
  const result = await agent.execute(input);
  if (!result.success) {
    // Handle gracefully
    this.logger.error('Agent failed', { error: result.error });
  }
} catch (error) {
  // Unexpected error
  return this.error('Agent execution failed', error);
}
```

### Level 2: Orchestrator-Level Errors
```javascript
async execute(input) {
  try {
    // Execute workflow
    const riskResult = await this.executeAgent('risk', input);
    
    if (!riskResult.success) {
      // Abort workflow
      return this.abortWorkflow(context, 'Risk assessment failed');
    }
    
    // Continue...
  } catch (error) {
    // Critical failure
    await this.abortWorkflow(context, error.message, error);
    return this.error('Workflow failed', error);
  }
}
```

### Level 3: Service-Level Errors
```javascript
// Express error middleware
app.use((err, req, res, next) => {
  logger.error('Service error', { error: err });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

---

## Retry Logic

### Automatic Retries
- **ML API calls:** 3 retries with exponential backoff
- **Database operations:** 2 retries with 1s delay
- **Payment gateway:** 3 retries with 5s delay

### Manual Retries
- Failed events can be reprocessed via:
  ```bash
  POST /process-event
  {
    "eventId": "EVT-...",
    "userId": "...",
    "policyId": "..."
  }
  ```

---

## Monitoring & Observability

### Logged Data Points
1. **Event Start:** `eventId`, `userId`, `policyId`, `timestamp`
2. **Each Agent:** `agentName`, `input`, `output`, `duration`, `success`
3. **ML Predictions:** `modelName`, `features`, `prediction`, `confidence`
4. **Database Ops:** `operation`, `collection`, `documentId`, `duration`
5. **Event End:** `totalDuration`, `status`, `claimId`

### Metrics to Track
- **Processing Time:** p50, p95, p99 latencies
- **Success Rate:** % of events processed successfully
- **Agent Performance:** Individual agent success rates
- **ML Model Performance:** Prediction accuracy, confidence distribution
- **Database Performance:** Query times, connection pool usage

---

## Testing Workflow

### Unit Test Individual Agents
```bash
npm run test:agents
```

### Integration Test Full Workflow
```bash
# 1. Create test event
POST /create-test-event

# 2. Process event
POST /process-event
{
  "eventId": "<from_step_1>",
  "userId": "TEST_USER_001",
  "policyId": "TEST_POLICY_001"
}

# 3. Verify result
- Claim created ✓
- Payment processed ✓
- User notified ✓
```

---

**For more details, see:**
- [Agent Implementation Guide](./AGENTS.md)
- [ML Integration](./ML_INTEGRATION.md)
- [Database Schema](../README.md#database-schema)
