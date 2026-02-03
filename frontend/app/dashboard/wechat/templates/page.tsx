'use client';

import { useState, useEffect } from 'react';
import http from '@/lib/axios';
import ConfirmModal from '@/components/dashboard/ConfirmModal';
import type { Template, TemplateListResponse, Industry } from '@/types/wechat';

export default function WechatTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 发送模板消息
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendForm, setSendForm] = useState({
    template_id: '',
    touser: '',
    url: '',
    data: '{}',
  });
  const [isSending, setIsSending] = useState(false);

  const fetchData = async () => {
    try {
      const [templateData, industryData] = await Promise.all([
        http.get<TemplateListResponse>('/wechat/template/list', {}, { withToken: true }),
        http.get<Industry>('/wechat/template/industry', {}, { withToken: true }),
      ]);

      if (templateData?.template_list) {
        setTemplates(templateData.template_list);
      }
      if (industryData) {
        setIndustry(industryData);
      }
    } catch (err) {
      console.error('获取模板数据失败:', err);
      setError('获取模板数据失败，请检查微信配置');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await http.delete('/wechat/template', {
        withToken: true,
        data: { template_id: deleteId },
      });
      setTemplates(templates.filter(t => t.template_id !== deleteId));
      (document.getElementById('delete-modal') as HTMLDialogElement)?.close();
    } catch (err) {
      console.error('删除模板失败:', err);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const data = JSON.parse(sendForm.data);
      await http.post(
        '/wechat/template/send',
        {
          template_id: sendForm.template_id,
          touser: sendForm.touser,
          url: sendForm.url || undefined,
          data,
        },
        { withToken: true }
      );
      alert('发送成功');
      setSendModalOpen(false);
    } catch (err) {
      console.error('发送失败:', err);
      if (err instanceof SyntaxError) {
        alert('模板数据 JSON 格式错误');
      } else {
        alert('发送失败，请重试');
      }
    } finally {
      setIsSending(false);
    }
  };

  const openSendModal = (templateId: string) => {
    setSendForm({ template_id: templateId, touser: '', url: '', data: '{}' });
    setSendModalOpen(true);
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
        <h2 className="text-2xl font-bold">模板消息</h2>
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
      <h2 className="text-2xl font-bold">模板消息</h2>

      {/* 行业信息 */}
      {industry && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-lg">行业设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <span className="text-sm text-base-content/60">主行业：</span>
                <span className="text-sm font-medium">
                  {industry.primary_industry
                    ? `${industry.primary_industry.first_class} / ${industry.primary_industry.second_class}`
                    : '未设置'}
                </span>
              </div>
              <div>
                <span className="text-sm text-base-content/60">副行业：</span>
                <span className="text-sm font-medium">
                  {industry.secondary_industry
                    ? `${industry.secondary_industry.first_class} / ${industry.secondary_industry.second_class}`
                    : '未设置'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模板列表 */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title text-lg">模板列表 ({templates.length})</h3>
          <div className="overflow-x-auto mt-2">
            <table className="table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>模板 ID</th>
                  <th>行业</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-base-content/50 py-8">
                      暂无模板
                    </td>
                  </tr>
                ) : (
                  templates.map((tpl) => (
                    <tr key={tpl.template_id}>
                      <td>
                        <div className="font-medium">{tpl.title}</div>
                        {tpl.content && (
                          <div className="text-xs text-base-content/50 max-w-xs truncate mt-1">
                            {tpl.content}
                          </div>
                        )}
                      </td>
                      <td className="text-xs font-mono">
                        {tpl.template_id.slice(0, 24)}...
                      </td>
                      <td className="text-sm text-base-content/60">
                        {tpl.primary_industry || '-'} / {tpl.deputy_industry || '-'}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openSendModal(tpl.template_id)}
                            className="btn btn-ghost btn-sm text-primary"
                            title="发送"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(tpl.template_id)}
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

      {/* 发送模板消息弹窗 */}
      {sendModalOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg">发送模板消息</h3>
            <form onSubmit={handleSend} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">接收用户 OpenID</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={sendForm.touser}
                  onChange={(e) => setSendForm({ ...sendForm, touser: e.target.value })}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">跳转链接 (可选)</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  value={sendForm.url}
                  onChange={(e) => setSendForm({ ...sendForm, url: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">模板数据 (JSON)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered font-mono text-sm h-32"
                  value={sendForm.data}
                  onChange={(e) => setSendForm({ ...sendForm, data: e.target.value })}
                  placeholder='{"keyword1":{"value":"内容"}}'
                />
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSendModalOpen(false)}
                  disabled={isSending}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSending}>
                  {isSending && <span className="loading loading-spinner loading-sm"></span>}
                  发送
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setSendModalOpen(false)}>close</button>
          </form>
        </dialog>
      )}

      <ConfirmModal
        id="delete-modal"
        title="确认删除"
        message="确定要删除这个模板吗？"
        confirmText="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
