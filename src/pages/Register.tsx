import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../services/api';

const Register = () => {
  const [registrationStep, setRegistrationStep] = useState<'details' | 'payment'>('details');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profileUrl: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const searchParams = new URLSearchParams(window.location.search);
  const redirectParam = searchParams.get('redirect') || '';
  const requestedRole = (searchParams.get('role') || '').toLowerCase();
  const isAuthorSignupPath = window.location.pathname === '/author-signup';
  const isAuthorSignup = isAuthorSignupPath || requestedRole === 'author';
  const authorInviteKey = searchParams.get('key') || '';
  const safeRedirect = redirectParam.startsWith('/') && !redirectParam.startsWith('//')
    ? redirectParam
    : isAuthorSignup ? '/admin/posts' : '/subscriber/account?onboardPayment=1';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Ijambo ry'ibanga ntirihura.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Ijambo ry'ibanga rigomba kuba nibura inyuguti 6.");
      return;
    }

    if (!isAuthorSignup && registrationStep === 'details') {
      setRegistrationStep('payment');
      return;
    }

    setIsLoading(true);

    try {
      const emailLocalPart = (formData.email.split('@')[0] || '')
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '');
      const username = `${emailLocalPart || 'user'}_${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
      const response = await apiClient.register({
        username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        profileUrl: isAuthorSignup && formData.profileUrl ? formData.profileUrl.trim() : undefined,
        role: isAuthorSignup ? 'AUTHOR' : 'USER',
        authorInviteKey: isAuthorSignup ? authorInviteKey : undefined
      });

      if (response.success) {
        if (isAuthorSignup && response.user?.role !== 'AUTHOR') {
          setError("Author signup ntabwo yemewe. Reba invite key cyangwa hamagara admin.");
          return;
        }

        if (!isAuthorSignup && response.user?.role !== 'USER') {
          setError("Kwiyandikisha byagenze nabi ku ruhande rwa server. Ongera ugerageze cyangwa hamagara support.");
          return;
        }

        localStorage.setItem('umunsi_user', JSON.stringify(response.user));
        if (response.token) {
          localStorage.setItem('umunsi_token', response.token);
        }
        window.location.href = safeRedirect;
        return;
      }

      setError('Kwiyandikisha byanze. Ongera ugerageze.');
    } catch (err: any) {
      setError(err?.message || 'Kwiyandikisha byanze.');
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
          <h1 className="text-2xl font-bold text-white">{isAuthorSignup ? 'Fungura Konti y\'Umwanditsi' : "Fungura Konti y'Abafatabuguzi"}</h1>
          <p className="text-gray-400 text-sm mt-1">{isAuthorSignup ? 'Uzabona dashboard yo kwandika inkuru no kubika muri Draft' : registrationStep === 'details' ? 'Banza wuzuze amakuru yawe, ubundi ukomeze ku gice cyo kwishyura' : 'Konti yawe igiye gufungurwa hanyuma ukomeze wishyure Premium'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(isAuthorSignup || registrationStep === 'details') ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Izina</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg pl-10 pr-3 py-3 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Izina ry'umuryango</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg px-3 py-3 text-white"
                  />
                </div>
              </div>

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
                  />
                </div>
              </div>

              {isAuthorSignup && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Kora konte kuri umunsimedia.com ushyireho URL ya konte yawe hano *</label>
                  <input
                    type="url"
                    name="profileUrl"
                    required
                    value={formData.profileUrl}
                    onChange={handleInputChange}
                    placeholder="https://www.umunsimedia.com/author-name"
                    className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg px-3 py-3 text-white"
                  />
                </div>
              )}

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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
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
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full bg-[#1e2329] border border-[#2b2f36] rounded-lg pl-10 pr-10 py-3 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-[#fcd535]/30 bg-[#11151b] p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Dushyigikire</h2>
                <p className="text-sm text-gray-300 mt-2">
                  Wishyure 500 RWF / Ku kwezi ubone inkuru za Premium ndetse ubashe no kuvugana natwe byoroshye.
                </p>
              </div>

              <div className="rounded-lg border border-[#2b2f36] bg-[#0f1115] p-4 text-sm text-gray-300 space-y-2">
                <p>Izina: <span className="text-white font-medium">{formData.firstName} {formData.lastName}</span></p>
                <p>Imeyili: <span className="text-white font-medium">{formData.email}</span></p>
                <p className="text-gray-400">Nyuma yo gufungura konti, uzahita ujyanwa aho wishyurira KPay muri konti yawe ya subscriber.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRegistrationStep('details')}
                  className="flex-1 rounded-lg bg-[#2b2f36] py-3 text-white hover:bg-[#363a45]"
                >
                  Subira inyuma
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-[#fcd535] py-3 font-bold text-[#0b0e11] hover:bg-[#f0b90b] disabled:opacity-60"
                >
                  {isLoading ? 'Birimo...' : 'Fungura konti ukomeze wishyure'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {(isAuthorSignup || registrationStep === 'details') && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#fcd535] text-[#0b0e11] font-bold py-3 rounded-lg hover:bg-[#f0b90b] disabled:opacity-60"
            >
              {isLoading ? 'Birimo...' : isAuthorSignup ? 'Fungura Author Konti' : 'Next'}
            </button>
          )}
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          Google signup iri gutegurwa. Ubu koresha imeyili.
        </div>

        <div className="mt-4 text-center text-sm text-gray-400">
          Usanzwe ufite konti?
          <Link to={isAuthorSignup ? '/admin-login' : '/subscriber-login'} className="text-[#fcd535] ml-1 hover:underline">
            Injira
          </Link>
        </div>

        <div className="mt-2 text-center text-sm text-gray-400">
          Wibagiwe ijambo ry'ibanga?
          <Link to="/forgot-password" className="text-[#fcd535] ml-1 hover:underline">
            Hindura password
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
