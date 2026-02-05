import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// 可根据实际情况设置 baseURL
const instance = axios.create({
  baseURL: '',
  timeout: 5000,
});

// 请求拦截器：自动携带 token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {} as import('axios').AxiosRequestHeaders;
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理错误和数据格式
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 可根据后端约定统一处理
    if (response.data && response.data.code && response.data.code !== 0) {
      return Promise.reject(response.data);
    }
    return response.data;
  },
  (error) => {
    // 可根据实际情况扩展
    return Promise.reject(error);
  }
);

// 通用请求方法，支持泛型
const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config);
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config);
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config);
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config);
  },
  // 可扩展更多方法
};

export default request;