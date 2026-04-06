import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface DashboardStats {
  totalArticles: number;
  totalCategories: number;
  totalUsers: number;
  totalViews: number;
  totalLikes: number;
  recentArticles: any[];
  topCategories: any[];
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalViews: 0,
    totalLikes: 0,
    recentArticles: [],
    topCategories: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch articles for count and views/likes
      const articlesResponse = await apiClient.getArticles({ page: 1, limit: 1000 });
      const articles = articlesResponse?.data || [];
      
      // Fetch categories for count
      const categoriesResponse = await apiClient.getCategories();
      const categories = categoriesResponse || [];
      
      // Fetch users for count
      const usersResponse = await apiClient.getUsers({ page: 1, limit: 1000 });
      const users = usersResponse?.data || [];

      // Calculate totals
      const totalArticles = articles.length;
      const totalCategories = categories.length;
      const totalUsers = users.length;
      const totalViews = articles.reduce((sum, article) => sum + (article.viewCount || 0), 0);
      const totalLikes = articles.reduce((sum, article) => sum + (article.likeCount || 0), 0);

      // Get recent articles
      const recentArticles = articles
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Get top categories by article count
      const topCategories = categories
        .map(category => ({
          ...category,
          articleCount: articles.filter(article => article.categoryId === category.id).length
        }))
        .sort((a, b) => b.articleCount - a.articleCount)
        .slice(0, 5);

      setStats({
        totalArticles,
        totalCategories,
        totalUsers,
        totalViews,
        totalLikes,
        recentArticles,
        topCategories
      });

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};
