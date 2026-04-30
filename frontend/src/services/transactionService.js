import { apiDelete, apiGet, apiPost, apiUpload } from './api';
import {
  mockAdjustStockOpname,
  mockCreateTransactionIn,
  mockCreateTransactionOut,
  mockDeleteTransactionIn,
  mockDeleteTransactionOut,
  mockFinalizeStockOpname,
  mockGetStockOpname,
  mockGetTransactionsIn,
  mockGetTransactionsOut,
  mockImportStockOpnameCsv,
  mockPauseStockOpname,
  mockResumeStockOpname,
  mockScanStockOpname,
  mockStartStockOpname,
  shouldUseMock,
} from './mockBackend';
import { normalizeCollectionResponse, normalizeEntityResponse } from './serviceUtils';

const INBOUND_META_MARKER = '[NATAKALA_INBOUND_META]';

function encodeInboundMetadata(payload = {}) {
  const metadata = {
    inbound_status: payload.inbound_status || payload.status || 'Barang Baru',
    items: (payload.items || []).map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name || item.name || item.product,
      sku: item.sku || item.product_sku,
      barcode: item.barcode,
      color: item.color || item.product_color,
      product_color: item.product_color || item.color,
      size: item.size || item.product_size,
      quantity: item.quantity,
      purchase_price: item.purchase_price,
      condition_status: item.condition_status || item.condition || 'Layak',
      condition_note: item.condition_note || '',
    })),
  };

  return `${INBOUND_META_MARKER}${JSON.stringify(metadata)}`;
}

function splitNotesAndMetadata(notes = '') {
  const text = String(notes || '');
  const markerIndex = text.indexOf(INBOUND_META_MARKER);

  if (markerIndex < 0) {
    return { notes: text, metadata: null };
  }

  const visibleNotes = text.slice(0, markerIndex).trim();
  const rawMetadata = text.slice(markerIndex + INBOUND_META_MARKER.length).trim();

  try {
    return {
      notes: visibleNotes,
      metadata: JSON.parse(rawMetadata),
    };
  } catch {
    return { notes: visibleNotes, metadata: null };
  }
}

function prepareTransactionInPayload(payload = {}) {
  const metadataNote = encodeInboundMetadata(payload);
  const notes = [payload.notes || '', metadataNote].filter(Boolean).join('\n\n');

  return {
    ...payload,
    notes,
    status: payload.status || payload.inbound_status,
    inbound_status: payload.inbound_status || payload.status,
    items: (payload.items || []).map((item) => ({
      ...item,
      condition: item.condition || item.condition_status,
      condition_status: item.condition_status || item.condition,
      condition_note: item.condition_note || '',
    })),
  };
}

function prepareTransactionOutPayload(payload = {}) {
  return {
    ...payload,
    items: (payload.items || []).map((item) => ({
      ...item,
      product_id: item.product_id,
      productId: item.productId || item.product_id,
      product_name: item.product_name || item.name || item.product,
      productName: item.productName || item.product_name || item.name || item.product,
      product_sku: item.product_sku || item.sku,
      sku: item.sku || item.product_sku,
      product_color: item.product_color || item.color || item.colour || item.variant_color,
      color: item.color || item.product_color || item.colour || item.variant_color,
      colour: item.colour || item.color || item.product_color || item.variant_color,
      variant_color: item.variant_color || item.color || item.product_color || item.colour,
      product_size: item.product_size || item.size || item.variant_size,
      size: item.size || item.product_size || item.variant_size,
      variant_size: item.variant_size || item.size || item.product_size,
      qty: item.qty || item.quantity,
      quantity: item.quantity || item.qty,
      out_method: item.out_method || item.method,
      method: item.method || item.out_method,
    })),
  };
}

function asArray(...values) {
  const value = values.find((entry) => Array.isArray(entry));
  return value || [];
}

