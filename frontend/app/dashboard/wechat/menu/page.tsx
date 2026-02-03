'use client';

import { useState, useEffect } from 'react';
import http from '@/lib/axios';

interface MenuButton {
  type?: string;
  name: string;
  key?: string;
  url?: string;
  sub_button?: MenuButton[];
}

interface Menu {
  button: MenuButton[];
}

export default function WechatMenuPage() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  const fetchMenu = async () => {
    try {
      const data = await http.get<{ menu?: Menu }>('/wechat/menu', {}, { withToken: true });
      if (data?.menu) {
        setMenu(data.menu);
        setJsonInput(JSON.stringify(data.menu, null, 2));
      } else {
        setMenu(null);
        setJsonInput('');
      }
    } catch (err) {
      console.error('获取菜单失败:', err);
      setError('获取菜单失败，请检查微信配置');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const menuData = JSON.parse(jsonInput);
      await http.post('/wechat/menu', menuData, { withToken: true });
      alert('菜单保存成功');
      fetchMenu();
    } catch (err) {
      console.error('保存菜单失败:', err);
      if (err instanceof SyntaxError) {
        alert('JSON 格式错误，请检查');
      } else {
        alert('保存失败，请重试');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除当前菜单吗？')) return;

    setIsDeleting(true);
    try {
      await http.delete('/wechat/menu', { withToken: true });
      setMenu(null);
      setJsonInput('');
      alert('菜单已删除');
    } catch (err) {
      console.error('删除菜单失败:', err);
      alert('删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  const menuTemplate = {
    button: [
      {
        name: '菜单1',
        sub_button: [
          { type: 'view', name: '子菜单1', url: 'https://example.com' },
          { type: 'click', name: '子菜单2', key: 'key1' },
        ],
      },
      {
        type: 'view',
        name: '菜单2',
        url: 'https://example.com',
      },
    ],
  };

  const loadTemplate = () => {
    setJsonInput(JSON.stringify(menuTemplate, null, 2));
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
        <h2 className="text-2xl font-bold">菜单管理</h2>
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
        <h2 className="text-2xl font-bold">菜单管理</h2>
        <div className="flex gap-2">
          <button onClick={loadTemplate} className="btn btn-outline btn-sm">
            加载模板
          </button>
          {menu && (
            <button
              onClick={handleDelete}
              className="btn btn-error btn-sm"
              disabled={isDeleting}
            >
              {isDeleting && <span className="loading loading-spinner loading-sm"></span>}
              删除菜单
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 编辑区 */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-lg">菜单配置 (JSON)</h3>
            <textarea
              className="textarea textarea-bordered font-mono text-sm h-96"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="输入菜单 JSON 配置..."
            />
            <div className="card-actions justify-end mt-4">
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={isSaving || !jsonInput.trim()}
              >
                {isSaving && <span className="loading loading-spinner loading-sm"></span>}
                保存菜单
              </button>
            </div>
          </div>
        </div>

        {/* 预览区 */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-lg">当前菜单预览</h3>
            {menu?.button && menu.button.length > 0 ? (
              <div className="bg-base-200 rounded-lg p-4">
                <div className="flex justify-around border-t border-base-300 pt-4">
                  {menu.button.map((btn, i) => (
                    <div key={i} className="text-center">
                      <div className="font-medium text-sm">{btn.name}</div>
                      {btn.sub_button && btn.sub_button.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {btn.sub_button.map((sub, j) => (
                            <div
                              key={j}
                              className="text-xs text-base-content/60 bg-base-100 rounded px-2 py-1"
                            >
                              {sub.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-base-content/50 py-8">
                暂无菜单配置
              </div>
            )}

            <div className="mt-4">
              <h4 className="font-medium text-sm mb-2">菜单类型说明：</h4>
              <ul className="text-xs text-base-content/60 space-y-1">
                <li><code className="bg-base-200 px-1">view</code> - 跳转 URL</li>
                <li><code className="bg-base-200 px-1">click</code> - 点击推事件</li>
                <li><code className="bg-base-200 px-1">miniprogram</code> - 小程序</li>
                <li><code className="bg-base-200 px-1">scancode_push</code> - 扫码推事件</li>
                <li><code className="bg-base-200 px-1">pic_sysphoto</code> - 拍照发图</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
