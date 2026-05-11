import { apiDownload, apiGet } from './api';
import { mockBuildReportExport, mockGetReport, shouldUseMock } from './mockBackend';
import { createExcelExport, createPdfExport } from '../utils/reportExport';

const reportMap = {
  stock: '/reports/stock',
  transactionsIn: '/reports/transactions-in',
  returns: '/reports/returns',
  transactionsOut: '/reports/transactions-out',
  bestSeller: '/reports/best-seller',
  inventoryValue: '/reports/inventory-value',
  mutasi: '/reports/mutasi',
  opname: '/reports/opname',
};

export const reportService = {
  async getReport(type, params = {}) {
    const endpoint = reportMap[type] || reportMap.stock;
    try {
      return await apiGet(endpoint, { params });
    } catch (error) {
      if (shouldUseMock(error)) {
        return mockGetReport(type, params);
      }
      throw error;
    }
  },

  async exportPdf(params = {}) {
    try {
      const response = await apiDownload('/reports/export/pdf', {
        params,
      });
      const contentType = response?.headers?.['content-type'] || '';

      if (contentType.includes('application/pdf')) {
        return {
          mode: 'download',
          blob: response.data,
          filename: `laporan-${params.type || 'report'}.pdf`,
        };
      }

      if (contentType.includes('text/html')) {
        const html = await response.data.text();
        return {
          mode: 'print',
          html,
        };
      }

      throw new Error('Backend PDF export belum mengirim format yang bisa dipakai.');
    } catch (error) {
      if (shouldUseMock(error)) {
        const report = await mockBuildReportExport(params.type, params);
        return createPdfExport(params.type, report, params);
      }
      throw error;
    }
  },

  async exportExcel(params = {}) {
    try {
      const response = await apiDownload('/reports/export/excel', {
        params,
      });
      const contentType = response?.headers?.['content-type'] || '';

      if (
        contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
        contentType.includes('application/vnd.ms-excel')
      ) {
        return {
          mode: 'download',
          blob: response.data,
          filename: `laporan-${params.type || 'report'}.xlsx`,
        };
      }

      if (contentType.includes('text/csv')) {
        return {
          mode: 'download',
          blob: response.data,
          filename: `laporan-${params.type || 'report'}.csv`,
        };
      }

      throw new Error('Backend Excel export belum mengirim format yang bisa dipakai.');
    } catch (error) {
      if (shouldUseMock(error)) {
        const report = await mockBuildReportExport(params.type, params);
        return createExcelExport(params.type, report);
      }
      throw error;
    }
  },
};

export default reportService;
