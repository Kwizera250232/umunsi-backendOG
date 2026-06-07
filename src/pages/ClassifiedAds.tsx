import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MediaLibraryModal from '../components/MediaLibraryModal';
import {
  ClassifiedCategory,
  ClassifiedAd,
  ClassifiedBroadcast,
  MediaFile,
  apiClient
} from '../services/api';

const CLASSIFIED_PRICING = [
  { durationDays: 1, label: 'Umunsi umwe', priceRwf: 1500 },
  { durationDays: 30, label: 'Iminsi 30', priceRwf: 5000 },
  { durationDays: 180, label: 'Amezi 6', priceRwf: 50000 }
] as const;

const buildStructuredDescription = ({
  description,
  listingType,
  location,
  qualification
}: {
  description: string;
  listingType?: string;
  location?: string;
  qualification?: string;
}) => [
  listingType ? `Ubwoko bw'itangazo / akazi: ${listingType}` : null,
  location ? `Aho bikorwa cyangwa biherereye: ${location}` : null,
  qualification ? `Ibisabwa / qualification: ${qualification}` : null,
  `Ibisobanuro: ${description}`
].filter(Boolean).join('\n');

const CLASSIFIED_CATEGORY_LABELS: Record<ClassifiedCategory, string> = {
  cyamunara: 'Amatangazo',
  akazi: 'Akazi',
  guhinduza: 'Guhinduza amakuru',
  ibindi: 'Andi matangazo'
};

const categories: ClassifiedCategory[] = ['cyamunara', 'akazi'];

const isLikelyImage = (value?: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(value || '');

const parseAttachmentBundle = (ad: ClassifiedAd) => {
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
      if (isLikelyImage(ad.attachmentName)) {
        bundle.imageName = ad.attachmentName;
      } else {
        bundle.documentName = ad.attachmentName;
      }
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
      if (isLikelyImage(ad.attachmentUrl)) {
        bundle.imageUrl = ad.attachmentUrl;
      } else {
        bundle.documentUrl = ad.attachmentUrl;
      }
    }
  }

  return bundle;
};

