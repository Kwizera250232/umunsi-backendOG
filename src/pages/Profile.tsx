import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  ArrowLeft,
  Shield,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const getServerBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace('/api', '');
};

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProfile();
      if (response.success && response.user) {
        setProfile(response.user);
        setFormData({
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || '',
          bio: response.user.bio || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    try {
      setUploadingAvatar(true);
      setMessage(null);
      
      const response = await apiClient.uploadAvatar(file);
      
      if (response.success) {
        setProfile((prev: any) => ({ ...prev, avatar: response.avatar }));
        setMessage({ type: 'success', text: 'Profile picture updated!' });
        if (refreshUser) refreshUser();
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to upload image' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await apiClient.updateProfile(formData);
      
      if (response.success) {
        setProfile((prev: any) => ({ ...prev, ...formData }));
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        if (refreshUser) refreshUser();
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    try {
      setChangingPassword(true);
      setMessage(null);
      
      const response = await apiClient.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setChangingPassword(false);
    }
  };

  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${getServerBaseUrl()}${avatar}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#fcd535] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-[#fcd535] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account information</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Picture</h2>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <div 
                  onClick={handleAvatarClick}
                  className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#fcd535] to-[#f0b90b] flex items-center justify-center cursor-pointer overflow-hidden group"
                >
                  {profile?.avatar ? (
                    <img 
                      src={getAvatarUrl(profile.avatar)} 
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#0b0e11] text-3xl font-bold">
                      {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              
              <div>
                <p className="text-white font-medium">{profile?.firstName} {profile?.lastName}</p>
                <p className="text-gray-500 text-sm">{profile?.email}</p>
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="mt-2 text-sm text-[#fcd535] hover:underline disabled:opacity-50"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Change photo'}
                </button>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <form onSubmit={handleSubmit} className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full pl-12 pr-4 py-3 bg-[#1e2329] border border-[#2b2f36] rounded-xl text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50 resize-none"
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    {profile?.role}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile?.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#fcd535]" />
              Change Password
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-5 py-2.5 bg-[#2b2f36] text-white font-medium rounded-xl hover:bg-[#363a45] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {changingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Change Password
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

