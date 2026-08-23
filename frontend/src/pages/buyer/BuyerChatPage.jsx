import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  useChatConversationsQuery, 
  useChatMessagesQuery, 
  useChatSendMessageMutation 
} from '../../hooks/useApi';
import { MessageSquare, Send, Image, X, ChevronRight } from 'lucide-react';

export const BuyerChatPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  // Extract selected conversation from URL query
  const queryParams = new URLSearchParams(location.search);
  const initialConvId = queryParams.get('convId') || '';

  const [activeConvId, setActiveConvId] = useState(initialConvId);
  const [typedMessage, setTypedMessage] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState(null);

  // Query Conversations
  const { data: convsRes, isLoading: isConvsLoading } = useChatConversationsQuery(user?.id, user?.role);
  const conversations = convsRes?.data || [];

  // Set default active conversation if none selected
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // Query Messages for active conversation
  const { data: msgsRes, isLoading: isMsgsLoading } = useChatMessagesQuery(activeConvId);
  const messages = msgsRes?.data || [];

  // Mutation
  const sendMessageMutation = useChatSendMessageMutation(activeConvId);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim() && !attachmentUrl) return;

    sendMessageMutation.mutate({
      senderId: user.id,
      content: typedMessage,
      attachmentUrl: attachmentUrl
    }, {
      onSuccess: () => {
        setTypedMessage('');
        setAttachmentUrl(null);
      }
    });
  };

  const triggerMockAttachment = () => {
    // Generate a simple mock receipt image attachment
    const mockImageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="#EB5E28"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FFF">GAMBAR MOCK</text></svg>`;
    setAttachmentUrl('data:image/svg+xml;utf8,' + encodeURIComponent(mockImageSvg));
  };

  const getActiveConv = () => {
    return conversations.find(c => c.id === activeConvId);
  };

  const activeConv = getActiveConv();

  return (
    <div className="catalog-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <MessageSquare size={28} style={{ color: 'var(--primary)' }} />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--neutral-900)' }}>Pusat Bantuan & Chat</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--neutral-505)' }}>Hubungi penjual langsung untuk info produk, stok, atau konfirmasi manual payment</p>
        </div>
      </div>

      <div className="chat-widget-container">
        {/* Conversations Sidebar (Left) */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">Percakapan Toko</div>
          <div className="chat-conversation-list">
            {isConvsLoading && <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--neutral-400)' }}>Memuat list...</div>}
            
            {!isConvsLoading && conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--neutral-400)', fontSize: '0.8rem' }}>
                Belum ada obrolan aktif. Mulai chat lewat menu "Pesanan Saya" atau halaman detail produk.
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${activeConvId === conv.id ? 'active' : ''}`}
                  onClick={() => setActiveConvId(conv.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="conversation-name">🏪 {conv.storeName}</h4>
                    <ChevronRight size={14} style={{ color: 'var(--neutral-400)' }} />
                  </div>
                  <p className="conversation-preview">{conv.lastMessage}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages Dashboard (Right) */}
        <div className="chat-main">
          {activeConvId ? (
            <>
              {/* Active Chat Header */}
              <div className="chat-header">
                🏪 {activeConv ? activeConv.storeName : 'Memuat obrolan...'}
              </div>

              {/* Message List */}
              <div className="chat-messages">
                {isMsgsLoading ? (
                  <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: '0.85rem', padding: '1rem' }}>
                    Memuat histori pesan...
                  </div>
                ) : (
                  <>
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: '0.8rem', padding: '2rem 0' }}>
                        Kirim pesan pertama Anda ke penjual.
                      </div>
                    )}
                    
                    {messages.map(msg => {
                      const isOutgoing = msg.senderId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}
                        >
                          <p>{msg.content}</p>
                          
                          {msg.attachmentUrl && (
                            <div className="message-attachment">
                              <img src={msg.attachmentUrl} alt="Lampiran" />
                            </div>
                          )}
                          
                          <span className="message-meta">
                            {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat Input Area */}
              <form onSubmit={handleSendMessage} className="chat-input-area">
                <button 
                  type="button" 
                  className="icon-btn" 
                  onClick={triggerMockAttachment}
                  title="Lampirkan Gambar Bukti/Produk"
                  style={{ borderRadius: '50%', color: attachmentUrl ? 'var(--primary)' : 'var(--neutral-500)', borderColor: attachmentUrl ? 'var(--primary)' : 'var(--neutral-200)' }}
                >
                  <Image size={18} />
                </button>

                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Tulis pesan Anda..."
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                  />
                  
                  {attachmentUrl && (
                    <div style={{ position: 'absolute', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--neutral-200)', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700' }}>
                      <span>Gambar terlampir</span>
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => setAttachmentUrl(null)} />
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                  disabled={sendMessageMutation.isPending || (!typedMessage.trim() && !attachmentUrl)}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)' }}>
              <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Pilih percakapan di sebelah kiri untuk memulai obrolan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default BuyerChatPage;
