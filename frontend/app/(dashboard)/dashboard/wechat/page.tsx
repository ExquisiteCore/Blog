'use client';

import Link from 'next/link';

const wechatModules = [
  {
    name: '粉丝管理',
    description: '查看和管理公众号粉丝，设置备注',
    href: '/dashboard/wechat/users',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: '粉丝标签',
    description: '创建和管理粉丝标签，为粉丝打标签',
    href: '/dashboard/wechat/tags',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    name: '菜单管理',
    description: '配置公众号自定义菜单',
    href: '/dashboard/wechat/menu',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  {
    name: '模板消息',
    description: '管理和发送模板消息',
    href: '/dashboard/wechat/templates',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function WechatPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">微信公众号管理</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wechatModules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="card-body">
              <div className="flex items-start gap-4">
                <div className="text-primary">{module.icon}</div>
                <div>
                  <h3 className="card-title text-lg">{module.name}</h3>
                  <p className="text-sm text-base-content/60 mt-1">
                    {module.description}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="alert alert-info">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-medium">提示</p>
          <p className="text-sm">
            微信公众号功能需要在后端配置 config.toml 中的 [wechat] 部分，
            包括 app_id、app_secret 和 token。
          </p>
        </div>
      </div>
    </div>
  );
}
