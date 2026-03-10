// components/threads/SuccessView.jsx

import React from 'react';
import { useRouter } from 'next/navigation';
import ShareIcons from '@/components/shared/ShareIcons';

const SuccessView = ({
  thread,
  mode = 'add', // 'add' | 'edit'
  onAddAnother
}) => {
  const router = useRouter();

  const isEdit = mode === 'edit';
  const threadId = thread?._id || thread?.id;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Success Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Success Message */}
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-1">
        {isEdit ? 'Topic Updated' : 'Topic Created'}
      </h1>
      <p className="text-sm text-slate-500 text-center mb-6">
        {isEdit ? 'Your changes have been saved.' : 'Your topic is now live and ready for discussion.'}
      </p>

      {/* Topic Summary */}
      {thread?.title && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-slate-900 text-sm mb-1">{thread.title}</h3>
          {thread?.category && (
            <span className="text-xs text-slate-500">{thread.category}</span>
          )}
        </div>
      )}

      {/* Share Section */}
      <div className="border-t border-slate-200 pt-4 mb-6">
        <p className="text-xs text-slate-500 text-center mb-3">Share this topic</p>
        <div className="flex items-center justify-center">
          <ShareIcons
            type="thread"
            title={thread?.title || 'Topic'}
            id={threadId}
          />
        </div>
      </div>

      {/* Action Links */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => router.push(`/threads/views/${threadId}`)}
          className="text-teal-700 hover:text-teal-800 font-medium text-sm"
        >
          View topic page →
        </button>

        {isEdit ? (
          <button
            onClick={() => router.push('/threads')}
            className="text-slate-600 hover:text-slate-700 font-medium text-sm"
          >
            Browse all topics →
          </button>
        ) : (
          <button
            onClick={onAddAnother}
            className="text-slate-600 hover:text-slate-700 font-medium text-sm"
          >
            Create another topic →
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessView;
