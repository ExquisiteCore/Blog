'use client';

import { useEffect, useState } from 'react';
import http from '@/lib/axios';
import ConfirmModal from '@/components/dashboard/ConfirmModal';
import type { Label } from '@/types/api';

export default function LabelsPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const fetchLabels = async () => {
    try {
      const data = await http.get<Label[]>('/labels');
      if (Array.isArray(data)) {
        setLabels(data);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLabels();
  }, []);

  const openCreateModal = () => {
    setEditingLabel(null);
    setFormData({ name: '', slug: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (label: Label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      slug: label.slug,
      description: label.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingLabel) {
        // 更新标签
        const updated = await http.put<Label>(
          `/admin/labels/${editingLabel.id}`,
          formData,
          { withToken: true }
        );
        setLabels(labels.map((l) => (l.id === editingLabel.id ? updated : l)));
      } else {
        // 创建标签
        const created = await http.post<Label>('/admin/labels', formData, { withToken: true });
        setLabels([...labels, created]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('保存标签失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await http.delete(`/admin/labels/${deleteId}`, { withToken: true });
      setLabels(labels.filter((l) => l.id !== deleteId));
      (document.getElementById('delete-modal') as HTMLDialogElement)?.close();
    } catch (error) {
      console.error('删除标签失败:', error);
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

  // 自动生成 slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
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
        <h2 className="text-2xl font-bold">标签管理</h2>
        <button onClick={openCreateModal} className="btn btn-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建标签
        </button>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>Slug</th>
                  <th>描述</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {labels.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-base-content/50 py-8">
                      暂无标签
                    </td>
                  </tr>
                ) : (
                  labels.map((label) => (
                    <tr key={label.id}>
                      <td>
                        <span className="badge badge-primary">{label.name}</span>
                      </td>
                      <td className="text-sm text-base-content/60">{label.slug}</td>
                      <td className="text-sm max-w-xs truncate">
                        {label.description || '-'}
                      </td>
                      <td className="text-sm text-base-content/60">
                        {new Date(label.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(label)}
                            className="btn btn-ghost btn-sm"
                            title="编辑"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(label.id)}
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

      {/* 创建/编辑标签弹窗 */}
      {isModalOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {editingLabel ? '编辑标签' : '新建标签'}
            </h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">名称</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      slug: editingLabel ? formData.slug : generateSlug(name),
                    });
                  }}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Slug</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">描述</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving && <span className="loading loading-spinner loading-sm"></span>}
                  保存
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setIsModalOpen(false)}>close</button>
          </form>
        </dialog>
      )}

      <ConfirmModal
        id="delete-modal"
        title="确认删除"
        message="确定要删除这个标签吗？此操作不可撤销。"
        confirmText="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
