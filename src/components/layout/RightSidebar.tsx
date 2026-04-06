import { useState } from 'react';
import { Flame, Image, Cloud, Sun, Moon, ChevronRight, TrendingUp, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const RightSidebar = () => {
  const { user } = useAuth();
  const showAds = user?.role !== 'ADMIN';

  // Trending news for the sidebar
  const trendingNews = [
    {
      id: 'trend-1',
      title: 'U Rwanda rwizihije umunsi w\'ubumwe bw\'abatutsi',
      category: 'Politiki',
      time: 'Amasaha 2 ashize',
      image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=200&h=120&fit=crop'
    },
    {
      id: 'trend-2',
      title: 'Inyigisho z\'umwaka ushize: Abanyeshuri barangije neza',
      category: 'Amashuri',
      time: 'Amasaha 3 ashize',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=120&fit=crop'
    },
    {
      id: 'trend-3',
      title: 'Imodoka zishya zo mu Rwanda: Ikirango cya Volkswagen',
      category: 'Tekinoroji',
      time: 'Amasaha 4 ashize',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=120&fit=crop'
    },
    {
      id: 'trend-4',
      title: 'Umukino wa Nyuma: APR yegukana igikombe',
      category: 'Siporo',
      time: 'Amasaha 5 ashize',
      image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=200&h=120&fit=crop'
    },
    {
      id: 'trend-5',
      title: 'Artiste mashya w\'u Rwanda azana album nshya',
      category: 'Umuziki',
      time: 'Amasaha 6 ashize',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=120&fit=crop'
    }
  ];

  // Advertisements data
  const advertisements = [
    {
      id: 'ad-1',
      title: 'Imodoka Nshya',
      description: 'Gura imodoka yawe ya buri munsi',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300&h=200&fit=crop',
      cta: 'Gura Nonaha',
      link: '#'
    },
    {
      id: 'ad-2',
      title: 'Amashuri y\'Amahanga',
      description: 'Fata amashuri yo mu mahanga',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9e1?w=300&h=200&fit=crop',
      cta: 'Menya Byinshi',
      link: '#'
    }
  ];

  const quickLinks = [
    { name: 'Televiziyo', icon: '📺', href: '/tv' },
    { name: 'Amashusho', icon: '🎬', href: '/movies' },
    { name: 'Umuziki', icon: '🎵', href: '/music' },
    { name: 'Siporo', icon: '⚽', href: '/sports' },
    { name: 'Politiki', icon: '🏛️', href: '/politics' },
    { name: 'Ubuzima', icon: '🏥', href: '/health' }
  ];

  return (
    <div className="space-y-6">
      {/* Trending News Section */}
      <div className="bg-[#181a20] rounded-2xl p-5 border border-[#2b2f36]">
        <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-[#2b2f36] flex items-center">
          <Flame className="w-5 h-5 mr-2 text-orange-500" />
          Amakuru Yakunzwe
        </h2>
        <div className="space-y-4">
          {trendingNews.map((news, index) => (
            <div key={news.id} className="group cursor-pointer">
              <div className="flex space-x-3">
              <div className="flex-shrink-0">
                  <div className="relative">
                    <span className="absolute -top-1 -left-1 z-10 inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] text-xs font-bold rounded-full shadow-lg">
                  {index + 1}
                </span>
                    <img src={news.image} alt={news.title} className="w-20 h-14 object-cover rounded-lg" />
                  </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                    <span className="inline-block bg-[#1e2329] text-[#fcd535] text-xs px-2 py-0.5 rounded-full font-medium">{news.category}</span>
                  <span className="text-xs text-gray-500">{news.time}</span>
                </div>
                  <h3 className="font-medium text-gray-300 group-hover:text-[#fcd535] transition-colors text-sm leading-tight line-clamp-2">
                  {news.title}
                </h3>
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAds && (
        <div className="bg-[#181a20] rounded-2xl p-5 border border-[#2b2f36]">
          <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-[#2b2f36] flex items-center">
            <Image className="w-5 h-5 mr-2 text-blue-400" />
            Itangazo
          </h2>
          <div className="space-y-4">
            {advertisements.map((ad) => (
              <div key={ad.id} className="bg-gradient-to-br from-[#1e2329] to-[#181a20] rounded-xl p-4 border border-[#2b2f36] hover:border-[#fcd535]/30 transition-all group cursor-pointer">
                <div className="relative overflow-hidden rounded-lg mb-3">
                  <img src={ad.image} alt={ad.title} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e11]/60 to-transparent"></div>
                </div>
                <h3 className="font-bold text-white mb-1 group-hover:text-[#fcd535] transition-colors">{ad.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{ad.description}</p>
                <button className="w-full bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] py-2.5 px-4 rounded-xl text-sm font-semibold hover:from-[#f0b90b] hover:to-[#fcd535] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
                  {ad.cta}
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Widget */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center relative z-10">
          <Cloud className="w-5 h-5 mr-2" />
          Igihe
        </h2>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <div className="text-4xl font-bold text-white">24°C</div>
            <div className="text-blue-200 text-sm">Kigali, Rwanda</div>
          </div>
          <div className="text-5xl">☀️</div>
        </div>
        <div className="grid grid-cols-4 gap-2 relative z-10">
          {[
            { time: '15:00', icon: '🌤️', temp: '25°' },
            { time: '18:00', icon: '🌤️', temp: '23°' },
            { time: '21:00', icon: '🌙', temp: '20°' },
            { time: '00:00', icon: '🌙', temp: '18°' }
          ].map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm p-2 rounded-xl text-center">
              <div className="text-xs text-blue-200">{item.time}</div>
              <div className="text-xl my-1">{item.icon}</div>
              <div className="text-xs text-white font-medium">{item.temp}</div>
          </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-[#181a20] rounded-2xl p-5 border border-[#2b2f36]">
        <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-[#2b2f36] flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-[#fcd535]" />
          Urupapuro Rusheshe
        </h2>
        <div className="space-y-2">
          {quickLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href} 
              className="flex items-center text-gray-400 hover:text-[#fcd535] py-2.5 px-3 rounded-xl hover:bg-[#1e2329] transition-all group"
            >
              <span className="text-lg mr-3">{link.icon}</span>
              <span className="flex-1">{link.name}</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
