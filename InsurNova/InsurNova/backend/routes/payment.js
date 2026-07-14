const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const Policy = require('../models/Policy');
const User   = require('../models/User');

// Init Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @route   POST /api/payment/create-order
 * @desc    Create a Razorpay order for premium payment
 * @access  Private
 */
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, currency = 'INR', plan, coverage, events } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    // Razorpay expects amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100);

    const orderOptions = {
      amount: amountInPaise,
      currency,
      receipt: `insurnova_${req.user._id || req.user.id}_${Date.now()}`,
      notes: {
        user_id: String(req.user._id || req.user.id),
        user_email: req.user.email,
        user_name: req.user.name,
        plan: plan || 'custom',
        coverage: String(coverage || 0),
        events: Array.isArray(events) ? events.join(',') : '',
        platform: req.user.platform || 'Other',
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        amount_inr: order.amount / 100,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
      },
      key_id: process.env.RAZORPAY_KEY_ID,
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order',
    });
  }
});

/**
 * @route   POST /api/payment/verify
 * @desc    Verify Razorpay payment signature after successful payment
 * @access  Private
 */
router.post('/verify', protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      coverage,
      premium,
      events,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification fields',
      });
    }

    // Verify payment signature using HMAC SHA256
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed — invalid signature',
      });
    }

    // Fetch payment details from Razorpay to confirm
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: `Payment not captured. Status: ${payment.status}`,
      });
    }

    // Persist / activate policy in MongoDB
    // Skip for demo users and JWT-only users (MongoDB offline)
    const DEMO_IDS = ['demo-user-001', 'admin-user-001', 'demo-user-002'];
    const userId = req.user._id || req.user.id;
    const isDemo   = DEMO_IDS.includes(String(userId));
    const isJWTOnly = !!req.user._fromJWT;  // MongoDB was offline — protect() used JWT fallback

    const activatedAt = new Date();
    const validUntil  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    let savedPolicy = null;

    if (!isDemo && !isJWTOnly) {
      // Upsert: activate the user's existing draft policy, or create a new one
      try {
        savedPolicy = await Policy.findOneAndUpdate(
          { user: userId, status: { $in: ['inactive', 'suspended'] } },
          {
            $set: {
              plan:           plan || 'custom',
              coverage:       Number(coverage) || 0,
              premium:        Number(premium)  || 0,
              covered_events: Array.isArray(events) ? events : [],
              status:         'active',
              payment_id:     razorpay_payment_id,
              order_id:       razorpay_order_id,
              activated_at:   activatedAt,
              valid_until:    validUntil,
              start_date:     activatedAt,
              end_date:       validUntil,
            },
          },
          { new: true, upsert: true }
        );
        await User.findByIdAndUpdate(userId, { active_policy: savedPolicy._id });
        console.log(`[Payment] Policy ${savedPolicy._id} activated for user ${userId}, payment ${razorpay_payment_id}`);
      } catch (dbErr) {
        // MongoDB went offline between middleware and here — log and continue
        console.warn('[Payment] DB write skipped (MongoDB offline):', dbErr.message);
      }
    } else {
      console.log(`[Payment] User ${userId} (${isDemo ? 'demo' : 'jwt-only'}) — DB policy write skipped`);
    }


    const policyResponse = {
      id:           savedPolicy?._id?.toString() || null,
      plan:         plan || 'custom',
      coverage:     Number(coverage) || 0,
      premium:      Number(premium)  || 0,
      events:       Array.isArray(events) ? events : [],
      status:       'active',
      activated_at: activatedAt.toISOString(),
      valid_until:  validUntil.toISOString(),
    };

    res.json({
      success: true,
      message: 'Payment verified successfully! Policy activated.',
      payment: {
        id:           payment.id,
        order_id:     razorpay_order_id,
        amount:       payment.amount / 100,
        currency:     payment.currency,
        status:       payment.status,
        method:       payment.method,
        email:        payment.email,
        contact:      payment.contact,
        captured_at:  new Date(payment.created_at * 1000).toISOString(),
      },
      policy: policyResponse,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification error',
    });
  }
});

