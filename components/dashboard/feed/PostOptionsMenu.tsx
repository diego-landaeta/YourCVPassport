import React, { useState, memo } from 'react';
import {
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  FlagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  MapPinIcon,
  NoSymbolIcon,
  ShieldExclamationIcon,
  EyeSlashIcon,
  XCircleIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from '../../../hooks/useTranslations';

type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';

interface PostOptionsMenuProps {
  isOwner: boolean;
  isPinned?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  isPinLoading?: boolean;
  onReport?: (reason: ReportReason, details?: string) => Promise<boolean>;
  isDeleting?: boolean;
}

const PostOptionsMenu: React.FC<PostOptionsMenuProps> = memo(({
  isOwner,
  isPinned = false,
  onEdit,
  onDelete,
  onPin,
  isPinLoading = false,
  onReport,
  isDeleting = false,
}) => {
  const t = useTranslations();
  const tp = t.feed.post;
  const tr = t.feed.report;
  const [isOpen, setIsOpen] = useState(false);
  const [showReportFlow, setShowReportFlow] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reported, setReported] = useState(false);

  const handleEdit = () => {
    setIsOpen(false);
    onEdit?.();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete?.();
  };

  const handleOpenReport = () => {
    setIsOpen(false);
    setShowReportFlow(true);
    setSelectedReason(null);
    setReportDetails('');
  };

  const handleSubmitReport = async () => {
    if (!selectedReason || !onReport) return;
    setIsReporting(true);
    const success = await onReport(selectedReason, reportDetails.trim() || undefined);
    setIsReporting(false);
    if (success) {
      setReported(true);
      setTimeout(() => {
        setShowReportFlow(false);
        setReported(false);
      }, 2000);
    }
  };

  const reportReasons: { value: ReportReason; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { value: 'spam', label: tr.spam, icon: NoSymbolIcon },
    { value: 'harassment', label: tr.harassment, icon: ShieldExclamationIcon },
    { value: 'inappropriate', label: tr.inappropriate, icon: EyeSlashIcon },
    { value: 'misinformation', label: tr.misinformation, icon: XCircleIcon },
    { value: 'other', label: tr.other, icon: ChatBubbleBottomCenterTextIcon },
  ];

  return (
    <>
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-full transition-colors"
        >
          <EllipsisHorizontalIcon className="w-5 h-5" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-border py-1 z-20">
              {isOwner ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 flex-shrink-0" />
                    {tp.edit}
                  </button>
                  {onPin && (
                    <button
                      onClick={() => { setIsOpen(false); onPin(); }}
                      disabled={isPinLoading}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors disabled:opacity-50"
                    >
                      {isPinLoading ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      ) : (
                        <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                      )}
                      {isPinned ? tp.unpin : tp.pin}
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        {tp.deleting}
                      </>
                    ) : (
                      <>
                        <TrashIcon className="w-4 h-4 flex-shrink-0" />
                        {tp.delete}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleOpenReport}
                  disabled={reported}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    reported
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'
                  }`}
                >
                  {reported ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                      {tr.reported}
                    </>
                  ) : (
                    <>
                      <FlagIcon className="w-4 h-4 flex-shrink-0" />
                      {tr.reportPost}
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Report modal */}
      {showReportFlow && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => !isReporting && setShowReportFlow(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border w-full max-w-sm pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {reported ? (
                /* Success state */
                <div className="p-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {tr.thanks}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tr.willReview}
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-border">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {tr.reportPost}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowReportFlow(false)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Reason selection */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {tr.reasonQuestion}
                    </p>
                    <div className="space-y-1.5">
                      {reportReasons.map((reason) => (
                        <button
                          key={reason.value}
                          onClick={() => setSelectedReason(reason.value)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-left transition-all ${
                            selectedReason === reason.value
                              ? 'bg-cv-blue/10 dark:bg-blue-900/20 text-cv-blue border border-cv-blue/30 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary border border-transparent'
                          }`}
                        >
                          <reason.icon className={`w-4 h-4 flex-shrink-0 ${selectedReason === reason.value ? 'text-cv-blue' : 'text-gray-400 dark:text-gray-500'}`} />
                          {reason.label}
                        </button>
                      ))}
                    </div>

                    {/* Details (shown when "other" or always optional) */}
                    {selectedReason && (
                      <div className="mt-3">
                        <textarea
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          placeholder={tr.detailsPlaceholder}
                          rows={2}
                          maxLength={500}
                          className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-gray-700 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cv-blue/20 focus:border-cv-blue resize-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex gap-2 px-4 pb-4">
                    <button
                      onClick={() => setShowReportFlow(false)}
                      className="flex-1 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-xl transition-colors"
                    >
                      {tp.cancel}
                    </button>
                    <button
                      onClick={handleSubmitReport}
                      disabled={!selectedReason || isReporting}
                      className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isReporting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : (
                        tr.submit
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
});

PostOptionsMenu.displayName = 'PostOptionsMenu';
export default PostOptionsMenu;
