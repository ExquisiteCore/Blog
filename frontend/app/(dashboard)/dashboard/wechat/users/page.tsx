'use client';

import { useState } from 'react';
import http from '@/lib/axios';
import type { WechatUser, UserListResponse, BatchUserInfoResponse } from '@/types/wechat';

export default function WechatUsersPage() {
  const [users, setUsers] = useState<WechatUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextOpenid, setNextOpenid] = useState<string>('');
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [remarkModal, setRemarkModal] = useState<{ openid: string; remark: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUserList = async (startOpenid?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (startOpenid) {
        params.next_openid = startOpenid;
      }
      const data = await http.get<UserListResponse>('/wechat/user/list', params, { withToken: true });

      if (data && data.data) {
        setTotal(data.total);
        setNextOpenid(data.next_openid || '');

        // 批量获取用户详情
        if (data.data.length > 0) {
          const userInfos = await http.post<BatchUserInfoResponse>(
            '/wechat/user/batch',
            { openids: data.data },
            { withToken: true }
          );

          if (userInfos?.user_info_list) {
            setUsers(startOpenid ? [...users, ...userInfos.user_info_list] : userInfos.user_info_list);
          }
        }
      }
    } catch (err) {
      console.error('获取粉丝列表失败:', err);
      setError('获取粉丝列表失败，请检查微信配置是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRemark = async () => {
    if (!remarkModal) return;

    setIsSaving(true);
    try {
      await http.post(
        '/wechat/user/remark',
        { openid: remarkModal.openid, remark: remarkModal.remark },
        { withToken: true }
      );

      setUsers(users.map(u =>
        u.openid === remarkModal.openid
          ? { ...u, remark: remarkModal.remark }
          : u
      ));
      setRemarkModal(null);
    } catch (err) {
      console.error('设置备注失败:', err);
      alert('设置备注失败');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">粉丝管理</h2>
        <button
          onClick={() => fetchUserList()}
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          获取粉丝列表
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {total > 0 && (
        <div className="text-sm text-base-content/60">
          共 {total} 个粉丝，已加载 {users.length} 个
        </div>
      )}

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>OpenID</th>
                  <th>地区</th>
                  <th>关注时间</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-base-content/50 py-8">
                      点击「获取粉丝列表」加载数据
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.openid}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-10 rounded-full">
                              {user.headimgurl ? (
                                <img src={user.headimgurl} alt="" />
                              ) : (
                                <div className="bg-base-300 w-full h-full flex items-center justify-center">
                                  <span className="text-base-content/30">?</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.nickname || '未知'}
                            </div>
                            <div className="text-xs text-base-content/50">
                              {user.sex === 1 ? '男' : user.sex === 2 ? '女' : '未知'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs font-mono">{user.openid.slice(0, 16)}...</td>
                      <td className="text-sm">
                        {[user.country, user.province, user.city].filter(Boolean).join(' ') || '-'}
                      </td>
                      <td className="text-sm text-base-content/60">
                        {formatTime(user.subscribe_time)}
                      </td>
                      <td className="text-sm">{user.remark || '-'}</td>
                      <td>
                        <button
                          onClick={() => setRemarkModal({ openid: user.openid, remark: user.remark || '' })}
                          className="btn btn-ghost btn-sm"
                          title="设置备注"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {nextOpenid && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => fetchUserList(nextOpenid)}
                className="btn btn-outline"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : null}
                加载更多
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 设置备注弹窗 */}
      {remarkModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">设置备注</h3>
            <div className="form-control mt-4">
              <input
                type="text"
                className="input input-bordered"
                placeholder="输入备注名"
                value={remarkModal.remark}
                onChange={(e) => setRemarkModal({ ...remarkModal, remark: e.target.value })}
              />
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setRemarkModal(null)}
                disabled={isSaving}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSetRemark}
                disabled={isSaving}
              >
                {isSaving && <span className="loading loading-spinner loading-sm"></span>}
                保存
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setRemarkModal(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
