import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { Lead, LeadNote, LeadStatus, LeadFilters } from '../../types';

const LeadsPage: React.FC = () => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Filters
  const [filters, setFilters] = useState<LeadFilters>({
    status: 'all',
    search: '',
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    archived: 0,
  });

  useEffect(() => {
    if (profile?.id) {
      loadLeads();
    }
  }, [profile?.id]);

  useEffect(() => {
    applyFilters();
  }, [leads, filters]);

  useEffect(() => {
    calculateStats();
  }, [leads]);

  const loadLeads = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('profile_id', profile.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {} finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(lead => lead.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.sender_name.toLowerCase().includes(search) ||
        lead.sender_email.toLowerCase().includes(search) ||
        lead.message.toLowerCase().includes(search) ||
        lead.sender_company?.toLowerCase().includes(search)
      );
    }

    setFilteredLeads(filtered);
  };

  const calculateStats = () => {
    setStats({
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      read: leads.filter(l => l.status === 'read').length,
      replied: leads.filter(l => l.status === 'replied').length,
      archived: leads.filter(l => l.status === 'archived').length,
    });
  };

  const handleSelectLead = async (lead: Lead) => {
    setSelectedLead(lead);

    // Mark as read if it's new
    if (lead.status === 'new') {
      await updateLeadStatus(lead.id, 'read');
    }

    // Load notes for this lead
    loadNotes(lead.id);
  };

  const loadNotes = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {}
  };

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const updates: any = { status };

      if (status === 'read' && !leads.find(l => l.id === leadId)?.read_at) {
        updates.read_at = new Date().toISOString();
      }
      if (status === 'replied') {
        updates.replied_at = new Date().toISOString();
      }
      if (status === 'archived') {
        updates.archived_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId);

      if (error) throw error;

      // Update local state
      setLeads(leads.map(lead =>
        lead.id === leadId
          ? { ...lead, ...updates }
          : lead
      ));

      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, ...updates });
      }
    } catch (error) {}
  };

  const handleArchive = async (leadId: string) => {
    await updateLeadStatus(leadId, 'archived');
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'deleted' })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(leads.filter(lead => lead.id !== leadId));
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
    } catch (error) {}
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedLead || !profile?.id) return;

    try {
      setAddingNote(true);
      const { data, error } = await supabase
        .from('lead_notes')
        .insert([{
          lead_id: selectedLead.id,
          profile_id: profile.id,
          note: noteText.trim(),
        }])
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNoteText('');
    } catch (error) {} finally {
      setAddingNote(false);
    }
  };

  const handleReply = (lead: Lead) => {
    const subject = `Re: ${lead.subject || 'Your inquiry'}`;
    const mailtoLink = `mailto:${lead.sender_email}?subject=${encodeURIComponent(subject)}`;
    window.location.href = mailtoLink;

    // Mark as replied
    updateLeadStatus(lead.id, 'replied');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: LeadStatus) => {
    const badges = {
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      read: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      replied: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      archived: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Leads & Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage inquiries from your profile visitors
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.new}</p>
          </div>
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Read</p>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.read}</p>
          </div>
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Replied</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.replied}</p>
          </div>
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Archived</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.archived}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search leads..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leads List */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Leads ({filteredLeads.length})
              </h2>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-cv-blue mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading leads...</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">No leads found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => handleSelectLead(lead)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedLead?.id === lead.id
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {lead.sender_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {lead.sender_email}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          {getStatusBadge(lead.status)}
                        </div>
                      </div>
                      {lead.sender_company && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                          {lead.sender_company}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                        {lead.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(lead.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lead Detail */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {selectedLead ? (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {selectedLead.sender_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedLead.sender_email}
                      </p>
                      {selectedLead.sender_company && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedLead.sender_company}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(selectedLead.status)}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleReply(selectedLead)}
                      className="flex items-center gap-2 px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply
                    </button>
                    {selectedLead.status !== 'archived' && (
                      <button
                        onClick={() => handleArchive(selectedLead.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Archive
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedLead.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>

                {/* Message Content */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  {selectedLead.subject && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-500 uppercase font-semibold mb-1">
                        Subject
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {selectedLead.subject}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 uppercase font-semibold mb-2">
                    Message
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedLead.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                    Received {formatDate(selectedLead.created_at)}
                  </p>
                </div>

                {/* Internal Notes */}
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-500 uppercase font-semibold mb-3">
                    Internal Notes
                  </p>

                  {/* Add Note Form */}
                  <div className="mb-4">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a private note..."
                      rows={3}
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white text-sm resize-none"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!noteText.trim() || addingNote}
                      className="mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingNote ? 'Adding...' : 'Add Note'}
                    </button>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {note.note}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(note.created_at)}
                        </p>
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                        No notes yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a lead to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsPage;

