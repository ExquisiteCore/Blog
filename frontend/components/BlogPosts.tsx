'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import http from '@/lib/axios';
import type { PostSummary } from '@/types/api';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogPosts() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const response = await http.get<PostSummary[]>('/posts', undefined, {
          withToken: false,
        });

        if (Array.isArray(response)) {
          setPosts(response);
        } else {
          console.error('API响应格式不符合预期:', response);
          setError('获取文章列表失败');
        }
      } catch (err) {
        console.error('获取文章列表失败:', err);
        setError('获取文章列表失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
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
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-base-content/60">
          <p className="text-xl mb-2">暂无文章</p>
          <p>敬请期待...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/blog/${post.slug}`}
          className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
        >
          {post.cover_images && post.cover_images.length > 0 && (
            <figure>
              <img
                src={post.cover_images[0]}
                alt={post.title}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            </figure>
          )}
          <div className="card-body">
            <h2 className="card-title line-clamp-2">{post.title}</h2>
            {post.summary && (
              <p className="text-base-content/70 line-clamp-3">{post.summary}</p>
            )}
            <div className="flex items-center justify-between mt-4">
              {post.published_at && (
                <span className="text-sm text-base-content/60">
                  {formatDate(post.published_at)}
                </span>
              )}
              {post.labels && post.labels.length > 0 && (
                <div className="flex gap-1">
                  {post.labels.slice(0, 2).map((label) => (
                    <span key={label} className="badge badge-outline badge-sm">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
