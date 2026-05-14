const DB_KEY = 'natakala_mock_db';

const mockEnabled = import.meta.env.VITE_ENABLE_MOCK_API === 'true';

const createId = () => Math.floor(Date.now() + Math.random() * 1000);

const today = () => new Date().toISOString().slice(0, 10);

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Allsize'];
const LEGACY_DEFAULT_SIZES = ['Allsize', 'Bigsize'];

function normalizeSettingsSizes(sizes) {
  if (!Array.isArray(sizes) || !sizes.length) return DEFAULT_SIZES;

  const cleanedSizes = sizes.map((size) => String(size || '').trim()).filter(Boolean);
  const isLegacyDefault =
    cleanedSizes.length === LEGACY_DEFAULT_SIZES.length &&
    LEGACY_DEFAULT_SIZES.every((size) => cleanedSizes.includes(size));

  return isLegacyDefault ? DEFAULT_SIZES : cleanedSizes;
}

const sampleDatabase = {
  settings: {
    minimum_stock: 5,
    barcode_format: 'CODE128',
    currency: 'IDR',
    sizes: DEFAULT_SIZES,
  },
  categories: [
    { id: 1, name: 'Atasan', description: 'Kemeja, kaos, blouse, dan sejenisnya' },
    { id: 2, name: 'Bawahan', description: 'Celana, rok, dan bawahan lainnya' },
    { id: 3, name: 'Outerwear', description: 'Jaket, cardigan, hoodie, dan layer luar' },
  ],
  suppliers: [
    {
      id: 1,
      name: 'PT Textile Makmur',
      contact: 'Budi Santoso',
      address: 'Bandung, Jawa Barat',
      email: 'sales@textilemakmur.test',
      phone: '081234567890',
    },
    {
      id: 2,
      name: 'CV Mode Nusantara',
      contact: 'Nita Wardani',
      address: 'Solo, Jawa Tengah',
      email: 'hello@modenusantara.test',
      phone: '082112223334',
    },
  ],
  products: [
    {
      id: 1,
      sku: 'NK-TS-001',
      name: 'T-Shirt Cotton Premium',
      category_id: 1,
      size: 'L',
      color: 'Black',
      purchase_price: 85000,
      selling_price: 145000,
      supplier_id: 1,
      stock: 20,
      initial_stock: 20,
      minimum_stock: 5,
      storage_zone: 'Zona A',
      storage_aisle: 'Aisle 01',
      storage_rack: 'Rak A1',
      storage_bin: 'Bin L-01',
      barcode: '899100000001',
      image_url: '',
      sold_count: 34,
    },
    {
      id: 2,
      sku: 'NK-SH-002',
      name: 'Kemeja Linen Oversize',
      category_id: 1,
      size: 'M',
      color: 'Beige',
      purchase_price: 120000,
      selling_price: 219000,
      supplier_id: 2,
      stock: 4,
      initial_stock: 8,
      minimum_stock: 5,
      storage_zone: 'Zona A',
      storage_aisle: 'Aisle 02',
      storage_rack: 'Rak A2',
      storage_bin: 'Bin M-03',
      barcode: '899100000002',
      image_url: '',
      sold_count: 72,
    },
    {
      id: 3,
      sku: 'NK-PT-003',
      name: 'Celana Chino Slim',
      category_id: 2,
      size: '32',
      color: 'Navy',
      purchase_price: 140000,
      selling_price: 259000,
      supplier_id: 1,
      stock: 0,
      initial_stock: 6,
      minimum_stock: 4,
      storage_zone: 'Zona B',
      storage_aisle: 'Aisle 01',
      storage_rack: 'Rak B1',
      storage_bin: 'Bin 32-02',
      barcode: '899100000003',
      image_url: '',
      sold_count: 19,
    },
    {
      id: 4,
      sku: 'NK-JK-004',
      name: 'Jaket Coach Urban',
      category_id: 3,
      size: 'XL',
      color: 'Army',
      purchase_price: 190000,
      selling_price: 329000,
      supplier_id: 2,
      stock: 11,
      initial_stock: 11,
      minimum_stock: 3,
      storage_zone: 'Zona C',
      storage_aisle: 'Aisle 03',
      storage_rack: 'Rak C3',
      storage_bin: 'Bin XL-04',
      barcode: '899100000004',
      image_url: '',
      sold_count: 11,
    },
  ],
  transactionsIn: [
    {
      id: 101,
      transaction_no: 'IN-20260424-001',
      supplier_id: 1,
      supplier_name: 'PT Textile Makmur',
      date: today(),
      notes: 'Restock awal',
      inbound_status: 'Barang Baru',
      total_items: 12,
      total_amount: 1020000,
      items: [
        {
          product_id: 1,
          product_name: 'T-Shirt Cotton Premium',
          sku: 'NK-TS-001',
          color: 'Black',
          size: 'L',
          size_quantities: { L: 12 },
          quantity: 12,
          purchase_price: 85000,
          condition_status: 'Layak',
          condition_note: '',
        },
      ],
    },
  ],
  digitalDocuments: [
    {
      id: 601,
      document_no: 'GRN-20260424-101',
      document_type: 'GRN',
      title: 'Nota Intern / Goods Receipt Note',
      transaction_no: 'IN-20260424-001',
      supplier_name: 'PT Textile Makmur',
      date: today(),
      status: 'Selesai',
      reference_no: 'PO-RESTOCK-001',
      notes: 'Dokumen penerimaan barang dari supplier.',
      total_items: 12,
      total_amount: 1020000,
      items: [
        {
          sku: 'NK-TS-001',
          product_name: 'T-Shirt Cotton Premium',
          color: 'Black',
          size: 'L',
          size_quantities: { L: 12 },
          quantity: 12,
          purchase_price: 85000,
          condition_status: 'Layak',
          condition_note: '',
        },
      ],
    },
    {
      id: 602,
      document_no: 'SJ-20260424-101',
      document_type: 'SURAT_JALAN',
      title: 'Surat Jalan Supplier',
      transaction_no: 'IN-20260424-001',
      supplier_name: 'PT Textile Makmur',
      date: today(),
      status: 'Diterima',
      reference_no: 'SJ-TM-2404-001',
      notes: 'Surat jalan barang masuk dari supplier.',
      total_items: 12,
      total_amount: 1020000,
      items: [
        {
          sku: 'NK-TS-001',
          product_name: 'T-Shirt Cotton Premium',
          color: 'Black',
          size: 'L',
          size_quantities: { L: 12 },
          quantity: 12,
          purchase_price: 85000,
        },
      ],
    },
    {
      id: 603,
      document_no: 'INV-20260424-101',
      document_type: 'FAKTUR',
      title: 'Faktur Pembelian',
      transaction_no: 'IN-20260424-001',
      supplier_name: 'PT Textile Makmur',
      date: today(),
      status: 'Tercatat',
      reference_no: 'INV-TM-2404-001',
      notes: 'Faktur pembelian berdasarkan barang masuk.',
      total_items: 12,
      total_amount: 1020000,
      items: [
        {
          sku: 'NK-TS-001',
          product_name: 'T-Shirt Cotton Premium',
          color: 'Black',
          size: 'L',
          size_quantities: { L: 12 },
          quantity: 12,
          purchase_price: 85000,
        },
      ],
    },
  ],
  transactionsOut: [
    {
      id: 201,
      transaction_no: 'OUT-20260424-001',
      date: today(),
      notes: 'Order marketplace',
      total_items: 3,
      method_summary: 'Penjualan',
      items: [
        {
          product_id: 2,
          product_name: 'Kemeja Linen Oversize',
          sku: 'NK-SH-002',
          color: 'Beige',
          size: 'M',
          size_quantities: { M: 3 },
          quantity: 3,
          method: 'Penjualan',
        },
      ],
    },
  ],
  stockOpnameSessions: [
    {
      id: 303,
      session_no: 'OPN-20260424-003',
      status: 'open',
      created_at: `${today()} 14:30:00`,
      finalized_at: null,
      summary: {
        total_scanned: 2,
        matched: 1,
        discrepancy: 1,
      },
      items: [
        {
          barcode: '899100000001',
          product_id: 1,
          product_name: 'T-Shirt Cotton Premium',
          system_stock: 20,
          physical_stock: 20,
          difference: 0,
          reason: '',
        },
        {
          barcode: '899100000004',
          product_id: 4,
          product_name: 'Jaket Coach Urban',
          system_stock: 11,
          physical_stock: 10,
          difference: -1,
          reason: 'Satu pcs dipakai display foto produk',
        },
      ],
    },
    {
      id: 302,
      session_no: 'OPN-20260423-002',
      status: 'closed',
      created_at: '2026-04-23 08:30:00',
      finalized_at: '2026-04-23 10:00:00',
      summary: {
        total_scanned: 2,
        matched: 2,
        discrepancy: 0,
      },
      items: [
        {
          barcode: '899100000001',
          product_id: 1,
          product_name: 'T-Shirt Cotton Premium',
          system_stock: 20,
          physical_stock: 20,
          difference: 0,
          reason: '',
        },
        {
          barcode: '899100000004',
          product_id: 4,
          product_name: 'Jaket Coach Urban',
          system_stock: 11,
          physical_stock: 11,
          difference: 0,
          reason: '',
        },
      ],
    },
    {
      id: 301,
      session_no: 'OPN-20260424-001',
      status: 'review',
      created_at: `${today()} 09:00:00`,
      finalized_at: `${today()} 11:00:00`,
      summary: {
        total_scanned: 1,
        matched: 0,
        discrepancy: 1,
      },
      items: [
        {
          barcode: '899100000002',
          product_id: 2,
          product_name: 'Kemeja Linen Oversize',
          system_stock: 4,
          physical_stock: 3,
          difference: -1,
          reason: 'Display toko',
        },
      ],
    },
  ],
  stockHistory: [
    {
      id: 401,
      product_id: 1,
      date: `${today()} 09:05:00`,
      type: 'initial_stock',
      quantity: 20,
      before_stock: 0,
      after_stock: 20,
      reference: 'INIT-NK-TS-001',
      note: 'Stok awal produk dibuat',
    },
    {
      id: 402,
      product_id: 1,
      date: `${today()} 10:15:00`,
      type: 'stock_in',
      quantity: 12,
      before_stock: 8,
      after_stock: 20,
      reference: 'IN-20260424-001',
      note: 'Restock dari supplier',
    },
    {
      id: 403,
      product_id: 2,
      date: `${today()} 11:20:00`,
      type: 'stock_out',
      quantity: -3,
      before_stock: 7,
      after_stock: 4,
      reference: 'OUT-20260424-001',
      note: 'Barang keluar untuk penjualan',
    },
    {
      id: 404,
      product_id: 2,
      date: `${today()} 12:10:00`,
      type: 'stock_opname',
      quantity: -1,
      before_stock: 4,
      after_stock: 3,
      reference: 'OPN-20260424-001',
      note: 'Penyesuaian dari stock opname',
    },
    {
      id: 405,
      product_id: 4,
      date: '2026-04-23 10:05:00',
      type: 'stock_opname',
      quantity: 0,
      before_stock: 11,
      after_stock: 11,
      reference: 'OPN-20260423-002',
      note: 'Hasil opname sesuai dengan stok sistem',
    },
    {
      id: 406,
      product_id: 1,
      date: `${today()} 14:40:00`,
      type: 'stock_opname',
      quantity: 0,
      before_stock: 20,
      after_stock: 20,
      reference: 'OPN-20260424-003',
      note: 'Pemeriksaan sementara, stok masih sesuai',
    },
    {
      id: 407,
      product_id: 4,
      date: `${today()} 14:42:00`,
      type: 'stock_opname',
      quantity: -1,
      before_stock: 11,
      after_stock: 10,
      reference: 'OPN-20260424-003',
      note: 'Selisih sementara pada sesi opname berjalan',
    },
  ],
  auditLogs: [],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureSeedCollection(target, seedItems, key) {
  seedItems.forEach((seedItem) => {
    const exists = target.some((item) => String(item[key]) === String(seedItem[key]));
    if (!exists) {
      target.push(clone(seedItem));
    }
  });
}

function findProductForItem(db, item) {
  return db.products.find(
    (product) =>
      Number(product.id) === Number(item.product_id) ||
      String(product.sku || '') === String(item.sku || '') ||
      String(product.name || '') === String(item.product_name || ''),
  );
}

function enrichTransactionItemSnapshot(db, item) {
  const product = findProductForItem(db, item) || {};
  const color = item.color || item.product_color || product.color || '';

  return {
    ...item,
    product_name: item.product_name || product.name || '',
    sku: item.sku || product.sku || '',
    barcode: item.barcode || product.barcode || '',
    color,
    product_color: item.product_color || color,
  };
}

function normalizeStockBreakdown(product = {}) {
  const raw = product.stock_breakdown || {};
  const entries = Object.entries(raw);
  const fallbackColor = product.color || '';

  if (entries.some(([, value]) => value && typeof value === 'object' && !Array.isArray(value))) {
    return entries.reduce((breakdown, [color, sizes]) => {
      const colorKey = color || fallbackColor;
      breakdown[colorKey] = Object.entries(sizes || {}).reduce((sizeMap, [size, stock]) => {
        if (size) sizeMap[size] = Number(stock || 0);
        return sizeMap;
      }, {});
      return breakdown;
    }, {});
  }

  if (entries.length) {
    return {
      [fallbackColor]: entries.reduce((sizeMap, [size, stock]) => {
        if (size) sizeMap[size] = Number(stock || 0);
        return sizeMap;
      }, {}),
    };
  }

  if (product.size && product.size !== 'Allsize') {
    return { [fallbackColor]: { [product.size]: Number(product.stock || 0) } };
  }

  if (product.size === 'Allsize' || product.size_type === 'allsize') {
    return { [fallbackColor]: { Allsize: Number(product.stock || 0) } };
  }

  return {};
}

function stockRowsFromBreakdown(product = {}) {
  const breakdown = normalizeStockBreakdown(product);
  return Object.entries(breakdown).flatMap(([color, sizes]) =>
    Object.entries(sizes || {}).map(([size, stock]) => ({
      color,
      size,
      stock: Number(stock || 0),
    })),
  );
}

function totalFromStockBreakdown(product = {}) {
  return stockRowsFromBreakdown(product).reduce((sum, item) => sum + Number(item.stock || 0), 0);
}

function colorSummaryFromStockBreakdown(product = {}) {
  return Array.from(new Set(stockRowsFromBreakdown(product).map((item) => item.color).filter(Boolean))).join(', ') || product.color || '';
}

function productColorOptions(product = {}) {
  return Array.from(new Set(stockRowsFromBreakdown(product).map((item) => String(item.color || '').trim()))).filter(Boolean);
}

function resolveMockItemColor(product = {}, item = {}) {
  const requestedColor = String(item.color || item.product_color || '').trim();
  const colors = productColorOptions(product);

  if (requestedColor) {
    if (!colors.length || colors.includes(requestedColor)) {
      return requestedColor;
    }

    const matchingColor = requestedColor
      .split(',')
      .map((color) => color.trim())
      .find((color) => colors.includes(color));

    if (matchingColor) return matchingColor;
  }

  if (colors.length) return colors[0];

  return String(product.color || '')
    .split(',')
    .map((color) => color.trim())
    .find(Boolean) || '';
}

function sizeLabelFromQuantities(sizeQuantities = {}) {
  const sizes = Object.entries(sizeQuantities || {})
    .filter(([, quantity]) => Number(quantity || 0) > 0)
    .map(([size]) => size);

  if (!sizes.length) return '';
  return sizes.length === 1 ? sizes[0] : sizes.join(', ');
}

function normalizeInboundStatus(value) {
  return value === 'Barang Return' ? 'Barang Return' : 'Barang Baru';
}

function normalizeConditionStatus(value) {
  return value || 'Layak';
}

function normalizeConditionNote(item = {}) {
  const status = normalizeConditionStatus(item.condition_status || item.condition);
  if (status !== 'Rusak Ringan') return '';
  return item.condition_note || item.damage_note || item.note_condition || '';
}

function numberFrom(...values) {
  const value = values.find((entry) => entry !== undefined && entry !== null && entry !== '');
  return Number(value || 0);
}

function variantStock(product = {}, color = '', size = '') {
  const rows = stockRowsFromBreakdown(product);
  const exact = rows.find(
    (row) => String(row.color || '') === String(color || '') && String(row.size || '') === String(size || ''),
  );

  if (exact) return Number(exact.stock || 0);

  if (!color || !productColorOptions(product).length) {
    const fallback = rows.find((row) => String(row.size || '') === String(size || ''));
    return Number(fallback?.stock || 0);
  }

  return 0;
}

function ensureVariantBucket(product, color) {
  product.stock_breakdown = normalizeStockBreakdown(product);
  product.stock_breakdown[color || ''] = product.stock_breakdown[color || ''] || {};
  return product.stock_breakdown[color || ''];
}

function ensureSeedData(db) {
  db.settings = {
    ...sampleDatabase.settings,
    ...(db.settings || {}),
    sizes: normalizeSettingsSizes(db.settings?.sizes),
  };
  db.stockOpnameSessions = Array.isArray(db.stockOpnameSessions) ? db.stockOpnameSessions : [];
  db.stockHistory = Array.isArray(db.stockHistory) ? db.stockHistory : [];
  db.auditLogs = [];
  db.digitalDocuments = Array.isArray(db.digitalDocuments) ? db.digitalDocuments : [];
  db.products = Array.isArray(db.products) ? db.products : [];

  ensureSeedCollection(db.stockOpnameSessions, sampleDatabase.stockOpnameSessions, 'session_no');
  ensureSeedCollection(db.stockHistory, sampleDatabase.stockHistory, 'reference');
  ensureSeedCollection(db.digitalDocuments, sampleDatabase.digitalDocuments, 'document_no');

  db.products = db.products.map((product) => ({
    storage_zone: '',
    storage_aisle: '',
    storage_rack: '',
    storage_bin: '',
    size_type: product.size === 'Allsize' ? 'allsize' : 'sized',
    stock_breakdown: product.size && product.size !== 'Allsize' ? { [product.color || '']: { [product.size]: Number(product.stock || 0) } } : {},
    ...product,
  }));

  db.products = db.products.map((product) => {
    const stockBreakdown = normalizeStockBreakdown(product);
    return {
      ...product,
      stock_breakdown: stockBreakdown,
      color: colorSummaryFromStockBreakdown({ ...product, stock_breakdown: stockBreakdown }),
      stock: totalFromStockBreakdown({ ...product, stock_breakdown: stockBreakdown }) || Number(product.stock || 0),
    };
  });

  db.transactionsIn = (db.transactionsIn || []).map((transaction) => ({
    ...transaction,
    inbound_status: normalizeInboundStatus(transaction.inbound_status || transaction.status),
    items: (transaction.items || []).map((item) => ({
      ...enrichTransactionItemSnapshot(db, item),
      condition_status: normalizeConditionStatus(item.condition_status || item.condition),
      condition_note: normalizeConditionNote(item),
      size: item.size || null,
      size_quantities: item.size_quantities || null,
      quantity: Number(item.quantity || 0),
    })),
  }));

  db.transactionsOut = (db.transactionsOut || []).map((transaction) => ({
    ...transaction,
    items: (transaction.items || []).map((item) => ({
      ...enrichTransactionItemSnapshot(db, item),
      size: item.size || null,
      size_quantities: item.size_quantities || null,
      quantity: Number(item.quantity || 0),
    })),
  }));

  db.digitalDocuments = (db.digitalDocuments || []).map((document) => ({
    ...document,
    items: (document.items || []).map((item) => enrichTransactionItemSnapshot(db, item)),
  })).map((document) => {
    const transaction = (db.transactionsIn || []).find((item) => item.transaction_no === document.transaction_no);

    return {
      ...document,
      total_amount: calculateInboundDocumentAmount(document, transaction),
    };
  });

  db.stockOpnameSessions = db.stockOpnameSessions.map((session) => ({
    ...session,
    items: (session.items || []).map((item) => enrichStockOpnameItem(db, item)),
  }));

  db.stockOpnameSessions.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  db.stockHistory.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  ensureInboundDocuments(db);
  db.digitalDocuments.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  return db;
}

function readDb() {
  const raw = localStorage.getItem(DB_KEY);

  if (!raw) {
    const seededDb = ensureSeedData(clone(sampleDatabase));
    localStorage.setItem(DB_KEY, JSON.stringify(seededDb));
    return seededDb;
  }

  try {
    const parsedDb = ensureSeedData(JSON.parse(raw));
    localStorage.setItem(DB_KEY, JSON.stringify(parsedDb));
    return parsedDb;
  } catch (error) {
    const seededDb = ensureSeedData(clone(sampleDatabase));
    localStorage.setItem(DB_KEY, JSON.stringify(seededDb));
    return seededDb;
  }
}

function writeDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function nowStamp() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function createAuditEntry(db, entry) {
  return null;
}

function createStockHistoryEntry(db, entry) {
  const historyEntry = {
    id: createId(),
    date: nowStamp(),
    ...entry,
  };
  db.stockHistory.unshift(historyEntry);
  return historyEntry;
}

function documentPrefix(type) {
  if (type === 'SURAT_JALAN') return 'SJ';
  if (type === 'FAKTUR') return 'INV';
  return 'GRN';
}

function documentTitle(type) {
  if (type === 'SURAT_JALAN') return 'Surat Jalan Supplier';
  if (type === 'FAKTUR') return 'Faktur Pembelian';
  return 'Nota Intern / Goods Receipt Note';
}

function documentStatus(type) {
  if (type === 'SURAT_JALAN') return 'Diterima';
  if (type === 'FAKTUR') return 'Tercatat';
  return 'Selesai';
}

function buildInboundDocument(transaction, type) {
  const prefix = documentPrefix(type);
  const transactionToken = String(transaction.transaction_no || Date.now()).replace(/^IN-/, '');
  const items = (transaction.items || []).map((item) => ({
    sku: item.sku,
    product_name: item.product_name,
    barcode: item.barcode,
    color: item.color || item.product_color || '',
    size: item.size,
    size_quantities: item.size_quantities || null,
    quantity: Number(item.quantity || 0),
    purchase_price: Number(item.purchase_price || 0),
    condition_status: item.condition_status || 'Layak',
    condition_note: item.condition_note || '',
  }));

  return {
    id: createId(),
    document_no: `${prefix}-${transactionToken}`,
    document_type: type,
    title: documentTitle(type),
    transaction_no: transaction.transaction_no,
    supplier_name: transaction.supplier_name,
    date: transaction.date,
    status: documentStatus(type),
    reference_no: type === 'FAKTUR' ? `INV-${transactionToken}` : type === 'SURAT_JALAN' ? `SJ-${transactionToken}` : `GRN-${transactionToken}`,
    notes:
      type === 'FAKTUR'
        ? 'Faktur pembelian dihitung dari barang masuk.'
        : type === 'SURAT_JALAN'
          ? 'Dokumen pengantar barang dari supplier.'
          : 'Nota penerimaan barang masuk.',
    total_items: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    total_amount: items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.purchase_price || 0), 0),
    items,
  };
}

