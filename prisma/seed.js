const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Sample data for seeding
const sampleCategories = [
  {
    name: 'Siporo',
    slug: 'siporo',
    description: 'Sports news and updates from Rwanda and around the world',
    color: '#EF4444',
    icon: '🏃‍♂️'
  },
  {
    name: 'Iyobokamana',
    slug: 'iyobokamana',
    description: 'Gospel and religious content',
    color: '#3B82F6',
    icon: '⛪'
  },
  {
    name: 'Umuziki',
    slug: 'umuziki',
    description: 'Music industry news and updates',
    color: '#EC4899',
    icon: '🎵'
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Technology trends and innovations',
    color: '#8B5CF6',
    icon: '💻'
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Business and economic news',
    color: '#10B981',
    icon: '💼'
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Educational content and academic news',
    color: '#F59E0B',
    icon: '📚'
  },
  {
    name: 'Health',
    slug: 'health',
    description: 'Health and wellness information',
    color: '#06B6D4',
    icon: '🏥'
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Entertainment and lifestyle news',
    color: '#84CC16',
    icon: '🎬'
  }
];

const sampleUsers = [
  {
    email: 'admin@umunsi.com',
    username: 'admin',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    avatar: null,
    isActive: true
  },
  {
    email: 'editor@umunsi.com',
    username: 'editor',
    password: 'editor123',
    firstName: 'Editor',
    lastName: 'User',
    role: 'EDITOR',
    avatar: null,
    isActive: true
  },
  {
    email: 'author1@umunsi.com',
    username: 'author1',
    password: 'author123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'AUTHOR',
    avatar: null,
    isActive: true
  },
  {
    email: 'author2@umunsi.com',
    username: 'author2',
    password: 'author123',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'AUTHOR',
    avatar: null,
    isActive: true
  },
  {
    email: 'author3@umunsi.com',
    username: 'author3',
    password: 'author123',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: 'AUTHOR',
    avatar: null,
    isActive: true
  }
];

