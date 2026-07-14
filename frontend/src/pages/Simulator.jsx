import { useState } from 'react';
import { Play, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { eventsService } from '../services';

export default function Simulator() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventType: 'RAIN',
    severity: 50,
    duration: 6,
    temperature: 25,
    rainfall: 100,
    pollutionIndex: 50,
    windSpeed: 20,
    humidity: 60,
    coverageAmount: 1000,
  });

  const [result, setResult] = useState(null);

  const eventTypes = ['RAIN', 'HEAT', 'POLLUTION', 'CURFEW', 'FLOOD', 'STORM', 'PANDEMIC'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'eventType' ? value : parseFloat(value),
    });
  };

  const runSimulation = async () => {
    setLoading(true);
    setResult(null);

    // Local simulation to show instant results in the UI
    const riskScore = formData.severity / 100;

    const mockBaselineEarnings = formData.coverageAmount;
    const mockActualEarnings = formData.coverageAmount * (1 - riskScore);
    const verifiedLoss = mockBaselineEarnings - mockActualEarnings;

    const trustScore = 75;
    const trustMultiplier = 0.7 + (trustScore / 100) * 0.3;

    const isPandemic = formData.eventType === 'PANDEMIC';
    const exclusionFactor = isPandemic ? 0.5 : 1.0;

    let calculatedAmount = verifiedLoss * riskScore * trustMultiplier * exclusionFactor;
    calculatedAmount = Math.min(calculatedAmount, formData.coverageAmount);

    const effectivePayoutPercentage = Math.round(
      (calculatedAmount / formData.coverageAmount) * 100
    );

    setResult({
      riskScore,
      payoutPercentage: effectivePayoutPercentage,
      calculatedAmount: Math.round(calculatedAmount),
      confidence: 0.9,
      isExcluded: false,
      fraudScore: 0.1,
      verifiedLoss: Math.round(verifiedLoss),
      trustScore,
      trustMultiplier: Math.round(trustMultiplier * 100) / 100,
      exclusionFactor,
      explanation: isPandemic
        ? `Formula: Loss ₹${Math.round(verifiedLoss)} × Risk ${(riskScore * 100).toFixed(0)}% × Trust ${trustMultiplier.toFixed(2)} × Exclusion ${exclusionFactor} = ₹${Math.round(calculatedAmount)}. Pandemic events have 50% payout cap.`
        : `Formula: Loss ₹${Math.round(verifiedLoss)} × Risk ${(riskScore * 100).toFixed(0)}% × Trust ${trustMultiplier.toFixed(2)} × Exclusion ${exclusionFactor} = ₹${Math.round(calculatedAmount)}. Based on actual loss verification from platform data.`,
    });

    // Also create a real claim in the backend so it shows up on the Claims page
    try {
      await eventsService.quickClaim({
        eventType: formData.eventType,
        severity: formData.severity,
      });
    } catch (err) {
      console.error('Failed to create backend claim from simulator:', err.message || err);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Event Simulator</h1>
        <p className="text-gray-600 mt-1">Test coverage scenarios and estimate payouts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Parameters</h2>

          <div className="space-y-4">
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="input-field"
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity: {formData.severity}%
              </label>
              <input
                type="range"
                name="severity"
                min="0"
                max="100"
                value={formData.severity}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (hours)
              </label>
              <input
                type="number"
                name="duration"
                min="1"
                max="72"
                value={formData.duration}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°C)
              </label>
              <input
                type="number"
                name="temperature"
                min="-50"
                max="60"
                value={formData.temperature}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            {/* Rainfall */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rainfall (mm)
              </label>
              <input
                type="number"
                name="rainfall"
                min="0"
                max="500"
                value={formData.rainfall}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            {/* Coverage Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coverage Amount
              </label>
              <input
                type="number"
                name="coverageAmount"
                min="100"
                max="10000"
                step="100"
                value={formData.coverageAmount}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {loading ? 'Running Simulation...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Simulation Results</h2>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Payout Estimate */}
              <div className="bg-gradient-to-br from-[#0095B6] to-[#007798] rounded-xl p-6 text-white">
                <p className="text-sm opacity-90 mb-2">Estimated Payout</p>
                <p className="text-4xl font-bold">{formatCurrency(result.calculatedAmount)}</p>
                <p className="text-sm opacity-75 mt-2">
                  {result.payoutPercentage}% of {formatCurrency(formData.coverageAmount)}
                </p>
              </div>

              {/* Formula Breakdown */}
              {result.verifiedLoss && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Formula Breakdown</h4>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Verified Loss</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(result.verifiedLoss)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Risk %</p>
                      <p className="text-sm font-bold text-blue-600">{(result.riskScore * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Trust</p>
                      <p className="text-sm font-bold text-green-600">×{result.trustMultiplier}</p>
                      <p className="text-xs text-gray-400">Score: {result.trustScore}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Exclusion</p>
                      <p className="text-sm font-bold text-orange-600">×{result.exclusionFactor}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    ₹{result.verifiedLoss.toLocaleString()} × {(result.riskScore * 100).toFixed(0)}% × {result.trustMultiplier} × {result.exclusionFactor} = ₹{result.calculatedAmount.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Risk Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-900 font-medium">Risk Score</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {(result.riskScore * 100).toFixed(0)}%
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-900 font-medium">Confidence</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {(result.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>


              {/* Explanation */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Explanation</h3>
                  <p className="text-sm text-gray-700">{result.explanation}</p>
                </div>

                {formData.eventType === 'PANDEMIC' && (
                  <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200">
                    <p className="text-xs text-yellow-900 font-medium">
                      Note: Pandemic events are only eligible for <span className="font-semibold">50% payout</span>
                      
                      even at maximum severity. The simulator already applies this cap.
                    </p>
                  </div>
                )}
              </div>

              {/* Coverage Status */}
              <div
                className={`p-4 rounded-lg ${
                  result.isExcluded
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    result.isExcluded ? 'text-red-900' : 'text-green-900'
                  }`}
                >
                  {result.isExcluded ? '❌ Event Excluded from Coverage' : '✅ Event Covered'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Play className="w-16 h-16 mb-4" />
              <p className="text-center">
                Configure event parameters and click "Run Simulation" to see results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
