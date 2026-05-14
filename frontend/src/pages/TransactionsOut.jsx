import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, RotateCcw, Trash2 } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import SearchableSelect from '../components/ui/SearchableSelect';
import Table from '../components/ui/Table';
import categoryService from '../services/categoryService';
import productService from '../services/productService';
import { getErrorMessage } from '../services/serviceUtils';
import transactionService from '../services/transactionService';
import {
  getProductVariantColors,
  getProductVariantStocks,
} from '../utils/productVariant';
import { summarizeSizeQuantities } from '../utils/transactionItemSummary';
import { useSettings } from '../context/SettingsContext';
import {
  applyHistoryDateFilter,
  createHistoryFilter,
  historyFilterLabel,
  historyMonthOptions,
  historyYearOptions,
} from '../utils/historyDateFilter';

const initialItemForm = { product_id: '', color: '', size: '', quantity: 1, method: 'Penjualan' };
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Allsize'];
const OUT_DETAIL_CACHE_KEY = 'natakala_out_detail_cache';

const sortProductsByName = (products) =>
  [...(products || [])].sort((first, second) => String(first.name || '').localeCompare(String(second.name || '')));

function numberFrom(...values) {
  const value = values.find((entry) => entry !== undefined && entry !== null && entry !== '');
  return Number(value || 0);
}

function transactionItems(transaction = {}) {
  return transaction.items || transaction.transaction_items || transaction.details || transaction.products || [];
}

function itemProductLabel(item = {}) {
  const sku = item.sku || item.product_sku || '';
  const name = item.product_name || item.name || item.product || item.item_name || '-';
  return [sku, name].filter(Boolean).join(' - ') || '-';
}

function itemColorLabel(item = {}, product = {}) {
  return (
    item.color ||
    item.product_color ||
    item.colour ||
    item.variant_color ||
    product.color ||
    product.product_color ||
    '-'
  );
}

function findProductForItem(products = [], item = {}) {
  return products.find(
    (product) =>
      String(product.id || '') === String(item.product_id || item.id_product || '') ||
      String(product.sku || '') === String(item.sku || item.product_sku || '') ||
      String(product.name || '') === String(item.product_name || item.name || item.product || ''),
  );
}

function productSizeLabel(product = {}) {
  const variants = getProductVariantStocks(product)
    .map((variant) => variant.size)
    .filter(Boolean);
  const sizes = Array.from(new Set(variants));
  if (sizes.length) return sizes.join(', ');
  return product.size || product.product_size || product.size_summary || '';
}

function itemSizeLabel(item = {}, product = {}) {
  const hasSizeQuantities = Object.values(item.size_quantities || {}).some((quantity) => Number(quantity || 0) > 0);
  if (hasSizeQuantities) return summarizeSizeQuantities(item.size_quantities, '-');

  return (
    item.size ||
    item.product_size ||
    item.variant_size ||
    item.size_name ||
    item.size_summary ||
    productSizeLabel(product) ||
    '-'
  );
}

