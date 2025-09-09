#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Database configuration template
const envTemplate = `# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/umunsi_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (for newsletters and contact forms)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Upload Configuration
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=5242880 # 5MB

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"
`;

async function setupDatabase() {
  console.log('🚀 Setting up Umunsi Database...\n');

  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file...');
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ .env file created successfully!');
    console.log('⚠️  Please update the DATABASE_URL in .env with your PostgreSQL credentials\n');
  } else {
    console.log('✅ .env file already exists');
  }

  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated!');

    // Push schema to database
    console.log('📊 Pushing database schema...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database schema pushed successfully!');

    // Seed database
    console.log('🌱 Seeding database...');
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully!');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update the DATABASE_URL in .env with your PostgreSQL credentials');
    console.log('2. Run "npm run dev" to start the development server');
    console.log('3. Access the admin dashboard at http://localhost:5000/admin');
    console.log('\n🔑 Default admin credentials:');
    console.log('   Email: admin@umunsi.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Create a database named "umunsi_db"');
    console.log('3. Update DATABASE_URL in .env with correct credentials');
    console.log('4. Run "npm install" to install dependencies');
  } finally {
    await prisma.$disconnect();
  }
}

// PostgreSQL installation guide
function showPostgreSQLGuide() {
  console.log('\n📖 PostgreSQL Installation Guide:\n');
  
  console.log('🖥️  macOS (using Homebrew):');
  console.log('   brew install postgresql');
  console.log('   brew services start postgresql');
  console.log('   createdb umunsi_db');
  console.log('   createuser -P username');
  console.log('\n');
  
  console.log('🐧 Linux (Ubuntu/Debian):');
  console.log('   sudo apt update');
  console.log('   sudo apt install postgresql postgresql-contrib');
  console.log('   sudo systemctl start postgresql');
  console.log('   sudo systemctl enable postgresql');
  console.log('   sudo -u postgres createdb umunsi_db');
  console.log('   sudo -u postgres createuser -P username');
  console.log('\n');
  
  console.log('🪟 Windows:');
  console.log('   Download from: https://www.postgresql.org/download/windows/');
  console.log('   Install with default settings');
  console.log('   Create database and user through pgAdmin or command line');
  console.log('\n');
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Umunsi Database Setup Script\n');
  console.log('Usage:');
  console.log('  node setup-database.js          # Setup database');
  console.log('  node setup-database.js --guide  # Show PostgreSQL installation guide');
  console.log('  node setup-database.js --help   # Show this help message');
  process.exit(0);
}

if (args.includes('--guide')) {
  showPostgreSQLGuide();
  process.exit(0);
}

// Run setup
setupDatabase();
