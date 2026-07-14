import { useState } from 'react';
import { User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function Step1BasicDetails({ formData, updateFormData, nextStep }) {
  const [form, setForm] = useState({
    name: formData.name || '',
    email: formData.email || '',
    phone: formData.phone || '',
    password: formData.password || '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email is invalid';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'Phone must be 10 digits';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Call backend to create initial user record
      const response = await axios.post('http://localhost:3000/api/auth/register-step1', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      });

      updateFormData({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        userId: response.data.userId,
        tempToken: response.data.token
      });
      
      nextStep();
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Failed to proceed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Let's Get Started</h2>
      <p className="text-white/80 mb-6">Create your account to begin your insurance journey</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-white font-medium mb-2">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0095B6]"
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && <p className="text-red-300 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-white font-medium mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0095B6]"
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="text-red-300 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-white font-medium mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0095B6]"
              placeholder="10-digit mobile number"
              maxLength="10"
            />
          </div>
          {errors.phone && <p className="text-red-300 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-white font-medium mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0095B6]"
              placeholder="At least 6 characters"
            />
          </div>
          {errors.password && <p className="text-red-300 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-white font-medium mb-2">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0095B6]"
              placeholder="Re-enter password"
            />
          </div>
          {errors.confirmPassword && <p className="text-red-300 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>

        {errors.submit && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#0095B6] to-[#007798] text-white py-3 rounded-lg font-medium hover:from-[#007798] hover:to-[#005a79] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Continue'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
