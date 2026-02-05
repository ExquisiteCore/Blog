/**
 * JWT 认证工具函数
 */

// 刷新锁：防止并发刷新
let refreshPromise: Promise<string | null> | null = null;

/**
 * 解析 JWT payload（不验证签名，仅解码）
 */
function parseJwtPayload(token: string): { exp?: number; sub?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // base64url -> base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * 获取 token 的过期时间戳（秒）
 */
export function getTokenExpiry(token: string): number | null {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return null;
  }
  return payload.exp;
}

/**
 * 检查 JWT 是否已过期
 * @param token JWT 字符串
 * @param bufferSeconds 提前多少秒视为过期（默认60秒，留出刷新时间）
 */
export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  const exp = getTokenExpiry(token);
  if (exp === null) {
    return true; // 无法解析视为过期
  }
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + bufferSeconds;
}

/**
 * 清除认证信息并触发 storage 事件通知其他组件
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // 手动触发 storage 事件，让 Header 组件感知变化
  window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));
}

/**
 * 退出登录（调用服务端清除 cookie + 清除本地存储）
 */
export async function logout(): Promise<void> {
  try {
    const apiUrl =
      typeof window === 'undefined'
        ? process.env.INTERNAL_API_BASE_URL
        : process.env.NEXT_PUBLIC_API_BASE_URL;
    const baseURL = apiUrl || 'https://api.exquisitecore.xyz/api';

    await fetch(`${baseURL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // 让服务端清除 cookie
    });
  } catch {
    // 忽略网络错误
  }
  clearAuth();
}

/**
 * 尝试刷新 token（带锁，防止并发）
 * 调用 /auth/refresh，cookie 自动携带 refresh_token
 * @returns 新的 access token，刷新失败返回 null
 */
export async function tryRefreshToken(): Promise<string | null> {
  // 如果已经有刷新请求在进行，等待它完成
  if (refreshPromise) {
    return refreshPromise;
  }

  // 创建刷新 Promise
  refreshPromise = doRefreshToken();

  try {
    return await refreshPromise;
  } finally {
    // 刷新完成后清除锁
    refreshPromise = null;
  }
}

/**
 * 实际执行刷新 token 的逻辑
 */
async function doRefreshToken(): Promise<string | null> {
  try {
    const apiUrl =
      typeof window === 'undefined'
        ? process.env.INTERNAL_API_BASE_URL
        : process.env.NEXT_PUBLIC_API_BASE_URL;
    const baseURL = apiUrl || 'https://api.exquisitecore.xyz/api';

    const response = await fetch(`${baseURL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // 携带 cookie
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      // 只有认证相关错误才清除登录状态
      if (response.status === 401 || response.status === 403) {
        clearAuth();
      }
      // 其他错误（网络、500等）保留登录状态，下次再试
      return null;
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);

      // 如果 user 信息丢失，从 token payload 恢复基本信息
      if (!localStorage.getItem('user')) {
        const payload = parseJwtPayload(data.token);
        if (payload && payload.sub) {
          const basicUser = {
            id: payload.sub,
            username: (payload as { username?: string }).username || '',
            role: (payload as { role?: string }).role || 'user',
            email: '',
            display_name: null,
            avatar_url: null,
            bio: null,
            created_at: '',
            updated_at: '',
          };
          localStorage.setItem('user', JSON.stringify(basicUser));
        }
      }

      // 触发 storage 事件
      window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));
      return data.token;
    }
    // token 为空视为认证失败
    clearAuth();
    return null;
  } catch {
    // 网络错误不清除登录状态，保留重试机会
    return null;
  }
}
