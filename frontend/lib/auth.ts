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
      clearAuth();
      return null;
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      // 触发 storage 事件
      window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));
      return data.token;
    }
    clearAuth();
    return null;
  } catch {
    clearAuth();
    return null;
  }
}

// ============ 定时检查机制 ============

type AuthCheckCallback = () => void;
let checkTimer: ReturnType<typeof setTimeout> | null = null;
let authCheckCallback: AuthCheckCallback | null = null;

/**
 * 启动 token 过期定时检查
 * 在 token 过期时自动触发回调
 */
export function startTokenExpiryWatch(callback: AuthCheckCallback): void {
  authCheckCallback = callback;
  scheduleNextCheck();
}

/**
 * 停止定时检查
 */
export function stopTokenExpiryWatch(): void {
  if (checkTimer) {
    clearTimeout(checkTimer);
    checkTimer = null;
  }
  authCheckCallback = null;
}

/**
 * 安排下一次检查
 */
function scheduleNextCheck(): void {
  if (checkTimer) {
    clearTimeout(checkTimer);
  }

  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('token');
  if (!token) return;

  const exp = getTokenExpiry(token);
  if (!exp) return;

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = exp - now;

  if (timeUntilExpiry <= 0) {
    // 已过期，立即触发
    authCheckCallback?.();
    return;
  }

  // 设置定时器，在过期时触发检查
  // 最多等待 60 秒（避免 setTimeout 溢出问题，也保证定期检查）
  const delay = Math.min(timeUntilExpiry, 60) * 1000;

  checkTimer = setTimeout(() => {
    const currentToken = localStorage.getItem('token');
    if (currentToken && isTokenExpired(currentToken, 0)) {
      clearAuth();
      authCheckCallback?.();
    } else {
      // 还没过期，安排下一次检查
      scheduleNextCheck();
    }
  }, delay);
}
