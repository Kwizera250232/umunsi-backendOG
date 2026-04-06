import React, { useState } from 'react';
import { useApi, useApiMutation } from '../../hooks/useApi';
import { apiClient, Article } from '../../services/api';

const ApiExample: React.FC = () => {
  const [newArticleTitle, setNewArticleTitle] = useState('');

  // Example: Fetching articles with loading and error states
  const {
    data: articles,
    loading: articlesLoading,
    error: articlesError,
    execute: refetchArticles
  } = useApi(() => apiClient.getArticles({ limit: 10 }));

  // Example: Creating a new article
  const {
    mutate: createArticle,
    loading: createLoading,
    error: createError,
    reset: resetCreate
  } = useApiMutation((articleData: Partial<Article>) => 
    apiClient.createArticle(articleData)
  );

  const handleCreateArticle = async () => {
    if (!newArticleTitle.trim()) return;

    const result = await createArticle({
      title: newArticleTitle,
      content: 'This is a sample article content.',
      excerpt: 'Sample excerpt for the article.',
      status: 'DRAFT'
    });

    if (result) {
      setNewArticleTitle('');
      refetchArticles(); // Refresh the articles list
      resetCreate(); // Clear any previous errors
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Integration Examples</h1>

      {/* Create Article Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Create New Article</h2>
        
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={newArticleTitle}
            onChange={(e) => setNewArticleTitle(e.target.value)}
            placeholder="Enter article title..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={handleCreateArticle}
            disabled={createLoading || !newArticleTitle.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createLoading ? 'Creating...' : 'Create Article'}
          </button>
        </div>

        {createError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{createError}</p>
          </div>
        )}
      </div>

      {/* Articles List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Articles List</h2>
          <button
            onClick={refetchArticles}
            disabled={articlesLoading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {articlesLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {articlesError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-sm text-red-600">{articlesError}</p>
          </div>
        )}

        {articlesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : articles?.data && articles.data.length > 0 ? (
          <div className="space-y-4">
            {articles.data.map((article) => (
              <div
                key={article.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <h3 className="font-semibold text-lg">{article.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{article.excerpt}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>By {article.author.firstName} {article.author.lastName}</span>
                  <span>•</span>
                  <span>{article.category.name}</span>
                  <span>•</span>
                  <span>{article.status}</span>
                  <span>•</span>
                  <span>{article.viewCount} views</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No articles found.</p>
        )}
      </div>
    </div>
  );
};

export default ApiExample;
