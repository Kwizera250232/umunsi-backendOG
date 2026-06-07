import { useState, useEffect, useCallback } from 'react';
import { Link, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Crown,
  Sparkles,
  Lock,
  Unlock,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Star,
  Shield,
  Zap,
  BookOpen,
  CreditCard,
  Smartphone,
  RefreshCw,
  Send,
  Headphones
} from 'lucide-react';
import { apiClient, PremiumDashboardPost, SupportPayment, resolveAssetUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PREMIUM_AMOUNT = 500;

const getImageUrl = (url?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&h=250&fit=crop';
  return resolveAssetUrl(url) || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&h=250&fit=crop';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('rw-RW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('rw-RW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isPremiumActive = (isPremium?: boolean, premiumUntil?: string | null) => {
  if (!isPremium) return false;
  if (!premiumUntil) return true;
  return new Date(premiumUntil) > new Date();
};

const PremiumDashboard = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [premiumPosts, setPremiumPosts] = useState<PremiumDashboardPost[]>([]);
  const [payments, setPayments] = useState<SupportPayment[]>([]);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  const [msisdn, setMsisdn] = useState('');
  const [payMethod, setPayMethod] = useState<'momo' | 'cc'>('momo');
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [postsRes, paymentRes] = await Promise.all([
        apiClient.getPremiumDashboardPosts(),
        apiClient.getPaymentsProfile()
      ]);

      if (postsRes.success) setPremiumPosts(postsRes.data || []);
      if (paymentRes.success && paymentRes.data) {
        setIsPremium(paymentRes.data.user.isPremium);
        setPremiumUntil(paymentRes.data.user.premiumUntil || null);
        setPayments(paymentRes.data.payments || []);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/subscriber/account');
      return;
    }
    if (user?.role && user.role !== 'USER') {
      navigate('/admin');
      return;
    }
    loadDashboard();
  }, [isAuthenticated, user?.role, navigate, loadDashboard]);

  if (user?.role && user.role !== 'USER') {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    const txRef = searchParams.get('txRef');
    const isCallback = searchParams.get('payment') === 'callback';
    if (!isCallback || !txRef) return;

    const verifyPayment = async () => {
      try {
        setVerifying(true);
        setMessage({ type: 'info', text: 'Turareba ko kwishyura byagenze neza...' });
        const result = await apiClient.verifyKpaySupportPayment(txRef);
        if (result.data?.payment?.status === 'SUCCESS') {
          setMessage({ type: 'success', text: 'Kwishyura byagenze neza! Premium yafunguwe.' });
          setIsPremium(true);
          if (result.data.premium?.premiumUntil) {
            setPremiumUntil(result.data.premium.premiumUntil);
          }
          refreshUser?.();
          loadDashboard();
        } else if (result.data?.payment?.status === 'PENDING') {
          setMessage({ type: 'info', text: 'Kwishyura biracyari mu nzira. Ongera ugerageze mu minota mike.' });
        } else {
          setMessage({ type: 'error', text: 'Kwishyura ntibyagenze neza. Ongera ugerageze.' });
        }
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'Ntibyashoboye kugenzura kwishyura.' });
      } finally {
        setVerifying(false);
        setSearchParams({});
      }
    };

    verifyPayment();
  }, [searchParams, setSearchParams, refreshUser, loadDashboard]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    setMessage(null);

    try {
      const result = await apiClient.initializeKpaySupportPayment({
        pmethod: payMethod,
        msisdn: payMethod === 'momo' ? msisdn : undefined
      });

      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
        return;
      }

      if (result.data?.premium) {
        setMessage({ type: 'success', text: 'Premium yafunguwe neza!' });
        setIsPremium(true);
        refreshUser?.();
        loadDashboard();
      } else {
        setMessage({ type: 'info', text: result.message || 'Kwishyura byatangiye. Kurikiza amabwiriza kuri telefoni yawe.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ntibyashoboye gutangiza kwishyura.' });
    } finally {
      setPaying(false);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(
      `Izina: ${contactForm.name}\nImeyili: ${contactForm.email}\n\n${contactForm.message}`
    );
    window.location.href = `mailto:info@umunsi.rw?subject=${encodeURIComponent(contactForm.subject || 'Premium Support')}&body=${body}`;
    setContactSent(true);
    setTimeout(() => setContactSent(false), 4000);
  };

  const activePremium = isPremiumActive(isPremium, premiumUntil);
  const accessibleCount = premiumPosts.filter((p) => p.hasAccess).length;
  const lockedCount = premiumPosts.filter((p) => !p.hasAccess).length;
  const successfulPayments = payments.filter((payment) => payment.status === 'SUCCESS');
  const totalBalance = successfulPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const benefits = [
    { icon: BookOpen, title: 'Inkuru za Premium', desc: 'Soma amakuru yihariye n\'ibyanditswe byimbitse' },
    { icon: Zap, title: 'Amakuru y\'Igihe', desc: 'Bona amakuru mashya mbere y\'abandi' },
    { icon: Shield, title: 'Nta Mamaza', desc: 'Uburambe busa nta mamaza mu nkuru za premium' },
    { icon: Star, title: 'Inkunga y\'Itangazamakuru', desc: 'Fasha Umunsi gukomeza gutanga amakuru y\'ukuri' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#fcd535] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Turategura dashboard yawe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[#2b2f36]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fcd535]/10 via-transparent to-[#f0b90b]/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#fcd535]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fcd535]/10 border border-[#fcd535]/30 text-[#fcd535] text-xs font-semibold mb-4">
                <Crown className="w-3.5 h-3.5" />
                Umunsi Premium
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Muraho, {user?.firstName || 'Mukiliya'} 👋
              </h1>
              <p className="text-gray-400 max-w-xl leading-relaxed">
                {activePremium
                  ? 'Urabona amakuru yose ya Premium. Urakoze ku nkunga yawe — dukomeza kugufasha gukomeza kumenya byinshi.'
                  : 'Fungura Premium uhabwe uburenganzira bwo gusoma inkuru zihariye n\'ibyanditswe byimbitse by\'abanyamakuru bacu.'}
              </p>
            </div>

            <div className="lg:w-80 shrink-0">
              <div className={`rounded-2xl border p-6 ${
                activePremium
                  ? 'bg-gradient-to-br from-[#fcd535]/15 to-[#f0b90b]/5 border-[#fcd535]/40'
                  : 'bg-[#181a20] border-[#2b2f36]'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activePremium ? 'bg-[#fcd535]' : 'bg-[#2b2f36]'
                  }`}>
                    {activePremium ? (
                      <Crown className="w-6 h-6 text-[#0b0e11]" />
                    ) : (
                      <Lock className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold">
                      {activePremium ? 'Premium Ifunguye' : 'Premium Ifunze'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {activePremium && premiumUntil
                        ? `Irangira: ${formatDate(premiumUntil)}`
                        : `${PREMIUM_AMOUNT} RWF / ukwezi`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-[#0b0e11]/60 rounded-xl p-3">
                    <p className="text-2xl font-bold text-[#fcd535]">{accessibleCount}</p>
                    <p className="text-gray-500 text-xs">Zifunguye</p>
                  </div>
                  <div className="bg-[#0b0e11]/60 rounded-xl p-3">
                    <p className="text-2xl font-bold text-white">{premiumPosts.length}</p>
                    <p className="text-gray-500 text-xs">Inkuru za Premium</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-2 pb-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="rounded-2xl border border-[#2b2f36] bg-[#181a20] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Inkuru za Premium</p>
            <p className="mt-2 text-2xl md:text-3xl font-black text-white">{premiumPosts.length}</p>
          </div>
          <div className="rounded-2xl border border-[#2b2f36] bg-[#181a20] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Zifunguye</p>
            <p className="mt-2 text-2xl md:text-3xl font-black text-[#fcd535]">{accessibleCount}</p>
          </div>
          <div className="rounded-2xl border border-[#2b2f36] bg-[#181a20] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Balance</p>
            <p className="mt-2 text-2xl md:text-3xl font-black text-emerald-400">{totalBalance.toLocaleString()} RWF</p>
          </div>
          <div className="rounded-2xl border border-[#2b2f36] bg-[#181a20] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Kwishyura</p>
            <p className="mt-2 text-2xl md:text-3xl font-black text-white">{successfulPayments.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status message */}
        {(message || verifying) && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
            verifying || message?.type === 'info'
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : message?.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {verifying ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
            ) : message?.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{verifying ? 'Turareba ko kwishyura byagenze neza...' : message?.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="xl:col-span-2 space-y-8">
            {/* Benefits */}
            {!activePremium && (
              <section>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#fcd535]" />
                  Impamvu zo kwishyura Premium
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {benefits.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="bg-[#181a20] border border-[#2b2f36] rounded-2xl p-5 hover:border-[#fcd535]/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-[#fcd535]/10 flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5 text-[#fcd535]" />
                      </div>
                      <h3 className="text-white font-semibold mb-1">{title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Premium articles */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#fcd535]" />
                  Inkuru za Premium
                  {lockedCount > 0 && !activePremium && (
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      ({lockedCount} zifunze)
                    </span>
                  )}
                </h2>
                <button
                  onClick={loadDashboard}
                  className="text-gray-500 hover:text-[#fcd535] transition-colors p-2 rounded-lg hover:bg-[#181a20]"
                  title="Ongera usubize"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {premiumPosts.length === 0 ? (
                <div className="bg-[#181a20] border border-[#2b2f36] rounded-2xl p-10 text-center">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nta nkuru za Premium ziriho ubu.</p>
                  <Link to="/" className="text-[#fcd535] text-sm hover:underline mt-2 inline-block">
                    Reba amakuru yose →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {premiumPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`group bg-[#181a20] border rounded-2xl overflow-hidden transition-all ${
                        post.hasAccess
                          ? 'border-[#2b2f36] hover:border-[#fcd535]/40'
                          : 'border-[#2b2f36] opacity-90'
                      }`}
                    >
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={getImageUrl(post.featuredImage)}
                          alt={post.title}
                          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            !post.hasAccess ? 'blur-sm' : ''
                          }`}
                        />
                        <div className="absolute top-3 left-3">
                          {post.hasAccess ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-semibold">
                              <Unlock className="w-3 h-3" /> Ifunguye
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#0b0e11]/80 text-[#fcd535] text-xs font-semibold border border-[#fcd535]/40">
                              <Lock className="w-3 h-3" /> Premium
                            </span>
                          )}
                        </div>
                        {post.category && (
                          <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-[#fcd535] text-[#0b0e11] text-xs font-bold">
                            {post.category.name}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold line-clamp-2 mb-2 group-hover:text-[#fcd535] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-500 text-xs mb-3 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(post.publishedAt || post.createdAt)}
                        </p>
                        {post.hasAccess ? (
                          <Link
                            to={`/post/${post.slug}`}
                            className="inline-flex items-center gap-1 text-[#fcd535] text-sm font-medium hover:underline"
                          >
                            Soma inkuru <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <p className="text-gray-500 text-sm">Fungura Premium kugira ngo usome</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Payment history */}
            {payments.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#fcd535]" />
                  Amateka yo Kwishyura
                </h2>
                <div className="bg-[#181a20] border border-[#2b2f36] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2b2f36] text-gray-500 text-left">
                          <th className="px-4 py-3 font-medium">Itariki</th>
                          <th className="px-4 py-3 font-medium">Amafaranga</th>
                          <th className="px-4 py-3 font-medium">Imiterere</th>
                          <th className="px-4 py-3 font-medium hidden sm:table-cell">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} className="border-b border-[#2b2f36]/50 last:border-0 hover:bg-[#1e2329]/50">
                            <td className="px-4 py-3 text-gray-300">{formatDateTime(payment.paidAt || payment.createdAt)}</td>
                            <td className="px-4 py-3 text-white font-medium">{payment.amount.toLocaleString()} {payment.currency}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                payment.status === 'SUCCESS'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : payment.status === 'PENDING'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell font-mono truncate max-w-[140px]">
                              {payment.txRef}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment card */}
            {!activePremium && (
              <div className="bg-[#181a20] border border-[#fcd535]/30 rounded-2xl overflow-hidden sticky top-24">
                <div className="bg-gradient-to-r from-[#fcd535]/20 to-[#f0b90b]/10 px-5 py-4 border-b border-[#fcd535]/20">
                  <h2 className="text-white font-bold flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[#fcd535]" />
                    Fungura Premium
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {PREMIUM_AMOUNT.toLocaleString()} RWF / ukwezi — wishyura ukoresheje MoMo cyangwa ikarita
                  </p>
                </div>
                <form onSubmit={handlePayment} className="p-5 space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPayMethod('momo')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        payMethod === 'momo'
                          ? 'bg-[#fcd535] text-[#0b0e11]'
                          : 'bg-[#2b2f36] text-gray-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      MoMo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod('cc')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        payMethod === 'cc'
                          ? 'bg-[#fcd535] text-[#0b0e11]'
                          : 'bg-[#2b2f36] text-gray-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Ikarita
                    </button>
                  </div>

                  {payMethod === 'momo' && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">Nomero ya telefoni (MoMo)</label>
                      <input
                        type="tel"
                        value={msisdn}
                        onChange={(e) => setMsisdn(e.target.value)}
                        placeholder="078X XXX XXX"
                        required
                        className="w-full px-4 py-3 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#fcd535]/50"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={paying}
                    className="w-full py-3.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-bold rounded-xl hover:from-[#f0b90b] hover:to-[#fcd535] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {paying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Crown className="w-5 h-5" />
                        Wishyura {PREMIUM_AMOUNT.toLocaleString()} RWF
                      </>
                    )}
                  </button>

                  <p className="text-gray-600 text-xs text-center leading-relaxed">
                    Kwishyura byemewe na KPay. Premium izafungurwa ako kanya nyuma yo kwishyura neza.
                  </p>
                </form>
              </div>
            )}

            {activePremium && (
              <div className="bg-gradient-to-br from-[#fcd535]/15 to-[#f0b90b]/5 border border-[#fcd535]/30 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-8 h-8 text-[#fcd535]" />
                  <div>
                    <p className="text-white font-bold">Premium Irakora</p>
                    <p className="text-gray-400 text-sm">
                      {premiumUntil ? `Irangira ${formatDate(premiumUntil)}` : 'Byemewe'}
                    </p>
                  </div>
                </div>
                <Link
                  to="/"
                  className="block text-center py-2.5 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] transition-colors text-sm"
                >
                  Soma amakuru mashya
                </Link>
              </div>
            )}

            {/* Contact section */}
            <div className="bg-[#181a20] border border-[#2b2f36] rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#1e2329] to-[#181a20] px-5 py-4 border-b border-[#2b2f36]">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-[#fcd535]" />
                  Twandikire
                </h2>
                <p className="text-gray-500 text-sm mt-1">Dufite ikibazo? Turi hano kugufasha.</p>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-3">
                  <a
                    href="mailto:info@umunsi.rw"
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0e11] border border-[#2b2f36] hover:border-[#fcd535]/40 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#fcd535]/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[#fcd535]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium group-hover:text-[#fcd535] transition-colors">Imeyili</p>
                      <p className="text-gray-500 text-xs truncate">info@umunsi.rw</p>
                    </div>
                  </a>

                  <a
                    href="tel:+250788000000"
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0e11] border border-[#2b2f36] hover:border-[#fcd535]/40 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium group-hover:text-[#fcd535] transition-colors">Telefoni</p>
                      <p className="text-gray-500 text-xs">+250 788 000 000</p>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/250788000000?text=Muraho%20Umunsi%2C%20nshaka%20ubufasha%20bwa%20Premium"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0e11] border border-[#2b2f36] hover:border-[#25d366]/40 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#25d366]/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-[#25d366]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium group-hover:text-[#25d366] transition-colors">WhatsApp</p>
                      <p className="text-gray-500 text-xs">Vugana natwe ako kanya</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0e11] border border-[#2b2f36]">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Aho duherereye</p>
                      <p className="text-gray-500 text-xs">Kigali, Rwanda</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#2b2f36] pt-4">
                  <p className="text-gray-400 text-sm mb-3 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-[#fcd535]" />
                    Ohereza ubutumwa
                  </p>
                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Izina ryawe"
                      value={contactForm.name}
                      onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                      required
                      className="w-full px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#fcd535]/50"
                    />
                    <input
                      type="email"
                      placeholder="Imeyili yawe"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                      required
                      className="w-full px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#fcd535]/50"
                    />
                    <input
                      type="text"
                      placeholder="Insanganyamatsiko (Premium, kwishyura...)"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#fcd535]/50"
                    />
                    <textarea
                      placeholder="Andika ubutumwa bwawe hano..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                      required
                      rows={3}
                      className="w-full px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#fcd535]/50 resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#2b2f36] text-white font-medium rounded-xl hover:bg-[#363a45] transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      {contactSent ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          Byoherejwe!
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Ohereza Ubutumwa
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-[#181a20] border border-[#2b2f36] rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-3 text-sm">Amahuza yihuse</h3>
              <div className="space-y-2">
                <Link to="/profile" className="flex items-center justify-between text-gray-400 hover:text-[#fcd535] text-sm py-2 transition-colors">
                  <span>Imiterere ya Konti</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link to="/" className="flex items-center justify-between text-gray-400 hover:text-[#fcd535] text-sm py-2 transition-colors">
                  <span>Amakuru Mashya</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link to="/newsletter" className="flex items-center justify-between text-gray-400 hover:text-[#fcd535] text-sm py-2 transition-colors">
                  <span>Inyandiko</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumDashboard;
