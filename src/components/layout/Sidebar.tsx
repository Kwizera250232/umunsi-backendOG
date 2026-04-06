import { Link } from 'react-router-dom';
import { Clock, TrendingUp, ArrowRight } from 'lucide-react';

interface SidebarArticle {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  image: string;
}

const Sidebar = () => {
  // Sample news data in Kinyarwanda
  const latestNews: SidebarArticle[] = [
    {
      id: '1',
      title: 'Perezida Kagame yaganiriye na Perezida wa Kongo ku bibazo by\'akarere',
      category: 'Politiki',
      publishedAt: 'Amasaha 2 ashize',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
    },
    {
      id: '2',
      title: 'Rayon Sports yaronse amashampiyona ya CAF mu rukino rw\'ejo',
      category: 'Siporo',
      publishedAt: 'Amasaha 3 ashize',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&h=100&fit=crop'
    },
    {
      id: '3',
      title: 'Ubwiyongere bw\'ubukungu mu Rwanda bugeze kuri 8.2% muri uyu mwaka',
      category: 'Ubukungu',
      publishedAt: 'Amasaha 4 ashize',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop'
    },
    {
      id: '4',
      title: 'Amashuri y\'incuke azafungura ukwezi gushya mu Rwanda',
      category: 'Uburezi',
      publishedAt: 'Amasaha 5 ashize',
      image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=100&h=100&fit=crop'
    },
    {
      id: '5',
      title: 'Ikirori cy\'umuziki gishya kizabera i Kigali muri Kamena',
      category: 'Umuziki',
      publishedAt: 'Amasaha 6 ashize',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop'
    },
    {
      id: '6',
      title: 'Ubuvuzi bushya bw\'indwara z\'umutima buzaza mu Rwanda',
      category: 'Ubuzima',
      publishedAt: 'Umunsi 1 ushize',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop'
    },
    {
      id: '7',
      title: 'Amashyirahamwe y\'abacuruzi arasaba kugabanya imisoro',
      category: 'Ubucuruzi',
      publishedAt: 'Umunsi 1 ushize',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&h=100&fit=crop'
    },
    {
      id: '8',
      title: 'Tekinoroji nshya y\'ubuhinga izafasha abahinzi b\'u Rwanda',
      category: 'Tekinoroji',
      publishedAt: 'Umunsi 2 ushize',
      image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=100&h=100&fit=crop'
    }
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Politiki': 'bg-red-100 text-red-700 border-red-200',
      'Siporo': 'bg-orange-100 text-orange-700 border-orange-200',
      'Ubukungu': 'bg-green-100 text-green-700 border-green-200',
      'Uburezi': 'bg-blue-100 text-blue-700 border-blue-200',
      'Umuziki': 'bg-purple-100 text-purple-700 border-purple-200',
      'Ubuzima': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Ubucuruzi': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Tekinoroji': 'bg-indigo-100 text-indigo-700 border-indigo-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <aside className="w-full lg:w-80">
      {/* Latest News Header - Mobile: smaller padding/fonts, Desktop: larger */}
      <div className="bg-gradient-to-br from-green-600 via-green-500 to-yellow-500 text-white p-6 rounded-t-xl shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <TrendingUp size={20} />
          </div>
          <h2 className="text-xl font-bold">Amakuru Mashya</h2>
        </div>
        <p className="text-green-50 font-medium">Amakuru y'ubunini y'u Rwanda</p>
      </div>

      {/* News List */}
      <div className="bg-white border-x border-gray-100 shadow-lg">
        {latestNews.map((article, index) => (
          <Link // Mobile: denser spacing, smaller image/text, Desktop: more padding, larger image/text
            key={article.id}
            to={`/article/${article.id}`}
            className={`flex items-start space-x-3 p-4 md:space-x-4 md:p-5 hover:bg-gradient-to-r hover:from-green-25 hover:to-yellow-25 transition-all duration-200 border-b border-gray-100 group ${
              index === latestNews.length - 1 ? 'border-b-0' : ''
            }`}
          >
            {/* Article Image - Mobile: smaller, Desktop: larger */}
            <div className="flex-shrink-0 relative">
              <img
                src={article.image}
                alt={article.title}
                className="w-18 h-18 rounded-xl object-cover shadow-md group-hover:shadow-lg transition-shadow"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* Article Content */}
            <div className="flex-1 min-w-0">
              {/* Category and Time - Mobile: smaller font, Desktop: slightly larger */}
              <div className="flex items-center space-x-2 mb-1 md:space-x-3 md:mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 md:py-1 rounded-full border ${getCategoryColor(article.category)}`}>
                  {article.category}
                </span>
                <div className="flex items-center space-x-1 text-xs text-gray-500 md:text-sm">
                  <Clock size={12} />
                  <span>{article.publishedAt}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-3 group-hover:text-green-700 transition-colors leading-relaxed">
                {article.title}
              </h3>
            </div>

            {/* Arrow Icon */}
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight size={16} className="text-green-600" />
            </div>
          </Link>
        ))}
      </div>

      {/* See More Button */}
      <div className="bg-gradient-to-r from-gray-50 to-green-50 border-x border-b border-gray-100 p-5 rounded-b-xl shadow-lg">
        <Link
          to="/latest"
          className="block w-full text-center py-3 px-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <span className="flex items-center justify-center space-x-2">
            <span>Reba Amakuru Yose</span>
            <ArrowRight size={16} />
          </span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
