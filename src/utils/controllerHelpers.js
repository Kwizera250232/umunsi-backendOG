const nodemailer = require('nodemailer');

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Parse page / limit from query params and return skip/take values.
 */
const parsePagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, parseInt(query.limit, 10) || 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
};

/**
 * Build a standardised pagination response object.
 */
const buildPaginationResponse = (page, take, total) => {
  const totalPages = Math.ceil(total / take);
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: take,
  };
};

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Remove keys whose value is `undefined` from a Prisma where-clause object.
 */
const cleanWhere = (where) => {
  Object.keys(where).forEach((key) => {
    if (where[key] === undefined) {
      delete where[key];
    }
  });
  return where;
};

/**
 * Parse a value that may arrive as a string ("true"/"false") or a boolean.
 * Returns `defaultValue` when the input is `undefined`.
 */
const parseBoolean = (value, defaultValue) => {
  if (value === undefined) return defaultValue;
  return value === 'true' || value === true;
};

// ---------------------------------------------------------------------------
// Error / success response helpers
// ---------------------------------------------------------------------------

/**
 * Send a standardised error JSON response.
 * In development, the raw error message is included; in production it is
 * replaced with a generic string.
 */
const sendError = (res, statusCode, error, rawDetails) => {
  const details =
    process.env.NODE_ENV === 'development'
      ? rawDetails
      : 'Internal server error';
  return res.status(statusCode).json({ error, details });
};

// ---------------------------------------------------------------------------
// Auth / role helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when the request was made by an ADMIN user.
 */
const isAdminRequest = (req) => req.user && req.user.role === 'ADMIN';

/**
 * Strip sensitive fields (e.g. viewCount) from a record when the caller is
 * not an admin.
 */
const sanitizeForRole = (record, isAdmin, fieldsToStrip = ['viewCount']) => {
  if (isAdmin || !record) return record;
  const copy = { ...record };
  for (const field of fieldsToStrip) {
    delete copy[field];
  }
  return copy;
};

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

/**
 * Simple synchronous slug generator (lowercase, alphanumeric + hyphens).
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// ---------------------------------------------------------------------------
// App / frontend URL
// ---------------------------------------------------------------------------

/**
 * Resolve the public-facing frontend base URL from env vars.
 */
const getAppBaseUrl = () => {
  const configured =
    process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.APP_URL;
  return (configured || 'https://umunsi.com').replace(/\/$/, '');
};

// ---------------------------------------------------------------------------
// Mail transport
// ---------------------------------------------------------------------------

/**
 * Create a Nodemailer SMTP transport from env vars.
 * Returns `null` when the required env vars are missing.
 *
 * @param {object} [opts]
 * @param {number} [opts.timeout] – optional connection/socket timeout in ms
 */
const getMailTransport = (opts = {}) => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const transportOpts = {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };

  if (opts.timeout) {
    transportOpts.connectionTimeout = opts.timeout;
    transportOpts.greetingTimeout = opts.timeout;
    transportOpts.socketTimeout = opts.timeout;
  }

  return nodemailer.createTransport(transportOpts);
};

module.exports = {
  parsePagination,
  buildPaginationResponse,
  cleanWhere,
  parseBoolean,
  sendError,
  isAdminRequest,
  sanitizeForRole,
  generateSlug,
  getAppBaseUrl,
  getMailTransport,
};
