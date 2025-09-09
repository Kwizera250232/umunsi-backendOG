# Umunsi Server Components Summary

## 🎉 Server Architecture Complete!

Your Umunsi server has been successfully restructured with a clean, modular architecture using the MVC (Model-View-Controller) pattern.

---

## 📁 Project Structure

```
Server/
├── src/
│   ├── controllers/          # Business logic layer
│   │   ├── userController.js
│   │   ├── categoryController.js
│   │   └── newsController.js
│   ├── routes/              # API route definitions
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── categories.js
│   │   └── news.js
│   ├── middleware/          # Authentication & authorization
│   │   └── auth.js
│   ├── database/           # Database seeding
│   │   └── seed.js
│   └── index.js            # Main server file
├── prisma/
│   └── schema.prisma       # Database schema
├── .env                    # Environment variables
├── package.json           # Dependencies & scripts
└── Documentation files
```

---

## 🗄️ Database Models

### Simplified Schema with 3 Core Models:

#### 1. User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String
  firstName String?
  lastName  String?
  role      UserRole @default(USER)
  avatar    String?
  isActive  Boolean  @default(true)
  lastLogin DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  news News[]

  @@map("users")
}
```

#### 2. Category Model
```prisma
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  color       String?
  icon        String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  news News[]

  @@map("categories")
}
```

#### 3. News Model
```prisma
model News {
  id            String      @id @default(cuid())
  title         String
  slug          String      @unique
  content       String
  excerpt       String?
  featuredImage String?
  status        NewsStatus  @default(DRAFT)
  publishedAt   DateTime?
  viewCount     Int         @default(0)
  likeCount     Int         @default(0)
  isFeatured    Boolean     @default(false)
  isBreaking    Boolean     @default(false)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  authorId    String
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])

  @@map("news")
}
```

---

## 🎮 Controllers

### 1. UserController (`src/controllers/userController.js`)

**Methods:**
- `getAllUsers()` - Get all users with pagination and filtering (Admin only)
- `getUserById()` - Get single user by ID
- `createUser()` - Create new user (Admin only)
- `updateUser()` - Update user information
- `deleteUser()` - Delete user (Admin only)
- `login()` - User authentication
- `getProfile()` - Get current user profile
- `updateProfile()` - Update current user profile
- `changePassword()` - Change user password

**Features:**
- Password hashing with bcryptjs
- JWT token generation
- Role-based access control
- Input validation
- Error handling

### 2. CategoryController (`src/controllers/categoryController.js`)

**Methods:**
- `getAllCategories()` - Get all categories with pagination
- `getCategoryById()` - Get single category with news articles
- `createCategory()` - Create new category (Editor/Admin only)
- `updateCategory()` - Update category (Editor/Admin only)
- `deleteCategory()` - Delete category (Admin only)
- `getCategoriesWithCount()` - Get categories with news count for sidebar

**Features:**
- Automatic slug generation
- Duplicate checking
- News count tracking
- Category validation

### 3. NewsController (`src/controllers/newsController.js`)

**Methods:**
- `getAllNews()` - Get all news with filtering and pagination
- `getNewsById()` - Get single news article
- `createNews()` - Create new news article (Author/Editor/Admin)
- `updateNews()` - Update news article (with permissions)
- `deleteNews()` - Delete news article (with permissions)
- `likeNews()` - Like a news article
- `getFeaturedNews()` - Get featured news articles
- `getBreakingNews()` - Get breaking news articles
- `getNewsByAuthor()` - Get news by specific author

**Features:**
- Automatic slug generation
- View count tracking
- Like functionality
- Permission-based editing
- Search and filtering
- Pagination

---

## 🛣️ Routes

### 1. Auth Routes (`src/routes/auth.js`)
```
POST   /auth/login           - User login
GET    /auth/me              - Get current user profile
PUT    /auth/profile         - Update profile
PUT    /auth/change-password - Change password
POST   /auth/logout          - Logout
```

### 2. User Routes (`src/routes/users.js`)
```
GET    /users                - Get all users (Admin only)
GET    /users/:id            - Get single user (Admin only)
POST   /users                - Create user (Admin only)
PUT    /users/:id            - Update user (Admin only)
DELETE /users/:id            - Delete user (Admin only)
```

### 3. Category Routes (`src/routes/categories.js`)
```
GET    /categories           - Get all categories
GET    /categories/with-count - Get categories with news count
GET    /categories/:id       - Get single category
POST   /categories           - Create category (Editor/Admin)
PUT    /categories/:id       - Update category (Editor/Admin)
DELETE /categories/:id       - Delete category (Admin)
```

### 4. News Routes (`src/routes/news.js`)
```
GET    /news                 - Get all news
GET    /news/featured        - Get featured news
GET    /news/breaking        - Get breaking news
GET    /news/author/:authorId - Get news by author
GET    /news/:id             - Get single news article
POST   /news                 - Create news (Author/Editor/Admin)
PUT    /news/:id             - Update news (with permissions)
DELETE /news/:id             - Delete news (with permissions)
PATCH  /news/:id/like        - Like news article
```

---

## 🔐 Authentication & Authorization

### Middleware (`src/middleware/auth.js`)

**Functions:**
- `authenticateToken()` - Verify JWT token
- `requireRole(roles)` - Role-based access control
- `requireAdmin` - Admin only access
- `requireEditor` - Editor or Admin access
- `requireAuthor` - Author, Editor, or Admin access

**User Roles:**
- **ADMIN**: Full access to all features
- **EDITOR**: Can manage content and categories
- **AUTHOR**: Can create and edit their own news articles
- **USER**: Can view content and like articles

---

## 🚀 Server Features

### 1. Automatic Port Switching
- Server automatically finds available port (5000-5009)
- Graceful error handling for port conflicts
- Real-time port detection

### 2. Database Integration
- PostgreSQL with Prisma ORM
- Automatic schema synchronization
- Database seeding with sample data

### 3. Security Features
- JWT authentication
- Password hashing with bcryptjs
- Rate limiting (100 requests per 15 minutes)
- Input validation with express-validator
- CORS configuration

### 4. API Features
- RESTful design
- Comprehensive error handling
- Pagination support
- Search and filtering
- File upload support (configured)

---

## 📊 Sample Data

### Users (4 total)
- **Admin**: admin@umunsi.com / admin123
- **Editor**: editor@umunsi.com / editor123
- **Author**: author@umunsi.com / author123
- **User**: user@umunsi.com / user123

### Categories (7 total)
- Iyobokamana (Religion)
- Umuziki (Music)
- Ibikorwa (Events)
- Abakinnyi (Artists)
- Siporo (Sports)
- Politiki (Politics)
- Ubuzima (Health)

### News Articles (3 sample)
- Umunsi wa Kinyarwanda 2024
- Imyemeramikire yo mu Rwanda
- Umuziki wa Kinyarwanda 2024

---

## 🛠️ Available Scripts

```bash
# Server management
npm run dev              # Start development server with nodemon
npm run server           # Start server with automatic port detection
npm start                # Start production server

