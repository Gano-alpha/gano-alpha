'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { cn } from '@/lib/utils';

interface FeedbackButtonProps {
  className?: string;
}

export function FeedbackButton({ className }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40',
          'flex items-center gap-2 px-4 py-3',
          'bg-indigo-600 hover:bg-indigo-700 text-white',
          'rounded-full shadow-lg hover:shadow-xl',
          'transition-all duration-200',
          'group',
          className
        )}
        aria-label="Send feedback"
      >
        <MessageSquarePlus size={20} />
        <span className="text-sm font-medium hidden sm:inline">Feedback</span>
      </button>

      {/* Modal */}
      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
