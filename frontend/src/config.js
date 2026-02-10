/**
 * Central API configuration. Values come from .env (REACT_APP_*).
 */
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7193';
const API_URL = `${BASE_URL}/api`;

export { BASE_URL, API_URL };
