import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import { Layers, Sparkles } from 'lucide-react';

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();

  // Check localStorage as fallback
  const storedUser = localStorage.getItem('umunsi_user');
  const storedToken = localStorage.getItem('umunsi_token');
  const hasStoredAuth = !!(storedUser && storedToken);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#fcd535]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#fcd535] animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-[#fcd535] animate-pulse" />
          </div>
          <p className="text-gray-400 text-lg font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && !hasStoredAuth) {
    window.location.href = '/login';
    return null;
  }

  // Get user data from context or localStorage
  const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 h-full z-40">
        <AdminSidebar 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={setIsSidebarCollapsed}
          user={currentUser}
        />
      </div>
      
      {/* Main content area */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        {/* Mobile Navbar */}
        <div className="lg:hidden">
          <AdminNavbar user={currentUser} />
        </div>
        
        {/* Page content */}
        <main className="flex-1 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