function calculateInboundDocumentAmount(document = {}, transaction = {}) {
  const itemAmount = (document.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.purchase_price || 0),
    0,
  );

  return itemAmount || Number(transaction.total_amount || 0) || Number(document.total_amount || 0);
}

function ensureInboundDocuments(db) {
  db.digitalDocuments = Array.isArray(db.digitalDocuments) ? db.digitalDocuments : [];
  (db.transactionsIn || []).forEach((transaction) => {
    ['GRN', 'SURAT_JALAN', 'FAKTUR'].forEach((type) => {
      const exists = db.digitalDocuments.some(
        (document) => document.document_type === type && document.transaction_no === transaction.transaction_no,
      );
      if (!exists) {
        db.digitalDocuments.unshift(buildInboundDocument(transaction, type));
      }
    });
  });
}

function cleanInboundNotes(notes) {
  const cleanNotes = String(notes || '').split('[NATAKALA_INBOUND_META]')[0].trim();
  return cleanNotes || '-';
}

function categoryName(db, id) {
  return db.categories.find((item) => Number(item.id) === Number(id))?.name || '-';
}

function supplierName(db, id) {
  return db.suppliers.find((item) => Number(item.id) === Number(id))?.name || '-';
}

function storageLocation(product) {
  return [product.storage_zone, product.storage_aisle, product.storage_rack, product.storage_bin]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .join(' / ');
}

