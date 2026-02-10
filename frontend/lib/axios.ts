import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { isTokenExpired, tryRefreshToken, clearAuth } from './auth';

interface RequestConfig extends AxiosRequestConfig {
  withToken?: boolean;
  _retry?: boolean;
}

/**
 * HTTP 请求类，封装 axios 实例
 *
 * 网关模式：所有请求通过 Rust 网关
 * - 客户端：相对路径 /api（浏览器发到同源 Rust 网关）
 * - 服务端 SSR：http://localhost:8080/api（直连网关）
 */
class Http {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    if (baseURL) {
      this.baseURL = baseURL;
    } else if (typeof window === 'undefined') {
      // SSR：直连 Rust 网关
      this.baseURL = process.env.INTERNAL_API_BASE_URL || 'http://localhost:8080/api';
    } else {
      // 客户端：相对路径，自动走同源网关
      this.baseURL = '/api';
    }

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      async (config) => {
        const requestConfig = config as RequestConfig & InternalAxiosRequestConfig;

        if (requestConfig.withToken) {
          let token = this.getToken();
          if (token) {
            if (isTokenExpired(token)) {
              const newToken = await tryRefreshToken();
              if (newToken) {
                token = newToken;
              } else {
                return config;
              }
            }
            config.headers['Authorization'] = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器：解包 ApiResponse
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 后端统一包装为 { statusCode, data, message }
        // 解包返回 data 字段的内容
        const body = response.data;
        if (body && typeof body === 'object' && 'statusCode' in body) {
          return body.data;
        }
        // 兼容：非标准响应直接返回
        return body;
      },
      async (error) => {
        const originalRequest = error.config as RequestConfig & InternalAxiosRequestConfig;

        if (error.response) {
          const { status, data } = error.response;

          // 处理 401：尝试刷新 token 后重试
          if (status === 401 && originalRequest.withToken && !originalRequest._retry) {
            originalRequest._retry = true;
            const newToken = await tryRefreshToken();
            if (newToken) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return this.instance(originalRequest);
            }
            clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth';
            }
          }

          // 从 ApiResponse 中提取错误信息
          const message = data?.message || `请求失败 (${status})`;
          const apiError = new Error(message);
          (apiError as unknown as Record<string, unknown>).statusCode = status;
          (apiError as unknown as Record<string, unknown>).response = error.response;
          return Promise.reject(apiError);
        } else if (error.request) {
          return Promise.reject(new Error('网络错误，无法连接到服务器'));
        }

        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  public async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.instance.get(url, { ...config, params });
  }

  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.instance.post(url, data, config);
  }

  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.instance.put(url, data, config);
  }

  public async delete<T = unknown>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.instance.delete(url, config);
  }
}

const http = new Http();

export default http;

export { Http, type RequestConfig };
