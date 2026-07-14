/**
 * Supabase Models
 * Database query helpers for InsurNova - replaces Mongoose models
 */

const database = require('./connection');

// Helper to get Supabase client
const getClient = () => database.getClient();

// ============================================
// USER MODEL
// ============================================
const User = {
  tableName: 'users',

  async findOne(query) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).select('*');
    
    if (query.userId) queryBuilder = queryBuilder.eq('user_id', query.userId);
    if (query.email) queryBuilder = queryBuilder.eq('email', query.email);
    if (query.user_id) queryBuilder = queryBuilder.eq('user_id', query.user_id);
    
    const { data, error } = await queryBuilder.limit(1).single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data ? this._transform(data) : null;
  },

  async find(query = {}) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).select('*');
    
    if (query.userId) queryBuilder = queryBuilder.eq('user_id', query.userId);
    if (query.email) queryBuilder = queryBuilder.eq('email', query.email);
    
    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data.map(d => this._transform(d));
  },

  async create(userData) {
    const client = getClient();
    const row = this._toRow(userData);
    
    const { data, error } = await client.from(this.tableName).insert(row).select().single();
    if (error) throw error;
    return this._transform(data);
  },

  async save(user) {
    const client = getClient();
    const row = this._toRow(user);
    
    if (user.id) {
      const { data, error } = await client.from(this.tableName).update(row).eq('id', user.id).select().single();
      if (error) throw error;
      return this._transform(data);
    } else {
      return this.create(user);
    }
  },

  async updateOne(query, update) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).update(this._toRow(update));
    
    if (query.userId) queryBuilder = queryBuilder.eq('user_id', query.userId);
    if (query.email) queryBuilder = queryBuilder.eq('email', query.email);
    
    const { data, error } = await queryBuilder.select().single();
    if (error) throw error;
    return this._transform(data);
  },

  // Mongoose-style helper used by agents
  async findOneAndUpdate(filter, update) {
    const client = getClient();

    // Find the user row first
    let selectQuery = client.from(this.tableName).select('*');
    if (filter.userId) selectQuery = selectQuery.eq('user_id', filter.userId);
    if (filter.email) selectQuery = selectQuery.eq('email', filter.email);

    const { data: rows, error: selectError } = await selectQuery.limit(1);
    if (selectError) throw selectError;
    const existing = rows && rows[0];
    if (!existing) return null;

    const updates = {};

    // Handle wallet balance increment: { $inc: { 'wallet.balance': amount } }
    if (update.$inc && typeof update.$inc['wallet.balance'] === 'number') {
      const inc = update.$inc['wallet.balance'];
      const current = existing.wallet_balance || 0;
      updates.wallet_balance = current + inc;
    }

    // Handle churn score update: { 'riskProfile.churnScore': value }
    if (Object.prototype.hasOwnProperty.call(update, 'riskProfile.churnScore')) {
      updates.risk_churn_score = update['riskProfile.churnScore'];
    }

    if (!Object.keys(updates).length) {
      // Nothing to update
      return this._transform(existing);
    }

    const { data, error } = await client
      .from(this.tableName)
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return this._transform(data);
  },

  _toRow(obj) {
    return {
      user_id: obj.userId,
      email: obj.email,
      password: obj.password,
      phone: obj.phone,
      name: obj.name,
      occupation: obj.occupation,
      platform: obj.platform,
      location_city: obj.location?.city,
      location_state: obj.location?.state,
      location_country: obj.location?.country,
      location_latitude: obj.location?.coordinates?.latitude,
      location_longitude: obj.location?.coordinates?.longitude,
      profile_completed: obj.profileCompleted,
      vehicle_type: obj.vehicleType,
      work_type: obj.workType,
      avg_daily_earnings: obj.avgDailyEarnings,
      working_hours: obj.workingHours,
      fraud_score: obj.fraudScore,
      trust_score: obj.trustScore ?? obj.trust_score,
      kyc_verified: obj.kycVerified,
      role: obj.role,
      risk_churn_score: obj.riskProfile?.churnScore,
      risk_fraud_risk: obj.riskProfile?.fraudRisk,
      risk_claim_history: obj.riskProfile?.claimHistory,
      wallet_balance: obj.wallet?.balance,
      wallet_currency: obj.wallet?.currency,
    };
  },

  _transform(row) {
    if (!row) return null;
    return {
      id: row.id,
      mongo_id: row.mongo_id,
      userId: row.user_id,
      email: row.email,
      password: row.password,
      phone: row.phone,
      name: row.name,
      occupation: row.occupation,
      platform: row.platform,
      location: {
        city: row.location_city,
        state: row.location_state,
        country: row.location_country,
        coordinates: {
          latitude: row.location_latitude,
          longitude: row.location_longitude
        }
      },
      profileCompleted: row.profile_completed,
      vehicleType: row.vehicle_type,
      workType: row.work_type,
      avgDailyEarnings: row.avg_daily_earnings,
      workingHours: row.working_hours,
      fraudScore: row.fraud_score,
      trustScore: row.trust_score,
      trust_score: row.trust_score,
      kycVerified: row.kyc_verified,
      role: row.role,
      riskProfile: {
        churnScore: row.risk_churn_score,
        fraudRisk: row.risk_fraud_risk,
        claimHistory: row.risk_claim_history
      },
      wallet: {
        balance: row.wallet_balance,
        currency: row.wallet_currency
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      toObject() { return this; },
      async save() { return User.save(this); }
    };
  },

  // Factory method to create a new user instance (not saved)
  new(data) {
    return {
      ...data,
      toObject() { return this; },
      async save() { return User.create(this); }
    };
  }
};

