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
        const response = await fetch('http://localhost:8080/api/v1/auth/login', {
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
        const response = await fetch('http://localhost:8080/api/v1/auth/google', {
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
        const response = await fetch('http://localhost:8080/api/v1/auth/google/register/buyer', {
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
        const response = await fetch('http://localhost:8080/api/v1/auth/google/register/seller', {
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
          ? 'http://localhost:8080/api/v1/auth/register/seller' 
          : 'http://localhost:8080/api/v1/auth/register/buyer';
          
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
          const response = await fetch('http://localhost:8080/api/v1/admin/sellers/pending', {
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
          const response = await fetch('http://localhost:8080/api/v1/admin/users?role=SELLER', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const result = await response.json();
            const items = result.data?.content || result.data || [];
            const mapped = items.map(s => ({
              id: s.id,
              ownerId: s.id,
              storeName: s.storeName || (s.fullName ? `${s.fullName}'s Store` : 'Store'),
              ownerName: s.fullName || s.email,
              category: s.category || 'General',
              productsCount: s.productsCount || 0,
              ordersCount: s.ordersCount || 0,
              status: s.verificationStatus === 'PENDING' 
                ? 'menunggu' 
                : (s.status === 'ACTIVE' ? 'aktif' : 'nonaktif'),
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
        const response = await fetch(`http://localhost:8080/api/v1/admin/sellers/${sellerId}/approve`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Gagal menyetujui penjual.');
        }
        return { success: true, message: 'Penjual berhasil disetujui.' };
      }
      throw new Error('Anda harus login terlebih dahulu.');
    },

    rejectSeller: async (sellerId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        const response = await fetch(`http://localhost:8080/api/v1/admin/sellers/${sellerId}/reject`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Gagal menolak penjual.');
        }
        return { success: true, message: 'Penjual berhasil ditolak.' };
      }
      throw new Error('Anda harus login terlebih dahulu.');
    },

    toggleSellerStatus: async (sellerId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        const response = await fetch(`http://localhost:8080/api/v1/admin/users/${sellerId}/toggle-status`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Gagal mengubah status penjual.');
        }
        return { success: true, message: 'Status penjual berhasil diubah.' };
      }
      throw new Error('Anda harus login terlebih dahulu.');
    },

    deleteSeller: async (sellerId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        const response = await fetch(`http://localhost:8080/api/v1/admin/users/${sellerId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Gagal menghapus penjual.');
        }
        return { success: true, message: 'Penjual berhasil dihapus.' };
      }
      throw new Error('Anda harus login terlebih dahulu.');
    },

    getDashboardStats: async () => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        try {
          const response = await fetch('http://localhost:8080/api/v1/admin/dashboard', {
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
          const response = await fetch('http://localhost:8080/api/v1/seller/products', {
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

      const response = await fetch('http://localhost:8080/api/v1/seller/products', {
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

          const response = await fetch(`http://localhost:8080/api/v1/seller/products/${productId}`, {
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
          const response = await fetch(`http://localhost:8080/api/v1/seller/products/${productId}`, {
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
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        try {
          const response = await fetch('http://localhost:8080/api/v1/seller/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const result = await response.json();
            const items = result.data?.content || result.data || [];
            
            const mapped = await Promise.all(items.map(async (o) => {
              let orderStatus = 'menunggu';
              let proofUrl = null;
              if (o.status === 'PAID' || o.status === 'PROCESSING') {
                orderStatus = 'diproses';
              } else if (o.status === 'SHIPPED') {
                orderStatus = 'dikirim';
              } else if (o.status === 'COMPLETED') {
                orderStatus = 'terkirim';
              } else if (o.status === 'CANCELLED') {
                orderStatus = 'cancelled';
              } else if (o.status === 'PENDING_PAYMENT') {
                try {
                  const payRes = await fetch(`http://localhost:8080/api/v1/orders/${o.id}/payment`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (payRes.ok) {
                    const payData = await payRes.json();
                    if (payData.data?.status === 'PROOF_SUBMITTED') {
                      orderStatus = 'proof_submitted';
                      proofUrl = payData.data.paymentProofUrl;
                    }
                  }
                } catch (e) {
                  console.warn('Failed to fetch payment details for order:', o.id, e);
                }
              }

              return {
                id: o.id,
                buyerId: o.buyerId,
                buyerName: o.buyerName || 'Pembeli',
                sellerId: sellerId,
                items: (o.items || []).map(item => ({
                  productId: item.productId,
                  name: item.productName,
                  price: Number(item.unitPrice),
                  qty: item.quantity
                })),
                totalAmount: Number(o.totalAmount),
                marginPercentage: 50.0,
                paymentMethod: 'transfer_bank',
                status: orderStatus,
                createdAt: o.createdAt,
                paymentProofUrl: proofUrl
              };
            }));
            return { success: true, data: mapped };
          }
        } catch (err) {
          console.warn('Backend fetch failed for seller orders:', err);
        }
      }
      return { success: true, data: [] };
    },

    updateOrderStatus: async (sellerId, orderId, status) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        const statusMap = {
          menunggu: 'PENDING_PAYMENT',
          diproses: 'PROCESSING',
          dikirim: 'SHIPPED',
          terkirim: 'COMPLETED',
          cancelled: 'CANCELLED'
        };
        const backendStatus = statusMap[status] || status;
        const response = await fetch(`http://localhost:8080/api/v1/seller/orders/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: backendStatus })
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Gagal memperbarui status pesanan.');
        }
        return { success: true, message: `Status pesanan diperbarui menjadi ${status}.` };
      }
      throw new Error('Anda harus login terlebih dahulu.');
    },

    confirmManualPayment: async (sellerId, orderId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        const response = await fetch(`http://localhost:8080/api/v1/seller/orders/${orderId}/payment/confirm-manual`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'APPROVE', note: 'Pembayaran manual disetujui penjual.' })
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Gagal mengonfirmasi pembayaran manual.');
        }
        return { success: true, message: 'Pembayaran manual berhasil dikonfirmasi.' };
      }
      throw new Error('Anda harus login terlebih dahulu.');
    },

    getAnalytics: async (sellerId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) return { success: true, data: {} };
      
      const prodRes = await api.seller.getProducts(sellerId);
      const orderRes = await api.seller.getOrders(sellerId);
      
      const products = prodRes.data || [];
      const orders = orderRes.data || [];
      
      const completedOrders = orders.filter(o => o.status === 'terkirim');
      const totalRevenue = orders
        .filter(o => ['terkirim', 'dikirim', 'diproses', 'proof_submitted'].includes(o.status))
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const lowStockProducts = products.filter(p => p.stock <= p.reorderThreshold);

      const highValueOrders = [...orders]
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 8);

      const topProducts = [...products]
        .slice(0, 5);

      return {
        success: true,
        data: {
          totalProducts: products.length,
          totalOrders: orders.length,
          pendingConfirmations: orders.filter(o => o.status === 'proof_submitted').length,
          monthlyRevenue: totalRevenue,
          aov: orders.length ? Math.round(totalRevenue / orders.length) : 0,
          returnRate: 2.9,
          todayRevenue: totalRevenue * 0.1,
          todayTarget: totalRevenue * 0.12 || 1000000,
          todayOrders: Math.round(orders.length * 0.08) || 1,
          lowStockCount: lowStockProducts.length,
          lowStockProducts,
          topProducts,
          highValueOrders,
          paymentDistribution: {
            transfer_bank: orders.reduce((sum, o) => sum + o.totalAmount, 0),
            gopay: 0,
            ovo: 0,
            qris: 0,
            dana: 0,
            cod: 0
          }
        }
      };
    }
  },

  buyer: {
    getProducts: async ({ search = '', category = 'Semua' }) => {
      try {
        let url = 'http://localhost:8080/api/v1/products';
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
        const response = await fetch(`http://localhost:8080/api/v1/products/${productId}`);
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
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) return { success: true, data: [] };
      const response = await fetch('http://localhost:8080/api/v1/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Gagal mengambil keranjang');
      const result = await response.json();
      const cartItems = result.data?.items || [];
      
      const mappedItems = await Promise.all(cartItems.map(async (item) => {
        try {
          const prodRes = await fetch(`http://localhost:8080/api/v1/products/${item.productId}`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            const product = prodData.data;
            return {
              id: item.id,
              productId: item.productId,
              qty: item.quantity,
              name: item.productName,
              price: Number(item.productPrice),
              imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#EB5E28"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#FFF">${item.productName}</text></svg>`),
              storeName: product.sellerStoreName || 'Toko Nusantara',
              sellerId: product.sellerId,
              stock: item.productStock
            };
          }
        } catch (e) {
          console.warn('Failed to fetch product details for cart item:', e);
        }
        return {
          id: item.id,
          productId: item.productId,
          qty: item.quantity,
          name: item.productName,
          price: Number(item.productPrice),
          imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#EB5E28"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#FFF">${item.productName}</text></svg>`),
          storeName: 'Toko Nusantara',
          sellerId: null,
          stock: item.productStock
        };
      }));
      return { success: true, data: mappedItems };
    },

    addToCart: async (buyerId, { productId, qty = 1 }) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) throw new Error('Anda harus login terlebih dahulu.');
      const response = await fetch('http://localhost:8080/api/v1/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: qty })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menambahkan ke keranjang');
      }
      return { success: true, message: 'Produk ditambahkan ke keranjang.' };
    },

    updateCartItem: async (buyerId, productId, qty) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) throw new Error('Anda harus login terlebih dahulu.');
      
      const cartRes = await api.buyer.getCart(buyerId);
      const cartItems = cartRes.data || [];
      const item = cartItems.find(i => i.productId === productId);
      if (!item) throw new Error('Item tidak ditemukan di keranjang.');
      
      const response = await fetch(`http://localhost:8080/api/v1/cart/items/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: qty })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengubah kuantitas.');
      }
      return { success: true };
    },

    removeFromCart: async (buyerId, productId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) throw new Error('Anda harus login terlebih dahulu.');
      
      const cartRes = await api.buyer.getCart(buyerId);
      const cartItems = cartRes.data || [];
      const item = cartItems.find(i => i.productId === productId);
      if (!item) throw new Error('Item tidak ditemukan di keranjang.');
      
      const response = await fetch(`http://localhost:8080/api/v1/cart/items/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Gagal menghapus item.');
      }
      return { success: true, message: 'Item dihapus dari keranjang.' };
    },

    checkout: async (buyerId, { paymentMethod }) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) throw new Error('Anda harus login terlebih dahulu.');
      
      const cartRes = await api.buyer.getCart(buyerId);
      const cartItems = cartRes.data || [];
      if (cartItems.length === 0) throw new Error('Keranjang belanja kosong.');
      
      const cartItemIds = cartItems.map(item => item.id);
      
      const response = await fetch('http://localhost:8080/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cartItemIds,
          shippingAddress: "Alamat Pengiriman Default (Toko Nusantara)",
          notes: `Metode Pembayaran: ${paymentMethod}`
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Checkout gagal.');
      }
      
      return {
        success: true,
        message: 'Pesanan berhasil dibuat.',
        data: result.data
      };
    },

    getOrders: async (buyerId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (token) {
        try {
          const response = await fetch('http://localhost:8080/api/v1/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const result = await response.json();
            const items = result.data?.content || result.data || [];
            
            const mapped = await Promise.all(items.map(async (o) => {
              let orderStatus = 'menunggu';
              let proofUrl = null;
              if (o.status === 'PAID' || o.status === 'PROCESSING') {
                orderStatus = 'diproses';
              } else if (o.status === 'SHIPPED') {
                orderStatus = 'dikirim';
              } else if (o.status === 'COMPLETED') {
                orderStatus = 'terkirim';
              } else if (o.status === 'CANCELLED') {
                orderStatus = 'cancelled';
              } else if (o.status === 'PENDING_PAYMENT') {
                try {
                  const payRes = await fetch(`http://localhost:8080/api/v1/orders/${o.id}/payment`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (payRes.ok) {
                    const payData = await payRes.json();
                    if (payData.data?.status === 'PROOF_SUBMITTED') {
                      orderStatus = 'proof_submitted';
                      proofUrl = payData.data.paymentProofUrl;
                    }
                  }
                } catch (e) {
                  console.warn('Failed to fetch payment details for order:', o.id, e);
                }
              }

              return {
                id: o.id,
                buyerId: o.buyerId,
                buyerName: o.buyerName || 'Pembeli',
                sellerId: o.items?.[0]?.sellerId || '',
                items: (o.items || []).map(item => ({
                  productId: item.productId,
                  name: item.productName,
                  price: Number(item.unitPrice),
                  qty: item.quantity
                })),
                totalAmount: Number(o.totalAmount),
                marginPercentage: 50.0,
                paymentMethod: 'transfer_bank',
                status: orderStatus,
                createdAt: o.createdAt,
                paymentProofUrl: proofUrl
              };
            }));
            return { success: true, data: mapped };
          }
        } catch (err) {
          console.warn('Backend fetch failed for buyer orders:', err);
        }
      }
      return { success: true, data: [] };
    },

    uploadPaymentProof: async (orderId, { proofDataUrl }) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) throw new Error('Anda harus login terlebih dahulu.');
      
      const response = await fetch(`http://localhost:8080/api/v1/orders/${orderId}/payment-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ proofDataUrl })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengunggah bukti pembayaran.');
      }
      return { success: true, message: 'Bukti pembayaran berhasil diunggah.' };
    }
  },

  chat: {
    getConversations: async (userId, role) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) return { success: true, data: [] };
      try {
        const response = await fetch('http://localhost:8080/api/v1/conversations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          const items = result.data?.content || result.data || [];
          
          const mapped = items.map(c => ({
            id: c.id,
            buyerId: c.buyerId,
            buyerName: c.buyerName,
            sellerId: c.sellerId,
            storeName: c.sellerStoreName || 'Toko Nusantara',
            lastMessage: 'Buka obrolan.',
            lastUpdated: c.updatedAt
          }));
          return { success: true, data: mapped };
        }
      } catch (err) {
        console.warn('Backend fetch failed for conversations:', err);
      }
      return { success: true, data: [] };
    },

    getMessages: async (conversationId) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) return { success: true, data: [] };
      try {
        const response = await fetch(`http://localhost:8080/api/v1/conversations/${conversationId}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          const items = result.data?.content || result.data || [];
          const mapped = items.map(msg => ({
            id: msg.id,
            senderId: msg.senderId,
            content: msg.messageType === 'TEXT' ? msg.content : '',
            timestamp: msg.createdAt,
            attachmentUrl: msg.messageType === 'IMAGE' ? msg.content : null
          }));
          mapped.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          return { success: true, data: mapped };
        }
      } catch (err) {
        console.warn('Backend fetch failed for messages:', err);
      }
      return { success: true, data: [] };
    },

    sendMessage: async (conversationId, { senderId, content, attachmentUrl = null }) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) throw new Error('Anda harus login terlebih dahulu.');
      
      const payload = {
        content: attachmentUrl || content,
        messageType: attachmentUrl ? 'IMAGE' : 'TEXT'
      };

      const response = await fetch(`http://localhost:8080/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengirim pesan.');
      }
      const msg = result.data;
      return {
        success: true,
        data: {
          id: msg.id,
          senderId: msg.senderId,
          content: msg.messageType === 'TEXT' ? msg.content : '',
          timestamp: msg.createdAt,
          attachmentUrl: msg.messageType === 'IMAGE' ? msg.content : null
        }
      };
    },

    createConversation: async ({ buyerId, sellerId }) => {
      const token = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
      if (!token) throw new Error('Anda harus login terlebih dahulu.');

      const response = await fetch('http://localhost:8080/api/v1/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sellerId })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal membuat obrolan baru.');
      }
      const c = result.data;
      return {
        success: true,
        data: {
          id: c.id,
          buyerId: c.buyerId,
          buyerName: c.buyerName,
          sellerId: c.sellerId,
          storeName: c.sellerStoreName || 'Toko Nusantara',
          lastMessage: 'Memulai percakapan baru.',
          lastUpdated: c.updatedAt
        }
      };
    }
  }
};
