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
const SUPPORT_PHONE = '0791859465';
const SUPPORT_PHONE_E164 = '+250791859465';
const SUPPORT_WHATSAPP = '250791859465';
const SUPPORT_EMAIL = 'info@umunsi.rw';

type DashboardTab = 'overview' | 'articles' | 'contact';

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
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

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
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(contactForm.subject || 'Premium Support')}&body=${body}`;
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

  const paymentSteps = [
    { step: '1', title: 'Hitamo uburyo', desc: 'MoMo cyangwa ikarita ya banki' },
    { step: '2', title: 'Emeza kwishyura', desc: 'Kurikiza amabwiriza kuri telefoni yawe' },
    { step: '3', title: 'Soma Premium', desc: 'Uburenganzira bufungurwa ako kanya' }
  ];

  const dashboardTabs: Array<{ id: DashboardTab; label: string }> = [
    { id: 'overview', label: 'Ahabanza' },
    { id: 'articles', label: 'Inkuru za Premium' },
    { id: 'contact', label: 'Twandikire' }
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

        {/* Tab navigation */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-[#2b2f36] pb-1">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#fcd535] text-[#0b0e11]'
                  : 'text-gray-400 hover:text-white hover:bg-[#181a20]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="xl:col-span-2 space-y-8">
            {activeTab === 'overview' && !activePremium && (
              <section className="rounded-2xl border border-[#fcd535]/25 bg-gradient-to-br from-[#181a20] via-[#1a1d24] to-[#0b0e11] p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <p className="text-[#fcd535] text-xs font-bold uppercase tracking-[0.2em] mb-2">Umunsi Premium</p>
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                      {PREMIUM_AMOUNT.toLocaleString()} RWF <span className="text-lg font-semibold text-gray-400">/ ukwezi</span>
                    </h2>
                    <p className="text-gray-400 max-w-md leading-relaxed">
                      Wishyura vuba, fungura Premium ako kanya, kandi usome inkuru zihariye zanditswe n&apos;abanyamakuru bacu.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                      <Shield className="w-3.5 h-3.5" /> Byemewe na KPay
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fcd535]/10 text-[#fcd535] text-xs font-semibold border border-[#fcd535]/20">
                      <Zap className="w-3.5 h-3.5" /> Ako kanya
                    </span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {paymentSteps.map(({ step, title, desc }) => (
                    <div key={step} className="rounded-xl bg-[#0b0e11]/70 border border-[#2b2f36] p-4">
                      <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[#fcd535] text-[#0b0e11] text-sm font-black mb-2">
                        {step}
                      </span>
                      <p className="text-white font-semibold text-sm">{title}</p>
                      <p className="text-gray-500 text-xs mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'overview' && !activePremium && (
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

            {(activeTab === 'overview' || activeTab === 'articles') && (
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
            )}

            {activeTab === 'overview' && payments.length > 0 && (
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

            {activeTab === 'contact' && (
              <section className="rounded-2xl border border-[#2b2f36] overflow-hidden bg-[#181a20]">
                <div className="relative px-6 py-8 border-b border-[#2b2f36] bg-gradient-to-r from-[#fcd535]/15 via-[#181a20] to-emerald-500/10">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmY2Q1MzUiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di-2aDEyek0zNiAyNHYtMkg0djJoMzJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
                  <div className="relative">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Headphones className="w-6 h-6 text-[#fcd535]" />
                      Twandikire — Turi hano kugufasha
                    </h2>
                    <p className="text-gray-400 mt-2 max-w-xl">
                      Ufite ikibazo ku kwishyura, Premium, cyangwa konti yawe? Vugana natwe — tuzagusubiza vuba.
                    </p>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('Muraho Umunsi, nshaka ubufasha bwa Premium')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-2xl border border-[#25d366]/30 bg-gradient-to-br from-[#25d366]/10 to-[#0b0e11] p-5 hover:border-[#25d366]/60 transition-all"
                  >
                    <MessageCircle className="w-8 h-8 text-[#25d366] mb-3" />
                    <p className="text-white font-bold group-hover:text-[#25d366] transition-colors">WhatsApp — Byihuse</p>
                    <p className="text-gray-400 text-sm mt-1">{SUPPORT_PHONE}</p>
                    <p className="text-[#25d366] text-xs mt-3 font-semibold">Kanda hano uvugane natwe →</p>
                  </a>

                  <a
                    href={`tel:${SUPPORT_PHONE_E164}`}
                    className="group rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-[#0b0e11] p-5 hover:border-emerald-500/60 transition-all"
                  >
                    <Phone className="w-8 h-8 text-emerald-400 mb-3" />
                    <p className="text-white font-bold group-hover:text-emerald-400 transition-colors">Hamagara</p>
                    <p className="text-gray-400 text-sm mt-1">{SUPPORT_PHONE_E164}</p>
                    <p className="text-emerald-400 text-xs mt-3 font-semibold">Duhabwa ubufasha mu gihe cy&apos;akazi</p>
                  </a>

                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="group rounded-2xl border border-[#fcd535]/30 bg-gradient-to-br from-[#fcd535]/10 to-[#0b0e11] p-5 hover:border-[#fcd535]/60 transition-all"
                  >
                    <Mail className="w-8 h-8 text-[#fcd535] mb-3" />
                    <p className="text-white font-bold group-hover:text-[#fcd535] transition-colors">Imeyili</p>
                    <p className="text-gray-400 text-sm mt-1">{SUPPORT_EMAIL}</p>
                    <p className="text-[#fcd535] text-xs mt-3 font-semibold">Twohereza ubutumwa bwawe</p>
                  </a>

                  <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-[#0b0e11] p-5">
                    <MapPin className="w-8 h-8 text-blue-400 mb-3" />
                    <p className="text-white font-bold">Aho duherereye</p>
                    <p className="text-gray-400 text-sm mt-1">Kigali, Rwanda</p>
                    <p className="text-blue-400 text-xs mt-3">Umunsi.com — Itangazamakuru ry&apos;u Rwanda</p>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className="rounded-2xl border border-[#2b2f36] bg-[#0b0e11] p-5">
                    <p className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Send className="w-4 h-4 text-[#fcd535]" />
                      Ohereza ubutumwa buto
                    </p>
                    <form onSubmit={handleContactSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Izina ryawe"
                        value={contactForm.name}
                        onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                        required
                        className="w-full px-4 py-3 bg-[#181a20] border border-[#2b2f36] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#fcd535]/50"
                      />
                      <input
                        type="email"
                        placeholder="Imeyili yawe"
                        value={contactForm.email}
                        onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                        required
                        className="w-full px-4 py-3 bg-[#181a20] border border-[#2b2f36] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#fcd535]/50"
                      />
                      <input
                        type="text"
                        placeholder="Insanganyamatsiko (Premium, kwishyura...)"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))}
                        className="w-full md:col-span-2 px-4 py-3 bg-[#181a20] border border-[#2b2f36] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#fcd535]/50"
                      />
                      <textarea
                        placeholder="Andika ubutumwa bwawe hano..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                        required
                        rows={4}
                        className="w-full md:col-span-2 px-4 py-3 bg-[#181a20] border border-[#2b2f36] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#fcd535]/50 resize-none"
                      />
                      <button
                        type="submit"
                        className="md:col-span-2 w-full py-3 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        {contactSent ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Byoherejwe!
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Ohereza Ubutumwa
                          </>
                        )}
                      </button>
                    </form>
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

            {/* Compact contact (sidebar) */}
            <div className="bg-[#181a20] border border-[#2b2f36] rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#1e2329] to-[#181a20] px-5 py-4 border-b border-[#2b2f36]">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-[#fcd535]" />
                  Ubufasha bwihuse
                </h2>
                <p className="text-gray-500 text-sm mt-1">Duhabwa ubufasha mu gihe cy&apos;akazi</p>
              </div>
              <div className="p-4 space-y-2">
                <a
                  href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('Muraho Umunsi, nshaka ubufasha bwa Premium')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0e11] border border-[#25d366]/30 hover:border-[#25d366]/60 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-[#25d366] shrink-0" />
                  <span className="text-white text-sm font-medium">WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#fcd535]/30 text-[#fcd535] text-sm font-semibold hover:bg-[#fcd535]/10 transition-colors"
                >
                  Reba uburyo bwo kutwandikira
                  <ChevronRight className="w-4 h-4" />
                </button>
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
