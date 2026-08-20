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

const INITIAL_SELLERS = [
  {
    id: 'seller-1',
    ownerId: 'user-seller-1',
    storeName: 'Batik Nusantara',
    ownerName: 'Rina Kusumawati',
    category: 'Fashion & Batik',
    productsCount: 24,
    ordersCount: 187,
    status: 'aktif',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'seller-2',
    ownerId: 'user-seller-2',
    storeName: 'Sneaker Lokal ID',
    ownerName: 'Dimas Prasetyo',
    category: 'Sepatu & Aksesori',
    productsCount: 18,
    ordersCount: 241,
    status: 'aktif',
    createdAt: '2026-02-10T10:30:00Z'
  },
  {
    id: 'seller-3',
    ownerId: 'user-seller-3',
    storeName: 'Tas Cantik Store',
    ownerName: 'Sari Dewi',
    category: 'Tas & Dompet',
    productsCount: 31,
    ordersCount: 312,
    status: 'aktif',
    createdAt: '2026-03-05T14:15:00Z'
  },
  {
    id: 'seller-4',
    ownerId: 'user-seller-4',
    storeName: 'Elektronik Murah',
    ownerName: 'Budi Hartono',
    category: 'Elektronik',
    productsCount: 0,
    ordersCount: 0,
    status: 'menunggu',
    createdAt: '2026-08-19T09:00:00Z'
  },
  {
    id: 'seller-5',
    ownerId: 'user-seller-5',
    storeName: 'Kosmetik Natural',
    ownerName: 'Mega Lestari',
    category: 'Kecantikan',
    productsCount: 12,
    ordersCount: 89,
    status: 'nonaktif',
    createdAt: '2026-04-20T11:45:00Z'
  }
];

