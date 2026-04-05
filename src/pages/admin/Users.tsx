import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Shield,
  Mail,
  Phone, 
  Calendar,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Crown,
  UserCheck,
  Download,
  RefreshCw,
  Grid3X3,
  List,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string;
  createdAt: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  permissions: string[];
  articleCount: number;
  commentCount: number;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    role: 'USER' as 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers();
      if (response?.users) {
        const transformedUsers = response.users.map((user: unknown) => {
          const u = user as Record<string, unknown>;
          return {
            ...u,
            articleCount: ((u._count as Record<string, number>)?.news) || 0,
            commentCount: ((u._count as Record<string, number>)?.posts) || 0,
            permissions: getPermissionsForRole(u.role as string)
          };
        });
        setUsers(transformedUsers as User[]);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case 'ADMIN': return ['all'];
      case 'EDITOR': return ['create', 'edit', 'publish', 'moderate'];
      case 'AUTHOR': return ['create', 'edit'];
      case 'USER': return ['read', 'comment'];
      default: return ['read'];
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiClient.deleteUser(id);
      setUsers(users.filter(user => user.id !== id));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.updateUser(id, { isActive: !currentStatus });
      setUsers(users.map(user => user.id === id ? { ...user, isActive: !currentStatus } : user));
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleToggleVerification = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.updateUser(id, { isVerified: !currentStatus });
      setUsers(users.map(user => user.id === id ? { ...user, isVerified: !currentStatus } : user));
    } catch (error) {
      console.error('Error toggling verification:', error);
      alert('Failed to update verification status');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    try {
    switch (action) {
      case 'activate':
          await Promise.all(selectedUsers.map(id => apiClient.updateUser(id, { isActive: true })));
          setUsers(users.map(user => selectedUsers.includes(user.id) ? { ...user, isActive: true } : user));
        break;
      case 'deactivate':
          await Promise.all(selectedUsers.map(id => apiClient.updateUser(id, { isActive: false })));
          setUsers(users.map(user => selectedUsers.includes(user.id) ? { ...user, isActive: false } : user));
        break;
      case 'delete':
          if (window.confirm(`Delete ${selectedUsers.length} users?`)) {
            await Promise.all(selectedUsers.map(id => apiClient.deleteUser(id)));
          setUsers(users.filter(user => !selectedUsers.includes(user.id)));
        }
        break;
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Failed to perform action');
    }
    setSelectedUsers([]);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const response = await apiClient.createUser({
        email: formData.email,
        password: formData.password,
        username: formData.username || formData.email.split('@')[0],
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role
      });
      
      if (response.success) {
        await fetchUsers();
        setShowAddModal(false);
        resetForm();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      setFormError(error.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setSubmitting(true);
    setFormError('');

    try {
      const response = await apiClient.updateUser(editingUser.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        isActive: editingUser.isActive
      });
      
      if (response.success || response.user) {
        await fetchUsers();
        setShowEditModal(false);
        setEditingUser(null);
        resetForm();
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      setFormError(error.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      username: '',
      firstName: '',
      lastName: '',
      role: 'USER'
    });
    setFormError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      'ADMIN': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'EDITOR': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'AUTHOR': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'USER': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return styles[role] || styles.USER;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-3.5 h-3.5" />;
      case 'EDITOR': return <Edit className="w-3.5 h-3.5" />;
      case 'AUTHOR': return <BookOpen className="w-3.5 h-3.5" />;
      default: return <UsersIcon className="w-3.5 h-3.5" />;
    }
  };

  const getStatusBadge = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (!isVerified) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  const getStatusText = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'Inactive';
    if (!isVerified) return 'Unverified';
    return 'Active';
  };

  const getStatusIcon = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return <Ban className="w-3.5 h-3.5" />;
    if (!isVerified) return <Clock className="w-3.5 h-3.5" />;
    return <CheckCircle className="w-3.5 h-3.5" />;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive) ||
                         (statusFilter === 'unverified' && !user.isVerified);
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#fcd535]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#fcd535] animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#fcd535] animate-pulse" />
          </div>
          <p className="text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 mt-1">Manage user accounts and permissions</p>
            </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="px-5 py-2.5 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] transition-all flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
              </button>
            <button className="px-4 py-2.5 bg-[#2b2f36] text-gray-400 rounded-xl hover:bg-[#363a45] hover:text-white transition-all flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
              </button>
            </div>
          </div>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
            <div className="flex items-center justify-between">
              <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <UsersIcon className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
          
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
            <div className="flex items-center justify-between">
          <div>
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-2xl font-bold text-white">{users.filter(u => u.isActive).length}</p>
              </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <UserCheck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
          
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
            <div className="flex items-center justify-between">
              <div>
              <p className="text-sm text-gray-400">Verified</p>
              <p className="text-2xl font-bold text-white">{users.filter(u => u.isVerified).length}</p>
              </div>
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Shield className="w-6 h-6 text-purple-400" />
              </div>
        </div>
      </div>

        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
            <div className="flex items-center justify-between">
              <div>
              <p className="text-sm text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Crown className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </div>
        </div>

      {/* Filters */}
      <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-[#fcd535]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50"
            />
              </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="EDITOR">Editor</option>
            <option value="AUTHOR">Author</option>
            <option value="USER">User</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
                <option value="unverified">Unverified</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
              >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
                <option value="name">Name A-Z</option>
          </select>

            <div className="flex bg-[#2b2f36] rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#fcd535] text-[#0b0e11]' : 'text-gray-400 hover:text-white'}`}
                >
                <List className="w-4 h-4" />
                </button>
          <button
                  onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#fcd535] text-[#0b0e11]' : 'text-gray-400 hover:text-white'}`}
                >
                <Grid3X3 className="w-4 h-4" />
          </button>
              </div>

            <button
              onClick={fetchUsers}
              className="p-2.5 bg-[#2b2f36] text-gray-400 rounded-xl hover:bg-[#363a45] hover:text-white transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
        <div className="bg-[#fcd535]/10 border border-[#fcd535]/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
            <span className="text-[#fcd535] font-medium">{selectedUsers.length} user(s) selected</span>
            <div className="flex gap-2">
              <button onClick={() => handleBulkAction('activate')} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 text-sm">Activate</button>
              <button onClick={() => handleBulkAction('deactivate')} className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 text-sm">Deactivate</button>
              <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm">Delete</button>
              <button onClick={() => setSelectedUsers([])} className="px-3 py-1.5 text-gray-400 hover:text-white text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

      {/* Users List/Grid */}
      <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2b2f36] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{filteredUsers.length} Users</h2>
          <span className="text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
      </div>

          {viewMode === 'list' ? (
          <div className="divide-y divide-[#2b2f36]">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 hover:bg-[#1e2329] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                        if (e.target.checked) setSelectedUsers([...selectedUsers, user.id]);
                        else setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }}
                      className="mt-3 w-4 h-4 rounded bg-[#2b2f36] border-[#2b2f36] text-[#fcd535]"
                      />
                      
                    <div className="w-12 h-12 bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-[#0b0e11] font-bold">{user.firstName[0]}{user.lastName[0]}</span>
                      </div>

                    <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                        <h3 className="text-white font-medium">{user.firstName} {user.lastName}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md border flex items-center space-x-1 ${getRoleBadge(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span>{user.role}</span>
                          </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md border flex items-center space-x-1 ${getStatusBadge(user.isActive, user.isVerified)}`}>
                            {getStatusIcon(user.isActive, user.isVerified)}
                            <span>{getStatusText(user.isActive, user.isVerified)}</span>
                          </span>
                        </div>
                        
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                          <Mail className="w-3.5 h-3.5" />
                            <span>{user.email}</span>
                          </span>
                          {user.phone && (
                            <span className="flex items-center space-x-1">
                            <Phone className="w-3.5 h-3.5" />
                              <span>{user.phone}</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Joined {formatDate(user.createdAt)}</span>
                          </span>
                        </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span>Articles: {user.articleCount}</span>
                          <span>Comments: {user.commentCount}</span>
                      </div>
                      </div>
                    </div>

                  <div className="flex items-center space-x-1">
                    <button className="p-2 text-gray-500 hover:text-[#fcd535] hover:bg-[#2b2f36] rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    <button 
                      onClick={() => openEditModal(user)}
                      className="p-2 text-gray-500 hover:text-blue-400 hover:bg-[#2b2f36] rounded-lg transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                      className={`p-2 hover:bg-[#2b2f36] rounded-lg transition-colors ${user.isActive ? 'text-emerald-400' : 'text-amber-400'}`}
                      >
                        {user.isActive ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleToggleVerification(user.id, user.isVerified)}
                      className={`p-2 hover:bg-[#2b2f36] rounded-lg transition-colors ${user.isVerified ? 'text-amber-400' : 'text-blue-400'}`}
                      >
                        {user.isVerified ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-[#2b2f36] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-[#1e2329] rounded-xl border border-[#2b2f36] overflow-hidden hover:border-[#fcd535]/30 transition-all group">
                <div className="p-4 border-b border-[#2b2f36]">
                  <div className="flex items-center justify-between mb-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                        if (e.target.checked) setSelectedUsers([...selectedUsers, user.id]);
                        else setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }}
                      className="w-4 h-4 rounded bg-[#2b2f36] border-[#2b2f36] text-[#fcd535]"
                        />
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md border flex items-center space-x-1 ${getRoleBadge(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span>{user.role}</span>
                        </span>
                    </div>
                    
                    <div className="text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-[#0b0e11] font-bold text-lg">{user.firstName[0]}{user.lastName[0]}</span>
                    </div>
                    <h3 className="text-white font-semibold group-hover:text-[#fcd535] transition-colors">{user.firstName} {user.lastName}</h3>
                    <p className="text-gray-500 text-sm">@{user.username}</p>
                  </div>
                    </div>
                    
                <div className="p-4 space-y-3">
                  <p className="text-gray-400 text-sm text-center">{user.email}</p>
                  
                  <div className="flex items-center justify-center">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md border flex items-center space-x-1 ${getStatusBadge(user.isActive, user.isVerified)}`}>
                      {getStatusIcon(user.isActive, user.isVerified)}
                      <span>{getStatusText(user.isActive, user.isVerified)}</span>
                      </span>
                    </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="bg-[#2b2f36] px-2 py-1 rounded">Articles: {user.articleCount}</span>
                    <span className="bg-[#2b2f36] px-2 py-1 rounded">Comments: {user.commentCount}</span>
                  </div>

                  <p className="text-xs text-gray-600 text-center">Joined {formatDate(user.createdAt)}</p>
                </div>

                <div className="px-4 py-3 bg-[#181a20] border-t border-[#2b2f36] flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button className="p-1.5 text-gray-500 hover:text-[#fcd535] hover:bg-[#2b2f36] rounded-lg"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => openEditModal(user)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-[#2b2f36] rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#2b2f36] rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                  <button className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2b2f36] rounded-lg">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
      <div className="mt-6 bg-[#181a20] rounded-xl border border-[#2b2f36] p-4">
          <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Showing 1 to {filteredUsers.length} of {filteredUsers.length} results</p>
            <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 bg-[#2b2f36] text-gray-400 rounded-lg hover:bg-[#363a45] hover:text-white transition-colors">Previous</button>
            <button className="px-3 py-1.5 bg-[#fcd535] text-[#0b0e11] font-medium rounded-lg">1</button>
            <button className="px-3 py-1.5 bg-[#2b2f36] text-gray-400 rounded-lg hover:bg-[#363a45] hover:text-white transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2b2f36] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                >
                  <option value="USER">User</option>
                  <option value="AUTHOR">Author</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-[#0b0e11]/30 border-t-[#0b0e11] rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Add User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2b2f36] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Edit User</h3>
              <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2.5 bg-[#1e2329] border border-[#2b2f36] rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                >
                  <option value="USER">User</option>
                  <option value="AUTHOR">Author</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#2b2f36] rounded-xl">
                <span className="text-gray-400 text-sm">Active Status</span>
                <button
                  type="button"
                  onClick={() => setEditingUser({ ...editingUser, isActive: !editingUser.isActive })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${editingUser.isActive ? 'bg-emerald-500' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${editingUser.isActive ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-[#0b0e11]/30 border-t-[#0b0e11] rounded-full animate-spin" />
                  ) : (
                    <Edit className="w-4 h-4" />
                  )}
                  <span>Update User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
