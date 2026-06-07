import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, HeartHandshake, Lock, Mail, PhoneCall, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, PremiumDashboardPost, ClassifiedAd, resolveAssetUrl } from '../services/api';

interface PremiumRequestArticle {
  id: string;
  title: string;
  slug?: string;
  url: string;
  requestedAt: string;
  featuredImage?: string;
}

const SUPPORT_WHATSAPP = '250791859465';
const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=300&h=180&fit=crop';
const SUPPORT_CALL = '0791859465';
const CLASSIFIED_CATEGORY_LABELS = {
  cyamunara: 'Amatangazo',
  akazi: 'Akazi',
  guhinduza: 'Guhinduza amakuru',
  ibindi: 'Andi matangazo'
} as const;

const buildWhatsAppLink = (name: string, email: string) => {
  const message = `Muraho Umunsi, nitwa ${name}, email yanjye ni ${email}. Nashatse Premium access, namaze kwishyura. Mungenzurire konti yanjye.`;
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
};

const SubscriberAccount = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(Boolean(user?.isPremium));
  const [premiumUntil, setPremiumUntil] = useState<string | null>(user?.premiumUntil || null);
  const [premiumStories, setPremiumStories] = useState<PremiumDashboardPost[]>([]);
  const [myClassifiedAds, setMyClassifiedAds] = useState<ClassifiedAd[]>([]);
  const [requestedPremiumArticles, setRequestedPremiumArticles] = useState<PremiumRequestArticle[]>([]);
  const [classifiedForm, setClassifiedForm] = useState({
    title: '',
    imageName: '',
    imageUrl: '',
    documentName: '',
    documentUrl: ''
  });
  const [submittingClassified, setSubmittingClassified] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  if (!user) return null;

  if (user.role !== 'USER') {
    return <Navigate to="/admin" replace />;
  }

  const premiumUntilLabel = useMemo(() => {
    if (!premiumUntil) return null;
    const date = new Date(premiumUntil);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('rw-RW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [premiumUntil]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedRequests = JSON.parse(localStorage.getItem('umunsi_premium_request_articles') || '[]') as PremiumRequestArticle[];
      setRequestedPremiumArticles(storedRequests);
    } catch (error) {
      setRequestedPremiumArticles([]);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        setProfileError(null);
        const profile = await apiClient.getPaymentsProfile();
        if (!active) return;
        setIsPremium(Boolean(profile?.data?.user?.isPremium));
        setPremiumUntil(profile?.data?.user?.premiumUntil || null);
      } catch (error) {
        if (!active) return;
        setProfileError('Ntibyashobotse kubona premium status yawe. Ongera ugerageze.');
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    };

    const loadPremiumStories = async () => {
      try {
        setLoadingStories(true);
        const response = await apiClient.getPremiumDashboardPosts();
        if (!active) return;
        setPremiumStories(response?.data || []);
      } finally {
        if (active) {
          setLoadingStories(false);
        }
      }
    };

    const loadMyClassifiedAds = async () => {
      try {
        const data = await apiClient.getMyClassifiedAds();
        if (!active) return;
        setMyClassifiedAds(data);
      } catch (error) {
        if (!active) return;
        setMyClassifiedAds([]);
      }
    };

    loadProfile();
    loadPremiumStories();
    loadMyClassifiedAds();

    return () => {
      active = false;
    };
  }, []);

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
  const whatsappLink = buildWhatsAppLink(fullName, user.email);
  const shouldShowOnboardingPayment = searchParams.get('onboardPayment') === '1';
  const pendingClassifiedAds = myClassifiedAds.filter((ad) => ad.status === 'PENDING');
  const approvedClassifiedAds = myClassifiedAds.filter((ad) => ad.status === 'APPROVED');
  const premiumStoryBySlug = useMemo(() => {
    return new Map(premiumStories.map((story) => [story.slug, story]));
  }, [premiumStories]);

  const getThumbnailUrl = (featuredImage?: string | null) => resolveAssetUrl(featuredImage) || DEFAULT_THUMBNAIL;

  const getRequestedArticleThumbnail = (story: PremiumRequestArticle) => {
    const slugFromUrl = story.slug || story.url.split('/post/')[1]?.split(/[?#]/)[0];
    const matchedStory = (slugFromUrl ? premiumStoryBySlug.get(slugFromUrl) : undefined)
      || premiumStories.find((item) => item.id === story.id || item.title === story.title);

    return getThumbnailUrl(story.featuredImage || matchedStory?.featuredImage);
  };

  const parseSubmissionAttachments = (ad: ClassifiedAd) => {
    const bundle = {
      imageName: '',
      imageUrl: '',
      documentName: '',
      documentUrl: ''
    };

    if (ad.attachmentName) {
      try {
        const parsedNames = JSON.parse(ad.attachmentName);
        if (parsedNames && typeof parsedNames === 'object') {
          bundle.imageName = parsedNames.imageName || '';
          bundle.documentName = parsedNames.documentName || '';
        }
      } catch {
        bundle.documentName = ad.attachmentName;
      }
    }

    if (ad.attachmentUrl) {
      try {
        const parsedUrls = JSON.parse(ad.attachmentUrl);
        if (parsedUrls && typeof parsedUrls === 'object') {
          bundle.imageUrl = parsedUrls.imageUrl || '';
          bundle.documentUrl = parsedUrls.documentUrl || '';
        }
      } catch {
        bundle.documentUrl = ad.attachmentUrl;
      }
    }

    return bundle;
  };

  const handleSubscriberFileUpload = async (file: File | undefined, kind: 'image' | 'document') => {
    if (!file) return;

    kind === 'image' ? setUploadingImage(true) : setUploadingDocument(true);
    try {
      const payload = new FormData();
      payload.append('files', file);
      const uploaded = await apiClient.uploadMediaFiles(payload);
      const first = uploaded?.[0];
      if (!first?.url) {
        throw new Error('Upload failed');
      }

      setClassifiedForm((prev) => ({
        ...prev,
        ...(kind === 'image'
          ? {
              imageName: first.originalName || first.filename,
              imageUrl: first.url
            }
          : {
              documentName: first.originalName || first.filename,
              documentUrl: first.url
            })
      }));
    } catch (error) {
      alert(kind === 'image' ? 'Ifoto ntiyoherejwe neza.' : 'Document ntiyoherejwe neza.');
    } finally {
      kind === 'image' ? setUploadingImage(false) : setUploadingDocument(false);
    }
  };

  const handleSubscriberSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classifiedForm.title.trim()) {
      alert('Shyiramo umutwe mbere yo kohereza.');
      return;
    }

    try {
      setSubmittingClassified(true);
      const subscriberPhone = typeof (user as any).phone === 'string' && (user as any).phone.trim().length >= 6
        ? (user as any).phone.trim()
        : '000000';

      await apiClient.submitClassifiedAd({
        category: 'cyamunara',
        title: classifiedForm.title.trim(),
        description: 'Kwamamaza cyoherejwe na subscriber. Gitegereje admin ngo agitunganye; ntikijya kuri public ako kanya.',
        phone: subscriberPhone,
        email: user.email,
        attachmentName: JSON.stringify({
          imageName: classifiedForm.imageName || '',
          documentName: classifiedForm.documentName || ''
        }),
        attachmentUrl: JSON.stringify({
          imageUrl: classifiedForm.imageUrl || '',
          documentUrl: classifiedForm.documentUrl || ''
        }),
        durationDays: 30,
        priceRwf: 0
      });

      const refreshed = await apiClient.getMyClassifiedAds();
      setMyClassifiedAds(refreshed);
      setClassifiedForm({ title: '', imageName: '', imageUrl: '', documentName: '', documentUrl: '' });
      alert('Byoherejwe neza. Admin ni we uzabibona gusa kandi ntibijya kuri public ako kanya.');
    } catch (error) {
      alert('Ntibyashobotse kohereza. Ongera ugerageze.');
    } finally {
      setSubmittingClassified(false);
    }
  };

  const refreshProfile = async () => {
    const profile = await apiClient.getPaymentsProfile();
    setIsPremium(Boolean(profile?.data?.user?.isPremium));
    setPremiumUntil(profile?.data?.user?.premiumUntil || null);
  };

  const handleRefreshPremiumStatus = async () => {
    try {
      setLoadingProfile(true);
      setProfileError(null);
      await refreshProfile();
    } catch (error) {
      setProfileError('Ntibyashobotse kubona premium status yawe. Ongera ugerageze.');
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="subscriber-account-page min-h-screen bg-[#0b0e11] py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="bg-[#181a20] border border-[#2b2f36] rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-2">Konti y'Abafatabuguzi</h1>
          <p className="text-gray-400">
            Murakaza neza, {user.firstName}. Ubu ufite konti y'abafatabuguzi, kandi uzajya woherezwa imeyili y'inkuru nshya zasohotse.
          </p>

          <div className="subscriber-dark-card mt-4 flex items-center gap-3 text-sm text-gray-300 bg-[#0f1115] border border-[#2b2f36] rounded-xl px-4 py-3">
            <Mail className="w-4 h-4 text-[#fcd535]" />
            <span>Imeyili yawe: {user.email}</span>
          </div>
        </div>

        <div className="bg-[#181a20] border border-[#2b2f36] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <HeartHandshake className="w-5 h-5 text-[#fcd535]" />
            <h2 className="text-xl font-bold text-white">Premium Access</h2>
          </div>
          <p className="text-gray-300 mb-4">
            {shouldShowOnboardingPayment
              ? 'Dushyigikire wishyure 500 RWF / Ku kwezi ubone inkuru za Premium ndetse ubashe no kuvugana natwe byoroshye.'
              : 'Wishyura 500 RWF ku kwezi kandi admin akagufungurira premium nyuma yo kwemeza ubwishyu.'}
          </p>

          <div className="subscriber-dark-card bg-[#0f1115] border border-[#2b2f36] rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-[#fcd535] font-bold text-lg">
              <Crown className="w-5 h-5" />
              Premium Membership
            </div>
            <p className="text-[#fcd535] text-sm mt-2 font-semibold">Gusoma inkuru ziri Premium ni ukwishyura 500 RWF ku Kwezi.</p>

            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-300">
                Status yawe: {isPremium ? 'Premium irakora' : 'Konti isanzwe'}
              </p>
              {premiumUntilLabel && (
                <p className="text-xs text-gray-400">Premium irangira: {premiumUntilLabel}</p>
              )}
              {loadingProfile && <p className="text-xs text-gray-500">Turimo kugenzura premium status...</p>}
              {profileError && <p className="text-xs text-rose-400">{profileError}</p>}
              <button
                type="button"
                onClick={handleRefreshPremiumStatus}
                className="text-xs text-[#fcd535] hover:underline"
              >
                Reba premium status
              </button>
            </div>
          </div>

          <h3 className="text-white font-semibold mb-3">Saba Premium</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="subscriber-dark-card bg-[#0f1115] border border-[#2b2f36] rounded-xl p-4 hover:border-[#25d366]/60 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4 text-[#25d366]" />
                <p className="text-white font-medium">WhatsApp</p>
              </div>
              <p className="text-gray-400 text-sm">Andikira support kuri 0791859465</p>
            </a>
            <a
              href={`tel:${SUPPORT_CALL.replace(/\s+/g, '')}`}
              className="subscriber-dark-card bg-[#0f1115] border border-[#2b2f36] rounded-xl p-4 hover:border-[#fcd535]/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <PhoneCall className="w-4 h-4 text-[#fcd535]" />
                <p className="text-white font-medium">Hamagara Support</p>
              </div>
              <p className="text-gray-400 text-sm">{SUPPORT_CALL}</p>
            </a>
          </div>

          <div className="subscriber-dark-card mt-4 rounded-xl border border-[#2b2f36] bg-[#0f1115] p-4">
            <h4 className="text-white font-semibold mb-2">Uko bigenzura</h4>
            <p className="text-gray-400 text-sm">1. Kora ubwishyu uko mubyumvikanye na support.</p>
            <p className="text-gray-400 text-sm">2. Ohereza proof kuri WhatsApp cyangwa telefone.</p>
            <p className="text-gray-400 text-sm">3. Admin agufungurira Premium access nyuma yo kubyemeza.</p>
            <p className="text-gray-400 text-sm">4. Iyo Premium ikuweho cyangwa igihe kirangiye, inkuru zose za Premium zihita zifungwa kugeza wongereye kwishyura tukongera kugufungurira.</p>
          </div>

          <div className="subscriber-dark-card mt-6 rounded-xl border border-[#2b2f36] bg-[#0f1115] p-4">
            <h4 className="text-white font-semibold mb-3">Inkuru za Premium wabitse</h4>
            {requestedPremiumArticles.length === 0 ? (
              <p className="text-sm text-gray-400">Nta nkuru urasaba. Kanda Bookmark ku nkuru ya Premium kugira ngo igaragare hano.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {requestedPremiumArticles.slice(0, 10).map((story) => (
                  <a key={story.id} href={story.url} className="subscriber-dark-card border border-[#2b2f36] rounded-lg p-3 bg-[#12161c] hover:border-[#fcd535]/40 transition-colors">
                    <div className="flex gap-3 items-start">
                      <img
                        src={getRequestedArticleThumbnail(story)}
                        alt={story.title}
                        className="w-20 h-14 rounded-lg object-cover flex-shrink-0 bg-[#0b0e11]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Lock className="w-4 h-4 text-[#fcd535] flex-shrink-0" />
                          <p className="font-medium text-white line-clamp-2">{story.title}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Iyi nkuru iri muri Premium. Uzayisoma nyuma yo kwemererwa cyangwa kwishyura.</p>
                        <span className="text-xs text-[#fcd535] mt-2 inline-block">Fungura iyi nkuru</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="subscriber-dark-card mt-6 rounded-xl border border-[#2b2f36] bg-[#0f1115] p-4">
            <h4 className="text-white font-semibold mb-3">Inkuru za Premium</h4>
            {loadingStories ? (
              <p className="text-sm text-gray-400">Turimo kuzana premium stories...</p>
            ) : premiumStories.length === 0 ? (
              <p className="text-sm text-gray-400">Nta premium stories zirashyirwaho.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {premiumStories.slice(0, 8).map((story) => (
                  story.hasAccess ? (
                    <Link key={story.id} to={`/post/${story.slug}`} className="border border-[#2b2f36] rounded-lg p-3 hover:border-[#fcd535]/40 transition-colors bg-[#12161c]">
                      <div className="flex gap-3 items-start">
                        <img
                          src={getThumbnailUrl(story.featuredImage)}
                          alt={story.title}
                          className="w-20 h-14 rounded-lg object-cover flex-shrink-0 bg-[#0b0e11]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium line-clamp-2">{story.title}</p>
                          <p className="text-xs text-gray-500 mt-1">Kanda usome inkuru</p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div key={story.id} className="subscriber-dark-card border border-[#2b2f36] rounded-lg p-3 bg-[#12161c]">
                      <div className="flex gap-3 items-start">
                        <img
                          src={getThumbnailUrl(story.featuredImage)}
                          alt={story.title}
                          className="w-20 h-14 rounded-lg object-cover flex-shrink-0 bg-[#0b0e11] opacity-80"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Lock className="w-4 h-4 text-[#fcd535] flex-shrink-0" />
                            <p className="font-medium line-clamp-2 text-white">{story.title}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Iyi nkuru ifunguye nyuma yo kwemererwa na admin.</p>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          <div className="subscriber-dark-card mt-6 rounded-xl border border-[#fcd535]/30 bg-[#0f1115] p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#fcd535]">Ohereza itangazo cyangwa icyamamaza</p>
            <h4 className="text-white font-black text-xl mt-1">Ohereza umutwe, ifoto na document gusa</h4>
            <p className="text-sm text-gray-300 mt-2">
              Ibyo wohereje bijya kuri admin gusa nk'ibitegereje gusuzumwa. Ntibijya kuri public kugeza admin abimaze kugenzura, kubitunganya no kubyemeza.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-300">Pending: {pendingClassifiedAds.length}</div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-300">Reviewed: {approvedClassifiedAds.length}</div>
            </div>

            <form onSubmit={handleSubscriberSubmission} className="mt-4 grid grid-cols-1 gap-3">
              <input
                className="bg-[#0b0e11] border border-[#2b2f36] rounded-lg px-3 py-2 text-white"
                placeholder="Umutwe"
                value={classifiedForm.title}
                onChange={(e) => setClassifiedForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />

              <label className="bg-[#0b0e11] border border-[#2b2f36] rounded-lg px-3 py-2 text-white text-sm flex items-center justify-between gap-3">
                <span>{uploadingImage ? 'Turimo kohereza ifoto...' : classifiedForm.imageName || 'Ohereza ifoto'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleSubscriberFileUpload(e.target.files?.[0], 'image')} className="text-xs" />
              </label>

              <label className="bg-[#0b0e11] border border-[#2b2f36] rounded-lg px-3 py-2 text-white text-sm flex items-center justify-between gap-3">
                <span>{uploadingDocument ? 'Turimo kohereza document...' : classifiedForm.documentName || 'Ohereza document'}</span>
                <input type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,image/*" onChange={(e) => handleSubscriberFileUpload(e.target.files?.[0], 'document')} className="text-xs" />
              </label>

              <button type="submit" disabled={submittingClassified} className="px-4 py-2 rounded-lg bg-[#fcd535] text-[#0b0e11] font-semibold hover:bg-[#f0b90b] disabled:opacity-60">
                {submittingClassified ? 'Kohereza...' : 'Ohereza kuri Admin'}
              </button>
            </form>
          </div>

          <div className="subscriber-dark-card mt-6 rounded-xl border border-[#2b2f36] bg-[#0f1115] p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-white font-semibold">Ibyo wohereje</h4>
            </div>
            {myClassifiedAds.length === 0 ? (
              <p className="text-sm text-gray-400">Nta byo wohereje birimo. Uzuza umutwe hanyuma wohereze ifoto cyangwa document.</p>
            ) : (
              <div className="space-y-2">
                {myClassifiedAds.slice(0, 8).map((ad) => {
                  const attachments = parseSubmissionAttachments(ad);
                  return (
                    <div key={ad.id} className="border border-[#2b2f36] rounded-lg p-3 bg-[#12161c] flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-white font-medium">{ad.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{CLASSIFIED_CATEGORY_LABELS[ad.category]} • {new Date(ad.createdAt).toLocaleDateString('rw-RW')}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs">
                          {attachments.imageUrl && (
                            <a href={attachments.imageUrl} target="_blank" rel="noreferrer" className="text-[#fcd535] hover:underline">Reba ifoto</a>
                          )}
                          {attachments.documentUrl && (
                            <a href={attachments.documentUrl} target="_blank" rel="noreferrer" className="text-[#fcd535] hover:underline" download>Download document</a>
                          )}
                        </div>
                      </div>
                      <span className={`text-[11px] px-2 py-1 rounded ${ad.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : ad.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {ad.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-3 flex-wrap">
            <Link to="/" className="px-4 py-2 rounded-lg bg-[#2b2f36] text-white hover:bg-[#363a45]">
              Ahabanza
            </Link>
            <Link to="/newsletter" className="px-4 py-2 rounded-lg bg-[#fcd535] text-[#0b0e11] font-semibold hover:bg-[#f0b90b]">
              Inkuru zose
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriberAccount;
