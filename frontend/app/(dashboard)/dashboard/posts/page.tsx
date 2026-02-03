'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import http from '@/lib/axios';
import ConfirmModal from '@/components/dashboard/ConfirmModal';
import type { PostSummaryWithLabels } from '@/types/api';

export default function PostsPage() {
  const [posts, setPosts] = useState<PostSummaryWithLabels[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = async () => {
    try {
      const data = await http.get<PostSummaryWithLabels[]>('/posts');
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await http.delete(`/posts/${deleteId}`, { withToken: true });
      setPosts(posts.filter((p) => p.id !== deleteId));
      (document.getElementById('delete-modal') as HTMLDialogElement)?.close();
    } catch (error) {
      console.error('删除文章失败:', error);
      alert('删除失败，请重试');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    (document.getElementById('delete-modal') as HTMLDialogElement)?.showModal();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">文章管理</h2>
        <Link href="/dashboard/posts/new" className="btn btn-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建文章
        </Link>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>标签</th>
                  <th>状态</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-base-content/50 py-8">
                      暂无文章，点击「新建文章」开始创作
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-base-content/50">{post.slug}</div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {post.labels.slice(0, 3).map((label) => (
                            <span key={label} className="badge badge-outline badge-sm">
                              {label}
                            </span>
                          ))}
                          {post.labels.length > 3 && (
                            <span className="badge badge-ghost badge-sm">
                              +{post.labels.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {post.published ? (
                          <span className="badge badge-success">已发布</span>
                        ) : (
                          <span className="badge badge-warning">草稿</span>
                        )}
                      </td>
                      <td className="text-sm text-base-content/60">
                        {new Date(post.updated_at).toLocaleString('zh-CN')}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="btn btn-ghost btn-sm"
                            title="查看"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/dashboard/posts/${post.id}/edit`}
                            className="btn btn-ghost btn-sm"
                            title="编辑"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => openDeleteModal(post.id)}
                            className="btn btn-ghost btn-sm text-error"
                            title="删除"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        id="delete-modal"
        title="确认删除"
        message="确定要删除这篇文章吗？此操作不可撤销。"
        confirmText="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
