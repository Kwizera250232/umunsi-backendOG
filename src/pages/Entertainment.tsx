import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Calendar, ChevronRight, Sparkles, Film, Music2, Star, Users } from 'lucide-react';

const Entertainment = () => {
  const featuredArticles = [
    {
      id: 'feat-1',
      title: 'Artiste mashya w\'u Rwanda azana album nshya y\'umuziki wa kinyarwanda',
      excerpt: 'Album nshya izazana urwenya rw\'umuziki wa kinyarwanda mu buryo bushya.',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'Umuziki',
      author: 'Grace Uwase',
      publishedAt: 'Amasaha 2 ashize'
    },
    {
      id: 'feat-2',
      title: 'Ikinamico gishya cyerekana ubwoba bw\'imyambarire yo mu Rwanda',
      excerpt: 'Ikinamico gishya kizerekanwa muri cinema mu cyumweru kizaza.',
      image: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'Amashusho',
      author: 'Olivier Niyonshuti',
      publishedAt: 'Amasaha 5 ashize'
    }
  ];

  const entertainmentCategories = [
    { name: 'Umuziki', icon: Music2, color: 'from-pink-500 to-rose-500', count: 156 },
    { name: 'Ikinamico', icon: Film, color: 'from-purple-500 to-indigo-500', count: 89 },
    { name: 'Abakinnyi', icon: Star, color: 'from-[#fcd535] to-[#f0b90b]', count: 234 },
    { name: 'Ibikorwa', icon: Users, color: 'from-blue-500 to-cyan-500', count: 167 }
  ];

  const upcomingEvents = [
    { title: 'Umunsi w\'Umuziki wa Kinyarwanda', date: 'Kuwa 25 Ukuboza 2024', type: 'Umuziki' },
    { title: 'Ikinamico gishya', date: 'Kuwa 30 Ukuboza 2024', type: 'Ikinamico' },
    { title: 'Concert ya Gospel', date: 'Kuwa 5 Mutarama 2025', type: 'Concert' }
  ];

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-[#0b0e11]/80 to-[#0b0e11]"></div>
        
        {/* Animated elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#fcd535]/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#1e2329] border border-[#2b2f36] px-4 py-2 rounded-full mb-6">
              <Film className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400 font-medium text-sm">Imyidagaduro</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Ibikorwa by'Imyidagaduro</h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">Amakuru y'umuziki, ikinamico, amashusho n'ibikorwa by'imyidagaduro yo mu Rwanda</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] px-8 py-3.5 rounded-xl font-bold hover:from-[#f0b90b] hover:to-[#fcd535] transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Soma Amakuru
              </button>
              <button className="border-2 border-[#2b2f36] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#1e2329] hover:border-purple-500/50 transition-all flex items-center justify-center gap-2">
                Menya Byinshi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {entertainmentCategories.map((category) => (
            <div key={category.name} className="bg-[#181a20] rounded-2xl p-5 border border-[#2b2f36] hover:border-purple-500/30 transition-all duration-300 group cursor-pointer">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <category.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white mb-1">{category.name}</h3>
              <p className="text-gray-500 text-sm">{category.count} amakuru</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Left */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured Articles */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Amakuru Akomeye</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredArticles.map((article) => (
                  <article key={article.id} className="bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] hover:border-purple-500/30 transition-all duration-300 group">
                    <div className="relative overflow-hidden">
                      <img src={article.image} alt={article.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e11] via-transparent to-transparent opacity-80"></div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {article.category}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors cursor-pointer">
                        {article.title}
                      </h3>
                        <p className="text-gray-300 text-sm line-clamp-2">
                        {article.excerpt}
                      </p>
                      </div>
                    </div>
                    <div className="p-4 border-t border-[#2b2f36]">
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

            {/* Special Features */}
            <section className="bg-gradient-to-r from-[#181a20] to-[#1e2329] rounded-2xl p-8 border border-[#2b2f36] relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl"></div>
              <h2 className="text-2xl font-bold text-white mb-8 text-center relative z-10">Ibikorwa by'Imyidagaduro</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/20">
                    <Music2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">Umuziki wa Kinyarwanda</h3>
                  <p className="text-gray-400 text-sm">Guteza imbere umuziki wa kinyarwanda</p>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                    <Film className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">Ikinamico n'Amashusho</h3>
                  <p className="text-gray-400 text-sm">Guteza imbere ikinamico n'amashusho</p>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-[#fcd535]/20">
                    <Star className="w-8 h-8 text-[#0b0e11]" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">Abahanzi b'u Rwanda</h3>
                  <p className="text-gray-400 text-sm">Gufasha abahanzi b'u Rwanda</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Right */}
          <div className="lg:col-span-1 space-y-6">
            {/* Newsletter Signup */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-5 border border-purple-500/20 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Kwakira Amakuru</h3>
              <p className="text-gray-400 mb-4 text-sm relative z-10">Kwakira amakuru y'ibikorwa by'imyidagaduro</p>
              <div className="space-y-3 relative z-10">
                <input
                  type="email"
                  placeholder="Imeyili yawe"
                  className="w-full px-4 py-3 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-[1.02]">
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
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="border-l-4 border-purple-500 pl-4 py-2 hover:bg-[#1e2329] rounded-r-lg transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{event.type}</span>
                    </div>
                    <h4 className="font-semibold text-white">{event.title}</h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {event.date}
                    </p>
                  </div>
                ))}
                </div>
                </div>

            {/* Quick Links */}
            <div className="bg-[#181a20] rounded-2xl p-5 border border-[#2b2f36]">
              <h3 className="text-xl font-bold text-white mb-4">Amakuru Mashya</h3>
              <div className="space-y-3">
                {['Umuziki', 'Ikinamico', 'Amashusho', 'Abakinnyi'].map((link) => (
                  <Link
                    key={link}
                    to={`/entertainment/${link.toLowerCase()}`}
                    className="flex items-center justify-between text-gray-400 hover:text-purple-400 py-2 px-3 rounded-lg hover:bg-[#1e2329] transition-all group"
                  >
                    <span>{link}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Entertainment;
