import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, KeyRound } from 'lucide-react';
import { apiClient } from '../services/api';

const ResetPassword = () => {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') || '', []);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset link ntabwo ifite token. Saba indi link nshya.');
      return;
    }

    if (password.length < 6) {
      setError("Ijambo ry'ibanga rigomba kuba nibura inyuguti 6.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Amagambo y'ibanga ntahura.");
      return;
    }

    setIsLoading(true);

    if (!email.trim()) {
      setError('Shyiramo email ya konti.');
      return;
    }

    if (!code.trim()) {
      setError('Shyiramo code woherejwe.');
      return;
    }

    try {
      const response = await apiClient.resetPassword({ token, email: email.trim(), code: code.trim(), password });
      setSuccess(response.message || "Ijambo ry'ibanga ryahinduwe neza.");
      setEmail('');
      setCode('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || "Ntibyashobotse guhindura ijambo ry'ibanga. Saba indi link.");
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
          <h1 className="text-2xl font-bold text-white">Shyiraho ijambo ry'ibanga rishya</h1>
          <p className="text-gray-400 text-sm mt-1">Andika ijambo ry'ibanga rishya rya konti yawe.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Imeyili ya konti</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg pl-10 pr-3 py-3 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Kode woherejwe</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s+/g, ''))}
                className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg pl-10 pr-3 py-3 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Ijambo ry'ibanga rishya</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
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
            <label className="block text-sm text-gray-300 mb-1">Emeza ijambo ry'ibanga</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
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
            {isLoading ? 'Birimo...' : "Hindura ijambo ry'ibanga"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-gray-400">
          <Link to="/subscriber-login" className="text-[#fcd535] hover:underline">
            Subira kuri login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
