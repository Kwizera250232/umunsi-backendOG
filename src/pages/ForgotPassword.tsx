import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Shyiramo email yawe.');
      return;
    }

    if (!oldPassword) {
      setError('Shyiramo old password wakoreshaga.');
      return;
    }

    if (password.length < 6) {
      setError("Ijambo ry'ibanga rishya rigomba kuba nibura inyuguti 6.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password nshya ebyiri ntizihura.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.changePasswordWithEmail({
        email: email.trim(),
        oldPassword,
        newPassword: password,
      });

      setSuccess(response.message || "Ijambo ry'ibanga ryahinduwe neza.");
      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || "Ntibyemewe: email cyangwa old password si byo.");
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
          <h1 className="text-2xl font-bold text-white">Wibagiwe ijambo ry'ibanga?</h1>
          <p className="text-gray-400 text-sm mt-1">Andika email, old password, password nshya ebyiri.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Imeyili</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg pl-10 pr-3 py-3 text-white"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Old password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg pl-10 pr-10 py-3 text-white"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#fcd535]"
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password nshya</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg pl-10 pr-10 py-3 text-white"
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

          <div>
            <label className="block text-sm text-gray-300 mb-1">Emeza password nshya</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg pl-10 pr-10 py-3 text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#fcd535]"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#fcd535] text-[#0b0e11] font-bold py-3 rounded-lg hover:bg-[#f0b90b] disabled:opacity-60"
          >
            {isLoading ? 'Birimo...' : "Emeza guhindura password"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-gray-400">
          <Link to="/subscriber-login" className="text-[#fcd535] hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Subira kuri login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