const ClassifiedAds = () => {
  const { category } = useParams<{ category?: string }>();
  const { user, isAuthenticated } = useAuth();
  const selectedCategory = categories.includes(category as ClassifiedCategory)
    ? (category as ClassifiedCategory)
    : undefined;

  const [form, setForm] = useState({
    category: selectedCategory || 'cyamunara',
    title: '',
    listingType: '',
    location: '',
    qualification: '',
    description: '',
    phone: '',
    email: user?.email || '',
    durationDays: 1,
    attachmentUrl: '',
    attachmentName: ''
  });
  const [broadcastText, setBroadcastText] = useState('');
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<ClassifiedAd[]>([]);
  const [myAds, setMyAds] = useState<ClassifiedAd[]>([]);
  const [allAds, setAllAds] = useState<ClassifiedAd[]>([]);
  const [broadcasts, setBroadcasts] = useState<ClassifiedBroadcast[]>([]);

  const selectedPricing = CLASSIFIED_PRICING.find((p) => p.durationDays === Number(form.durationDays)) || CLASSIFIED_PRICING[0];

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      category: selectedCategory || prev.category,
      email: user?.email || prev.email
    }));
  }, [selectedCategory, user?.email]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [approvedAds, allBroadcasts] = await Promise.all([
        apiClient.getClassifiedAds({ category: selectedCategory }),
        apiClient.getClassifiedBroadcasts()
      ]);
      setAds(approvedAds);
      setBroadcasts(allBroadcasts);

      if (isAuthenticated && user) {
        const mine = await apiClient.getMyClassifiedAds();
        setMyAds(mine);
      } else {
        setMyAds([]);
      }

      if (isAuthenticated && user && (user.role === 'ADMIN' || user.role === 'EDITOR')) {
        const all = await apiClient.getAllClassifiedAds();
        setAllAds(all);
      } else {
        setAllAds([]);
      }
    } catch (error) {
      console.error('Failed to load classifieds:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, isAuthenticated, user?.id, user?.role]);

  const submitAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'USER') {
      alert('Kwamamaza rikorwa n\'abafatabuguzi gusa. Injira muri konti ya Subscriber mbere yo kohereza itangazo.');
      return;
    }

    try {
      await apiClient.submitClassifiedAd({
        category: form.category as ClassifiedCategory,
        title: form.title,
        description: buildStructuredDescription({
          description: form.description,
          listingType: form.listingType,
          location: form.location,
          qualification: form.qualification
        }),
        phone: form.phone,
        email: form.email,
        attachmentName: form.attachmentName || undefined,
        attachmentUrl: form.attachmentUrl || undefined,
        durationDays: Number(form.durationDays),
        priceRwf: selectedPricing.priceRwf
      });

      setForm((prev) => ({
        ...prev,
        title: '',
        listingType: '',
        location: '',
        qualification: '',
        description: '',
        attachmentName: '',
        attachmentUrl: '',
        durationDays: 1
      }));
      await loadData();
      alert('Itangazo ryawe ryoherejwe. Rigaragara muri konti yawe nka Pending, ariko ntirijya kuri public kugeza rimejwe.');
    } catch (error) {
      alert('Ntibyashobotse kohereza itangazo. Ongera ugerageze nyuma gato.');
    }
  };

  const onPickFromLibrary = (media: MediaFile) => {
    setForm((prev) => ({
      ...prev,
      attachmentName: media.originalName || media.filename,
      attachmentUrl: media.url
    }));
  };

  const onUploadFromDevice = async (file?: File) => {
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const uploaded = await apiClient.uploadMediaFiles(formData);
      if (uploaded?.[0]?.url) {
        setForm((prev) => ({
          ...prev,
          attachmentName: uploaded[0].originalName || uploaded[0].filename,
          attachmentUrl: uploaded[0].url
        }));
      }
    } catch (error) {
      alert('Ntibyashobotse kohereza dosiye ivuye muri device. Gerageza PDF, Word, ifoto cyangwa indi document yemerewe.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const editAd = async (ad: ClassifiedAd) => {
    const title = window.prompt('Hindura umutwe w\'itangazo:', ad.title);
    if (!title) return;
    const description = window.prompt('Hindura ibisobanuro:', ad.description);
    if (!description) return;
    const phone = window.prompt('Hindura telefone:', ad.phone) || ad.phone;

    try {
      await apiClient.updateClassifiedAd(ad.id, {
        title,
        description,
        phone
      });
      await loadData();
      alert('Itangazo ryavuguruwe.');
    } catch (error) {
      alert('Ntibyashobotse guhindura itangazo.');
    }
  };

  const moderate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const note = status === 'REJECTED' ? window.prompt('Impamvu yo kwanga (optional):', '') || '' : 'Byemejwe.';
    try {
      await apiClient.updateClassifiedStatus(id, status, note);
      await loadData();
    } catch (error) {
      alert('Ntibyashobotse kuvugurura status. Ongera ugerageze.');
    }
  };

  const sendBroadcast = async () => {
    if (!user) return;
    try {
      const created = await apiClient.createClassifiedBroadcast(broadcastText);
      if (created) {
        setBroadcastText('');
        await loadData();
        alert('Ubutumwa bwoherejwe ku bakoresha bose.');
      }
    } catch (error) {
      alert('Ntibyashobotse kohereza ubutumwa. Ongera ugerageze.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] py-6">
      <div className="px-3 space-y-5">
        {loading && (
          <div className="bg-[#181a20] border border-[#2b2f36] rounded-xl p-4 text-sm text-gray-400">Turimo kuzana amatangazo...</div>
        )}

        <div className="bg-[#181a20] border border-[#2b2f36] rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">Amatangazo</h1>
            {!isAuthenticated ? (
              <div className="flex gap-2">
                <Link to="/subscriber-login" className="px-4 py-2 rounded-lg bg-[#2b2f36] text-white">Injira</Link>
                <Link to="/register" className="px-4 py-2 rounded-lg bg-[#fcd535] text-[#0b0e11] font-semibold">Kora konte</Link>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            {categories.map((cat) => (
              <Link key={cat} to={`/amatangazo/${cat}`} className={`rounded-lg px-3 py-2 border text-center ${selectedCategory === cat ? 'bg-[#fcd535] text-[#0b0e11] border-[#fcd535]' : 'bg-[#0b0e11] text-white border-[#2b2f36]'}`}>
                {CLASSIFIED_CATEGORY_LABELS[cat]}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-[#181a20] border border-[#2b2f36] rounded-xl p-4">
          <h2 className="text-white font-semibold mb-2">Amatangazo na Akazi</h2>
          <p className="text-gray-400 text-sm">
            Ibi bigaragara kuri public ari uko bimaze kugenzurwa no gutunganywa na admin. Ibyoherejwe n'abasomyi cyangwa aba-subscribers ntibijya hanze ako kanya.
          </p>
        </div>

        {isAuthenticated && user.role === 'USER' ? (
          <div className="bg-[#181a20] border border-[#2b2f36] rounded-xl p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#fcd535]">Subscriber Dashboard</p>
            <h2 className="text-white font-black text-xl mt-1">Kwamamaza bikorwa muri konti ya Subscriber gusa</h2>
            <p className="text-sm text-gray-300 mt-2">
              Ukohereza umutwe n'amafoto cyangwa documents muri subscriber dashboard. Bihita bijya kuri admin gusa kandi ntibijya kuri public mbere yo gutunganywa no kwemezwa.
            </p>
            <Link to="/subscriber/account" className="inline-flex mt-4 px-4 py-2 rounded-lg bg-[#fcd535] text-[#0b0e11] font-semibold hover:bg-[#f0b90b]">
              Fungura Subscriber Dashboard
            </Link>
          </div>
        ) : null}

        <div className="bg-[#181a20] border border-[#2b2f36] rounded-xl p-4">
          <h2 className="text-white font-semibold mb-3">Amatangazo Yemejwe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ads.length === 0 ? <p className="text-gray-400 text-sm">Nta matangazo yemejwe arimo ubu.</p> : ads.map((ad) => {
              const attachments = parseAttachmentBundle(ad);
              return (
                <div key={ad.id} className="bg-[#0b0e11] border border-[#2b2f36] rounded-lg p-3">
                  <p className="text-white font-semibold">{ad.title}</p>
                  <p className="text-sm text-gray-300 mt-1 whitespace-pre-line">{ad.description}</p>
                  <p className="text-xs text-gray-500 mt-2">{CLASSIFIED_CATEGORY_LABELS[ad.category]} • {ad.phone}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {attachments.imageUrl && (
                      <a href={attachments.imageUrl} target="_blank" rel="noreferrer" className="text-[#fcd535] hover:underline">
                        Reba ifoto
                      </a>
                    )}
                    {attachments.documentUrl && (
                      <a href={attachments.documentUrl} target="_blank" rel="noreferrer" className="text-[#fcd535] hover:underline" download>
                        Download document
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isAuthenticated && user && user.role === 'USER' ? (
          <div className="bg-[#181a20] border border-[#2b2f36] rounded-xl p-4">
            <h2 className="text-white font-semibold mb-3">Amatangazo Yanjye</h2>
            <div className="space-y-2">
              {myAds.length === 0 ? <p className="text-gray-400 text-sm">Nta matangazo wohereje.</p> : myAds.map((ad) => {
                const attachments = parseAttachmentBundle(ad);
                return (
                  <div key={ad.id} className="bg-[#0b0e11] border border-[#2b2f36] rounded-lg p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white">{ad.title}</p>
                      <p className="text-xs text-gray-500">{CLASSIFIED_CATEGORY_LABELS[ad.category]} • {new Date(ad.createdAt).toLocaleDateString('rw-RW')}</p>
                      {ad.reviewNote && <p className="text-xs text-gray-400 mt-1">Note: {ad.reviewNote}</p>}
                      <div className="mt-1 flex flex-wrap gap-3 text-xs">
                        {attachments.imageUrl && (
                          <a href={attachments.imageUrl} target="_blank" rel="noreferrer" className="text-[#fcd535] hover:underline">Reba ifoto</a>
                        )}
                        {attachments.documentUrl && (
                          <a href={attachments.documentUrl} target="_blank" rel="noreferrer" className="text-[#fcd535] hover:underline" download>Download document</a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${ad.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : ad.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>{ad.status}</span>
                      <button type="button" onClick={() => editAd(ad)} className="text-xs px-2 py-1 rounded bg-[#2b2f36] text-white hover:bg-[#3a3f48]">Edit</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {isAuthenticated && user && (user.role === 'ADMIN' || user.role === 'EDITOR') ? (
          <div className="bg-[#181a20] border border-[#2b2f36] rounded-xl p-4 space-y-4">
            <h2 className="text-white font-semibold">Admin Review</h2>
            <div className="space-y-2">
              {allAds.length === 0 ? <p className="text-gray-400 text-sm">Nta matangazo ariho.</p> : allAds.map((ad) => {
                const attachments = parseAttachmentBundle(ad);
                return (
                  <div key={ad.id} className="bg-[#0b0e11] border border-[#2b2f36] rounded-lg p-3">
                    <p className="text-white font-semibold">{ad.title}</p>
                    <p className="text-xs text-gray-500 mb-2">{ad.userName} • {ad.phone} • {CLASSIFIED_CATEGORY_LABELS[ad.category]}</p>
                    <p className="text-sm text-gray-300 mb-2 whitespace-pre-line">{ad.description}</p>
                    <div className="flex flex-wrap gap-3 mb-2 text-xs">
                      {attachments.imageUrl && (
                        <a href={attachments.imageUrl} target="_blank" rel="noreferrer" className="text-[#fcd535] hover:underline">Reba ifoto</a>
                      )}
                      {attachments.documentUrl && (
                        <a href={attachments.documentUrl} target="_blank" rel="noreferrer" className="text-[#fcd535] hover:underline" download>Download document</a>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => moderate(ad.id, 'APPROVED')} className="px-3 py-1 rounded bg-emerald-600 text-white text-xs">Approve</button>
                      <button onClick={() => moderate(ad.id, 'REJECTED')} className="px-3 py-1 rounded bg-rose-600 text-white text-xs">Reject</button>
                      <button onClick={() => editAd(ad)} className="px-3 py-1 rounded bg-[#2b2f36] text-white text-xs">Edit</button>
                      <a href={`tel:${ad.phone}`} className="px-3 py-1 rounded bg-[#1f2937] text-gray-100 text-xs">Hamagara</a>
                      <a href={`mailto:${ad.email}`} className="px-3 py-1 rounded bg-[#1f2937] text-gray-100 text-xs">Email</a>
                      <a href={`https://wa.me/${ad.phone.replace(/\s+/g, '').replace(/^0/, '250')}`} target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-[#25d366]/20 text-[#25d366] text-xs">WhatsApp</a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#2b2f36] pt-4">
              <h3 className="text-white font-semibold mb-2">Andikira Users bose icyarimwe</h3>
              <textarea
                className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded-lg px-3 py-2 text-white"
                rows={3}
                placeholder="Andika ubutumwa bwoherezwa ku bakoresha bose..."
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
              />
              <button onClick={sendBroadcast} className="mt-2 px-4 py-2 rounded bg-[#fcd535] text-[#0b0e11] font-semibold">Ohereza Ubutumwa</button>
            </div>
          </div>
        ) : null}

        {broadcasts.length > 0 && (
          <div className="bg-[#181a20] border border-[#2b2f36] rounded-xl p-4">
            <h2 className="text-white font-semibold mb-2">Ubutumwa Rusange</h2>
            <div className="space-y-2">
              {broadcasts.slice(0, 5).map((b) => (
                <div key={b.id} className="bg-[#0b0e11] border border-[#2b2f36] rounded-lg p-3">
                  <p className="text-sm text-gray-300">{b.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(b.createdAt).toLocaleString('rw-RW')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={onPickFromLibrary}
        title="Hitamo media cyangwa document"
        mode="select"
        type="all"
      />
    </div>
  );
};

export default ClassifiedAds;
