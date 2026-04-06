import { useState } from 'react';
import { Search, Filter, Grid, List, Image, Camera, Download, Heart, Eye, ChevronDown } from 'lucide-react';

const Images = () => {
  // All images from the news content
  const allImages = [
    {
      id: 'must-1',
      src: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=300&fit=crop',
      title: 'Inama Nkuru y\'u Rwanda yemeje politiki nshya y\'ubukungu',
      category: 'Politiki',
      description: 'Politiki nshya izagira ingaruka ku bakunzi b\'amahanga n\'ubukungu bw\'igihugu mu gihe kiri imbere.',
      views: 1245,
      likes: 89
    },
    {
      id: 'must-2',
      src: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop',
      title: 'APR FC yaronse amashampiyona mu rukino rukomeye',
      category: 'Siporo',
      description: 'Ikipe ya APR yaronse amashampiyona y\'akarere nyuma yo gutsinda ku makipe menshi.',
      views: 2341,
      likes: 156
    },
    {
      id: 'must-3',
      src: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      title: 'Igikorwa gishya cyo kuraguza ubwoba bw\'indwara',
      category: 'Ubuzima',
      description: 'Minisitere y\'ubuzima yatangije gahunda yo kuraguza ubwoba bw\'indwara mu baturage.',
      views: 987,
      likes: 67
    },
    {
      id: 'must-4',
      src: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=400&h=300&fit=crop',
      title: 'Tekinoroji nshya y\'ubuhinga izashyirwa mu bikorwa',
      category: 'Tekinoroji',
      description: 'Abahinzi bazabona amahirwe yo gukoresha tekinoroji nshya mu buzima bwabo bwa buri munsi.',
      views: 1567,
      likes: 112
    },
    {
      id: 'sport-1',
      src: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
      title: 'Rayon Sports itegura urugendo rwa CAF Champions League',
      category: 'Siporo',
      description: 'Ikipe ya Rayon Sports irateguye kurugendo rwa CAF Champions League mu gihe kiri imbere.',
      views: 1890,
      likes: 134
    },
    {
      id: 'sport-2',
      src: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=300&fit=crop',
      title: 'Abakinnyi b\'u Rwanda bateguye Nyuma Afrika',
      category: 'Siporo',
      description: 'Ikipe y\'igihugu irateguye gukina mu mukino wa Nyuma Afrika uzabera vuba.',
      views: 1456,
      likes: 98
    },
    {
      id: 'sport-3',
      src: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
      title: 'Basketball: Patriots yatsinze ku mukino wa nyuma',
      category: 'Siporo',
      description: 'Ikipe ya Patriots yagaragaje imyitozo myiza mu mukino wa basketball.',
      views: 2100,
      likes: 178
    },
    {
      id: 'ent-1',
      src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      title: 'Artiste mashya w\'u Rwanda azana album nshya',
      category: 'Umuziki',
      description: 'Album nshya izazana urwenya rw\'umuziki wa kinyarwanda mu buryo bushya.',
      views: 3245,
      likes: 267
    },
    {
      id: 'ent-2',
      src: 'https://images.unsplash.com/photo-1489599763687-2fb2d1bfff15?w=400&h=300&fit=crop',
      title: 'Ikinamico gishya cyerekana ubwoba bw\'imyambarire',
      category: 'Amashusho',
      description: 'Ikinamico gishya kizerekanwa muri cinema mu cyumweru kizaza.',
      views: 1678,
      likes: 143
    },
    {
      id: 'health-1',
      src: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      title: 'Ubuvuzi bushya bw\'indwara z\'umutima buzaza mu Rwanda',
      category: 'Ubuzima',
      description: 'Tekinoroji nshya y\'ubuvuzi izafasha abarwayi b\'umutima gukira vuba.',
      views: 890,
      likes: 56
    },
    {
      id: 'health-2',
      src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
      title: 'Gahunda yo kurinda indwara z\'amoko azatangira',
      category: 'Ubuzima',
      description: 'Minisitere y\'ubuzima itegura gahunda yo gukumira indwara z\'amoko.',
      views: 756,
      likes: 45
    }
  ];

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<typeof allImages[0] | null>(null);

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(allImages.map(img => img.category)))];

  // Filter images based on category and search term
  const filteredImages = allImages.filter(img => {
    const matchesCategory = selectedCategory === 'All' || img.category === selectedCategory;
    const matchesSearch = img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         img.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         img.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Politiki': 'from-red-500 to-rose-500',
      'Siporo': 'from-blue-500 to-cyan-500',
      'Ubuzima': 'from-emerald-500 to-teal-500',
      'Tekinoroji': 'from-purple-500 to-indigo-500',
      'Umuziki': 'from-pink-500 to-rose-500',
      'Amashusho': 'from-amber-500 to-orange-500'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#1e2329] border border-[#2b2f36] px-4 py-2 rounded-full mb-6">
            <Camera className="w-5 h-5 text-[#fcd535]" />
            <span className="text-[#fcd535] font-medium text-sm">Amashusho</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Amashusho Yose</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">Reba amashusho yose yo mu makuru y'Umunsi</p>
        </div>

        {/* Filters */}
        <div className="bg-[#181a20] rounded-2xl p-6 mb-8 border border-[#2b2f36]">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Shaka amashusho..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#1e2329] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]/50 transition-all"
              />
              </div>
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 bg-[#1e2329] border border-[#2b2f36] rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]/50 transition-all cursor-pointer"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-[#1e2329]">{category}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-[#1e2329] rounded-xl p-1 border border-[#2b2f36]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11]' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11]' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              <span className="text-[#fcd535] font-bold">{filteredImages.length}</span> amashusho {selectedCategory !== 'All' && `yo mu bwoko bwa ${selectedCategory}`}
            </p>
            <div className="flex items-center gap-2">
              {categories.slice(1).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat 
                      ? 'bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11]' 
                      : 'bg-[#1e2329] text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Images Grid */}
        {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
              <div 
                key={image.id} 
                className="bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] hover:border-[#fcd535]/30 transition-all duration-300 group cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative overflow-hidden">
                <img 
                  src={image.src} 
                  alt={image.title} 
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e11] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center justify-between text-white text-sm">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {image.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {image.likes}
                      </span>
                    </div>
                  </div>
                  <button className="absolute top-3 right-3 p-2 bg-[#0b0e11]/60 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[#fcd535] hover:text-[#0b0e11] text-white">
                    <Download className="w-4 h-4" />
                  </button>
              </div>
              <div className="p-4">
                  <span className={`inline-block bg-gradient-to-r ${getCategoryColor(image.category)} text-white text-xs px-2 py-1 rounded-full mb-2 font-medium`}>
                  {image.category}
                </span>
                  <h3 className="font-bold text-white mb-2 group-hover:text-[#fcd535] transition-colors line-clamp-2">
                  {image.title}
                </h3>
                  <p className="text-gray-400 text-sm line-clamp-2">
                  {image.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="space-y-4">
            {filteredImages.map((image) => (
              <div 
                key={image.id} 
                className="bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] hover:border-[#fcd535]/30 transition-all duration-300 group cursor-pointer flex"
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative overflow-hidden w-48 flex-shrink-0">
                  <img 
                    src={image.src} 
                    alt={image.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-center">
                  <span className={`inline-block bg-gradient-to-r ${getCategoryColor(image.category)} text-white text-xs px-2 py-1 rounded-full mb-2 font-medium w-fit`}>
                    {image.category}
                  </span>
                  <h3 className="font-bold text-white text-lg mb-2 group-hover:text-[#fcd535] transition-colors">
                    {image.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {image.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {image.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {image.likes}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex items-center">
                  <button className="p-3 bg-[#1e2329] rounded-xl hover:bg-[#fcd535] hover:text-[#0b0e11] text-gray-400 transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {filteredImages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#1e2329] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Image className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nta mashusho yabonetse</h3>
            <p className="text-gray-400">Gerageza guhindura amahitamo yawe cyangwa ijambo ry'ushaka</p>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-[#0b0e11]/95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="bg-[#181a20] rounded-2xl overflow-hidden max-w-4xl w-full border border-[#2b2f36]"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage.src} 
                alt={selectedImage.title} 
                className="w-full h-[400px] object-cover"
              />
              <div className="p-6">
                <span className={`inline-block bg-gradient-to-r ${getCategoryColor(selectedImage.category)} text-white text-sm px-3 py-1 rounded-full mb-3 font-medium`}>
                  {selectedImage.category}
                </span>
                <h3 className="text-2xl font-bold text-white mb-3">{selectedImage.title}</h3>
                <p className="text-gray-400 mb-4">{selectedImage.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-gray-400">
                    <span className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      {selectedImage.views} views
                    </span>
                    <span className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      {selectedImage.likes} likes
                    </span>
                  </div>
                  <button className="flex items-center gap-2 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] px-4 py-2 rounded-xl font-semibold hover:from-[#f0b90b] hover:to-[#fcd535] transition-all">
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Images;