function enrichProduct(db, product) {
  const stockBreakdown = normalizeStockBreakdown(product);
  const sizeStocks = stockRowsFromBreakdown({ ...product, stock_breakdown: stockBreakdown });
  return {
    ...product,
    size_type: product.size_type || (product.size === 'Allsize' ? 'allsize' : 'sized'),
    stock_breakdown: stockBreakdown,
    size_stocks: sizeStocks,
    color: colorSummaryFromStockBreakdown({ ...product, stock_breakdown: stockBreakdown }),
    category_name: categoryName(db, product.category_id),
    supplier_name: supplierName(db, product.supplier_id),
    storage_location: storageLocation(product) || '-',
  };
}

function sizeStockSummary(product) {
  if (!product) return '-';
  const rows = stockRowsFromBreakdown(product);
  const summary = Object.entries(
    rows.reduce((groups, row) => {
      const color = row.color || 'Tanpa warna';
      const size = row.size || 'Allsize';
      groups[color] = groups[color] || {};
      groups[color][size] = Number(groups[color][size] || 0) + Number(row.stock || 0);
      return groups;
    }, {}),
  )
    .map(([color, sizes]) => {
      const sizeSummary = Object.entries(sizes)
        .map(([size, stock]) => `${size}: ${stock}`)
        .join(', ');
      return `${color} (${sizeSummary})`;
    })
    .join('; ');
  return summary || product.size || '-';
}

function enrichStockOpnameItem(db, item) {
  const product = db.products.find((entry) => Number(entry.id) === Number(item.product_id));
  return {
    ...item,
    size: item.size || product?.size || '-',
    color: item.color || product?.color || '',
    size_stocks: item.size_stocks || stockRowsFromBreakdown(product),
    size_summary: item.size_summary || sizeStockSummary(product),
  };
}