const sampleArticles = [
  {
    title: 'Umunsi wa Kinyarwanda 2024: Abanyarwanda basanze mu minsi 30',
    slug: 'umunsi-wa-kinyarwanda-2024',
    content: `U Rwanda rwizihije umunsi w'ubumwe n'ubwiyongere. Abanyarwanda bose basanze mu minsi 30 bashimishwa kwizihiza umunsi w'ubumwe n'ubwiyongere.

Iyi nshingano y'ubumwe n'ubwiyongere yatangiye kandi ikomeje gutera imbere. Abanyarwanda bose bakomeje gusangira amahoro n'ubumwe mu Rwanda.

Mu izihizo rya 2024, abanyarwanda bose bashimishwa kwizihiza umunsi w'ubumwe n'ubwiyongere. Iyi nshingano y'ubumwe n'ubwiyongere yatangiye kandi ikomeje gutera imbere.`,
    excerpt: 'U Rwanda rwizihije umunsi w\'ubumwe n\'ubwiyongere. Abanyarwanda bose basanze mu minsi 30 bashimishwa kwizihiza umunsi w\'ubumwe n\'ubwiyongere.',
    status: 'PUBLISHED',
    isFeatured: true,
    isBreaking: true,
    viewCount: 1250,
    likeCount: 89,
    categorySlug: 'siporo'
  },
  {
    title: 'Imyemeramikire yo mu Rwanda ikomeje guteza imbere amahoro n\'ubumwe',
    slug: 'imyemeramikire-yo-mu-rwanda',
    content: `Imyemeramikire yo mu Rwanda ikomeje guteza imbere amahoro n'ubumwe. Abantu b'imyemeramikire bose bakomeje gusangira amahoro n'ubumwe mu Rwanda.

Iyi nshingano y'ubumwe n'ubwiyongere yatangiye kandi ikomeje gutera imbere. Abanyarwanda bose bakomeje gusangira amahoro n'ubumwe mu Rwanda.

Mu izihizo rya 2024, abanyarwanda bose bashimishwa kwizihiza umunsi w'ubumwe n'ubwiyongere. Iyi nshingano y'ubumwe n'ubwiyongere yatangiye kandi ikomeje gutera imbere.`,
    excerpt: 'Imyemeramikire yo mu Rwanda ikomeje guteza imbere amahoro n\'ubumwe. Abantu b\'imyemeramikire bose bakomeje gusangira amahoro n\'ubumwe mu Rwanda.',
    status: 'PUBLISHED',
    isFeatured: true,
    isBreaking: false,
    viewCount: 856,
    likeCount: 67,
    categorySlug: 'iyobokamana'
  },
  {
    title: 'Umuziki wa Kinyarwanda 2024: Abahanzi bashya bakomeje guturuka',
    slug: 'umuziki-wa-kinyarwanda-2024',
    content: `Umuziki wa Kinyarwanda ukomeje gutera imbere. Abahanzi bashya bakomeje guturuka kandi bakomeje gutanga umuziki mwiza.

Iyi nshingano y'ubumwe n'ubwiyongere yatangiye kandi ikomeje gutera imbere. Abanyarwanda bose bakomeje gusangira amahoro n'ubumwe mu Rwanda.

Mu izihizo rya 2024, abanyarwanda bose bashimishwa kwizihiza umunsi w'ubumwe n'ubwiyongere. Iyi nshingano y'ubumwe n'ubwiyongere yatangiye kandi ikomeje gutera imbere.`,
    excerpt: 'Umuziki wa Kinyarwanda ukomeje gutera imbere. Abahanzi bashya bakomeje guturuka kandi bakomeje gutanga umuziki mwiza.',
    status: 'PUBLISHED',
    isFeatured: false,
    isBreaking: false,
    viewCount: 654,
    likeCount: 45,
    categorySlug: 'umuziki'
  },
  {
    title: 'Technology Innovation Hub Launches in Kigali',
    slug: 'technology-innovation-hub-kigali',
    content: `A new technology innovation hub has been launched in Kigali, Rwanda. This hub will serve as a center for technological advancement and innovation in East Africa.

The hub will provide resources, mentorship, and funding opportunities for tech startups and entrepreneurs. It aims to foster innovation and create job opportunities in the technology sector.

This initiative aligns with Rwanda's vision of becoming a technology hub in Africa. The government has invested heavily in digital infrastructure and education to support this goal.`,
    excerpt: 'A new technology innovation hub has been launched in Kigali, Rwanda. This hub will serve as a center for technological advancement and innovation in East Africa.',
    status: 'PUBLISHED',
    isFeatured: false,
    isBreaking: false,
    viewCount: 432,
    likeCount: 23,
    categorySlug: 'technology'
  },
  {
    title: 'Rwanda\'s Economic Growth: A Decade of Progress',
    slug: 'rwanda-economic-growth-decade-progress',
    content: `Rwanda has experienced remarkable economic growth over the past decade. The country's GDP has increased significantly, and poverty levels have decreased substantially.

The government's economic policies have focused on diversification, investment in infrastructure, and promotion of the private sector. These efforts have resulted in sustainable economic development.

Key sectors driving growth include tourism, agriculture, and services. The country has also made significant progress in improving its business environment and attracting foreign investment.`,
    excerpt: 'Rwanda has experienced remarkable economic growth over the past decade. The country\'s GDP has increased significantly, and poverty levels have decreased substantially.',
    status: 'PUBLISHED',
    isFeatured: true,
    isBreaking: false,
    viewCount: 789,
    likeCount: 56,
    categorySlug: 'business'
  },
  {
    title: 'New Sports Complex Opens in Kigali',
    slug: 'new-sports-complex-kigali',
    content: `A state-of-the-art sports complex has opened in Kigali, providing world-class facilities for athletes and sports enthusiasts. The complex includes multiple sports fields, training facilities, and a modern gymnasium.

This development supports Rwanda's commitment to promoting sports and physical fitness. The complex will host local and international sporting events, boosting tourism and community engagement.

The facility is open to the public and offers various programs for all age groups. It represents a significant investment in Rwanda's sports infrastructure.`,
    excerpt: 'A state-of-the-art sports complex has opened in Kigali, providing world-class facilities for athletes and sports enthusiasts.',
    status: 'PUBLISHED',
    isFeatured: false,
    isBreaking: true,
    viewCount: 567,
    likeCount: 34,
    categorySlug: 'siporo'
  },
  {
    title: 'Cultural Festival Celebrates Diversity',
    slug: 'cultural-festival-celebrates-diversity',
    content: `A vibrant cultural festival celebrating Rwanda's diversity has been organized in Kigali. The event showcases traditional music, dance, art, and cuisine from different regions of Rwanda.

The festival promotes cultural understanding and unity among Rwandans. It also attracts international visitors, contributing to cultural tourism and exchange.

Various cultural groups participate in performances and exhibitions. The event highlights the rich cultural heritage of Rwanda and its people.`,
    excerpt: 'A vibrant cultural festival celebrating Rwanda\'s diversity has been organized in Kigali. The event showcases traditional music, dance, art, and cuisine.',
    status: 'PUBLISHED',
    isFeatured: false,
    isBreaking: false,
    viewCount: 345,
    likeCount: 28,
    categorySlug: 'entertainment'
  },
  {
    title: 'Healthcare Improvements Across Rwanda',
    slug: 'healthcare-improvements-rwanda',
    content: `Significant improvements in healthcare services have been implemented across Rwanda. The government has invested in modern medical facilities, trained healthcare workers, and expanded access to essential services.

These improvements have resulted in better health outcomes for the population. Maternal and child mortality rates have decreased, and life expectancy has increased.

The healthcare system now provides comprehensive coverage to all citizens. This progress demonstrates Rwanda's commitment to the well-being of its people.`,
    excerpt: 'Significant improvements in healthcare services have been implemented across Rwanda. The government has invested in modern medical facilities and trained healthcare workers.',
    status: 'PUBLISHED',
    isFeatured: false,
    isBreaking: false,
    viewCount: 456,
    likeCount: 31,
    categorySlug: 'health'
  },
  {
    title: 'Education Reform: New Curriculum Implementation',
    slug: 'education-reform-new-curriculum',
    content: `Rwanda has implemented a new education curriculum focused on practical skills and critical thinking. The reform aims to prepare students for the modern workforce and global challenges.

The new curriculum emphasizes STEM subjects, entrepreneurship, and digital literacy. It also promotes creativity and problem-solving skills among students.

Teachers have received training on the new curriculum, and schools have been equipped with modern learning resources. This reform represents a significant step forward in Rwanda's education system.`,
    excerpt: 'Rwanda has implemented a new education curriculum focused on practical skills and critical thinking. The reform aims to prepare students for the modern workforce.',
    status: 'DRAFT',
    isFeatured: false,
    isBreaking: false,
    viewCount: 0,
    likeCount: 0,
    categorySlug: 'education'
  },
  {
    title: 'Environmental Conservation: Rwanda\'s Green Initiative',
    slug: 'environmental-conservation-rwanda-green-initiative',
    content: `Rwanda has launched a comprehensive environmental conservation initiative to protect its natural resources and promote sustainability. The program includes tree planting, waste management, and renewable energy projects.

The initiative aims to make Rwanda a leader in environmental protection in Africa. It involves government agencies, private sector partners, and local communities.

Various environmental education programs have been implemented in schools and communities. This effort demonstrates Rwanda's commitment to sustainable development.`,
    excerpt: 'Rwanda has launched a comprehensive environmental conservation initiative to protect its natural resources and promote sustainability.',
    status: 'DRAFT',
    isFeatured: false,
    isBreaking: false,
    viewCount: 0,
    likeCount: 0,
    categorySlug: 'education'
  }
];

