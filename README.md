# Umunsi News Server

A comprehensive Node.js backend server for the Umunsi News website with admin dashboard, user management, and analytics.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user CRUD operations with different roles (Admin, Editor, Author, User)
- **Article Management**: Full article lifecycle with categories, tags, and status management
- **Admin Dashboard**: Comprehensive analytics and system management
- **Analytics**: User behavior tracking and article performance metrics
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Security**: Rate limiting, input validation, and secure password hashing
- **API Documentation**: RESTful API with comprehensive endpoints

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, rate-limiting
- **Logging**: morgan

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd Server
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/umunsi_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# Email (for newsletter and notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Analytics
ANALYTICS_ENABLED=true
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with initial data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📊 Database Schema

### Core Models

- **User**: Authentication and user management
- **Article**: News articles with categories and tags
- **Category**: Article categorization
- **Tag**: Article tagging system
- **Comment**: User comments on articles
- **Like**: Article likes system
- **Bookmark**: User bookmarks
- **Analytics**: User behavior and article performance tracking

### User Roles

- **ADMIN**: Full system access
- **EDITOR**: Content management and user oversight
- **AUTHOR**: Article creation and management
- **USER**: Basic user functionality

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - User login
GET    /api/auth/me           - Get current user profile
PUT    /api/auth/me           - Update user profile
PUT    /api/auth/change-password - Change password
POST   /api/auth/logout       - User logout
POST   /api/auth/refresh      - Refresh JWT token
```

### Articles

```
GET    /api/articles          - Get all articles (with filters)
GET    /api/articles/:slug    - Get single article
POST   /api/articles          - Create new article (Auth required)
PUT    /api/articles/:id      - Update article (Auth required)
DELETE /api/articles/:id      - Delete article (Auth required)
POST   /api/articles/:id/like - Like/unlike article (Auth required)
```

### Categories

```
GET    /api/categories        - Get all categories
GET    /api/categories/:slug  - Get category with articles
POST   /api/categories        - Create category (Editor+ required)
PUT    /api/categories/:id    - Update category (Editor+ required)
DELETE /api/categories/:id    - Delete category (Editor+ required)
```

### Users

```
GET    /api/users/profile/:username - Get user profile
GET    /api/users/:username/articles - Get user's articles
GET    /api/users/:username/comments - Get user's comments
GET    /api/users/me/bookmarks - Get user's bookmarks (Auth required)
POST   /api/users/me/bookmarks/:articleId - Add bookmark (Auth required)
DELETE /api/users/me/bookmarks/:articleId - Remove bookmark (Auth required)
```

### Admin Dashboard

```
GET    /api/admin/dashboard   - Dashboard overview (Admin required)
GET    /api/admin/users       - User management (Admin required)
PUT    /api/admin/users/:id   - Update user (Admin required)
DELETE /api/admin/users/:id   - Delete user (Admin required)
GET    /api/admin/analytics   - Site analytics (Admin required)
GET    /api/admin/logs        - System logs (Admin required)
POST   /api/admin/logs        - Create system log (Admin required)
GET    /api/admin/health      - System health check (Admin required)
```

### Analytics

```
POST   /api/analytics/pageview - Track page view
POST   /api/analytics/article/:articleId/view - Track article view
GET    /api/analytics/summary  - Analytics summary (Auth required)
```

## 🔐 Authentication

### JWT Token

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access

- **Public**: Article viewing, category browsing
- **User**: Comments, likes, bookmarks, profile management
- **Author**: Article creation and management
- **Editor**: Content oversight, user management
- **Admin**: Full system access

## 📈 Analytics Features

- **Page Views**: Track user page visits
- **Article Analytics**: View counts, time on page, unique views
- **User Behavior**: Session duration, bounce rate
- **Content Performance**: Top articles, popular categories
- **Growth Metrics**: User and content growth tracking

## 🛡️ Security Features

- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **Password Hashing**: Secure bcrypt hashing
- **CORS Protection**: Cross-origin request protection
- **Helmet**: Security headers
- **JWT Expiration**: Token-based session management

## 🗄️ Database Management

### Prisma Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

### Database Seeding

The seed script creates:

- **Users**: Admin, Editor, Author, and regular user accounts
- **Categories**: News categories (Religion, Music, Entertainment, etc.)
- **Tags**: Article tags (Gospel, Traditional, Modern, etc.)
- **Articles**: Sample articles with full content
- **Comments**: Sample user comments
- **Likes & Bookmarks**: Sample user interactions

### Default Credentials

```
Admin:    admin@umunsi.com / admin123
Editor:   editor@umunsi.com / editor123
Author:   author@umunsi.com / author123
User:     user@umunsi.com / user123
```

## 🚀 Deployment

### Production Setup

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure production database
4. Set up proper CORS origins
5. Configure email settings
6. Set up file upload storage

### Environment Variables

```env
# Production
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:port/db"
JWT_SECRET="very-long-secure-secret"
CORS_ORIGIN="https://yourdomain.com"
```

## 📝 API Response Format

### Success Response

```json
{
  "message": "Operation successful",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response

```json
{
  "error": "Error type",
  "message": "Human readable message",
  "details": [ ... ]
}
```

## 🔧 Development

### Scripts

```bash
npm run dev          # Start development server
npm start           # Start production server
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema to database
npm run db:migrate  # Create and run migrations
npm run db:studio   # Open Prisma Studio
npm run db:seed     # Seed database
```

### File Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── database/       # Database utilities and seeds
├── middleware/     # Custom middleware
├── routes/         # API routes
├── utils/          # Utility functions
└── index.js        # Server entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation
- Review the Prisma schema for data structure

## 🔄 Updates

- Keep dependencies updated
- Monitor security advisories
- Regular database backups
- Performance monitoring
