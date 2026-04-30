import { apiGet } from './api';
import { mockGetDashboard, shouldUseMock } from './mockBackend';

export const dashboardService = {
  async get() {
    try {
      const response = await apiGet('/dashboard');
      return response?.data || response;
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetDashboard();
        return response.data;
      }
      throw error;
    }
  },
};

export default dashboardService;
