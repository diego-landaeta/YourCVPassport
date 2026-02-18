import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentCheckIcon,
  BriefcaseIcon,
  XCircleIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { JobApplicationStatus } from '../../hooks/useJobApplications';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';

interface TimelineStep {
  status: JobApplicationStatus;
  label: {
    es: string;
    en: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  state: 'completed' | 'current' | 'pending' | 'rejected' | 'withdrawn';
  date?: string;
}

interface ApplicationTimelineProps {
  currentStatus: JobApplicationStatus;
  createdAt?: string;
  updatedAt?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Visual timeline component for job application status tracking
 *
 * Shows the progression of an application through various stages:
 * NEW → REVIEWING → SHORTLISTED → INTERVIEW → OFFER → HIRED
 *
 * Also handles rejected and withdrawn states
 */
const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  currentStatus,
  createdAt,
  updatedAt,
  compact = false,
  className = ''
}) => {
  const { lang } = useLanguage();
  const t = useTranslations();

  // Define the standard workflow steps
  const workflowSteps: TimelineStep[] = [
    {
      status: 'NEW',
      label: { es: 'Enviada', en: 'Submitted' },
      icon: DocumentCheckIcon,
      state: 'completed'
    },
    {
      status: 'REVIEWING',
      label: { es: 'En Revisión', en: 'Under Review' },
      icon: ClockIcon,
      state: 'pending'
    },
    {
      status: 'SHORTLISTED',
      label: { es: 'Preseleccionado', en: 'Shortlisted' },
      icon: UserGroupIcon,
      state: 'pending'
    },
    {
      status: 'INTERVIEW',
      label: { es: 'Entrevista', en: 'Interview' },
      icon: ChatBubbleLeftRightIcon,
      state: 'pending'
    },
    {
      status: 'OFFER',
      label: { es: 'Oferta', en: 'Offer' },
      icon: CheckCircleIcon,
      state: 'pending'
    },
    {
      status: 'HIRED',
      label: { es: 'Contratado', en: 'Hired' },
      icon: BriefcaseIcon,
      state: 'pending'
    }
  ];

  // Update step states based on current status
  const getStepsWithStates = (): TimelineStep[] => {
    // Handle special terminal states
    if (currentStatus === 'REJECTED') {
      return [
        { ...workflowSteps[0], state: 'completed' },
        {
          status: 'REJECTED',
          label: { es: 'Rechazada', en: 'Rejected' },
          icon: XCircleIcon,
          state: 'rejected'
        }
      ];
    }

    if (currentStatus === 'WITHDRAWN') {
      return [
        { ...workflowSteps[0], state: 'completed' },
        {
          status: 'WITHDRAWN',
          label: { es: 'Retirada', en: 'Withdrawn' },
          icon: NoSymbolIcon,
          state: 'withdrawn'
        }
      ];
    }

    // Find current step index
    const currentIndex = workflowSteps.findIndex(step => step.status === currentStatus);

    return workflowSteps.map((step, index) => ({
      ...step,
      state:
        index < currentIndex
          ? 'completed'
          : index === currentIndex
          ? 'current'
          : 'pending'
    }));
  };

  const steps = getStepsWithStates();

  // Get color classes based on state
  const getStateColors = (state: TimelineStep['state']) => {
    switch (state) {
      case 'completed':
        return {
          bg: 'bg-green-500 dark:bg-green-600',
          text: 'text-green-700 dark:text-green-400',
          icon: 'text-white',
          line: 'bg-green-500 dark:bg-green-600'
        };
      case 'current':
        return {
          bg: 'bg-blue-500 dark:bg-blue-600 ring-4 ring-blue-200 dark:ring-blue-900',
          text: 'text-blue-700 dark:text-blue-400 font-semibold',
          icon: 'text-white',
          line: 'bg-gray-300 dark:bg-gray-600'
        };
      case 'rejected':
        return {
          bg: 'bg-red-500 dark:bg-red-600',
          text: 'text-red-700 dark:text-red-400',
          icon: 'text-white',
          line: 'bg-gray-300 dark:bg-gray-600'
        };
      case 'withdrawn':
        return {
          bg: 'bg-gray-500 dark:bg-gray-600',
          text: 'text-gray-700 dark:text-gray-400',
          icon: 'text-white',
          line: 'bg-gray-300 dark:bg-gray-600'
        };
      default: // pending
        return {
          bg: 'bg-gray-300 dark:bg-gray-600',
          text: 'text-gray-500 dark:text-gray-400',
          icon: 'text-gray-400 dark:text-gray-500',
          line: 'bg-gray-300 dark:bg-gray-600'
        };
    }
  };

  if (compact) {
    // Compact version - horizontal with minimal details
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {steps.map((step, index) => {
          const colors = getStateColors(step.state);
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.status}>
              <div className="flex items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center transition-all`}>
                  <Icon className={`w-4 h-4 ${colors.icon}`} />
                </div>
                <span className={`text-xs ${colors.text} hidden sm:inline`}>
                  {step.label[lang]}
                </span>
              </div>
              {!isLast && (
                <div className={`h-0.5 w-8 ${colors.line}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Full version - vertical with more details
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const colors = getStateColors(step.state);
        const Icon = step.icon;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.status} className="relative">
            {/* Connection line */}
            {!isLast && (
              <div
                className={`absolute left-6 top-12 w-0.5 h-8 ${colors.line} transition-all`}
              />
            )}

            {/* Step content */}
            <div className="flex items-start gap-4">
              {/* Icon circle */}
              <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0 transition-all`}>
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>

              {/* Step info */}
              <div className="flex-1 pt-2">
                <h3 className={`text-base font-medium ${colors.text} transition-all`}>
                  {step.label[lang]}
                </h3>
                {step.state === 'current' && updatedAt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t.applicationTimeline.updated}
                    {new Date(updatedAt).toLocaleDateString(lang, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                )}
                {step.state === 'completed' && step.status === 'NEW' && createdAt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(createdAt).toLocaleDateString(lang, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ApplicationTimeline;
