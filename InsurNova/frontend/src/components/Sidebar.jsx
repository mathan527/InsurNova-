import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Shield, FlaskConical,
  BarChart3, User, Settings, LogOut, Menu, X, Brain, CreditCard, Map,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard',   href: '/dashboard',  icon: LayoutDashboard },
  { name: 'Claims',      href: '/claims',      icon: FileText },
  { name: 'Policies',    href: '/policies',    icon: Shield },
  { name: 'Payments',    href: '/payment',     icon: CreditCard },
  { name: 'Simulator',   href: '/simulator',   icon: FlaskConical },
  { name: 'Analytics',   href: '/analytics',   icon: BarChart3 },
  { name: 'AI Monitor',  href: '/ai-monitor',  icon: Brain, live: true },
  { name: 'GPS Fraud Map', href: '/fraud-map', icon: Map, alert: true },
  { name: 'Profile',     href: '/profile',     icon: User },
  { name: 'Settings',    href: '/settings',    icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
          }}
        >
          {mobileMenuOpen
            ? <X className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
            : <Menu className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          background: 'rgba(6, 13, 26, 0.95)',
          borderRight: '1px solid var(--glass-border)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 z-40
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{
              background: 'linear-gradient(135deg, rgba(0,149,182,0.2), rgba(0,90,121,0.2))',
              border: '1px solid rgba(0,212,255,0.2)',
            }}>
              <img src="/insurnova-logo.png" alt="InsurNova" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>InsurNova</h1>
              <p className="text-xs font-medium" style={{
                background: 'var(--gradient-ai)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                AI Insurance
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`sidebar-nav-item ${active ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.live && (
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--neon-green)',
                      boxShadow: '0 0 6px var(--neon-green)',
                      animation: 'pulse-live 2s ease-in-out infinite',
                    }} />
                  )}
                  {item.alert && (
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--neon-red)',
                      boxShadow: '0 0 6px var(--neon-red)',
                      animation: 'pulse-live 1.5s ease-in-out infinite',
                    }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{
                background: 'linear-gradient(135deg, rgba(0,149,182,0.2), rgba(99,102,241,0.2))',
                border: '1px solid rgba(0,212,255,0.2)',
                color: 'var(--neon-cyan)',
              }}>
                {(user?.name || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.name || 'User'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200"
              style={{ color: 'var(--neon-red)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,92,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
