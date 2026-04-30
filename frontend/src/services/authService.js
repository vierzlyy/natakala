import { apiGet, apiPost, clearToken, setToken } from './api';
import { getErrorMessage } from './serviceUtils';

const DEV_USER_KEY = 'natakala_dev_user';
const DEV_TOKEN = 'natakala-dev-token';

const localLoginEnabled = import.meta.env.VITE_ENABLE_LOCAL_LOGIN === 'true';
const localEmail = import.meta.env.VITE_LOCAL_ADMIN_EMAIL || 'admin@natakala.test';
const localPassword = import.meta.env.VITE_LOCAL_ADMIN_PASSWORD || 'password123';

const buildLocalUser = () => ({
  id: 1,
  name: 'Admin NataKala',
  email: localEmail,
  role: 'admin',
});

export const authService = {
  async login(payload) {
    const credentials = {
      email: String(payload?.email || '').trim(),
      password: String(payload?.password || ''),
    };

    try {
      const response = await apiPost('/login', credentials);
      const token = response?.token || response?.access_token;

      if (token) {
        setToken(token);
      }

      return response;
    } catch (error) {
      if (
        localLoginEnabled &&
        credentials.email === localEmail &&
        credentials.password === localPassword
      ) {
        const localUser = buildLocalUser();
        setToken(DEV_TOKEN);
        localStorage.setItem(DEV_USER_KEY, JSON.stringify(localUser));
        return {
          token: DEV_TOKEN,
          user: localUser,
          source: 'local',
        };
      }

      throw error;
    }
  },

  async logout() {
    try {
      if (getStoredLocalUser()) {
        localStorage.removeItem(DEV_USER_KEY);
        return;
      }

      await apiPost('/logout');
    } finally {
      localStorage.removeItem(DEV_USER_KEY);
      clearToken();
    }
  },

  async getUser() {
    const localUser = getStoredLocalUser();

    if (localUser) {
      return localUser;
    }

    const response = await apiGet('/user');
    return response?.data || response;
  },
};

function getStoredLocalUser() {
  const raw = localStorage.getItem(DEV_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(DEV_USER_KEY);
    return null;
  }
}

export { getErrorMessage };

export default authService;
