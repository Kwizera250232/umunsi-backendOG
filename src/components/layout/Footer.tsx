import { Link } from 'react-router-dom';
import { Mail, Phone, Facebook, Twitter, Instagram, Youtube, Heart, MapPin, Clock, Send, ChevronRight, Sparkles } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Iyobokamana', href: '/religion' },
    { name: 'Umuziki', href: '/music' },
    { name: 'Ibikorwa', href: '/entertainment' },
    { name: 'Siporo', href: '/sports' },
    { name: 'Politiki', href: '/politics' },
    { name: 'Ubuzima', href: '/health' }
  ];

  const legalLinks = [
    { name: 'Twebwe', href: '/about' },
    { name: 'Twandikire', href: '/contact' },
    { name: 'Amabanga', href: '/privacy' },
    { name: 'Amategeko', href: '/terms' }
  ];

  return (
    <footer className="bg-[#0b0e11] border-t border-[#2b2f36]">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4 group">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-[#fcd535]/20 to-[#f0b90b]/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img src="/images/logo.png" alt="Umunsi Logo" className="h-10 relative" />
              </div>
            </Link>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Amakuru y'ukuri, y'igihe. Urubuga rwo gufata amakuru yo mu Rwanda no mu mahanga.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <a href="mailto:info@umunsi.rw" className="flex items-center text-gray-400 hover:text-[#fcd535] transition-colors">
                <Mail size={14} className="mr-2" />
                info@umunsi.rw
              </a>
              <a href="tel:+250788000000" className="flex items-center text-gray-400 hover:text-[#fcd535] transition-colors">
                <Phone size={14} className="mr-2" />
                +250 788 000 000
              </a>
              <div className="flex items-center text-gray-400">
                <MapPin size={14} className="mr-2" />
                Kigali, Rwanda
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4 flex items-center">
              <Sparkles size={16} className="mr-2 text-[#fcd535]" />
              Amakuru
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-[#fcd535] text-sm transition-colors flex items-center group"
                  >
                    <ChevronRight size={14} className="mr-1 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                    {link.name}
            </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-bold mb-4 flex items-center">
              <Sparkles size={16} className="mr-2 text-[#fcd535]" />
              Amabwiriza
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-[#fcd535] text-sm transition-colors flex items-center group"
                  >
                    <ChevronRight size={14} className="mr-1 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                    {link.name}
            </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Section */}
          <div>
            <h3 className="text-white font-bold mb-4 flex items-center">
              <Sparkles size={16} className="mr-2 text-[#fcd535]" />
              Inyandiko
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Kwakira amakuru mashya ya buri munsi
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Imeyili yawe"
                className="flex-1 bg-[#1e2329] border border-[#2b2f36] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]/50 transition-all"
              />
              <button className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] p-2.5 rounded-lg hover:from-[#f0b90b] hover:to-[#fcd535] transition-all transform hover:scale-105">
                <Send size={18} />
              </button>
            </div>

            {/* Social Media */}
            <div className="mt-6">
              <p className="text-gray-400 text-sm mb-3">Dukurikire</p>
          <div className="flex items-center space-x-2">
            <a
              href="https://facebook.com/umunsi"
                  className="p-2.5 bg-[#1e2329] text-gray-400 hover:text-white hover:bg-[#1877F2] transition-all duration-200 rounded-lg"
              aria-label="Facebook"
            >
                  <Facebook size={18} />
            </a>
            <a
              href="https://twitter.com/umunsi"
                  className="p-2.5 bg-[#1e2329] text-gray-400 hover:text-white hover:bg-[#1DA1F2] transition-all duration-200 rounded-lg"
              aria-label="Twitter"
            >
                  <Twitter size={18} />
            </a>
            <a
              href="https://instagram.com/umunsi"
                  className="p-2.5 bg-[#1e2329] text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] transition-all duration-200 rounded-lg"
              aria-label="Instagram"
            >
                  <Instagram size={18} />
            </a>
            <a
              href="https://youtube.com/umunsi"
                  className="p-2.5 bg-[#1e2329] text-gray-400 hover:text-white hover:bg-[#FF0000] transition-all duration-200 rounded-lg"
              aria-label="YouTube"
            >
                  <Youtube size={18} />
            </a>
              </div>
            </div>
          </div>
          </div>
        </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#2b2f36]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs flex items-center">
            © {currentYear} Umunsi 
              <Heart size={12} className="mx-1.5 text-[#fcd535]" fill="currentColor" /> 
            Uburenganzira bwose bucunguwe
          </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center">
                <Clock size={12} className="mr-1" />
                Koneza: Ubu
              </span>
              <span className="w-px h-3 bg-[#2b2f36]"></span>
              <span>Rwanda 🇷🇼</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
