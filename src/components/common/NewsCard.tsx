import { Link } from 'react-router-dom';
import { Clock, User } from 'lucide-react';

interface NewsCardProps {
  id: string;
  title: string;
  excerpt?: string;
  image: string;
  category: string;
  author: string;
  publishedAt: string;
  size?: 'small' | 'medium' | 'large';
  layout?: 'horizontal' | 'vertical';
}

const NewsCard = ({
  id,
  title,
  excerpt,
  image,
  category,
  author,
  publishedAt,
  size = 'medium',
  layout = 'vertical'
}: NewsCardProps) => {

  const getCategoryColor = (cat: string) => {
    const colors: { [key: string]: string } = {
      'Televiziyo': 'bg-blue-100 text-blue-800',
      'Amashusho': 'bg-purple-100 text-purple-800',
      'Umuziki': 'bg-pink-100 text-pink-800',
      'Siporo': 'bg-orange-100 text-orange-800',
      'Politiki': 'bg-red-100 text-red-800',
      'Ubuzima': 'bg-green-100 text-green-800',
      'Abakinnyi': 'bg-yellow-100 text-yellow-800',
      'Ibikorwa': 'bg-indigo-100 text-indigo-800'
    };
    return colors[cat] || 'bg-gray-100 text-gray-800';
  };

  const cardClasses = layout === 'horizontal' ? 'flex items-center space-x-4' : 'block';

  // Adjusted image classes for smaller sizes and mobile responsiveness
  const imageClasses = () => {
    if (layout === 'horizontal') {
      return 'w-24 h-16 flex-shrink-0 sm:w-20 sm:h-14 md:w-24 md:h-16 lg:w-28 lg:h-18';
    } else {
      switch (size) {
        case 'small': return 'w-full h-32 sm:h-28 md:h-36 lg:h-40';
        case 'medium': return 'w-full h-40 sm:h-36 md:h-48 lg:h-56';
        case 'large': return 'w-full h-56 sm:h-48 md:h-64 lg:h-80';
        default: return 'w-full h-40 sm:h-36 md:h-48 lg:h-56';
      }
    }
  };

  // Adjusted title classes for smaller sizes and mobile responsiveness
  const titleClasses = () => {
    switch (size) {
      case 'small': return 'text-sm font-semibold leading-tight sm:text-xs md:text-sm lg:text-base';
      case 'medium': return 'text-base font-semibold leading-tight sm:text-sm md:text-base lg:text-lg';
      case 'large': return 'text-xl font-bold leading-tight sm:text-lg md:text-xl lg:text-2xl';
      default: return 'text-base font-semibold leading-tight sm:text-sm md:text-base lg:text-lg';
    }
  };

  return (
    <article className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${cardClasses}`}>
      <Link to={`/article/${id}`} className={`block ${layout === 'horizontal' ? 'flex w-full' : ''}`}>
        {/* Image */}
        <div className={`${imageClasses()} bg-gray-200 overflow-hidden`}><img src={image} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"/></div>
        {/* Content */}
        <div className={`p-3 ${layout === 'horizontal' ? 'flex-1 flex flex-col justify-center' : ''}`}>
          <div className="flex items-center justify-between mb-1 sm:mb-0.5"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium sm:text-xxs ${getCategoryColor(category)}`}>{category}</span>{size === 'large' && (<div className="flex items-center text-xs text-gray-500 space-x-1 sm:text-xxs"><Clock size={10}/><span>{publishedAt}</span></div>)}</div>

          {/* Title */}
          <h3 className={`${titleClasses()} text-gray-900 line-clamp-2 hover:text-green-600 transition-colors mb-2`}>
            {title}
          </h3>

          {/* Excerpt - only for medium and large */}
          {excerpt && (size === 'medium' || size === 'large') && (<p className="text-sm text-gray-600 line-clamp-2 mb-2 sm:text-xs">
              {excerpt}</p>)}

          {/* Meta info */}
          <div className="flex items-center justify-between text-xs text-gray-500 sm:text-xxs">
            <div className="flex items-center space-x-1"><User size={10}/>
              <span>{author}</span>
            </div>
            {size !== 'large' && (
              <span>{publishedAt}</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
};

export default NewsCard;