function fileToDataUrl(file) {
  if (!file || typeof FileReader === 'undefined') {
    return Promise.resolve('');
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function parseProductPayload(payload) {
  if (!(payload instanceof FormData)) {
    return Promise.resolve({ ...payload });
  }

  const data = {};
  for (const [key, value] of payload.entries()) {
    data[key] = value;
  }

  if (typeof data.stock_breakdown === 'string') {
    try {
      data.stock_breakdown = JSON.parse(data.stock_breakdown);
    } catch (error) {
      data.stock_breakdown = {};
    }
  }

  if (data.image instanceof File && data.image.size > 0) {
    return fileToDataUrl(data.image).then((imageUrl) => ({
      ...data,
      image_url: imageUrl,
    }));
  }

  return Promise.resolve(data);
}

function paginate(items, page = 1, perPage = 10) {
  const currentPage = Number(page) || 1;
  const limit = Number(perPage) || 10;
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / limit));
  const start = (currentPage - 1) * limit;

  return {
    data: items.slice(start, start + limit),
    current_page: currentPage,
    last_page: lastPage,
    total,
  };
}

function buildDashboard(db) {
  const products = db.products.map((product) => enrichProduct(db, product));
  const inventoryValue = products.reduce((sum, item) => sum + Number(item.stock || 0) * Number(item.purchase_price || 0), 0);
  const lowStockProducts = products.filter((item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) <= Number(item.minimum_stock || db.settings.minimum_stock));
  const outOfStockProducts = products.filter((item) => Number(item.stock || 0) <= 0);
  const bestSeller = [...products].sort((a, b) => Number(b.sold_count || 0) - Number(a.sold_count || 0))[0] || null;
  const chart = last7Days().map((label) => ({
    label,
    in: db.transactionsIn
      .filter((item) => formatDay(item.date) === label)
      .reduce((sum, item) => sum + Number(item.total_items || 0), 0),
    out: db.transactionsOut
      .filter((item) => formatDay(item.date) === label)
      .reduce((sum, item) => sum + Number(item.total_items || 0), 0),
  }));

  return {
    summary: {
      total_products: products.length,
      total_stock: products.reduce((sum, item) => sum + Number(item.stock || 0), 0),
      inventory_value: inventoryValue,
      low_stock: lowStockProducts.length,
      out_of_stock: outOfStockProducts.length,
      currency: db.settings.currency || 'IDR',
    },
    best_seller: bestSeller ? { name: bestSeller.name, total_sold: bestSeller.sold_count || 0 } : null,
    transaction_chart: chart,
    low_stock_products: lowStockProducts,
  };
}

function formatDay(dateString) {
  const date = new Date(dateString);
  return ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][date.getDay()];
}

function last7Days() {
  const labels = [];
  const now = new Date();

  for (let index = 6; index >= 0; index -= 1) {
    const value = new Date(now);
    value.setDate(now.getDate() - index);
    labels.push(formatDay(value.toISOString().slice(0, 10)));
  }

  return labels;
}

function normalizeDate(value) {
  return value || today();
}

function inPeriod(dateValue, filters = {}) {
  if (!filters.period || filters.period === 'all') return true;

  const value = new Date(dateValue);
  const now = new Date();
  const start = filters.start_date ? new Date(filters.start_date) : null;
  const end = filters.end_date ? new Date(filters.end_date) : null;

  if (filters.period === 'today') {
    return value.toDateString() === now.toDateString();
  }

  if (filters.period === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    return value >= weekAgo && value <= now;
  }

  if (filters.period === 'month') {
    return value.getMonth() === now.getMonth() && value.getFullYear() === now.getFullYear();
  }

  if (filters.period === 'custom' && start && end) {
    return value >= start && value <= end;
  }

  return true;
}

function createReport(db, type, filters = {}) {
  if (type === 'stock') {
    const data = db.products.map((item) => enrichProduct(db, item)).map((item) => ({
      sku: item.sku,
      name: item.name,
      category_name: item.category_name,
      color: item.color,
      size: sizeStockSummary(item),
      storage_location: item.storage_location,
      stock: item.stock,
      minimum_stock: item.minimum_stock,
      supplier_name: item.supplier_name,
    }));

    return {
      summary: {
        total_records: data.length,
        total_stock: data.reduce((sum, item) => sum + Number(item.stock || 0), 0),
      },
      chart: data.slice(0, 6).map((item) => ({ label: item.name.slice(0, 10), value: item.stock })),
      data,
    };
  }

  if (type === 'transactionsIn') {
    const transactions = db.transactionsIn.filter((item) => inPeriod(item.date, filters));
    const data = transactions.flatMap((transaction) =>
      (transaction.items?.length
        ? transaction.items
        : [
            {
              product_name: transaction.product_name || transaction.product || transaction.item_summary || '-',
              size: transaction.size || transaction.size_summary || '-',
              color: transaction.color || transaction.product_color || 'Tanpa warna',
              quantity: numberFrom(transaction.quantity, transaction.total_items),
              purchase_price:
                numberFrom(transaction.purchase_price) ||
                (numberFrom(transaction.total_items) > 0
                  ? numberFrom(transaction.total_amount) / numberFrom(transaction.total_items)
                  : 0),
              condition_status: transaction.condition_status || transaction.condition || '-',
              condition_note: transaction.condition_note || '',
            },
          ]).map((item) => {
        const quantity = numberFrom(item.quantity, transaction.total_items);
        const purchasePrice = numberFrom(item.purchase_price);
        const sizes = item.size_quantities
          ? Object.entries(item.size_quantities).map(([size, amount]) => `${size}: ${amount}`).join(', ')
          : item.size || 'Allsize';
        const conditionStatus = item.condition_status || 'Layak';

        return {
          transaction_no: transaction.transaction_no,
          supplier_name: transaction.supplier_name,
          date: transaction.date,
          inbound_status: transaction.inbound_status || 'Barang Baru',
          product: [item.sku, item.product_name].filter(Boolean).join(' - ') || '-',
          size: sizes,
          color: item.color || item.product_color || 'Tanpa warna',
          quantity,
          condition: item.condition_note ? `${conditionStatus} - ${item.condition_note}` : conditionStatus,
          purchase_price: purchasePrice,
          subtotal: quantity * purchasePrice,
          notes: cleanInboundNotes(transaction.notes),
        };
      }),
    );
    return {
      summary: {
        total_records: transactions.length,
        total_rows: data.length,
        total_items: data.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        total_amount: data.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
      },
      chart: transactions.map((item) => ({ label: item.transaction_no.slice(-3), value: item.total_items })),
      data,
    };
  }

  if (type === 'returns') {
    const transactions = db.transactionsIn.filter(
      (item) => inPeriod(item.date, filters) && String(item.inbound_status || '').toLowerCase() === 'barang return',
    );
    const data = transactions.flatMap((transaction) =>
      (transaction.items?.length
        ? transaction.items
        : [
            {
              product_name: transaction.product_name || transaction.product || transaction.item_summary || '-',
              size: transaction.size || transaction.size_summary || '-',
              color: transaction.color || transaction.product_color || 'Tanpa warna',
              quantity: numberFrom(transaction.quantity, transaction.total_items),
              purchase_price:
                numberFrom(transaction.purchase_price) ||
                (numberFrom(transaction.total_items) > 0
                  ? numberFrom(transaction.total_amount) / numberFrom(transaction.total_items)
                  : 0),
              condition_status: transaction.condition_status || transaction.condition || 'Layak',
              condition_note: transaction.condition_note || '',
            },
          ]).map((item) => {
        const quantity = numberFrom(item.quantity, transaction.total_items);
        const purchasePrice = numberFrom(item.purchase_price);
        const sizes = item.size_quantities
          ? Object.entries(item.size_quantities).map(([size, amount]) => `${size}: ${amount}`).join(', ')
          : item.size || 'Allsize';
        const conditionStatus = item.condition_status || 'Layak';

        return {
          transaction_no: transaction.transaction_no,
          date: transaction.date,
          supplier_name: transaction.supplier_name || '-',
          product: [item.sku, item.product_name].filter(Boolean).join(' - ') || '-',
          size: sizes,
          color: item.color || item.product_color || 'Tanpa warna',
          total_items: quantity,
          condition: item.condition_note ? `${conditionStatus} - ${item.condition_note}` : conditionStatus,
          purchase_price: purchasePrice,
          total_amount: quantity * purchasePrice,
          notes: cleanInboundNotes(transaction.notes),
        };
      }),
    );

    return {
      summary: {
        total_records: transactions.length,
        total_rows: data.length,
        total_items: data.reduce((sum, item) => sum + Number(item.total_items || 0), 0),
        total_amount: data.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
      },
      chart: data.slice(0, 12).map((item) => ({ label: item.transaction_no.slice(-3), value: item.total_items })),
      data,
    };
  }

  if (type === 'transactionsOut') {
    const transactions = db.transactionsOut.filter((item) => inPeriod(item.date, filters));
    const data = transactions.flatMap((transaction) =>
      (transaction.items?.length
        ? transaction.items
        : [
            {
              product_name: transaction.product_name || transaction.product || 'Detail produk tidak tersimpan',
              size: transaction.size || transaction.size_summary || 'Tidak tersimpan',
              color: transaction.color || transaction.product_color || 'Tidak tersimpan',
              quantity: numberFrom(transaction.quantity, transaction.total_items),
              method: transaction.method || transaction.method_summary || '-',
            },
          ]).map((item) => {
        const quantity = numberFrom(item.quantity, transaction.total_items);
        const sizes = item.size_quantities
          ? Object.entries(item.size_quantities).map(([size, amount]) => `${size}: ${amount}`).join(', ')
          : item.size || 'Tidak tersimpan';

        return {
          transaction_no: transaction.transaction_no,
          date: transaction.date,
          product: [item.sku, item.product_name].filter(Boolean).join(' - ') || 'Detail produk tidak tersimpan',
          size: sizes,
          color: item.color || item.product_color || 'Tidak tersimpan',
          quantity,
          method: item.method || transaction.method_summary || '-',
          notes: transaction.notes || '',
        };
      }),
    );
    return {
      summary: {
        total_records: transactions.length,
        total_rows: data.length,
        total_items: data.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      },
      chart: transactions.map((item) => ({ label: item.transaction_no.slice(-3), value: item.total_items })),
      data,
    };
  }

  if (type === 'bestSeller') {
    const data = [...db.products]
      .sort((a, b) => Number(b.sold_count || 0) - Number(a.sold_count || 0))
      .map((item) => enrichProduct(db, item))
      .map((item) => ({
        sku: item.sku,
        name: item.name,
        category_name: item.category_name,
        color: item.color,
        size: sizeStockSummary(item),
        stock: item.stock,
        sold_count: item.sold_count || 0,
        selling_price: item.selling_price,
        estimated_revenue: Number(item.sold_count || 0) * Number(item.selling_price || 0),
      }));
    return {
      summary: {
        total_records: data.length,
      },
      chart: data.slice(0, 6).map((item) => ({ label: item.name.slice(0, 10), value: item.sold_count })),
      data,
    };
  }

  if (type === 'inventoryValue') {
    const data = db.products.map((item) => enrichProduct(db, item)).map((item) => ({
      sku: item.sku,
      name: item.name,
      category_name: item.category_name,
      color: item.color,
      size: sizeStockSummary(item),
      stock: item.stock,
      purchase_price: item.purchase_price,
      selling_price: item.selling_price,
      inventory_value: Number(item.stock || 0) * Number(item.purchase_price || 0),
      potential_sales_value: Number(item.stock || 0) * Number(item.selling_price || 0),
    }));
    return {
      summary: {
        total_records: data.length,
        total_inventory_value: data.reduce((sum, item) => sum + item.inventory_value, 0),
      },
      chart: data.slice(0, 6).map((item) => ({ label: item.name.slice(0, 10), value: item.inventory_value })),
      data,
    };
  }

  if (type === 'mutasi') {
    const incoming = db.transactionsIn
      .filter((transaction) => inPeriod(transaction.date, filters))
      .flatMap((transaction) =>
        (transaction.items || []).map((item) => ({
          date: transaction.date,
          transaction_no: transaction.transaction_no,
          movement: 'Masuk',
          supplier_name: transaction.supplier_name || '-',
          product: [item.sku, item.product_name].filter(Boolean).join(' - ') || '-',
          size: item.size_quantities
            ? Object.entries(item.size_quantities).map(([size, amount]) => `${size}: ${amount}`).join(', ')
            : item.size || '-',
          color: item.color || item.product_color || '-',
          quantity_in: Number(item.quantity || 0),
          quantity_out: 0,
          method_or_status: transaction.inbound_status || 'Barang Baru',
          condition: item.condition_note
            ? `${item.condition_status || 'Layak'} - ${item.condition_note}`
            : item.condition_status || 'Layak',
          notes: transaction.notes || '',
        })),
      );
    const outgoing = db.transactionsOut
      .filter((transaction) => inPeriod(transaction.date, filters))
      .flatMap((transaction) =>
        (transaction.items || []).map((item) => ({
          date: transaction.date,
          transaction_no: transaction.transaction_no,
          movement: 'Keluar',
          supplier_name: '-',
          product: [item.sku, item.product_name].filter(Boolean).join(' - ') || 'Detail produk tidak tersimpan',
          size: item.size_quantities
            ? Object.entries(item.size_quantities).map(([size, amount]) => `${size}: ${amount}`).join(', ')
            : item.size || item.product_size || 'Tidak tersimpan',
          color: item.color || item.product_color || 'Tidak tersimpan',
          quantity_in: 0,
          quantity_out: Number(item.quantity || 0),
          method_or_status: item.method || transaction.method_summary || '-',
          condition: '-',
          notes: transaction.notes || '',
        })),
      );
    const data = [...incoming, ...outgoing].sort((a, b) => String(b.date).localeCompare(String(a.date)));

    return {
      summary: {
        total_records: data.length,
        total_in: data.reduce((sum, item) => sum + Number(item.quantity_in || 0), 0),
        total_out: data.reduce((sum, item) => sum + Number(item.quantity_out || 0), 0),
        net_movement: data.reduce((sum, item) => sum + Number(item.quantity_in || 0) - Number(item.quantity_out || 0), 0),
      },
      chart: data.slice(0, 12).map((item) => ({
        label: item.transaction_no.slice(-4),
        value: Number(item.quantity_in || 0) || Number(item.quantity_out || 0),
      })),
      data,
    };
  }

  const data = db.stockOpnameSessions.filter((item) => {
    const baseDate = item.created_at?.slice(0, 10) || today();
    return inPeriod(baseDate, filters);
  });
  return {
    summary: {
      total_records: data.length,
      open_sessions: data.filter((item) => item.status === 'open').length,
    },
    chart: data.map((item) => ({ label: item.session_no.slice(-3), value: item.items?.length || 0 })),
    data,
  };
}

