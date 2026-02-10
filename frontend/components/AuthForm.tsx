'use client';

import { useState } from 'react';
import http from '@/lib/axios';
import type { LoginResponse, User } from '@/types/api';

type FormType = 'login' | 'register';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  avatar_url: string;
}

interface FormErrors {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  avatar_url: string;
}

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState<FormType>('login');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    avatar_url: '',
  });
  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    avatar_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    let isValid = true;
    const newErrors: FormErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      avatar_url: '',
    };

    // 验证邮箱
    if (!formData.email) {
      newErrors.email = '请输入邮箱';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
      isValid = false;
    }

    // 验证密码
    if (!formData.password) {
      newErrors.password = '请输入密码';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度至少为6位';
      isValid = false;
    }

    // 如果是注册表单，验证确认密码、用户名和头像URL
    if (activeTab === 'register') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = '请确认密码';
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致';
        isValid = false;
      }

      if (!formData.username) {
        newErrors.username = '请输入用户名';
        isValid = false;
      }

      // 验证头像URL（可选，但如果提供则必须是有效的URL）
      if (formData.avatar_url && !/^https?:\/\/.+/.test(formData.avatar_url)) {
        newErrors.avatar_url = '请输入有效的URL地址';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');

    try {
      if (activeTab === 'login') {
        // 登录请求（需要 credentials 以接收 Set-Cookie）
        const data = await http.post<LoginResponse>('/users/login', {
          username_or_email: formData.email,
          password: formData.password,
        }, { withCredentials: true });
        // 登录成功后存储 access token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // 重定向到首页
        window.location.href = '/';
      } else {
        // 注册请求
        await http.post<User>('/users/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          avatar_url: formData.avatar_url || undefined,
        });
        // 注册成功后切换到登录页
        setActiveTab('login');
        // 重置表单，保留邮箱
        setFormData({
          email: formData.email,
          password: '',
          confirmPassword: '',
          username: '',
          avatar_url: '',
        });
      }
    } catch (error: unknown) {
      console.error('提交表单出错:', error);
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('请求失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="card mx-auto w-full max-w-md bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="tabs tabs-boxed mb-4">
          <a
            className={`tab ${activeTab === 'login' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            登录
          </a>
          <a
            className={`tab ${activeTab === 'register' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            注册
          </a>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'register' && (
            <>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">用户名</span>
                </label>
                <input
                  type="text"
                  placeholder="请输入用户名"
                  className={`input input-bordered w-full ${errors.username ? 'input-error' : ''}`}
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt text-error">{errors.username}</span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">头像URL</span>
                </label>
                <input
                  type="text"
                  placeholder="请输入头像URL地址"
                  className={`input input-bordered w-full ${errors.avatar_url ? 'input-error' : ''}`}
                  value={formData.avatar_url}
                  onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt text-error">{errors.avatar_url}</span>
                </label>
              </div>
            </>
          )}

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">邮箱</span>
            </label>
            <input
              type="email"
              placeholder="请输入邮箱"
              className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            <label className="label">
              <span className="label-text-alt text-error">{errors.email}</span>
            </label>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">密码</span>
            </label>
            <input
              type="password"
              placeholder="请输入密码"
              className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />
            <label className="label">
              <span className="label-text-alt text-error">{errors.password}</span>
            </label>
          </div>

          {activeTab === 'register' && (
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">确认密码</span>
              </label>
              <input
                type="password"
                placeholder="请再次输入密码"
                className={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt text-error">{errors.confirmPassword}</span>
              </label>
            </div>
          )}

          {apiError && (
            <div className="alert alert-error mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          <div className="form-control mt-6">
            <button
              type="submit"
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner"></span>
              ) : activeTab === 'login' ? (
                '登录'
              ) : (
                '注册'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
