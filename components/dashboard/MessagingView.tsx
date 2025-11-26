import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../context/ToastContext';
import {
  PaperAirplaneIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  lead_id: string;
  sender_id: string | null; // NULL for external/anonymous messages
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  lead_id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  recipient_name: string;
  lead_type: string;
  subject: string;
  status: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  message_count: number;
}

interface MessagingViewProps {
  leadId?: string;
  onBack?: () => void;
}

const MessagingView: React.FC<MessagingViewProps> = ({ leadId: initialLeadId, onBack }) => {
  const { user, profile } = useAuth();
  const t = useTranslations();
  const toast = useToastContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedLeadId) {
      loadMessages(selectedLeadId);
      markMessagesAsRead(selectedLeadId);
      
      console.log('🔔 Setting up realtime subscription for lead:', selectedLeadId);
      
      // Subscribe to new messages
      const subscription = supabase
        .channel(`messages:${selectedLeadId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedLeadId}`
        }, (payload) => {
          console.log('🔔 New message received via realtime:', payload.new);
          const newMsg = payload.new as Message;
          
          // Only add if it's not from us (to avoid duplicates from optimistic update)
          if (newMsg.sender_id !== user?.id) {
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
            // Don't reload conversations here to avoid infinite loop
          }
        })
        .subscribe((status) => {
          console.log('🔔 Realtime subscription status:', status);
          setIsRealtimeConnected(status === 'SUBSCRIBED');
        });

      return () => {
        console.log('🔕 Unsubscribing from realtime for lead:', selectedLeadId);
        subscription.unsubscribe();
        setIsRealtimeConnected(false);
      };
    }
  }, [selectedLeadId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!user) {
      console.warn('⚠️ Cannot load conversations: no user');
      return;
    }

    console.log('📥 Loading conversations for user:', user.id);
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversation_summaries')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading conversations:', error);
        throw error;
      }

      console.log('✅ Conversations loaded:', data?.length || 0);

      // Recalculate unread_count for each conversation from the user's perspective
      const conversationsWithCorrectUnread = await Promise.all((data || []).map(async (conv) => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('lead_id', conv.lead_id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        return { ...conv, unread_count: count || 0 };
      }));

      setConversations(conversationsWithCorrectUnread);
    } catch (err: any) {
      console.error('❌ Failed to load conversations:', err);
      // Don't show alert here as it's called on mount
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (leadId: string) => {
    console.log('📥 Loading messages for lead:', leadId);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error loading messages:', error);
        throw error;
      }

      console.log('✅ Messages loaded:', data?.length || 0);
      setMessages(data || []);
    } catch (err: any) {
      toast.error('Error al cargar mensajes: ' + (err.message || 'Error desconocido'));
    }
  };

  const markMessagesAsRead = async (leadId: string) => {
    if (!user) return;

    try {
      // Get all unread messages that are not from me
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('id, sender_id')
        .eq('lead_id', leadId)
        .eq('is_read', false);

      if (!unreadMessages || unreadMessages.length === 0) return;

      // Filter messages that are not from me
      const messagesToMark = unreadMessages.filter((msg: any) => {
        // Mark as read if sender_id is null (external) or different from me
        return msg.sender_id === null || msg.sender_id !== user.id;
      });

      if (messagesToMark.length === 0) return;

      // Mark filtered messages as read
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', messagesToMark.map(m => m.id));

      if (error) {
        console.error('Error updating messages:', error);
        return;
      }

      // Reload conversations to update unread count
      loadConversations();
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLeadId || !user || !profile) {
      console.warn('⚠️ Cannot send message: missing required data', {
        hasMessage: !!newMessage.trim(),
        hasLeadId: !!selectedLeadId,
        hasUser: !!user,
        hasProfile: !!profile
      });
      return;
    }

    console.log('📤 Sending message:', {
      lead_id: selectedLeadId,
      sender_id: user.id,
      content_length: newMessage.trim().length
    });

    setSending(true);
    
    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      lead_id: selectedLeadId,
      sender_id: user.id,
      sender_name: profile.full_name || 'Usuario',
      content: newMessage.trim(),
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    const messageContent = newMessage.trim();
    setNewMessage('');
    scrollToBottom();

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          lead_id: selectedLeadId,
          sender_id: user.id,
          sender_name: profile.full_name || 'Usuario',
          content: messageContent
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Message sent successfully:', data);
      
      // Replace temp message with real one
      setMessages(prev => prev.map(m => 
        m.id === tempMessage.id ? data : m
      ));
      
      loadConversations(); // Refresh to update last message
    } catch (err: any) {
      console.error('❌ Failed to send message:', err);
      
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageContent); // Restore message

      toast.error('Error al enviar el mensaje: ' + (err.message || 'Error desconocido'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectedConversation = conversations.find(c => c.lead_id === selectedLeadId);
  const otherPersonName = selectedConversation
    ? (selectedConversation.sender_id === user?.id
        ? selectedConversation.recipient_name
        : selectedConversation.sender_name)
    : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gray-50 dark:bg-dark-bg-primary rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Conversations List */}
      <div className={`${selectedLeadId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-gray-700`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Messages
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No messages yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your conversations will appear here</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isMe = conv.sender_id === user?.id;
              const otherPerson = isMe ? conv.recipient_name : conv.sender_name;
              const isSelected = conv.lead_id === selectedLeadId;

              return (
                <div
                  key={conv.lead_id}
                  onClick={() => setSelectedLeadId(conv.lead_id)}
                  className={`p-4 cursor-pointer transition-all border-l-4 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/10 border-l-blue-600'
                      : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary hover:border-l-gray-300 dark:hover:border-l-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                        {otherPerson.charAt(0).toUpperCase()}
                      </div>
                      {conv.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-dark-bg-secondary">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <h3 className={`font-semibold truncate ${
                          conv.unread_count > 0 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {otherPerson}
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {new Date(conv.last_message_at).toLocaleDateString('es-ES', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <p className={`text-sm truncate mb-0.5 ${
                        conv.unread_count > 0 
                          ? 'text-gray-700 dark:text-gray-300 font-medium' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {conv.subject}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {conv.last_message || 'No messages'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedLeadId ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg-secondary">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedLeadId(null);
                  if (onBack) onBack();
                }}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                {otherPersonName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                  {otherPersonName}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {isRealtimeConnected && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                    </div>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedConversation?.subject}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-dark-bg-tertiary">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No messages yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start the conversation</p>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isMe = message.sender_id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div className={`max-w-[75%] ${isMe ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-sm shadow-md'
                              : 'bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-white rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <p className={`text-xs text-gray-400 dark:text-gray-500 mt-1.5 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(message.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
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
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg-secondary">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <div className="absolute right-3 bottom-3 text-xs text-gray-400 dark:text-gray-500">
                  {newMessage.length > 0 && `${newMessage.length}`}
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="flex-shrink-0 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:hover:shadow-md flex items-center justify-center"
                title="Send message"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg-tertiary dark:to-dark-bg-primary">
          <div className="text-center max-w-sm px-6">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Select a conversation
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingView;
