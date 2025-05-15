import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

// 定义请求配置接口，扩展AxiosRequestConfig以支持可选的withToken参数
interface RequestConfig extends AxiosRequestConfig {
  withToken?: boolean; // 是否在请求中包含token
}

// 定义响应数据的通用接口
interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

/**
 * HTTP请求类，封装axios实例
 * 支持Astro按需渲染时选择是否传入token
 */
class Http {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = "http://121.62.28.11:8080/api") {
    this.baseURL = baseURL;
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
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
            config.headers["Authorization"] = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
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
            console.error("未授权访问，请重新登录");
          } else if (status === 403) {
            console.error("没有权限访问该资源");
          } else if (status === 404) {
            console.error("请求的资源不存在");
          } else if (status >= 500) {
            console.error("服务器错误，请稍后再试");
          }
        } else if (error.request) {
          // 请求已发送但没有收到响应
          console.error("网络错误，无法连接到服务器");
        } else {
          // 请求配置出错
          console.error("请求配置错误:", error.message);
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * 获取存储的token
   * 在客户端从localStorage获取，在服务端可能需要从其他地方获取
   */
  private getToken(): string | null {
    // 检查是否在浏览器环境
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
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
  public async get<T = any>(
    url: string,
    params?: any,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.instance.get(url, { ...config, params });
  }

  /**
   * 发送POST请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 请求配置，包含withToken选项
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.instance.post(url, data, config);
  }

  /**
   * 发送PUT请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 请求配置，包含withToken选项
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.instance.put(url, data, config);
  }

  /**
   * 发送DELETE请求
   * @param url 请求地址
   * @param config 请求配置，包含withToken选项
   */
  public async delete<T = any>(
    url: string,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.instance.delete(url, config);
  }
}

// 创建默认实例
const http = new Http();

export default http;

// 导出类型和类，方便创建自定义实例
export { Http, type ApiResponse, type RequestConfig };
