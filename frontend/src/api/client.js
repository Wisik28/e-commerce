import { getDB, saveDB } from './db';

// Simulate network latency
const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

const getOrdersForSeller = (sellerId, orders) => {
  return orders.filter(o => o.sellerId === sellerId);
};

export const api = {
  auth: {
    login: async (usernameOrEmail, password) => {
      await delay(200);
      const users = getDB('ecom_users');
      const user = users.find(u => 
        (u.email === usernameOrEmail || u.username === usernameOrEmail) && 
        u.password === password
      );

      if (!user) {
        throw new Error('Email/username atau password salah.');
      }

      // Check if seller is approved
      if (user.role === 'seller') {
        const sellers = getDB('ecom_sellers');
        const sellerProfile = sellers.find(s => s.id === user.sellerId);
        if (sellerProfile && sellerProfile.status === 'menunggu') {
          throw new Error('Akun toko Anda sedang menunggu verifikasi Admin.');
        }
        if (sellerProfile && sellerProfile.status === 'nonaktif') {
          throw new Error('Akun toko Anda telah dinonaktifkan oleh Admin.');
        }
      }

      // Issue mock token
      const token = `mock-jwt-token-for-${user.id}-${Date.now()}`;
      
      return {
        success: true,
        message: 'Login berhasil',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            role: user.role,
            sellerId: user.sellerId || null,
            avatarInitial: user.avatarInitial
          }
        }
      };
    },

    register: async ({ email, username, password, name, role, storeName, category }) => {
      await delay(200);
      const users = getDB('ecom_users');
      
      if (users.some(u => u.email === email || u.username === username)) {
        throw new Error('Email atau username sudah terdaftar.');
      }

      const userId = `user-${Date.now()}`;
      const avatarInitial = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      
      let sellerId = null;
      if (role === 'seller') {
        sellerId = `seller-${Date.now()}`;
        const sellers = getDB('ecom_sellers');
        sellers.push({
          id: sellerId,
          ownerId: userId,
          storeName: storeName || `${name} Store`,
          ownerName: name,
          category: category || 'General',
          productsCount: 0,
          ordersCount: 0,
          status: 'menunggu', // waiting admin approval
          createdAt: new Date().toISOString()
        });
        saveDB('ecom_sellers', sellers);
      }

      const newUser = {
        id: userId,
        email,
        username,
        password,
        name,
        role,
        sellerId,
        avatarInitial
      };

      users.push(newUser);
      saveDB('ecom_users', users);

      return {
        success: true,
        message: role === 'seller' 
          ? 'Registrasi penjual berhasil. Silakan tunggu verifikasi admin untuk masuk.' 
          : 'Registrasi berhasil. Silakan login.',
        data: newUser
      };
    }
  },

  admin: {
    getPendingSellers: async () => {
      await delay(150);
      const sellers = getDB('ecom_sellers');
      return {
        success: true,
        data: sellers.filter(s => s.status === 'menunggu')
      };
    },

    getAllSellers: async () => {
      await delay(150);
      const sellers = getDB('ecom_sellers');
      return {
        success: true,
        data: sellers
      };
    },

    approveSeller: async (sellerId) => {
      await delay(150);
      const sellers = getDB('ecom_sellers');
      const index = sellers.findIndex(s => s.id === sellerId);
      if (index !== -1) {
        sellers[index].status = 'aktif';
        saveDB('ecom_sellers', sellers);
        return { success: true, message: 'Penjual berhasil disetujui.' };
      }
      throw new Error('Penjual tidak ditemukan.');
    },

    rejectSeller: async (sellerId) => {
      await delay(150);
      const sellers = getDB('ecom_sellers');
      const index = sellers.findIndex(s => s.id === sellerId);
      if (index !== -1) {
        sellers[index].status = 'nonaktif'; // or delete, let's toggle nonaktif
        saveDB('ecom_sellers', sellers);
        return { success: true, message: 'Penjual berhasil ditolak.' };
      }
      throw new Error('Penjual tidak ditemukan.');
    },

    toggleSellerStatus: async (sellerId) => {
      await delay(150);
      const sellers = getDB('ecom_sellers');
      const index = sellers.findIndex(s => s.id === sellerId);
      if (index !== -1) {
        sellers[index].status = sellers[index].status === 'aktif' ? 'nonaktif' : 'aktif';
        saveDB('ecom_sellers', sellers);
        return { success: true, message: 'Status penjual berhasil diubah.', data: sellers[index] };
      }
      throw new Error('Penjual tidak ditemukan.');
    },

    deleteSeller: async (sellerId) => {
      await delay(150);
      const sellers = getDB('ecom_sellers');
      const filtered = sellers.filter(s => s.id !== sellerId);
      saveDB('ecom_sellers', filtered);
      return { success: true, message: 'Penjual berhasil dihapus.' };
    },

    getDashboardStats: async () => {
      await delay(150);
      const sellers = getDB('ecom_sellers');
      const orders = getDB('ecom_orders');
      
      // Calculate revenue
      const monthlyRevenue = orders
        .filter(o => o.status === 'terkirim' || o.status === 'dikirim' || o.status === 'diproses')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      // Estimated total buyers (unique buyerId in orders + standard registered buyers)
      const users = getDB('ecom_users');
      const buyerCount = users.filter(u => u.role === 'buyer').length + 1200; // adding static padding matching spec

      return {
        success: true,
        data: {
          totalSellers: sellers.length,
          activeSellers: sellers.filter(s => s.status === 'aktif').length,
          totalBuyers: buyerCount,
          totalOrders: orders.length + 820, // static padding matching spec
          monthlyRevenue,
          ordersDistribution: {
            terkirim: orders.filter(o => o.status === 'terkirim').length + 400,
            dikirim: orders.filter(o => o.status === 'dikirim').length + 180,
            diproses: orders.filter(o => o.status === 'diproses').length + 140,
            menunggu: orders.filter(o => o.status === 'menunggu' || o.status === 'proof_submitted').length + 20
          }
        }
      };
    }
  },

  seller: {
    getProducts: async (sellerId) => {
      await delay(150);
      const products = getDB('ecom_products');
      return {
        success: true,
        data: products.filter(p => p.sellerId === sellerId && p.status !== 'nonaktif')
      };
    },

    addProduct: async (sellerId, productData) => {
      await delay(200);
      const products = getDB('ecom_products');
      const newProduct = {
        id: `prod-${Date.now()}`,
        sellerId,
        storeName: productData.storeName || 'My Store',
        name: productData.name,
        sku: productData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        category: productData.category,
        sellPrice: Number(productData.sellPrice),
        costPrice: Number(productData.costPrice || productData.sellPrice * 0.5),
        stock: Number(productData.stock),
        reorderThreshold: Number(productData.reorderThreshold || 10),
        sold30d: 0,
        revenue30d: 0,
        status: 'aktif',
        imageUrl: productData.imageUrl || 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#EB5E28"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#FFF">${productData.name}</text></svg>`),
        rating: 5.0,
        reviewsCount: 0
      };
      products.push(newProduct);
      saveDB('ecom_products', products);

      // Update seller product count
      const sellers = getDB('ecom_sellers');
      const idx = sellers.findIndex(s => s.id === sellerId);
      if (idx !== -1) {
        sellers[idx].productsCount += 1;
        saveDB('ecom_sellers', sellers);
      }

      return { success: true, message: 'Produk berhasil ditambahkan.', data: newProduct };
    },

    updateProduct: async (sellerId, productId, productData) => {
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
      await delay(150);
      const products = getDB('ecom_products');
      const idx = products.findIndex(p => p.id === productId && p.sellerId === sellerId);
      if (idx !== -1) {
        // Soft delete / nonaktifkan
        products[idx].status = 'nonaktif';
        saveDB('ecom_products', products);

        // Update seller product count
        const sellers = getDB('ecom_sellers');
        const sIdx = sellers.findIndex(s => s.id === sellerId);
        if (sIdx !== -1) {
          sellers[sIdx].productsCount = Math.max(0, sellers[sIdx].productsCount - 1);
          saveDB('ecom_sellers', sellers);
        }

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
      await delay(150);
      let products = getDB('ecom_products').filter(p => p.status === 'aktif');
      
      if (category !== 'Semua') {
        products = products.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (search) {
        products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.storeName.toLowerCase().includes(search.toLowerCase()));
      }
      return { success: true, data: products };
    },

    getProductDetail: async (productId) => {
      await delay(150);
      const products = getDB('ecom_products');
      const product = products.find(p => p.id === productId && p.status === 'aktif');
      if (product) {
        return { success: true, data: product };
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