# Database management
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with sample data
```

---

## 🌐 API Endpoints Summary

### Public Endpoints
- `GET /api/health` - Server health check
- `GET /api/news` - Get all news articles
- `GET /api/news/featured` - Get featured news
- `GET /api/news/breaking` - Get breaking news
- `GET /api/news/:id` - Get single news article
- `GET /api/categories` - Get all categories
- `GET /api/categories/with-count` - Get categories with count
- `GET /api/categories/:id` - Get single category
- `POST /api/auth/login` - User login

### Protected Endpoints
- All user management endpoints (Admin only)
- All category management endpoints (Editor/Admin)
- All news management endpoints (Author/Editor/Admin)
- Profile management endpoints
- Like functionality

---

## ✅ Current Status

- ✅ **Server**: Running on port 5004
- ✅ **Database**: PostgreSQL connected and operational
- ✅ **API**: All endpoints responding correctly
- ✅ **Authentication**: JWT tokens working
- ✅ **Controllers**: All business logic implemented
- ✅ **Routes**: All API endpoints configured
- ✅ **Validation**: Input validation working
- ✅ **Error Handling**: Comprehensive error responses
- ✅ **Documentation**: Complete API documentation

---

## 🎯 Next Steps

1. **Frontend Integration**: Connect React frontend to the API
2. **Admin Dashboard**: Implement admin interface
3. **File Uploads**: Add image upload functionality
4. **Email Integration**: Add newsletter and contact features
5. **Analytics**: Implement user behavior tracking
6. **Caching**: Add Redis for performance optimization
7. **Testing**: Add unit and integration tests

---

**Server URL**: http://localhost:5004
**API Base**: http://localhost:5004/api
**Health Check**: http://localhost:5004/api/health
**Admin Login**: admin@umunsi.com / admin123

---

**Last Updated**: August 27, 2025
**Status**: ✅ Fully Operational
