import { apiDelete, apiGet, apiPost, apiPut } from './api';
import {
  mockCreateCategory,
  mockDeleteCategory,
  mockGetCategories,
  mockUpdateCategory,
  shouldUseMock,
} from './mockBackend';
import { normalizeCollectionResponse, normalizeEntityResponse } from './serviceUtils';

export const categoryService = {
  async getAll(params = {}) {
    try {
      const response = await apiGet('/categories', { params });
      return normalizeCollectionResponse(response, ['categories']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetCategories(params);
        return normalizeCollectionResponse(response, ['categories']);
      }
      throw error;
    }
  },

  async create(payload) {
    try {
      const response = await apiPost('/categories', payload);
      return normalizeEntityResponse(response, ['category']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockCreateCategory(payload);
        return normalizeEntityResponse(response, ['category']);
      }
      throw error;
    }
  },

  async update(id, payload) {
    try {
      const response = await apiPut(`/categories/${id}`, payload);
      return normalizeEntityResponse(response, ['category']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockUpdateCategory(id, payload);
        return normalizeEntityResponse(response, ['category']);
      }
      throw error;
    }
  },

  async remove(id) {
    try {
      return await apiDelete(`/categories/${id}`);
    } catch (error) {
      if (shouldUseMock(error)) {
        return mockDeleteCategory(id);
      }
      throw error;
    }
  },
};

export default categoryService;
