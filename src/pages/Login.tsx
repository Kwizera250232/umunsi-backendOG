import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Get user data from localStorage to check role
        const storedUser = localStorage.getItem('umunsi_user');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Redirect based on role - use window.location for full page reload
          if (userData.role === 'ADMIN' || userData.role === 'EDITOR' || userData.role === 'AUTHOR') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/';
          }
        } else {
          window.location.href = '/';
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (error: any) {
      setError(error?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#fcd535]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#f0b90b]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#fcd535]/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{ 
        backgroundImage: `linear-gradient(to right, #fcd535 1px, transparent 1px), linear-gradient(to bottom, #fcd535 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-block mb-6 group">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#fcd535]/20 to-[#f0b90b]/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <img src="/images/logo.png" alt="Umunsi Logo" className="h-14 mx-auto relative" />
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#fcd535]" />
            <h2 className="text-3xl font-bold text-white">Kwinjira</h2>
            <Sparkles className="w-5 h-5 text-[#fcd535]" />
          </div>
          <p className="text-gray-400">Injira kuri konti yawe yo gufata amakuru</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#181a20] rounded-2xl shadow-2xl p-8 border border-[#2b2f36] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Imeyili
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-[#fcd535] transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-4 py-3.5 bg-[#1e2329] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]/50 transition-all duration-300"
                  placeholder="Injiza imeyili yawe"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Ijambo ry'ibanga
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#fcd535] transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-14 py-3.5 bg-[#1e2329] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]/50 transition-all duration-300"
                  placeholder="Injiza ijambo ry'ibanga"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#fcd535] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 bg-[#1e2329] border-[#2b2f36] rounded text-[#fcd535] focus:ring-[#fcd535]/50 focus:ring-offset-[#181a20]"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-400">
                  Nyibutsa
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-[#fcd535] hover:text-[#f0b90b] font-medium transition-colors"
              >
                Wibagiwe ijambo ry'ibanga?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] rounded-xl transition-all duration-300 group-hover:scale-105"></div>
              <div className="relative flex items-center justify-center py-3.5 px-4 text-[#0b0e11] font-bold rounded-xl transition-all duration-300">
              {isLoading ? (
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#0b0e11] border-t-transparent mr-2"></div>
                  Kwinjira...
                </div>
              ) : (
                  <>
                    <span>Kwinjira</span>
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2b2f36]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#181a20] text-gray-500">Cyangwa</span>
              </div>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="mt-6 space-y-3">
            <button className="w-full flex items-center justify-center px-4 py-3.5 bg-[#1e2329] border border-[#2b2f36] rounded-xl text-gray-300 hover:bg-[#2b2f36] hover:border-[#3d4148] transition-all duration-300 group">
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Kwinjira na Google
            </button>
            
            <button className="w-full flex items-center justify-center px-4 py-3.5 bg-[#1e2329] border border-[#2b2f36] rounded-xl text-gray-300 hover:bg-[#2b2f36] hover:border-[#3d4148] transition-all duration-300 group">
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Kwinjira na Facebook
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Niba utarafungura konti?{' '}
              <Link
                to="/register"
                className="font-medium text-[#fcd535] hover:text-[#f0b90b] transition-colors"
              >
                Fungura konti
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Uko gukoresha urubuga rwacu bisobanuye ko wemera{' '}
            <Link to="/terms" className="text-[#fcd535] hover:text-[#f0b90b] transition-colors">
              amabwiriza
            </Link>{' '}
            n'<Link to="/privacy" className="text-[#fcd535] hover:text-[#f0b90b] transition-colors">
              ibisobanura by'ubuzima
            </Link>
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#fcd535]/30"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
