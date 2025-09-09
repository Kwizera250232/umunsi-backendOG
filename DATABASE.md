# Umunsi Database Documentation

## Overview

The Umunsi server uses PostgreSQL as the primary database with Prisma as the ORM (Object-Relational Mapping) tool. The database is designed to handle a news website with user management, content management, analytics, and admin functionality.

## Database Schema

### Core Models

#### User
- **Purpose**: User management and authentication
- **Key Fields**: 
  - `id`: Unique identifier (CUID)
  - `email`: Unique email address
  - `username`: Unique username
  - `password`: Hashed password
  - `role`: User role (ADMIN, EDITOR, AUTHOR, USER)
  - `isActive`: Account status
- **Relations**: Articles, Comments, Likes, Bookmarks, Analytics, Sessions

#### Article
- **Purpose**: News articles and content
- **Key Fields**:
  - `id`: Unique identifier (CUID)
  - `title`: Article title
  - `slug`: URL-friendly identifier
  - `content`: Article content
  - `status`: Publication status (DRAFT, PUBLISHED, ARCHIVED, DELETED)
  - `viewCount`, `likeCount`, `commentCount`: Engagement metrics
  - `isFeatured`, `isBreaking`: Special flags
- **Relations**: Author (User), Category, Tags, Comments, Likes, Bookmarks, Analytics

#### Category
- **Purpose**: Article categorization
- **Key Fields**:
  - `name`: Category name
  - `slug`: URL-friendly identifier
  - `color`, `icon`: UI customization
- **Relations**: Articles

#### Tag
- **Purpose**: Article tagging system
- **Key Fields**:
  - `name`: Tag name
  - `slug`: URL-friendly identifier
- **Relations**: Articles

### Engagement Models

#### Comment
- **Purpose**: User comments on articles
- **Key Fields**:
  - `content`: Comment text
  - `isApproved`: Moderation status
- **Relations**: Author (User), Article

#### Like
- **Purpose**: User likes on articles
- **Key Fields**: Unique constraint on user-article combination
- **Relations**: User, Article

#### Bookmark
- **Purpose**: User bookmarks/saved articles
- **Key Fields**: Unique constraint on user-article combination
- **Relations**: User, Article

### Analytics Models

#### UserAnalytics
- **Purpose**: Track user behavior and engagement
- **Key Fields**:
  - `pageViews`: Number of pages viewed
  - `uniqueVisitors`: Unique visitor count
  - `sessionDuration`: Time spent on site
  - `bounceRate`: Bounce rate percentage
- **Relations**: User (optional)

#### ArticleAnalytics
- **Purpose**: Track article performance
- **Key Fields**:
  - `views`: Total article views
  - `uniqueViews`: Unique article views
  - `timeOnPage`: Average time spent on article
- **Relations**: Article

#### SiteAnalytics
- **Purpose**: Overall site performance metrics
- **Key Fields**:
  - `totalViews`: Total site views
  - `uniqueVisitors`: Unique visitors
  - `newUsers`, `returningUsers`: User type breakdown
  - `topArticles`, `topCategories`: JSON data for popular content
- **Relations**: None (aggregate data)

### Utility Models

#### UserSession
- **Purpose**: JWT session management
- **Key Fields**:
  - `token`: JWT token
  - `expiresAt`: Token expiration
- **Relations**: User

#### Newsletter
- **Purpose**: Email newsletter subscriptions
- **Key Fields**:
  - `email`: Subscriber email
  - `isActive`: Subscription status
- **Relations**: None

#### ContactMessage
- **Purpose**: Contact form submissions
- **Key Fields**:
  - `name`, `email`, `subject`, `message`: Contact details
  - `isRead`: Message status
- **Relations**: None

#### SystemLog
- **Purpose**: System logging and monitoring
- **Key Fields**:
  - `level`: Log level (ERROR, WARN, INFO, DEBUG)
  - `message`: Log message
  - `details`: Additional JSON data
- **Relations**: None

## Database Setup

### Prerequisites

1. **PostgreSQL Installation**
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database and User**
   ```sql
   CREATE DATABASE umunsi_db;
   CREATE USER username WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE umunsi_db TO username;
   ```

### Quick Setup

1. **Install Dependencies**
   ```bash
   cd Server
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy the setup script
   node setup-database.js
   
   # Or manually create .env file with:
   DATABASE_URL="postgresql://username:password@localhost:5432/umunsi_db"
   ```

3. **Initialize Database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed with initial data
   npm run db:seed
   ```

### Available Scripts

```bash
# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with initial data

# Development
npm run dev            # Start development server
npm start              # Start production server
```

## Default Data

The database is seeded with the following default data:

### Users
- **Admin**: admin@umunsi.com / admin123
- **Editor**: editor@umunsi.com / editor123
- **Author**: author@umunsi.com / author123
- **User**: user@umunsi.com / user123

### Categories
- Iyobokamana (Religion)
- Umuziki (Music)
- Ibikorwa (Events)
- Abakinnyi (Artists)
- Siporo (Sports)
- Politiki (Politics)
- Ubuzima (Health)

### Tags
- Gospel
- Traditional
- Modern
- Breaking News
- Featured

### Sample Articles
- Umunsi wa Kinyarwanda 2024
- Imyemeramikire yo mu Rwanda
- Umuziki wa Kinyarwanda 2024

## Database Management

### Prisma Studio
Access the database GUI:
```bash
npm run db:studio
```
Visit: http://localhost:5555

### Backup and Restore
```bash
# Backup
pg_dump -U username -d umunsi_db > backup.sql

# Restore
psql -U username -d umunsi_db < backup.sql
```

### Migration Management
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcryptjs
2. **JWT Tokens**: Session management with configurable expiration
3. **Rate Limiting**: API rate limiting to prevent abuse
4. **Input Validation**: All inputs are validated using express-validator
5. **CORS**: Configured CORS for frontend integration

## Performance Optimization

1. **Indexes**: Prisma automatically creates indexes for foreign keys and unique constraints
2. **Connection Pooling**: Prisma handles connection pooling automatically
3. **Query Optimization**: Use Prisma's query optimization features
4. **Analytics**: Separate analytics tables to avoid impacting main queries

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Check firewall settings

2. **Permission Denied**
   - Verify database user permissions
   - Check database ownership

3. **Schema Sync Issues**
   - Run `npx prisma db push --force-reset` (⚠️ destroys data)
   - Check for conflicting migrations

4. **Seed Data Issues**
   - Verify seed file syntax
   - Check for duplicate unique constraints

### Logs
Check system logs for detailed error information:
```bash
# View recent logs
npx prisma studio
# Navigate to SystemLog table
```

## API Endpoints

The database supports the following main API endpoints:

- **Auth**: `/api/auth/*` - Authentication and user management
- **Articles**: `/api/articles/*` - Article CRUD operations
- **Categories**: `/api/categories/*` - Category management
- **Users**: `/api/users/*` - User management (admin only)
- **Analytics**: `/api/analytics/*` - Analytics data
- **Admin**: `/api/admin/*` - Admin dashboard endpoints

For detailed API documentation, see the individual route files in `src/routes/`.
