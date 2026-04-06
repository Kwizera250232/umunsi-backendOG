import { useState } from 'react';
import { 
  Save, 
  Settings as SettingsIcon,
  Globe,
  Shield,
  Mail,
  Database,
  Palette,
  Bell,
  Users,
  FileText,
  Sparkles,
  Check,
  ChevronRight
} from 'lucide-react';

interface SettingsData {
  site: {
    name: string;
    description: string;
    language: string;
    timezone: string;
    maintenance: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    fromName: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
  };
  appearance: {
    theme: string;
    primaryColor: string;
    logoUrl: string;
    faviconUrl: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    newsletterEnabled: boolean;
  };
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState('site');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    site: {
      name: 'Umunsi News',
      description: 'Amakuru ya buri munsi',
      language: 'rw',
      timezone: 'Africa/Kigali',
      maintenance: false
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUser: 'admin@umunsi.com',
      smtpPass: '********',
      fromEmail: 'noreply@umunsi.com',
      fromName: 'Umunsi News'
    },
    security: {
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      requireEmailVerification: true,
      enableTwoFactor: false
    },
    appearance: {
      theme: 'dark',
      primaryColor: '#fcd535',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      newsletterEnabled: true
    }
  });

  const tabs = [
    { id: 'site', name: 'Site Settings', icon: Globe },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

  const handleSave = async () => {
    setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSettings = (category: keyof SettingsData, key: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your platform settings</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] disabled:opacity-50 transition-all flex items-center space-x-2"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-[#0b0e11]/20 border-t-[#0b0e11] rounded-full animate-spin"></div><span>Saving...</span></>
            ) : saved ? (
              <><Check className="w-4 h-4" /><span>Saved!</span></>
            ) : (
              <><Save className="w-4 h-4" /><span>Save Changes</span></>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#fcd535]/10 text-[#fcd535]'
                      : 'text-gray-400 hover:bg-[#1e2329] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </div>
                  {activeTab === tab.id && <ChevronRight className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-[#181a20] rounded-xl border border-[#2b2f36]">
            {/* Site Settings */}
          {activeTab === 'site' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-[#2b2f36]">
                  <div className="p-2 bg-[#fcd535]/10 rounded-lg">
                    <Globe className="w-5 h-5 text-[#fcd535]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Site Settings</h2>
                    <p className="text-sm text-gray-500">Configure your site details</p>
                  </div>
                </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
                  <input
                    type="text"
                    value={settings.site.name}
                    onChange={(e) => updateSettings('site', 'name', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                  <select
                    value={settings.site.language}
                    onChange={(e) => updateSettings('site', 'language', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  >
                    <option value="rw">Kinyarwanda</option>
                    <option value="en">English</option>
                      <option value="fr">French</option>
                  </select>
                </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={settings.site.description}
                      onChange={(e) => updateSettings('site', 'description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50 resize-none"
                    />
                  </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                  <select
                    value={settings.site.timezone}
                    onChange={(e) => updateSettings('site', 'timezone', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  >
                      <option value="Africa/Kigali">Africa/Kigali (CAT)</option>
                    <option value="UTC">UTC</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#1e2329] rounded-xl">
                    <div>
                      <p className="text-white font-medium">Maintenance Mode</p>
                      <p className="text-sm text-gray-500">Disable site for visitors</p>
                    </div>
                    <button
                      onClick={() => updateSettings('site', 'maintenance', !settings.site.maintenance)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.site.maintenance ? 'bg-[#fcd535]' : 'bg-[#2b2f36]'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.site.maintenance ? 'translate-x-7' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-[#2b2f36]">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Email Settings</h2>
                    <p className="text-sm text-gray-500">Configure SMTP and email preferences</p>
              </div>
            </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.email.smtpHost}
                    onChange={(e) => updateSettings('email', 'smtpHost', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Port</label>
                  <input
                    type="text"
                    value={settings.email.smtpPort}
                    onChange={(e) => updateSettings('email', 'smtpPort', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">SMTP User</label>
                  <input
                    type="text"
                    value={settings.email.smtpUser}
                    onChange={(e) => updateSettings('email', 'smtpUser', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Password</label>
                  <input
                    type="password"
                    value={settings.email.smtpPass}
                    onChange={(e) => updateSettings('email', 'smtpPass', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">From Email</label>
                  <input
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">From Name</label>
                  <input
                    type="text"
                    value={settings.email.fromName}
                    onChange={(e) => updateSettings('email', 'fromName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
              </div>
            </div>
          )}

            {/* Security Settings */}
          {activeTab === 'security' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-[#2b2f36]">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Security Settings</h2>
                    <p className="text-sm text-gray-500">Configure security options</p>
                  </div>
                </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (hours)</label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Max Login Attempts</label>
                  <input
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
              </div>

                  <div className="flex items-center justify-between p-4 bg-[#1e2329] rounded-xl">
                    <div>
                      <p className="text-white font-medium">Require Email Verification</p>
                      <p className="text-sm text-gray-500">Users must verify email to login</p>
                    </div>
                    <button
                      onClick={() => updateSettings('security', 'requireEmailVerification', !settings.security.requireEmailVerification)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.security.requireEmailVerification ? 'bg-emerald-500' : 'bg-[#2b2f36]'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.security.requireEmailVerification ? 'translate-x-7' : 'translate-x-1'
                      }`}></div>
                    </button>
                </div>

                  <div className="flex items-center justify-between p-4 bg-[#1e2329] rounded-xl">
                    <div>
                      <p className="text-white font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Enable 2FA for extra security</p>
                    </div>
                    <button
                      onClick={() => updateSettings('security', 'enableTwoFactor', !settings.security.enableTwoFactor)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.security.enableTwoFactor ? 'bg-emerald-500' : 'bg-[#2b2f36]'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.security.enableTwoFactor ? 'translate-x-7' : 'translate-x-1'
                      }`}></div>
                    </button>
                </div>
              </div>
            </div>
          )}

            {/* Appearance Settings */}
          {activeTab === 'appearance' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-[#2b2f36]">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Palette className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Appearance</h2>
                    <p className="text-sm text-gray-500">Customize the look and feel</p>
                  </div>
                </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                  <select
                    value={settings.appearance.theme}
                    onChange={(e) => updateSettings('appearance', 'theme', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  >
                      <option value="dark">Dark</option>
                    <option value="light">Light</option>
                      <option value="system">System</option>
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                    <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={settings.appearance.primaryColor}
                    onChange={(e) => updateSettings('appearance', 'primaryColor', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.appearance.primaryColor}
                        onChange={(e) => updateSettings('appearance', 'primaryColor', e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
                  </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Logo URL</label>
                  <input
                    type="text"
                    value={settings.appearance.logoUrl}
                    onChange={(e) => updateSettings('appearance', 'logoUrl', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Favicon URL</label>
                  <input
                    type="text"
                    value={settings.appearance.faviconUrl}
                    onChange={(e) => updateSettings('appearance', 'faviconUrl', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>
              </div>
            </div>
          )}

            {/* Notifications Settings */}
          {activeTab === 'notifications' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-[#2b2f36]">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Bell className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Notifications</h2>
                    <p className="text-sm text-gray-500">Manage notification preferences</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#1e2329] rounded-xl">
                    <div>
                      <p className="text-white font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <button
                      onClick={() => updateSettings('notifications', 'emailNotifications', !settings.notifications.emailNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.notifications.emailNotifications ? 'bg-emerald-500' : 'bg-[#2b2f36]'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.notifications.emailNotifications ? 'translate-x-7' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#1e2329] rounded-xl">
                    <div>
                      <p className="text-white font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-500">Receive browser push notifications</p>
                    </div>
                    <button
                      onClick={() => updateSettings('notifications', 'pushNotifications', !settings.notifications.pushNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.notifications.pushNotifications ? 'bg-emerald-500' : 'bg-[#2b2f36]'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.notifications.pushNotifications ? 'translate-x-7' : 'translate-x-1'
                      }`}></div>
                    </button>
                </div>

                  <div className="flex items-center justify-between p-4 bg-[#1e2329] rounded-xl">
                    <div>
                      <p className="text-white font-medium">Newsletter</p>
                      <p className="text-sm text-gray-500">Enable newsletter subscription</p>
                    </div>
                    <button
                      onClick={() => updateSettings('notifications', 'newsletterEnabled', !settings.notifications.newsletterEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.notifications.newsletterEnabled ? 'bg-emerald-500' : 'bg-[#2b2f36]'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.notifications.newsletterEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
