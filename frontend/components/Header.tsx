'use client';

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ScrollHeader from './ScrollHeader';
import ThemeToggle from './ThemeToggle';
import type { User } from '@/types/api';

// 定义导航菜单项
const navItems = [
  { path: '/', name: '首页', isActive: (path: string) => path === '/' },
  {
    path: '/blog',
    name: '博客',
    isActive: (path: string) => path.startsWith('/blog'),
  },
  {
    path: '/about',
    name: '关于我',
    isActive: (path: string) => path.startsWith('/about'),
  },
  {
    path: '/projects',
    name: '项目',
    isActive: (path: string) => path.startsWith('/projects'),
  },
  {
    path: '/tools',
    name: '精致的工具箱',
    isActive: (path: string) => path.startsWith('/tools'),
  },
];

// Helper function to determine tab classes
const getTabClass = (isActive: boolean) => {
  return isActive ? 'tab tab-active' : 'tab';
};

interface AuthState {
  isLoggedIn: boolean;
  userData: User | null;
}

// 缓存 snapshot，避免每次返回新对象导致无限循环
let cachedAuthState: AuthState = { isLoggedIn: false, userData: null };

// 从 localStorage 读取认证状态
function getAuthSnapshot(): AuthState {
  if (typeof window === 'undefined') {
    return cachedAuthState;
  }

  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (token && user) {
    try {
      const userData = JSON.parse(user) as User;
      // 只有当状态真正变化时才更新缓存
      if (!cachedAuthState.isLoggedIn || cachedAuthState.userData?.id !== userData.id) {
        cachedAuthState = { isLoggedIn: true, userData };
      }
      return cachedAuthState;
    } catch {
      if (cachedAuthState.isLoggedIn) {
        cachedAuthState = { isLoggedIn: false, userData: null };
      }
      return cachedAuthState;
    }
  }

  if (cachedAuthState.isLoggedIn) {
    cachedAuthState = { isLoggedIn: false, userData: null };
  }
  return cachedAuthState;
}

const serverSnapshot: AuthState = { isLoggedIn: false, userData: null };
function getServerSnapshot(): AuthState {
  return serverSnapshot;
}

// 订阅存储变化
function subscribeToAuth(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export default function Header() {
  const pathname = usePathname();
  const authState = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getServerSnapshot
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const { isLoggedIn, userData } = authState;

  return (
    <ScrollHeader>
      <div className="navbar container mx-auto px-4 h-16">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={
                      item.isActive(pathname)
                        ? 'font-bold text-primary'
                        : ''
                    }
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Link href="/" className="btn btn-ghost text-xl">
            <span className="font-bold transition-all">ExquisiteCore</span>
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <div role="tablist" className="tabs tabs-bordered">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                role="tab"
                className={getTabClass(item.isActive(pathname))}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="navbar-end">
          <ThemeToggle />

          {/* 登录按钮 (默认显示) */}
          {!isLoggedIn && (
            <Link href="/auth" className="btn btn-primary ml-2">
              登录
            </Link>
          )}

          {/* 用户头像和下拉菜单 (登录后显示) */}
          {isLoggedIn && (
            <div className="dropdown dropdown-end ml-2">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-10 rounded-full">
                  <img
                    alt="用户头像"
                    src={userData?.avatar_url || '/user-svgrepo-com.svg'}
                  />
                </div>
              </div>
              <ul
                tabIndex={0}
                className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
              >
                <li>
                  <a className="justify-between">
                    <span>{userData?.username || '用户名'}</span>
                    <span className="badge">个人资料</span>
                  </a>
                </li>
                {userData?.role === 'admin' && (
                  <li>
                    <Link href="/dashboard">控制面板</Link>
                  </li>
                )}
                <li>
                  <button onClick={handleLogout}>退出登录</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </ScrollHeader>
  );
}
