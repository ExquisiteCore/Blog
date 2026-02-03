import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';

// 定义请求配置接口，扩展AxiosRequestConfig以支持可选的withToken参数
interface RequestConfig extends AxiosRequestConfig {
  withToken?: boolean; // 是否在请求中包含token
}

// 定义响应数据的通用接口
type ApiResponse<T = unknown> = T;

/**
 * HTTP请求类，封装axios实例
 * 支持Next.js环境下选择是否传入token
 */
class Http {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    // 默认 API URL（如果未设置环境变量）
    const defaultApiUrl = 'https://api.exquisitecore.xyz/api';
    let apiUrl: string | undefined;

    // Next.js 中通过 typeof window 判断是否为服务器端渲染
    if (typeof window === 'undefined') {
      // 服务器端渲染时，使用内部 Docker 网络地址
      apiUrl = process.env.INTERNAL_API_BASE_URL;
    } else {
      // 客户端渲染时，使用公共可访问地址
      apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    }

    this.baseURL = baseURL || apiUrl || defaultApiUrl;

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const requestConfig = config as RequestConfig;

        // 只有当withToken为true时才添加token
        if (requestConfig.withToken) {
          const token = this.getToken();
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response.data;
      },
      (error) => {
        // 处理错误响应
        if (error.response) {
          // 服务器返回了错误状态码
          const { status } = error.response;

          // 处理特定状态码
          if (status === 401) {
            // 未授权，可以在这里处理登出逻辑
            console.error('未授权访问，请重新登录');
          } else if (status === 403) {
            console.error('没有权限访问该资源');
          } else if (status === 404) {
            console.error('请求的资源不存在');
          } else if (status >= 500) {
            console.error('服务器错误，请稍后再试');
          }
        } else if (error.request) {
          // 请求已发送但没有收到响应
          console.error('网络错误，无法连接到服务器');
        } else {
          // 请求配置出错
          console.error('请求配置错误:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取存储的token
   * 在客户端从localStorage获取，在服务端返回null
   */
  private getToken(): string | null {
    // 检查是否在浏览器环境
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    // 在服务端渲染时返回null
    return null;
  }

  /**
   * 发送GET请求
   * @param url 请求地址
   * @param params 查询参数
   * @param config 请求配置，包含withToken选项
   */
  public async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.instance.get(url, { ...config, params });
  }

  /**
   * 发送POST请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 请求配置，包含withToken选项
   */
  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.instance.post(url, data, config);
  }

  /**
   * 发送PUT请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 请求配置，包含withToken选项
   */
  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.instance.put(url, data, config);
  }

  /**
   * 发送DELETE请求
   * @param url 请求地址
   * @param config 请求配置，包含withToken选项
   */
  public async delete<T = unknown>(
    url: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.instance.delete(url, config);
  }
}

// 创建默认实例
const http = new Http();

export default http;

// 导出类型和类，方便创建自定义实例
export { Http, type ApiResponse, type RequestConfig };
