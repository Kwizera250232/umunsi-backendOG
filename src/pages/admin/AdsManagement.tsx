import { useState } from 'react';
import { Megaphone, Monitor, Smartphone, Save } from 'lucide-react';

interface AdsManagementState {
  enabled: boolean;
  desktopEnabled: boolean;
  mobileEnabled: boolean;
  adClient: string;
  desktopSlot: string;
  mobileSlot: string;
  injectAfterBlock: number;
}

const AdsManagement = () => {
  const [adsSettings, setAdsSettings] = useState<AdsManagementState>(() => {
    const defaults: AdsManagementState = {
      enabled: true,
      desktopEnabled: true,
      mobileEnabled: true,
      adClient: 'ca-pub-3584259871242471',
      desktopSlot: '2693936589',
      mobileSlot: '2693936589',
      injectAfterBlock: 3
    };

    if (typeof window === 'undefined') {
      return defaults;
    }

    try {
      const stored = localStorage.getItem('umunsi_ads_settings');
      if (!stored) return defaults;
      return { ...defaults, ...JSON.parse(stored) };
    } catch {
      return defaults;
    }
  });

  const [savingAds, setSavingAds] = useState(false);

  const saveAdsSettings = () => {
    try {
      setSavingAds(true);
      localStorage.setItem('umunsi_ads_settings', JSON.stringify(adsSettings));
      alert('Ads management settings saved successfully');
    } finally {
      setSavingAds(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Ads Management</h1>
        <p className="text-gray-400">Control ad visibility and appearance across desktop and mobile.</p>
      </div>

      <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#fcd535]" />
            Ad Configuration
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${adsSettings.enabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-gray-500/20 text-gray-300 border-gray-500/40'}`}>
            {adsSettings.enabled ? 'ACTIVE' : 'PAUSED'}
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={adsSettings.enabled}
                onChange={(e) => setAdsSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4"
              />
              Enable ads globally
            </label>

            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={adsSettings.desktopEnabled}
                onChange={(e) => setAdsSettings((prev) => ({ ...prev, desktopEnabled: e.target.checked }))}
                className="h-4 w-4"
              />
              Enable Desktop ads
            </label>

            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={adsSettings.mobileEnabled}
                onChange={(e) => setAdsSettings((prev) => ({ ...prev, mobileEnabled: e.target.checked }))}
                className="h-4 w-4"
              />
              Enable Mobile ads
            </label>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Ad Client ID</label>
              <input
                type="text"
                value={adsSettings.adClient}
                onChange={(e) => setAdsSettings((prev) => ({ ...prev, adClient: e.target.value }))}
                className="w-full bg-[#0f1115] border border-[#2b2f36] rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Desktop Slot</label>
                <input
                  type="text"
                  value={adsSettings.desktopSlot}
                  onChange={(e) => setAdsSettings((prev) => ({ ...prev, desktopSlot: e.target.value }))}
                  className="w-full bg-[#0f1115] border border-[#2b2f36] rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Mobile Slot</label>
                <input
                  type="text"
                  value={adsSettings.mobileSlot}
                  onChange={(e) => setAdsSettings((prev) => ({ ...prev, mobileSlot: e.target.value }))}
                  className="w-full bg-[#0f1115] border border-[#2b2f36] rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Insert ad after content block</label>
              <input
                type="number"
                min={1}
                max={10}
                value={adsSettings.injectAfterBlock}
                onChange={(e) => setAdsSettings((prev) => ({ ...prev, injectAfterBlock: Number(e.target.value || 1) }))}
                className="w-full bg-[#0f1115] border border-[#2b2f36] rounded-lg px-3 py-2 text-white"
              />
            </div>

            <button
              onClick={saveAdsSettings}
              disabled={savingAds}
              className="px-4 py-2 bg-[#fcd535] text-[#181a20] font-semibold rounded-lg hover:bg-[#f0b90b] disabled:opacity-60 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingAds ? 'Saving...' : 'Save Ads Settings'}
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-400">Preview how ads will appear in desktop and mobile layouts.</p>

            <div className="p-4 rounded-xl border border-[#2b2f36] bg-[#0f1115]">
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
                <Monitor className="w-4 h-4 text-cyan-400" />
                Desktop Preview
              </div>
              <div className="rounded-lg bg-[#181a20] border border-[#2b2f36] p-4">
                <div className="h-2.5 w-3/4 bg-[#2b2f36] rounded mb-2"></div>
                <div className="h-2.5 w-full bg-[#2b2f36] rounded mb-2"></div>
                <div className="h-2.5 w-5/6 bg-[#2b2f36] rounded mb-4"></div>
                <div className={`rounded-lg border px-4 py-6 text-center ${adsSettings.enabled && adsSettings.desktopEnabled ? 'border-[#fcd535]/40 bg-[#fcd535]/10 text-[#fcd535]' : 'border-[#2b2f36] bg-[#11151c] text-gray-500'}`}>
                  {adsSettings.enabled && adsSettings.desktopEnabled
                    ? `Desktop Ad Slot: ${adsSettings.desktopSlot}`
                    : 'Desktop ads disabled'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#2b2f36] bg-[#0f1115]">
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Mobile Preview
              </div>
              <div className="mx-auto w-[220px] rounded-2xl bg-[#181a20] border border-[#2b2f36] p-3">
                <div className="h-2 w-2/3 bg-[#2b2f36] rounded mb-1.5"></div>
                <div className="h-2 w-full bg-[#2b2f36] rounded mb-1.5"></div>
                <div className="h-2 w-4/5 bg-[#2b2f36] rounded mb-3"></div>
                <div className={`rounded-md border px-3 py-4 text-center text-xs ${adsSettings.enabled && adsSettings.mobileEnabled ? 'border-[#10b981]/40 bg-[#10b981]/10 text-emerald-300' : 'border-[#2b2f36] bg-[#11151c] text-gray-500'}`}>
                  {adsSettings.enabled && adsSettings.mobileEnabled
                    ? `Mobile Ad Slot: ${adsSettings.mobileSlot}`
                    : 'Mobile ads disabled'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsManagement;