// Sample media files for seeding
const sampleMediaFiles = [
  {
    originalName: 'files-1757060699767-440298563.jpeg',
    filename: 'files-1757060699767-440298563.jpeg',
    mimeType: 'image/jpeg',
    size: 1024000, // 1MB
    url: '/uploads/media/files-1757060699767-440298563.jpeg',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757060699767-440298563.jpeg',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded image file'
  },
  {
    originalName: 'files-1757060767576-639902165.png',
    filename: 'files-1757060767576-639902165.png',
    mimeType: 'image/png',
    size: 2048000, // 2MB
    url: '/uploads/media/files-1757060767576-639902165.png',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757060767576-639902165.png',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded PNG image file'
  },
  {
    originalName: 'files-1757061057194-644781883.jpeg',
    filename: 'files-1757061057194-644781883.jpeg',
    mimeType: 'image/jpeg',
    size: 1536000, // 1.5MB
    url: '/uploads/media/files-1757061057194-644781883.jpeg',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757061057194-644781883.jpeg',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded JPEG image file'
  },
  {
    originalName: 'files-1757061345368-209470306.png',
    filename: 'files-1757061345368-209470306.png',
    mimeType: 'image/png',
    size: 1800000, // 1.8MB
    url: '/uploads/media/files-1757061345368-209470306.png',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757061345368-209470306.png',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded PNG image file'
  },
  {
    originalName: 'files-1757062006766-849755523.jpg',
    filename: 'files-1757062006766-849755523.jpg',
    mimeType: 'image/jpeg',
    size: 2200000, // 2.2MB
    url: '/uploads/media/files-1757062006766-849755523.jpg',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757062006766-849755523.jpg',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded JPG image file'
  },
  {
    originalName: 'files-1757063135454-917596910.mp4',
    filename: 'files-1757063135454-917596910.mp4',
    mimeType: 'video/mp4',
    size: 15728640, // 15MB
    url: '/uploads/media/files-1757063135454-917596910.mp4',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757063135454-917596910.mp4',
    category: 'general',
    tags: ['video', 'mp4', 'uploaded'],
    description: 'Uploaded MP4 video file'
  },
  {
    originalName: 'files-1757063190285-260517929.jpg',
    filename: 'files-1757063190285-260517929.jpg',
    mimeType: 'image/jpeg',
    size: 1900000, // 1.9MB
    url: '/uploads/media/files-1757063190285-260517929.jpg',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757063190285-260517929.jpg',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded JPG image file'
  },
  {
    originalName: 'files-1757063230086-314708945.pdf',
    filename: 'files-1757063230086-314708945.pdf',
    mimeType: 'application/pdf',
    size: 5120000, // 5MB
    url: '/uploads/media/files-1757063230086-314708945.pdf',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757063230086-314708945.pdf',
    category: 'general',
    tags: ['document', 'pdf', 'uploaded'],
    description: 'Uploaded PDF document file'
  },
  {
    originalName: 'files-1757066902661-306586458.png',
    filename: 'files-1757066902661-306586458.png',
    mimeType: 'image/png',
    size: 2100000, // 2.1MB
    url: '/uploads/media/files-1757066902661-306586458.png',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757066902661-306586458.png',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded PNG image file'
  },
  {
    originalName: 'files-1757066911220-684432089.jpeg',
    filename: 'files-1757066911220-684432089.jpeg',
    mimeType: 'image/jpeg',
    size: 1700000, // 1.7MB
    url: '/uploads/media/files-1757066911220-684432089.jpeg',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757066911220-684432089.jpeg',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded JPEG image file'
  },
  {
    originalName: 'files-1757067975208-683146511.png',
    filename: 'files-1757067975208-683146511.png',
    mimeType: 'image/png',
    size: 1950000, // 1.95MB
    url: '/uploads/media/files-1757067975208-683146511.png',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757067975208-683146511.png',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded PNG image file'
  },
  {
    originalName: 'files-1757068665843-732950324.jpeg',
    filename: 'files-1757068665843-732950324.jpeg',
    mimeType: 'image/jpeg',
    size: 1850000, // 1.85MB
    url: '/uploads/media/files-1757068665843-732950324.jpeg',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757068665843-732950324.jpeg',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded JPEG image file'
  },
  {
    originalName: 'files-1757068665845-307256581.jpeg',
    filename: 'files-1757068665845-307256581.jpeg',
    mimeType: 'image/jpeg',
    size: 1650000, // 1.65MB
    url: '/uploads/media/files-1757068665845-307256581.jpeg',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757068665845-307256581.jpeg',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded JPEG image file'
  },
  {
    originalName: 'files-1757069886169-345060908.jpeg',
    filename: 'files-1757069886169-345060908.jpeg',
    mimeType: 'image/jpeg',
    size: 1750000, // 1.75MB
    url: '/uploads/media/files-1757069886169-345060908.jpeg',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757069886169-345060908.jpeg',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded JPEG image file'
  },
  {
    originalName: 'files-1757070232954-503591869.jpeg',
    filename: 'files-1757070232954-503591869.jpeg',
    mimeType: 'image/jpeg',
    size: 2050000, // 2.05MB
    url: '/uploads/media/files-1757070232954-503591869.jpeg',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757070232954-503591869.jpeg',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded JPEG image file'
  },
  {
    originalName: 'files-1757070232963-817065102.jpeg',
    filename: 'files-1757070232963-817065102.jpeg',
    mimeType: 'image/jpeg',
    size: 1950000, // 1.95MB
    url: '/uploads/media/files-1757070232963-817065102.jpeg',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757070232963-817065102.jpeg',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded JPEG image file'
  },
  {
    originalName: 'files-1757070232980-82941326.png',
    filename: 'files-1757070232980-82941326.png',
    mimeType: 'image/png',
    size: 1850000, // 1.85MB
    url: '/uploads/media/files-1757070232980-82941326.png',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757070232980-82941326.png',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded PNG image file'
  },
  {
    originalName: 'files-1757070233012-496462194.jpeg',
    filename: 'files-1757070233012-496462194.jpeg',
    mimeType: 'image/jpeg',
    size: 1750000, // 1.75MB
    url: '/uploads/media/files-1757070233012-496462194.jpeg',
    thumbnailUrl: '/uploads/media/thumbnails/thumb_files-1757070233012-496462194.jpeg',
    category: 'general',
    tags: ['image', 'photo', 'uploaded'],
    description: 'Uploaded JPEG image file'
  }
];

