import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, Calendar, ChevronRight, Sparkles, BookOpen, Users, Globe, TrendingUp } from 'lucide-react';

const Religion = () => {
  // Featured articles
  const featuredArticles = [
    {
      id: 'feat-1',
      title: 'Abayobozi b\'Imyemeramikire bavugana ku buzima bwa buri munsi n\'ubumwe',
      excerpt: 'Abayobozi b\'imyemeramikire yo mu Rwanda basanze mu nama yo gusuzuma uko bashobora gufasha abaturage mu buzima bwabo bwa buri munsi.',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'Iyobokamana',
      author: 'Pasteur Jean Baptiste Ndayisenga',
      publishedAt: 'Amasaha 2 ashize',
      featured: true
    },
    {
      id: 'feat-2',
      title: 'Inyandiko z\'Imyemeramikire zerekana amakuru mashya y\'amateka n\'umuco',
      excerpt: 'Ubushakashatsi bushya bw\'inyandiko z\'imyemeramikire z\'ikinyagihugu bizafasha kumenya amateka n\'umuco wa Rwanda.',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'Iyobokamana',
      author: 'Dr. Marie Claire Uwimana',
      publishedAt: 'Amasaha 5 ashize',
      featured: true
    }
  ];

  // Latest news
  const latestNews = [
    {
      id: 'news-1',
      title: 'Imyemeramikire itangiza gahunda nshya zo gufasha abakeneye',
      excerpt: 'Imyemeramikire yo mu Rwanda itangije gahunda nshya zo gufasha abantu bakeneye mu buzima bwabo bwa buri munsi.',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'Iyobokamana',
      author: 'Pasteur Peter Nzeyimana',
      publishedAt: 'Amasaha 1 ashize'
    },
    {
      id: 'news-2',
      title: 'Gusuzuma uruhare rw\'Imyemeramikire mu guteza imbere amahoro n\'ubumwe',
      excerpt: 'Ubushakashatsi bushya busuzuma uko imyemeramikire ishobora gufasha guteza imbere amahoro n\'ubumwe hagati y\'abantu.',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'Iyobokamana',
      author: 'Dr. Sarah Uwase',
      publishedAt: 'Amasaha 3 ashize'
    },
    {
      id: 'news-3',
      title: 'Umunsi w\'Imyemeramikire n\'ubusobanura bw\'umuco ku Rwanda',
      excerpt: 'Umunsi w\'imyemeramikire uzaba vuba, aho abanyarwanda bazizihiza ubusobanura bw\'umuco n\'imyemeramikire.',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'Iyobokamana',
      author: 'Prof. David Niyonshuti',
      publishedAt: 'Amasaha 6 ashize'
    },
    {
      id: 'news-4',
      title: 'Abayobozi b\'Imyemeramikire bavugana ku buzima bwa buri munsi',
      excerpt: 'Abayobozi b\'imyemeramikire yo mu Rwanda basanze mu nama yo gusuzuma uko bashobora gufasha abaturage.',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'Iyobokamana',
      author: 'Pasteur Jean Baptiste Ndayisenga',
      publishedAt: 'Amasaha 8 ashize'
    }
  ];

  // Religious images gallery
  const religiousImages = [
    {
      id: 'img-1',
      title: 'Imyemeramikire yo mu Rwanda',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Imyemeramikire yo mu Rwanda ikomeje guteza imbere amahoro n\'ubumwe'
    },
    {
      id: 'img-2',
      title: 'Inyandiko z\'Imyemeramikire',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Inyandiko z\'imyemeramikire zerekana amateka n\'umuco wa Rwanda'
    },
    {
      id: 'img-3',
      title: 'Abayobozi b\'Imyemeramikire',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Abayobozi b\'imyemeramikire bafasha abaturage mu buzima bwabo'
    },
    {
      id: 'img-4',
      title: 'Amahoro n\'Ubumwe',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Imyemeramikire ikomeje guteza imbere amahoro n\'ubumwe'
    },
    {
      id: 'img-5',
      title: 'Ubuzima bwa buri munsi',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Gufasha abantu mu buzima bwabo bwa buri munsi'
    },
    {
      id: 'img-6',
      title: 'Umunsi w\'Imyemeramikire',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Umunsi w\'imyemeramikire uzaba vuba'
    }
  ];

  // Trending topics
  const trendingTopics = [
    { id: 'trend-1', title: 'Umunsi w\'Imyemeramikire', count: 245 },
    { id: 'trend-2', title: 'Amahoro n\'Ubumwe', count: 189 },
    { id: 'trend-3', title: 'Ubuzima bwa buri munsi', count: 156 },
    { id: 'trend-4', title: 'Inyandiko z\'Imyemeramikire', count: 203 },
    { id: 'trend-5', title: 'Abayobozi b\'Imyemeramikire', count: 134 }
  ];

  // Quick links
  const quickLinks = [
    { name: 'Amahoro n\'Ubumwe', href: '/religion/peace' },
    { name: 'Ubuzima bwa buri munsi', href: '/religion/life' },
    { name: 'Inyandiko z\'Imyemeramikire', href: '/religion/scriptures' },
    { name: 'Abayobozi b\'Imyemeramikire', href: '/religion/leaders' },
    { name: 'Umunsi w\'Imyemeramikire', href: '/religion/holidays' }
  ];

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/30 via-[#0b0e11]/80 to-[#0b0e11]"></div>
        
        {/* Animated elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#1e2329] border border-[#2b2f36] px-4 py-2 rounded-full mb-6">
              <Heart className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-medium text-sm">Imyemeramikire</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Iyobokamana</h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">Amakuru y'imyemeramikire, amahoro n'ubuzima bwa buri munsi</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] px-8 py-3.5 rounded-xl font-bold hover:from-[#f0b90b] hover:to-[#fcd535] transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                Soma Amakuru
              </button>
              <button className="border-2 border-[#2b2f36] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#1e2329] hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2">
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
            {/* Featured Articles */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Amakuru Akomeye</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredArticles.map((article) => (
                  <article key={article.id} className="bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] hover:border-emerald-500/30 transition-all duration-300 group">
                    <div className="relative overflow-hidden">
                      <img src={article.image} alt={article.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e11] to-transparent opacity-60"></div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors cursor-pointer line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{article.author}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.publishedAt}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Religious Images Gallery */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <span className="text-xl">🙏</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Amashusho y'Imyemeramikire</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {religiousImages.map((item) => (
                  <div key={item.id} className="bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] hover:border-teal-500/30 transition-all duration-300 group">
                    <div className="relative overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-[#0b0e11]/0 group-hover:bg-[#0b0e11]/50 transition-all duration-300 flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 transform scale-90 group-hover:scale-100">
                          Reba
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-white group-hover:text-emerald-400 transition-colors">
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

            {/* Latest News */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Amakuru Mashya</h2>
                </div>
                <Link to="/religion/news" className="text-[#fcd535] font-semibold hover:text-[#f0b90b] flex items-center gap-1 transition-colors">
                  Reba yose
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {latestNews.map((article) => (
                  <article key={article.id} className="bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] hover:border-emerald-500/30 transition-all duration-300 group flex flex-col sm:flex-row">
                    <div className="relative overflow-hidden sm:w-40 flex-shrink-0">
                      <img src={article.image} alt={article.title} className="w-full h-40 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full mb-2 w-fit font-medium">
                        {article.category}
                      </span>
                      <h3 className="font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors cursor-pointer line-clamp-2">
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
            <section className="bg-gradient-to-r from-[#181a20] to-[#1e2329] rounded-2xl p-8 border border-[#2b2f36] relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl"></div>
              <h2 className="text-2xl font-bold text-white mb-8 text-center relative z-10">Ibikorwa By'Imyemeramikire</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-rose-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-rose-500/20">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">Amahoro n'Ubumwe</h3>
                  <p className="text-gray-400 text-sm">Gufasha guteza imbere amahoro n'ubumwe hagati y'abantu</p>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">Inyandiko z'Imyemeramikire</h3>
                  <p className="text-gray-400 text-sm">Gusuzuma n'gusobanura inyandiko z'imyemeramikire</p>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-[#fcd535]/20">
                    <Users className="w-8 h-8 text-[#0b0e11]" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">Ubuzima bwa buri munsi</h3>
                  <p className="text-gray-400 text-sm">Gufasha abantu mu buzima bwabo bwa buri munsi</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Right */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trending Topics */}
            <div className="bg-[#181a20] rounded-2xl p-5 border border-[#2b2f36]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-[#fcd535]" />
                Ibintu Bikunzwe
              </h3>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={topic.id} className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-[#1e2329] transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">#{index + 1}</span>
                      <span className="font-medium text-gray-300 group-hover:text-emerald-400 transition-colors">
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
                    className="flex items-center text-gray-400 hover:text-emerald-400 py-2 px-3 rounded-lg hover:bg-[#1e2329] transition-all group"
                  >
                    <ChevronRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-2xl p-5 border border-emerald-500/20 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Kwakira Amakuru</h3>
              <p className="text-gray-400 mb-4 text-sm relative z-10">Kwakira amakuru y'imyemeramikire yo mu Rwanda</p>
              <div className="space-y-3 relative z-10">
                <input
                  type="email"
                  placeholder="Imeyili yawe"
                  className="w-full px-4 py-3 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
                <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all transform hover:scale-[1.02]">
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
                <div className="border-l-4 border-emerald-500 pl-4 py-2 hover:bg-[#1e2329] rounded-r-lg transition-colors cursor-pointer">
                  <h4 className="font-semibold text-white">Umunsi w'Imyemeramikire</h4>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    Kuwa 25 Ukuboza 2024
                  </p>
                </div>
                <div className="border-l-4 border-teal-500 pl-4 py-2 hover:bg-[#1e2329] rounded-r-lg transition-colors cursor-pointer">
                  <h4 className="font-semibold text-white">Inama y'Abayobozi</h4>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    Kuwa 30 Ukuboza 2024
                  </p>
                </div>
                <div className="border-l-4 border-[#fcd535] pl-4 py-2 hover:bg-[#1e2329] rounded-r-lg transition-colors cursor-pointer">
                  <h4 className="font-semibold text-white">Gahunda yo Gufasha</h4>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    Kuwa 5 Mutarama 2025
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Religion;
