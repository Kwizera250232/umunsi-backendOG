import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Images from './pages/Images';
import Religion from './pages/Religion';
import Music from './pages/Music';
import Entertainment from './pages/Entertainment';
import CategoryPage from './pages/CategoryPage';
import PostPage from './pages/PostPage';
import Newsletter from './pages/Newsletter';
import Login from './pages/Login';
import TestLogin from './pages/TestLogin';
import Profile from './pages/Profile';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import Articles from './pages/admin/Articles';
import BreakingNews from './pages/admin/BreakingNews';
import FeaturedNews from './pages/admin/FeaturedNews';
import News from './pages/admin/News';
import Categories from './pages/admin/Categories';
import Users from './pages/admin/Users';
import Analytics from './pages/admin/Analytics';
import Logs from './pages/admin/Logs';
import Settings from './pages/admin/Settings';
import MediaLibrary from './pages/admin/MediaLibrary';
import AddMedia from './pages/admin/AddMedia';
import Posts from './pages/admin/Posts';
import AddPost from './pages/admin/AddPost';
import EditPost from './pages/admin/EditPost';
import PostDetail from './pages/admin/PostDetail';
import Roles from './pages/admin/Roles';
import { withAuth, withAdmin, withEditor } from './contexts/AuthContext';

// Create wrapped components
const ProtectedAdminDashboard = withEditor(AdminDashboard);
const ProtectedArticles = withEditor(Articles);
const ProtectedBreakingNews = withEditor(BreakingNews);
const ProtectedFeaturedNews = withEditor(FeaturedNews);
const ProtectedNews = withEditor(News);
const ProtectedCategories = withEditor(Categories);
const ProtectedUsers = withAdmin(Users);
const ProtectedAnalytics = withEditor(Analytics);
const ProtectedLogs = withAdmin(Logs);
const ProtectedSettings = withAdmin(Settings);
const ProtectedMediaLibrary = withEditor(MediaLibrary);
const ProtectedAddMedia = withEditor(AddMedia);
const ProtectedPosts = withEditor(Posts);
const ProtectedAddPost = withEditor(AddPost);
const ProtectedEditPost = withEditor(EditPost);
const ProtectedPostDetail = withEditor(PostDetail);
const ProtectedRoles = withAdmin(Roles);
const ProtectedProfile = withAuth(Profile);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login route - standalone, no layout wrapper */}
          <Route path="/login" element={<Login />} />
          {/* Test login page for debugging */}
          <Route path="/test-login" element={<TestLogin />} />
          
          {/* Public routes with Layout */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/images" element={<Images />} />
                <Route path="/religion" element={<Religion />} />
                <Route path="/music" element={<Music />} />
                <Route path="/tv" element={<div className="p-8 text-center">Urupapuro rwa Televiziyo ruzakorwa vuba</div>} />
                <Route path="/movies" element={<div className="p-8 text-center">Urupapuro rw'Amashusho ruzakorwa vuba</div>} />
                <Route path="/sports" element={<div className="p-8 text-center">Urupapuro rwa Siporo ruzakorwa vuba</div>} />
                <Route path="/politics" element={<div className="p-8 text-center">Urupapuro rwa Politiki ruzakorwa vuba</div>} />
                <Route path="/health" element={<div className="p-8 text-center">Urupapuro rw'Ubuzima ruzakorwa vuba</div>} />
                <Route path="/entertainment" element={<Entertainment />} />
                <Route path="/celebrity" element={<div className="p-8 text-center">Urupapuro rw'Abakinnyi ruzakorwa vuba</div>} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/post/:slug" element={<PostPage />} />
                <Route path="/article/:id" element={<PostPage />} />
                <Route path="/newsletter" element={<Newsletter />} />
                <Route path="/profile" element={<ProtectedProfile />} />
              </Routes>
            </Layout>
          } />
          
          {/* Admin routes with AdminLayout - Protected with authentication */}
          <Route path="/admin/*" element={
            <AdminLayout />
          }>
            <Route index element={<ProtectedAdminDashboard />} />
            <Route path="articles" element={<ProtectedArticles />} />
            <Route path="news" element={<ProtectedNews />} />
            <Route path="breaking-news" element={<ProtectedBreakingNews />} />
            <Route path="featured-news" element={<ProtectedFeaturedNews />} />
            <Route path="categories" element={<ProtectedCategories />} />
            <Route path="users" element={<ProtectedUsers />} />
            <Route path="roles" element={<ProtectedRoles />} />
            <Route path="analytics" element={<ProtectedAnalytics />} />
            <Route path="logs" element={<ProtectedLogs />} />
            <Route path="settings" element={<ProtectedSettings />} />
            <Route path="media/library" element={<ProtectedMediaLibrary />} />
            <Route path="media/add" element={<ProtectedAddMedia />} />
            <Route path="posts" element={<ProtectedPosts />} />
            <Route path="posts/add" element={<ProtectedAddPost />} />
            <Route path="posts/edit/:id" element={<ProtectedEditPost />} />
            <Route path="posts/:id" element={<ProtectedPostDetail />} />
            {/* Test route to verify routing works */}
            <Route path="test" element={<div className="p-12 text-center text-green-600 font-bold">✅ Test Route Working!</div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;