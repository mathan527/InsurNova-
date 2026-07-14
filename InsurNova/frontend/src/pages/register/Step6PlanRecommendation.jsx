import { useState, useEffect } from 'react';
import { Star, CheckCircle, ArrowRight, ArrowLeft, Sparkles, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import axios from 'axios';

export default function Step6PlanRecommendation({ formData, updateFormData, nextStep, prevStep }) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(formData.selectedPlan || null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    // /api/recommendation endpoint doesn't exist on port 3000 or 5000 — generate plans directly
    await new Promise((r) => setTimeout(r, 900));
    const generatedPlans = generatePlans(formData);
    setPlans(generatedPlans);
    updateFormData({ recommendedPlans: generatedPlans });
    setLoading(false);
  };

  const generatePlans = (data) => {
    const avgEarnings = data.insights?.avgDailyEarnings || 1000;
    const normalizedRisk = data.deliveryData?.riskLevel === 'safe'
      ? 'low'
      : (data.deliveryData?.riskLevel || 'medium');
    const baseWeeklyPremium = 10;

    const riskAdjustments = {
      low: 2,
      medium: 6,
      high: 12
    };

    const trustByRisk = {
      low: 85,
      medium: 65,
      high: 45
    };

    const baselineRiskAdjustment = riskAdjustments[normalizedRisk] || 6;
    const trustScore = trustByRisk[normalizedRisk] || 65;
    const baselineTrustDiscount = trustScore >= 80 ? 4 : trustScore >= 60 ? 3 : 2;

    const makePricing = (planWeight, discountOffset = 0) => {
      const riskAdjustment = Math.max(1, Math.round(baselineRiskAdjustment * planWeight));
      const trustDiscount = Math.max(1, baselineTrustDiscount + discountOffset);
      return {
        basePremium: baseWeeklyPremium,
        riskAdjustment,
        trustDiscount,
        weeklyPremium: Math.max(baseWeeklyPremium + riskAdjustment - trustDiscount, 1)
      };
    };

    const basicPricing = makePricing(0.7, 1);
    const standardPricing = makePricing(1.0, 0);
    const premiumPricing = makePricing(1.2, -1);
    
    return [
      {
        id: 'basic',
        name: 'Basic Coverage',
        recommended: false,
        weeklyPremium: basicPricing.weeklyPremium,
        coverage: Math.max(Math.round(300 * 7), Math.round(avgEarnings * 7 * 0.45)),
        coveragePerDay: 300,
        pricingBreakdown: basicPricing,
        benefits: [
          'Coverage for rain & flood',
          'Up to 3 claims per month',
          '50% income protection',
          'Email support',
          '24-hour claim processing'
        ],
        color: 'from-gray-500 to-gray-700',
        badge: null
      },
      {
        id: 'standard',
        name: 'Standard Coverage',
        recommended: true,
        weeklyPremium: standardPricing.weeklyPremium,
        coverage: Math.max(Math.round(400 * 7), Math.round(avgEarnings * 7 * 0.65)),
        coveragePerDay: 400,
        pricingBreakdown: standardPricing,
        benefits: [
          'All weather events covered',
          'Unlimited claims',
          '70% income protection',
          'Priority support',
          '6-hour claim processing',
          'Partial pandemic coverage (50%)'
        ],
        color: 'from-[#0095B6] to-[#007798]',
        badge: 'Recommended'
      },
      {
        id: 'premium',
        name: 'Premium Coverage',
        recommended: false,
        weeklyPremium: premiumPricing.weeklyPremium,
        coverage: Math.max(Math.round(500 * 7), Math.round(avgEarnings * 7 * 0.85)),
        coveragePerDay: 500,
        pricingBreakdown: premiumPricing,
        benefits: [
          'Comprehensive event coverage',
          'Unlimited claims',
          '100% income protection',
          '24/7 dedicated support',
          'Instant claim processing',
          '50% pandemic coverage'
        ],
        color: 'from-purple-600 to-indigo-600',
        badge: 'Best Value'
      }
    ];
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleContinue = () => {
    if (!selectedPlan) return;
    updateFormData({ selectedPlan });
    nextStep();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-white mb-2">Generating Recommendations...</h2>
        <p className="text-white/80">AI is calculating the best plans for you</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp className="w-8 h-8 text-green-300" />
        <h2 className="text-3xl font-bold text-white">Personalized Plans</h2>
      </div>
      <p className="text-white/80 mb-6">AI-recommended insurance plans based on your profile</p>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => handleSelectPlan(plan)}
            className={`relative overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-[1.02] rounded-2xl p-6 ${
              selectedPlan?.id === plan.id
                ? 'ring-2 ring-[#00d4ff] shadow-[0_0_30px_rgba(0,212,255,0.2)]'
                : 'border border-white/10 hover:border-white/20'
            }`}
            style={{
               background: selectedPlan?.id === plan.id 
                 ? 'linear-gradient(135deg, rgba(6, 13, 26, 0.95), rgba(0, 212, 255, 0.1))' 
                 : 'rgba(6, 13, 26, 0.8)'
            }}
          >
            {/* Subtle light streak for selected plan */}
            {selectedPlan?.id === plan.id && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4ff] blur-[100px] opacity-20 -mr-16 -mt-16" />
            )}

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{plan.name}</h3>
                  {plan.badge && (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white shadow-lg bg-gradient-to-r ${plan.color}`}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                {plan.recommended && (
                  <div className="flex items-center gap-1.5 text-[#00ff88] text-xs mt-1 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span className="uppercase tracking-wide">AI Recommendation Engine Choice</span>
                  </div>
                )}
              </div>
              {selectedPlan?.id === plan.id ? (
                <div className="w-10 h-10 bg-[#00d4ff] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.5)]">
                  <CheckCircle className="w-6 h-6 text-[#060d1a]" />
                </div>
              ) : (
                <div className="w-10 h-10 border-2 border-white/10 rounded-full" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 relative z-10">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Weekly Premium</div>
                <div className="text-3xl font-black text-[#00d4ff]">
                  {formatCurrency(plan.weeklyPremium, 'INR')}
                </div>
              </div>
              <div className={`bg-gradient-to-br ${plan.color} text-white p-4 rounded-xl shadow-xl`}>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">Total Coverage</div>
                <div className="text-3xl font-black">
                  {formatCurrency(plan.coverage, 'INR')}
                </div>
                <div className="text-[10px] font-bold mt-1 opacity-70 italic">~{formatCurrency(plan.coveragePerDay, 'INR')} / day coverage</div>
              </div>
            </div>

            {plan.pricingBreakdown && (
              <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 mb-5 text-[11px] relative z-10">
                <div className="flex items-center gap-2 text-white font-bold mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shadow-[0_0_5px_#00d4ff]" />
                  SMART PRICING CALCULATION
                </div>
                <div className="text-gray-400 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>Base Premium</span>
                    <span className="text-white">+{formatCurrency(plan.pricingBreakdown.basePremium, 'INR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Adjustment</span>
                    <span className="text-white">+{formatCurrency(plan.pricingBreakdown.riskAdjustment, 'INR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trust Discount</span>
                    <span className="text-[#00ff88]">-{formatCurrency(plan.pricingBreakdown.trustDiscount, 'INR')}</span>
                  </div>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="flex justify-between text-base font-bold text-[#00d4ff]">
                    <span>Final Weekly</span>
                    <span className="glow-cyan-text">{formatCurrency(plan.weeklyPremium, 'INR')}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2.5 relative z-10">
              <div className="text-xs font-black uppercase tracking-widest text-[#00d4ff] mb-3">Core Performance Benefits</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {plan.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 py-1">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <CheckCircle className="w-3 h-3 text-[#00ff88]" />
                    </div>
                    <span className="text-xs font-semibold text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-6">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 bg-white/20 text-white py-3 rounded-lg font-medium hover:bg-white/30 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedPlan}
          className="flex-1 bg-gradient-to-r from-[#0095B6] to-[#007798] text-white py-3 rounded-lg font-medium hover:from-[#007798] hover:to-[#005a79] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
