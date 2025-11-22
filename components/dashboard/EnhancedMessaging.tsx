import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import {
  PaperAirplaneIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  BriefcaseIcon,
  UserGroupIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import './messaging-styles.css';

interface Message {
  id: string;
  lead_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Lead {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  sender_company: string | null;
  recipient_id: string;
  recipient_name: string;
  lead_type: string;
  subject: string;
  message: string;
  company_name: string | null;
  position_offered: string | null;
  salary_range: string | null;
  location: string | null;
  status: string;
  created_at: string;
  last_message_at: string;
}

const EnhancedMessaging: React.FC = () => {
  const { user, profile } = useAuth();
  const t = useTranslations();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'READ' | 'REPLIED'>('ALL');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadLeads = useCallback(async () => {
    if (!profile || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      let query = supabase
        .from('leads')
        .select('*')
        .eq('recipient_id', profile.id)
        .order('last_message_at', { ascending: false });

      if (filter !== 'ALL') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [profile, filter]);

  useEffect(() => {
    if (profile) {
      loadLeads();
    }
  }, [profile, loadLeads]);

  useEffect(() => {
    if (selectedLead) {
      loadMessages(selectedLead.id);
      markMessagesAsRead(selectedLead.id);
      
      const subscription = supabase
        .channel(`messages:${selectedLead.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedLead.id}`
        }, (payload) => {
          const newMsg = payload.new as Message;
          // Only add if it's not from us (to avoid duplicates)
          if (newMsg.sender_id !== user?.id) {
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
          }
        })
        .subscribe((status) => {
          setIsRealtimeConnected(status === 'SUBSCRIBED');
        });

      return () => {
        subscription.unsubscribe();
        setIsRealtimeConnected(false);
      };
    }
  }, [selectedLead, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadMessages = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const markMessagesAsRead = async (leadId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('lead_id', leadId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      await supabase
        .from('leads')
        .update({ status: 'READ' })
        .eq('id', leadId)
        .eq('status', 'NEW');

      loadLeads();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || !user || !profile) return;

    setSending(true);
    const messageContent = newMessage.trim();
    
    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      lead_id: selectedLead.id,
      sender_id: user.id,
      sender_name: profile.full_name || 'Usuario',
      content: messageContent,
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    scrollToBottom();

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          lead_id: selectedLead.id,
          sender_id: user.id,
          sender_name: profile.full_name || 'Usuario',
          content: messageContent
        }])
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? data : m));

      // Update lead status silently
      await supabase
        .from('leads')
        .update({ 
          status: 'REPLIED',
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedLead.id);

      // Update local lead state without reloading
      setLeads(prev => prev.map(l => 
        l.id === selectedLead.id 
          ? { ...l, status: 'REPLIED', last_message_at: new Date().toISOString() }
          : l
      ));
      setSelectedLead(prev => prev ? { ...prev, status: 'REPLIED' } : null);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageContent);
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;
      
      // Update local state without reloading
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      setSelectedLead(prev => prev?.id === leadId ? { ...prev, status: newStatus } : prev);
      
      if (newStatus === 'ARCHIVED') {
        setSelectedLead(null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getLeadTypeIcon = (type: string) => {
    switch (type) {
      case 'JOB_OFFER':
        return <BriefcaseIcon className="w-5 h-5" />;
      case 'COLLABORATION':
        return <UserGroupIcon className="w-5 h-5" />;
      case 'CONSULTATION':
        return <LightBulbIcon className="w-5 h-5" />;
      default:
        return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
    }
  };

  const getLeadTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      JOB_OFFER: t.contactLeadModal.leadTypes.jobOffer,
      COLLABORATION: t.contactLeadModal.leadTypes.collaboration,
      NETWORKING: t.contactLeadModal.leadTypes.networking,
      CONSULTATION: t.contactLeadModal.leadTypes.consultation,
      OTHER: t.contactLeadModal.leadTypes.other
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      NEW: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', label: t.leadsInbox.status.new },
      READ: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', label: t.leadsInbox.status.read },
      REPLIED: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: t.leadsInbox.status.replied },
      ACCEPTED: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', label: t.leadsInbox.status.accepted },
      REJECTED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: t.leadsInbox.status.rejected },
      ARCHIVED: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: t.leadsInbox.status.archived }
    };
    const badge = badges[status] || badges.NEW;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const newLeadsCount = leads.filter(l => l.status === 'NEW').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - Simplified */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-cv-blue" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t.leadsInbox.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {newLeadsCount > 0 
                  ? `${newLeadsCount} ${newLeadsCount === 1 ? t.leadsInbox.newMessages : t.leadsInbox.newMessagesPlural}`
                  : t.leadsInbox.noNewMessages
                }
              </p>
            </div>
          </div>
          {isRealtimeConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">En línea</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters - Simplified */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'ALL', label: t.leadsInbox.filters.all, count: leads.length },
          { value: 'NEW', label: t.leadsInbox.filters.new, count: leads.filter(l => l.status === 'NEW').length },
          { value: 'READ', label: t.leadsInbox.filters.read, count: leads.filter(l => l.status === 'READ').length },
          { value: 'REPLIED', label: t.leadsInbox.filters.replied, count: leads.filter(l => l.status === 'REPLIED').length }
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as any)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-cv-blue text-white shadow-sm'
                : 'bg-white dark:bg-dark-bg-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{f.label}</span>
              {f.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                  filter === f.value
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {f.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      {leads.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border">
          <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <EnvelopeIcon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t.leadsInbox.emptyState.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t.leadsInbox.emptyState.description}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Leads List with Cards */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {leads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`group relative p-5 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-102 ${
                  selectedLead?.id === lead.id
                    ? 'border-cv-blue bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg scale-102'
                    : lead.status === 'NEW'
                    ? 'border-blue-200 dark:border-blue-800 bg-white dark:bg-dark-bg-secondary hover:border-cv-blue hover:shadow-md'
                    : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {selectedLead?.id === lead.id && (
                  <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-cv-blue to-indigo-600 rounded-full"></div>
                )}
                <div className="flex items-start gap-4">
                  <div className={`relative p-3 rounded-xl shadow-sm transition-all ${
                    lead.status === 'NEW' 
                      ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {getLeadTypeIcon(lead.lead_type)}
                    {lead.status === 'NEW' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-dark-bg-secondary animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold truncate ${
                        lead.status === 'NEW' 
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {lead.sender_name}
                      </h3>
                      {getStatusBadge(lead.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {getLeadTypeLabel(lead.lead_type)}
                      {lead.company_name && ` • ${lead.company_name}`}
                    </p>
                    <p className={`text-sm truncate ${
                      lead.status === 'NEW'
                        ? 'text-gray-900 dark:text-white font-medium'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {lead.subject}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {new Date(lead.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Leads List */}
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto messaging-scroll">
            {leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`conversation-item w-full text-left p-4 rounded-lg border smooth-transition ${
                  selectedLead?.id === lead.id
                    ? 'border-cv-blue bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    lead.status === 'NEW' 
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-cv-blue'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {getLeadTypeIcon(lead.lead_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                        {lead.sender_name}
                      </h3>
                      {lead.status === 'NEW' && (
                        <div className="w-2 h-2 bg-cv-blue rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">
                      {lead.subject}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail View with Chat */}
          <div className="lg:col-span-2">
            {selectedLead ? (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border flex flex-col" style={{ height: 'calc(100vh - 300px)' }}>
                {/* Header with Lead Info */}
                <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-cv-blue">
                        {getLeadTypeIcon(selectedLead.lead_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {selectedLead.sender_name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {selectedLead.sender_email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedLead.status)}
                      <button
                        onClick={() => setSelectedLead(null)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
                      >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-medium mb-0.5">
                        {t.leadsInbox.detailView.subject}
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedLead.subject}
                      </p>
                    </div>

                    {selectedLead.lead_type === 'JOB_OFFER' && (
                      <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        {selectedLead.position_offered && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t.leadsInbox.detailView.position}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedLead.position_offered}</p>
                          </div>
                        )}
                        {selectedLead.salary_range && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t.leadsInbox.detailView.salary}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedLead.salary_range}</p>
                          </div>
                        )}
                        {selectedLead.location && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t.leadsInbox.detailView.location}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedLead.location}</p>
                          </div>
                        )}
                        {selectedLead.company_name && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t.leadsInbox.detailView.company}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedLead.company_name}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-dark-bg-tertiary messaging-scroll">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <div className="inline-flex p-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
                          <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Inicia la conversación enviando un mensaje
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMe = message.sender_id === user?.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`message-item flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%]`}>
                            <div
                              className={`rounded-lg px-3 py-2 ${
                                isMe
                                  ? 'bg-cv-blue text-white'
                                  : 'bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-white border border-gray-200 dark:border-dark-border'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                            <p className={`text-xs text-gray-500 dark:text-gray-500 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                              {new Date(message.created_at).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary">
                  <div className="flex items-end gap-2 mb-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t.contactLeadModal.form.messagePlaceholder}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:border-cv-blue transition-colors"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-2.5 bg-cv-blue hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {selectedLead.status !== 'REPLIED' && (
                      <button
                        onClick={() => updateLeadStatus(selectedLead.id, 'REPLIED')}
                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors text-sm"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>{t.leadsInbox.actions.markReplied}</span>
                      </button>
                    )}
                    <button
                      onClick={() => updateLeadStatus(selectedLead.id, 'ARCHIVED')}
                      className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5"
                    >
                      <ArchiveBoxIcon className="w-4 h-4" />
                      <span>{t.leadsInbox.actions.archive}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border flex items-center justify-center text-center" style={{ height: 'calc(100vh - 300px)' }}>
                <div>
                  <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <EnvelopeOpenIcon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t.leadsInbox.detailView.selectMessage}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t.leadsInbox.detailView.selectMessageDescription}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMessaging;
