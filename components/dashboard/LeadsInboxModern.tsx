import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import {
  EnvelopeIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  UserCircleIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  EllipsisVerticalIcon,
  FunnelIcon,
  StarIcon,
  ArchiveBoxIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface Lead {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  sender_company: string | null;
  lead_type: string;
  subject: string;
  message: string;
  company_name: string | null;
  position_offered: string | null;
  salary_range: string | null;
  location: string | null;
  status: string;
  created_at: string;
  read_at: string | null;
  unread_count?: number;
}

interface Message {
  id: string;
  lead_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const LeadsInboxModern: React.FC = () => {
  const { user, profile } = useAuth();
  const t = useTranslations();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'job_offers' | 'collaboration' | 'accepted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [starred, setStarred] = useState<Set<string>>(new Set());

  // Messaging state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      loadLeads();
    }
  }, [profile]);

  useEffect(() => {
    applyFilters();
  }, [leads, filter, searchQuery]);

  useEffect(() => {
    if (selectedLead) {
      loadMessages(selectedLead.id);
      markLeadAsRead(selectedLead.id);

      // Subscribe to new messages
      const subscription = supabase
        .channel(`messages:${selectedLead.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedLead.id}`
        }, (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id !== user?.id) {
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedLead, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          messages(count)
        `)
        .eq('recipient_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const leadsWithCount = await Promise.all((data || []).map(async (lead) => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('lead_id', lead.id)
          .eq('is_read', false)
          .neq('sender_id', profile?.id);

        return { ...lead, unread_count: count || 0 };
      }));

      setLeads(leadsWithCount);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markLeadAsRead = async (leadId: string) => {
    try {
      await supabase
        .from('leads')
        .update({ read_at: new Date().toISOString() })
        .eq('id', leadId);

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('lead_id', leadId)
        .neq('sender_id', profile?.id);

      setLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, read_at: new Date().toISOString(), unread_count: 0 } : lead
      ));
    } catch (error) {
      console.error('Error marking lead as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || sending) return;

    try {
      setSending(true);
      const { data, error } = await supabase
        .from('messages')
        .insert({
          lead_id: selectedLead.id,
          sender_id: user?.id,
          sender_name: profile?.full_name || 'Unknown',
          content: newMessage.trim(),
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const updateLeadStatus = async (status: string) => {
    if (!selectedLead) return;

    try {
      await supabase
        .from('leads')
        .update({ status })
        .eq('id', selectedLead.id);

      setLeads(prev => prev.map(lead =>
        lead.id === selectedLead.id ? { ...lead, status } : lead
      ));
      setSelectedLead({ ...selectedLead, status });
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Apply status filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(lead => !lead.read_at || (lead.unread_count && lead.unread_count > 0));
        break;
      case 'job_offers':
        filtered = filtered.filter(lead => lead.lead_type === 'JOB_OFFER');
        break;
      case 'collaboration':
        filtered = filtered.filter(lead => lead.lead_type === 'COLLABORATION');
        break;
      case 'accepted':
        filtered = filtered.filter(lead => lead.status === 'ACCEPTED');
        break;
      case 'rejected':
        filtered = filtered.filter(lead => lead.status === 'REJECTED');
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.sender_name.toLowerCase().includes(query) ||
        lead.subject.toLowerCase().includes(query) ||
        lead.sender_email.toLowerCase().includes(query) ||
        (lead.company_name && lead.company_name.toLowerCase().includes(query))
      );
    }

    setFilteredLeads(filtered);
  };

  const toggleStar = (leadId: string) => {
    setStarred(prev => {
      const newStarred = new Set(prev);
      if (newStarred.has(leadId)) {
        newStarred.delete(leadId);
      } else {
        newStarred.add(leadId);
      }
      return newStarred;
    });
  };

  const getLeadTypeInfo = (type: string) => {
    switch (type) {
      case 'JOB_OFFER':
        return { label: t.leadsInbox.filters.job_offers, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: BriefcaseIcon };
      case 'COLLABORATION':
        return { label: t.leadsInbox.filters.collaboration, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: ChatBubbleLeftRightIcon };
      case 'INQUIRY':
        return { label: 'Consulta', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: EnvelopeIcon };
      default:
        return { label: 'General', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400', icon: EnvelopeIcon };
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return t.leadsInbox.labels.yesterday;
    } else if (diffInHours < 168) {
      return d.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.leadsInbox.messageInput.sending}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-gray-50 dark:bg-dark-bg-primary rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border shadow-xl">
      {/* Sidebar - Lista de conversaciones */}
      <div className="w-96 bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-dark-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <EnvelopeIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            {t.leadsInbox.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Manage job offers, collaboration requests, and messages from recruiters. Respond directly, accept or decline opportunities, and keep all your professional communications organized in one place.
          </p>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.leadsInbox.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.leadsInbox.filters.all} ({leads.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.leadsInbox.filters.unread}
            </button>
            <button
              onClick={() => setFilter('job_offers')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'job_offers'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.leadsInbox.filters.job_offers}
            </button>
          </div>
        </div>

        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <EnvelopeIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {t.leadsInbox.emptyState.noConversations}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {t.leadsInbox.emptyState.noConversationsDescription}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-dark-border">
              {filteredLeads.map((lead) => {
                const typeInfo = getLeadTypeInfo(lead.lead_type);
                const Icon = typeInfo.icon;
                const isUnread = !lead.read_at || (lead.unread_count && lead.unread_count > 0);
                const isSelected = selectedLead?.id === lead.id;

                return (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-all relative group ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' : ''
                    } ${isUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-lg ${
                        isSelected ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        {lead.sender_name.charAt(0).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-semibold truncate ${
                            isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {lead.sender_name}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {formatDate(lead.created_at)}
                          </span>
                        </div>

                        {lead.company_name && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">
                            {lead.company_name}
                          </p>
                        )}

                        <p className={`text-sm truncate mb-2 ${
                          isUnread ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {lead.subject}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${typeInfo.color}`}>
                            <Icon className="w-3 h-3" />
                            {typeInfo.label}
                          </span>

                          {isUnread && lead.unread_count && lead.unread_count > 0 && (
                            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {lead.unread_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Star */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(lead.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {starred.has(lead.id) ? (
                          <StarSolidIcon className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <StarIcon className="w-5 h-5 text-gray-400 hover:text-yellow-500" />
                        )}
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Conversación */}
      {selectedLead ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-dark-bg-secondary">
          {/* Header de conversación */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-gray-50 to-white dark:from-dark-bg-tertiary dark:to-dark-bg-secondary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedLead.sender_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {selectedLead.sender_name}
                    {selectedLead.status === 'ACCEPTED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                        <CheckCircleIcon className="w-4 h-4" />
                        Aceptado
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedLead.company_name || selectedLead.sender_email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLeadDetails(!showLeadDetails)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
                  title="Detalles"
                >
                  <EllipsisVerticalIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white dark:from-dark-bg-primary/50 dark:to-dark-bg-secondary">
            {/* Initial message from lead */}
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {selectedLead.sender_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedLead.sender_name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(selectedLead.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="bg-white dark:bg-dark-bg-tertiary rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-dark-border">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">{selectedLead.subject}</p>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedLead.message}</p>

                  {/* Job details if available */}
                  {selectedLead.position_offered && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <BriefcaseIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{selectedLead.position_offered}</span>
                      </div>
                      {selectedLead.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPinIcon className="w-4 h-4" />
                          {selectedLead.location}
                        </div>
                      )}
                      {selectedLead.salary_range && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CurrencyDollarIcon className="w-4 h-4" />
                          {selectedLead.salary_range}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Follow-up messages */}
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {msg.sender_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`flex-1 max-w-2xl ${isOwn ? 'flex flex-col items-end' : ''}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{msg.sender_name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      isOwn
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white dark:bg-dark-bg-tertiary border border-gray-100 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-tl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary">
            {selectedLead.status === 'PENDING' && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => updateLeadStatus('ACCEPTED')}
                  className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  {t.leadsInbox.actions.accept}
                </button>
                <button
                  onClick={() => updateLeadStatus('REJECTED')}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <XCircleIcon className="w-5 h-5" />
                  {t.leadsInbox.actions.reject}
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={t.leadsInbox.messageInput.placeholder}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                <span className="hidden sm:inline">{t.leadsInbox.actions.send}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-dark-bg-primary dark:to-dark-bg-secondary">
          <div className="text-center">
            <ChatBubbleLeftRightIcon className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t.leadsInbox.emptyState.noMessages}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t.leadsInbox.emptyState.noMessagesDescription}
            </p>
          </div>
        </div>
      )}

      {/* Details Panel (opcional, slide from right) */}
      {showLeadDetails && selectedLead && (
        <div className="w-80 bg-gray-50 dark:bg-dark-bg-tertiary border-l border-gray-200 dark:border-dark-border p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.leadsInbox.detailView.leadDetails}</h3>
            <button
              onClick={() => setShowLeadDetails(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Sender info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">{t.leadsInbox.detailView.contactInfo}</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserCircleIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{selectedLead.sender_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${selectedLead.sender_email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {selectedLead.sender_email}
                  </a>
                </div>
                {selectedLead.company_name && (
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{selectedLead.company_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Job details if available */}
            {selectedLead.position_offered && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">{t.leadsInbox.detailView.jobOfferDetails}</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.leadsInbox.detailView.position}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedLead.position_offered}</p>
                  </div>
                  {selectedLead.location && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.leadsInbox.detailView.location}</p>
                      <p className="text-gray-900 dark:text-white">{selectedLead.location}</p>
                    </div>
                  )}
                  {selectedLead.salary_range && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.leadsInbox.detailView.salary}</p>
                      <p className="text-gray-900 dark:text-white">{selectedLead.salary_range}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">{t.leadsInbox.actions.archive}</h4>
              <div className="space-y-2">
                <button
                  onClick={() => updateLeadStatus('ARCHIVED')}
                  className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <ArchiveBoxIcon className="w-5 h-5" />
                  {t.leadsInbox.actions.archive}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsInboxModern;
