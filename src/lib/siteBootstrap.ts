import { apiClient } from '../services/api';

const CATEGORIES_PERSIST_KEY = 'umunsi_categories_v1';
const HOME_PERSIST_KEY = 'umunsi_home_cache_v1';

export const readPersistedCategories = () => {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(CATEGORIES_PERSIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { data?: unknown; expires?: number };
    if (parsed.expires && parsed.expires < Date.now()) return [];
    const data = parsed.data;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const readPersistedHomePosts = () => {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(HOME_PERSIST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

let warmStarted = false;

const isHomeRoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path === '/' || path === '';
};

export const warmSiteData = () => {
  if (typeof window === 'undefined' || warmStarted || !isHomeRoute()) return;
  warmStarted = true;
  void apiClient.getCategories({ includeInactive: false }).catch(() => undefined);
  void apiClient.getPosts({ status: 'PUBLISHED', limit: 60 }).catch(() => undefined);
};