// Single test post for testing edit functionality
const testPost = {
  title: 'Test Post for Edit Functionality',
  slug: 'test-post-for-edit-functionality',
  content: 'This is a test post to verify that the edit functionality works correctly. You can edit this post to test the edit form.',
  excerpt: 'A test post for verifying edit functionality.',
  featuredImage: '/uploads/media/files-1757062006766-849755523.jpg',
  status: 'PUBLISHED',
  categorySlug: 'technology',
  isFeatured: false,
  isPinned: false,
  allowComments: true,
  tags: ['test', 'edit', 'functionality'],
  metaTitle: 'Test Post - Edit Functionality',
  metaDescription: 'A test post for verifying edit functionality works correctly.',
  viewCount: 0,
  likeCount: 0,
  commentCount: 0
};

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.mediaFile.deleteMany();
    await prisma.post.deleteMany();
    await prisma.news.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();

    // Create categories
    console.log('📂 Creating categories...');
    const createdCategories = [];
    for (const categoryData of sampleCategories) {
      const category = await prisma.category.create({
        data: categoryData
      });
      createdCategories.push(category);
      console.log(`✅ Created category: ${category.name}`);
    }

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.username}`);
    }

    // Create articles
    console.log('📰 Creating articles...');
    for (const articleData of sampleArticles) {
      const category = createdCategories.find(c => c.slug === articleData.categorySlug);
      const author = createdUsers.find(u => u.role === 'AUTHOR');
      
      if (category && author) {
        const article = await prisma.news.create({
          data: {
            title: articleData.title,
            slug: articleData.slug,
            content: articleData.content,
            excerpt: articleData.excerpt,
            status: articleData.status,
            isFeatured: articleData.isFeatured,
            isBreaking: articleData.isBreaking,
            viewCount: articleData.viewCount,
            likeCount: articleData.likeCount,
            publishedAt: articleData.status === 'PUBLISHED' ? new Date() : null,
            authorId: author.id,
            categoryId: category.id
          }
        });
        console.log(`✅ Created article: ${article.title}`);
      }
    }

    // Create media files
    console.log('📁 Creating media files...');
    const createdMediaFiles = [];
    const adminUser = createdUsers.find(user => user.email === 'admin@umunsi.com');
    
    for (const mediaData of sampleMediaFiles) {
      const mediaFile = await prisma.mediaFile.create({
        data: {
          ...mediaData,
          uploadedById: adminUser.id
        }
      });
      createdMediaFiles.push(mediaFile);
      console.log(`✅ Created media file: ${mediaFile.originalName}`);
    }

    // Create test post for edit functionality testing
    console.log('📝 Creating test post...');
    const category = createdCategories.find(c => c.slug === testPost.categorySlug);
    const author = createdUsers.find(u => u.role === 'AUTHOR');
    
    if (category && author) {
      const post = await prisma.post.create({
        data: {
          title: testPost.title,
          slug: testPost.slug,
          content: testPost.content,
          excerpt: testPost.excerpt,
          featuredImage: testPost.featuredImage,
          status: testPost.status,
          publishedAt: testPost.status === 'PUBLISHED' ? new Date() : null,
          viewCount: testPost.viewCount,
          likeCount: testPost.likeCount,
          commentCount: testPost.commentCount,
          isFeatured: testPost.isFeatured,
          isPinned: testPost.isPinned,
          allowComments: testPost.allowComments,
          tags: testPost.tags,
          metaTitle: testPost.metaTitle,
          metaDescription: testPost.metaDescription,
          authorId: author.id,
          categoryId: category.id
        }
      });
      console.log(`✅ Created test post: ${post.title} (ID: ${post.id})`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${createdCategories.length} categories`);
    console.log(`👥 Created ${createdUsers.length} users`);
    console.log(`📰 Created ${sampleArticles.length} articles`);
    console.log(`📁 Created ${createdMediaFiles.length} media files`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
