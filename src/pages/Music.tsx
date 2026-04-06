import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music2, Clock, TrendingUp, Calendar, Play, ChevronRight, Sparkles, Headphones } from 'lucide-react';

const Music = () => {
  // Featured music articles
  const featuredMusic = [
    {
      id: 'feat-1',
      title: 'Artiste mashya w\'u Rwanda azana album nshya y\'umuziki wa kinyarwanda',
      excerpt: 'Artiste mashya w\'u Rwanda yatangije album nshya izazana urwenya rw\'umuziki wa kinyarwanda mu buryo bushya.',
      image: 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'Umuziki',
      author: 'Grace Uwase',
      publishedAt: 'Amasaha 2 ashize',
      featured: true
    },
    {
      id: 'feat-2',
      title: 'Inyandiko z\'umuziki zerekana amateka n\'umuco wa Rwanda',
      excerpt: 'Ubushakashatsi bushya bw\'inyandiko z\'umuziki z\'ikinyagihugu bizafasha kumenya amateka n\'umuco wa Rwanda.',
      image: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'Umuziki',
      author: 'Dr. Marie Claire Uwimana',
      publishedAt: 'Amasaha 5 ashize',
      featured: true
    }
  ];

  // Latest music news
  const latestMusic = [
    {
      id: 'music-1',
      title: 'Umuziki wa kinyarwanda ukomeje guteza imbere',
      excerpt: 'Umuziki wa kinyarwanda ukomeje guteza imbere mu mahanga n\'abantu benshi bakunzwe.',
      image: 'https://images.pexels.com/photos/167092/pexels-photo-167092.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'Umuziki',
      author: 'Patrick Uwimana',
      publishedAt: 'Amasaha 1 ashize'
    },
    {
      id: 'music-2',
      title: 'Abahanzi b\'u Rwanda bateguye concert nshya',
      excerpt: 'Abahanzi b\'u Rwanda bateguye concert nshya izaba vuba mu Kigali.',
      image: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'Umuziki',
      author: 'Claude Mujyanama',
      publishedAt: 'Amasaha 3 ashize'
    },
    {
      id: 'music-3',
      title: 'Album nshya y\'umuziki wa gospel yatangijwe',
      excerpt: 'Album nshya y\'umuziki wa gospel yatangijwe mu Rwanda izafasha abantu gufata amahoro.',
      image: 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'Umuziki',
      author: 'Sylvie Murekatete',
      publishedAt: 'Amasaha 6 ashize'
    },
    {
      id: 'music-4',
      title: 'Umuziki wa traditional ukomeje gufashwa',
      excerpt: 'Umuziki wa traditional ukomeje gufashwa n\'abantu benshi mu Rwanda.',
      image: 'https://images.pexels.com/photos/167092/pexels-photo-167092.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'Umuziki',
      author: 'Olivier Niyonshuti',
      publishedAt: 'Amasaha 8 ashize'
    }
  ];

  // Music images gallery
  const musicImages = [
    {
      id: 'img-1',
      title: 'Umuziki wa Kinyarwanda',
      image: 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Umuziki wa kinyarwanda ukomeje guteza imbere mu mahanga'
    },
    {
      id: 'img-2',
      title: 'Abahanzi b\'u Rwanda',
      image: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Abahanzi b\'u Rwanda bafasha guteza imbere umuziki'
    },
    {
      id: 'img-3',
      title: 'Umuziki wa Gospel',
      image: 'https://images.pexels.com/photos/167092/pexels-photo-167092.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Umuziki wa gospel ufasha abantu gufata amahoro'
    },
    {
      id: 'img-4',
      title: 'Umuziki wa Traditional',
      image: 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Umuziki wa traditional ukomeje gufashwa'
    },
    {
      id: 'img-5',
      title: 'Concert yo mu Rwanda',
      image: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Concert yo mu Rwanda izaba vuba'
    },
    {
      id: 'img-6',
      title: 'Album nshya',
      image: 'https://images.pexels.com/photos/167092/pexels-photo-167092.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Album nshya y\'umuziki wa kinyarwanda'
    }
  ];

  // Trending music topics
  const trendingMusic = [
    { id: 'trend-1', title: 'Umuziki wa Kinyarwanda', count: 245 },
    { id: 'trend-2', title: 'Abahanzi b\'u Rwanda', count: 189 },
    { id: 'trend-3', title: 'Umuziki wa Gospel', count: 156 },
    { id: 'trend-4', title: 'Concert yo mu Rwanda', count: 203 },
    { id: 'trend-5', title: 'Album nshya', count: 134 }
  ];

  // Quick links
  const quickLinks = [
    { name: 'Umuziki wa Kinyarwanda', href: '/music/kinyarwanda' },
    { name: 'Umuziki wa Gospel', href: '/music/gospel' },
    { name: 'Umuziki wa Traditional', href: '/music/traditional' },
    { name: 'Abahanzi b\'u Rwanda', href: '/music/artists' },
    { name: 'Concert yo mu Rwanda', href: '/music/concerts' }
  ];

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      {/* Hero Section with Music Image Background */}
      <div className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg?auto=compress&cs=tinysrgb&w=1200" 
            alt="Music Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e11]/80 via-[#0b0e11]/90 to-[#0b0e11]"></div>
        </div>
        
        {/* Animated elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#fcd535]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#1e2329] border border-[#2b2f36] px-4 py-2 rounded-full mb-6">
              <Music2 className="w-5 h-5 text-[#fcd535]" />
              <span className="text-[#fcd535] font-medium text-sm">Amakuru y'Umuziki</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Umuziki</h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">Amakuru y'umuziki wa kinyarwanda, gospel n'ibikorwa by'abahanzi</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] px-8 py-3.5 rounded-xl font-bold hover:from-[#f0b90b] hover:to-[#fcd535] transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Soma Amakuru
              </button>
              <button className="border-2 border-[#2b2f36] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#1e2329] hover:border-[#fcd535]/50 transition-all flex items-center justify-center gap-2">
                <Headphones className="w-5 h-5" />
                Menya Byinshi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Left */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured Music Articles */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-[#fcd535]/20 to-[#f0b90b]/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-[#fcd535]" />
                </div>
                <h2 className="text-2xl font-bold text-white">Amakuru Akomeye</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredMusic.map((article) => (
                  <article key={article.id} className="bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] hover:border-[#fcd535]/30 transition-all duration-300 group">
                    <div className="relative overflow-hidden">
                      <img src={article.image} alt={article.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e11] to-transparent opacity-60"></div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] px-3 py-1 rounded-full text-sm font-semibold">
                          {article.category}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="text-gray-300 text-sm">{article.author}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#fcd535] transition-colors cursor-pointer line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {article.publishedAt}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Music Images Gallery */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <span className="text-xl">🎵</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Amashusho y'Umuziki</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {musicImages.map((item) => (
                  <div key={item.id} className="bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] hover:border-pink-500/30 transition-all duration-300 group">
                    <div className="relative overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-[#0b0e11]/0 group-hover:bg-[#0b0e11]/50 transition-all duration-300 flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 transform scale-90 group-hover:scale-100">
                          Reba
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-white group-hover:text-pink-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Latest Music News */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Amakuru Mashya</h2>
                </div>
                <Link to="/music/news" className="text-[#fcd535] font-semibold hover:text-[#f0b90b] flex items-center gap-1 transition-colors">
                  Reba yose
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {latestMusic.map((article) => (
                  <article key={article.id} className="bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] hover:border-purple-500/30 transition-all duration-300 group flex flex-col sm:flex-row">
                    <div className="relative overflow-hidden sm:w-40 flex-shrink-0">
                      <img src={article.image} alt={article.title} className="w-full h-40 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="inline-block bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full mb-2 w-fit font-medium">
                        {article.category}
                      </span>
                      <h3 className="font-bold text-white mb-2 group-hover:text-purple-400 transition-colors cursor-pointer line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {article.publishedAt}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Special Features */}
            <section className="bg-gradient-to-r from-[#181a20] to-[#1e2329] rounded-2xl p-8 border border-[#2b2f36]">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">Ibikorwa By'Umuziki</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Music2 className="w-8 h-8 text-[#0b0e11]" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">Umuziki wa Kinyarwanda</h3>
                  <p className="text-gray-400 text-sm">Umuziki wa kinyarwanda ukomeje guteza imbere</p>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Headphones className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">Umuziki wa Gospel</h3>
                  <p className="text-gray-400 text-sm">Umuziki wa gospel ufasha abantu gufata amahoro</p>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">Concert yo mu Rwanda</h3>
                  <p className="text-gray-400 text-sm">Concert yo mu Rwanda izaba vuba</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Right */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trending Music Topics */}
            <div className="bg-[#181a20] rounded-2xl p-5 border border-[#2b2f36]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-[#fcd535]" />
                Ibintu Bikunzwe
              </h3>
              <div className="space-y-3">
                {trendingMusic.map((topic, index) => (
                  <div key={topic.id} className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-[#1e2329] transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold bg-gradient-to-r from-[#fcd535] to-[#f0b90b] bg-clip-text text-transparent">#{index + 1}</span>
                      <span className="font-medium text-gray-300 group-hover:text-[#fcd535] transition-colors">
                        {topic.title}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 bg-[#1e2329] px-2 py-1 rounded-lg">{topic.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-[#181a20] rounded-2xl p-5 border border-[#2b2f36]">
              <h3 className="text-xl font-bold text-white mb-4">Urupapuro Rusheshe</h3>
              <div className="space-y-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="flex items-center text-gray-400 hover:text-[#fcd535] py-2 px-3 rounded-lg hover:bg-[#1e2329] transition-all group"
                  >
                    <ChevronRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-gradient-to-br from-[#181a20] to-[#1e2329] rounded-2xl p-5 border border-[#2b2f36] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#fcd535]/10 rounded-full blur-2xl"></div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Kwakira Amakuru</h3>
              <p className="text-gray-400 mb-4 text-sm relative z-10">Kwakira amakuru y'umuziki wa kinyarwanda</p>
              <div className="space-y-3 relative z-10">
                <input
                  type="email"
                  placeholder="Imeyili yawe"
                  className="w-full px-4 py-3 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]/50 transition-all"
                />
                <button className="w-full bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] py-3 px-4 rounded-xl font-semibold hover:from-[#f0b90b] hover:to-[#fcd535] transition-all transform hover:scale-[1.02]">
                  Kwiyandikisha
                </button>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-[#181a20] rounded-2xl p-5 border border-[#2b2f36]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#fcd535]" />
                Ibikorwa Bizaza
              </h3>
              <div className="space-y-4">
                <div className="border-l-4 border-[#fcd535] pl-4 py-1">
                  <h4 className="font-semibold text-white">Concert yo mu Rwanda</h4>
                  <p className="text-sm text-gray-500">Kuwa 25 Ukuboza 2024</p>
                </div>
                <div className="border-l-4 border-pink-500 pl-4 py-1">
                  <h4 className="font-semibold text-white">Album nshya</h4>
                  <p className="text-sm text-gray-500">Kuwa 30 Ukuboza 2024</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4 py-1">
                  <h4 className="font-semibold text-white">Umuziki wa Gospel</h4>
                  <p className="text-sm text-gray-500">Kuwa 5 Mutarama 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Music;
