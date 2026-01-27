// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../context/ToastContext';
import type { Company, CompanyUser, Profile } from '../../types';
import {
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface Conversation {
  id: string;
  company_id: string;
  profile_id: string;
  subject: string;
  status: string;
  last_message_at: string;
  created_at: string;
  credits_used: number;
  profile?: Profile;
  unread_count?: number;
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'company' | 'talent';
  sender_id: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

const CompanyMessagesPage: React.FC = () => {
  const { company, companyUser } = useOutletContext<{ company: Company; companyUser: CompanyUser }>();
  const translations = useTranslations();
  const toast = useToastContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  useEffect(() => {
    if (company?.id) {
      loadConversations();
    }
  }, [company]);

  useEffect(() => {
    // Auto-select conversation from URL params
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        handleSelectConversation(conv);
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('company_conversations')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('company_id', company.id)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unread counts for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('company_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_type', 'talent')
            .eq('is_read', false);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('company_messages')
            .select('message')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            unread_count: count || 0,
            last_message: lastMsg?.message || '',
          };
        })
      );

      setConversations(conversationsWithUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.showToast(t('common.error') || 'Error loading conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.showToast(t('common.error') || 'Error loading messages', 'error');
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('company_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'talent')
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || sending) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from('company_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_type: 'company',
          sender_id: companyUser.id,
          message: newMessage.trim(),
          is_read: false,
        });

      if (error) throw error;

      setNewMessage('');
      await loadMessages(selectedConversation.id);
      await loadConversations(); // Refresh to update last_message_at

      toast.showToast(t('company.messages.messageSent') || 'Message sent successfully', 'success');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.showToast(t('company.messages.sendError') || 'Error sending message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      {/* Header */}
      <header className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/company/dashboard')}
                className="mb-2 text-sm text-gray-600 dark:text-gray-400 hover:text-cv-blue flex items-center gap-1"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                {t('common.back')}
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('company.messages.title') || 'Messages'}
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {t('company.messages.subtitle') || 'Communicate with talent'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-dark-border">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('company.messages.searchPlaceholder') || 'Search conversations...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-cv-blue"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cv-blue"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <UserCircleIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? t('company.messages.noSearchResults')
                      : t('company.messages.noConversations')}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full p-4 text-left border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-primary transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-cv-blue'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {conversation.profile?.avatar_url ? (
                        <img
                          src={conversation.profile.avatar_url}
                          alt={conversation.profile.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cv-blue to-purple-600 flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {conversation.profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {conversation.profile?.full_name}
                          </h3>
                          {conversation.unread_count! > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-cv-blue text-white rounded-full">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conversation.last_message || conversation.subject}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTime(conversation.last_message_at || conversation.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div className="lg:col-span-2 bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border flex flex-col">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center gap-4">
                  {selectedConversation.profile?.avatar_url ? (
                    <img
                      src={selectedConversation.profile.avatar_url}
                      alt={selectedConversation.profile.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cv-blue to-purple-600 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">
                        {selectedConversation.profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {selectedConversation.profile?.full_name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedConversation.profile?.title}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/company/profile/${selectedConversation.profile_id}`)}
                    className="px-4 py-2 text-sm font-medium text-cv-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    {t('company.messages.viewProfile') || 'View Profile'}
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => {
                    const isCompany = message.sender_type === 'company';
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCompany ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            isCompany
                              ? 'bg-cv-blue text-white'
                              : 'bg-gray-100 dark:bg-dark-bg-primary text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.message}</p>
                          <div className={`flex items-center gap-1 mt-2 text-xs ${
                            isCompany ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            <span>{formatTime(message.created_at)}</span>
                            {isCompany && (
                              message.is_read ? (
                                <span className="relative inline-flex">
                                  <CheckIcon className="w-4 h-4" />
                                  <CheckIcon className="w-4 h-4 -ml-2" />
                                </span>
                              ) : (
                                <CheckIcon className="w-4 h-4" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-dark-border">
                  <div className="flex gap-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('company.messages.typePlaceholder') || 'Type your message...'}
                      rows={3}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-cv-blue resize-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                      {sending ? t('common.sending') : t('common.send')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <UserCircleIcon className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('company.messages.selectConversation') || 'Select a conversation'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('company.messages.selectConversationDesc') || 'Choose a conversation from the list to start messaging'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyMessagesPage;
