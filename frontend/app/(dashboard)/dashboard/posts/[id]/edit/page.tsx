'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import http from '@/lib/axios';
import MarkdownEditor from '@/components/MarkdownEditor';
import type { PostDetail } from '@/types/api';

export default function EditPostPage() {
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await http.get<PostDetail>(`/posts/id/${postId}`);
        if (data) {
          setPost(data);
        } else {
          setError('文章不存在');
        }
      } catch (err) {
        console.error('获取文章失败:', err);
        setError('获取文章失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/posts" className="btn btn-ghost btn-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回
        </Link>
        <div className="alert alert-error">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error || '文章不存在'}</span>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold">编辑文章</h2>
          <span className="text-sm text-base-content/50">ID: {postId}</span>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-0">
          <MarkdownEditor
            blogMode
            initialData={{
              id: post.id,
              title: post.title,
              slug: post.slug,
              content: post.content,
              excerpt: post.summary || '',
              coverImage: post.cover_images && post.cover_images.length > 0 ? post.cover_images[0] : '',
              tags: post.labels || [],
              published: post.published,
            }}
          />
        </div>
      </div>
    </div>
  );
}
