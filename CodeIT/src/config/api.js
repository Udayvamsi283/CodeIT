// Centralized API Base URL configuration
// In production (Vercel), requests default to same-origin relative path (API_BASE_URL = '')
// so requests become /api/* and are proxied to Render backend via Vercel rewrites.
// In local development, Vite dev server proxies /api/* to http://localhost:3000.
// VITE_API_URL can still be set to explicitly override if needed for custom environments.
const rawApiUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');
