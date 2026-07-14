import { useState } from 'react';
import { MapPin, Bike, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';

const CITIES = [
  'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'
];

const VEHICLE_TYPES = [
  { value: 'bike', label: 'Bike/Scooter', icon: '🛵' },
  { value: 'bicycle', label: 'Bicycle', icon: '🚲' },
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'auto', label: 'Auto Rickshaw', icon: '🛺' }
];

const WORK_TYPES = [
  { value: 'full-time', label: 'Full-Time', desc: '8+ hours/day' },
  { value: 'part-time', label: 'Part-Time', desc: '4-8 hours/day' }
];

export default function Step2PersonalProfile({ formData, updateFormData, nextStep, prevStep }) {
  const [form, setForm] = useState({
    city: formData.city || '',
    vehicleType: formData.vehicleType || '',
    workType: formData.workType || ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.city) newErrors.city = 'Please select a city';
    if (!form.vehicleType) newErrors.vehicleType = 'Please select a vehicle type';
    if (!form.workType) newErrors.workType = 'Please select work type';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    updateFormData({
      city: form.city,
      vehicleType: form.vehicleType,
      workType: form.workType
    });
    
    nextStep();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Tell Us About Yourself</h2>
      <p className="text-white/80 mb-6">Help us understand your work profile better</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* City Selection */}
        <div>
          <label className="block text-white font-medium mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Which city do you work in?
          </label>
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0095B6] font-medium"
            style={{ backgroundColor: '#ffffff', color: '#111827' }}
          >
            <option value="" style={{ backgroundColor: '#ffffff', color: '#111827' }}>Select your city</option>
            {CITIES.map((city) => (
              <option key={city} value={city} style={{ backgroundColor: '#ffffff', color: '#111827' }}>{city}</option>
            ))}
          </select>
          {errors.city && <p className="text-red-300 text-sm mt-1">{errors.city}</p>}
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="block text-white font-medium mb-3 flex items-center gap-2">
            <Bike className="w-5 h-5" />
            What vehicle do you use?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {VEHICLE_TYPES.map((vehicle) => (
              <button
                key={vehicle.value}
                type="button"
                onClick={() => setForm({ ...form, vehicleType: vehicle.value })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  form.vehicleType === vehicle.value
                    ? 'bg-[#0095B6] border-[#0095B6] text-white'
                    : 'bg-white/70 border-white/40 text-gray-700 hover:bg-white/90'
                }`}
              >
                <div className="text-3xl mb-2">{vehicle.icon}</div>
                <div className="font-medium">{vehicle.label}</div>
              </button>
            ))}
          </div>
          {errors.vehicleType && <p className="text-red-300 text-sm mt-1">{errors.vehicleType}</p>}
        </div>

        {/* Work Type */}
        <div>
          <label className="block text-white font-medium mb-3 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            What's your work schedule?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {WORK_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm({ ...form, workType: type.value })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  form.workType === type.value
                    ? 'bg-[#0095B6] border-[#0095B6] text-white'
                    : 'bg-white/70 border-white/40 text-gray-700 hover:bg-white/90'
                }`}
              >
                <div className="font-semibold text-lg">{type.label}</div>
                <div className={`text-sm ${form.workType === type.value ? 'text-white/80' : 'text-gray-500'}`}>
                  {type.desc}
                </div>
              </button>
            ))}
          </div>
          {errors.workType && <p className="text-red-300 text-sm mt-1">{errors.workType}</p>}
        </div>

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
            type="submit"
            className="flex-1 bg-gradient-to-r from-[#0095B6] to-[#007798] text-white py-3 rounded-lg font-medium hover:from-[#007798] hover:to-[#005a79] transition-all flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
