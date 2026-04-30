import axios from 'axios';

export const TOKEN_KEY = 'natakala_token';
export const DEV_TOKEN = 'natakala-dev-token';

const mockEnabled = import.meta.env.VITE_ENABLE_MOCK_API === 'true';
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '');

let unauthorizedHandler = null;

export const getApiBaseUrl = () => normalizedBaseUrl;
export const getApiUrl = (path = '') => `${normalizedBaseUrl}/api${path.startsWith('/') ? path : `/${path}`}`;

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const isLocalDevSession = () => mockEnabled && getToken() === DEV_TOKEN;

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const buildAuthHeaders = (headers = {}) => {
  const token = getToken();

  if (!token) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
};

export const normalizeApiError = (error) => {
  const response = error?.response;
  const data = response?.data || {};

  return {
    status: response?.status || null,
    message:
      data?.message ||
      data?.error ||
      error?.message ||
      'Terjadi kesalahan saat menghubungi server.',
    errors: data?.errors || null,
    data,
    original: error,
  };
};

const api = axios.create({
  baseURL: getApiUrl(''),
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !isLocalDevSession()) {
      clearToken();

      if (unauthorizedHandler) {
        unauthorizedHandler();
      } else if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

const unwrapResponse = async (requestPromise) => {
  const response = await requestPromise;
  return response.data;
};

export const apiRequest = (config) => unwrapResponse(api(config));
export const apiGet = (url, config = {}) => unwrapResponse(api.get(url, config));
export const apiPost = (url, data = {}, config = {}) => unwrapResponse(api.post(url, data, config));
export const apiPut = (url, data = {}, config = {}) => unwrapResponse(api.put(url, data, config));
export const apiPatch = (url, data = {}, config = {}) => unwrapResponse(api.patch(url, data, config));
export const apiDelete = (url, config = {}) => unwrapResponse(api.delete(url, config));

export const apiUpload = (url, formData, config = {}) =>
  unwrapResponse(
    api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(config.headers || {}),
      },
    }),
  );

export const apiDownload = async (url, config = {}) =>
  api.request({
    url,
    method: config.method || 'get',
    ...config,
    responseType: 'blob',
  });

export default api;
