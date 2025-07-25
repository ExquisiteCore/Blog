import { createSignal, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import http from '../../lib/axios';

type FormType = 'login' | 'register';

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
  username?: string;
  avatar_url?: string;
}

export default function AuthForm() {
  const [activeTab, setActiveTab] = createSignal<FormType>('login');
  const [formData, setFormData] = createStore<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    avatar_url: '',
  });
  const [errors, setErrors] = createStore({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    avatar_url: '',
  });
  const [isLoading, setIsLoading] = createSignal(false);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
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
    if (activeTab() === 'register') {
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

  // 添加错误消息状态
  const [apiError, setApiError] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');

    try {
      let data;

      if (activeTab() === 'login') {
        // 登录请求
        data = await http.post('/users/login', {
          username_or_email: formData.email, // 支持用户名或邮箱登录
          password: formData.password,
        });
      } else {
        // 注册请求
        data = await http.post('/users/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          avatar_url: formData.avatar_url,
        });
      }

      // 成功后的处理
      if (activeTab() === 'login') {
        // 登录成功后存储JWT令牌
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // 重定向到首页
        window.location.href = '/';
      } else {
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
    } catch (error) {
      console.error('提交表单出错:', error);
      // 处理axios错误响应
      if ((error as any).response && (error as any).response.data) {
        // 服务器返回了错误信息
        setApiError((error as any).response.data.message || '请求失败');
      } else {
        // 其他类型的错误
        setApiError(
          error instanceof Error ? error.message : '请求失败，请稍后重试'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="card mx-auto w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="tabs-boxed mb-4 tabs">
          <a
            class={`tab ${activeTab() === 'login' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            登录
          </a>
          <a
            class={`tab ${activeTab() === 'register' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            注册
          </a>
        </div>

        <form onSubmit={handleSubmit}>
          <Show when={activeTab() === 'register'}>
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">用户名</span>
              </label>
              <input
                type="text"
                placeholder="请输入用户名"
                class={`input-bordered input w-full ${errors.username ? 'input-error' : ''}`}
                value={formData.username || ''}
                onInput={(e) => setFormData('username', e.currentTarget.value)}
              />
              <label class="label">
                <span class="label-text-alt text-error">{errors.username}</span>
              </label>
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">头像URL</span>
              </label>
              <input
                type="text"
                placeholder="请输入头像URL地址"
                class={`input-bordered input w-full ${errors.avatar_url ? 'input-error' : ''}`}
                value={formData.avatar_url || ''}
                onInput={(e) =>
                  setFormData('avatar_url', e.currentTarget.value)
                }
              />
              <label class="label">
                <span class="label-text-alt text-error">
                  {errors.avatar_url}
                </span>
              </label>
            </div>
          </Show>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">邮箱</span>
            </label>
            <input
              type="email"
              placeholder="请输入邮箱"
              class={`input-bordered input w-full ${errors.email ? 'input-error' : ''}`}
              value={formData.email}
              onInput={(e) => setFormData('email', e.currentTarget.value)}
            />
            <label class="label">
              <span class="label-text-alt text-error">{errors.email}</span>
            </label>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">密码</span>
            </label>
            <input
              type="password"
              placeholder="请输入密码"
              class={`input-bordered input w-full ${errors.password ? 'input-error' : ''}`}
              value={formData.password}
              onInput={(e) => setFormData('password', e.currentTarget.value)}
            />
            <label class="label">
              <span class="label-text-alt text-error">{errors.password}</span>
            </label>
          </div>

          <Show when={activeTab() === 'register'}>
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">确认密码</span>
              </label>
              <input
                type="password"
                placeholder="请再次输入密码"
                class={`input-bordered input w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                value={formData.confirmPassword || ''}
                onInput={(e) =>
                  setFormData('confirmPassword', e.currentTarget.value)
                }
              />
              <label class="label">
                <span class="label-text-alt text-error">
                  {errors.confirmPassword}
                </span>
              </label>
            </div>
          </Show>

          <Show when={apiError()}>
            <div class="mt-4 alert alert-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{apiError()}</span>
            </div>
          </Show>

          <div class="form-control mt-6">
            <button
              type="submit"
              class={`btn btn-primary ${isLoading() ? 'loading' : ''}`}
              disabled={isLoading()}
            >
              {activeTab() === 'login' ? '登录' : '注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
