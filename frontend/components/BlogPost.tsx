'use client';

import { useState, useEffect } from 'react';
import http from '@/lib/axios';
import MarkdownRenderer from './MarkdownRenderer';

// 定义文章接口
interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  labels: string[];
}

// 格式化日期函数
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface BlogPostProps {
  slug: string;
}

export default function BlogPost({ slug }: BlogPostProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const response = await http.get<Post>(`/posts/${slug}`, {
          withToken: false,
        });

        if (response && response.id) {
          setPost({
            ...response,
            featured_image: response.featured_image
              ? response.featured_image.replace(/`/g, '').trim()
              : null,
          });
        } else {
          console.error('API响应格式不符合预期:', response);
          setError('文章不存在');
        }
      } catch (err) {
        console.error(`获取文章 ${slug} 失败:`, err);
        setError('获取文章失败');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose prose-lg dark:prose-invert max-w-none">
        {post.featured_image && (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-64 md:h-96 rounded-lg object-cover shadow-md mb-8"
          />
        )}

        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center text-sm opacity-70 mb-8">
          <span>{formatDate(post.published_at)}</span>
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
