import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

// ==========================================
// AUTH HOOKS
// ==========================================

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: ({ usernameOrEmail, password }) => api.auth.login(usernameOrEmail, password),
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: (registerData) => api.auth.register(registerData),
  });
};

// ==========================================
// ADMIN HOOKS
// ==========================================

export const useAdminPendingSellersQuery = () => {
  return useQuery({
    queryKey: ['admin', 'sellers', 'pending'],
    queryFn: api.admin.getPendingSellers,
  });
};

export const useAdminSellersQuery = () => {
  return useQuery({
    queryKey: ['admin', 'sellers', 'all'],
    queryFn: api.admin.getAllSellers,
  });
};

export const useAdminBuyersQuery = () => {
  return useQuery({
    queryKey: ['admin', 'buyers', 'all'],
    queryFn: api.admin.getAllBuyers,
  });
};

export const useAdminApproveSellerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sellerId) => api.admin.approveSeller(sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'buyers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useAdminRejectSellerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sellerId) => api.admin.rejectSeller(sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'buyers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useAdminToggleSellerStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sellerId) => api.admin.toggleSellerStatus(sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'buyers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useAdminDeleteSellerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sellerId) => api.admin.deleteSeller(sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'buyers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useAdminDashboardStatsQuery = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: api.admin.getDashboardStats,
  });
};

// ==========================================
// SELLER HOOKS
// ==========================================

export const useSellerProductsQuery = (sellerId) => {
  return useQuery({
    queryKey: ['seller', sellerId, 'products'],
    queryFn: () => api.seller.getProducts(sellerId),
    enabled: !!sellerId,
  });
};

export const useSellerAddProductMutation = (sellerId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productData) => api.seller.addProduct(sellerId, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId, 'products'] });
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId, 'analytics'] });
    },
  });
};

export const useSellerUpdateProductMutation = (sellerId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, productData }) => api.seller.updateProduct(sellerId, productId, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId, 'products'] });
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId, 'analytics'] });
    },
  });
};

export const useSellerDeleteProductMutation = (sellerId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId) => api.seller.deleteProduct(sellerId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId, 'products'] });
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId, 'analytics'] });
    },
  });
};

export const useSellerOrdersQuery = (sellerId) => {
  return useQuery({
    queryKey: ['seller', sellerId, 'orders'],
    queryFn: () => api.seller.getOrders(sellerId),
    enabled: !!sellerId,
  });
};

export const useSellerUpdateOrderStatusMutation = (sellerId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }) => api.seller.updateOrderStatus(sellerId, orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId, 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId, 'analytics'] });
    },
  });
};

export const useSellerConfirmManualPaymentMutation = (sellerId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => api.seller.confirmManualPayment(sellerId, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId, 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId, 'analytics'] });
    },
  });
};

export const useSellerAnalyticsQuery = (sellerId) => {
  return useQuery({
    queryKey: ['seller', sellerId, 'analytics'],
    queryFn: () => api.seller.getAnalytics(sellerId),
    enabled: !!sellerId,
  });
};

// ==========================================
// BUYER HOOKS
// ==========================================

export const useBuyerProductsQuery = (filters) => {
  return useQuery({
    queryKey: ['buyer', 'products', filters],
    queryFn: () => api.buyer.getProducts(filters),
  });
};

export const useBuyerProductDetailQuery = (productId) => {
  return useQuery({
    queryKey: ['buyer', 'product', productId],
    queryFn: () => api.buyer.getProductDetail(productId),
    enabled: !!productId,
  });
};

export const useBuyerCartQuery = (buyerId) => {
  return useQuery({
    queryKey: ['buyer', buyerId, 'cart'],
    queryFn: () => api.buyer.getCart(buyerId),
    enabled: !!buyerId,
  });
};

export const useBuyerAddToCartMutation = (buyerId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, qty }) => api.buyer.addToCart(buyerId, { productId, qty }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', buyerId, 'cart'] });
    },
  });
};

export const useBuyerUpdateCartItemMutation = (buyerId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, qty }) => api.buyer.updateCartItem(buyerId, productId, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', buyerId, 'cart'] });
    },
  });
};

export const useBuyerRemoveFromCartMutation = (buyerId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId) => api.buyer.removeFromCart(buyerId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', buyerId, 'cart'] });
    },
  });
};

export const useBuyerCheckoutMutation = (buyerId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentMethod }) => api.buyer.checkout(buyerId, { paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', buyerId, 'cart'] });
      queryClient.invalidateQueries({ queryKey: ['buyer', buyerId, 'orders'] });
    },
  });
};

export const useBuyerOrdersQuery = (buyerId) => {
  return useQuery({
    queryKey: ['buyer', buyerId, 'orders'],
    queryFn: () => api.buyer.getOrders(buyerId),
    enabled: !!buyerId,
  });
};

export const useBuyerUploadPaymentProofMutation = (buyerId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, proofDataUrl }) => api.buyer.uploadPaymentProof(orderId, { proofDataUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', buyerId, 'orders'] });
    },
  });
};

// ==========================================
// CHAT HOOKS
// ==========================================

export const useChatConversationsQuery = (userId, role) => {
  return useQuery({
    queryKey: ['chat', 'conversations', userId, role],
    queryFn: () => api.chat.getConversations(userId, role),
    enabled: !!userId,
  });
};

export const useChatMessagesQuery = (conversationId) => {
  return useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => api.chat.getMessages(conversationId),
    enabled: !!conversationId,
  });
};

export const useChatSendMessageMutation = (conversationId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ senderId, content, attachmentUrl }) => 
      api.chat.sendMessage(conversationId, { senderId, content, attachmentUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};

export const useChatCreateConversationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ buyerId, sellerId }) => api.chat.createConversation({ buyerId, sellerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};
