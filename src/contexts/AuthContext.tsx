import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api';

// User interface
interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isAuthor: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isEditor: false,
  isAuthor: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  refreshUser: async () => {},
  hasPermission: () => false,
  hasRole: () => false,
});

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Role checks
  const isAdmin = user?.role === 'ADMIN';
  const isEditor = user?.role === 'EDITOR' || user?.role === 'ADMIN';
  const isAuthor = user?.role === 'AUTHOR' || user?.role === 'EDITOR' || user?.role === 'ADMIN';

  // Permission system
  const permissions = {
    // Article permissions
    'articles:read': isAuthenticated,
    'articles:create': isAuthor,
    'articles:edit': isAuthor,
    'articles:delete': isEditor,
    'articles:publish': isEditor,
    'articles:feature': isEditor,
    
    // User permissions
    'users:read': isAuthenticated,
    'users:create': isAdmin,
    'users:edit': isAdmin,
    'users:delete': isAdmin,
    'users:activate': isAdmin,
    
    // Category permissions
    'categories:read': isAuthenticated,
    'categories:create': isAdmin,
    'categories:edit': isAdmin,
    'categories:delete': isAdmin,
    
    // Analytics permissions
    'analytics:read': isEditor,
    'analytics:export': isAdmin,
    
    // System permissions
    'system:settings': isAdmin,
    'system:logs': isAdmin,
    'system:backup': isAdmin,
    
    // Admin dashboard access
    'admin:access': isEditor,
    'admin:full': isAdmin,
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    return permissions[permission as keyof typeof permissions] || false;
  };

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    switch (role) {
      case 'ADMIN':
        return isAdmin;
      case 'EDITOR':
        return isEditor;
      case 'AUTHOR':
        return isAuthor;
      case 'USER':
        return isAuthenticated;
      default:
        return false;
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiClient.login({ email, password });
      
      if (response && response.success && response.user) {
        setUser(response.user);
        
        // Store user data in localStorage for persistence
        localStorage.setItem('umunsi_user', JSON.stringify(response.user));
        localStorage.setItem('umunsi_token', response.token);
        
        // Set token in API client
        apiClient.setToken(response.token);
        
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
      setUser(null);
    localStorage.removeItem('umunsi_user');
    localStorage.removeItem('umunsi_token');
    apiClient.clearToken();
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('umunsi_token');
      if (token) {
        apiClient.setToken(token);
        // You can add an API endpoint to refresh user data if needed
        // For now, we'll use the stored user data
      } else {
          // Ensure API client has no token
          apiClient.clearToken();
        }
    } catch (error) {
      console.error('Error refreshing user:', error);
      logout();
    }
  };

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('umunsi_user');
        const storedToken = localStorage.getItem('umunsi_token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          apiClient.setToken(storedToken);
        }
      } catch (error) {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh user data every 30 minutes
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(refreshUser, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    isEditor,
    isAuthor,
    isLoading,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: string,
  requiredRole?: string
) => {
  const WrappedComponent = (props: P) => {
    const { isAuthenticated, hasPermission, hasRole, isLoading, user } = useAuth();

    // Check localStorage as fallback
    const storedUser = localStorage.getItem('umunsi_user');
    const storedToken = localStorage.getItem('umunsi_token');
    const hasStoredAuth = !!(storedUser && storedToken);
    
    // Determine effective authentication status
    const effectivelyAuthenticated = isAuthenticated || hasStoredAuth;

    if (isLoading && hasStoredAuth) {
      // Show loading if we have stored auth but context is still loading
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-green-600 text-lg">Loading...</p>
          </div>
        </div>
      );
    }

    if (!effectivelyAuthenticated) {
      // Redirect to login instead of showing access denied
      window.location.href = '/login';
      return null;
    }

    // Get user data from either context or localStorage
    const userData = user || (storedUser ? JSON.parse(storedUser) : null);
    
    if (requiredRole && userData) {
      const roleHierarchy: Record<string, number> = {
        'USER': 0,
        'AUTHOR': 1,
        'EDITOR': 2,
        'ADMIN': 3
      };
      
      const userRoleLevel = roleHierarchy[userData.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
      
      if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">This page requires {requiredRole} role.</p>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
      }
    }

    return <Component {...props} />;
  };

  // Set display name for debugging
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Admin-only component wrapper
export const withAdmin = <P extends object>(Component: React.ComponentType<P>) => {
  return withAuth(Component, 'admin:full', 'ADMIN');
};

// Editor-only component wrapper
export const withEditor = <P extends object>(Component: React.ComponentType<P>) => {
  return withAuth(Component, 'admin:access', 'EDITOR');
};

// Author-only component wrapper
export const withAuthor = <P extends object>(Component: React.ComponentType<P>) => {
  return withAuth(Component, 'articles:create', 'AUTHOR');
};