// ============================================
// POLICY MODEL
// ============================================
const Policy = {
  tableName: 'policies',

  async findOne(query) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).select('*');
    
    if (query.policyId) queryBuilder = queryBuilder.eq('policy_id', query.policyId);
    if (query.userId) queryBuilder = queryBuilder.eq('user_id', query.userId);
    if (query.status) queryBuilder = queryBuilder.eq('status', query.status);
    
    const { data, error } = await queryBuilder.limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? this._transform(data) : null;
  },

  find(query = {}) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).select('*');
    
    if (query.userId) queryBuilder = queryBuilder.eq('user_id', query.userId);
    if (query.status) queryBuilder = queryBuilder.eq('status', query.status);
    
    const self = this;
    
    const builder = {
      sort(sortObj) {
        const [field, order] = Object.entries(sortObj)[0] || ['created_at', -1];
        const ascending = order === 1;
        const mappedField = field === 'createdAt' ? 'created_at' : field;
        queryBuilder = queryBuilder.order(mappedField, { ascending });
        return builder;
      },
      limit(n) {
        queryBuilder = queryBuilder.limit(n);
        return builder;
      },
      async lean() {
        const { data, error } = await queryBuilder;
        if (error) throw error;
        return data.map(d => self._transform(d));
      },
      async then(resolve, reject) {
        try {
          const { data, error } = await queryBuilder;
          if (error) throw error;
          resolve(data.map(d => self._transform(d)));
        } catch (e) { reject(e); }
      }
    };
    
    return builder;
  },

  async create(policyData) {
    const client = getClient();
    const row = this._toRow(policyData);
    
    const { data, error } = await client.from(this.tableName).insert(row).select().single();
    if (error) throw error;
    return this._transform(data);
  },

  async save(policy) {
    const client = getClient();
    const row = this._toRow(policy);
    
    if (policy.id) {
      const { data, error } = await client.from(this.tableName).update(row).eq('id', policy.id).select().single();
      if (error) throw error;
      return this._transform(data);
    } else {
      return this.create(policy);
    }
  },

  _toRow(obj) {
    return {
      policy_id: obj.policyId,
      user_id: obj.userId,
      policy_type: obj.policyType,
      status: obj.status,
      coverage_event_types: obj.coverage?.eventTypes,
      coverage_max_payout_per_event: obj.coverage?.maxPayoutPerEvent,
      coverage_total_limit: obj.coverage?.totalCoverageLimit,
      coverage_deductible: obj.coverage?.deductible,
      coverage_payout_structure: obj.coverage?.payoutStructure,
      premium_amount: obj.premium?.amount,
      premium_frequency: obj.premium?.frequency,
      premium_next_due_date: obj.premium?.nextDueDate,
      premium_is_paid: obj.premium?.isPaid,
      coverage: obj.coverage?.totalCoverageLimit,
      covered_events: obj.covered_events,
      claims_made: obj.claims_made,
      total_payout: obj.total_payout,
      exclusions: obj.exclusions,
      location_city: obj.location?.city,
      location_state: obj.location?.state,
      location_country: obj.location?.country,
      start_date: obj.startDate,
      end_date: obj.endDate,
    };
  },

  _transform(row) {
    if (!row) return null;
    return {
      id: row.id,
      mongo_id: row.mongo_id,
      policyId: row.policy_id,
      userId: row.user_id,
      policyType: row.policy_type,
      status: row.status,
      coverage: {
        eventTypes: row.coverage_event_types || row.covered_events || [],
        maxPayoutPerEvent: row.coverage_max_payout_per_event,
        totalCoverageLimit: row.coverage_total_limit || row.coverage,
        deductible: row.coverage_deductible,
        payoutStructure: row.coverage_payout_structure
      },
      premium: {
        amount: row.premium_amount,
        frequency: row.premium_frequency,
        nextDueDate: row.premium_next_due_date,
        isPaid: row.premium_is_paid
      },
      covered_events: row.covered_events,
      claims_made: row.claims_made,
      total_payout: row.total_payout,
      exclusions: row.exclusions,
      location: {
        city: row.location_city,
        state: row.location_state,
        country: row.location_country
      },
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      toObject() { return this; },
      async save() { return Policy.save(this); }
    };
  },

  new(data) {
    return {
      ...data,
      toObject() { return this; },
      async save() { return Policy.create(this); }
    };
  }
};