function readOutDetailCache() {
  try {
    return JSON.parse(localStorage.getItem(OUT_DETAIL_CACHE_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

function writeOutDetailCache(cache) {
  localStorage.setItem(OUT_DETAIL_CACHE_KEY, JSON.stringify(cache));
}

function cacheTransactionItems(transactionNo, items = []) {
  if (!transactionNo || !items.length) return;
  const cache = readOutDetailCache();
  cache[transactionNo] = items;
  writeOutDetailCache(cache);
}

function mergeHistoryWithCachedItems(transactions = []) {
  const cache = readOutDetailCache();

  return transactions.map((transaction) => {
    if (transactionItems(transaction).length || !cache[transaction.transaction_no]?.length) return transaction;

    return {
      ...transaction,
      items: cache[transaction.transaction_no],
    };
  });
}

export default function TransactionsOut() {
  const { settings } = useSettings();
  const availableSizes = settings?.sizes?.length ? settings.sizes : DEFAULT_SIZES;
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productFilters, setProductFilters] = useState({ category_id: '', color: '' });
  const [form, setForm] = useState({ date: '', notes: '', items: [] });
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [saving, setSaving] = useState(false);
  const [editingHistory, setEditingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [historyFilter, setHistoryFilter] = useState(createHistoryFilter);
  const historyYears = useMemo(() => historyYearOptions(), []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const [categoryResponse, historyResponse, productResponse] = await Promise.all([
        categoryService.getAll(),
        transactionService.getTransactionsOut(),
        productService.getAll({ page: 1, per_page: 1000 }),
      ]);
      setCategories(categoryResponse.data || []);
      setHistory(mergeHistoryWithCachedItems(historyResponse.data || []));
      setProductOptions(sortProductsByName(productResponse.data));
    } catch (error) {
      const message = getErrorMessage(error, 'Gagal memuat transaksi keluar.');
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const selectProduct = (productId) => {
    const product = productOptions.find((item) => String(item.id) === String(productId));
    setSelectedProduct(product || null);
    setItemForm((prev) => ({
      ...prev,
      product_id: productId,
      color: product?.color || '',
      size: product?.size || '',
      quantity: 1,
    }));
  };

  const categoryFilteredProductOptions = useMemo(
    () =>
      productOptions.filter(
        (product) => !productFilters.category_id || String(product.category_id) === String(productFilters.category_id),
      ),
    [productFilters.category_id, productOptions],
  );

  const colorOptions = useMemo(() => {
    const colors = categoryFilteredProductOptions.map((p) => p.color).filter(Boolean);
    return Array.from(new Set(colors)).sort((a, b) => String(a).localeCompare(String(b)));
  }, [categoryFilteredProductOptions]);

  const filteredProductOptions = useMemo(
    () =>
      categoryFilteredProductOptions.filter((product) => {
        const colorMatch = !productFilters.color || product.color === productFilters.color;
        return colorMatch;
      }),
    [categoryFilteredProductOptions, productFilters.color],
  );

  useEffect(() => {
    if (!productFilters.color || colorOptions.includes(productFilters.color)) return;
    setProductFilters((prev) => ({ ...prev, color: '' }));
  }, [colorOptions, productFilters.color]);

  const handleProductFilterChange = (event) => {
    const { name, value } = event.target;
    setProductFilters((prev) => ({ ...prev, [name]: value }));
    setSelectedProduct(null);
    setItemForm((prev) => ({ ...prev, product_id: '', size: '' }));
  };

  const addItem = () => {
    if (!selectedProduct) {
      toast.error('Pilih produk terlebih dahulu.');
      return;
    }

    const quantity = Number(itemForm.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Jumlah keluar harus lebih dari 0.');
      return;
    }

    if (quantity > Number(selectedProduct.stock || 0)) {
      toast.error('Stok produk tidak mencukupi.');
      return;
    }

    if (
      form.items.some(
        (item) => String(item.product_id) === String(selectedProduct.id)
      )
    ) {
      toast.error('Produk yang sama sudah ada di daftar transaksi.');
      return;
    }

    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          sku: selectedProduct.sku,
          barcode: selectedProduct.barcode,
          available_stock: selectedProduct.stock,
          color: selectedProduct.color || '',
          product_color: selectedProduct.color || '',
          colour: selectedProduct.color || '',
          variant_color: selectedProduct.color || '',
          size: selectedProduct.size || '',
          product_size: selectedProduct.size || '',
          variant_size: selectedProduct.size || '',
          quantity,
          method: itemForm.method,
        },
      ],
    }));
    setItemForm(initialItemForm);
    setSelectedProduct(null);
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.items.length) {
      toast.error('Tambahkan minimal satu item transaksi.');
      return;
    }

    try {
      setSaving(true);
      const submittedForm = form;
      const response = await transactionService.createTransactionOut(form);
      toast.success('Transaksi barang keluar berhasil disimpan.');
      setForm({ date: '', notes: '', items: [] });
      cacheTransactionItems(response.data?.transaction_no, submittedForm.items);
      setHistory((prev) => [
        {
          ...response.data,
          items: transactionItems(response.data || {}).length ? transactionItems(response.data) : submittedForm.items,
          total_items: numberFrom(
            response.data?.total_items,
            submittedForm.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
          ),
          method_summary:
            response.data?.method_summary ||
            Array.from(new Set(submittedForm.items.map((item) => item.method).filter(Boolean))).join(', '),
        },
        ...prev,
      ]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menyimpan transaksi keluar.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteHistory = async (row) => {
    const targetId = row.transaction_id || row.transaction_no;
    if (!targetId) return;

    try {
      setDeletingId(targetId);
      await transactionService.deleteTransactionOut(targetId);
      setHistory((prev) =>
        prev.filter((transaction) => String(transaction.id) !== String(targetId) && transaction.transaction_no !== targetId),
      );
      toast.success('Transaksi barang keluar berhasil dihapus.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menghapus transaksi barang keluar.'));
    } finally {
      setDeletingId('');
    }
  };

  const historyRows = useMemo(
    () =>
      (history || []).flatMap((transaction) => {
        const items = transactionItems(transaction).length
          ? transactionItems(transaction)
          : [
              {
                product_name: transaction.product_name || transaction.product || transaction.item_summary || 'Data lama - detail produk belum tersimpan',
                size: transaction.size || transaction.size_summary || 'Data lama',
                color: transaction.color || transaction.product_color || 'Data lama',
                quantity: numberFrom(transaction.quantity, transaction.total_items),
                method: transaction.method || transaction.method_summary || '-',
              },
            ];

        return items.map((item, index) => {
          const product = findProductForItem(productOptions, item);

          return {
            id: `${transaction.id || transaction.transaction_no}-${item.product_id || item.sku || index}`,
            transaction_id: transaction.id,
            transaction_no: transaction.transaction_no,
            date: transaction.date,
            total_items: numberFrom(transaction.total_items, transaction.quantity),
            product: itemProductLabel(item),
            size: itemSizeLabel(item, product),
            color: itemColorLabel(item, product),
            quantity: numberFrom(item.quantity, transaction.total_items),
            method: item.method || transaction.method || transaction.method_summary || '-',
            available_stock: numberFrom(item.available_stock, item.stock_before, product?.stock),
            notes: transaction.notes || '',
          };
        });
      }),
    [history, productOptions],
  );

  const filteredHistoryRows = useMemo(
    () => applyHistoryDateFilter(historyRows, historyFilter),
    [historyRows, historyFilter],
  );

  const historyColumns = useMemo(
    () => [
      { key: 'transaction_no', title: 'No. Transaksi', render: (row) => <span className="whitespace-nowrap">{row.transaction_no}</span> },
      { key: 'date', title: 'Tanggal' },
      { key: 'group_label', title: 'Kelompok', render: (row) => <span className="block min-w-[150px]">{row.group_label}</span> },
      { key: 'total_items', title: 'Total Item', render: (row) => `${row.total_items} pcs` },
      { key: 'product', title: 'Produk', render: (row) => <span className="block min-w-[220px]">{row.product}</span> },
      { key: 'size', title: 'Ukuran', render: (row) => <span className="block min-w-[100px]">{row.size}</span> },
      { key: 'color', title: 'Warna' },
      {
        key: 'quantity',
        title: 'Qty Keluar',
        render: (row) => `${row.quantity} pcs`,
      },
      { key: 'method', title: 'Metode Keluar' },
      { key: 'notes', title: 'Catatan', render: (row) => <span className="block min-w-[160px]">{row.notes || '-'}</span> },
      ...(editingHistory
        ? [
            {
              key: 'actions',
              title: 'Aksi',
              render: (row) => (
                <Button
                  variant="danger"
                  className="px-3 py-2 text-xs"
                  loading={String(deletingId) === String(row.transaction_id || row.transaction_no)}
                  onClick={() => deleteHistory(row)}
                >
                  <Trash2 size={14} />
                  Hapus
                </Button>
              ),
            },
          ]
        : []),
    ],
    [editingHistory, deletingId],
  );

  const lowStockWarning = selectedProduct && Number(selectedProduct.stock) <= Number(selectedProduct.minimum_stock || 5);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-2xl font-bold text-ink">Input Barang Keluar</h3>
        <p className="mt-1 text-sm text-muted">Validasi stok dilakukan di frontend sebelum data dikirim ke backend.</p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Tanggal" type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
            <Input label="Catatan" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Penjualan, transfer, sampel, atau rusak" />
          </div>

          <div className="rounded-[28px] border border-line bg-white p-5">
            <h4 className="text-lg font-bold text-ink">Tambah Item Keluar</h4>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <SearchableSelect
                label="Filter Kategori"
                name="category_id"
                value={productFilters.category_id}
                onChange={handleProductFilterChange}
                options={categories.map((category) => ({ value: category.id, label: category.name }))}
                placeholder="Semua kategori"
              />
              <SearchableSelect
                label="Filter Warna"
                name="color"
                value={productFilters.color}
                onChange={handleProductFilterChange}
                options={colorOptions.map((color) => ({ value: color, label: color }))}
                placeholder="Semua warna"
              />
              <SearchableSelect
                label="Cari Produk"
                name="product_id"
                value={itemForm.product_id}
                onChange={(e) => selectProduct(e.target.value)}
                options={filteredProductOptions.map((product) => ({
                  value: product.id,
                  label: `${product.sku} - ${product.name} - ${product.size} - ${product.color}`,
                }))}
                placeholder="Pilih nama produk"
              />
              <Input label="SKU" value={selectedProduct?.sku || ''} readOnly className="bg-surface text-muted" />
              <Input label="Barcode" value={selectedProduct?.barcode || ''} readOnly className="bg-surface text-muted" />
              <Input label="Warna" value={selectedProduct?.color || ''} readOnly className="bg-surface text-muted" />
              <Input label="Ukuran" value={selectedProduct?.size || ''} readOnly className="bg-surface text-muted" />
              <Input
                label="Jumlah Keluar"
                type="number"
                min="1"
                max={selectedProduct?.stock ?? undefined}
                value={itemForm.quantity}
                onChange={(e) => setItemForm((prev) => ({ ...prev, quantity: e.target.value }))}
              />
              <SearchableSelect
                label="Metode Keluar"
                name="method"
                value={itemForm.method}
                onChange={(e) => setItemForm((prev) => ({ ...prev, method: e.target.value }))}
                options={[
                  { value: 'Penjualan', label: 'Penjualan' },
                  { value: 'Transfer cabang', label: 'Transfer cabang' },
                  { value: 'Sampel', label: 'Sampel' },
                  { value: 'Rusak', label: 'Rusak' },
                ]}
                placeholder="Pilih metode"
              />
            </div>

            {selectedProduct ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-canvas px-4 py-3">
                <Badge tone={lowStockWarning ? 'warning' : 'success'}>
                  Stok tersedia: {selectedProduct.stock || 0}
                </Badge>
                <Badge tone="muted">Warna: {selectedProduct.color || 'Tanpa warna'}</Badge>
                <Badge tone="muted">Ukuran: {selectedProduct.size || '-'}</Badge>
                {lowStockWarning ? <Badge tone="danger">Peringatan stok minimum</Badge> : null}
              </div>
            ) : null}

            <div className="mt-4">
              <Button type="button" onClick={addItem}>
                Tambahkan ke Transaksi
              </Button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-2">Produk</th>
                    <th className="py-2">Ukuran</th>
                    <th className="py-2">Stok</th>
                    <th className="py-2">Warna</th>
                    <th className="py-2">Qty Keluar</th>
                    <th className="py-2">Metode</th>
                    <th className="py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => (
                    <tr key={`${item.product_id}-${index}`} className="border-t border-line">
                      <td className="py-3">{item.sku} - {item.product_name}</td>
                      <td className="py-3">{item.size || '-'}</td>
                      <td className="py-3">
                        <span className="block">{item.available_stock}</span>
                      </td>
                      <td className="py-3">{item.color || '-'}</td>
                      <td className="py-3">{item.quantity}</td>
                      <td className="py-3">{item.method}</td>
                      <td className="py-3">
                        <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => removeItem(index)}>
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Button type="submit" loading={saving}>
            Simpan Transaksi Keluar
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMessage}
          </div>
        ) : null}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-bold text-ink">Riwayat Barang Keluar</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={loadHistory} loading={loading}>
              <RotateCcw size={15} />
              Refresh
            </Button>
            <Button variant={editingHistory ? 'warning' : 'secondary'} onClick={() => setEditingHistory((prev) => !prev)}>
              <Pencil size={15} />
              {editingHistory ? 'Selesai Edit' : 'Edit'}
            </Button>
          </div>
        </div>
        <div className="mb-4 rounded-[22px] border border-line bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              label="Kelompok Riwayat"
              as="select"
              value={historyFilter.mode}
              onChange={(event) => setHistoryFilter((prev) => ({ ...prev, mode: event.target.value }))}
            >
              <option value="all">Semua riwayat</option>
              <option value="date">Per tanggal</option>
              <option value="month">Per bulan & tahun</option>
            </Input>
            {historyFilter.mode === 'date' ? (
              <Input
                label="Tanggal"
                type="date"
                value={historyFilter.date}
                onChange={(event) => setHistoryFilter((prev) => ({ ...prev, date: event.target.value }))}
              />
            ) : null}
            {historyFilter.mode === 'month' ? (
              <>
                <Input
                  label="Bulan"
                  as="select"
                  value={historyFilter.month}
                  onChange={(event) => setHistoryFilter((prev) => ({ ...prev, month: event.target.value }))}
                >
                  {historyMonthOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Input>
                <Input
                  label="Tahun"
                  as="select"
                  value={historyFilter.year}
                  onChange={(event) => setHistoryFilter((prev) => ({ ...prev, year: event.target.value }))}
                >
                  {historyYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Input>
              </>
            ) : null}
            <div className="flex items-end">
              <div className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm font-semibold text-ink">
                {historyFilterLabel(historyFilter)} · {filteredHistoryRows.length} data
              </div>
            </div>
          </div>
        </div>
        <Table columns={historyColumns} data={filteredHistoryRows} loading={loading} emptyMessage="Belum ada transaksi barang keluar." />
      </Card>
    </div>
  );
}
