// Shared Prisma select / include objects used across controllers.
// Centralising these avoids copy-paste drift when schema columns change.

// --- Author selects --------------------------------------------------------

/** Compact author info used in news article listings. */
const NEWS_AUTHOR_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  avatar: true,
};

/** Extended author info used in post listings. */
const POST_AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  avatar: true,
  profileUrl: true,
  role: true,
  isVerified: true,
  createdAt: true,
};

// --- Category selects ------------------------------------------------------

/** Category select used in news (includes icon). */
const NEWS_CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  color: true,
  icon: true,
};

/** Category select used in posts (no icon). */
const POST_CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  color: true,
};

// --- Convenience include objects -------------------------------------------

/** Standard include for news queries (author + category). */
const NEWS_INCLUDE = {
  author: { select: NEWS_AUTHOR_SELECT },
  category: { select: NEWS_CATEGORY_SELECT },
};

/** Standard include for post queries (author + category). */
const POST_INCLUDE = {
  author: { select: POST_AUTHOR_SELECT },
  category: { select: POST_CATEGORY_SELECT },
};

module.exports = {
  NEWS_AUTHOR_SELECT,
  POST_AUTHOR_SELECT,
  NEWS_CATEGORY_SELECT,
  POST_CATEGORY_SELECT,
  NEWS_INCLUDE,
  POST_INCLUDE,
};
