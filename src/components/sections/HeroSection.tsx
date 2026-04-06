import { Link } from 'react-router-dom';
import { Clock, User, Share2, Bookmark, ArrowRight, MessageCircle, Eye } from 'lucide-react';

const HeroSection = () => {
  // Updated featured article structure to potentially hold more data for the EW.com layout
  const featuredArticle = {
    id: 'featured-1',
    title: 'Perezida Kagame yasubije abakunzi b\'amahanga ko u Rwanda rukomeje kwihangana mu bibazo by\'isi bikomeye',
    excerpt: 'Mu kiganiro kirekire yagiranye n\'inyandiko z\'amakuru zikomeye ku isi, Perezida w\'u Rwanda yagaragaje ko igihugu cyacu gikurikirana politiki yo kubana neza n\'abandi bose mu karere no ku isi, kandi ko u Rwanda rufite ubushobozi bwo kwihangana mu bibazo byose.',
    image: 'https://via.placeholder.com/1200x800',
    mobileImage: 'https://via.placeholder.com/600x400', // Added for potential mobile specific image
    category: 'Politiki',
    author: 'Jean Baptiste Habimana',
    publishedAt: 'Saa sita z\'uyu munsi',
    readTime: '5 iminota',
    isTopStory: true,
    // Added more placeholder content to simulate EW.com's denser hero section
    tags: ['Rwanda', 'Politics', 'International Relations'],
    relatedTopic: { name: 'Ibihugu bigiye guhurira mu nama', href: '/topics/meeting' },
    views: '12k',
    comments: '34'
  };

  const relatedStories = [
    {
      id: 'related-1',
      title: 'Inama Nkuru y\'u Rwanda yemeje imishinga mishya y\'amajyambere',
      excerpt: 'Inama Nkuru yemeje imishinga ikomeye izateza imbere ubukungu n\'imibereho myiza y\'abaturage mu gihugu hose.',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop',
      category: 'Ubukungu',
      author: 'Kamana Egide',
      publishedAt: 'Amasaha 2 ashize'
    },
    {
      id: 'related-2',
      title: 'Abakunzi b\'ubucuruzi bw\'amahanga bashimye inyubako z\'u Rwanda',
      excerpt: 'Abashoramari baturutse mu bihugu bitandukanye bashimye cyane inyubako zigezweho ziri kubakwa i Kigali.',
      image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=300&h=200&fit=crop',
      category: 'Ubucuruzi',
      author: 'Mukeshimana Chantal',
      publishedAt: 'Amasaha 3 ashize'
    },
    {
      id: 'related-3',
      title: 'Inama y\'abaminisitiri yemeje gahunda y\'amajyambere 2025',
      excerpt: 'Gahunda nshya y\'imyaka irindwi izibanda ku kongera umusaruro no kuzamura serivisi zihabwa abaturage.',
      image: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=300&h=200&fit=crop',
      category: 'Politiki',
      author: 'Habineza James',
      publishedAt: 'Amasaha 5 ashize'
    }
  ];

  return (
    <section className="bg-white py-6 lg:py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Featured Article - Left Column */}
          <div className="lg:col-span-2">
            {/* Top Story Badge */}
            {featuredArticle.isTopStory && (
              <div className="absolute top-6 left-6 z-10">
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg backdrop-blur-sm md:px-4 md:py-2 md:text-sm">
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Inkuru Nkuru</span>
                  </div>
                </div>
              </div>
            )}

            <Link to={`/article/${featuredArticle.id}`} className="block relative group">
              <div className="relative overflow-hidden rounded-lg shadow-xl group">
                {/* Image with different source for mobile */}
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105 md:h-80 lg:h-96 hidden md:block"
                />
                <img
                  src={featuredArticle.mobileImage || featuredArticle.image}
                  alt={featuredArticle.title}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105 md:h-80 lg:h-96 md:hidden"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white md:p-6 lg:p-8">
                  {/* Category */}
                  <div className="flex flex-wrap items-center gap-2 mb-2 md:gap-4">
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold uppercase shadow-sm md:px-3 md:py-1">
                      {featuredArticle.category}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span className="font-medium">{featuredArticle.publishedAt}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User size={12} />
                        <span className="font-medium">{featuredArticle.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{featuredArticle.readTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="text-xl md:text-3xl font-bold mb-2 leading-tight group-hover:text-yellow-200 transition-colors lg:text-4xl">
                    {featuredArticle.title}
                  </h1>

                  {/* Excerpt */}
                  <p className="text-sm text-gray-300 mb-4 line-clamp-3 leading-relaxed md:text-base">
                    {featuredArticle.excerpt}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <div className="bg-white text-gray-900 px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-200 transition-all duration-200 shadow-sm md:px-6 md:py-2 md:text-sm">
                      <div className="flex items-center space-x-2">
                        <span>Soma Byose</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                    <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-110 md:p-3">
                      <Share2 size={18} />
                    </button>
                    <button className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-110">
                      <Bookmark size={18} />
                    </button>
                  </div>

                  {/* View and Comment Count */}
                  <div className="mt-4 text-xs text-gray-300 flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Eye size={12} />
                      <span>{featuredArticle.views} Abasomyi</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle size={12} />
                      <span>{featuredArticle.comments} Ibyakozwe</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Related Stories */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Amakuru Ajyanye</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1">
              {relatedStories.map((story) => (
                <Link
                  key={story.id}
                  to={`/article/${story.id}`}
                  className="group block"
                >
                  <div className="relative h-48 mb-4 overflow-hidden rounded-xl shadow-lg">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl"></div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold uppercase shadow-sm">
                        {story.category}
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 lg:p-3">
                        <ArrowRight size={14} className="text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2 text-sm leading-tight md:text-base">
                      {story.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;