function normalizeTransactionItem(item = {}) {
  const product = item.product || item.product_detail || {};
  const variant = item.variant || item.product_variant || {};
  const sizeQuantities = item.size_quantities || item.sizeQuantities || item.size_qty || null;
  const quantity = item.quantity ?? item.qty ?? item.total_quantity ?? item.total_items ?? 0;
  const purchasePrice = item.purchase_price ?? item.purchasePrice ?? item.buy_price ?? item.price ?? 0;

  return {
    ...item,
    product_id: item.product_id ?? item.productId ?? product.id,
    product_name: item.product_name ?? item.productName ?? item.name ?? product.name,
    sku: item.sku ?? item.product_sku ?? product.sku,
    barcode: item.barcode ?? product.barcode,
    color: item.color ?? item.product_color ?? item.colour ?? variant.color ?? product.color,
    product_color: item.product_color ?? item.color ?? variant.color ?? product.color,
    size: item.size ?? item.product_size ?? item.variant_size ?? variant.size ?? product.size,
    size_quantities: sizeQuantities,
    quantity: Number(quantity || 0),
    purchase_price: Number(purchasePrice || 0),
    condition_status: item.condition_status ?? item.condition ?? item.status_condition,
    condition_note: item.condition_note ?? item.damage_note ?? item.note_condition ?? '',
    method: item.method ?? item.out_method ?? item.method_summary,
  };
}

function normalizeTransaction(transaction = {}, direction = 'in') {
  const supplier = transaction.supplier || {};
  const parsedNotes = splitNotesAndMetadata(transaction.notes ?? transaction.note ?? transaction.catatan ?? transaction.description ?? '');
  const items = asArray(
    transaction.items,
    transaction.transaction_items,
    transaction.details,
    transaction.products,
    direction === 'in' ? transaction.transaction_in_items : transaction.transaction_out_items,
    direction === 'in' ? transaction.in_items : transaction.out_items,
  );
  const resolvedItems = (items.length ? items : parsedNotes.metadata?.items || []).map(normalizeTransactionItem);

  return {
    ...transaction,
    id: transaction.id ?? transaction.transaction_id,
    transaction_no: transaction.transaction_no ?? transaction.transactionNo ?? transaction.no_transaksi ?? transaction.code,
    supplier_name: transaction.supplier_name ?? transaction.supplierName ?? supplier.name,
    date: transaction.date ?? transaction.transaction_date ?? transaction.created_at,
    notes: parsedNotes.notes,
    inbound_status: transaction.inbound_status ?? transaction.status_barang ?? transaction.status ?? parsedNotes.metadata?.inbound_status,
    total_items: Number(transaction.total_items ?? transaction.total_qty ?? transaction.quantity ?? resolvedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0),
    total_amount: Number(transaction.total_amount ?? transaction.amount ?? transaction.total ?? resolvedItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.purchase_price || 0), 0) ?? 0),
    method_summary: transaction.method_summary ?? transaction.method,
    items: resolvedItems,
  };
}

function normalizeTransactionCollection(response, keys, direction) {
  const normalized = normalizeCollectionResponse(response, keys);
  return {
    ...normalized,
    data: (normalized.data || []).map((transaction) => normalizeTransaction(transaction, direction)),
    items: (normalized.items || []).map((transaction) => normalizeTransaction(transaction, direction)),
  };
}

function normalizeTransactionEntity(response, keys, direction) {
  const normalized = normalizeEntityResponse(response, keys);
  const data = normalized.data ? normalizeTransaction(normalized.data, direction) : normalized.data;
  return {
    ...normalized,
    data,
    item: data,
  };
}

