import { useState } from 'react';
import { CheckCircle, User, Mail, Phone, MapPin, Package, Shield, Star, Loader } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Step7Confirmation({ formData, onComplete }) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setError('Please accept terms and conditions');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Submit complete registration
      const response = await axios.post('http://localhost:3000/api/auth/complete-registration', {
        // Step 1
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        // Step 2
        city: formData.city,
        vehicleType: formData.vehicleType,
        workType: formData.workType,
        // Step 3
        platform: formData.platform,
        deliveryData: formData.deliveryData,
        // Step 5
        fraudScore: formData.fraudCheck?.fraudScore || 0,
        trustScore: formData.fraudCheck?.trustScore || 100,
        // Step 6
        selectedPlan: formData.selectedPlan,
        // Insights
        avgDailyEarnings: formData.deliveryData?.avgDailyEarnings,
        workingHours: formData.deliveryData?.workingHours
      });

      // Store auth token
      localStorage.setItem('token', response.data.token);

      // Persist selected plan so Policies page can reflect it
      if (formData.selectedPlan) {
        localStorage.setItem('selectedPlan', JSON.stringify(formData.selectedPlan));
      }
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <CheckCircle className="w-8 h-8 text-green-300" />
        <h2 className="text-3xl font-bold text-white">Review & Confirm</h2>
      </div>
      <p className="text-white/80 mb-6">Please review your information before completing registration</p>

      <div className="bg-white/90 rounded-lg p-6 space-y-5 max-h-[450px] overflow-y-auto">
        {/* Personal Details */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-[#0095B6]" />
            Personal Details
          </h3>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-800">{formData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-800">{formData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium text-gray-800">{formData.phone}</span>
            </div>
          </div>
        </div>

        {/* Work Profile */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0095B6]" />
            Work Profile
          </h3>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">City:</span>
              <span className="font-medium text-gray-800">{formData.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vehicle:</span>
              <span className="font-medium text-gray-800">{formData.vehicleType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Work Type:</span>
              <span className="font-medium text-gray-800">{formData.workType}</span>
            </div>
          </div>
        </div>

        {/* Platform Integration */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#0095B6]" />
            Delivery Platform
          </h3>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Platform:</span>
              <span className="font-medium text-gray-800">{formData.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Daily Earnings:</span>
              <span className="font-medium text-gray-800">
                {formatCurrency(formData.deliveryData?.avgDailyEarnings, 'INR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Working Hours:</span>
              <span className="font-medium text-gray-800">{formData.deliveryData?.workingHours} hrs/day</span>
            </div>
          </div>
        </div>

        {/* Fraud Check */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0095B6]" />
            Security Verification
          </h3>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Risk Level:</span>
              <span className={`font-medium ${
                formData.fraudCheck?.riskLevel === 'safe' ? 'text-green-600' :
                formData.fraudCheck?.riskLevel === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {formData.fraudCheck?.riskLevel?.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trust Score:</span>
              <span className="font-medium text-green-600">{formData.fraudCheck?.trustScore}/100</span>
            </div>
          </div>
        </div>

        {/* Selected Plan */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#0095B6]" />
            Selected Plan
          </h3>
          <div className="bg-gradient-to-r from-[#0095B6] to-[#007798] text-white p-4 rounded-lg">
            <div className="font-bold text-xl mb-2">{formData.selectedPlan?.name}</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm opacity-90">Weekly Premium</div>
                <div className="text-lg font-bold">
                  {formatCurrency(formData.selectedPlan?.weeklyPremium, 'INR')}
                </div>
              </div>
              <div>
                <div className="text-sm opacity-90">Weekly Coverage</div>
                <div className="text-lg font-bold">
                  {formatCurrency(formData.selectedPlan?.coverage, 'INR')}
                </div>
              </div>
            </div>
            {formData.selectedPlan?.pricingBreakdown && (
              <div className="mt-3 text-xs text-white/90 border-t border-white/25 pt-2">
                <div className="font-semibold mb-1">Pricing Formula (INR)</div>
                <div>Weekly Premium = Base Premium + Risk Adjustment - Trust Discount</div>
                <div>
                  {formatCurrency(formData.selectedPlan.pricingBreakdown.basePremium, 'INR')} + {formatCurrency(formData.selectedPlan.pricingBreakdown.riskAdjustment, 'INR')} - {formatCurrency(formData.selectedPlan.pricingBreakdown.trustDiscount, 'INR')} = {formatCurrency(formData.selectedPlan.weeklyPremium, 'INR')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 text-[#0095B6] focus:ring-[#0095B6]"
            />
            <span className="text-sm text-gray-700">
              I agree to the <span className="text-[#0095B6] font-medium">Terms & Conditions</span> and{' '}
              <span className="text-[#0095B6] font-medium">Privacy Policy</span>. I confirm that all information
              provided is accurate and complete.
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !termsAccepted}
        className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader className="w-6 h-6 animate-spin" />
            Completing Registration...
          </>
        ) : (
          <>
            <CheckCircle className="w-6 h-6" />
            Complete Registration
          </>
        )}
      </button>
    </div>
  );
}
