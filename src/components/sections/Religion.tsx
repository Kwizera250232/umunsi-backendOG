import React from 'react';
import NewsCard from '../common/NewsCard';

interface Article {
  id: string;
  title: string;
  image: string;
  category: string;
  author: string;
  publishedAt: string;
  excerpt?: string;
}

interface ReligionProps {
  // Define props if needed
}

const Religion: React.FC<ReligionProps> = () => {
  const articles: Article[] = [
    {
      id: '1',
      title: 'Faith leaders discuss community support and interfaith dialogue',
      image: 'https://images.unsplash.com/photo-1462965326608-53f731553790?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmVsaWdpb258ZW58MHx8MHx8fDA%3D',
      category: 'Iyobokamana',
      author: 'John Doe',
      publishedAt: 'Amasaha 3 ashize',
      excerpt: 'Faith leaders from different communities come together to discuss ways to support their communities and promote interfaith dialogue.'
    },
    {
      id: '2',
      title: 'Ancient religious texts reveal new historical and cultural insights',
      image: 'https://images.unsplash.com/photo-1478115617857-537b11303729?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHJlbGlnaW9ufGVufDB8fDB8fHww%3D',
      category: 'Iyobokamana',
      author: 'Jane Smith',
      publishedAt: 'Amasaha 7 ashize',
      excerpt: 'New discoveries in ancient religious texts provide fresh perspectives on historical events and cultural practices.'
    },
    {
      id: '3',
      title: 'Religious organizations launch new charitable initiatives to help the needy',
      image: 'https://images.unsplash.com/photo-1619683684416-f65836586e0c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHJlbGlnaW9ufGVufDB8fDB8fHww%3D',
      category: 'Iyobokamana',
      author: 'Peter Jones',
      publishedAt: 'Umunsi 1 ushize',
      excerpt: 'Religious organizations across the country are launching new initiatives to provide support and assistance to those in need.'
    },
    {
      id: '4',
      title: 'Exploring the role of faith in promoting peace and understanding',
      image: 'https://images.unsplash.com/photo-1494178270175-ef09cf2ed2fd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHJlbGlnaW9ufGVufDB8fDB8fHww%3D',
      category: 'Iyobokamana',
      author: 'Sarah Brown',
      publishedAt: 'Umunsi 2 ushize',
      excerpt: 'A new study explores how faith communities can play a vital role in promoting peace and understanding among different groups.'
    },
    {
      id: '5',
      title: 'Religious holidays and their cultural significance around the world',
      image: 'https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzB8fHJlbGlnaW9ufGVufDB8fDB8fHww%3D',
      category: 'Iyobokamana',
      author: 'David Green',
      publishedAt: 'Ibyumweru 2 bishize',
      excerpt: 'A comprehensive look at religious holidays celebrated around the world and their deep cultural and spiritual significance.'
    }
  ];

  return (
    <section className="py-8 lg:py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 lg:mb-8">Iyobokamana</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              id={article.id}
              title={article.title}
              image={article.image}
              category={article.category}
              author={article.author}
              publishedAt={article.publishedAt}
              excerpt={article.excerpt}
              size="medium"
              layout="vertical"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Religion;