// ============================================
// EVENT MODEL
// ============================================
const Event = {
  tableName: 'events',

  async findOne(query) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).select('*');
    
    if (query.eventId) queryBuilder = queryBuilder.eq('event_id', query.eventId);
    
    const { data, error } = await queryBuilder.limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? this._transform(data) : null;
  },

  find(query = {}) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).select('*');
    
    if (query.eventId) {
      if (query.eventId.$in) {
        queryBuilder = queryBuilder.in('event_id', query.eventId.$in);
      } else {
        queryBuilder = queryBuilder.eq('event_id', query.eventId);
      }
    }
    
    const self = this;
    
    const builder = {
      select(fields) {
        // Supabase select is already done, this is a no-op for compatibility
        return builder;
      },
      sort(sortObj) {
        const [field, order] = Object.entries(sortObj)[0] || ['created_at', -1];
        const ascending = order === 1;
        const mappedField = field === 'createdAt' ? 'created_at' : field === 'timestamp' ? 'timestamp' : field;
        queryBuilder = queryBuilder.order(mappedField, { ascending });
        return builder;
      },
      limit(n) {
        queryBuilder = queryBuilder.limit(n);
        return builder;
      },
      async lean() {
        const { data, error } = await queryBuilder;
        if (error) throw error;
        return data.map(d => self._transform(d));
      },
      async then(resolve, reject) {
        try {
          const { data, error } = await queryBuilder;
          if (error) throw error;
          resolve(data.map(d => self._transform(d)));
        } catch (e) { reject(e); }
      }
    };
    
    return builder;
  },

  async create(eventData) {
    const client = getClient();
    const row = this._toRow(eventData);
    
    const { data, error } = await client.from(this.tableName).insert(row).select().single();
    if (error) throw error;
    return this._transform(data);
  },

  async save(event) {
    const client = getClient();
    const row = this._toRow(event);
    
    if (event.id) {
      const { data, error } = await client.from(this.tableName).update(row).eq('id', event.id).select().single();
      if (error) throw error;
      return this._transform(data);
    } else {
      return this.create(event);
    }
  },

  // Minimal findOneAndUpdate used by orchestrator to update status
  async findOneAndUpdate(filter, update) {
    const client = getClient();
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(update, 'status')) {
      updates.status = update.status;
    }

    if (!Object.keys(updates).length) return null;

    const { data, error } = await client
      .from(this.tableName)
      .update(updates)
      .eq('event_id', filter.eventId)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this._transform(data) : null;
  },

  _toRow(obj) {
    return {
      event_id: obj.eventId,
      type: obj.type,
      severity: obj.severity,
      location_city: obj.location?.city,
      location_state: obj.location?.state,
      location_country: obj.location?.country,
      location_latitude: obj.location?.coordinates?.latitude,
      location_longitude: obj.location?.coordinates?.longitude,
      timestamp: obj.timestamp,
      duration: obj.duration,
      metadata_temperature: obj.metadata?.temperature,
      metadata_rainfall: obj.metadata?.rainfall,
      metadata_pollution_index: obj.metadata?.pollutionIndex,
      metadata_wind_speed: obj.metadata?.windSpeed,
      metadata_humidity: obj.metadata?.humidity,
      metadata_source: obj.metadata?.source,
      status: obj.status,
      affected_policies: obj.affectedPolicies,
      processing_logs: obj.processingLogs,
    };
  },

  _transform(row) {
    if (!row) return null;
    return {
      id: row.id,
      mongo_id: row.mongo_id,
      eventId: row.event_id,
      type: row.type,
      severity: row.severity,
      location: {
        city: row.location_city,
        state: row.location_state,
        country: row.location_country,
        coordinates: {
          latitude: row.location_latitude,
          longitude: row.location_longitude
        }
      },
      timestamp: row.timestamp,
      duration: row.duration,
      metadata: {
        temperature: row.metadata_temperature,
        rainfall: row.metadata_rainfall,
        pollutionIndex: row.metadata_pollution_index,
        windSpeed: row.metadata_wind_speed,
        humidity: row.metadata_humidity,
        source: row.metadata_source
      },
      status: row.status,
      affectedPolicies: row.affected_policies,
      processingLogs: row.processing_logs,
      createdAt: row.created_at,
      toObject() { return this; },
      async save() { return Event.save(this); }
    };
  },

  new(data) {
    return {
      ...data,
      toObject() { return this; },
      async save() { return Event.create(this); }
    };
  }
};

