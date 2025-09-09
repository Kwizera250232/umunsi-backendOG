# Umunsi API Documentation

## Overview

The Umunsi API provides endpoints for managing a news website with users, categories, and news articles. The API uses JWT authentication and follows RESTful principles.

**Base URL**: `http://localhost:5003/api`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## User Roles

- **ADMIN**: Full access to all features
- **EDITOR**: Can manage content and categories
- **AUTHOR**: Can create and edit their own news articles
- **USER**: Can view content and like articles

---

## Authentication Endpoints

### Login
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "admin@umunsi.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "email": "admin@umunsi.com",
    "username": "admin",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",
    "avatar": null,
    "isActive": true
  },
  "token": "jwt-token-here"
}
```

### Get Current User Profile
**GET** `/auth/me`

Get the current user's profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "admin@umunsi.com",
    "username": "admin",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",
    "avatar": null,
    "isActive": true,
    "lastLogin": "2025-08-27T14:30:00.000Z",
    "createdAt": "2025-08-27T11:38:35.688Z",
    "updatedAt": "2025-08-27T14:30:00.000Z",
    "_count": {
      "news": 5
    }
  }
}
```

### Update Profile
**PUT** `/auth/profile`

Update the current user's profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "Updated First Name",
  "lastName": "Updated Last Name",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Change Password
**PUT** `/auth/change-password`

Change the current user's password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Logout
**POST** `/auth/logout`

Logout the current user (client-side token removal).

**Headers:** `Authorization: Bearer <token>`

---

## News Endpoints

### Get All News
**GET** `/news`