export async function mockBuildReportExport(type, filters = {}) {
  const db = readDb();
  return createReport(db, type, filters);
}

export function shouldUseMock(error) {
  return mockEnabled && !error?.response;
}

function createMockError(message, status = 422) {
  const error = new Error(message);
  error.response = {
    status,
    data: {
      message,
    },
  };
  return error;
}

export async function mockGetProducts(params = {}) {
  const db = readDb();
  const minimumStock = db.settings.minimum_stock || 5;
  const filtered = db.products
    .map((item) => enrichProduct(db, item))
    .filter((item) => {
      const keyword = String(params.search || '').toLowerCase();
      const searchMatch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.sku.toLowerCase().includes(keyword) ||
        String(item.barcode || '').toLowerCase().includes(keyword) ||
        String(item.storage_location || '').toLowerCase().includes(keyword);
      const categoryMatch = !params.category_id || String(item.category_id) === String(params.category_id);
      const supplierMatch = !params.supplier_id || String(item.supplier_id) === String(params.supplier_id);
      const colorMatch = !params.color || stockRowsFromBreakdown(item).some((row) => String(row.color || '') === String(params.color));
      const sizeMatch =
        !params.size ||
        String(item.size || '').toLowerCase().includes(String(params.size).toLowerCase()) ||
        stockRowsFromBreakdown(item).some((row) => String(row.size || '').toLowerCase().includes(String(params.size).toLowerCase()));

      let stockMatch = true;
      if (params.stock_status === 'available') stockMatch = Number(item.stock) > Number(item.minimum_stock || minimumStock);
      if (params.stock_status === 'low') stockMatch = Number(item.stock) > 0 && Number(item.stock) <= Number(item.minimum_stock || minimumStock);
      if (params.stock_status === 'empty') stockMatch = Number(item.stock) <= 0;

      return searchMatch && categoryMatch && supplierMatch && colorMatch && sizeMatch && stockMatch;
    });

  return { data: paginate(filtered, params.page, params.per_page || 10) };
}

export async function mockGetProductById(id) {
  const db = readDb();
  const product = db.products.find((item) => Number(item.id) === Number(id));
  const stock_history = db.stockHistory.filter((item) => Number(item.product_id) === Number(id));
  return { data: product ? { ...enrichProduct(db, product), stock_history } : null };
}

export async function mockCreateProduct(payload) {
  const db = readDb();
  const parsed = await parseProductPayload(payload);
  const stockBreakdown = normalizeStockBreakdown({ ...parsed, stock: parsed.initial_stock });
  const stockTotal = totalFromStockBreakdown({ ...parsed, stock_breakdown: stockBreakdown });
  const product = {
    id: createId(),
    sku: parsed.sku || '',
    name: parsed.name || '',
    category_id: Number(parsed.category_id || 0),
    size_type: parsed.size_type || (parsed.size === 'Allsize' ? 'allsize' : 'sized'),
    size: parsed.size || '',
    stock_breakdown: stockBreakdown,
    color: parsed.color || colorSummaryFromStockBreakdown({ ...parsed, stock_breakdown: stockBreakdown }),
    storage_zone: parsed.storage_zone || '',
    storage_aisle: parsed.storage_aisle || '',
    storage_rack: parsed.storage_rack || '',
    storage_bin: parsed.storage_bin || '',
    purchase_price: Number(parsed.purchase_price || 0),
    selling_price: Number(parsed.selling_price || 0),
    supplier_id: Number(parsed.supplier_id || 0),
    stock: stockTotal || Number(parsed.initial_stock || 0),
    initial_stock: stockTotal || Number(parsed.initial_stock || 0),
    minimum_stock: Number(parsed.minimum_stock || db.settings.minimum_stock || 5),
    barcode: parsed.barcode || '',
    image_url: parsed.image_url || '',
    sold_count: 0,
  };
  db.products.unshift(product);
  createStockHistoryEntry(db, {
    product_id: product.id,
    type: 'initial_stock',
    quantity: Number(product.initial_stock || 0),
    before_stock: 0,
    after_stock: Number(product.stock || 0),
    reference: `INIT-${product.sku}`,
    note: 'Stok awal produk dibuat',
  });
  createAuditEntry(db, {
    action: 'create',
    entity_type: 'product',
    entity_id: product.id,
    entity_label: product.name,
    description: 'Produk baru ditambahkan.',
    meta: {
      sku: product.sku,
    },
  });
  writeDb(db);
  return { data: enrichProduct(db, product) };
}