export const transactionService = {
  async getTransactionsIn(params = {}) {
    try {
      const response = await apiGet('/transactions-in', { params });
      return normalizeTransactionCollection(response, ['transactions', 'transactions_in', 'transaction_in', 'inbounds'], 'in');
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetTransactionsIn(params);
        return normalizeTransactionCollection(response, ['transactions', 'transactions_in', 'transaction_in', 'inbounds'], 'in');
      }
      throw error;
    }
  },

  async createTransactionIn(payload) {
    const preparedPayload = prepareTransactionInPayload(payload);

    try {
      const response = await apiPost('/transactions-in', preparedPayload);
      return normalizeTransactionEntity(response, ['transaction', 'transaction_in'], 'in');
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockCreateTransactionIn(preparedPayload);
        return normalizeTransactionEntity(response, ['transaction', 'transaction_in'], 'in');
      }
      throw error;
    }
  },

  async deleteTransactionIn(id) {
    try {
      const response = await apiDelete(`/transactions-in/${id}`);
      return normalizeTransactionEntity(response, ['transaction', 'transaction_in'], 'in');
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockDeleteTransactionIn(id);
        return normalizeTransactionEntity(response, ['transaction', 'transaction_in'], 'in');
      }
      throw error;
    }
  },

  async getTransactionsOut(params = {}) {
    try {
      const response = await apiGet('/transactions-out', { params });
      return normalizeTransactionCollection(response, ['transactions', 'transactions_out', 'transaction_out', 'outbounds'], 'out');
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetTransactionsOut(params);
        return normalizeTransactionCollection(response, ['transactions', 'transactions_out', 'transaction_out', 'outbounds'], 'out');
      }
      throw error;
    }
  },

  async createTransactionOut(payload) {
    const preparedPayload = prepareTransactionOutPayload(payload);

    try {
      const response = await apiPost('/transactions-out', preparedPayload);
      return normalizeTransactionEntity(response, ['transaction', 'transaction_out'], 'out');
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockCreateTransactionOut(preparedPayload);
        return normalizeTransactionEntity(response, ['transaction', 'transaction_out'], 'out');
      }
      throw error;
    }
  },

  async deleteTransactionOut(id) {
    try {
      const response = await apiDelete(`/transactions-out/${id}`);
      return normalizeTransactionEntity(response, ['transaction', 'transaction_out'], 'out');
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockDeleteTransactionOut(id);
        return normalizeTransactionEntity(response, ['transaction', 'transaction_out'], 'out');
      }
      throw error;
    }
  },

  async getStockOpname(params = {}) {
    try {
      const response = await apiGet('/stock-opname', { params });
      return normalizeCollectionResponse(response, ['sessions']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockGetStockOpname(params);
        return normalizeCollectionResponse(response, ['sessions']);
      }
      throw error;
    }
  },

  async startStockOpname(payload = {}) {
    try {
      const response = await apiPost('/stock-opname/start', payload);
      return normalizeEntityResponse(response, ['session']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockStartStockOpname(payload);
        return normalizeEntityResponse(response, ['session']);
      }
      throw error;
    }
  },

  async scanStockOpname(id, payload) {
    try {
      const response = await apiPost(`/stock-opname/${id}/scan`, payload);
      return normalizeEntityResponse(response, ['session']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockScanStockOpname(id, payload);
        return normalizeEntityResponse(response, ['session']);
      }
      throw error;
    }
  },

  async pauseStockOpname(id) {
    try {
      const response = await apiPost(`/stock-opname/${id}/pause`);
      return normalizeEntityResponse(response, ['session']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockPauseStockOpname(id);
        return normalizeEntityResponse(response, ['session']);
      }
      throw error;
    }
  },

  async resumeStockOpname(id) {
    try {
      const response = await apiPost(`/stock-opname/${id}/resume`);
      return normalizeEntityResponse(response, ['session']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockResumeStockOpname(id);
        return normalizeEntityResponse(response, ['session']);
      }
      throw error;
    }
  },

  async finalizeStockOpname(id) {
    try {
      const response = await apiPost(`/stock-opname/${id}/finalize`);
      return normalizeEntityResponse(response, ['session']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockFinalizeStockOpname(id);
        return normalizeEntityResponse(response, ['session']);
      }
      throw error;
    }
  },

  async importStockOpnameCsv(id, file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiUpload(`/stock-opname/${id}/import`, formData);
      return normalizeEntityResponse(response, ['session']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockImportStockOpnameCsv(id, file);
        return normalizeEntityResponse(response, ['session']);
      }
      throw error;
    }
  },

  async adjustStockOpname(id, payload) {
    try {
      const response = await apiPost(`/stock-opname/${id}/adjust`, payload);
      return normalizeEntityResponse(response, ['session']);
    } catch (error) {
      if (shouldUseMock(error)) {
        const response = await mockAdjustStockOpname(id, payload);
        return normalizeEntityResponse(response, ['session']);
      }
      throw error;
    }
  },
};

export default transactionService;
