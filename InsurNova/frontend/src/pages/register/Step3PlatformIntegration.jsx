import { useState } from 'react';
import { Package, RefreshCw, CheckCircle, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

const PLATFORMS = [
  { value: 'Swiggy', label: 'Swiggy', color: 'bg-orange-500', logo: '🍜' },
  { value: 'Zomato', label: 'Zomato', color: 'bg-red-500', logo: '🍕' },
  { value: 'Uber', label: 'Uber Eats', color: 'bg-green-600', logo: '🍔' }
];

export default function Step3PlatformIntegration({ formData, updateFormData, nextStep, prevStep }) {
  const [selectedPlatform, setSelectedPlatform] = useState(formData.platform || '');
  const [loading, setLoading] = useState(false);
  const [deliveryData, setDeliveryData] = useState(formData.deliveryData || null);
  const [error, setError] = useState('');

  const fetchDeliveryData = async () => {
    if (!selectedPlatform) {
      setError('Please select a platform first');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate a brief network delay, then return realistic mock data.
    // The /mock/delivery-profile backend endpoint doesn't exist — using
    // client-side generation so this step always works regardless of backend state.
    await new Promise((r) => setTimeout(r, 1200));

    const avgDailyEarnings  = Math.floor(Math.random() * 800)  + 700;   // 700–1500
    const avgWeeklyEarnings  = avgDailyEarnings  * 6;
    const avgMonthlyEarnings = avgWeeklyEarnings * 4;
    const workingHoursNum    = parseFloat((Math.random() * 4 + 6).toFixed(1)); // 6–10
    const ratingNum          = parseFloat((Math.random() * 0.8 + 4.1).toFixed(1));

    const mockData = {
      platform: selectedPlatform,
      verified: true,
      totalDeliveries:    Math.floor(Math.random() * 3000) + 500,
      rating:             ratingNum,
      primaryZone:        ['Koramangala', 'Indiranagar', 'HSR Layout', 'Bandra', 'Andheri'][Math.floor(Math.random() * 5)],
      joinedDate:         new Date(Date.now() - Math.random() * 2 * 365 * 86400000).toISOString(),
      activeHours:        workingHoursNum,
      completionRate:     (Math.random() * 5 + 94).toFixed(1) + '%',
      // Fields needed by Step4 (AI Insights) and Step5 (Fraud Detection)
      avgDailyEarnings,
      avgWeeklyEarnings,
      avgMonthlyEarnings,
      workingHours:       workingHoursNum,
      riskLevel:          workingHoursNum > 9 ? 'medium' : 'low',
      incidents:          Math.floor(Math.random() * 2),   // 0 or 1
    };

    setDeliveryData(mockData);
    updateFormData({ platform: selectedPlatform, deliveryData: mockData });
    setLoading(false);
  };

  const handleContinue = () => {
    // If user hasn't fetched yet but selected a platform, auto-generate and proceed
    if (!deliveryData && selectedPlatform) {
      const mockData = {
        platform: selectedPlatform, verified: true,
        totalDeliveries: 1250, rating: '4.6',
        primaryZone: 'Koramangala', joinedDate: new Date(Date.now() - 365 * 86400000).toISOString(),
        completionRate: '97.2%',
      };
      updateFormData({ platform: selectedPlatform, deliveryData: mockData });
    }
    nextStep();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Connect Your Platform</h2>
      <p className="text-white/80 mb-6">Link your delivery platform to auto-import your work data</p>

      <div className="space-y-6">
        {/* Platform Selection */}
        <div>
          <label className="block text-white font-medium mb-3 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Select your delivery platform
          </label>
          <div className="grid grid-cols-3 gap-3">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.value}
                type="button"
                onClick={() => setSelectedPlatform(platform.value)}
                disabled={loading}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPlatform === platform.value
                    ? 'bg-[#0095B6] border-[#0095B6] text-white'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-[#0095B6]'
                } disabled:opacity-50`}
              >
                <div className="text-4xl mb-2">{platform.logo}</div>
                <div className="font-semibold text-sm">{platform.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Fetch Button */}
        <button
          type="button"
          onClick={fetchDeliveryData}
          disabled={!selectedPlatform || loading}
          className="w-full bg-gradient-to-r from-[#0095B6] to-[#007798] text-white py-3 rounded-lg font-medium hover:from-[#007798] hover:to-[#005a79] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Fetching Data...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Fetch My Data
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Delivery Data Display */}
        {deliveryData && (
          <div className="bg-white/90 rounded-lg p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 text-green-600 font-semibold mb-4">
              <CheckCircle className="w-6 h-6" />
              <span>Data Retrieved Successfully!</span>
            </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 p-3 rounded-lg">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Platform</div>
                <div className="text-lg font-bold text-gray-900">{deliveryData.platform}</div>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-lg">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Verified</div>
                <div className="text-lg font-bold text-green-700">
                  {deliveryData.verified ? 'Yes ✓' : 'No'}
                </div>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-lg">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Deliveries</div>
                <div className="text-lg font-bold text-gray-900">
                  {deliveryData.totalDeliveries?.toLocaleString()}
                </div>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-lg">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Rating</div>
                <div className="text-lg font-bold text-gray-900">
                  ⭐ {deliveryData.rating}
                </div>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-lg">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Primary Zone</div>
                <div className="text-sm font-bold text-gray-900">{deliveryData.primaryZone}</div>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-lg">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Member Since</div>
                <div className="text-sm font-bold text-gray-900">
                  {new Date(deliveryData.joinedDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
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
            disabled={!deliveryData}
            className="flex-1 bg-gradient-to-r from-[#0095B6] to-[#007798] text-white py-3 rounded-lg font-medium hover:from-[#007798] hover:to-[#005a79] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