export async function mockUpdateProduct(id, payload) {
  const db = readDb();
  const parsed = await parseProductPayload(payload);
  const index = db.products.findIndex((item) => Number(item.id) === Number(id));

  if (index === -1) {
    return { data: null };
  }

  const current = db.products[index];
  const beforeStock = Number(current.stock || 0);
  const stockBreakdown = normalizeStockBreakdown({
    ...current,
    ...parsed,
    stock_breakdown: parsed.stock_breakdown ?? current.stock_breakdown,
    stock: parsed.initial_stock ?? current.stock,
  });
  const stockTotal = totalFromStockBreakdown({ ...current, stock_breakdown: stockBreakdown });
  const afterStock = stockTotal || Number(parsed.initial_stock ?? current.stock);
  db.products[index] = {
    ...current,
    sku: parsed.sku ?? current.sku,
    name: parsed.name ?? current.name,
    category_id: Number(parsed.category_id ?? current.category_id),
    size_type: parsed.size_type ?? current.size_type ?? (current.size === 'Allsize' ? 'allsize' : 'sized'),
    size: parsed.size ?? current.size,
    stock_breakdown: stockBreakdown,
    color: (parsed.color ?? colorSummaryFromStockBreakdown({ ...current, stock_breakdown: stockBreakdown })) || current.color,
    storage_zone: parsed.storage_zone ?? current.storage_zone ?? '',
    storage_aisle: parsed.storage_aisle ?? current.storage_aisle ?? '',
    storage_rack: parsed.storage_rack ?? current.storage_rack ?? '',
    storage_bin: parsed.storage_bin ?? current.storage_bin ?? '',
    purchase_price: Number(parsed.purchase_price ?? current.purchase_price),
    selling_price: Number(parsed.selling_price ?? current.selling_price),
    supplier_id: Number(parsed.supplier_id ?? current.supplier_id),
    stock: afterStock,
    initial_stock: afterStock,
    minimum_stock: Number(parsed.minimum_stock ?? current.minimum_stock),
    barcode: parsed.barcode ?? current.barcode,
    image_url: parsed.image_url || current.image_url,
  };
  if (beforeStock !== afterStock) {
    createStockHistoryEntry(db, {
      product_id: current.id,
      type: 'manual_adjustment',
      quantity: afterStock - beforeStock,
      before_stock: beforeStock,
      after_stock: afterStock,
      reference: `EDIT-${current.sku}`,
      note: 'Stok disesuaikan dari form edit produk',
    });
  }
  createAuditEntry(db, {
    action: 'update',
    entity_type: 'product',
    entity_id: current.id,
    entity_label: db.products[index].name,
    description: 'Data produk diperbarui.',
    meta: {
      sku: db.products[index].sku,
    },
  });
  writeDb(db);
  return { data: enrichProduct(db, db.products[index]) };
}

export async function mockDeleteProduct(id) {
  const db = readDb();
  const product = db.products.find((item) => Number(item.id) === Number(id));
  db.products = db.products.filter((item) => Number(item.id) !== Number(id));
  if (product) {
    createAuditEntry(db, {
      action: 'delete',
      entity_type: 'product',
      entity_id: product.id,
      entity_label: product.name,
      description: 'Produk dihapus dari inventaris.',
      meta: {
        sku: product.sku,
      },
    });
  }
  writeDb(db);
  return { success: true };
}

export async function mockGetSuppliers() {
  const db = readDb();
  return { data: db.suppliers };
}

export async function mockCreateSupplier(payload) {
  const db = readDb();
  const supplier = { id: createId(), ...payload };
  db.suppliers.unshift(supplier);
  createAuditEntry(db, {
    action: 'create',
    entity_type: 'supplier',
    entity_id: supplier.id,
    entity_label: supplier.name,
    description: 'Supplier baru ditambahkan.',
  });
  writeDb(db);
  return { data: supplier };
}

export async function mockUpdateSupplier(id, payload) {
  const db = readDb();
  const index = db.suppliers.findIndex((item) => Number(item.id) === Number(id));
  if (index !== -1) {
    db.suppliers[index] = { ...db.suppliers[index], ...payload };
    createAuditEntry(db, {
      action: 'update',
      entity_type: 'supplier',
      entity_id: db.suppliers[index].id,
      entity_label: db.suppliers[index].name,
      description: 'Data supplier diperbarui.',
    });
    writeDb(db);
  }
  return { data: db.suppliers[index] };
}

export async function mockDeleteSupplier(id) {
  const db = readDb();
  const supplier = db.suppliers.find((item) => Number(item.id) === Number(id));
  const isUsedByProduct = db.products.some((item) => Number(item.supplier_id) === Number(id));

  if (isUsedByProduct) {
    throw createMockError('Supplier masih digunakan oleh produk dan tidak bisa dihapus.');
  }

  db.suppliers = db.suppliers.filter((item) => Number(item.id) !== Number(id));
  if (supplier) {
    createAuditEntry(db, {
      action: 'delete',
      entity_type: 'supplier',
      entity_id: supplier.id,
      entity_label: supplier.name,
      description: 'Supplier dihapus.',
    });
  }
  writeDb(db);
  return { success: true };
}

export async function mockGetCategories() {
  const db = readDb();
  return { data: db.categories };
}

export async function mockCreateCategory(payload) {
  const db = readDb();
  const category = { id: createId(), ...payload };
  db.categories.unshift(category);
  createAuditEntry(db, {
    action: 'create',
    entity_type: 'category',
    entity_id: category.id,
    entity_label: category.name,
    description: 'Kategori baru ditambahkan.',
  });
  writeDb(db);
  return { data: category };
}

export async function mockUpdateCategory(id, payload) {
  const db = readDb();
  const index = db.categories.findIndex((item) => Number(item.id) === Number(id));
  if (index !== -1) {
    db.categories[index] = { ...db.categories[index], ...payload };
    createAuditEntry(db, {
      action: 'update',
      entity_type: 'category',
      entity_id: db.categories[index].id,
      entity_label: db.categories[index].name,
      description: 'Kategori diperbarui.',
    });
    writeDb(db);
  }
  return { data: db.categories[index] };
}

export async function mockDeleteCategory(id) {
  const db = readDb();
  const category = db.categories.find((item) => Number(item.id) === Number(id));
  const isUsedByProduct = db.products.some((item) => Number(item.category_id) === Number(id));

  if (isUsedByProduct) {
    throw createMockError('Kategori masih digunakan oleh produk dan tidak bisa dihapus.');
  }

  db.categories = db.categories.filter((item) => Number(item.id) !== Number(id));
  if (category) {
    createAuditEntry(db, {
      action: 'delete',
      entity_type: 'category',
      entity_id: category.id,
      entity_label: category.name,
      description: 'Kategori dihapus.',
    });
  }
  writeDb(db);
  return { success: true };
}

export async function mockGetTransactionsIn() {
  const db = readDb();
  return { data: db.transactionsIn };
}

function itemQuantity(item = {}) {
  const sizeQuantities = item.size_quantities || {};
  return Object.keys(sizeQuantities).length
    ? Object.values(sizeQuantities).reduce((sum, value) => sum + Number(value || 0), 0)
    : Number(item.quantity || 0);
}

function applyStockDeltaForItems(db, items = [], direction = 1) {
  items.forEach((item) => {
    const product = db.products.find((entry) => Number(entry.id) === Number(item.product_id));
    if (!product) return;

    const sizeQuantities = item.size_quantities || {};
    const color = resolveMockItemColor(product, item);
    const quantity = itemQuantity(item);

    product.stock = Math.max(0, Number(product.stock || 0) + direction * quantity);

    if (Object.keys(sizeQuantities).length) {
      const bucket = ensureVariantBucket(product, color);
      Object.entries(sizeQuantities).forEach(([size, amount]) => {
        bucket[size] = Math.max(0, Number(bucket[size] || 0) + direction * Number(amount || 0));
      });
      product.color = colorSummaryFromStockBreakdown(product);
    }
  });
}

