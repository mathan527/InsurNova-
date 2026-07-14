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
    try {
      const response = await axios.get('http://localhost:3000/api/recommendation', {
        params: {
          userId: formData.userId,
          avgEarnings: formData.insights?.avgDailyEarnings,
          workingHours: formData.deliveryData?.workingHours,
          riskLevel: formData.deliveryData?.riskLevel
        }
      });

      setPlans(response.data.plans);
      updateFormData({ recommendedPlans: response.data.plans });
    } catch (error) {
      // Fallback to client-side recommendations
      const generatedPlans = generatePlans(formData);
      setPlans(generatedPlans);
      updateFormData({ recommendedPlans: generatedPlans });
    } finally {
      setLoading(false);
    }
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
            className={`bg-white/90 rounded-lg p-5 cursor-pointer transition-all transform hover:scale-[1.02] ${
              selectedPlan?.id === plan.id
                ? 'ring-4 ring-[#0095B6] shadow-xl'
                : 'hover:shadow-lg'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                  {plan.badge && (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${plan.color}`}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                {plan.recommended && (
                  <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium">AI Recommended</span>
                  </div>
                )}
              </div>
              {selectedPlan?.id === plan.id && (
                <CheckCircle className="w-8 h-8 text-[#0095B6]" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`bg-gradient-to-r ${plan.color} text-gray-900 p-3 rounded-lg`}>
                <div className="text-sm font-medium">Weekly Premium</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(plan.weeklyPremium, 'INR')}
                </div>
              </div>
              <div className={`bg-gradient-to-r ${plan.color} text-gray-900 p-3 rounded-lg`}>
                <div className="text-sm font-medium">Weekly Coverage</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(plan.coverage, 'INR')}
                </div>
                <div className="text-xs font-medium mt-1">~{formatCurrency(plan.coveragePerDay, 'INR')}/day</div>
              </div>
            </div>

            {plan.pricingBreakdown && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4 text-xs text-gray-700">
                <div className="font-semibold text-gray-800 mb-1">Pricing Formula</div>
                <div>Weekly Premium = Base Premium + Risk Adjustment - Trust Discount</div>
                <div className="mt-1">
                  {formatCurrency(plan.pricingBreakdown.basePremium, 'INR')} + {formatCurrency(plan.pricingBreakdown.riskAdjustment, 'INR')} - {formatCurrency(plan.pricingBreakdown.trustDiscount, 'INR')} = {formatCurrency(plan.weeklyPremium, 'INR')}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-700 mb-2">Benefits:</div>
              {plan.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
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
