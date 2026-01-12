'use client';

import { useState } from 'react';
import { MessageSquarePlus, X, Send, Camera, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.gano.ai';

type FeedbackType = 'bug' | 'feature' | 'question' | 'praise' | 'other';
type Priority = 'low' | 'medium' | 'high' | 'critical';

interface FeedbackSubmission {
  feedback_type: FeedbackType;
  priority: Priority;
  title: string;
  description: string;
  page_url: string;
  user_agent: string;
  screenshot_url?: string;
}

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [priority, setPriority] = useState<Priority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const feedbackTypes: { value: FeedbackType; label: string; emoji: string }[] = [
    { value: 'bug', label: 'Bug Report', emoji: '🐛' },
    { value: 'feature', label: 'Feature Request', emoji: '✨' },
    { value: 'question', label: 'Question', emoji: '❓' },
    { value: 'praise', label: 'Praise', emoji: '🎉' },
    { value: 'other', label: 'Other', emoji: '💬' },
  ];

  const priorities: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-gray-200 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-200 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-200 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-200 text-red-800' },
  ];

  const captureScreenshot = async () => {
    try {
      // Use html2canvas if available, otherwise skip
      if (typeof window !== 'undefined' && 'html2canvas' in window) {
        const canvas = await (window as any).html2canvas(document.body);
        setScreenshot(canvas.toDataURL('image/png'));
      } else {
        // Fallback: just note that screenshot was requested
        setScreenshot('screenshot_requested');
      }
    } catch (err) {
      console.error('Screenshot capture failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const submission: FeedbackSubmission = {
      feedback_type: feedbackType,
      priority,
      title,
      description,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenshot_url: screenshot || undefined,
    };

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(submission),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to submit feedback');
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        resetForm();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFeedbackType('bug');
    setPriority('medium');
    setTitle('');
    setDescription('');
    setScreenshot(null);
    setError(null);
  };

  if (isSuccess) {
    return (
      <>
        <FeedbackTrigger onClick={() => setIsOpen(true)} />
        {isOpen && (
          <FeedbackModal onClose={() => { setIsOpen(false); setIsSuccess(false); }}>
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">Thank you!</h3>
              <p className="text-muted-foreground text-center mt-2">
                Your feedback has been submitted. We&apos;ll review it shortly.
              </p>
            </div>
          </FeedbackModal>
        )}
      </>
    );
  }

  return (
    <>
      <FeedbackTrigger onClick={() => setIsOpen(true)} />

      {isOpen && (
        <FeedbackModal onClose={() => setIsOpen(false)}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5" />
              Send Feedback
            </CardTitle>
            <CardDescription>
              Help us improve GANO. Your feedback goes directly to our team.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <div className="flex flex-wrap gap-2">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFeedbackType(type.value)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        feedbackType === type.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      {type.emoji} {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority (only for bugs) */}
              {feedbackType === 'bug' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <div className="flex gap-2">
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          priority === p.value
                            ? p.color
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  required
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide as much detail as possible..."
                  required
                  rows={4}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Screenshot */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={captureScreenshot}
                  disabled={!!screenshot}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {screenshot ? 'Screenshot attached' : 'Attach screenshot'}
                </Button>
                {screenshot && (
                  <button
                    type="button"
                    onClick={() => setScreenshot(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !title || !description}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </FeedbackModal>
      )}
    </>
  );
}

function FeedbackTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors"
      aria-label="Send feedback"
    >
      <MessageSquarePlus className="h-6 w-6" />
    </button>
  );
}

function FeedbackModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="fixed bottom-20 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </Card>
    </>
  );
}

export default FeedbackButton;
