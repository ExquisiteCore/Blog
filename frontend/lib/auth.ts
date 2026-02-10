/**
 * JWT 认证工具函数
 *
 * 网关模式下，所有请求通过 Rust 网关
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
    return true;
  }
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + bufferSeconds;
}

/**
 * 获取 API base URL
 * - 客户端：相对路径 /api（走网关）
 * - 服务端 SSR：直连 Rust 网关
 */
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_BASE_URL || 'http://localhost:8080/api';
  }
  return '/api';
}

/**
 * 清除认证信息并触发 storage 事件通知其他组件
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));
}

/**
 * 退出登录（调用服务端清除 cookie + 清除本地存储）
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${getApiBaseUrl()}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
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
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doRefreshToken();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * 实际执行刷新 token 的逻辑
 */
async function doRefreshToken(): Promise<string | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuth();
      }
      return null;
    }

    const body = await response.json();
    // 后端响应为 { statusCode, data: { token } }
    const token = body?.data?.token || body?.token;
    if (token) {
      localStorage.setItem('token', token);

      if (!localStorage.getItem('user')) {
        const payload = parseJwtPayload(token);
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

      window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));
      return token;
    }
    clearAuth();
    return null;
  } catch {
    return null;
  }
}
