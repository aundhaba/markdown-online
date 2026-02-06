import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 定义返回数据的基本格式（根据你的后端接口调整）
interface Result<T = any> {
  code: number;
  message: string;
  data: T;
}

class Request {
  // axios 实例
  instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config);

    // 1. 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 在这里添加 token 等全局配置
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2. 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { data } = response;
        // 根据后端约定的状态码进行逻辑处理
        if (data.code !== 200) {
          console.error(data.message || '请求失败');
          return Promise.reject(new Error(data.message || 'Error'));
        }
        return data; // 直接返回数据部分
      },
      (error) => {
        // 统一处理 HTTP 错误（401, 404, 500等）
        return Promise.reject(error);
      }
    );
  }

  // 公共请求方法
  request<T = any>(config: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.request(config);
  }

  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.get(url, config);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.post(url, data, config);
  }
}

// 导出实例
const request = new Request({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

export default request;