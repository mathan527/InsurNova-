import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function Step5FraudDetection({ formData, updateFormData, nextStep, prevStep }) {
  const [loading, setLoading] = useState(true);
  const [fraudCheck, setFraudCheck] = useState(null);

  useEffect(() => {
    runFraudCheck();
  }, []);

  const runFraudCheck = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/fraud/check', {
        userId: formData.userId,
        deliveryData: formData.deliveryData,
        insights: formData.insights
      });

      setFraudCheck(response.data);
      updateFormData({ fraudCheck: response.data });
    } catch (error) {
      // Fallback to client-side fraud detection
      const result = performFraudCheck(formData.deliveryData, formData.insights);
      setFraudCheck(result);
      updateFormData({ fraudCheck: result });
    } finally {
      setLoading(false);
    }
  };

  // Client-side fallback fraud detection
  const performFraudCheck = (deliveryData, insights) => {
    const flags = [];
    let riskLevel = 'safe';
    let score = 0;

    // Check excessive working hours (>12 hrs = suspicious)
    if (deliveryData.workingHours > 12) {
      flags.push('Excessive working hours detected');
      score += 30;
    }

    // Check unrealistic earnings
    const dailyEarnings = deliveryData.avgDailyEarnings;
    if (dailyEarnings > 3000) {
      flags.push('Unrealistic daily earnings');
      score += 40;
    }

    // Check low rating
    if (deliveryData.rating < 3.5) {
      flags.push('Low performance rating');
      score += 20;
    }

    // Check incidents
    if (deliveryData.incidents > 2) {
      flags.push('Multiple incidents reported');
      score += 25;
    }

    // Determine risk level
    if (score >= 50) {
      riskLevel = 'high';
    } else if (score >= 25) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'safe';
    }

    return {
      riskLevel,
      fraudScore: score,
      trustScore: 100 - score,
      flags: flags.length > 0 ? flags : ['No suspicious activity detected'],
      passed: score < 50
    };
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-white mb-2">Running Fraud Detection...</h2>
        <p className="text-white/80">Analyzing your profile for security</p>
      </div>
    );
  }

  const getRiskIcon = () => {
    if (fraudCheck.riskLevel === 'safe') return <ShieldCheck className="w-12 h-12 text-green-500" />;
    if (fraudCheck.riskLevel === 'medium') return <Shield className="w-12 h-12 text-yellow-500" />;
    return <ShieldAlert className="w-12 h-12 text-red-500" />;
  };

  const getRiskColor = () => {
    if (fraudCheck.riskLevel === 'safe') return 'from-green-50 to-green-100';
    if (fraudCheck.riskLevel === 'medium') return 'from-yellow-50 to-yellow-100';
    return 'from-red-50 to-red-100';
  };

  const getRiskTextColor = () => {
    if (fraudCheck.riskLevel === 'safe') return 'text-green-900';
    if (fraudCheck.riskLevel === 'medium') return 'text-yellow-900';
    return 'text-red-900';
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Security Verification</h2>
      <p className="text-white/80 mb-6">AI-powered fraud detection completed</p>

      <div className="bg-white/90 rounded-lg p-6 space-y-5">
        {/* Risk Status */}
        <div className={`bg-gradient-to-br ${getRiskColor()} p-6 rounded-lg text-center`}>
          <div className="flex justify-center mb-3">
            {getRiskIcon()}
          </div>
          <div className={`text-3xl font-bold ${getRiskTextColor()} mb-2`}>
            {fraudCheck.riskLevel.toUpperCase()} RISK
          </div>
          <div className={getRiskTextColor()}>
            {fraudCheck.passed ? 'Verification Successful' : 'Additional Review Required'}
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Fraud Score</div>
            <div className={`text-3xl font-bold ${
              fraudCheck.fraudScore < 25 ? 'text-green-600' : 
              fraudCheck.fraudScore < 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {fraudCheck.fraudScore}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  fraudCheck.fraudScore < 25 ? 'bg-green-500' : 
                  fraudCheck.fraudScore < 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${fraudCheck.fraudScore}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Trust Score</div>
            <div className="text-3xl font-bold text-green-600">
              {fraudCheck.trustScore}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${fraudCheck.trustScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="font-semibold text-gray-800 mb-3">Detection Results</div>
          <div className="space-y-2">
            {fraudCheck.flags.map((flag, index) => (
              <div key={index} className="flex items-start gap-2">
                {fraudCheck.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-sm text-gray-700">{flag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Message */}
        {fraudCheck.passed ? (
          <div className="bg-green-500/20 border border-green-500/50 text-green-800 px-4 py-3 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Verification Passed</div>
              <div className="text-sm">Your profile looks legitimate. You can proceed with registration.</div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-800 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Additional Review Required</div>
              <div className="text-sm">Some flags detected. Our team will review your application manually.</div>
            </div>
          </div>
        )}
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
          onClick={nextStep}
          className="flex-1 bg-gradient-to-r from-[#0095B6] to-[#007798] text-white py-3 rounded-lg font-medium hover:from-[#007798] hover:to-[#005a79] transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