// ============================================
// CLAIM MODEL
// ============================================
const Claim = {
  tableName: 'claims',

  async findOne(query) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).select('*');
    
    if (query.claimId) queryBuilder = queryBuilder.eq('claim_id', query.claimId);
    if (query.userId) queryBuilder = queryBuilder.eq('user_id', query.userId);
    
    const { data, error } = await queryBuilder.limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? this._transform(data) : null;
  },

  find(query = {}) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).select('*');
    
    if (query.userId) queryBuilder = queryBuilder.eq('user_id', query.userId);
    if (query.status) queryBuilder = queryBuilder.eq('status', query.status);
    
    const self = this;
    
    // Return chainable query builder (NOT a thenable until lean() is called)
    const builder = {
      sort(sortObj) {
        const [field, order] = Object.entries(sortObj)[0] || ['created_at', -1];
        const ascending = order === 1;
        const mappedField = field === 'createdAt' ? 'created_at' : field;
        queryBuilder = queryBuilder.order(mappedField, { ascending });
        return builder;
      },
      limit(n) {
        queryBuilder = queryBuilder.limit(n);
        return builder;
      },
      async lean() {
        const { data, error } = await queryBuilder;
        if (error) throw error;
        return data.map(d => self._transform(d));
      },
      // For direct await without lean()
      async then(resolve, reject) {
        try {
          const { data, error } = await queryBuilder;
          if (error) throw error;
          resolve(data.map(d => self._transform(d)));
        } catch (e) { reject(e); }
      }
    };
    
    return builder;
  },

  async create(claimData) {
    const client = getClient();
    const row = this._toRow(claimData);
    
    const { data, error } = await client.from(this.tableName).insert(row).select().single();
    if (error) throw error;
    return this._transform(data);
  },

  async save(claim) {
    const client = getClient();
    const row = this._toRow(claim);
    
    if (claim.id) {
      const { data, error } = await client.from(this.tableName).update(row).eq('id', claim.id).select().single();
      if (error) throw error;
      return this._transform(data);
    } else {
      return this.create(claim);
    }
  },

  // Mongoose-style helper used by orchestrator, wallet, explanation agents
  async findOneAndUpdate(filter, update) {
    const client = getClient();

    // Build update payload
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(update, 'status')) {
      updates.status = update.status;
    }

    if (Object.prototype.hasOwnProperty.call(update, 'paidAt')) {
      updates.paid_at = update.paidAt;
    }

    if (Object.prototype.hasOwnProperty.call(update, 'processedAt')) {
      updates.processed_at = update.processedAt;
    }

    // Dot-notation for amount fields
    if (Object.prototype.hasOwnProperty.call(update, 'amount.approved')) {
      updates.amount_approved = update['amount.approved'];
    }
    if (Object.prototype.hasOwnProperty.call(update, 'amount.paid')) {
      updates.amount_paid = update['amount.paid'];
    }

    // Direct amount object (if ever passed)
    if (update.amount) {
      if (Object.prototype.hasOwnProperty.call(update.amount, 'calculated')) {
        updates.amount_calculated = update.amount.calculated;
      }
      if (Object.prototype.hasOwnProperty.call(update.amount, 'approved')) {
        updates.amount_approved = update.amount.approved;
      }
      if (Object.prototype.hasOwnProperty.call(update.amount, 'paid')) {
        updates.amount_paid = update.amount.paid;
      }
      if (Object.prototype.hasOwnProperty.call(update.amount, 'currency')) {
        updates.amount_currency = update.amount.currency;
      }
    }

    // Explanation object
    if (update.explanation) {
      updates.explanation_summary = update.explanation.summary;
      updates.explanation_factors = update.explanation.factors;
      updates.explanation_reasoning = update.explanation.reasoning;
    }

    if (!Object.keys(updates).length) return null;

    const { data, error } = await client
      .from(this.tableName)
      .update(updates)
      .eq('claim_id', filter.claimId)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this._transform(data) : null;
  },

  _toRow(obj) {
    return {
      claim_id: obj.claimId,
      user_id: obj.userId,
      policy_id: obj.policyId,
      event_id: obj.eventId,
      status: obj.status,
      amount_calculated: obj.amount?.calculated,
      amount_approved: obj.amount?.approved,
      amount_paid: obj.amount?.paid,
      amount_currency: obj.amount?.currency,
      assessment_risk_score: obj.assessment?.riskScore,
      assessment_severity: obj.assessment?.severity,
      assessment_payout_percentage: obj.assessment?.payoutPercentage,
      assessment_confidence: obj.assessment?.confidence,
      fraud_is_fraudulent: obj.fraudCheck?.isFraudulent,
      fraud_score: obj.fraudCheck?.fraudScore,
      fraud_reasons: obj.fraudCheck?.reasons,
      fraud_confidence: obj.fraudCheck?.confidence,
      exclusion_is_excluded: obj.exclusionCheck?.isExcluded,
      exclusion_reasons: obj.exclusionCheck?.reasons,
      exclusion_details: obj.exclusionCheck?.details,
      agent_decisions: obj.agentDecisions,
      explanation_summary: obj.explanation?.summary,
      explanation_factors: obj.explanation?.factors,
      explanation_reasoning: obj.explanation?.reasoning,
      processed_at: obj.processedAt,
      approved_at: obj.approvedAt,
      paid_at: obj.paidAt,
      rejection_reason: obj.rejectionReason,
    };
  },

  _transform(row) {
    if (!row) return null;
    return {
      id: row.id,
      mongo_id: row.mongo_id,
      claimId: row.claim_id,
      userId: row.user_id,
      policyId: row.policy_id,
      eventId: row.event_id,
      status: row.status,
      amount: {
        calculated: row.amount_calculated,
        approved: row.amount_approved,
        paid: row.amount_paid,
        currency: row.amount_currency
      },
      assessment: {
        riskScore: row.assessment_risk_score,
        severity: row.assessment_severity,
        payoutPercentage: row.assessment_payout_percentage,
        confidence: row.assessment_confidence
      },
      fraudCheck: {
        isFraudulent: row.fraud_is_fraudulent,
        fraudScore: row.fraud_score,
        reasons: row.fraud_reasons,
        confidence: row.fraud_confidence
      },
      exclusionCheck: {
        isExcluded: row.exclusion_is_excluded,
        reasons: row.exclusion_reasons,
        details: row.exclusion_details
      },
      agentDecisions: row.agent_decisions,
      explanation: {
        summary: row.explanation_summary,
        factors: row.explanation_factors,
        reasoning: row.explanation_reasoning
      },
      processedAt: row.processed_at,
      approvedAt: row.approved_at,
      paidAt: row.paid_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      toObject() { return this; },
      async save() { return Claim.save(this); }
    };
  },

  new(data) {
    return {
      ...data,
      toObject() { return this; },
      async save() { return Claim.create(this); }
    };
  }
};

