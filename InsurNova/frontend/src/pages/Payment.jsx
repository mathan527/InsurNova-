import { useState, useEffect } from 'react';
import {
  Shield, Zap, Star, CheckCircle, CreditCard, Lock,
  ArrowRight, Sparkles, Clock, TrendingUp, X, AlertCircle, LayoutDashboard,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SdL92ZDiCcokYu';

// ─── Plan icons ───────────────────────────────────────────────────────────────
const PLAN_ICONS = {
  starter: Shield,
  pro: Zap,
  elite: Star,
};

const PLAN_GRADIENTS = {
  starter: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,149,182,0.06))',
  pro:     'linear-gradient(135deg, rgba(168,85,247,0.14), rgba(99,102,241,0.06))',
  elite:   'linear-gradient(135deg, rgba(255,214,10,0.14), rgba(255,159,10,0.06))',
};

const PLAN_BORDERS = {
  starter: 'rgba(0,212,255,0.25)',
  pro:     'rgba(168,85,247,0.35)',
  elite:   'rgba(255,214,10,0.3)',
};

export default function Payment() {
  const [plans, setPlans]           = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'weekly' | 'monthly'
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(null);
  const [error, setError]           = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // ── Load Razorpay checkout script ──────────────────────────────────────────
  useEffect(() => {
    if (window.Razorpay) { setScriptLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => console.error('[Payment] Razorpay script failed to load');
    document.body.appendChild(script);
    return () => { try { document.body.removeChild(script); } catch(_) {} };
  }, []);

  // ── Fetch plans from backend ───────────────────────────────────────────────
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/payment/plans`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success && data.plans) {
          setPlans(data.plans);
          const defaultPro = data.plans.find(p => p.popular);
          setSelectedPlan(defaultPro || data.plans[1] || data.plans[0]);
        }
      } catch (err) {
        console.warn('[Payment] Plans fetch failed, using fallback');
        // Static fallback if backend offline
        const fallback = [
          {
            id: 'starter', name: 'Starter Shield',
            description: 'Essential coverage for new gig workers',
            coverage: 10000, premium_weekly: 49, premium_monthly: 149,
            events: ['rain','heat'],
            features: ['₹10,000/month coverage','Rain & Heat protection','Instant claims','AI fraud detection'],
            popular: false,
          },
          {
            id: 'pro', name: 'Pro Guard',
            description: 'Comprehensive coverage for active earners',
            coverage: 50000, premium_weekly: 149, premium_monthly: 499,
            events: ['rain','heat','pollution','curfew'],
            features: ['₹50,000/month coverage','All 4 event types','Priority claims','Real-time monitoring','15% annual saving'],
            popular: true,
          },
          {
            id: 'elite', name: 'Elite Fortress',
            description: 'Maximum protection for top earners',
            coverage: 100000, premium_weekly: 299, premium_monthly: 999,
            events: ['rain','heat','pollution','curfew','pandemic'],
            features: ['₹1,00,000/month coverage','All events + Pandemic','Auto payouts','Dedicated manager','Trust score boost','20% annual saving'],
            popular: false,
          },
        ];
        setPlans(fallback);
        setSelectedPlan(fallback[1]);
      }
    };
    fetchPlans();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getPremium = (plan) =>
    billingCycle === 'weekly' ? plan.premium_weekly : plan.premium_monthly;

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  // ── Handle Pay ─────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!selectedPlan) return;
    if (!scriptLoaded) {
      setError('Razorpay is still loading. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const amount = getPremium(selectedPlan);

      // 1. Create order on backend
      const orderRes = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          plan: selectedPlan.id,
          coverage: selectedPlan.coverage,
          events: selectedPlan.events,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // 2. Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'InsurNova',
        description: `${selectedPlan.name} — ${billingCycle} premium`,
        image: '/insurnova-logo.png',
        order_id: orderData.order.id,
        prefill: {
          name: orderData.user?.name || '',
          email: orderData.user?.email || '',
        },
        theme: {
          color: '#00d4ff',
          backdrop_color: 'rgba(6,13,26,0.9)',
        },
        // ✅ Single merged modal object — previously two `modal` keys existed;
        // JS silently dropped the first (confirm_close, animation were lost).
        modal: {
          confirm_close: true,
          animation: true,
          ondismiss: () => {
            setLoading(false);
            setError('Payment cancelled. Your policy has not been activated.');
          },
        },
        handler: async function (response) {
          // 3. Verify payment on backend
          try {
            const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                plan: selectedPlan.id,
                coverage: selectedPlan.coverage,
                premium: amount,
                events: selectedPlan.events,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setSuccess({
                payment_id: response.razorpay_payment_id,
                plan: selectedPlan.name,
                amount,
                policy: verifyData.policy,
              });
            } else {
              setError(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            setError('Verification error: ' + err.message);
          } finally {
            setLoading(false);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', function (response) {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

      rzpInstance.open();
    } catch (err) {
      console.error('[Payment] Error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div
          className="max-w-lg w-full rounded-3xl p-10 text-center animate-fade-in-up"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,184,148,0.04))',
            border: '1px solid rgba(0,255,136,0.3)',
            boxShadow: '0 0 60px rgba(0,255,136,0.12)',
          }}
        >
          {/* Animated checkmark */}
          <div className="flex items-center justify-center mb-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,184,148,0.1))',
                border: '2px solid rgba(0,255,136,0.4)',
                boxShadow: '0 0 40px rgba(0,255,136,0.3)',
                animation: 'pulse-glow-cyan 2s infinite',
              }}
            >
              <CheckCircle style={{ color: 'var(--neon-green)', width: 48, height: 48 }} />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--neon-green)' }}>
            Payment Successful!
          </h2>
          <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
            Your <strong style={{ color: 'var(--text-primary)' }}>{success.plan}</strong> policy is now active.
          </p>

          <div
            className="rounded-2xl p-5 mb-6 text-left space-y-3"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-muted)' }}>Payment ID</span>
              <span className="font-mono text-xs" style={{ color: 'var(--neon-cyan)' }}>
                {success.payment_id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-muted)' }}>Amount Paid</span>
              <span className="font-bold" style={{ color: 'var(--neon-green)' }}>
                {formatCurrency(success.amount)}
              </span>
            </div>
            {success.policy && (
              <>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-muted)' }}>Coverage</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(success.policy.coverage)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-muted)' }}>Valid Until</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {new Date(success.policy.valid_until).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </a>
            <a
              href="/policies"
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              View Policy
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{
          background: 'rgba(0,212,255,0.08)',
          border: '1px solid rgba(0,212,255,0.2)',
        }}>
          <Sparkles className="w-4 h-4" style={{ color: 'var(--neon-cyan)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--neon-cyan)' }}>
            AI-Powered Parametric Insurance
          </span>
        </div>
        <h1 className="text-4xl font-extrabold mb-3">
          <span className="gradient-text-ai">Choose Your Plan</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Instant payouts. No paperwork. Backed by real ML risk models.
        </p>

        {/* Billing toggle */}
        <div
          className="inline-flex items-center mt-6 rounded-xl p-1"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)' }}
        >
          {['weekly', 'monthly'].map((cycle) => (
            <button
              key={cycle}
              id={`billing-${cycle}`}
              onClick={() => setBillingCycle(cycle)}
              className="px-5 py-2 rounded-lg font-semibold capitalize transition-all duration-200 text-sm"
              style={billingCycle === cycle ? {
                background: 'var(--gradient-primary)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,149,182,0.3)',
              } : {
                color: 'var(--text-secondary)',
                background: 'transparent',
              }}
            >
              {cycle}
              {cycle === 'monthly' && (
                <span
                  className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,255,136,0.15)', color: 'var(--neon-green)' }}
                >
                  Save 15%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Plans grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.id] || Shield;
          const isSelected = selectedPlan?.id === plan.id;
          const premium = getPremium(plan);

          return (
            <div
              key={plan.id}
              id={`plan-${plan.id}`}
              onClick={() => setSelectedPlan(plan)}
              className="relative cursor-pointer rounded-2xl p-6 transition-all duration-300"
              style={{
                background:    isSelected ? PLAN_GRADIENTS[plan.id] : 'var(--glass-bg)',
                border:        isSelected ? `2px solid ${PLAN_BORDERS[plan.id]}` : '1px solid var(--glass-border)',
                transform:     isSelected ? 'translateY(-6px) scale(1.02)' : 'none',
                boxShadow:     isSelected ? `0 20px 60px rgba(0,0,0,0.3), 0 0 30px ${PLAN_BORDERS[plan.id]}40` : 'none',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(168,85,247,0.5)',
                  }}
                >
                  ⭐ Most Popular
                </div>
              )}

              {/* Plan icon + name */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${PLAN_BORDERS[plan.id]}22`,
                    border: `1px solid ${PLAN_BORDERS[plan.id]}`,
                  }}
                >
                  <Icon style={{ color: PLAN_BORDERS[plan.id], width: 24, height: 24 }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    {plan.name}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {plan.description}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    ₹{premium}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    /{billingCycle}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(plan.coverage)} coverage
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: isSelected ? PLAN_BORDERS[plan.id] : 'var(--neon-green)' }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Event tags */}
              <div className="flex flex-wrap gap-1.5">
                {plan.events.map((ev) => (
                  <span
                    key={ev}
                    className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                    style={{
                      background: `${PLAN_BORDERS[plan.id]}18`,
                      color: PLAN_BORDERS[plan.id],
                      border: `1px solid ${PLAN_BORDERS[plan.id]}40`,
                    }}
                  >
                    {ev}
                  </span>
                ))}
              </div>

              {/* Select indicator */}
              {isSelected && (
                <div
                  className="absolute bottom-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: PLAN_BORDERS[plan.id] }}
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Payment Summary + CTA ─────────────────────────────────────────── */}
      {selectedPlan && (
        <div
          className="max-w-xl mx-auto rounded-2xl p-6 animate-fade-in-up"
          style={{
            background: 'rgba(6,13,26,0.8)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Order Summary
          </h3>

          <div className="space-y-3 mb-5">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Plan</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {selectedPlan.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Coverage</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(selectedPlan.coverage)}/month
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Events Covered</span>
              <span className="text-right" style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>
                {selectedPlan.events.join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Billing</span>
              <span className="capitalize" style={{ color: 'var(--text-primary)' }}>
                {billingCycle}
              </span>
            </div>
            <div
              className="border-t my-2"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            />
            <div className="flex justify-between items-center">
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                Total Due Today
              </span>
              <span
                className="text-2xl font-extrabold"
                style={{ color: 'var(--neon-green)' }}
              >
                {formatCurrency(getPremium(selectedPlan))}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-3 rounded-xl p-4 mb-4"
              style={{
                background: 'rgba(255,59,92,0.08)',
                border: '1px solid rgba(255,59,92,0.3)',
              }}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--neon-red)' }} />
              <p className="text-sm" style={{ color: 'var(--neon-red)' }}>{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto shrink-0"
                style={{ color: 'var(--neon-red)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pay button */}
          <button
            id="razorpay-pay-button"
            onClick={handlePay}
            disabled={loading || !scriptLoaded}
            className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-200"
            style={{
              background: loading
                ? 'rgba(0,149,182,0.4)'
                : 'linear-gradient(135deg, #0095b6, #6366f1)',
              color: 'white',
              border: '1px solid rgba(0,212,255,0.3)',
              boxShadow: loading ? 'none' : '0 8px 30px rgba(0,149,182,0.4)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transform: loading ? 'none' : undefined,
            }}
          >
            {loading ? (
              <>
                <div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  style={{ animation: 'spin-slow 0.8s linear infinite' }}
                />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay {formatCurrency(getPremium(selectedPlan))} via Razorpay
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Trust badges */}
          <div
            className="flex items-center justify-center gap-6 mt-4 pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            {[
              { icon: Lock, label: '256-bit SSL' },
              { icon: Shield, label: 'PCI DSS' },
              { icon: TrendingUp, label: 'Instant Activation' },
              { icon: Clock, label: '24/7 Support' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{label}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Powered by <strong>Razorpay</strong>. Test mode — no real charges.
          </p>
        </div>
      )}

      {/* ── Why InsurNova ────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
          Why gig workers choose InsurNova
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Zap,
              title: 'Instant Payouts',
              desc: 'Claims processed by AI in seconds — money in your account within 24hrs.',
              color: 'var(--neon-yellow)',
            },
            {
              icon: Shield,
              title: 'Parametric Coverage',
              desc: 'No claims forms. Events trigger automatic payouts based on real weather data.',
              color: 'var(--neon-cyan)',
            },
            {
              icon: TrendingUp,
              title: 'Trust Score System',
              desc: 'Build your trust score over time for better premiums and higher coverage.',
              color: 'var(--neon-green)',
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-2xl p-5"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${color}18`, border: `1px solid ${color}40` }}
              >
                <Icon style={{ color, width: 20, height: 20 }} />
              </div>
              <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h4>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
