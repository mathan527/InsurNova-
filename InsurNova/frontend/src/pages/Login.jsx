import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Loader, Zap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      // Use full-page navigation so AuthContext re-initializes from localStorage.
      // navigate() alone can fire before setUser() state update is applied.
      if (response.user && response.user.profileCompleted === false) {
        window.location.href = '/register';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    demoLogin(); // writes token + user to localStorage and calls setUser()
    // React batches state updates — navigate() would fire before user state
    // is applied, making ProtectedRoute see isAuthenticated=false → redirect
    // back to /login. Full-page navigation re-initializes AuthContext fresh.
    window.location.href = '/dashboard';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'var(--bg-base)',
        backgroundImage:
          'radial-gradient(ellipse at 30% 30%, rgba(0,149,182,0.12) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(99,102,241,0.08) 0%, transparent 55%)',
      }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0,149,182,0.2), rgba(0,90,121,0.2))',
              border: '1px solid rgba(0,212,255,0.25)',
              boxShadow: '0 0 24px rgba(0,212,255,0.15)',
            }}
          >
            <Shield className="w-8 h-8" style={{ color: 'var(--neon-cyan)' }} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            InsurNova
          </h1>
          <p className="mt-2 text-sm font-medium" style={{
            background: 'var(--gradient-ai)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            AI-Powered Parametric Insurance
          </p>
        </div>

        {/* Demo button — prominent for judges */}
        <button
          onClick={handleDemoLogin}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-base mb-6 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,184,148,0.1))',
            border: '1px solid rgba(0,255,136,0.35)',
            color: 'var(--neon-green)',
            boxShadow: '0 4px 20px rgba(0,255,136,0.15)',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 30px rgba(0,255,136,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,255,136,0.15)'; }}
        >
          <Zap className="w-5 h-5" />
          Enter Demo Mode (No Login Required)
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or sign in</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{
              background: 'rgba(255,59,92,0.1)',
              border: '1px solid rgba(255,59,92,0.3)',
              color: 'var(--neon-red)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            {loading ? (
              <><Loader className="w-5 h-5 animate-spin" />Signing in...</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium" style={{ color: 'var(--neon-cyan)' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
