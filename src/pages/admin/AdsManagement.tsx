import { useEffect, useState } from 'react';
import { Megaphone, Save, Loader2, ExternalLink, CheckCircle2, XCircle, PhoneCall, Mail } from 'lucide-react';
import { apiClient, AdsBannersState, ClassifiedAd, User } from '../../services/api';

type SlotKey = keyof AdsBannersState['slots'];

const defaultAdsSettings: AdsBannersState = {
  slots: {
    leaderboardTop970x120: {
      enabled: false,
      adCode: '',
      imageUrl: '',
      targetUrl: '',
      altText: 'Top Leaderboard Banner',
      size: '970x120',
      label: 'Top Leaderboard Banner'
    },
    business728x250: {
      enabled: false,
      adCode: '',
      imageUrl: '',
      targetUrl: '',
      altText: "Ahantu h'Ubucuruzi Banner",
      size: '728x250',
      label: "Ahantu h'Ubucuruzi Banner"
    },
    homeStory600x100: {
      enabled: false,
      adCode: '',
      imageUrl: '',
      targetUrl: '',
      altText: 'Homepage Story Banner (560x80)',
      size: '560x80',
      label: 'Homepage Story Banner (560x80)'
    },
    sidebar300x250: {
      enabled: false,
      adCode: '',
      imageUrl: '',
      targetUrl: '',
      altText: 'Sidebar 300x250 Banner',
      size: '300x250',
      label: 'Sidebar 300x250 Banner'
    },
    adminSidebar240x320: {
      enabled: false,
      adCode: '',
      imageUrl: '',
      targetUrl: '',
      altText: 'Admin Sidebar Banner',
      size: '320x240',
      label: 'Admin Sidebar Banner'
    },
    square300x300: {
      enabled: false,
      adCode: '',
      imageUrl: '',
      targetUrl: '',
      altText: 'Square 300x300 Banner',
      size: '300x300',
      label: 'Square 300x300 Banner'
    },
    skyscraper300x600: {
      enabled: false,
      adCode: '',
      imageUrl: '',
      targetUrl: '',
      altText: 'Skyscraper 300x600 Banner',
      size: '300x600',
      label: 'Skyscraper 300x600 Banner'
    },
    leaderboardBottom970x120: {
      enabled: false,
      adCode: '',
      imageUrl: '',
      targetUrl: '',
      altText: 'Bottom Leaderboard Banner',
      size: '970x120',
      label: 'Bottom Leaderboard Banner'
    }
  },
  updatedAt: new Date().toISOString()
};

const AdsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [adsSettings, setAdsSettings] = useState<AdsBannersState | null>(null);
  const [savingAds, setSavingAds] = useState(false);
  const [htmlCodeBySlot, setHtmlCodeBySlot] = useState<Partial<Record<SlotKey, string>>>({});
  const [uploadingBySlot, setUploadingBySlot] = useState<Partial<Record<SlotKey, boolean>>>({});
  const [classifiedAds, setClassifiedAds] = useState<ClassifiedAd[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [broadcastSubject, setBroadcastSubject] = useState('Ubutumwa buvuye kuri Umunsi');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<{
    kind: 'success' | 'error';
    message: string;
    emailError?: string | null;
    smsError?: string | null;
    phoneTargets?: Array<{ whatsappUrl: string }>;
  } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const [response, ads, usersResponse] = await Promise.all([
          apiClient.getAdminAdsBanners(),
          apiClient.getAllClassifiedAds(),
          apiClient.getUsers({ limit: 200 }) as any
        ]);
        setAdsSettings(response);
        setClassifiedAds(ads);
        setUsers((usersResponse?.users || usersResponse?.data || []) as User[]);
      } catch (error) {
        console.error('Failed to load ads settings:', error);
        setAdsSettings(defaultAdsSettings);
        alert('Failed to load ads settings from server. Using local fallback view.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSlot = (slotKey: SlotKey, field: string, value: string | boolean) => {
    setAdsSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        slots: {
          ...prev.slots,
          [slotKey]: {
            ...prev.slots[slotKey],
            [field]: value
          }
        }
      };
    });
  };

  const handleHtmlCodeChange = (slotKey: SlotKey, htmlCode: string) => {
    setHtmlCodeBySlot((prev) => ({
      ...prev,
      [slotKey]: htmlCode
    }));

    if (!htmlCode.trim()) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlCode, 'text/html');
      const insAd = doc.querySelector('ins.adsbygoogle');
      const image = doc.querySelector('img, source');
      const link = doc.querySelector('a[href]');

      const src = image?.getAttribute('src') || image?.getAttribute('data-src');
      const href = link?.getAttribute('href');
      const alt = image?.getAttribute('alt');

      if (src) updateSlot(slotKey, 'imageUrl', src);
      if (href) updateSlot(slotKey, 'targetUrl', href);
      if (alt) updateSlot(slotKey, 'altText', alt);

      // Keep the original AdSense slot markup so homepage can render provider snippets.
      if (insAd) {
        updateSlot(slotKey, 'adCode', insAd.outerHTML);
      } else {
        updateSlot(slotKey, 'adCode', htmlCode.trim());
      }
    } catch (error) {
      console.error('Failed to parse ad HTML code:', error);
    }
  };

  const handlePhotoUpload = async (slotKey: SlotKey, file?: File) => {
    if (!file) return;

    setUploadingBySlot((prev) => ({ ...prev, [slotKey]: true }));

    try {
      const formData = new FormData();
      formData.append('files', file);

      const uploaded = await apiClient.uploadMediaFiles(formData);
      const uploadedUrl = uploaded?.[0]?.url;

      if (uploadedUrl) {
        updateSlot(slotKey, 'imageUrl', uploadedUrl);
      } else {
        alert('Photo uploaded but URL was not returned. Please paste photo URL manually.');
      }
    } catch (error: any) {
      console.error('Photo upload failed:', error);
      alert(`Failed to upload photo: ${error?.message || 'Unknown error'}`);
    } finally {
      setUploadingBySlot((prev) => ({ ...prev, [slotKey]: false }));
    }
  };

  const saveAdsSettings = async () => {
    if (!adsSettings) return;
    setSavingAds(true);

    try {
      const updated = await apiClient.updateAdminAdsBanners({ slots: adsSettings.slots });
      setAdsSettings(updated);
      alert('Ads management settings saved successfully');
    } catch (error: any) {
      console.error('Failed to save ads settings:', error);
      alert(`Failed to save ads settings: ${error?.message || 'Unknown error'}`);
    } finally {
      setSavingAds(false);
    }
  };

  const slotOrder: Array<{ key: SlotKey; place: string }> = [
    { key: 'leaderboardTop970x120', place: 'Top Leaderboard' },
    { key: 'business728x250', place: "Ahantu h'Ubucuruzi" },
    { key: 'homeStory600x100', place: 'Homepage under the small story below main headline • exact fit 560x80' },
    { key: 'sidebar300x250', place: 'Sidebar Banner' },
    { key: 'adminSidebar240x320', place: 'Admin Left Sidebar (Lower Area)' },
    { key: 'square300x300', place: 'Sidebar Square' },
    { key: 'skyscraper300x600', place: 'Sidebar Skyscraper' },
    { key: 'leaderboardBottom970x120', place: 'Bottom Leaderboard' }
  ];

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

  const handleAdminAttachmentUpload = async (ad: ClassifiedAd, kind: 'image' | 'document', file?: File) => {
    if (!file) return;

    try {
      const payload = new FormData();
      payload.append('files', file);
      const uploaded = await apiClient.uploadMediaFiles(payload);
      const first = uploaded?.[0];
      if (!first?.url) {
        throw new Error('Upload failed');
      }

      const current = parseAttachmentBundle(ad);
      await apiClient.updateClassifiedAd(ad.id, {
        attachmentName: JSON.stringify({
          imageName: kind === 'image' ? (first.originalName || first.filename) : current.imageName,
          documentName: kind === 'document' ? (first.originalName || first.filename) : current.documentName
        }),
        attachmentUrl: JSON.stringify({
          imageUrl: kind === 'image' ? first.url : current.imageUrl,
          documentUrl: kind === 'document' ? first.url : current.documentUrl
        })
      });

      await refreshClassifieds();
      alert('Dosiye yavuguruwe neza.');
    } catch (error) {
      alert('Ntibyashobotse kohereza dosiye nshya.');
    }
  };

  const refreshClassifieds = async () => {
    try {
      const ads = await apiClient.getAllClassifiedAds();
      setClassifiedAds(ads);
    } catch (error) {
      console.error('Failed to refresh classifieds:', error);
    }
  };

  const moderate = async (adId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const reviewNote = status === 'REJECTED'
        ? window.prompt('Andika impamvu yo kwanga (optional):', '') || ''
        : 'Byemejwe na Admin';
      await apiClient.updateClassifiedStatus(adId, status, reviewNote);
      await refreshClassifieds();
      alert(status === 'APPROVED' ? 'Itangazo ryemejwe.' : 'Itangazo ryanze.');
    } catch (error) {
      alert('Ntibyashobotse kuvugurura status. Ongera ugerageze.');
    }
  };

  const editClassified = async (ad: ClassifiedAd) => {
    const title = window.prompt('Hindura title y\'itangazo:', ad.title);
    if (!title) return;
    const description = window.prompt('Hindura description:', ad.description);
    if (!description) return;
    const phone = window.prompt('Hindura telefone:', ad.phone) || ad.phone;
    const email = window.prompt('Hindura email:', ad.email) || ad.email;

    try {
      await apiClient.updateClassifiedAd(ad.id, { title, description, phone, email });
      await refreshClassifieds();
      alert('Itangazo ryavuguruwe.');
    } catch (error) {
      alert('Ntibyashobotse guhindura itangazo.');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  const sendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      setBroadcastFeedback({ kind: 'error', message: 'Andika ubutumwa mbere yo kohereza.' });
      return;
    }

    setDispatching(true);
    setBroadcastFeedback(null);
    try {
      const targetUserIds = selectedUserIds.length > 0 ? selectedUserIds : users.map((u) => u.id);
      const result = await apiClient.dispatchClassifiedBroadcast({
        message: broadcastMessage,
        subject: broadcastSubject,
        userIds: targetUserIds,
        sendEmail: true,
        sendPhone: true,
        sendSms: true
      });

      setBroadcastFeedback({
        kind: 'success',
        message: `Broadcast yoherejwe. Emails: ${result.emailsSent}/${result.totalTargets}, SMS: ${result.smsSent}/${result.totalTargets}.`,
        emailError: result.emailError,
        smsError: result.smsError,
        phoneTargets: result.phoneTargets
      });

      setBroadcastMessage('');
    } catch (error) {
      setBroadcastFeedback({ kind: 'error', message: 'Ntibyashobotse kohereza broadcast. Reba SMTP/SMS provider cyangwa network.' });
    } finally {
      setDispatching(false);
    }
  };

  const openWhatsAppLinks = () => {
    if (!broadcastFeedback?.phoneTargets?.length) return;
    broadcastFeedback.phoneTargets.slice(0, 10).forEach((target) => window.open(target.whatsappUrl, '_blank'));
  };

  if (loading || !adsSettings) {
    return (
      <div className="min-h-screen bg-[#0b0e11] p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#fcd535] animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading ads settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Ads Management</h1>
        <p className="text-gray-400">Manage every banner position by exact size and placement.</p>
      </div>

      <div className="mb-6 bg-[#181a20] rounded-2xl border border-[#2b2f36] p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Where to add each ad content type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-[#2b2f36] bg-[#0f1115] p-3">
            <p className="text-[#fcd535] font-semibold mb-1">1. HTML Code</p>
            <p className="text-gray-400">Paste ad provider code in the "Ad HTML Code" box. Image URL and click URL are auto-detected when possible.</p>
          </div>
          <div className="rounded-lg border border-[#2b2f36] bg-[#0f1115] p-3">
            <p className="text-[#fcd535] font-semibold mb-1">2. Photo</p>
            <p className="text-gray-400">Use "Upload Photo" to upload banner image directly from your computer.</p>
          </div>
          <div className="rounded-lg border border-[#2b2f36] bg-[#0f1115] p-3">
            <p className="text-[#fcd535] font-semibold mb-1">3. Photo URL</p>
            <p className="text-gray-400">Paste direct image link in "Photo URL" if your image is already online.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#fcd535]" />
            Banner Slots Configuration
          </h3>
          <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
            Updated: {new Date(adsSettings.updatedAt).toLocaleString()}
          </span>
        </div>

        <div className="space-y-5">
          {slotOrder.map((entry) => {
            const slot = adsSettings.slots[entry.key];
            return (
              <div key={entry.key} className="p-4 rounded-xl border border-[#2b2f36] bg-[#0f1115]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-white font-semibold">{slot.label}</h4>
                    <p className="text-xs text-gray-500">Place: {entry.place} • Size: {slot.size}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={slot.enabled}
                      onChange={(e) => updateSlot(entry.key, 'enabled', e.target.checked)}
                      className="h-4 w-4"
                    />
                    Enabled
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Ad HTML Code</label>
                    <textarea
                      value={htmlCodeBySlot[entry.key] || ''}
                      onChange={(e) => handleHtmlCodeChange(entry.key, e.target.value)}
                      placeholder="Paste ad HTML code here (script, ins, iframe, img...)"
                      rows={4}
                      className="w-full bg-[#181a20] border border-[#2b2f36] rounded-lg px-3 py-2 text-white text-sm"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Tip: This helps auto-fill Photo URL and Click Target URL. Save to apply slot settings.</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Upload Photo</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(entry.key, e.target.files?.[0])}
                        className="block w-full text-xs text-gray-300 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[#2b2f36] file:text-gray-200 hover:file:bg-[#363a45]"
                      />
                      {uploadingBySlot[entry.key] && <Loader2 className="w-4 h-4 text-[#fcd535] animate-spin" />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Photo URL</label>
                    <input
                      type="text"
                      value={slot.imageUrl}
                      onChange={(e) => updateSlot(entry.key, 'imageUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#181a20] border border-[#2b2f36] rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Click Target URL</label>
                    <input
                      type="text"
                      value={slot.targetUrl}
                      onChange={(e) => updateSlot(entry.key, 'targetUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#181a20] border border-[#2b2f36] rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Alt Text</label>
                  <input
                    type="text"
                    value={slot.altText}
                    onChange={(e) => updateSlot(entry.key, 'altText', e.target.value)}
                    className="w-full bg-[#181a20] border border-[#2b2f36] rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>

                {slot.imageUrl && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Preview</p>
                    <div className="bg-[#181a20] rounded-lg border border-[#2b2f36] p-2">
                      <img src={slot.imageUrl} alt={slot.altText || slot.label} className="max-h-24 object-contain mx-auto" />
                    </div>
                    {slot.targetUrl && (
                      <a href={slot.targetUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-[#fcd535] hover:underline">
                        Open target <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={saveAdsSettings}
            disabled={savingAds}
            className="px-4 py-2 bg-[#fcd535] text-[#181a20] font-semibold rounded-lg hover:bg-[#f0b90b] disabled:opacity-60 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingAds ? 'Saving...' : 'Save Ads Settings'}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Amatangazo Moderation (Admin Dashboard Notifications)</h3>
          <span className="text-xs text-gray-400">Total: {classifiedAds.length} • Pending: {classifiedAds.filter((ad) => ad.status === 'PENDING').length}</span>
        </div>

        <div className="space-y-3 mb-8">
          {classifiedAds.length === 0 ? (
            <p className="text-sm text-gray-400">Nta matangazo arimo.</p>
          ) : (
            classifiedAds.map((ad) => {
              const attachments = parseAttachmentBundle(ad);
              return (
                <div key={ad.id} className="p-3 rounded-lg border border-[#2b2f36] bg-[#0f1115]">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-white font-semibold">{ad.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{ad.userName} • {ad.phone} • {ad.email}</p>
                      <p className="text-sm text-gray-300 mt-2 whitespace-pre-line">{ad.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        {attachments.imageUrl && (
                          <a href={attachments.imageUrl} target="_blank" rel="noreferrer" className="text-[#fcd535] hover:underline" download>
                            Download image
                          </a>
                        )}
                        {attachments.documentUrl && (
                          <a href={attachments.documentUrl} target="_blank" rel="noreferrer" className="text-[#fcd535] hover:underline" download>
                            Download document
                          </a>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${ad.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : ad.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {ad.status}
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap mt-3">
                    <button onClick={() => moderate(ad.id, 'APPROVED')} className="px-3 py-1 rounded bg-emerald-600 text-white text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Approve</button>
                    <button onClick={() => moderate(ad.id, 'REJECTED')} className="px-3 py-1 rounded bg-rose-600 text-white text-xs flex items-center gap-1"><XCircle className="w-3 h-3" />Reject</button>
                    <button onClick={() => editClassified(ad)} className="px-3 py-1 rounded bg-[#2b2f36] text-white text-xs">Edit</button>
                    <button onClick={() => { window.location.href = '/admin/posts/add'; }} className="px-3 py-1 rounded bg-[#fcd535] text-[#0b0e11] text-xs font-semibold">Andikamo inkuru</button>
                    <label className="px-3 py-1 rounded bg-[#1f2937] text-gray-100 text-xs cursor-pointer">
                      Upload image
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAdminAttachmentUpload(ad, 'image', e.target.files?.[0])} />
                    </label>
                    <label className="px-3 py-1 rounded bg-[#1f2937] text-gray-100 text-xs cursor-pointer">
                      Upload document
                      <input type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,image/*" className="hidden" onChange={(e) => handleAdminAttachmentUpload(ad, 'document', e.target.files?.[0])} />
                    </label>
                    <a href={`tel:${ad.phone}`} className="px-3 py-1 rounded bg-[#1f2937] text-gray-100 text-xs inline-flex items-center gap-1"><PhoneCall className="w-3 h-3" />Call</a>
                    <a href={`mailto:${ad.email}`} className="px-3 py-1 rounded bg-[#1f2937] text-gray-100 text-xs inline-flex items-center gap-1"><Mail className="w-3 h-3" />Email</a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-[#2b2f36] pt-5">
          <h4 className="text-white font-semibold mb-3">Andikira Users Bose (Email + Telefone)</h4>
          <p className="text-xs text-gray-500 mb-3">Hitamo users ushaka. Niba ntawuhisemo, boherezwa bose.</p>

          <div className="max-h-40 overflow-auto border border-[#2b2f36] rounded-lg p-2 mb-3 bg-[#0f1115]">
            {users.map((u) => (
              <label key={u.id} className="flex items-center justify-between gap-2 text-sm text-gray-300 py-1 px-1 hover:bg-[#181a20] rounded">
                <span>{u.firstName} {u.lastName} - {u.email} {u.phone ? ` / ${u.phone}` : ''}</span>
                <input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={() => toggleUserSelection(u.id)} />
              </label>
            ))}
          </div>

          <input
            type="text"
            value={broadcastSubject}
            onChange={(e) => setBroadcastSubject(e.target.value)}
            placeholder="Subject ya email"
            className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded-lg px-3 py-2 text-white text-sm mb-2"
          />
          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            rows={4}
            placeholder="Andika ubutumwa bwoherezwa ku email no kuri telefone (WhatsApp links)..."
            className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            onClick={sendBroadcast}
            disabled={dispatching}
            className="mt-3 px-4 py-2 rounded-lg bg-[#fcd535] text-[#181a20] font-semibold disabled:opacity-60"
          >
            {dispatching ? 'Kohereza...' : 'Kohereza ku Email + Telefone'}
          </button>

          {broadcastFeedback && (
            <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${broadcastFeedback.kind === 'success' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/40 bg-rose-500/10 text-rose-300'}`}>
              <p>{broadcastFeedback.message}</p>
              {broadcastFeedback.emailError && <p className="mt-1 text-xs text-amber-300">Email issue: {broadcastFeedback.emailError}</p>}
              {broadcastFeedback.smsError && <p className="mt-1 text-xs text-amber-300">SMS issue: {broadcastFeedback.smsError}</p>}
              {broadcastFeedback.kind === 'success' && (broadcastFeedback.phoneTargets?.length || 0) > 0 && (
                <button type="button" onClick={openWhatsAppLinks} className="mt-2 text-xs px-2 py-1 rounded bg-[#25d366]/20 text-[#25d366] border border-[#25d366]/40">
                  Fungura WhatsApp links (10)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdsManagement;
