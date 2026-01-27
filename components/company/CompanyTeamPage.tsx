import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { supabase } from '../../supabase/client';
import type { Company, CompanyUser } from '../../types';
import { useToastContext } from '../../context/ToastContext';
import {
  UserGroupIcon,
  UserPlusIcon,
  TrashIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  email?: string;
  full_name?: string;
}

const CompanyTeamPage: React.FC = () => {
  const { company, companyUser } = useOutletContext<{ company: Company; companyUser: CompanyUser }>();
  const translations = useTranslations();
  const toast = useToastContext();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [inviting, setInviting] = useState(false);

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
      fetchTeamMembers();
    }
  }, [company]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);

      // Use RPC function instead of complex JOIN to avoid RLS recursion issues
      const { data: teamData, error } = await supabase
        .rpc('get_company_team_members', { p_company_id: company.id });

      if (error) {
        console.error('Error fetching team members:', error);
        toast.error(t('company.team.fetchError') || 'Failed to load team members');
        return;
      }

      // Data already comes formatted from the RPC function
      setMembers(teamData || []);
    } catch (error) {
      // Only log unexpected errors, don't show toast for empty results
      console.error('Unexpected error in fetchTeamMembers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error(t('company.team.emailRequired') || 'Email is required');
      return;
    }

    try {
      setInviting(true);

      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.toLowerCase())
        .single();

      if (userError || !userData) {
        toast.error(t('company.team.userNotFound') || 'User not found. They must be registered on the platform first.');
        return;
      }

      // REQUIREMENT: User must have had prior contact with the company
      const { data: priorContact, error: contactError } = await supabase
        .from('company_contacts')
        .select('id')
        .eq('company_id', company.id)
        .eq('profile_id', userData.id)
        .single();

      if (contactError || !priorContact) {
        toast.error(
          t('company.team.noPriorContact') ||
          'This user must have had prior contact with your company before being added to the team. Please contact them through the talent search first.'
        );
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('company_users')
        .select('id')
        .eq('company_id', company.id)
        .eq('user_id', userData.id)
        .single();

      if (existingMember) {
        toast.error(t('company.team.alreadyMember') || 'User is already a team member');
        return;
      }

      // Add team member
      const { error: insertError } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          user_id: userData.id,
          role: inviteRole,
          invited_by: companyUser.user_id,
          accepted_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      toast.success(t('company.team.inviteSuccess') || 'Team member added successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error(t('company.team.inviteError') || 'Failed to add team member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberRole: string) => {
    if (memberRole === 'OWNER') {
      toast.error(t('company.team.cannotRemoveOwner') || 'Cannot remove company owner');
      return;
    }

    if (!confirm(t('company.team.confirmRemove') || 'Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('company_users')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success(t('company.team.removeSuccess') || 'Team member removed successfully');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(t('company.team.removeError') || 'Failed to remove team member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case 'ADMIN':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'MEMBER':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'VIEWER':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
      case 'ADMIN':
        return <ShieldCheckIcon className="h-5 w-5" />;
      default:
        return <UserGroupIcon className="h-5 w-5" />;
    }
  };

  const canManageMembers = companyUser.role === 'OWNER' || companyUser.role === 'ADMIN';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t('common.loading') || 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('company.team.title') || 'Team Members'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t('company.team.subtitle') || 'Manage your company team members and their roles'}
              </p>
            </div>
            {canManageMembers && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <UserPlusIcon className="h-5 w-5" />
                {t('company.team.addMember') || 'Add Member'}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('company.team.totalMembers') || 'Total Members'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {members.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('company.team.admins') || 'Admins'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {members.filter(m => m.role === 'ADMIN' || m.role === 'OWNER').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('company.team.activeMembers') || 'Active Members'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {members.filter(m => m.accepted_at).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('company.team.membersList') || 'Members List'}
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('company.team.noMembers') || 'No team members yet'}
                </p>
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          {getRoleIcon(member.role)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {member.full_name || member.email || t('common.anonymous')}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                          {member.user_id === companyUser.user_id && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400">
                              {t('company.team.you') || 'You'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {member.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {member.accepted_at ? (
                            <>
                              <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('company.team.joined') || 'Joined'} {new Date(member.accepted_at).toLocaleDateString()}
                              </p>
                            </>
                          ) : (
                            <>
                              <ClockIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('company.team.pending') || 'Pending invitation'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {canManageMembers && member.user_id !== companyUser.user_id && member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.role)}
                        className="ml-4 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title={t('company.team.removeMember') || 'Remove member'}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Role Descriptions */}
        <div className="mt-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('company.team.roleDescriptions') || 'Role Descriptions'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('company.team.ownerRole') || 'Owner'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('company.team.ownerDesc') || 'Full access to all features including billing and team management'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('company.team.adminRole') || 'Admin'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('company.team.adminDesc') || 'Can manage team members and access all talent search features'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('company.team.memberRole') || 'Member'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('company.team.memberDesc') || 'Can search talent and contact candidates'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('company.team.viewerRole') || 'Viewer'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('company.team.viewerDesc') || 'Read-only access to search results and analytics'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('company.team.inviteNewMember') || 'Invite New Member'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('company.team.emailAddress') || 'Email Address'}
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('company.team.role') || 'Role'}
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ADMIN">{t('company.team.adminRole') || 'Admin'}</option>
                  <option value="MEMBER">{t('company.team.memberRole') || 'Member'}</option>
                  <option value="VIEWER">{t('company.team.viewerRole') || 'Viewer'}</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteRole('MEMBER');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={inviting}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleInviteMember}
                disabled={inviting}
                className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviting ? (t('company.team.inviting') || 'Inviting...') : (t('company.team.sendInvite') || 'Send Invite')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyTeamPage;
