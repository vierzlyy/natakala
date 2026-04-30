import { apiDelete, apiGet, apiPost, apiPut } from './api';
import {
  mockCreateSupplier,
  mockDeleteSupplier,
  mockGetSuppliers,
  mockUpdateSupplier,
  shouldUseMock,
} from './mockBackend';
import { normalizeCollectionResponse, normalizeEntityResponse } from './serviceUtils';

export const supplierService = {
  async getAll(params = {}) {
    try {
      const response = await apiGet('/suppliers', { params });
      return normalizeCollectionResponse(response, ['suppliers']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetSuppliers(params);
        return normalizeCollectionResponse(response, ['suppliers']);
      }
      throw error;
    }
  },

  async create(payload) {
    try {
      const response = await apiPost('/suppliers', payload);
      return normalizeEntityResponse(response, ['supplier']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockCreateSupplier(payload);
        return normalizeEntityResponse(response, ['supplier']);
      }
      throw error;
    }
  },

  async update(id, payload) {
    try {
      const response = await apiPut(`/suppliers/${id}`, payload);
      return normalizeEntityResponse(response, ['supplier']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockUpdateSupplier(id, payload);
        return normalizeEntityResponse(response, ['supplier']);
      }
      throw error;
    }
  },

  async remove(id) {
    try {
      return await apiDelete(`/suppliers/${id}`);
    } catch (error) {
      if (shouldUseMock(error)) {
        return mockDeleteSupplier(id);
      }
      throw error;
    }
  },
};

export default supplierService;