export async function mockDeleteTransactionIn(id) {
  const db = readDb();
  const transaction = db.transactionsIn.find((item) => Number(item.id) === Number(id) || String(item.transaction_no) === String(id));

  if (!transaction) {
    throw createMockError('Transaksi barang masuk tidak ditemukan.', 404);
  }

  applyStockDeltaForItems(db, transaction.items || [], -1);
  db.transactionsIn = db.transactionsIn.filter((item) => item !== transaction);
  db.digitalDocuments = (db.digitalDocuments || []).filter((document) => document.transaction_no !== transaction.transaction_no);
  db.stockHistory = (db.stockHistory || []).filter((history) => history.reference !== transaction.transaction_no);
  writeDb(db);

  return { data: transaction };
}

export async function mockGetDigitalDocuments(params = {}) {
  const db = readDb();
  const keyword = String(params.search || '').toLowerCase();
  let documents = [...db.digitalDocuments];

  if (params.document_type) {
    documents = documents.filter((document) => String(document.document_type) === String(params.document_type));
  }

  if (params.status) {
    documents = documents.filter((document) => String(document.status) === String(params.status));
  }

  if (keyword) {
    documents = documents.filter(
      (document) =>
        String(document.document_no || '').toLowerCase().includes(keyword) ||
        String(document.transaction_no || '').toLowerCase().includes(keyword) ||
        String(document.supplier_name || '').toLowerCase().includes(keyword) ||
        String(document.reference_no || '').toLowerCase().includes(keyword),
    );
  }

  return { data: paginate(documents, params.page, params.per_page || 12) };
}

export async function mockGetDigitalDocumentById(id) {
  const db = readDb();
  const document = db.digitalDocuments.find((item) => Number(item.id) === Number(id));
  return { data: document || null };
}

export async function mockCreateTransactionIn(payload) {
  const db = readDb();
  const items = payload.items || [];

  for (const item of items) {
    const product = db.products.find((entry) => Number(entry.id) === Number(item.product_id));
    const sizeQuantities = item.size_quantities || {};
    const quantity = Object.keys(sizeQuantities).length
      ? Object.values(sizeQuantities).reduce((sum, value) => sum + Number(value || 0), 0)
      : Number(item.quantity || 0);
    const purchasePrice = Number(item.purchase_price || 0);

    if (!product) {
      throw createMockError('Produk transaksi masuk tidak ditemukan.');
    }

    if (quantity <= 0) {
      throw createMockError('Jumlah barang masuk harus lebih dari 0.');
    }

    if (purchasePrice < 0) {
      throw createMockError('Harga beli tidak boleh negatif.');
    }
  }

  items.forEach((item) => {
    const product = db.products.find((entry) => Number(entry.id) === Number(item.product_id));
    if (product) {
      const beforeStock = Number(product.stock || 0);
      const sizeQuantities = item.size_quantities || {};
      const color = resolveMockItemColor(product, item);
      const quantity = Object.keys(sizeQuantities).length
        ? Object.values(sizeQuantities).reduce((sum, value) => sum + Number(value || 0), 0)
        : Number(item.quantity ?? 0);
      product.stock = beforeStock + quantity;
      if (Object.keys(sizeQuantities).length) {
        const bucket = ensureVariantBucket(product, color);
        Object.entries(sizeQuantities).forEach(([size, amount]) => {
          bucket[size] = Number(bucket[size] || 0) + Number(amount || 0);
        });
        product.color = colorSummaryFromStockBreakdown(product);
      }
      createStockHistoryEntry(db, {
        product_id: product.id,
        type: 'stock_in',
        quantity,
        before_stock: beforeStock,
        after_stock: product.stock,
        reference: `IN-${Date.now()}`,
        note: 'Barang masuk dari transaksi restock',
      });
    }
  });

  const normalizedItems = items.map((item) => {
    const product = db.products.find((entry) => Number(entry.id) === Number(item.product_id));

    return enrichTransactionItemSnapshot(db, {
      ...item,
      size: item.size || sizeLabelFromQuantities(item.size_quantities) || null,
      product_name: item.product_name || product?.name || '',
      sku: item.sku || product?.sku || '',
      barcode: item.barcode || product?.barcode || '',
      color: resolveMockItemColor(product, item),
      quantity: item.size_quantities
        ? Object.values(item.size_quantities).reduce((sum, value) => sum + Number(value || 0), 0)
        : Number(item.quantity || 0),
      purchase_price: Number(item.purchase_price || 0),
      condition_status: normalizeConditionStatus(item.condition_status || item.condition),
      condition_note: normalizeConditionNote(item),
    });
  });

  const transaction = {
    id: createId(),
    transaction_no: `IN-${Date.now()}`,
    supplier_id: Number(payload.supplier_id),
    supplier_name: supplierName(db, payload.supplier_id),
    date: normalizeDate(payload.date),
    notes: payload.notes || '',
    inbound_status: normalizeInboundStatus(payload.inbound_status || payload.status),
    total_items: normalizedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    total_amount: normalizedItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.purchase_price || 0), 0),
    items: normalizedItems,
  };

  db.transactionsIn.unshift(transaction);
  ['GRN', 'SURAT_JALAN', 'FAKTUR'].forEach((type) => {
    db.digitalDocuments.unshift(buildInboundDocument(transaction, type));
  });
  items.forEach((item) => {
    const product = db.products.find((entry) => Number(entry.id) === Number(item.product_id));
    if (product) {
      const latestHistory = db.stockHistory.find(
        (history) => Number(history.product_id) === Number(product.id) && history.reference.startsWith('IN-'),
      );
      if (latestHistory) {
        latestHistory.reference = transaction.transaction_no;
      }
    }
  });
  createAuditEntry(db, {
    action: 'transaction_in',
    entity_type: 'transaction_in',
    entity_id: transaction.id,
    entity_label: transaction.transaction_no,
    description: 'Transaksi barang masuk disimpan.',
    meta: {
      total_items: transaction.total_items,
      documents: ['GRN', 'SURAT_JALAN', 'FAKTUR'],
    },
  });
  writeDb(db);
  return { data: transaction };
}

export async function mockGetTransactionsOut() {
  const db = readDb();
  return { data: db.transactionsOut };
}

export async function mockDeleteTransactionOut(id) {
  const db = readDb();
  const transaction = db.transactionsOut.find((item) => Number(item.id) === Number(id) || String(item.transaction_no) === String(id));

  if (!transaction) {
    throw createMockError('Transaksi barang keluar tidak ditemukan.', 404);
  }

  applyStockDeltaForItems(db, transaction.items || [], 1);
  db.transactionsOut = db.transactionsOut.filter((item) => item !== transaction);
  db.stockHistory = (db.stockHistory || []).filter((history) => history.reference !== transaction.transaction_no);
  writeDb(db);

  return { data: transaction };
}

export async function mockCreateTransactionOut(payload) {
  const db = readDb();
  const items = payload.items || [];

  for (const item of items) {
    const product = db.products.find((entry) => Number(entry.id) === Number(item.product_id));
    const sizeQuantities = item.size_quantities || {};
    const quantity = Object.keys(sizeQuantities).length
      ? Object.values(sizeQuantities).reduce((sum, value) => sum + Number(value || 0), 0)
      : Number(item.quantity || 0);

    if (!product) {
      throw createMockError('Produk transaksi keluar tidak ditemukan.');
    }

    if (quantity <= 0) {
      throw createMockError('Jumlah barang keluar harus lebih dari 0.');
    }

    if (quantity > Number(product.stock || 0)) {
      throw createMockError(`Stok produk ${product.name} tidak mencukupi.`);
    }

    Object.entries(sizeQuantities).forEach(([size, amount]) => {
      const color = resolveMockItemColor(product, item);
      if (Number(amount || 0) > variantStock(product, color, size)) {
        throw createMockError(`Stok warna ${color || 'Tanpa warna'} ukuran ${size} untuk ${product.name} tidak mencukupi.`);
      }
    });
  }

  items.forEach((item) => {
    const product = db.products.find((entry) => Number(entry.id) === Number(item.product_id));
    if (product) {
      const beforeStock = Number(product.stock || 0);
      const sizeQuantities = item.size_quantities || {};
      const color = resolveMockItemColor(product, item);
      const quantity = Object.keys(sizeQuantities).length
        ? Object.values(sizeQuantities).reduce((sum, value) => sum + Number(value || 0), 0)
        : Number(item.quantity || 0);
      product.stock = Math.max(0, beforeStock - quantity);
      product.sold_count = Number(product.sold_count || 0) + quantity;
      if (Object.keys(sizeQuantities).length) {
        const bucket = ensureVariantBucket(product, color);
        Object.entries(sizeQuantities).forEach(([size, amount]) => {
          bucket[size] = Math.max(0, Number(bucket[size] || 0) - Number(amount || 0));
        });
        product.color = colorSummaryFromStockBreakdown(product);
      }
      createStockHistoryEntry(db, {
        product_id: product.id,
        type: 'stock_out',
        quantity: -quantity,
        before_stock: beforeStock,
        after_stock: product.stock,
        reference: `OUT-${Date.now()}`,
        note: `Barang keluar (${item.method})`,
      });
    }
  });

  const normalizedItems = items.map((item) => {
    const product = db.products.find((entry) => Number(entry.id) === Number(item.product_id));
    const sizeQuantities = item.size_quantities || {};
    const quantity = Object.keys(sizeQuantities).length
      ? Object.values(sizeQuantities).reduce((sum, value) => sum + Number(value || 0), 0)
      : Number(item.quantity || 0);

    return enrichTransactionItemSnapshot(db, {
      ...item,
      size: item.size || sizeLabelFromQuantities(sizeQuantities) || null,
      product_name: item.product_name || product?.name || '',
      sku: item.sku || product?.sku || '',
      barcode: item.barcode || product?.barcode || '',
      color: resolveMockItemColor(product, item),
      quantity,
    });
  });

  const transaction = {
    id: createId(),
    transaction_no: `OUT-${Date.now()}`,
    date: normalizeDate(payload.date),
    notes: payload.notes || '',
    total_items: normalizedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    method_summary: Array.from(new Set(normalizedItems.map((item) => item.method))).join(', '),
    items: normalizedItems,
  };

  db.transactionsOut.unshift(transaction);
  items.forEach((item) => {
    const product = db.products.find((entry) => Number(entry.id) === Number(item.product_id));
    if (product) {
      const latestHistory = db.stockHistory.find(
        (history) => Number(history.product_id) === Number(product.id) && history.reference.startsWith('OUT-'),
      );
      if (latestHistory) {
        latestHistory.reference = transaction.transaction_no;
      }
    }
  });
  createAuditEntry(db, {
    action: 'transaction_out',
    entity_type: 'transaction_out',
    entity_id: transaction.id,
    entity_label: transaction.transaction_no,
    description: 'Transaksi barang keluar diproses.',
    meta: {
      total_items: transaction.total_items,
    },
  });
  writeDb(db);
  return { data: transaction };
}

