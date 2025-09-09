const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@umunsi.com' },
    update: {},
    create: {
      email: 'admin@umunsi.com',
      username: 'admin',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true
    }
  });

  // Create editor user
  const editorPassword = await bcrypt.hash('editor123', 12);
  const editor = await prisma.user.upsert({
    where: { email: 'editor@umunsi.com' },
    update: {},
    create: {
      email: 'editor@umunsi.com',
      username: 'editor',
      password: editorPassword,
      firstName: 'Editor',
      lastName: 'User',
      role: 'EDITOR',
      isActive: true
    }
  });

  // Create author user
  const authorPassword = await bcrypt.hash('author123', 12);
  const author = await prisma.user.upsert({
    where: { email: 'author@umunsi.com' },
    update: {},
    create: {
      email: 'author@umunsi.com',
      username: 'author',
      password: authorPassword,
      firstName: 'Author',
      lastName: 'User',
      role: 'AUTHOR',
      isActive: true
    }
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@umunsi.com' },
    update: {},
    create: {
      email: 'user@umunsi.com',
      username: 'user',
      password: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
      isActive: true
    }
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'iyobokamana' },
      update: {},
      create: {
        name: 'Iyobokamana',
        slug: 'iyobokamana',
        description: 'Amakuru y\'imyemeramikire n\'iyobokamana',
        color: '#3B82F6',
        icon: 'church'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'umuziki' },
      update: {},
      create: {
        name: 'Umuziki',
        slug: 'umuziki',
        description: 'Amakuru y\'umuziki wa kinyarwanda n\'abahanzi',
        color: '#EC4899',
        icon: 'music'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'ibikorwa' },
      update: {},
      create: {
        name: 'Ibikorwa',
        slug: 'ibikorwa',
        description: 'Amakuru y\'ibikorwa by\'umuziki n\'ubuhanzi',
        color: '#8B5CF6',
        icon: 'star'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'abakinnyi' },
      update: {},
      create: {
        name: 'Abakinnyi',
        slug: 'abakinnyi',
        description: 'Amakuru y\'abakinnyi n\'abantu b\'umuhate',
        color: '#F59E0B',
        icon: 'users'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'siporo' },
      update: {},
      create: {
        name: 'Siporo',
        slug: 'siporo',
        description: 'Amakuru y\'umukino n\'ibikorwa by\'umukino',
        color: '#EF4444',
        icon: 'trophy'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'politiki' },
      update: {},
      create: {
        name: 'Politiki',
        slug: 'politiki',
        description: 'Amakuru y\'ubutegetsi n\'amabwiriza',
        color: '#DC2626',
        icon: 'flag'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'ubuzima' },
      update: {},
      create: {
        name: 'Ubuzima',
        slug: 'ubuzima',
        description: 'Amakuru y\'ubuzima n\'ubuvuzi',
        color: '#10B981',
        icon: 'heart'
      }
    })
  ]);

  // Create sample news articles
  const news = await Promise.all([
    prisma.news.upsert({
      where: { slug: 'umunsi-wa-kinyarwanda-2024' },
      update: {},
      create: {
        title: 'Umunsi wa Kinyarwanda 2024: Abanyarwanda basanze mu minsi 30',
        slug: 'umunsi-wa-kinyarwanda-2024',
        content: 'U Rwanda rwizihije umunsi w\'ubumwe n\'ubwiyongere. Abanyarwanda bose basanze mu minsi 30 bashimishwa kwizihiza umunsi w\'ubumwe n\'ubwiyongere. Iki gikorwa cyabereye i Kigali kandi cyashimishwe na Perezida wa Repubulika y\'u Rwanda, Paul Kagame.',
        excerpt: 'U Rwanda rwizihije umunsi w\'ubumwe n\'ubwiyongere. Abanyarwanda bose basanze mu minsi 30 bashimishwa kwizihiza umunsi w\'ubumwe n\'ubwiyongere.',
        featuredImage: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=800',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        isBreaking: true,
        isFeatured: true,
        viewCount: 1250,
        likeCount: 89,
        authorId: author.id,
        categoryId: categories[4].id // Siporo
      }
    }),
    prisma.news.upsert({
      where: { slug: 'imyemeramikire-yo-mu-rwanda' },
      update: {},
      create: {
        title: 'Imyemeramikire yo mu Rwanda ikomeje guteza imbere amahoro n\'ubumwe',
        slug: 'imyemeramikire-yo-mu-rwanda',
        content: 'Imyemeramikire yo mu Rwanda ikomeje guteza imbere amahoro n\'ubumwe. Abantu b\'imyemeramikire bose bakomeje gusangira amahoro n\'ubumwe mu Rwanda. Iki gikorwa cyabereye mu turere twose tw\'u Rwanda.',
        excerpt: 'Imyemeramikire yo mu Rwanda ikomeje guteza imbere amahoro n\'ubumwe. Abantu b\'imyemeramikire bose bakomeje gusangira amahoro n\'ubumwe mu Rwanda.',
        featuredImage: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=800',
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isBreaking: false,
        isFeatured: true,
        viewCount: 856,
        likeCount: 67,
        authorId: author.id,
        categoryId: categories[0].id // Iyobokamana
      }
    }),
    prisma.news.upsert({
      where: { slug: 'umuziki-wa-kinyarwanda-2024' },
      update: {},
      create: {
        title: 'Umuziki wa Kinyarwanda 2024: Abahanzi bashya bakomeje guturuka',
        slug: 'umuziki-wa-kinyarwanda-2024',
        content: 'Umuziki wa Kinyarwanda ukomeje gutera imbere. Abahanzi bashya bakomeje guturuka kandi bakomeje gutanga umuziki mwiza. Iki gikorwa cyabereye mu turere twose tw\'u Rwanda.',
        excerpt: 'Umuziki wa Kinyarwanda ukomeje gutera imbere. Abahanzi bashya bakomeje guturuka kandi bakomeje gutanga umuziki mwiza.',
        featuredImage: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=800',
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        isBreaking: false,
        isFeatured: false,
        viewCount: 654,
        likeCount: 45,
        authorId: editor.id,
        categoryId: categories[1].id // Umuziki
      }
    })
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('👥 Users created:', { admin: admin.username, editor: editor.username, author: author.username, user: user.username });
  console.log('📂 Categories created:', categories.length);
  console.log('📰 News articles created:', news.length);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
