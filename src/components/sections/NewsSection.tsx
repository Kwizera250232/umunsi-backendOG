import { Link } from 'react-router-dom';
import NewsCard from '../common/NewsCard';
import { ArrowRight, Flame, Trophy, Music, Heart } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  publishedAt: string;
}

interface NewsSectionProps {
  title: string;
  subtitle?: string;
  sectionType?: 'must-reads' | 'sports' | 'entertainment' | 'health';
  articles: Article[];
  viewAllLink: string;
  layout?: 'grid' | 'list' | 'mixed';
  backgroundColor?: string;
}

const NewsSection = ({
  title,
  subtitle,
  sectionType,
  articles,
  viewAllLink,
  layout = 'grid',
  backgroundColor = 'bg-white'
}: NewsSectionProps) => {

  const getSectionIcon = () => {
    switch (sectionType) {
      case 'must-reads':
        return <Flame size={24} className="text-orange-600" />;
      case 'sports':
        return <Trophy size={24} className="text-orange-600" />;
      case 'entertainment':
        return <Music size={24} className="text-purple-600" />;
      case 'health':
        return <Heart size={24} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getSectionGradient = () => {
    switch (sectionType) {
      case 'must-reads':
        return 'from-orange-500 to-red-500';
      case 'sports':
        return 'from-green-500 to-emerald-500';
      case 'entertainment':
        return 'from-purple-500 to-pink-500';
      case 'health':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-green-500 to-green-600';
    }
  };

  const renderGridLayout = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {articles.map((article, index) => (
        <NewsCard
 key={article.id || `grid-article-${index}`} // Added fallback key
          {...article}
          size="medium"
          layout="vertical"
        />
      ))}
    </div>
  );

  const renderListLayout = () => (
    <div className="space-y-4">
      {articles.map((article) => (
        <NewsCard
 key={article.id || `list-article-${article.title}`} // Added fallback key
          {...article}
          size="small"
          layout="horizontal"
        />
      ))}
    </div>
  );

  const renderMixedLayout = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main featured article */}
      <div className="lg:col-span-2">
        {articles[0] && (
 <NewsCard // Added key prop here
            {...articles[0]}
            size="large"
            layout="vertical"
          />
        )}
      </div>

      {/* Side articles */}
      <div className="space-y-6">
        {articles.slice(1, 4).map((article) => (
          <NewsCard
 key={article.id || `mixed-article-${article.title}`} // Added fallback key
            {...article}
            size="small"
            layout="horizontal"
          />
        ))}
      </div>
    </div>
  );

  const getLayoutComponent = () => {
    switch (layout) {
      case 'list':
        return renderListLayout();
      case 'mixed':
        return renderMixedLayout();
      default:
        return renderGridLayout();
    }
  };

  return (
    <section className={`${backgroundColor} py-12 lg:py-16`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`bg-gradient-to-r ${getSectionGradient()} p-2 sm:p-3 rounded-xl shadow-lg`}>
                {getSectionIcon()}
              </div>
              <div className="flex-1 min-w-0"> {/* Added flex-1 and min-w-0 */}
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-gray-600 text-sm sm:text-base font-medium">{subtitle}</p>
                )}
              </div>
            </div>

          </div>

          {/* Desktop View All Button */}
          <Link
            to={viewAllLink}
            className="hidden lg:flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 group"
          >
            <span>Reba Byose</span>
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        {/* Articles Content */}
        {getLayoutComponent()}

        {/* Mobile View All Button */}
        <div className="mt-8 lg:hidden">
          <Link
            to={viewAllLink} // Removed key here
            className="block w-full text-center py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-bold text-base shadow-lg" // Adjusted padding, font size
          >
            <div className="flex items-center justify-center space-x-1.5">
              <span>Reba Byose</span>
              <ArrowRight size={20} />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
