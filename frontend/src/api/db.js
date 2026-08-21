// Helper to generate dynamic SVG patterns for product placeholders
const createSvgPlaceholder = (title, bgColor = '#EB5E28', textColor = '#FFFFFF') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="${bgColor}"/>
    <circle cx="150" cy="120" r="50" fill="${textColor}" fill-opacity="0.15"/>
    <path d="M 50,220 L 250,220 M 100,200 L 200,200" stroke="${textColor}" stroke-width="6" stroke-linecap="round" opacity="0.3"/>
    <text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-weight="bold" font-size="20" fill="${textColor}">${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const INITIAL_SELLERS = [];
const INITIAL_PRODUCTS = [];
const INITIAL_USERS = [];
const INITIAL_ORDERS = [];
const INITIAL_CONVERSATIONS = [];

export const initDB = () => {
  // Clear any legacy mock DB initialized in previous sessions
  if (sessionStorage.getItem('ecom_db_initialized') !== 'v2_real_db_only') {
    sessionStorage.setItem('ecom_users', JSON.stringify(INITIAL_USERS));
    sessionStorage.setItem('ecom_sellers', JSON.stringify(INITIAL_SELLERS));
    sessionStorage.setItem('ecom_products', JSON.stringify(INITIAL_PRODUCTS));
    sessionStorage.setItem('ecom_orders', JSON.stringify(INITIAL_ORDERS));
    sessionStorage.setItem('ecom_conversations', JSON.stringify(INITIAL_CONVERSATIONS));
    sessionStorage.setItem('ecom_carts', JSON.stringify({}));
    sessionStorage.setItem('ecom_db_initialized', 'v2_real_db_only');
  }
};

export const getDB = (key) => {
  initDB();
  return JSON.parse(sessionStorage.getItem(key)) || [];
};

export const saveDB = (key, data) => {
  sessionStorage.setItem(key, JSON.stringify(data));
};
