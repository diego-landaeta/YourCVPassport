import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface ContactLeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
}

interface Message {
  id: string;
  lead_id: string;
  sender_id: string | null;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const ContactLeadFormModal: React.FC<ContactLeadFormModalProps> = ({
  isOpen,
  onClose,
  profileId,
  profileName,
}) => {
  const { user, profile } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [showSubjectSelect, setShowSubjectSelect] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !user) {
      setShowAuthPrompt(true);
    } else if (isOpen && user) {
      setShowAuthPrompt(false);
      checkExistingConversation();
    }
  }, [isOpen, user, profileId]);

  useEffect(() => {
    if (leadId) {
      loadMessages();
      setupRealtimeSubscription();
    }
  }, [leadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkExistingConversation = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Check if there's already a conversation between these users
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id, subject')
        .eq('profile_id', profileId)
        .eq('sender_email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingLead) {
        setLeadId(existingLead.id);
        setSubject(existingLead.subject || '');
        setShowSubjectSelect(false);
      }
    } catch (error) {
      console.error('Error checking existing conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!leadId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const setupRealtimeSubscription = () => {
    if (!leadId) return;

    const subscription = supabase
      .channel(`lead-chat:${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if it's from the other person
          if (newMsg.sender_id !== user?.id) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      subscription.unsubscribe();
    };
  };

  const createConversation = async () => {
    if (!user || !profile || !subject) return;

    setLoading(true);
    try {
      // Create lead WITHOUT initial message
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert([
          {
            profile_id: profileId,
            sender_name: profile.full_name || user.email || 'Usuario',
            sender_email: user.email,
            subject: subject,
            message: '', // Empty message - no auto message
            source: 'internal_chat',
            status: 'new',
          },
        ])
        .select()
        .single();

      if (leadError) throw leadError;

      setLeadId(newLead.id);
      setShowSubjectSelect(false);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      alert('Error al iniciar la conversación');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !profile || !leadId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      lead_id: leadId,
      sender_id: user.id,
      sender_name: profile.full_name || user.email || 'Tú',
      content: messageContent,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    scrollToBottom();

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            lead_id: leadId,
            sender_id: user.id,
            sender_name: profile.full_name || user.email || 'Usuario',
            content: messageContent,
            is_read: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMessage.id ? data : m))
      );
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setNewMessage(messageContent);
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showSubjectSelect) {
        createConversation();
      } else {
        sendMessage();
      }
    }
  };

  if (!isOpen) return null;

  // Show auth prompt if user is not logged in
  if (showAuthPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl p-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Inicia Sesión
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Necesitas tener una cuenta para enviar mensajes a {profileName}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => (window.location.href = '/auth?mode=login')}
              className="w-full bg-gradient-to-r from-cv-blue to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-xl"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => (window.location.href = '/auth?mode=register')}
              className="w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              Crear Cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-lg">
            {profileName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center">
            <h3 className="text-lg font-bold text-white">{profileName}</h3>
            {subject && !showSubjectSelect && (
              <p className="text-xs text-blue-100">
                {subject}
              </p>
            )}
            {isConnected && !subject && (
              <p className="text-xs text-blue-100 flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                En línea
              </p>
            )}
          </div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Subject Selection or Messages */}
        {showSubjectSelect ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-md">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Iniciar Conversación
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                Selecciona el motivo de tu mensaje
              </p>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              >
                <option value="">Selecciona un motivo</option>
                <option value="Oferta de Trabajo">💼 Oferta de Trabajo</option>
                <option value="Colaboración">🤝 Colaboración</option>
                <option value="Consulta General">💬 Consulta General</option>
                <option value="Networking">🌐 Networking</option>
                <option value="Otro">📝 Otro</option>
              </select>
              <button
                onClick={createConversation}
                disabled={!subject || loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Iniciar Chat
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-dark-bg-tertiary">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Envía tu primer mensaje
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isMe = message.sender_id === user?.id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-white rounded-bl-md shadow-sm'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                            {new Date(message.created_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg-secondary">
              <div className="flex items-end gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-dark-bg-tertiary border-0 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
                  style={{ minHeight: '48px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContactLeadFormModal;
