/**
 * Central API configuration. Values come from .env (REACT_APP_*).
 */
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7193';
const API_URL = `${BASE_URL}/api`;

/** Data URI for image onError fallback - avoids re-requesting a broken URL (stops 404 loop). */
const BROKEN_IMAGE_PLACEHOLDER =
  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>');

/**
 * Build full URL for database-driven image paths.
 * Handles: null/empty (return fallback), full http(s) URL (return as-is), /path (BASE_URL + path), path (BASE_URL + / + path).
 */
function getImageUrl(url, fallback = BROKEN_IMAGE_PLACEHOLDER) {
  if (url == null || String(url).trim() === '') return fallback;
  const s = String(url).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${BASE_URL}${s}`;
  return `${BASE_URL}/${s}`;
}

export { BASE_URL, API_URL, BROKEN_IMAGE_PLACEHOLDER, getImageUrl };
