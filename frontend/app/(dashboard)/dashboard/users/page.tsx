'use client';

import { useEffect, useState } from 'react';
import http from '@/lib/axios';
import ConfirmModal from '@/components/dashboard/ConfirmModal';
import type { User } from '@/types/api';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await http.get<User[]>('/admin/users', {}, { withToken: true });
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setError('获取用户列表失败，请确保后端已添加 /admin/users API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await http.delete(`/admin/users/${deleteId}`, { withToken: true });
      setUsers(users.filter((u) => u.id !== deleteId));
      (document.getElementById('delete-modal') as HTMLDialogElement)?.close();
    } catch (error) {
      console.error('删除用户失败:', error);
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

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await http.put(
        `/admin/users/${user.id}`,
        { role: newRole },
        { withToken: true }
      );
      setUsers(users.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    } catch (error) {
      console.error('更新用户角色失败:', error);
      alert('更新失败，请重试');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">用户管理</h2>
        <div className="alert alert-warning">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
        <div className="card bg-base-100 shadow-md p-6">
          <p className="text-base-content/70">
            需要在后端添加以下 API：
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-base-content/60">
            <li>GET /api/admin/users - 获取用户列表</li>
            <li>PUT /api/admin/users/:id - 更新用户</li>
            <li>DELETE /api/admin/users/:id - 删除用户</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">用户管理</h2>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>邮箱</th>
                  <th>角色</th>
                  <th>注册时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-base-content/50 py-8">
                      暂无用户
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded-full w-10">
                              <span>{(user.username || 'U')[0].toUpperCase()}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            {user.display_name && (
                              <div className="text-sm text-base-content/50">
                                {user.display_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-sm">{user.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            user.role === 'admin' ? 'badge-primary' : 'badge-ghost'
                          }`}
                        >
                          {user.role === 'admin' ? '管理员' : '用户'}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/60">
                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleRole(user)}
                            className="btn btn-ghost btn-sm"
                            title={user.role === 'admin' ? '设为普通用户' : '设为管理员'}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(user.id)}
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
        message="确定要删除这个用户吗？此操作不可撤销。"
        confirmText="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
