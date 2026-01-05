'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Bug, Lightbulb, HelpCircle, Database, MessageCircle, Heart,
  Upload, Trash2, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  submitFeedback,
  getFeedbackTypes,
  type FeedbackType,
  type FeedbackTypeInfo,
  type FeedbackAttachment,
  type FeedbackSubmission,
} from '@/lib/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  bug: Bug,
  lightbulb: Lightbulb,
  'help-circle': HelpCircle,
  database: Database,
  'message-circle': MessageCircle,
  heart: Heart,
};

const MAX_ATTACHMENT_SIZE_MB = 5;
const MAX_ATTACHMENTS = 3;

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedbackTypes, setFeedbackTypes] = useState<FeedbackTypeInfo[]>([]);
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load feedback types on mount
  useEffect(() => {
    async function loadTypes() {
      try {
        const types = await getFeedbackTypes();
        setFeedbackTypes(types);
        if (types.length > 0) {
          setSelectedType(types[0].type_id);
        }
      } catch (err) {
        console.error('Failed to load feedback types:', err);
        // Fallback types if API fails
        setFeedbackTypes([
          { type_id: 'bug', label: 'Bug Report', description: 'Something is not working', icon: 'bug' },
          { type_id: 'feature_request', label: 'Feature Request', description: 'Suggest an improvement', icon: 'lightbulb' },
          { type_id: 'general', label: 'General Feedback', description: 'Other comments', icon: 'message-circle' },
        ]);
        setSelectedType('bug');
      }
    }
    if (isOpen) {
      loadTypes();
    }
  }, [isOpen]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow close animation
      const timer = setTimeout(() => {
        setTitle('');
        setDescription('');
        setEmail('');
        setAttachments([]);
        setSubmitStatus('idle');
        setErrorMessage('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      // Check max attachments
      if (attachments.length >= MAX_ATTACHMENTS) {
        setErrorMessage(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
        break;
      }

      // Check file size
      if (file.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
        setErrorMessage(`File ${file.name} exceeds ${MAX_ATTACHMENT_SIZE_MB}MB limit`);
        continue;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          filename: file.name,
          content_type: file.type || 'application/octet-stream',
          data_base64: base64,
          size_bytes: file.size,
        }]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType || !title.trim() || !description.trim()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const submission: FeedbackSubmission = {
        feedback_type: selectedType,
        title: title.trim(),
        description: description.trim(),
        email: email.trim() || undefined,
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        metadata: {
          screen_width: typeof window !== 'undefined' ? window.innerWidth : null,
          screen_height: typeof window !== 'undefined' ? window.innerHeight : null,
          timestamp: new Date().toISOString(),
        },
      };

      await submitFeedback(submission);
      setSubmitStatus('success');

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setSubmitStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Send Feedback</h2>
            <p className="text-sm text-slate-500">Help us improve GANO Alpha</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Success State */}
        {submitStatus === 'success' ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Thank you!</h3>
            <p className="text-slate-600">Your feedback has been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Feedback Type Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What type of feedback?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {feedbackTypes.map((type) => {
                    const Icon = ICON_MAP[type.icon] || MessageCircle;
                    return (
                      <button
                        key={type.type_id}
                        type="button"
                        onClick={() => setSelectedType(type.type_id)}
                        className={cn(
                          'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                          selectedType === type.type_id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <Icon
                          size={20}
                          className={cn(
                            selectedType === type.type_id ? 'text-indigo-600' : 'text-slate-400'
                          )}
                        />
                        <span className={cn(
                          'text-xs mt-1 font-medium',
                          selectedType === type.type_id ? 'text-indigo-700' : 'text-slate-600'
                        )}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="feedback-title" className="block text-sm font-medium text-slate-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="feedback-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  maxLength={200}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="feedback-description" className="block text-sm font-medium text-slate-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="feedback-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide as much detail as possible..."
                  maxLength={5000}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">{description.length}/5000</p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="feedback-email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email (optional)
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">We will use this to follow up on your feedback</p>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Attachments (optional)
                </label>
                <div className="space-y-2">
                  {/* Attachment List */}
                  {attachments.map((att, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Upload size={16} className="text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 truncate">{att.filename}</span>
                        <span className="text-xs text-slate-400">
                          ({((att.size_bytes || 0) / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        <Trash2 size={14} className="text-slate-400" />
                      </button>
                    </div>
                  ))}

                  {/* Upload Button */}
                  {attachments.length < MAX_ATTACHMENTS && (
                    <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-colors">
                      <Upload size={18} className="text-slate-400" />
                      <span className="text-sm text-slate-500">
                        Add screenshot or file (max {MAX_ATTACHMENT_SIZE_MB}MB)
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.txt,.log,.json"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedType || !title.trim() || !description.trim()}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
                  isSubmitting || !selectedType || !title.trim() || !description.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                )}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
