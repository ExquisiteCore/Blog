'use client';

import Link from 'next/link';
import MarkdownEditor from '@/components/MarkdownEditor';

export default function NewPostPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/posts" className="btn btn-ghost btn-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回
          </Link>
          <h2 className="text-2xl font-bold">新建文章</h2>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-0">
          <MarkdownEditor blogMode />
        </div>
      </div>
    </div>
  );
}
