import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        const storedUser = localStorage.getItem('umunsi_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'ADMIN' || userData.role === 'EDITOR' || userData.role === 'AUTHOR') {
            window.location.href = '/admin';
          } else {
            setError('You do not have admin access');
          }
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#fcd535]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] rounded-2xl blur opacity-30 animate-pulse"></div>
              <div className="relative bg-[#fcd535] p-3 rounded-2xl">
                <Layers className="w-8 h-8 text-[#0b0e11]" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Umunsi</h1>
          <p className="text-gray-400">News Admin Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#181a20] rounded-3xl border border-[#2b2f36] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-[#2b2f36] text-center">
            <h2 className="text-xl font-semibold text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 mr-2 text-[#fcd535]" />
              Admin Login
            </h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to access the dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Email Field */}
    <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
          <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535] transition-all"
                  placeholder="admin@umunsi.com"
                  required
          />
        </div>
            </div>

            {/* Password Field */}
        <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
          <input
                  type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535] transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#fcd535] bg-[#0b0e11] border-[#2b2f36] rounded focus:ring-[#fcd535]"
                />
                <span className="ml-2 text-sm text-gray-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-[#fcd535] hover:text-[#f0b90b] transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#fcd535]/20 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0b0e11]/30 border-t-[#0b0e11] rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 py-4 bg-[#0b0e11] border-t border-[#2b2f36] text-center">
            <p className="text-gray-500 text-sm">
              Need access?{' '}
              <a href="#" className="text-[#fcd535] hover:text-[#f0b90b] transition-colors">
                Contact administrator
              </a>
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs flex items-center justify-center">
            <Lock className="w-3 h-3 mr-1" />
            Secured with SSL encryption
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-[#fcd535] text-sm transition-colors"
          >
            ← Back to Umunsi News
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
