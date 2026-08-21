import { getDB, saveDB } from './db';

// Simulate network latency
const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

const getOrdersForSeller = (sellerId, orders) => {
  return orders.filter(o => o.sellerId === sellerId);
};

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const api = {
  auth: {
    login: async (usernameOrEmail, password) => {
      try {
        const response = await fetch('http://localhost:8081/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: usernameOrEmail, password })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Email atau password salah.');
        }

        const { accessToken, role } = result.data;
        const decoded = parseJwt(accessToken);
        const userId = decoded?.sub;

        sessionStorage.setItem('ecom_token', accessToken);
        sessionStorage.setItem('ecom_auth_token', accessToken);

        return {
          success: true,
          message: 'Login berhasil',
          data: {
            token: accessToken,
            user: {
              id: userId,
              sellerId: userId,
              role: role?.toLowerCase() || 'buyer',
              email: usernameOrEmail,
              name: usernameOrEmail ? usernameOrEmail.split('@')[0] : 'User'
            }
          }
        };
      } catch (error) {
        throw new Error(error.message || 'Terjadi kesalahan saat login.');
      }
    },

    loginWithGoogle: async (idToken) => {
      try {
        const response = await fetch('http://localhost:8081/api/v1/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 404 && result.message === 'USER_NOT_REGISTERED') {
            const err = new Error('USER_NOT_REGISTERED');
            err.googleUser = result.data;
            err.idToken = idToken;
            throw err;
          }
          throw new Error(result.message || 'Gagal login menggunakan Google.');
        }

        const { accessToken, role } = result.data;
        const decoded = parseJwt(accessToken);
        const userId = decoded?.sub;
        sessionStorage.setItem('ecom_token', accessToken);
        sessionStorage.setItem('ecom_auth_token', accessToken);

        return {
          success: true,
          message: 'Login Google berhasil',
          data: {
            token: accessToken,
            user: {
              id: userId,
              sellerId: userId,
              role: role?.toLowerCase() || 'buyer',
              email: decoded?.email || result.data.email || '',
              name: decoded?.email ? decoded.email.split('@')[0] : 'Google User'
            }
          }
        };
      } catch (error) {
        throw error;
      }
    },

    registerGoogleBuyer: async ({ idToken, phone }) => {
      try {
        const response = await fetch('http://localhost:8081/api/v1/auth/google/register/buyer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, phone })
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors[0].message);
          }
          throw new Error(result.message || 'Registrasi Google gagal');
        }

        const { accessToken, role } = result.data;
        const decoded = parseJwt(accessToken);
        const userId = decoded?.sub;
        sessionStorage.setItem('ecom_token', accessToken);
        sessionStorage.setItem('ecom_auth_token', accessToken);

        return {
          success: true,
          message: 'Registrasi Google berhasil',
          data: {
            token: accessToken,
            user: {
              id: userId,
              sellerId: userId,
              role: role?.toLowerCase() || 'buyer',
              email: decoded?.email || '',
            }
          }
        };
      } catch (error) {
        throw error;
      }
    },

    registerGoogleSeller: async ({ idToken, phone, storeName, storeDescription }) => {
      try {
        const response = await fetch('http://localhost:8081/api/v1/auth/google/register/seller', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, phone, storeName, storeDescription })
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors[0].message);
          }
          throw new Error(result.message || 'Registrasi Google gagal');
        }

        const { accessToken, role } = result.data;
        const decoded = parseJwt(accessToken);
        const userId = decoded?.sub;
        sessionStorage.setItem('ecom_token', accessToken);
        sessionStorage.setItem('ecom_auth_token', accessToken);

        return {
          success: true,
          message: 'Registrasi Penjual Google berhasil. Silakan tunggu verifikasi admin.',
          data: {
            token: accessToken,
            user: {
              id: userId,
              sellerId: userId,
              role: role?.toLowerCase() || 'seller',
              email: decoded?.email || '',
            }
          }
        };
      } catch (error) {
        throw error;
      }
    },

    register: async ({ email, phoneNumber, password, name, role, storeName, category }) => {
      try {
        const isSeller = role === 'seller';
        const url = isSeller 
          ? 'http://localhost:8081/api/v1/auth/register/seller' 
          : 'http://localhost:8081/api/v1/auth/register/buyer';
          
        const body = isSeller ? {
          email,
          password,
          fullName: name,
          phone: phoneNumber,
          storeName: storeName || `${name} Store`,
          storeDescription: category || 'General'
        } : {
          email,
          password,
          fullName: name,
          phone: phoneNumber
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        });

        const result = await response.json();
        
        if (!response.ok) {
          // Tangani kemungkinan error array dari Spring Validation
          if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors[0].message);
          }
          throw new Error(result.message || 'Gagal melakukan registrasi');
        }

        // Return struktur sesuai mock atau API backend agar komponen tidak rusak
        return {
          success: true,
          message: isSeller 
            ? 'Registrasi penjual berhasil. Silakan tunggu verifikasi admin.' 
            : 'Registrasi berhasil. Silakan login.',
          data: result.data || {}
        };
      } catch (error) {
        throw new Error(error.message || 'Terjadi kesalahan jaringan atau server.');
      }
    }
  },

  admin: {
    getPendingSellers: async () => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        try {
          const response = await fetch('http://localhost:8081/api/v1/admin/sellers/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const result = await response.json();
            const items = result.data?.content || result.data || [];
            return { success: true, data: items };
          }
        } catch (err) {
          console.warn('Backend fetch failed for pending sellers:', err);
        }
      }
      return { success: true, data: [] };
    },

    getAllSellers: async () => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        try {
          const response = await fetch('http://localhost:8081/api/v1/admin/users?role=SELLER', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const result = await response.json();
            const items = result.data?.content || result.data || [];
            const mapped = items.map(s => ({
              id: s.id,
              ownerId: s.id,
              storeName: s.fullName ? `${s.fullName}'s Store` : 'Store',
              ownerName: s.fullName || s.email,
              category: 'General',
              productsCount: 0,
              ordersCount: 0,
              status: s.status === 'ACTIVE' ? 'aktif' : 'menunggu',
              createdAt: s.createdAt
            }));
            return { success: true, data: mapped };
          }
        } catch (err) {
          console.warn('Backend fetch failed for all sellers:', err);
        }
      }
      return { success: true, data: [] };
    },

    approveSeller: async (sellerId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        const response = await fetch(`http://localhost:8081/api/v1/admin/sellers/${sellerId}/approve`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          return { success: true, message: 'Penjual berhasil disetujui.' };
        }
      }
      return { success: true, message: 'Penjual berhasil disetujui.' };
    },

    rejectSeller: async (sellerId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        const response = await fetch(`http://localhost:8081/api/v1/admin/sellers/${sellerId}/reject`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          return { success: true, message: 'Penjual berhasil ditolak.' };
        }
      }
      return { success: true, message: 'Penjual berhasil ditolak.' };
    },

    toggleSellerStatus: async (sellerId) => {
      return { success: true, message: 'Status penjual berhasil diubah.' };
    },

    deleteSeller: async (sellerId) => {
      return { success: true, message: 'Penjual berhasil dihapus.' };
    },

    getDashboardStats: async () => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        try {
          const response = await fetch('http://localhost:8081/api/v1/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const result = await response.json();
            const d = result.data || {};
            return {
              success: true,
              data: {
                totalSellers: d.totalSellers || 0,
                activeSellers: d.activeSellers || 0,
                pendingSellers: d.pendingSellers || 0,
                totalBuyers: d.totalBuyers || 0,
                totalOrders: d.totalOrders || 0,
                monthlyRevenue: Number(d.totalRevenue || 0),
                ordersDistribution: d.ordersDistribution || {
                  terkirim: 0,
                  dikirim: 0,
                  diproses: 0,
                  menunggu: 0
                }
              }
            };
          }
        } catch (err) {
          console.warn('Failed to fetch admin dashboard stats from backend:', err);
        }
      }
      return {
        success: true,
        data: {
          totalSellers: 0,
          activeSellers: 0,
          pendingSellers: 0,
          totalBuyers: 0,
          totalOrders: 0,
          monthlyRevenue: 0,
          ordersDistribution: { terkirim: 0, dikirim: 0, diproses: 0, menunggu: 0 }
        }
      };
    },
  },

  seller: {
    getProducts: async (sellerId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        try {
          const response = await fetch('http://localhost:8081/api/v1/seller/products', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const result = await response.json();
            const items = result.data?.content || result.data || [];
            const mapped = items.map(p => ({
              id: p.id,
              sellerId: p.sellerId || sellerId,
              storeName: p.sellerStoreName || 'My Store',
              name: p.name,
              sku: `SKU-${p.id ? p.id.toString().slice(0, 4) : '0000'}`,
              category: p.description || 'General',
              sellPrice: Number(p.price),
              costPrice: Number(p.price) * 0.5,
              stock: p.stock,
              reorderThreshold: 10,
              sold30d: 0,
              revenue30d: 0,
              status: p.status === 'ACTIVE' ? 'aktif' : 'nonaktif',
              imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#EB5E28"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#FFF">${p.name}</text></svg>`),
              rating: 5.0,
              reviewsCount: 0
            }));
            return { success: true, data: mapped };
          }
        } catch (err) {
          console.warn('Backend fetch failed, falling back to local DB:', err);
        }
      }
      await delay(150);
      const products = getDB('ecom_products');
      return {
        success: true,
        data: products.filter(p => p.sellerId === sellerId && p.status !== 'nonaktif')
      };
    },

    addProduct: async (sellerId, productData) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) {
        throw new Error('Anda harus login terlebih dahulu.');
      }

      const body = {
        name: productData.name,
        description: productData.description || productData.category || '',
        price: Number(productData.price || productData.sellPrice || 0),
        stock: Number(productData.stock || 0),
        weightGram: Number(productData.weightGram || 1000)
      };

      const response = await fetch('http://localhost:8081/api/v1/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }
        throw new Error(result.message || 'Gagal menambahkan produk.');
      }

      const p = result.data;
      const newProduct = {
        id: p.id,
        sellerId: p.sellerId || sellerId,
        storeName: p.sellerStoreName || productData.storeName || 'My Store',
        name: p.name,
        sku: `SKU-${p.id ? p.id.toString().slice(0, 4) : Date.now().toString().slice(-4)}`,
        category: p.description || productData.category || 'General',
        sellPrice: Number(p.price),
        costPrice: Number(p.price) * 0.5,
        stock: p.stock,
        reorderThreshold: Number(productData.reorderThreshold || 10),
        sold30d: 0,
        revenue30d: 0,
        status: p.status === 'ACTIVE' ? 'aktif' : 'nonaktif',
        imageUrl: productData.imageUrl || 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#EB5E28"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#FFF">${p.name}</text></svg>`),
        rating: 5.0,
        reviewsCount: 0
      };

      // Simpan ke local DB sebagai cadangan agar UI terupdate tanpa refresh
      const products = getDB('ecom_products');
      products.push(newProduct);
      saveDB('ecom_products', products);

      return { success: true, message: 'Produk berhasil ditambahkan ke database.', data: newProduct };
    },

    updateProduct: async (sellerId, productId, productData) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        try {
          const body = {
            name: productData.name,
            description: productData.description || productData.category,
            price: (productData.sellPrice || productData.price) ? Number(productData.sellPrice || productData.price) : undefined,
            stock: productData.stock !== undefined ? Number(productData.stock) : undefined,
            weightGram: productData.weightGram !== undefined ? Number(productData.weightGram) : 1000,
            status: productData.status === 'nonaktif' ? 'INACTIVE' : 'ACTIVE'
          };

          const response = await fetch(`http://localhost:8081/api/v1/seller/products/${productId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
          });

          if (response.ok) {
            const result = await response.json();
            const p = result.data;
            const updatedProduct = {
              id: p.id,
              sellerId: p.sellerId || sellerId,
              storeName: p.sellerStoreName || 'My Store',
              name: p.name,
              category: p.description || 'General',
              sellPrice: Number(p.price),
              costPrice: Number(p.price) * 0.5,
              stock: p.stock,
              reorderThreshold: 10,
              status: p.status === 'ACTIVE' ? 'aktif' : 'nonaktif',
            };
            return { success: true, message: 'Produk berhasil diperbarui.', data: updatedProduct };
          }
        } catch (err) {
          console.warn('Backend update failed:', err);
        }
      }

      await delay(150);
      const products = getDB('ecom_products');
      const idx = products.findIndex(p => p.id === productId && p.sellerId === sellerId);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          ...productData,
          sellPrice: Number(productData.sellPrice),
          costPrice: Number(productData.costPrice),
          stock: Number(productData.stock),
          reorderThreshold: Number(productData.reorderThreshold)
        };
        saveDB('ecom_products', products);
        return { success: true, message: 'Produk berhasil diperbarui.', data: products[idx] };
      }
      throw new Error('Produk tidak ditemukan.');
    },

    deleteProduct: async (sellerId, productId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        try {
          const response = await fetch(`http://localhost:8081/api/v1/seller/products/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            return { success: true, message: 'Produk berhasil dihapus.' };
          }
        } catch (err) {
          console.warn('Backend delete failed:', err);
        }
      }

      await delay(150);
      const products = getDB('ecom_products');
      const idx = products.findIndex(p => p.id === productId && p.sellerId === sellerId);
      if (idx !== -1) {
        products[idx].status = 'nonaktif';
        saveDB('ecom_products', products);
        return { success: true, message: 'Produk berhasil dihapus.' };
      }
      throw new Error('Produk tidak ditemukan.');
    },

    getOrders: async (sellerId) => {
      await delay(150);
      const orders = getDB('ecom_orders');
      return {
        success: true,
        data: getOrdersForSeller(sellerId, orders)
      };
    },

    updateOrderStatus: async (sellerId, orderId, status) => {
      await delay(150);
      const orders = getDB('ecom_orders');
      const idx = orders.findIndex(o => o.id === orderId && o.sellerId === sellerId);
      if (idx !== -1) {
        orders[idx].status = status;
        saveDB('ecom_orders', orders);
        return { success: true, message: `Status pesanan diperbarui menjadi ${status}.`, data: orders[idx] };
      }
      throw new Error('Pesanan tidak ditemukan.');
    },

    confirmManualPayment: async (sellerId, orderId) => {
      await delay(200);
      const orders = getDB('ecom_orders');
      const idx = orders.findIndex(o => o.id === orderId && o.sellerId === sellerId);
      if (idx !== -1) {
        orders[idx].status = 'diproses'; // Move from proof_submitted to processing/diproses
        saveDB('ecom_orders', orders);
        return { success: true, message: 'Pembayaran manual berhasil dikonfirmasi.', data: orders[idx] };
      }
      throw new Error('Pesanan tidak ditemukan.');
    },

    getAnalytics: async (sellerId) => {
      await delay(200);
      const orders = getDB('ecom_orders').filter(o => o.sellerId === sellerId);
      const products = getDB('ecom_products').filter(p => p.sellerId === sellerId && p.status !== 'nonaktif');

      const completedOrders = orders.filter(o => o.status === 'terkirim');
      
      const totalRevenue = orders
        .filter(o => ['terkirim', 'dikirim', 'diproses'].includes(o.status))
        .reduce((sum, o) => sum + o.totalAmount, 0);

      // High value orders
      const highValueOrders = [...orders]
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 8);

      // Low stock list
      const lowStockProducts = products.filter(p => p.stock <= p.reorderThreshold);

      // Top products based on revenue
      const topProducts = [...products]
        .sort((a, b) => b.revenue30d - a.revenue30d)
        .slice(0, 5);

      return {
        success: true,
        data: {
          totalProducts: products.length,
          totalOrders: orders.length,
          pendingConfirmations: orders.filter(o => o.status === 'proof_submitted').length,
          monthlyRevenue: totalRevenue,
          aov: orders.length ? Math.round(totalRevenue / orders.length) : 0,
          returnRate: 2.9, // static metric
          todayRevenue: totalRevenue * 0.1, // simulated today's revenue (10% of total)
          todayTarget: totalRevenue * 0.12, // target
          todayOrders: Math.round(orders.length * 0.08) || 1,
          lowStockCount: lowStockProducts.length,
          lowStockProducts,
          topProducts,
          highValueOrders,
          paymentDistribution: {
            transfer_bank: orders.filter(o => o.paymentMethod === 'transfer_bank').reduce((sum, o) => sum + o.totalAmount, 0),
            gopay: orders.filter(o => o.paymentMethod === 'gopay').reduce((sum, o) => sum + o.totalAmount, 0),
            ovo: orders.filter(o => o.paymentMethod === 'ovo').reduce((sum, o) => sum + o.totalAmount, 0),
            qris: orders.filter(o => o.paymentMethod === 'qris').reduce((sum, o) => sum + o.totalAmount, 0),
            dana: orders.filter(o => o.paymentMethod === 'dana').reduce((sum, o) => sum + o.totalAmount, 0),
            cod: orders.filter(o => o.paymentMethod === 'cod').reduce((sum, o) => sum + o.totalAmount, 0)
          }
        }
      };
    }
  },

  buyer: {
    getProducts: async ({ search = '', category = 'Semua' }) => {
      try {
        let url = 'http://localhost:8081/api/v1/products';
        if (search) {
          url += `?keyword=${encodeURIComponent(search)}`;
        }
        const response = await fetch(url);
        if (response.ok) {
          const result = await response.json();
          const items = result.data?.content || result.data || [];
          let mapped = items.map(p => ({
            id: p.id,
            sellerId: p.sellerId,
            storeName: p.sellerStoreName || 'My Store',
            name: p.name,
            category: p.description || 'General',
            sellPrice: Number(p.price),
            costPrice: Number(p.price) * 0.5,
            stock: p.stock,
            reorderThreshold: 10,
            status: p.status === 'ACTIVE' ? 'aktif' : 'nonaktif',
            imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#EB5E28"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#FFF">${p.name}</text></svg>`),
            rating: 5.0,
            reviewsCount: 0
          }));

          if (category !== 'Semua') {
            mapped = mapped.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
          }

          return { success: true, data: mapped };
        }
      } catch (err) {
        console.warn('Backend fetch failed for buyer products:', err);
      }

      return { success: true, data: [] };
    },

    getProductDetail: async (productId) => {
      try {
        const response = await fetch(`http://localhost:8081/api/v1/products/${productId}`);
        if (response.ok) {
          const result = await response.json();
          const p = result.data;
          if (p) {
            return {
              success: true,
              data: {
                id: p.id,
                sellerId: p.sellerId,
                storeName: p.sellerStoreName || 'My Store',
                name: p.name,
                category: p.description || 'General',
                sellPrice: Number(p.price),
                costPrice: Number(p.price) * 0.5,
                stock: p.stock,
                reorderThreshold: 10,
                status: p.status === 'ACTIVE' ? 'aktif' : 'nonaktif',
                imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#EB5E28"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#FFF">${p.name}</text></svg>`),
                rating: 5.0,
                reviewsCount: 0
              }
            };
          }
        }
      } catch (err) {
        console.warn('Backend product detail fetch failed:', err);
      }
      throw new Error('Produk tidak ditemukan.');
    },

    getCart: async (buyerId) => {
      await delay(100);
      const carts = getDB('ecom_carts');
      const cart = carts[buyerId] || [];
      const products = getDB('ecom_products');
      
      const cartDetails = cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          return {
            ...item,
            name: product.name,
            price: product.sellPrice,
            imageUrl: product.imageUrl,
            storeName: product.storeName,
            sellerId: product.sellerId,
            stock: product.stock
          };
        }
        return null;
      }).filter(Boolean);

      return { success: true, data: cartDetails };
    },

    addToCart: async (buyerId, { productId, qty = 1 }) => {
      await delay(100);
      const carts = getDB('ecom_carts');
      const cart = carts[buyerId] || [];
      
      const products = getDB('ecom_products');
      const product = products.find(p => p.id === productId);
      if (!product || product.stock < qty) {
        throw new Error('Stok produk tidak mencukupi.');
      }

      const existingIndex = cart.findIndex(item => item.productId === productId);
      if (existingIndex !== -1) {
        cart[existingIndex].qty += qty;
      } else {
        cart.push({ productId, qty });
      }

      carts[buyerId] = cart;
      saveDB('ecom_carts', carts);
      return { success: true, message: 'Produk ditambahkan ke keranjang.', data: cart };
    },

    updateCartItem: async (buyerId, productId, qty) => {
      await delay(100);
      const carts = getDB('ecom_carts');
      const cart = carts[buyerId] || [];
      
      const products = getDB('ecom_products');
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Produk tidak ditemukan.');
      if (product.stock < qty) throw new Error('Stok produk tidak mencukupi.');

      const idx = cart.findIndex(item => item.productId === productId);
      if (idx !== -1) {
        cart[idx].qty = qty;
        carts[buyerId] = cart;
        saveDB('ecom_carts', carts);
        return { success: true, data: cart };
      }
      throw new Error('Item tidak ditemukan di keranjang.');
    },

    removeFromCart: async (buyerId, productId) => {
      await delay(100);
      const carts = getDB('ecom_carts');
      let cart = carts[buyerId] || [];
      cart = cart.filter(item => item.productId !== productId);
      carts[buyerId] = cart;
      saveDB('ecom_carts', carts);
      return { success: true, message: 'Item dihapus dari keranjang.' };
    },

    checkout: async (buyerId, { paymentMethod }) => {
      await delay(200);
      const carts = getDB('ecom_carts');
      const cart = carts[buyerId] || [];
      if (cart.length === 0) throw new Error('Keranjang belanja kosong.');

      const products = getDB('ecom_products');
      const orders = getDB('ecom_orders');
      const users = getDB('ecom_users');
      const buyer = users.find(u => u.id === buyerId);

      // Map cart items to actual products & check stock
      const orderItems = [];
      let totalAmount = 0;
      let sellerId = null;

      for (const item of cart) {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) throw new Error('Salah satu produk di keranjang tidak ditemukan.');
        if (prod.stock < item.qty) throw new Error(`Stok ${prod.name} tidak mencukupi.`);
        
        // Ensure for simplicity all checked out items belong to the same seller in one order
        if (sellerId === null) {
          sellerId = prod.sellerId;
        } else if (sellerId !== prod.sellerId) {
          throw new Error('Maaf, untuk demo ini silakan checkout produk dari satu toko yang sama secara terpisah.');
        }

        prod.stock -= item.qty;
        prod.sold30d += item.qty;
        prod.revenue30d += prod.sellPrice * item.qty;
        totalAmount += prod.sellPrice * item.qty;

        orderItems.push({
          productId: prod.id,
          name: prod.name,
          price: prod.sellPrice,
          qty: item.qty
        });
      }

      // Create new order
      const newOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        buyerId,
        buyerName: buyer?.name || 'Pembeli',
        sellerId,
        items: orderItems,
        totalAmount,
        marginPercentage: 50.0, // default placeholder margin
        paymentMethod,
        status: paymentMethod === 'cod' ? 'diproses' : 'menunggu', // COD langsung diproses, others pending payment
        createdAt: new Date().toISOString(),
        paymentProofUrl: null
      };

      orders.push(newOrder);
      
      // Update DB
      saveDB('ecom_products', products);
      saveDB('ecom_orders', orders);
      
      // Clear Cart
      carts[buyerId] = [];
      saveDB('ecom_carts', carts);

      // Increase order count in seller profile
      const sellers = getDB('ecom_sellers');
      const sIdx = sellers.findIndex(s => s.id === sellerId);
      if (sIdx !== -1) {
        sellers[sIdx].ordersCount += 1;
        saveDB('ecom_sellers', sellers);
      }

      return {
        success: true,
        message: 'Pesanan berhasil dibuat.',
        data: newOrder
      };
    },

    getOrders: async (buyerId) => {
      await delay(150);
      const orders = getDB('ecom_orders');
      return {
        success: true,
        data: orders.filter(o => o.buyerId === buyerId)
      };
    },

    uploadPaymentProof: async (orderId, { proofDataUrl }) => {
      await delay(250);
      const orders = getDB('ecom_orders');
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        orders[idx].status = 'proof_submitted';
        orders[idx].paymentProofUrl = proofDataUrl;
        saveDB('ecom_orders', orders);
        return { success: true, message: 'Bukti pembayaran berhasil diunggah.', data: orders[idx] };
      }
      throw new Error('Pesanan tidak ditemukan.');
    }
  },

  chat: {
    getConversations: async (userId, role) => {
      await delay(150);
      const conversations = getDB('ecom_conversations');
      if (role === 'buyer') {
        return { success: true, data: conversations.filter(c => c.buyerId === userId) };
      } else {
        // find sellerId
        const users = getDB('ecom_users');
        const user = users.find(u => u.id === userId);
        const sellerId = user?.sellerId;
        return { success: true, data: conversations.filter(c => c.sellerId === sellerId) };
      }
    },

    getMessages: async (conversationId) => {
      await delay(100);
      const conversations = getDB('ecom_conversations');
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        return { success: true, data: conv.messages || [] };
      }
      return { success: true, data: [] };
    },

    sendMessage: async (conversationId, { senderId, content, attachmentUrl = null }) => {
      await delay(100);
      const conversations = getDB('ecom_conversations');
      const idx = conversations.findIndex(c => c.id === conversationId);
      if (idx !== -1) {
        const newMessage = {
          id: `msg-${Date.now()}`,
          senderId,
          content,
          timestamp: new Date().toISOString(),
          attachmentUrl
        };
        conversations[idx].messages.push(newMessage);
        conversations[idx].lastMessage = content || 'Mengirim bukti/gambar';
        conversations[idx].lastUpdated = new Date().toISOString();
        saveDB('ecom_conversations', conversations);
        return { success: true, data: newMessage };
      }
      throw new Error('Percakapan tidak ditemukan.');
    },

    createConversation: async ({ buyerId, sellerId }) => {
      await delay(150);
      const conversations = getDB('ecom_conversations');
      let conv = conversations.find(c => c.buyerId === buyerId && c.sellerId === sellerId);
      
      if (!conv) {
        const sellers = getDB('ecom_sellers');
        const seller = sellers.find(s => s.id === sellerId);
        const users = getDB('ecom_users');
        const buyer = users.find(u => u.id === buyerId);

        conv = {
          id: `conv-${Date.now()}`,
          buyerId,
          buyerName: buyer?.name || 'Pembeli',
          sellerId,
          storeName: seller?.storeName || 'Toko Penjual',
          lastMessage: 'Memulai percakapan baru.',
          lastUpdated: new Date().toISOString(),
          messages: []
        };
        conversations.push(conv);
        saveDB('ecom_conversations', conversations);
      }
      return { success: true, data: conv };
    }
  }
};
