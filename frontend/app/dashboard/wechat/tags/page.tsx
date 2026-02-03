'use client';

import { useState, useEffect } from 'react';
import http from '@/lib/axios';
import ConfirmModal from '@/components/dashboard/ConfirmModal';

interface WechatTag {
  id: number;
  name: string;
  count?: number;
}

export default function WechatTagsPage() {
  const [tags, setTags] = useState<WechatTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<WechatTag | null>(null);
  const [tagName, setTagName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTags = async () => {
    try {
      const data = await http.get<{ tags: WechatTag[] }>('/wechat/tags', {}, { withToken: true });
      if (data?.tags) {
        setTags(data.tags);
      }
    } catch (err) {
      console.error('获取标签失败:', err);
      setError('获取标签失败，请检查微信配置');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const openCreateModal = () => {
    setEditingTag(null);
    setTagName('');
    setIsModalOpen(true);
  };

  const openEditModal = (tag: WechatTag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingTag) {
        await http.put('/wechat/tags', { id: editingTag.id, name: tagName }, { withToken: true });
        setTags(tags.map(t => t.id === editingTag.id ? { ...t, name: tagName } : t));
      } else {
        const data = await http.post<{ tag: WechatTag }>('/wechat/tags', { name: tagName }, { withToken: true });
        if (data?.tag) {
          setTags([...tags, data.tag]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('保存标签失败:', err);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;

    setIsDeleting(true);
    try {
      await http.delete('/wechat/tags', { withToken: true, data: { id: deleteId } });
      setTags(tags.filter(t => t.id !== deleteId));
      (document.getElementById('delete-modal') as HTMLDialogElement)?.close();
    } catch (err) {
      console.error('删除标签失败:', err);
      alert('删除失败，请重试');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const openDeleteModal = (id: number) => {
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

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">粉丝标签</h2>
        <div className="alert alert-error">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">粉丝标签</h2>
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
                  <th>ID</th>
                  <th>名称</th>
                  <th>粉丝数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tags.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-base-content/50 py-8">
                      暂无标签
                    </td>
                  </tr>
                ) : (
                  tags.map((tag) => (
                    <tr key={tag.id}>
                      <td>{tag.id}</td>
                      <td>
                        <span className="badge badge-primary">{tag.name}</span>
                      </td>
                      <td>{tag.count ?? '-'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(tag)}
                            className="btn btn-ghost btn-sm"
                            title="编辑"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(tag.id)}
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

      {/* 创建/编辑弹窗 */}
      {isModalOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {editingTag ? '编辑标签' : '新建标签'}
            </h3>
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">标签名称</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  maxLength={30}
                  required
                />
                <label className="label">
                  <span className="label-text-alt">最多30个字符</span>
                </label>
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
        message="确定要删除这个标签吗？"
        confirmText="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
