import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Crown, 
  Edit, 
  BookOpen, 
  Users,
  Check,
  X,
  Info,
  Search,
  ChevronRight,
  Sparkles,
  Eye,
  FileText,
  MessageSquare,
  Settings,
  Trash2,
  UserPlus,
  Lock,
  Plus,
  AlertCircle,
  Mail
} from 'lucide-react';
import { apiClient } from '../../services/api';

interface Role {
  id: string;
  name: string;
  key: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
  description: string;
  color: string;
  icon: React.ReactNode;
  permissions: Permission[];
  userCount: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
}

const Roles = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('ADMIN');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [showAddUserToRoleModal, setShowAddUserToRoleModal] = useState(false);
  const [showCustomRoleInfoModal, setShowCustomRoleInfoModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<User | null>(null);
  const [roleToAssign, setRoleToAssign] = useState<string>('');

  // Define roles with their permissions
  const roles: Role[] = [
    {
      id: '1',
      name: 'Administrator',
      key: 'ADMIN',
      description: 'Full system access with all permissions. Can manage users, content, settings, and system configuration.',
      color: 'amber',
      icon: <Crown className="w-5 h-5" />,
      permissions: [
        { id: '1', name: 'Manage Users', description: 'Create, edit, delete users', category: 'Users' },
        { id: '2', name: 'Manage Roles', description: 'Assign and change user roles', category: 'Users' },
        { id: '3', name: 'View Analytics', description: 'Access all analytics and reports', category: 'Analytics' },
        { id: '4', name: 'Manage Settings', description: 'Configure system settings', category: 'System' },
        { id: '5', name: 'Manage Categories', description: 'Create, edit, delete categories', category: 'Content' },
        { id: '6', name: 'Manage All Posts', description: 'Full control over all posts', category: 'Content' },
        { id: '7', name: 'Manage Media', description: 'Upload, delete media files', category: 'Media' },
        { id: '8', name: 'View Logs', description: 'Access system logs', category: 'System' },
        { id: '9', name: 'Moderate Comments', description: 'Approve, delete comments', category: 'Content' },
      ],
      userCount: 0
    },
    {
      id: '2',
      name: 'Editor',
      key: 'EDITOR',
      description: 'Can create, edit, and publish content. Has access to media library and can moderate comments.',
      color: 'blue',
      icon: <Edit className="w-5 h-5" />,
      permissions: [
        { id: '5', name: 'Manage Categories', description: 'Create, edit, delete categories', category: 'Content' },
        { id: '6', name: 'Manage All Posts', description: 'Edit and publish all posts', category: 'Content' },
        { id: '7', name: 'Manage Media', description: 'Upload, delete media files', category: 'Media' },
        { id: '9', name: 'Moderate Comments', description: 'Approve, delete comments', category: 'Content' },
        { id: '3', name: 'View Analytics', description: 'Access content analytics', category: 'Analytics' },
      ],
      userCount: 0
    },
    {
      id: '3',
      name: 'Author',
      key: 'AUTHOR',
      description: 'Can create and edit their own posts. Limited access to media library.',
      color: 'purple',
      icon: <BookOpen className="w-5 h-5" />,
      permissions: [
        { id: '10', name: 'Create Posts', description: 'Write new articles', category: 'Content' },
        { id: '11', name: 'Edit Own Posts', description: 'Edit own articles only', category: 'Content' },
        { id: '12', name: 'Upload Media', description: 'Upload images for posts', category: 'Media' },
        { id: '13', name: 'View Own Analytics', description: 'See own post performance', category: 'Analytics' },
      ],
      userCount: 0
    },
    {
      id: '4',
      name: 'User',
      key: 'USER',
      description: 'Basic user with read-only access. Can comment on posts and manage their profile.',
      color: 'gray',
      icon: <Users className="w-5 h-5" />,
      permissions: [
        { id: '14', name: 'Read Content', description: 'View all published content', category: 'Content' },
        { id: '15', name: 'Comment', description: 'Post comments on articles', category: 'Content' },
        { id: '16', name: 'Manage Profile', description: 'Update own profile', category: 'Users' },
        { id: '17', name: 'Like Posts', description: 'Like articles', category: 'Content' },
      ],
      userCount: 0
    }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers({ limit: 1000 });
      if (response?.users) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'amber';
      case 'EDITOR': return 'blue';
      case 'AUTHOR': return 'purple';
      default: return 'gray';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-4 h-4" />;
      case 'EDITOR': return <Edit className="w-4 h-4" />;
      case 'AUTHOR': return <BookOpen className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getUsersCountByRole = (roleKey: string) => {
    return users.filter(u => u.role === roleKey).length;
  };

  const filteredUsers = users.filter(u => {
    const matchesRole = u.role === selectedRole;
    const matchesSearch = searchTerm === '' || 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      setUpdating(true);
      await apiClient.updateUser(selectedUser.id, { role: newRole });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, role: newRole } : u
      ));
      
      setShowChangeRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  const openChangeRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowChangeRoleModal(true);
  };

  const handleAddUserToRole = async () => {
    if (!selectedUserToAdd || !roleToAssign) return;
    
    try {
      setUpdating(true);
      await apiClient.updateUser(selectedUserToAdd.id, { role: roleToAssign });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUserToAdd.id ? { ...u, role: roleToAssign } : u
      ));
      
      setShowAddUserToRoleModal(false);
      setSelectedUserToAdd(null);
      setRoleToAssign('');
      setUserSearchTerm('');
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Failed to assign role to user');
    } finally {
      setUpdating(false);
    }
  };

  // Users available for role assignment (not already in the selected role)
  const availableUsersForRole = users.filter(u => {
    const matchesSearch = userSearchTerm === '' || 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    return matchesSearch;
  });

  const selectedRoleData = roles.find(r => r.key === selectedRole);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#fcd535]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#fcd535] animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#fcd535] animate-pulse" />
          </div>
          <p className="text-gray-400">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield className="w-7 h-7 text-[#fcd535]" />
              Role Management
            </h1>
            <p className="text-gray-400 mt-1">Manage user roles and permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCustomRoleInfoModal(true)}
              className="px-4 py-2.5 bg-[#181a20] border border-[#2b2f36] text-gray-300 font-medium rounded-xl hover:border-[#fcd535]/50 hover:text-white transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Custom Role
            </button>
            <button
              onClick={() => {
                setRoleToAssign(selectedRole);
                setShowAddUserToRoleModal(true);
              }}
              className="px-4 py-2.5 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add User to Role
            </button>
          </div>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {roles.map((role) => {
          const userCount = getUsersCountByRole(role.key);
          const isSelected = selectedRole === role.key;
          
          return (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.key)}
              className={`p-5 rounded-2xl border transition-all text-left ${
                isSelected 
                  ? `bg-${role.color}-500/10 border-${role.color}-500/50` 
                  : 'bg-[#181a20] border-[#2b2f36] hover:border-[#fcd535]/30'
              }`}
              style={{
                backgroundColor: isSelected ? `rgba(${role.color === 'amber' ? '245,158,11' : role.color === 'blue' ? '59,130,246' : role.color === 'purple' ? '168,85,247' : '156,163,175'}, 0.1)` : undefined,
                borderColor: isSelected ? `rgba(${role.color === 'amber' ? '245,158,11' : role.color === 'blue' ? '59,130,246' : role.color === 'purple' ? '168,85,247' : '156,163,175'}, 0.5)` : undefined
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div 
                  className={`p-2.5 rounded-xl`}
                  style={{
                    backgroundColor: `rgba(${role.color === 'amber' ? '245,158,11' : role.color === 'blue' ? '59,130,246' : role.color === 'purple' ? '168,85,247' : '156,163,175'}, 0.2)`
                  }}
                >
                  <span style={{ color: role.color === 'amber' ? '#f59e0b' : role.color === 'blue' ? '#3b82f6' : role.color === 'purple' ? '#a855f7' : '#9ca3af' }}>
                    {role.icon}
                  </span>
                </div>
                <span className="text-2xl font-bold text-white">{userCount}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">{role.name}</h3>
              <p className="text-gray-500 text-xs line-clamp-2">{role.description}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Details */}
        <div className="lg:col-span-1">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden">
            <div className="p-5 border-b border-[#2b2f36]">
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-xl"
                  style={{
                    backgroundColor: `rgba(${selectedRoleData?.color === 'amber' ? '245,158,11' : selectedRoleData?.color === 'blue' ? '59,130,246' : selectedRoleData?.color === 'purple' ? '168,85,247' : '156,163,175'}, 0.2)`
                  }}
                >
                  <span style={{ color: selectedRoleData?.color === 'amber' ? '#f59e0b' : selectedRoleData?.color === 'blue' ? '#3b82f6' : selectedRoleData?.color === 'purple' ? '#a855f7' : '#9ca3af' }}>
                    {selectedRoleData?.icon}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedRoleData?.name}</h2>
                  <p className="text-gray-500 text-xs">{getUsersCountByRole(selectedRole)} users</p>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <p className="text-gray-400 text-sm mb-4">{selectedRoleData?.description}</p>
              
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#fcd535]" />
                Permissions
              </h3>
              
              <div className="space-y-2">
                {selectedRoleData?.permissions.map((permission) => (
                  <div 
                    key={permission.id}
                    className="flex items-start gap-3 p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]"
                  >
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">{permission.name}</p>
                      <p className="text-gray-500 text-xs">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Users with Role */}
        <div className="lg:col-span-2">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden">
            <div className="p-5 border-b border-[#2b2f36] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Users with {selectedRoleData?.name} Role
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50 w-64"
                />
              </div>
            </div>
            
            <div className="divide-y divide-[#2b2f36]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div 
                    key={user.id}
                    className="p-4 hover:bg-[#1e2329] transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0b0e11] font-bold text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 ${
                        user.isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      
                      <button
                        onClick={() => openChangeRoleModal(user)}
                        className="px-3 py-1.5 bg-[#2b2f36] text-gray-300 text-xs font-medium rounded-lg hover:bg-[#363a45] hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Change Role
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No users found with this role</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="mt-6 bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden">
        <div className="p-5 border-b border-[#2b2f36]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-[#fcd535]" />
            Permission Matrix
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2b2f36]">
                <th className="text-left text-gray-400 text-sm font-medium p-4">Permission</th>
                {roles.map((role) => (
                  <th key={role.key} className="text-center p-4">
                    <div className="flex flex-col items-center gap-1">
                      <span style={{ color: role.color === 'amber' ? '#f59e0b' : role.color === 'blue' ? '#3b82f6' : role.color === 'purple' ? '#a855f7' : '#9ca3af' }}>
                        {role.icon}
                      </span>
                      <span className="text-white text-xs font-medium">{role.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Manage Users', admin: true, editor: false, author: false, user: false },
                { name: 'Manage Roles', admin: true, editor: false, author: false, user: false },
                { name: 'System Settings', admin: true, editor: false, author: false, user: false },
                { name: 'View Logs', admin: true, editor: false, author: false, user: false },
                { name: 'Manage Categories', admin: true, editor: true, author: false, user: false },
                { name: 'Manage All Posts', admin: true, editor: true, author: false, user: false },
                { name: 'Create Posts', admin: true, editor: true, author: true, user: false },
                { name: 'Edit Own Posts', admin: true, editor: true, author: true, user: false },
                { name: 'Manage Media', admin: true, editor: true, author: true, user: false },
                { name: 'Moderate Comments', admin: true, editor: true, author: false, user: false },
                { name: 'View Analytics', admin: true, editor: true, author: true, user: false },
                { name: 'Read Content', admin: true, editor: true, author: true, user: true },
                { name: 'Comment', admin: true, editor: true, author: true, user: true },
                { name: 'Like Posts', admin: true, editor: true, author: true, user: true },
                { name: 'Manage Profile', admin: true, editor: true, author: true, user: true },
              ].map((perm, index) => (
                <tr key={index} className="border-b border-[#2b2f36] hover:bg-[#1e2329]">
                  <td className="text-gray-300 text-sm p-4">{perm.name}</td>
                  <td className="text-center p-4">
                    {perm.admin ? (
                      <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-600 mx-auto" />
                    )}
                  </td>
                  <td className="text-center p-4">
                    {perm.editor ? (
                      <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-600 mx-auto" />
                    )}
                  </td>
                  <td className="text-center p-4">
                    {perm.author ? (
                      <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-600 mx-auto" />
                    )}
                  </td>
                  <td className="text-center p-4">
                    {perm.user ? (
                      <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Role Modal */}
      {showChangeRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] w-full max-w-md mx-4 overflow-hidden">
            <div className="p-5 border-b border-[#2b2f36] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Change User Role</h3>
              <button 
                onClick={() => setShowChangeRoleModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5 p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                <div className="w-12 h-12 bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-xl flex items-center justify-center">
                  <span className="text-[#0b0e11] font-bold">
                    {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                </div>
              </div>
              
              <label className="block text-sm font-medium text-gray-400 mb-2">Select New Role</label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <button
                    key={role.key}
                    onClick={() => setNewRole(role.key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      newRole === role.key
                        ? 'border-[#fcd535] bg-[#fcd535]/10'
                        : 'border-[#2b2f36] bg-[#0b0e11] hover:border-[#fcd535]/30'
                    }`}
                  >
                    <div 
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: `rgba(${role.color === 'amber' ? '245,158,11' : role.color === 'blue' ? '59,130,246' : role.color === 'purple' ? '168,85,247' : '156,163,175'}, 0.2)`
                      }}
                    >
                      <span style={{ color: role.color === 'amber' ? '#f59e0b' : role.color === 'blue' ? '#3b82f6' : role.color === 'purple' ? '#a855f7' : '#9ca3af' }}>
                        {role.icon}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{role.name}</p>
                      <p className="text-gray-500 text-xs">{role.permissions.length} permissions</p>
                    </div>
                    {newRole === role.key && (
                      <Check className="w-5 h-5 text-[#fcd535]" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  onClick={() => setShowChangeRoleModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeRole}
                  disabled={updating || newRole === selectedUser.role}
                  className="px-5 py-2 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? (
                    <div className="w-4 h-4 border-2 border-[#0b0e11]/30 border-t-[#0b0e11] rounded-full animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  Update Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User to Role Modal */}
      {showAddUserToRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-[#2b2f36] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#fcd535]" />
                Add User to Role
              </h3>
              <button 
                onClick={() => {
                  setShowAddUserToRoleModal(false);
                  setSelectedUserToAdd(null);
                  setUserSearchTerm('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-auto">
              {/* Role Selection */}
              <label className="block text-sm font-medium text-gray-400 mb-2">Select Role to Assign</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {roles.map((role) => (
                  <button
                    key={role.key}
                    onClick={() => setRoleToAssign(role.key)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                      roleToAssign === role.key
                        ? 'border-[#fcd535] bg-[#fcd535]/10'
                        : 'border-[#2b2f36] bg-[#0b0e11] hover:border-[#fcd535]/30'
                    }`}
                  >
                    <span style={{ color: role.color === 'amber' ? '#f59e0b' : role.color === 'blue' ? '#3b82f6' : role.color === 'purple' ? '#a855f7' : '#9ca3af' }}>
                      {role.icon}
                    </span>
                    <span className="text-white text-sm font-medium">{role.name}</span>
                  </button>
                ))}
              </div>

              {/* User Search */}
              <label className="block text-sm font-medium text-gray-400 mb-2">Search & Select User</label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50"
                />
              </div>

              {/* User List */}
              <div className="max-h-64 overflow-y-auto space-y-2 border border-[#2b2f36] rounded-xl p-2 bg-[#0b0e11]">
                {availableUsersForRole.length > 0 ? (
                  availableUsersForRole.slice(0, 20).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserToAdd(user)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedUserToAdd?.id === user.id
                          ? 'bg-[#fcd535]/10 border border-[#fcd535]'
                          : 'hover:bg-[#181a20] border border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0b0e11] font-bold text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                        user.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400' :
                        user.role === 'EDITOR' ? 'bg-blue-500/10 text-blue-400' :
                        user.role === 'AUTHOR' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No users found</p>
                  </div>
                )}
              </div>

              {/* Selected User Preview */}
              {selectedUserToAdd && (
                <div className="mt-4 p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                  <p className="text-gray-400 text-xs mb-2">Selected User:</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{selectedUserToAdd.firstName} {selectedUserToAdd.lastName}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-[#fcd535] font-medium">{roles.find(r => r.key === roleToAssign)?.name || roleToAssign}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-[#2b2f36] flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddUserToRoleModal(false);
                  setSelectedUserToAdd(null);
                  setUserSearchTerm('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUserToRole}
                disabled={updating || !selectedUserToAdd || !roleToAssign}
                className="px-5 py-2 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-[#0b0e11]/30 border-t-[#0b0e11] rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Assign Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Role Info Modal */}
      {showCustomRoleInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] w-full max-w-md mx-4 overflow-hidden">
            <div className="p-5 border-b border-[#2b2f36] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#fcd535]" />
                Custom Roles
              </h3>
              <button 
                onClick={() => setShowCustomRoleInfoModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-5">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 font-medium mb-1">Enterprise Feature</p>
                  <p className="text-gray-400 text-sm">
                    Custom roles with granular permissions require database modifications and are available as a premium feature.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Current Roles Available:</h4>
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div key={role.key} className="flex items-center gap-3 p-2 bg-[#0b0e11] rounded-lg border border-[#2b2f36]">
                        <span style={{ color: role.color === 'amber' ? '#f59e0b' : role.color === 'blue' ? '#3b82f6' : role.color === 'purple' ? '#a855f7' : '#9ca3af' }}>
                          {role.icon}
                        </span>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{role.name}</p>
                          <p className="text-gray-500 text-xs">{role.permissions.length} permissions</p>
                        </div>
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2b2f36]">
                  <h4 className="text-white font-medium mb-2">Need Custom Roles?</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Contact our team to enable custom role creation with specific permissions tailored to your organization.
                  </p>
                  <a
                    href="mailto:support@umunsi.com?subject=Custom Roles Request"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#fcd535] transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;

