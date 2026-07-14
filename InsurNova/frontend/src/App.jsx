import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import RegisterContainer from './pages/register/RegisterContainer';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Claims from './pages/Claims';
import Policies from './pages/Policies';
import Simulator from './pages/Simulator';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AIMonitor from './pages/AIMonitor';
import Payment from './pages/Payment';
import FraudMap from './pages/FraudMap';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/register" element={<RegisterContainer />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/claims"    element={<ProtectedRoute><Claims /></ProtectedRoute>} />
            <Route path="/policies"  element={<ProtectedRoute><Policies /></ProtectedRoute>} />
            <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/ai-monitor" element={<ProtectedRoute><AIMonitor /></ProtectedRoute>} />
            <Route path="/payment"    element={<ProtectedRoute><Payment /></ProtectedRoute>} />
            <Route path="/fraud-map"  element={<ProtectedRoute><FraudMap /></ProtectedRoute>} />

            {/* Default */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
