'use client';

import { useState, useEffect } from 'react';
import http from '@/lib/axios';
import MarkdownRenderer from './MarkdownRenderer';
import type { PostDetail } from '@/types/api';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface BlogPostProps {
  id: string;
}

export default function BlogPost({ id }: BlogPostProps) {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const response = await http.get<PostDetail>(`/posts/id/${id}`, undefined, {
          withToken: false,
        });

        if (response && response.id) {
          setPost(response);
        } else {
          console.error('API响应格式不符合预期:', response);
          setError('文章不存在');
        }
      } catch (err) {
        console.error(`获取文章 ${id} 失败:`, err);
        setError('获取文章失败');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-12 text-center">
        <div className="alert alert-error shadow-lg max-w-md mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error || '文章不存在或已被删除'}</span>
        </div>
      </div>
    );
  }

  const coverImage = post.cover_images && post.cover_images.length > 0 ? post.cover_images[0] : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose prose-lg dark:prose-invert max-w-none">
        {coverImage && (
          <img
            src={coverImage}
            alt={post.title}
            className="w-full h-64 md:h-96 rounded-lg object-cover shadow-md mb-8"
          />
        )}

        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center text-sm opacity-70 mb-8">
          {post.published_at && <span>{formatDate(post.published_at)}</span>}
          {post.labels && post.labels.length > 0 && (
            <div className="flex gap-2 ml-4">
              {post.labels.map((tag) => (
                <div key={tag} className="badge badge-outline">
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>

        <MarkdownRenderer content={post.content} />
      </article>
    </div>
  );
}
