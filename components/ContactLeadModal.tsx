import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import Modal from './Modal';

interface ContactLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

type LeadType = 'JOB_OFFER' | 'COLLABORATION' | 'NETWORKING' | 'CONSULTATION' | 'OTHER';

interface LeadFormData {
  leadType: LeadType;
  subject: string;
  message: string;
  companyName: string;
  positionOffered: string;
  salaryRange: string;
  location: string;
}

const ContactLeadModal: React.FC<ContactLeadModalProps> = ({
  isOpen,
  onClose,
  recipientId,
  recipientName
}) => {
  const { user, profile } = useAuth();
  
  // Simple translations object
  const t = {
    contactLeadModal: {
      title: 'Contact Professional',
      subtitle: 'Send a message to',
      successTitle: 'Message Sent!',
      successMessage: 'Your message has been sent successfully.',
      leadTypes: {
        jobOffer: 'Job Offer',
        collaboration: 'Collaboration',
        networking: 'Networking',
        consultation: 'Consultation',
        other: 'Other'
      },
      form: {
        leadType: 'Type of Contact',
        subject: 'Subject',
        subjectPlaceholder: 'Job Opportunity at',
        subjectPlaceholderOther: 'Subject of your message',
        message: 'Message',
        messagePlaceholder: 'Write your message here...',
        messageMinLength: 'Message must be at least 20 characters',
        companyName: 'Company Name',
        company: 'Company',
        companyPlaceholder: 'Your Company',
        companyOptional: 'Company (Optional)',
        companyOptionalPlaceholder: 'Your Company',
        positionOffered: 'Position Offered',
        position: 'Position',
        positionPlaceholder: 'Senior Developer',
        salaryRange: 'Salary Range',
        salary: 'Salary',
        salaryPlaceholder: '$80,000 - $120,000',
        location: 'Location',
        locationPlaceholder: 'Remote / New York',
        jobOfferDetails: 'Job Offer Details'
      },
      buttons: {
        send: 'Send Message',
        sending: 'Sending...',
        cancel: 'Cancel',
        close: 'Close'
      },
      errors: {
        loginRequired: 'You must be logged in to send messages',
        notLoggedIn: 'You must be logged in to send messages',
        fillRequired: 'Please fill in all required fields',
        sendFailed: 'Failed to send message. Please try again.'
      }
    }
  };
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<LeadFormData>({
    leadType: 'JOB_OFFER',
    subject: '',
    message: '',
    companyName: '',
    positionOffered: '',
    salaryRange: '',
    location: ''
  });

  const leadTypeOptions = [
    { value: 'JOB_OFFER', label: `💼 ${t.contactLeadModal.leadTypes.jobOffer}`, icon: '💼' },
    { value: 'COLLABORATION', label: `🤝 ${t.contactLeadModal.leadTypes.collaboration}`, icon: '🤝' },
    { value: 'NETWORKING', label: `🌐 ${t.contactLeadModal.leadTypes.networking}`, icon: '🌐' },
    { value: 'CONSULTATION', label: `💡 ${t.contactLeadModal.leadTypes.consultation}`, icon: '💡' },
    { value: 'OTHER', label: `📧 ${t.contactLeadModal.leadTypes.other}`, icon: '📧' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      setError(t.contactLeadModal.errors.loginRequired);
      return;
    }

    // Prevent sending message to yourself
    if (user.id === recipientId) {
      setError('No puedes enviarte mensajes a ti mismo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, create the lead
      const { data: leadData, error: insertError } = await supabase
        .from('leads')
        .insert([{
          sender_id: user.id,
          sender_name: profile.full_name || 'Usuario',
          sender_email: user.email || '',
          sender_company: formData.companyName || null,
          recipient_id: recipientId,
          recipient_name: recipientName,
          lead_type: formData.leadType,
          subject: formData.subject,
          message: formData.message,
          company_name: formData.companyName || null,
          position_offered: formData.positionOffered || null,
          salary_range: formData.salaryRange || null,
          location: formData.location || null,
          status: 'NEW'
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Then, create the first message in the conversation
      if (leadData) {
        const { error: messageError } = await supabase
          .from('messages')
          .insert([{
            lead_id: leadData.id,
            sender_id: user.id,
            sender_name: profile.full_name || 'Usuario',
            content: formData.message
          }]);

        if (messageError) throw messageError;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);

    } catch (err: any) {setError(err.message || 'Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      leadType: 'JOB_OFFER',
      subject: '',
      message: '',
      companyName: '',
      positionOffered: '',
      salaryRange: '',
      location: ''
    });
    setSuccess(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedLeadType = leadTypeOptions.find(opt => opt.value === formData.leadType);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="6xl">
      <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-dark-bg-primary dark:to-dark-bg-secondary w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        {success ? (
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6 shadow-xl">
                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3">
              {t.contactLeadModal.successTitle}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {recipientName} {t.contactLeadModal.successMessage}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-cv-blue to-indigo-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {t.contactLeadModal.title} {recipientName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {t.contactLeadModal.subtitle}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Lead Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t.contactLeadModal.form.leadType} *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {leadTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, leadType: option.value as LeadType }))}
                      className={`group relative p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.leadType === option.value
                          ? 'border-cv-blue bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg scale-105'
                          : 'border-gray-200 dark:border-dark-border hover:border-cv-blue/50 hover:shadow-md hover:scale-102'
                      }`}
                    >
                      <div className={`text-3xl mb-2 transition-transform ${
                        formData.leadType === option.value ? 'scale-110' : 'group-hover:scale-110'
                      }`}>
                        {option.icon}
                      </div>
                      <div className={`text-xs font-semibold ${
                        formData.leadType === option.value 
                          ? 'text-cv-blue' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.label.replace(/^[^\s]+ /, '')}
                      </div>
                      {formData.leadType === option.value && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-cv-blue rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t.contactLeadModal.form.subject} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder={
                      formData.leadType === 'JOB_OFFER' 
                        ? t.contactLeadModal.form.subjectPlaceholder
                        : t.contactLeadModal.form.subjectPlaceholderOther
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/20 transition-all"
                  />
                </div>
              </div>

              {/* Conditional Fields for Job Offers */}
              {formData.leadType === 'JOB_OFFER' && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl"></div>
                  <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800/50">
                    <div className="md:col-span-2 flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-cv-blue rounded-lg">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-cv-blue">{t.contactLeadModal.form.jobOfferDetails}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t.contactLeadModal.form.company}
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder={t.contactLeadModal.form.companyPlaceholder}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t.contactLeadModal.form.position}
                      </label>
                      <input
                        type="text"
                        name="positionOffered"
                        value={formData.positionOffered}
                        onChange={handleInputChange}
                        placeholder={t.contactLeadModal.form.positionPlaceholder}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t.contactLeadModal.form.salary}
                      </label>
                      <input
                        type="text"
                        name="salaryRange"
                        value={formData.salaryRange}
                        onChange={handleInputChange}
                        placeholder={t.contactLeadModal.form.salaryPlaceholder}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t.contactLeadModal.form.location}
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder={t.contactLeadModal.form.locationPlaceholder}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t.contactLeadModal.form.message} *
                </label>
                <div className="relative">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    placeholder={t.contactLeadModal.form.messagePlaceholder}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/20 transition-all resize-none"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      formData.message.length >= 50 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {formData.message.length}/50
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {t.contactLeadModal.form.messageMinLength}
                </p>
              </div>

              {/* Company Name for other types */}
              {formData.leadType !== 'JOB_OFFER' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.contactLeadModal.form.companyOptional}
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder={t.contactLeadModal.form.companyOptionalPlaceholder}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:border-cv-blue focus:ring-2 focus:ring-cv-blue/20 transition-all"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t-2 border-gray-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-6 py-3 border-2 border-gray-200 dark:border-dark-border rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary disabled:opacity-50 font-medium transition-all"
                >
                  {t.contactLeadModal.buttons.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.message.length < 50}
                  className="relative px-8 py-3 bg-gradient-to-r from-cv-blue to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>{t.contactLeadModal.buttons.sending}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">{selectedLeadType?.icon}</span>
                      <span>{t.contactLeadModal.buttons.send}</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ContactLeadModal;

