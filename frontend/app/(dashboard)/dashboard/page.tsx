'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import http from '@/lib/axios';
import type { PostSummary, Label } from '@/types/api';

interface DashboardStats {
  posts: number;
  labels: number;
  users: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ posts: 0, labels: 0, users: 0 });
  const [recentPosts, setRecentPosts] = useState<PostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取文章列表
        const posts = await http.get<PostSummary[]>('/posts');
        // 获取标签列表
        const labels = await http.get<Label[]>('/labels');

        setStats({
          posts: Array.isArray(posts) ? posts.length : 0,
          labels: Array.isArray(labels) ? labels.length : 0,
          users: 0, // 需要后端 API 支持
        });

        if (Array.isArray(posts)) {
          setRecentPosts(posts.slice(0, 5));
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">仪表盘</h2>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="文章总数"
          value={stats.posts}
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatsCard
          title="标签总数"
          value={stats.labels}
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
        <StatsCard
          title="用户总数"
          value={stats.users || '-'}
          description="需要管理员 API"
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
      </div>

      {/* 快捷操作 */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title text-lg">快捷操作</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <Link href="/dashboard/posts/new" className="btn btn-primary btn-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建文章
            </Link>
            <Link href="/dashboard/labels" className="btn btn-outline btn-sm">
              管理标签
            </Link>
          </div>
        </div>
      </div>

      {/* 最近文章 */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h3 className="card-title text-lg">最近文章</h3>
            <Link href="/dashboard/posts" className="btn btn-ghost btn-sm">
              查看全部
            </Link>
          </div>
          <div className="overflow-x-auto mt-2">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>状态</th>
                  <th>发布时间</th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-base-content/50">
                      暂无文章
                    </td>
                  </tr>
                ) : (
                  recentPosts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <Link
                          href={`/dashboard/posts/${post.id}/edit`}
                          className="link link-hover"
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td>
                        {post.published ? (
                          <span className="badge badge-success badge-sm">已发布</span>
                        ) : (
                          <span className="badge badge-warning badge-sm">草稿</span>
                        )}
                      </td>
                      <td className="text-sm text-base-content/60">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('zh-CN')
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