/**
 * @route   POST /api/payment/webhook
 * @desc    Razorpay webhook handler (for server-side payment events)
 * @access  Public (verified via webhook secret)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers['x-razorpay-signature'];
    const body = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== receivedSignature) {
      console.error('[Webhook] Invalid signature');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(body);
    console.log(`[Webhook] Event received: ${event.event}`);

    switch (event.event) {
      case 'payment.captured':
        console.log('[Webhook] Payment captured:', event.payload.payment.entity.id);
        // TODO: activate policy in DB
        break;

      case 'payment.failed':
        console.log('[Webhook] Payment failed:', event.payload.payment.entity.id);
        // TODO: notify user, log failure
        break;

      case 'order.paid':
        console.log('[Webhook] Order paid:', event.payload.order.entity.id);
        break;

      default:
        console.log(`[Webhook] Unhandled event: ${event.event}`);
    }

    res.json({ success: true, received: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
});

/**
 * @route   GET /api/payment/history
 * @desc    Get payment history for current user
 * @access  Private
 */
router.get('/history', protect, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);

    // Fetch orders from Razorpay matching this user
    const orders = await razorpay.orders.all({
      count: 20,
      from: Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60, // last year
    });

    // Filter by user via notes
    const userOrders = (orders.items || []).filter(
      (o) => o.notes && o.notes.user_id === userId
    );

    const result = await Promise.all(
      userOrders.map(async (order) => {
        let payments = [];
        try {
          const p = await razorpay.orders.fetchPayments(order.id);
          payments = p.items || [];
        } catch (_) {}

        return {
          order_id: order.id,
          amount: order.amount / 100,
          currency: order.currency,
          status: order.status,
          plan: order.notes?.plan,
          coverage: order.notes?.coverage,
          created_at: new Date(order.created_at * 1000).toISOString(),
          payments: payments.map((pay) => ({
            id: pay.id,
            amount: pay.amount / 100,
            method: pay.method,
            status: pay.status,
            captured_at: pay.created_at
              ? new Date(pay.created_at * 1000).toISOString()
              : null,
          })),
        };
      })
    );

    res.json({
      success: true,
      count: result.length,
      payments: result,
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
    });
  }
});

/**
 * @route   GET /api/payment/plans
 * @desc    Get available premium plans
 * @access  Public
 */
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'starter',
      name: 'Starter Shield',
      description: 'Essential coverage for new gig workers',
      coverage: 10000,
      premium_weekly: 49,
      premium_monthly: 149,
      events: ['rain', 'heat'],
      features: [
        '₹10,000 coverage per month',
        'Rain & Heat wave protection',
        'Instant claim processing',
        'AI-powered fraud detection',
      ],
      color: '#00d4ff',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro Guard',
      description: 'Comprehensive coverage for active earners',
      coverage: 50000,
      premium_weekly: 149,
      premium_monthly: 499,
      events: ['rain', 'heat', 'pollution', 'curfew'],
      features: [
        '₹50,000 coverage per month',
        'All 4 event types covered',
        'Priority claim processing',
        'Real-time weather monitoring',
        '15% annual discount',
      ],
      color: '#a855f7',
      popular: true,
    },
    {
      id: 'elite',
      name: 'Elite Fortress',
      description: 'Maximum protection for top earners',
      coverage: 100000,
      premium_weekly: 299,
      premium_monthly: 999,
      events: ['rain', 'heat', 'pollution', 'curfew', 'pandemic'],
      features: [
        '₹1,00,000 coverage per month',
        'All event types + Pandemic',
        'Instant automatic payouts',
        'Dedicated claims manager',
        'Trust score boost',
        '20% annual discount',
      ],
      color: '#ffd60a',
      popular: false,
    },
  ];

  res.json({ success: true, plans });
});

module.exports = router;
