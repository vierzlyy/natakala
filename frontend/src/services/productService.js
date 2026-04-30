import { apiDelete, apiGet, apiPost, apiUpload } from './api';
import {
  mockCreateProduct,
  mockDeleteProduct,
  mockGetProductById,
  mockGetProducts,
  mockUpdateProduct,
  shouldUseMock,
} from './mockBackend';
import { normalizeEntityResponse, normalizePaginatedCollectionResponse } from './serviceUtils';

export const productService = {
  async getAll(params = {}) {
    try {
      const response = await apiGet('/products', { params });
      return normalizePaginatedCollectionResponse(response, ['products']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetProducts(params);
        return normalizePaginatedCollectionResponse(response, ['products']);
      }
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await apiGet(`/products/${id}`);
      return normalizeEntityResponse(response, ['product']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetProductById(id);
        return normalizeEntityResponse(response, ['product']);
      }
      throw error;
    }
  },

  async getHistory(id) {
    try {
      const response = await apiGet(`/products/${id}/history`);
      return normalizeEntityResponse(response, ['history']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetProductById(id);
        return normalizeEntityResponse({ data: { stock_history: response.data?.stock_history || [] } }, ['history']);
      }
      throw error;
    }
  },

  async create(payload, isMultipart = false) {
    try {
      if (isMultipart) {
        const response = await apiUpload('/products', payload);
        return normalizeEntityResponse(response, ['product']);
      }

      const response = await apiPost('/products', payload);
      return normalizeEntityResponse(response, ['product']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockCreateProduct(payload);
        return normalizeEntityResponse(response, ['product']);
      }
      throw error;
    }
  },

  async update(id, payload, isMultipart = false) {
    try {
      if (isMultipart) {
        const response = await apiUpload(`/products/${id}?_method=PUT`, payload);
        return normalizeEntityResponse(response, ['product']);
      }

      const response = await apiPost(`/products/${id}?_method=PUT`, payload);
      return normalizeEntityResponse(response, ['product']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockUpdateProduct(id, payload);
        return normalizeEntityResponse(response, ['product']);
      }
      throw error;
    }
  },

  async remove(id) {
    try {
      return await apiDelete(`/products/${id}`);
    } catch (error) {
      if (shouldUseMock(error)) {
        return mockDeleteProduct(id);
      }
      throw error;
    }
  },
};

export default productService;
