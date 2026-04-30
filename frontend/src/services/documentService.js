import { apiGet } from './api';
import {
  mockGetDigitalDocumentById,
  mockGetDigitalDocuments,
  shouldUseMock,
} from './mockBackend';
import { normalizeEntityResponse, normalizePaginatedCollectionResponse } from './serviceUtils';

export const documentService = {
  async getAll(params = {}) {
    try {
      const response = await apiGet('/documents', { params });
      return normalizePaginatedCollectionResponse(response, ['documents']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetDigitalDocuments(params);
        return normalizePaginatedCollectionResponse(response, ['documents']);
      }
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await apiGet(`/documents/${id}`);
      return normalizeEntityResponse(response, ['document']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetDigitalDocumentById(id);
        return normalizeEntityResponse(response, ['document']);
      }
      throw error;
    }
  },
};

export default documentService;