const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    sellerId: 'seller-1',
    storeName: 'Batik Nusantara',
    name: 'Kemeja Batik Parang Premium',
    sku: 'SKU-BAT-001',
    category: 'Atasan Pria',
    sellPrice: 285000,
    costPrice: 135000,
    stock: 48,
    reorderThreshold: 10,
    sold30d: 142,
    revenue30d: 40470000,
    status: 'aktif',
    imageUrl: createSvgPlaceholder('Batik Parang', '#3E5C76', '#FFFFFF'),
    rating: 4.8,
    reviewsCount: 87
  },
  {
    id: 'prod-2',
    sellerId: 'seller-1',
    storeName: 'Batik Nusantara',
    name: 'Dress Batik Mega Mendung',
    sku: 'SKU-BAT-002',
    category: 'Atasan Wanita',
    sellPrice: 375000,
    costPrice: 185000,
    stock: 22,
    reorderThreshold: 10,
    sold30d: 68,
    revenue30d: 25500000,
    status: 'aktif',
    imageUrl: createSvgPlaceholder('Batik Mega Mendung', '#1D2D44', '#FFFFFF'),
    rating: 4.6,
    reviewsCount: 43
  },
  {
    id: 'prod-3',
    sellerId: 'seller-2',
    storeName: 'Sneaker Lokal ID',
    name: 'Sneakers Canvas Lokal Putih',
    sku: 'SKU-SEK-001',
    category: 'Sepatu',
    sellPrice: 459000,
    costPrice: 210000,
    stock: 12,
    reorderThreshold: 10,
    sold30d: 73,
    revenue30d: 33507000,
    status: 'aktif',
    imageUrl: createSvgPlaceholder('Sneakers Putih', '#8D99AE', '#FFFFFF'),
    rating: 4.7,
    reviewsCount: 56
  },
  {
    id: 'prod-4',
    sellerId: 'seller-3',
    storeName: 'Tas Cantik Store',
    name: 'Tas Kulit Wanita Premium',
    sku: 'SKU-AKS-008',
    category: 'Aksesori',
    sellPrice: 600000,
    costPrice: 280000,
    stock: 24,
    reorderThreshold: 15,
    sold30d: 87,
    revenue30d: 52200000,
    status: 'aktif',
    imageUrl: createSvgPlaceholder('Tas Kulit', '#6C584C', '#FFFFFF'),
    rating: 4.9,
    reviewsCount: 92
  },
  {
    id: 'prod-5',
    sellerId: 'seller-1',
    storeName: 'Batik Nusantara',
    name: 'Blouse Tenun Ikat Modern',
    sku: 'SKU-BAT-003',
    category: 'Atasan Wanita',
    sellPrice: 264000,
    costPrice: 120000,
    stock: 3,
    reorderThreshold: 10,
    sold30d: 90,
    revenue30d: 23760000,
    status: 'aktif',
    imageUrl: createSvgPlaceholder('Blouse Tenun', '#ADC178', '#FFFFFF'),
    rating: 4.5,
    reviewsCount: 31
  },
  {
    id: 'prod-6',
    sellerId: 'seller-1',
    storeName: 'Batik Nusantara',
    name: 'Jaket Denim Vintage',
    sku: 'SKU-OUT-001',
    category: 'Outerwear',
    sellPrice: 349000,
    costPrice: 160000,
    stock: 2,
    reorderThreshold: 8,
    sold30d: 45,
    revenue30d: 15705000,
    status: 'aktif',
    imageUrl: createSvgPlaceholder('Denim Jacket', '#4A5759', '#FFFFFF'),
    rating: 4.7,
    reviewsCount: 22
  },
  {
    id: 'prod-7',
    sellerId: 'seller-1',
    storeName: 'Batik Nusantara',
    name: 'Sandal Kulit Pria',
    sku: 'SKU-SEK-002',
    category: 'Sepatu',
    sellPrice: 185000,
    costPrice: 85000,
    stock: 5,
    reorderThreshold: 15,
    sold30d: 110,
    revenue30d: 20350000,
    status: 'aktif',
    imageUrl: createSvgPlaceholder('Sandal Kulit', '#A3B18A', '#FFFFFF'),
    rating: 4.4,
    reviewsCount: 50
  },
  {
    id: 'prod-8',
    sellerId: 'seller-1',
    storeName: 'Batik Nusantara',
    name: 'Topi Bucket Canvas',
    sku: 'SKU-AKS-002',
    category: 'Aksesori',
    sellPrice: 75000,
    costPrice: 35000,
    stock: 1,
    reorderThreshold: 10,
    sold30d: 150,
    revenue30d: 11250000,
    status: 'aktif',
    imageUrl: createSvgPlaceholder('Bucket Hat', '#D4A373', '#FFFFFF'),
    rating: 4.3,
    reviewsCount: 65
  },
  {
    id: 'prod-9',
    sellerId: 'seller-1',
    storeName: 'Batik Nusantara',
    name: 'Celana Chino Slim Fit',
    sku: 'SKU-BAW-001',
    category: 'Bawahan Pria',
    sellPrice: 220000,
    costPrice: 100000,
    stock: 40,
    reorderThreshold: 10,
    sold30d: 61,
    revenue30d: 13420000,
    status: 'aktif',
    imageUrl: createSvgPlaceholder('Chino Pants', '#83C5BE', '#FFFFFF'),
    rating: 4.6,
    reviewsCount: 48
  },
  {
    id: 'prod-10',
    sellerId: 'seller-1',
    storeName: 'Batik Nusantara',
    name: 'Batik Nusantara Outer',
    sku: 'SKU-BAT-004',
    category: 'Outerwear',
    sellPrice: 299000,
    costPrice: 140000,
    stock: 15,
    reorderThreshold: 8,
    sold30d: 30,
    revenue30d: 8970000,
    status: 'aktif',
    imageUrl: createSvgPlaceholder('Batik Outer', '#9B5DE5', '#FFFFFF'),
    rating: 4.8,
    reviewsCount: 19
  }
];

const INITIAL_USERS = [
  {
    id: 'user-admin',
    email: 'admin@ecom.com',
    username: 'admin',
    password: 'admin123',
    name: 'Master Admin',
    role: 'admin',
    avatarInitial: 'AD'
  },
  {
    id: 'user-seller-1',
    email: 'seller@ecom.com',
    username: 'seller',
    password: 'seller123',
    name: 'Rina Kusumawati',
    role: 'seller',
    sellerId: 'seller-1',
    avatarInitial: 'BN'
  },
  {
    id: 'user-buyer-1',
    email: 'buyer@ecom.com',
    username: 'buyer',
    password: 'buyer123',
    name: 'Rian Wijaya',
    role: 'buyer',
    avatarInitial: 'RW'
  }
];

