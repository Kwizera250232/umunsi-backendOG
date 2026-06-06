import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminLogin = () => {
  const { login, logout } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(formData.email, formData.password);

      if (!success) {
        setError('Imeyili cyangwa ijambo ry\'ibanga si byo.');
        return;
      }

      const storedUser = localStorage.getItem('umunsi_user');
      const userData = storedUser ? JSON.parse(storedUser) : null;
      const allowedRoles = ['ADMIN', 'EDITOR', 'AUTHOR'];

      if (!userData) {
        logout();
        setError('Ntibyashobotse kubona amakuru ya konti. Ongera ugerageze.');
        return;
      }

      if (!allowedRoles.includes(userData.role)) {
        window.location.href = '/subscriber/account';
        return;
      }

      window.location.href = '/admin';
    } catch (err: any) {
      setError(err?.message || 'Kwinjira byanze. Ongera ugerageze.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-[#181a20] border border-[#2b2f36] rounded-2xl p-8">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block mb-4">
            <img src="/images/logo.png" alt="Umunsi.com Logo" className="h-12 mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Admin / Author Login</h1>
          <p className="text-gray-400 text-sm mt-1">Abayobozi, abanditsi n\'abahanga mu nyandiko</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Imeyili</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg pl-10 pr-3 py-3 text-white"
                placeholder="admin@umunsi.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Ijambo ry'ibanga</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg pl-10 pr-10 py-3 text-white"
                placeholder="Injiza ijambo ry'ibanga"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#fcd535]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#fcd535] text-[#0b0e11] font-bold py-3 rounded-lg hover:bg-[#f0b90b] disabled:opacity-60"
          >
            {isLoading ? 'Birimo...' : 'Kwinjira muri Admin'}
          </button>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-[#fcd535] hover:underline">
              Wibagiwe ijambo ry'ibanga?
            </Link>
          </div>
        </form>

        <div className="mt-5 text-center text-sm text-gray-400">
          <Shield className="w-4 h-4 inline mr-1 text-[#fcd535]" />
          Ukeneye konti y'abafatabuguzi?
          <Link to="/subscriber-login" className="text-[#fcd535] ml-1 hover:underline">
            Subscriber Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
