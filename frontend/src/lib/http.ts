import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// 扩展AxiosRequestConfig接口，添加withToken字段
declare module "axios" {
  interface AxiosRequestConfig {
    withToken?: boolean;
  }
}

const BASE_API_URL = "http://localhost:8080/api";

// 创建axios实例
const http: AxiosInstance = axios.create({
  baseURL: BASE_API_URL,
  timeout: 10000, // 请求超时时间
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回响应数据
    return response.data;
  },
  (error: AxiosError) => {
    let errorMessage = "请求失败";

    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;

      if (status === 422) {
        errorMessage = "用户名或密码格式不正确";
      } else if (status === 401) {
        errorMessage = "未授权，请重新登录";
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
