import { createSignal, Show } from 'solid-js';
import { createStore } from 'solid-js/store';

type FormType = 'login' | 'register';

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
  username?: string;
}

export default function AuthForm() {
  const [activeTab, setActiveTab] = createSignal<FormType>('login');
  const [formData, setFormData] = createStore<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [errors, setErrors] = createStore({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [isLoading, setIsLoading] = createSignal(false);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      username: ''
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

    // 如果是注册表单，验证确认密码和用户名
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
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // 这里添加实际的登录/注册逻辑
      // 例如使用 fetch 或 axios 发送请求到后端
      console.log('提交表单数据:', formData);

      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 成功后的处理
      if (activeTab() === 'login') {
        // 登录成功后的处理，例如重定向到首页
        window.location.href = '/';
      } else {
        // 注册成功后的处理，例如显示成功消息或自动登录
        setActiveTab('login');
        // 重置表单
        setFormData({
          email: formData.email,
          password: '',
          confirmPassword: '',
          username: ''
        });
      }
    } catch (error) {
      console.error('提交表单出错:', error);
      // 处理错误，例如显示错误消息
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="card w-full max-w-md bg-base-100 shadow-xl mx-auto">
      <div class="card-body">
        <div class="tabs tabs-boxed mb-4">
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
                class={`input input-bordered w-full ${errors.username ? 'input-error' : ''}`}
                value={formData.username || ''}
                onInput={(e) => setFormData('username', e.currentTarget.value)}
              />
              <label class="label">
                <span class="label-text-alt text-error">{errors.username}</span>
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
              class={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
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
              class={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
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
                class={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                value={formData.confirmPassword || ''}
                onInput={(e) => setFormData('confirmPassword', e.currentTarget.value)}
              />
              <label class="label">
                <span class="label-text-alt text-error">{errors.confirmPassword}</span>
              </label>
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