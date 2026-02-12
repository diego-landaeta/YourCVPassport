import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';
import toast from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface JobPosting {
  id: string;
  title: string;
  slug: string;
  company_id: string;
  department: string | null;
  employment_type: string;
  work_mode: string;
  experience_level: string;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  is_remote: boolean;
  description: string;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  required_skills: string[];
  optional_skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: string;
  show_salary: boolean;
  application_deadline: string | null;
  application_email: string | null;
  application_url: string | null;
  application_instructions: string | null;
  published_at: string;
  company: {
    name: string;
    logo_url: string | null;
    website: string | null;
    description: string | null;
  };
}

interface JobQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  is_required: boolean;
}

const JobDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useTranslations();

  const [job, setJob] = useState<JobPosting | null>(null);
  const [questions, setQuestions] = useState<JobQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    loadJobDetails();
  }, [slug]);

  useEffect(() => {
    if (user && job) {
      checkIfApplied();
      loadUserProfile();
    }
  }, [user, job]);

  const loadJobDetails = async () => {
    if (!slug) return;

    try {
      setLoading(true);

      // Use RPC function to get job details (bypasses RLS issues)
      const { data: jobData, error: jobError } = await supabase
        .rpc('get_job_posting_detail', { p_slug: slug });

      if (jobError) {
        console.error('RPC Error:', jobError);
        throw jobError;
      }

      if (!jobData || jobData.length === 0) {
        navigate('/404');
        return;
      }

      // Transform RPC response to expected format
      const job = jobData[0];
      const transformedJob = {
        ...job,
        company: {
          name: job.company_name,
          logo_url: job.company_logo_url,
          website: job.company_website,
          description: job.company_description,
        }
      };

      setJob(transformedJob);

      // Track view (non-blocking, ignore errors)
      supabase.from('job_posting_views').insert({
        job_posting_id: job.id,
        profile_id: user?.id || null,
      }).then(() => {
        // Update views count
        supabase.rpc('increment', {
          row_id: job.id,
          table_name: 'job_postings',
          column_name: 'views_count',
        }).catch(() => {}); // Ignore increment errors
      }).catch(() => {}); // Ignore view tracking errors

      // Load questions
      const { data: questionsData } = await supabase
        .from('job_posting_questions')
        .select('*')
        .eq('job_posting_id', job.id)
        .order('order_index');

      setQuestions(questionsData || []);
    } catch (error: any) {
      console.error('Error loading job details:', error);
      toast.error(t.company?.jobDetail?.errors?.loadingJob || 'Error loading job');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfileId(data.id);
    }
  };

  const checkIfApplied = async () => {
    if (!user || !job) return;

    const { data } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_posting_id', job.id)
      .eq('profile_id', user.id)
      .single();

    setHasApplied(!!data);
  };

  const handleApply = async () => {
    if (!user) {
      toast.error(t.company?.jobDetail?.errors?.loginRequired || 'You must log in to apply');
      navigate('/login');
      return;
    }

    if (!profileId) {
      toast.error(t.company?.jobDetail?.errors?.profileRequired || 'You must have a complete profile to apply');
      return;
    }

    // Validate required questions
    const unansweredRequired = questions.filter(
      q => q.is_required && !answers[q.id]
    );

    if (unansweredRequired.length > 0) {
      toast.error(t.company?.jobDetail?.errors?.answerRequired || 'Please answer all required questions');
      return;
    }

    try {
      setApplying(true);

      const { data, error } = await supabase.rpc('apply_to_job', {
        p_job_posting_id: job!.id,
        p_profile_id: profileId,
        p_cover_letter: coverLetter || null,
        p_answers: answers,
      });

      if (error) throw error;

      toast.success(t.company?.jobDetail?.errors?.applicationSuccess || 'Application submitted successfully!');
      setHasApplied(true);
      setShowApplicationModal(false);
    } catch (error: any) {
      if (error.message?.includes('Already applied')) {
        toast.error(t.company?.jobDetail?.errors?.alreadyApplied || 'You have already applied to this job');
        setHasApplied(true);
      } else if (error.message?.includes('Job not available')) {
        toast.error(t.company?.jobDetail?.errors?.jobNotAvailable || 'This job is no longer available');
      } else {
        toast.error(error.message || t.company?.jobDetail?.errors?.applicationError || 'Error submitting application');
      }
    } finally {
      setApplying(false);
    }
  };

  const getEmploymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FULL_TIME: t.company?.jobDetail?.employmentType?.fullTime || 'Full Time',
      PART_TIME: t.company?.jobDetail?.employmentType?.partTime || 'Part Time',
      CONTRACT: t.company?.jobDetail?.employmentType?.contract || 'Contract',
      TEMPORARY: t.company?.jobDetail?.employmentType?.temporary || 'Temporary',
      INTERNSHIP: t.company?.jobDetail?.employmentType?.internship || 'Internship',
      FREELANCE: t.company?.jobDetail?.employmentType?.freelance || 'Freelance',
    };
    return labels[type] || type;
  };

  const getWorkModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      REMOTE: t.company?.jobDetail?.workMode?.remote || 'Remote',
      ONSITE: t.company?.jobDetail?.workMode?.onsite || 'Onsite',
      HYBRID: t.company?.jobDetail?.workMode?.hybrid || 'Hybrid',
    };
    return labels[mode] || mode;
  };

  const getExperienceLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      ENTRY: t.company?.jobDetail?.experienceLevel?.entry || 'Entry Level',
      JUNIOR: t.company?.jobDetail?.experienceLevel?.junior || 'Junior',
      MID: t.company?.jobDetail?.experienceLevel?.mid || 'Mid-Level',
      SENIOR: t.company?.jobDetail?.experienceLevel?.senior || 'Senior',
      LEAD: t.company?.jobDetail?.experienceLevel?.lead || 'Lead',
      EXECUTIVE: t.company?.jobDetail?.experienceLevel?.executive || 'Executive',
    };
    return labels[level] || level;
  };

  const formatSalary = (min: number | null, max: number | null, currency: string, period: string) => {
    let salary = '';
    const salaryFrom = t.company?.jobDetail?.salaryFrom || 'From';
    const salaryUpTo = t.company?.jobDetail?.salaryUpTo || 'Up to';

    if (min && max) {
      salary = `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    } else if (min) {
      salary = `${salaryFrom} ${currency} ${min.toLocaleString()}`;
    } else if (max) {
      salary = `${salaryUpTo} ${currency} ${max!.toLocaleString()}`;
    }

    if (period) {
      const periodLabels: Record<string, string> = {
        HOURLY: t.company?.jobDetail?.salaryPeriod?.hourly || '/hour',
        MONTHLY: t.company?.jobDetail?.salaryPeriod?.monthly || '/month',
        YEARLY: t.company?.jobDetail?.salaryPeriod?.yearly || '/year',
      };
      salary += periodLabels[period] || '';
    }

    return salary;
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const daysRemaining = getDaysRemaining(job.application_deadline);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t.company?.jobDetail?.backToSearch || 'Back to search'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-6">
              {job.company.logo_url ? (
                <img
                  src={job.company.logo_url}
                  alt={job.company.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-10 w-10 text-gray-400" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <p className="text-xl text-gray-600 mb-3">{job.company.name}</p>
                <div className="flex flex-wrap gap-2">
                  {job.employment_type && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <BriefcaseIcon className="h-4 w-4 mr-1" />
                      {getEmploymentTypeLabel(job.employment_type)}
                    </span>
                  )}
                  {job.work_mode && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {getWorkModeLabel(job.work_mode)}
                    </span>
                  )}
                  {job.is_remote ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {t.company?.jobDetail?.remote || 'Remote'}
                    </span>
                  ) : (
                    job.location_city && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {job.location_city}, {job.location_country}
                      </span>
                    )
                  )}
                  {job.experience_level && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      {getExperienceLevelLabel(job.experience_level)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="text-right">
              {hasApplied ? (
                <div className="inline-flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {t.company?.jobDetail?.alreadyApplied || 'Already applied'}
                </div>
              ) : (
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  {t.company?.jobDetail?.applyNow || 'Apply Now'}
                </button>
              )}
              {daysRemaining !== null && daysRemaining > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  {daysRemaining} {daysRemaining !== 1
                    ? (t.company?.jobDetail?.daysRemainingPlural || 'days remaining')
                    : (t.company?.jobDetail?.daysRemaining || 'day remaining')}
                </p>
              )}
            </div>
          </div>

          {/* Salary & Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
            {job.show_salary && (job.salary_min || job.salary_max) && (
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-2" />
                <div>
                  <div className="text-sm text-gray-500">{t.company?.jobDetail?.salary || 'Salary'}</div>
                  <div className="font-semibold text-gray-900">
                    {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)}
                  </div>
                </div>
              </div>
            )}
            {job.department && (
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-6 w-6 text-gray-600 mr-2" />
                <div>
                  <div className="text-sm text-gray-500">{t.company?.jobDetail?.department || 'Department'}</div>
                  <div className="font-semibold text-gray-900">{job.department}</div>
                </div>
              </div>
            )}
            <div className="flex items-center">
              <CalendarIcon className="h-6 w-6 text-gray-600 mr-2" />
              <div>
                <div className="text-sm text-gray-500">{t.company?.jobDetail?.published || 'Published'}</div>
                <div className="font-semibold text-gray-900">
                  {new Date(job.published_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t.company?.jobDetail?.jobDescription || 'Job Description'}</h2>
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t.company?.jobDetail?.responsibilities || 'Responsibilities'}</h2>
                <ul className="space-y-2">
                  {job.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t.company?.jobDetail?.requirements || 'Requirements'}</h2>
                <ul className="space-y-2">
                  {job.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nice to Have */}
            {job.nice_to_have && job.nice_to_have.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t.company?.jobDetail?.niceToHave || 'Nice to Have'}</h2>
                <ul className="space-y-2">
                  {job.nice_to_have.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t.company?.jobDetail?.benefits || 'Benefits'}</h2>
                <ul className="space-y-2">
                  {job.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            {job.required_skills && job.required_skills.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-gray-900 mb-3">{t.company?.jobDetail?.requiredSkills || 'Required Skills'}</h3>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.optional_skills && job.optional_skills.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-gray-900 mb-3">{t.company?.jobDetail?.optionalSkills || 'Optional Skills'}</h3>
                <div className="flex flex-wrap gap-2">
                  {job.optional_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Company Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-3">{t.company?.jobDetail?.aboutCompany || 'About the Company'}</h3>
              <p className="text-gray-700 mb-4">{job.company.description || job.company.name}</p>
              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <GlobeAltIcon className="h-5 w-5 mr-2" />
                  {t.company?.jobDetail?.website || 'Website'}
                </a>
              )}
            </div>

            {/* Application Instructions */}
            {job.application_instructions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-2">{t.company?.jobDetail?.applicationInstructions || 'Application Instructions'}</h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {job.application_instructions}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t.company?.jobDetail?.modal?.applyTo || 'Apply to'} {job.title}
              </h2>

              {/* Cover Letter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.company?.jobDetail?.modal?.coverLetter || 'Cover Letter'}
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.company?.jobDetail?.modal?.coverLetterPlaceholder || 'Tell us why you are the ideal candidate for this position...'}
                />
              </div>

              {/* Custom Questions */}
              {questions.map((question) => (
                <div key={question.id} className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {question.question_text}
                    {question.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {question.question_type === 'TEXT' && (
                    <input
                      type="text"
                      value={answers[question.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  {question.question_type === 'TEXTAREA' && (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  {question.question_type === 'YES_NO' && (
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={question.id}
                          value="yes"
                          checked={answers[question.id] === 'yes'}
                          onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                          className="mr-2"
                        />
                        {t.company?.jobDetail?.yesNo?.yes || 'Yes'}
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={question.id}
                          value="no"
                          checked={answers[question.id] === 'no'}
                          onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                          className="mr-2"
                        />
                        {t.company?.jobDetail?.yesNo?.no || 'No'}
                      </label>
                    </div>
                  )}
                </div>
              ))}

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  disabled={applying}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {t.company?.jobDetail?.modal?.cancel || 'Cancel'}
                </button>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {applying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t.company?.jobDetail?.modal?.sending || 'Sending...'}
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                      {t.company?.jobDetail?.modal?.submitApplication || 'Submit Application'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;