export async function mockGetStockOpname() {
  const db = readDb();
  return { data: db.stockOpnameSessions };
}

export async function mockStartStockOpname() {
  const db = readDb();
  const existingSession = db.stockOpnameSessions.find((item) =>
    ['open', 'paused', 'review'].includes(String(item.status || '')),
  );

  if (existingSession) {
    throw createMockError('Masih ada sesi stock opname aktif yang belum diselesaikan.');
  }

  const session = {
    id: createId(),
    session_no: `OPN-${Date.now()}`,
    status: 'open',
    created_at: `${today()} 09:00:00`,
    finalized_at: null,
    summary: {
      total_scanned: 0,
      matched: 0,
      discrepancy: 0,
    },
    items: [],
  };
  db.stockOpnameSessions.unshift(session);
  createAuditEntry(db, {
    action: 'stock_opname_start',
    entity_type: 'stock_opname',
    entity_id: session.id,
    entity_label: session.session_no,
    description: 'Sesi stock opname baru dimulai.',
  });
  writeDb(db);
  return { data: session };
}

export async function mockScanStockOpname(id, payload) {
  const db = readDb();
  const session = db.stockOpnameSessions.find((item) => Number(item.id) === Number(id));
  const product = db.products.find(
    (item) =>
      String(item.barcode || '').toLowerCase() === String(payload.barcode || '').toLowerCase() ||
      String(item.sku || '').toLowerCase() === String(payload.barcode || '').toLowerCase(),
  );

  if (!session) {
    throw createMockError('Sesi stock opname tidak ditemukan.', 404);
  }

  if (!product) {
    throw createMockError('Produk dengan barcode atau SKU tersebut tidak ditemukan.', 404);
  }

  if (['closed'].includes(String(session.status || ''))) {
    throw createMockError('Sesi stock opname yang sudah selesai tidak bisa diubah lagi.');
  }

  const duplicateItem = session.items.find((item) => Number(item.product_id) === Number(product.id));
  if (duplicateItem) {
    throw createMockError('Produk ini sudah tercatat dalam sesi stock opname yang sama.');
  }

  const difference = Number(payload.physical_stock || 0) - Number(product.stock || 0);
  const reason = payload.reason || (difference > 0 ? 'Perlu di data ulang' : '');
  session.status = session.status === 'paused' ? 'open' : session.status;
  session.items.unshift({
    barcode: product.barcode,
    product_id: product.id,
    product_name: product.name,
    size: product.size || '-',
    color: product.color || '',
    size_stocks: stockRowsFromBreakdown(product),
    size_summary: sizeStockSummary(product),
    system_stock: product.stock,
    physical_stock: Number(payload.physical_stock || 0),
    difference,
    reason,
  });
  session.summary = {
    total_scanned: session.items.length,
    matched: session.items.filter((item) => Number(item.difference) === 0).length,
    discrepancy: session.items.filter((item) => Number(item.difference) !== 0).length,
  };
  createAuditEntry(db, {
    action: 'stock_opname_scan',
    entity_type: 'stock_opname',
    entity_id: session.id,
    entity_label: session.session_no,
    description: `Scan opname untuk produk ${product.name}.`,
    meta: {
      sku: product.sku,
    },
  });
  writeDb(db);

  return { data: session };
}

export async function mockAdjustStockOpname(id) {
  const db = readDb();
  const session = db.stockOpnameSessions.find((item) => Number(item.id) === Number(id));

  if (!session) {
    throw createMockError('Sesi stock opname tidak ditemukan.', 404);
  }

  if (!session.items.length) {
    throw createMockError('Belum ada item opname yang bisa disesuaikan.');
  }

  if (String(session.status || '') === 'closed') {
    throw createMockError('Sesi stock opname ini sudah ditutup.');
  }

  if (session) {
    session.items.forEach((item) => {
      const product = db.products.find((entry) => Number(entry.id) === Number(item.product_id));
      if (product) {
        const beforeStock = Number(product.stock || 0);
        product.stock = Number(item.physical_stock || 0);
        createStockHistoryEntry(db, {
          product_id: product.id,
          type: 'stock_opname_adjustment',
          quantity: product.stock - beforeStock,
          before_stock: beforeStock,
          after_stock: product.stock,
          reference: session.session_no,
          note: item.reason || 'Penyesuaian dari stock opname',
        });
      }
    });
    session.status = 'closed';
    createAuditEntry(db, {
      action: 'stock_opname_adjust',
      entity_type: 'stock_opname',
      entity_id: session.id,
      entity_label: session.session_no,
      description: 'Penyesuaian stok dari hasil opname diterapkan.',
      meta: {
        discrepancy: session.summary?.discrepancy || 0,
      },
    });
    writeDb(db);
  }

  return { data: session };
}

export async function mockGetDashboard() {
  const db = readDb();
  return { data: buildDashboard(db) };
}

export async function mockGetReport(type, filters) {
  const db = readDb();
  return { data: createReport(db, type, filters) };
}

export async function mockExportReport(type, kind, filters) {
  const report = await mockGetReport(type, filters);
  const serialized = JSON.stringify(report.data, null, 2);
  const mime = kind === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return new Blob([serialized], { type: mime });
}

export async function mockGetSettings() {
  const db = readDb();
  return { data: db.settings };
}

export async function mockUpdateSettings(payload) {
  const db = readDb();
  db.settings = {
    ...db.settings,
    ...payload,
    sizes: Array.isArray(payload.sizes) ? normalizeSettingsSizes(payload.sizes) : db.settings.sizes,
  };
  createAuditEntry(db, {
    action: 'settings_update',
    entity_type: 'settings',
    entity_id: 1,
    entity_label: 'System Settings',
    description: 'Pengaturan sistem diperbarui.',
  });
  writeDb(db);
  return { data: db.settings };
}

export async function mockBackupSettings() {
  const db = readDb();
  const blob = new Blob([JSON.stringify({ settings: db.settings }, null, 2)], { type: 'application/json' });
  return { data: blob };
}

export async function mockRestoreSettings(file) {
  if (!file) {
    return { data: null };
  }

  const text = await file.text();
  const parsed = JSON.parse(text);
  const settings = parsed.settings || parsed;
  const db = readDb();
  db.settings = {
    ...db.settings,
    minimum_stock: settings.minimum_stock ?? 5,
    barcode_format: settings.barcode_format ?? 'CODE128',
    currency: settings.currency ?? 'IDR',
    sizes: normalizeSettingsSizes(settings.sizes),
  };
  writeDb(db);
  return { data: db.settings };
}

export async function mockGetAuditLogs(params = {}) {
  return { data: paginate([], params.page, params.per_page || 15) };
}

export async function mockGetProductStockHistory(productId) {
  const db = readDb();
  const stock_history = db.stockHistory.filter((item) => Number(item.product_id) === Number(productId));
  return { data: { stock_history } };
}

export function resetMockDatabase() {
  writeDb(clone(sampleDatabase));
}