const INITIAL_ORDERS = [
  {
    id: 'ORD-8799',
    buyerId: 'user-buyer-1',
    buyerName: 'Maharani Putri',
    sellerId: 'seller-1',
    items: [
      {
        productId: 'prod-4',
        name: 'Tas Kulit Wanita Premium',
        price: 600000,
        qty: 3
      }
    ],
    totalAmount: 1800000,
    marginPercentage: 48.3, // Margin of Tas Kulit: (600k-280k)/600k = ~53.3%, maybe custom
    paymentMethod: 'transfer_bank',
    status: 'terkirim',
    createdAt: '2026-08-18T14:32:00Z',
    paymentProofUrl: null
  },
  {
    id: 'ORD-8798',
    buyerId: 'user-buyer-1',
    buyerName: 'Rian Wijaya',
    sellerId: 'seller-1',
    items: [
      {
        productId: 'prod-1',
        name: 'Kemeja Batik Parang Premium',
        price: 285000,
        qty: 1
      }
    ],
    totalAmount: 285000,
    marginPercentage: 52.6,
    paymentMethod: 'gopay',
    status: 'terkirim',
    createdAt: '2026-08-19T09:12:00Z',
    paymentProofUrl: null
  },
  {
    id: 'ORD-8797',
    buyerId: 'user-buyer-1',
    buyerName: 'Adi Saputra',
    sellerId: 'seller-1',
    items: [
      {
        productId: 'prod-5',
        name: 'Blouse Tenun Ikat Modern',
        price: 264000,
        qty: 2
      }
    ],
    totalAmount: 528000,
    marginPercentage: 54.5,
    paymentMethod: 'qris',
    status: 'dikirim',
    createdAt: '2026-08-19T16:45:00Z',
    paymentProofUrl: null
  },
  {
    id: 'ORD-8796',
    buyerId: 'user-buyer-1',
    buyerName: 'Siti Aminah',
    sellerId: 'seller-1',
    items: [
      {
        productId: 'prod-2',
        name: 'Dress Batik Mega Mendung',
        price: 375000,
        qty: 1
      }
    ],
    totalAmount: 375000,
    marginPercentage: 50.7,
    paymentMethod: 'ovo',
    status: 'diproses',
    createdAt: '2026-08-20T08:30:00Z',
    paymentProofUrl: null
  },
  {
    id: 'ORD-8795',
    buyerId: 'user-buyer-1',
    buyerName: 'Rudi Hermawan',
    sellerId: 'seller-1',
    items: [
      {
        productId: 'prod-6',
        name: 'Jaket Denim Vintage',
        price: 349000,
        qty: 1
      }
    ],
    totalAmount: 349000,
    marginPercentage: 54.2,
    paymentMethod: 'transfer_bank',
    status: 'proof_submitted',
    createdAt: '2026-08-20T11:20:00Z',
    paymentProofUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="#E5E7EB"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" fill="#374151">BUKTI TRANSFER</text></svg>')
  },
  {
    id: 'ORD-8794',
    buyerId: 'user-buyer-1',
    buyerName: 'Dewi Lestari',
    sellerId: 'seller-1',
    items: [
      {
        productId: 'prod-8',
        name: 'Topi Bucket Canvas',
        price: 75000,
        qty: 1
      }
    ],
    totalAmount: 75000,
    marginPercentage: 53.3,
    paymentMethod: 'dana',
    status: 'menunggu',
    createdAt: '2026-08-20T14:10:00Z',
    paymentProofUrl: null
  }
];

const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-1',
    buyerId: 'user-buyer-1',
    buyerName: 'Rian Wijaya',
    sellerId: 'seller-1',
    storeName: 'Batik Nusantara',
    lastMessage: 'Halo, apakah produk kemeja batik parang ukuran L masih ready?',
    lastUpdated: '2026-08-20T15:30:00Z',
    messages: [
      {
        id: 'msg-1',
        senderId: 'user-buyer-1',
        content: 'Halo, apakah produk kemeja batik parang ukuran L masih ready?',
        timestamp: '2026-08-20T15:30:00Z',
        attachmentUrl: null
      }
    ]
  }
];

export const initDB = () => {
  if (!localStorage.getItem('ecom_db_initialized')) {
    localStorage.setItem('ecom_users', JSON.stringify(INITIAL_USERS));
    localStorage.setItem('ecom_sellers', JSON.stringify(INITIAL_SELLERS));
    localStorage.setItem('ecom_products', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('ecom_orders', JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem('ecom_conversations', JSON.stringify(INITIAL_CONVERSATIONS));
    localStorage.setItem('ecom_carts', JSON.stringify({}));
    localStorage.setItem('ecom_db_initialized', 'true');
  }
};

export const getDB = (key) => {
  initDB();
  return JSON.parse(localStorage.getItem(key));
};

export const saveDB = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};
