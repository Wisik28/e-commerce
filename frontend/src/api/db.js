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
