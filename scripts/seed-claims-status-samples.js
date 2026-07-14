require('dotenv').config();

const database = require('../shared/database/connection');

async function main() {
  try {
    if (!database.isConnected()) {
      await database.connect();
    }

    const client = database.getClient();

    const now = new Date();
    const baseDate = new Date(now.getFullYear(), now.getMonth() - 3, 1); // ~3 months back

    const statuses = [
      'APPROVED',
      'PAID',
      'PENDING',
      'REJECTED',
      'FRAUD_DETECTED',
    ];

    // Clean up old seeded claims so we can reseed with new, more realistic payouts
    await client.from('claims').delete().like('claim_id', 'SEED-CLAIM-%');

    const baseCoverage = 2000; // approximate per-event coverage for demo
    const payoutFactors = {
      APPROVED: 0.7,        // 70% of coverage
      PAID: 0.9,            // 90% of coverage (highest)
      PENDING: 0.5,         // 50% expected payout
      REJECTED: 0.25,       // 25% theoretical amount
      FRAUD_DETECTED: 0.15, // 15% theoretical amount
    };

    const rows = statuses.map((status, idx) => {
      const createdAt = new Date(baseDate.getTime() + idx * 7 * 24 * 60 * 60 * 1000); // spaced by a week
      const factor = payoutFactors[status] || 0.4;
      const amountBase = Math.round(baseCoverage * factor);

      let calculated = amountBase;
      let approved = 0;
      let paid = 0;

      if (status === 'APPROVED') {
        approved = amountBase;
      } else if (status === 'PAID') {
        approved = amountBase;
        paid = amountBase;
      } else if (status === 'PENDING') {
        calculated = amountBase;
      } else if (status === 'REJECTED' || status === 'FRAUD_DETECTED') {
        calculated = amountBase;
        approved = 0;
        paid = 0;
      }

      return {
        claim_id: `SEED-CLAIM-${status}-${Date.now()}-${idx}`,
        user_id: 'TEST_USER_001',
        policy_id: 'TEST_POLICY_001',
        event_id: `SEED-EVENT-${status}-${idx}`,
        status,
        amount_calculated: calculated,
        amount_approved: approved,
        amount_paid: paid,
        amount_currency: 'INR',
        processed_at: createdAt.toISOString(),
      };
    });

    const { data, error } = await client
      .from('claims')
      .insert(rows)
      .select();

    if (error) throw error;

    // eslint-disable-next-line no-console
    console.log('✅ Seeded claims for statuses:', statuses.join(', '));
    // eslint-disable-next-line no-console
    console.log('Inserted rows:', data.length);

    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error seeding claims:', err.message || err);
    process.exit(1);
  }
}

main();
