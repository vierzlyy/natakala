import { apiDownload, apiGet, apiPost, apiPut, apiUpload } from './api';
import {
  mockBackupSettings,
  mockGetSettings,
  mockRestoreSettings,
  mockUpdateSettings,
  shouldUseMock,
} from './mockBackend';

function resolveDownloadFilename(headers = {}, fallback = 'natakala-backup.json') {
  const disposition = headers['content-disposition'] || headers['Content-Disposition'] || '';
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  const filename = utfMatch?.[1] || plainMatch?.[1];

  return filename ? decodeURIComponent(filename) : fallback;
}

export const settingsService = {
  async get() {
    try {
      const response = await apiGet('/settings');
      return response?.data || response;
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetSettings();
        return response.data;
      }
      throw error;
    }
  },

  async update(payload) {
    try {
      const response = await apiPut('/settings', payload);
      return response?.data || response;
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockUpdateSettings(payload);
        return response.data;
      }
      throw error;
    }
  },

  async backup() {
    try {
      const response = await apiDownload('/settings/backup', {
        method: 'post',
        data: {},
      });
      return {
        blob: response.data,
        filename: resolveDownloadFilename(response.headers),
      };
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockBackupSettings();
        return {
          blob: response.data,
          filename: 'natakala-backup.json',
        };
      }
      throw error;
    }
  },

  async restore(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiUpload('/settings/restore', formData);
      return response?.data || response;
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockRestoreSettings(file);
        return response.data;
      }
      throw error;
    }
  },
};

export default settingsService;
