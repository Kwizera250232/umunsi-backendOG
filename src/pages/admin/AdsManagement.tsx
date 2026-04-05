import { useEffect, useState } from 'react';
import { Megaphone, Save, Loader2, ExternalLink } from 'lucide-react';
import { apiClient, AdsBannersState } from '../../services/api';

type SlotKey = keyof AdsBannersState['slots'];

const defaultAdsSettings: AdsBannersState = {
  slots: {
    leaderboardTop970x120: {
      enabled: false,
      imageUrl: '',
      targetUrl: '',
      altText: 'Top Leaderboard Banner',
      size: '970x120',
      label: 'Top Leaderboard Banner'
    },
    business728x250: {
      enabled: false,
      imageUrl: '',
      targetUrl: '',
      altText: "Ahantu h'Ubucuruzi Banner",
      size: '728x250',
      label: "Ahantu h'Ubucuruzi Banner"
    },
    sidebar300x250: {
      enabled: false,
      imageUrl: '',
      targetUrl: '',
      altText: 'Sidebar 300x250 Banner',
      size: '300x250',
      label: 'Sidebar 300x250 Banner'
    },
    square300x300: {
      enabled: false,
      imageUrl: '',
      targetUrl: '',
      altText: 'Square 300x300 Banner',
      size: '300x300',
      label: 'Square 300x300 Banner'
    },
    skyscraper300x600: {
      enabled: false,
      imageUrl: '',
      targetUrl: '',
      altText: 'Skyscraper 300x600 Banner',
      size: '300x600',
      label: 'Skyscraper 300x600 Banner'
    },
    leaderboardBottom970x120: {
      enabled: false,
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getAdminAdsBanners();
        setAdsSettings(response);
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

  const saveAdsSettings = () => {
    if (!adsSettings) return;
    setSavingAds(true);

    apiClient
      .updateAdminAdsBanners({ slots: adsSettings.slots })
      .then(() => {
        alert('Ads management settings saved successfully');
      })
      .catch((error) => {
        console.error('Failed to save ads settings:', error);
        alert('Failed to save ads settings');
      })
      .finally(() => {
        setSavingAds(false);
      });
  };

  const slotOrder: Array<{ key: SlotKey; place: string }> = [
    { key: 'leaderboardTop970x120', place: 'Top Leaderboard' },
    { key: 'business728x250', place: "Ahantu h'Ubucuruzi" },
    { key: 'sidebar300x250', place: 'Sidebar Banner' },
    { key: 'square300x300', place: 'Sidebar Square' },
    { key: 'skyscraper300x600', place: 'Sidebar Skyscraper' },
    { key: 'leaderboardBottom970x120', place: 'Bottom Leaderboard' }
  ];

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
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Banner Image URL</label>
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
    </div>
  );
};

export default AdsManagement;
