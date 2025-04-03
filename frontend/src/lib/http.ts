import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { jwtDecode } from "jwt-decode";

// 扩展AxiosRequestConfig接口，添加withToken字段
declare module "axios" {
  interface AxiosRequestConfig {
    withToken?: boolean;
  }
}
const BASE_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// 创建axios实例
const http: AxiosInstance = axios.create({
  baseURL: BASE_API_URL,
  timeout: 10000, // 请求超时时间
  headers: {
    "Content-Type": "application/json",
  },
});

// 刷新token的函数
async function refreshToken(): Promise<string | null> {
  try {
    const authData = localStorage.getItem("auth");
    if (!authData) return null;

    const authObj = JSON.parse(authData);
    const oldToken = authObj.token;
    if (!oldToken) return null;

    // 调用刷新接口
    const response = await axios.post(
      `${BASE_API_URL}/auth/refresh`,
      {},
      {
        headers: { Authorization: `Bearer ${oldToken}` },
      }
    );

    // 更新本地存储的token
    const newToken = response.data.token;
    if (newToken) {
      const newAuthData = { ...authObj, token: newToken };
      localStorage.setItem("auth", JSON.stringify(newAuthData));
      return newToken;
    }
    return null;
  } catch (error) {
    console.error("刷新token失败:", error);
    return null;
  }
}

// 检查token是否需要刷新（过期前30分钟内）
function shouldRefreshToken(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    if (!decoded.exp) return false;

    // 获取当前时间戳（秒）
    const now = Math.floor(Date.now() / 1000);

    // 如果token将在30分钟内过期，则刷新
    return decoded.exp - now < 30 * 60 && decoded.exp > now;
  } catch (e) {
    console.error("解析token失败:", e);
    return false;
  }
}

// 请求拦截器
http.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 默认添加token，除非明确设置withToken为false
    const withToken = config.withToken !== false;

    // 只有当withToken为true且在浏览器环境中才尝试获取和添加token
    if (withToken && typeof window !== "undefined") {
      try {
        // 添加token等认证信息 - 仅在浏览器环境中执行
        const authData = localStorage.getItem("auth");
        if (authData) {
          const authObj = JSON.parse(authData);
          const token = authObj.token;

          if (token) {
            // 检查token是否即将过期
            if (shouldRefreshToken(token)) {
              // 如果请求不是刷新token的请求，则先刷新token
              if (!config.url?.includes("/auth/refresh")) {
                const newToken = await refreshToken();
                if (newToken) {
                  config.headers = config.headers || {};
                  config.headers["Authorization"] = `Bearer ${newToken}`;
                  return config;
                }
              }
            }

            config.headers = config.headers || {};
            config.headers["Authorization"] = `Bearer ${token}`;
          }
        }
      } catch (e) {
        console.error("处理认证信息失败:", e);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 检查token是否已过期但在刷新窗口内（过期后30分钟内）
function isTokenInRefreshWindow(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    if (!decoded.exp) return false;

    // 获取当前时间戳（秒）
    const now = Math.floor(Date.now() / 1000);

    // 如果token已过期但在刷新窗口内（过期后30分钟内）
    return decoded.exp < now && now - decoded.exp <= 30 * 60;
  } catch (e) {
    console.error("解析token失败:", e);
    return false;
  }
}

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回响应数据
    return response.data;
  },
  async (error: AxiosError) => {
    let errorMessage = "请求失败";

    // 保存原始请求配置，用于重试
    const originalRequest = error.config;

    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;

      // 处理401错误（未授权）
      if (
        status === 401 &&
        originalRequest &&
        !originalRequest.headers["X-Retry"]
      ) {
        try {
          // 获取当前token
          const authData = localStorage.getItem("auth");
          if (authData) {
            const authObj = JSON.parse(authData);
            const token = authObj.token;

            // 检查token是否在刷新窗口内
            if (token && isTokenInRefreshWindow(token)) {
              // 尝试刷新token
              const newToken = await refreshToken();

              if (newToken) {
                // 更新请求头中的token
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                // 标记该请求已经重试过，避免无限循环
                originalRequest.headers["X-Retry"] = "true";

                // 重新发送原始请求
                return http(originalRequest);
              }
            }
          }
        } catch (e) {
          console.error("处理token刷新失败:", e);
        }

        errorMessage = "未授权，请重新登录";
      } else if (status === 422) {
        errorMessage = "用户名或密码格式不正确";
      } else if (status === 403) {
        errorMessage = "拒绝访问";
      } else if (status === 404) {
        errorMessage = "请求的资源不存在";
      } else if (status === 500) {
        errorMessage = "服务器错误";
      }

      // 尝试从响应中获取错误信息
      try {
        const data = error.response.data as { message?: string };
        if (data && data.message) {
          errorMessage = data.message;
        }
      } catch (e) {
        console.error("解析错误响应失败:", e);
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      errorMessage = "网络错误，服务器无响应";
    } else {
      // 请求配置出错
      errorMessage = error.message || "请求配置错误";
    }

    return Promise.reject(new Error(errorMessage));
  }
);

// 封装GET请求
export const get = <T>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig
): Promise<T> => {
  return http.get(url, { params, ...config });
};

// 封装POST请求
export const post = <T>(
  url: string,
  data?: Record<string, unknown> | FormData | Blob | string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return http.post(url, data, config);
};

// 封装PUT请求
export const put = <T>(
  url: string,
  data?: Record<string, unknown> | FormData | Blob | string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return http.put(url, data, config);
};

// 封装DELETE请求
export const del = <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return http.delete(url, config);
};

// 导出axios实例
export default http;