// ============================================
// TRANSACTION MODEL
// ============================================
const Transaction = {
  tableName: 'transactions',

  async findOne(query) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).select('*');
    
    if (query.transactionId) queryBuilder = queryBuilder.eq('transaction_id', query.transactionId);
    
    const { data, error } = await queryBuilder.limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? this._transform(data) : null;
  },

  async find(query = {}) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).select('*');
    
    if (query.userId) queryBuilder = queryBuilder.eq('user_id', query.userId);
    if (query.type) queryBuilder = queryBuilder.eq('type', query.type);
    
    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data.map(d => this._transform(d));
  },

  async create(txnData) {
    const client = getClient();
    const row = this._toRow(txnData);
    
    const { data, error } = await client.from(this.tableName).insert(row).select().single();
    if (error) throw error;
    return this._transform(data);
  },

  async save(txn) {
    const client = getClient();
    const row = this._toRow(txn);
    
    if (txn.id) {
      const { data, error } = await client.from(this.tableName).update(row).eq('id', txn.id).select().single();
      if (error) throw error;
      return this._transform(data);
    } else {
      return this.create(txn);
    }
  },

  _toRow(obj) {
    return {
      transaction_id: obj.transactionId,
      user_id: obj.userId,
      claim_id: obj.claimId,
      type: obj.type,
      amount: obj.amount,
      currency: obj.currency,
      status: obj.status,
      payment_method: obj.paymentMethod,
      payment_gateway: obj.paymentGateway,
      gateway_transaction_id: obj.gatewayTransactionId,
      metadata: obj.metadata,
      processed_at: obj.processedAt,
    };
  },

  _transform(row) {
    if (!row) return null;
    return {
      id: row.id,
      mongo_id: row.mongo_id,
      transactionId: row.transaction_id,
      userId: row.user_id,
      claimId: row.claim_id,
      type: row.type,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      paymentMethod: row.payment_method,
      paymentGateway: row.payment_gateway,
      gatewayTransactionId: row.gateway_transaction_id,
      metadata: row.metadata,
      processedAt: row.processed_at,
      createdAt: row.created_at,
      toObject() { return this; },
      async save() { return Transaction.save(this); }
    };
  },

  new(data) {
    return {
      ...data,
      toObject() { return this; },
      async save() { return Transaction.create(this); }
    };
  }
};

// ============================================
// PREDICTION LOG MODEL
// ============================================
const PredictionLog = {
  tableName: 'prediction_logs',

  async create(logData) {
    const client = getClient();
    const row = {
      model_name: logData.modelName,
      model_version: logData.modelVersion,
      input: logData.input,
      output: logData.output,
      confidence: logData.confidence,
      latency: logData.latency,
      event_id: logData.eventId,
      claim_id: logData.claimId,
    };
    
    const { data, error } = await client.from(this.tableName).insert(row).select().single();
    if (error) throw error;
    return data;
  },

  async find(query = {}) {
    const client = getClient();
    let queryBuilder = client.from(this.tableName).select('*');
    
    if (query.modelName) queryBuilder = queryBuilder.eq('model_name', query.modelName);
    
    const { data, error } = await queryBuilder.order('timestamp', { ascending: false });
    if (error) throw error;
    return data;
  }
};

module.exports = {
  User,
  Policy,
  Event,
  Claim,
  Transaction,
  PredictionLog
};
