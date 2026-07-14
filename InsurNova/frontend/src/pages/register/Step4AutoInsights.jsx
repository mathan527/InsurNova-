import { TrendingUp, Clock, DollarSign, MapPin, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

// Safe currency formatter — never crashes on undefined/null
const fmtINR = (val) => {
  const n = Number(val);
  if (isNaN(n)) return '—';
  return '₹' + n.toLocaleString('en-IN');
};

export default function Step4AutoInsights({ formData, updateFormData, nextStep, prevStep }) {
  const data = formData.deliveryData || {};

  // Derive safe defaults from whatever Step3 provided
  const dailyEarnings   = data.avgDailyEarnings   ?? 900;
  const weeklyEarnings  = data.avgWeeklyEarnings  ?? dailyEarnings * 6;
  const monthlyEarnings = data.avgMonthlyEarnings ?? weeklyEarnings * 4;
  const workingHours    = data.workingHours        ?? data.activeHours ?? 8;
  const riskLevel       = data.riskLevel           ?? 'low';
  const rating          = Number(data.rating)      || 4.2;
  const performance     = rating >= 4.5 ? 'Excellent' : rating >= 4.0 ? 'Good' : 'Average';

  const insights = { avgDailyEarnings: dailyEarnings, avgWeeklyEarnings: weeklyEarnings,
                     avgMonthlyEarnings: monthlyEarnings, workingHours, riskLevel, performance };

  const handleContinue = () => {
    updateFormData({ insights });
    nextStep();
  };

  const isLow = riskLevel === 'low';

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-8 h-8 text-yellow-300" />
        <h2 className="text-3xl font-bold text-white">AI-Generated Insights</h2>
      </div>
      <p className="text-white/80 mb-6">We've analyzed your work patterns and earnings</p>

      <div className="bg-white/90 rounded-lg p-6 space-y-5">
        {/* Earnings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-semibold">Daily Avg</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{fmtINR(dailyEarnings)}</div>
            <div className="text-xs font-medium text-blue-700 mt-1">Per working day</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-semibold">Weekly Avg</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{fmtINR(weeklyEarnings)}</div>
            <div className="text-xs font-medium text-green-700 mt-1">6 days/week</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-semibold">Monthly Avg</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{fmtINR(monthlyEarnings)}</div>
            <div className="text-xs font-medium text-purple-700 mt-1">~26 days/month</div>
          </div>
        </div>

        {/* Hours + Performance */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-semibold">Average Working Hours</span>
              </div>
              <div className="text-3xl font-bold text-orange-900">{workingHours} hrs/day</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-orange-700">Performance</div>
              <div className="text-lg font-bold text-orange-900">{performance}</div>
              <div className="text-xs text-orange-600">⭐ {rating} rating</div>
            </div>
          </div>
        </div>

        {/* Risk */}
        <div className={`p-4 rounded-lg ${isLow ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-yellow-50 to-yellow-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`flex items-center gap-2 mb-1 ${isLow ? 'text-green-600' : 'text-yellow-600'}`}>
                <MapPin className="w-5 h-5" />
                <span className="text-sm font-semibold">Risk Assessment</span>
              </div>
              <div className={`text-2xl font-bold ${isLow ? 'text-green-900' : 'text-yellow-900'}`}>
                {riskLevel.toUpperCase()} RISK
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${isLow ? 'text-green-700' : 'text-yellow-700'}`}>Primary Zone</div>
              <div className={`text-sm font-bold ${isLow ? 'text-green-900' : 'text-yellow-900'}`}>
                {data.primaryZone || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* AI badge */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">AI Recommendation</span>
          </div>
          <p className="text-sm text-white/90">
            Based on your earnings pattern and work schedule, we'll recommend personalized insurance plans in the next step.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-6">
        <button type="button" onClick={prevStep}
          className="flex-1 bg-white/20 text-white py-3 rounded-lg font-medium hover:bg-white/30 transition-all flex items-center justify-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button type="button" onClick={handleContinue}
          className="flex-1 bg-gradient-to-r from-[#0095B6] to-[#007798] text-white py-3 rounded-lg font-medium hover:from-[#007798] hover:to-[#005a79] transition-all flex items-center justify-center gap-2">
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