Get paginated list of news articles with filtering options.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by category slug
- `status` (string): Filter by status (PUBLISHED, DRAFT, ARCHIVED, ALL)
- `featured` (boolean): Filter featured articles
- `breaking` (boolean): Filter breaking news
- `search` (string): Search in title, content, and excerpt
- `sortBy` (string): Sort field (default: publishedAt)
- `sortOrder` (string): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "news": [
    {
      "id": "news-id",
      "title": "Umunsi wa Kinyarwanda 2024",
      "slug": "umunsi-wa-kinyarwanda-2024",
      "content": "Article content...",
      "excerpt": "Article excerpt...",
      "featuredImage": "https://example.com/image.jpg",
      "status": "PUBLISHED",
      "publishedAt": "2025-08-27T11:38:35.688Z",
      "viewCount": 1250,
      "likeCount": 89,
      "isFeatured": true,
      "isBreaking": true,
      "createdAt": "2025-08-27T11:38:35.688Z",
      "updatedAt": "2025-08-27T11:38:35.688Z",
      "author": {
        "id": "author-id",
        "username": "author",
        "firstName": "Author",
        "lastName": "User",
        "avatar": null
      },
      "category": {
        "id": "category-id",
        "name": "Siporo",
        "slug": "siporo",
        "color": "#EF4444",
        "icon": "trophy"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Get Single News Article
**GET** `/news/:id`

Get a single news article by ID or slug.

**Response:**
```json
{
  "news": {
    "id": "news-id",
    "title": "Umunsi wa Kinyarwanda 2024",
    "slug": "umunsi-wa-kinyarwanda-2024",
    "content": "Full article content...",
    "excerpt": "Article excerpt...",
    "featuredImage": "https://example.com/image.jpg",
    "status": "PUBLISHED",
    "publishedAt": "2025-08-27T11:38:35.688Z",
    "viewCount": 1251,
    "likeCount": 89,
    "isFeatured": true,
    "isBreaking": true,
    "createdAt": "2025-08-27T11:38:35.688Z",
    "updatedAt": "2025-08-27T11:38:35.688Z",
    "author": {
      "id": "author-id",
      "username": "author",
      "firstName": "Author",
      "lastName": "User",
      "avatar": null
    },
    "category": {
      "id": "category-id",
      "name": "Siporo",
      "slug": "siporo",
      "color": "#EF4444",
      "icon": "trophy"
    }
  }
}
```

### Get Featured News
**GET** `/news/featured`

Get featured news articles.

**Query Parameters:**
- `limit` (number): Number of articles to return (default: 5)

### Get Breaking News
**GET** `/news/breaking`

Get breaking news articles.

**Query Parameters:**
- `limit` (number): Number of articles to return (default: 3)

### Get News by Author
**GET** `/news/author/:authorId`

Get news articles by a specific author.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

### Create News Article
**POST** `/news`

Create a new news article (requires AUTHOR, EDITOR, or ADMIN role).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "New Article Title",
  "content": "Article content...",
  "excerpt": "Article excerpt...",
  "featuredImage": "https://example.com/image.jpg",
  "categoryId": "category-id",
  "status": "DRAFT",
  "isFeatured": false,
  "isBreaking": false
}
```

### Update News Article
**PUT** `/news/:id`

Update a news article (requires permission).

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as create, but all fields are optional.

### Delete News Article
**DELETE** `/news/:id`

Delete a news article (requires permission).

**Headers:** `Authorization: Bearer <token>`

### Like News Article
**PATCH** `/news/:id/like`

Like a news article (requires authentication).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "News article liked successfully",
  "likeCount": 90
}
```

---

## Categories Endpoints

### Get All Categories
**GET** `/categories`

Get all categories with optional filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search in name and description
- `isActive` (boolean): Filter by active status

**Response:**
```json
{
  "categories": [
    {
      "id": "category-id",
      "name": "Iyobokamana",
      "slug": "iyobokamana",
      "description": "Amakuru y'imyemeramikire n'iyobokamana",
      "color": "#3B82F6",
      "icon": "church",
      "isActive": true,
      "createdAt": "2025-08-27T11:38:35.688Z",
      "updatedAt": "2025-08-27T11:38:35.688Z",
      "_count": {
        "news": 15
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 7,
    "itemsPerPage": 10
  }
}
```

### Get Categories with Count
**GET** `/categories/with-count`

Get active categories with news count (for sidebar/menu).

**Response:**
```json
{
  "categories": [
    {
      "id": "category-id",
      "name": "Iyobokamana",
      "slug": "iyobokamana",
      "color": "#3B82F6",
      "icon": "church",
      "_count": {
        "news": 15
      }
    }
  ]
}
```

### Get Single Category
**GET** `/categories/:id`

Get a single category by ID or slug with its news articles.

**Response:**
```json
{
  "category": {
    "id": "category-id",
    "name": "Iyobokamana",
    "slug": "iyobokamana",
    "description": "Amakuru y'imyemeramikire n'iyobokamana",
    "color": "#3B82F6",
    "icon": "church",
    "isActive": true,
    "createdAt": "2025-08-27T11:38:35.688Z",
    "updatedAt": "2025-08-27T11:38:35.688Z",
    "news": [
      {
        "id": "news-id",
        "title": "Article Title",
        "slug": "article-slug",
        "excerpt": "Article excerpt...",
        "featuredImage": "https://example.com/image.jpg",
        "publishedAt": "2025-08-27T11:38:35.688Z",
        "viewCount": 1250,
        "likeCount": 89,
        "isFeatured": true,
        "isBreaking": false,
        "author": {
          "id": "author-id",
          "username": "author",
          "firstName": "Author",
          "lastName": "User",
          "avatar": null
        }
      }
    ],
    "_count": {
      "news": 15
    }
  }
}
```

### Create Category
**POST** `/categories`

Create a new category (requires EDITOR or ADMIN role).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Category",
  "description": "Category description",
  "color": "#3B82F6",
  "icon": "star"
}
```

### Update Category
**PUT** `/categories/:id`

Update a category (requires EDITOR or ADMIN role).

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as create, but all fields are optional.

### Delete Category
**DELETE** `/categories/:id`

Delete a category (requires ADMIN role).

**Headers:** `Authorization: Bearer <token>`

---

## User Management Endpoints (Admin Only)

### Get All Users
**GET** `/users`

Get all users with pagination and filtering (ADMIN only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search in username, email, firstName, lastName
- `role` (string): Filter by role
- `isActive` (boolean): Filter by active status

### Get Single User
**GET** `/users/:id`

Get a single user by ID (ADMIN only).

**Headers:** `Authorization: Bearer <token>`

### Create User
**POST** `/users`

Create a new user (ADMIN only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "password123",
  "firstName": "New",
  "lastName": "User",
  "role": "USER",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Update User
**PUT** `/users/:id`

Update a user (ADMIN only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as create, but password is optional.

### Delete User
**DELETE** `/users/:id`

Delete a user (ADMIN only).

**Headers:** `Authorization: Bearer <token>`

---

## Error Responses

All endpoints return consistent error responses:

### Validation Error (400)
```json
{
  "errors": [
    {
      "type": "field",
      "value": "invalid-email",
      "msg": "Valid email is required",
      "path": "email",
      "location": "body"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "error": "Access denied",
  "message": "No token provided"
}
```

### Authorization Error (403)
```json
{
  "error": "Access denied",
  "message": "Insufficient permissions"
}
```

### Not Found Error (404)
```json
{
  "error": "News article not found"
}
```

### Server Error (500)
```json
{
  "error": "Failed to fetch news articles"
}
```

---

## Rate Limiting

The API implements rate limiting:
- **Window**: 15 minutes
- **Limit**: 100 requests per IP address
- **Headers**: Rate limit information is included in response headers

---

## Default Admin Credentials

For testing purposes, use these default credentials:

- **Email**: admin@umunsi.com
- **Password**: admin123

---

## Testing the API

You can test the API using curl or any HTTP client:

```bash
# Health check
curl http://localhost:5003/api/health

# Login
curl -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@umunsi.com","password":"admin123"}'

# Get news (with token)
curl http://localhost:5003/api/news \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get categories
curl http://localhost:5003/api/categories
```

---

**Last Updated**: August 27, 2025
**Version**: 1.0.0
