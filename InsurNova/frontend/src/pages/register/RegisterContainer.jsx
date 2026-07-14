import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Step1BasicDetails from './Step1BasicDetails';
import Step2PersonalProfile from './Step2PersonalProfile';
import Step3PlatformIntegration from './Step3PlatformIntegration';
import Step4AutoInsights from './Step4AutoInsights';
import Step5FraudDetection from './Step5FraudDetection';
import Step6PlanRecommendation from './Step6PlanRecommendation';
import Step7Confirmation from './Step7Confirmation';

const STEPS = [
  { number: 1, title: 'Basic Details', component: Step1BasicDetails },
  { number: 2, title: 'Personal Profile', component: Step2PersonalProfile },
  { number: 3, title: 'Platform Integration', component: Step3PlatformIntegration },
  { number: 4, title: 'Auto Insights', component: Step4AutoInsights },
  { number: 5, title: 'Fraud Detection', component: Step5FraudDetection },
  { number: 6, title: 'Plan Recommendation', component: Step6PlanRecommendation },
  { number: 7, title: 'Confirmation', component: Step7Confirmation },
];

export default function RegisterContainer() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    email: '',
    phone: '',
    password: '',
    // Step 2
    city: '',
    vehicleType: '',
    workType: '',
    // Step 3
    platform: '',
    deliveryData: null,
    // Step 4
    insights: null,
    // Step 5
    fraudCheck: null,
    // Step 6
    selectedPlan: null,
    recommendedPlans: [],
  });

  const navigate = useNavigate();

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onComplete = () => {
    // Final registration complete
    navigate('/dashboard');
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 bg-cover bg-center flex items-center justify-center p-4"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      <div className="w-full max-w-3xl">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-white">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0095B6] to-[#00c6ff] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step.number < currentStep
                    ? 'bg-[#0095B6] text-white'
                    : step.number === currentStep
                    ? 'bg-white text-[#0095B6] ring-4 ring-[#0095B6]/50'
                    : 'bg-white/30 text-white'
                }`}
              >
                {step.number < currentStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  step.number
                )}
              </div>
              <div className="text-xs text-white mt-1 text-center hidden md:block">{step.title}</div>
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="bg-white/20 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl p-8 animate-fadeIn">
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            onComplete={onComplete}
            currentStep={currentStep}
          />
        </div>
      </div>
    </div>
  );
}
