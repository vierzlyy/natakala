import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, RotateCcw, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import SearchableSelect from '../components/ui/SearchableSelect';
import CurrencyInput from '../components/ui/CurrencyInput';
import Table from '../components/ui/Table';
import categoryService from '../services/categoryService';
import productService from '../services/productService';
import supplierService from '../services/supplierService';
import transactionService from '../services/transactionService';
import documentService from '../services/documentService';
import { getErrorMessage } from '../services/serviceUtils';
import formatCurrency from '../utils/formatCurrency';
import { summarizeSizeQuantities } from '../utils/transactionItemSummary';
import { getProductVariantStocks } from '../utils/productVariant';
import { useSettings } from '../context/SettingsContext';
import {
  applyHistoryDateFilter,
  createHistoryFilter,
  historyFilterLabel,
  historyMonthOptions,
  historyYearOptions,
} from '../utils/historyDateFilter';

const initialItemForm = {
  product_id: '',
  color: '',
  size: '',
  quantity: 1,
  purchase_price: '',
  condition_status: 'Layak',
  condition_note: '',
};

const ALLSIZE_LABEL = 'Allsize';
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', ALLSIZE_LABEL];
const INBOUND_STATUSES = ['Barang Baru', 'Barang Return'];
const RETURN_CONDITIONS = ['Layak', 'Cacat', 'Ex-display', 'Rusak Ringan'];

const sortProductsByName = (products) =>
  [...(products || [])].sort((first, second) => String(first.name || '').localeCompare(String(second.name || '')));

function conditionLabel(item = {}) {
  return item.condition_status || item.condition || 'Layak';
}

function returnConditionTone(condition = 'Layak') {
  const normalized = String(condition || 'Layak').toLowerCase();

  if (normalized === 'cacat') return 'border-red-200 bg-red-50 text-red-800';
  if (normalized === 'ex-display') return 'border-orange-200 bg-orange-50 text-orange-800';
  if (normalized === 'rusak ringan') return 'border-yellow-200 bg-yellow-50 text-yellow-800';
  return 'border-[#eadfca] bg-[#f7f0e3] text-[#6f5532]';
}

function returnConditionBadgeTone(condition = 'Layak') {
  const normalized = String(condition || 'Layak').toLowerCase();

  if (normalized === 'cacat') return 'bg-red-100 text-red-800';
  if (normalized === 'ex-display') return 'bg-orange-100 text-orange-800';
  if (normalized === 'rusak ringan') return 'bg-yellow-100 text-yellow-800';
  return 'bg-[#efe3cf] text-[#6f5532]';
}

function returnConditionHighlight(condition = 'Layak') {
  const normalized = String(condition || 'Layak').toLowerCase();

  if (normalized === 'cacat') return 'bg-red-50/80 hover:bg-red-50';
  if (normalized === 'ex-display') return 'bg-orange-50/80 hover:bg-orange-50';
  if (normalized === 'rusak ringan') return 'bg-yellow-50/90 hover:bg-yellow-50';
  return 'bg-[#f7f0e3]/85 hover:bg-[#f7f0e3]';
}

function numberFrom(...values) {
  const value = values.find((entry) => entry !== undefined && entry !== null && entry !== '');
  return Number(value || 0);
}

function transactionStatus(transaction = {}) {
  return transaction.inbound_status || transaction.status || 'Barang Baru';
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
  if (hasSizeQuantities) {
    return summarizeSizeQuantities(item.size_quantities, '-');
  }

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

function documentPriority(documentType) {
  if (documentType === 'GRN') return 0;
  if (documentType === 'FAKTUR') return 1;
  return 2;
}

function mergeHistoryWithDocuments(transactions = [], documents = []) {
  const documentByTransaction = [...documents]
    .filter((document) => document.transaction_no && transactionItems(document).length)
    .sort((first, second) => documentPriority(first.document_type) - documentPriority(second.document_type))
    .reduce((map, document) => {
      if (!map.has(document.transaction_no)) {
        map.set(document.transaction_no, document);
      }
      return map;
    }, new Map());

  return transactions.map((transaction) => {
    if (transactionItems(transaction).length) return transaction;

    const document = documentByTransaction.get(transaction.transaction_no);
    if (!document) return transaction;

    return {
      ...transaction,
      items: transactionItems(document),
      total_items: numberFrom(transaction.total_items, document.total_items),
      total_amount: numberFrom(transaction.total_amount, document.total_amount),
    };
  });
}

export default function TransactionsIn() {
  const { settings } = useSettings();
  const availableSizes = settings?.sizes?.length ? settings.sizes : DEFAULT_SIZES;
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [history, setHistory] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productFilters, setProductFilters] = useState({ category_id: '', color: '' });
  const [form, setForm] = useState({ supplier_id: '', date: '', notes: '', inbound_status: 'Barang Baru', items: [] });
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [saving, setSaving] = useState(false);
  const [editingHistory, setEditingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [historyFilter, setHistoryFilter] = useState(createHistoryFilter);
  const historyYears = useMemo(() => historyYearOptions(), []);

  const loadInitial = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const [categoryResponse, supplierResponse, historyResponse, productResponse, documentResponse] = await Promise.all([
        categoryService.getAll(),
        supplierService.getAll(),
        transactionService.getTransactionsIn(),
        productService.getAll({ page: 1, per_page: 1000 }),
        documentService.getAll({ page: 1, per_page: 1000 }),
      ]);
      setCategories(categoryResponse.data || []);
      setSuppliers(supplierResponse.data || []);
      setHistory(mergeHistoryWithDocuments(historyResponse.data || [], documentResponse.data || []));
      setProductOptions(sortProductsByName(productResponse.data));
    } catch (error) {
      const message = getErrorMessage(error, 'Gagal memuat transaksi masuk.');
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const productSupplierId = (product) => product?.supplier_id ?? product?.supplier?.id ?? '';

  const resetCurrentItem = () => {
    setSelectedProduct(null);
    setItemForm((prev) => ({ ...prev, product_id: '', color: '', size: '', size_quantities: {}, purchase_price: '' }));
  };

  const handleSupplierChange = (event) => {
    const supplierId = event.target.value;

    setForm((prev) => {
      const sameSupplierItems = prev.items.filter((item) => String(item.supplier_id || '') === String(supplierId || ''));
      const shouldKeepItems = !supplierId || sameSupplierItems.length === prev.items.length;

      if (!shouldKeepItems) {
        toast('Item dari supplier berbeda sudah dibersihkan dari transaksi.');
      }

      return {
        ...prev,
        supplier_id: supplierId,
        items: shouldKeepItems ? prev.items : sameSupplierItems,
      };
    });

    resetCurrentItem();
  };

  const selectProduct = (productId) => {
    const product = productOptions.find((item) => String(item.id) === String(productId));
    const supplierId = productSupplierId(product);

    if (product && form.supplier_id && String(supplierId) !== String(form.supplier_id)) {
      toast.error('Produk ini tidak sesuai dengan supplier yang dipilih.');
      resetCurrentItem();
      return;
    }

    if (product && !form.supplier_id && supplierId) {
      setForm((prev) => ({ ...prev, supplier_id: supplierId }));
    }

    setSelectedProduct(product || null);
    setItemForm((prev) => ({
      ...prev,
      product_id: productId,
      color: product?.color || '',
      size: product?.size || '',
      quantity: 1,
      purchase_price: product?.purchase_price || prev.purchase_price,
    }));
  };

  const categoryFilteredProductOptions = useMemo(
    () =>
      productOptions.filter(
        (product) =>
          (!form.supplier_id || String(productSupplierId(product)) === String(form.supplier_id)) &&
          (!productFilters.category_id || String(product.category_id) === String(productFilters.category_id)),
      ),
    [form.supplier_id, productFilters.category_id, productOptions],
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
    setItemForm((prev) => ({ ...prev, product_id: '', size: '', size_quantities: {} }));
  };

  const isReturnInbound = form.inbound_status === 'Barang Return';

  const addItem = () => {
    const product = selectedProduct;

    if (!product) {
      toast.error('Pilih produk terlebih dahulu.');
      return;
    }

    const supplierId = productSupplierId(product);

    if (!supplierId) {
      toast.error('Produk ini belum memiliki supplier.');
      return;
    }

    if (form.supplier_id && String(supplierId) !== String(form.supplier_id)) {
      toast.error('Produk harus berasal dari supplier yang sama.');
      return;
    }

    const quantity = Number(itemForm.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Jumlah masuk harus lebih dari 0.');
      return;
    }

    if (Number(itemForm.purchase_price || product.purchase_price || 0) < 0) {
      toast.error('Harga beli tidak boleh negatif.');
      return;
    }

    if (
      form.items.some(
        (item) => String(item.product_id) === String(product.id)
      )
    ) {
      toast.error('Produk yang sama sudah ada di daftar transaksi.');
      return;
    }

    setForm((prev) => ({
      ...prev,
      supplier_id: prev.supplier_id || supplierId,
      items: [
        ...prev.items,
        {
          product_id: product.id,
          supplier_id: supplierId,
          product_name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          color: product.color || '',
          product_color: product.color || '',
          size: product.size || '',
          quantity,
          purchase_price: Number(itemForm.purchase_price || product.purchase_price || 0),
          condition_status: isReturnInbound ? itemForm.condition_status : 'Layak',
          condition_note:
            isReturnInbound && itemForm.condition_status === 'Rusak Ringan'
              ? itemForm.condition_note.trim()
              : '',
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

    if (!form.supplier_id) {
      toast.error('Supplier wajib dipilih.');
      return;
    }

    if (!form.items.length) {
      toast.error('Tambahkan minimal satu item transaksi.');
      return;
    }

    try {
      setSaving(true);
      const submittedForm = form;
      const response = await transactionService.createTransactionIn(form);
      toast.success('Transaksi barang masuk berhasil disimpan.');
      setForm({ supplier_id: '', date: '', notes: '', inbound_status: 'Barang Baru', items: [] });
      setHistory((prev) => [
        {
          ...response.data,
          notes: response.data?.notes || submittedForm.notes,
          inbound_status: response.data?.inbound_status || submittedForm.inbound_status,
          items: transactionItems(response.data || {}).length ? transactionItems(response.data) : submittedForm.items,
          total_items: numberFrom(
            response.data?.total_items,
            submittedForm.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
          ),
          total_amount: numberFrom(
            response.data?.total_amount,
            submittedForm.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.purchase_price || 0), 0),
          ),
        },
        ...prev,
      ]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menyimpan transaksi masuk.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteHistory = async (row) => {
    const targetId = row.transaction_id || row.transaction_no;
    if (!targetId) return;

    try {
      setDeletingId(targetId);
      await transactionService.deleteTransactionIn(targetId);
      setHistory((prev) =>
        prev.filter((transaction) => String(transaction.id) !== String(targetId) && transaction.transaction_no !== targetId),
      );
      toast.success('Transaksi barang masuk berhasil dihapus.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menghapus transaksi barang masuk.'));
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
                product_name: transaction.product_name || transaction.product || transaction.item_summary || '-',
                size: transaction.size || transaction.size_summary || '-',
                color: transaction.color || transaction.product_color || '-',
                quantity: numberFrom(transaction.quantity, transaction.total_items),
                purchase_price:
                  numberFrom(transaction.purchase_price) ||
                  (numberFrom(transaction.total_items) > 0
                    ? numberFrom(transaction.total_amount) / numberFrom(transaction.total_items)
                    : 0),
                condition_status: transaction.condition_status || transaction.condition || '-',
                condition_note: transaction.condition_note || '',
                notes: transaction.notes || '',
              },
            ];

        return items.map((item, index) => {
          const product = findProductForItem(productOptions, item);

          return {
            id: `${transaction.id || transaction.transaction_no}-${item.product_id || item.sku || index}`,
            transaction_id: transaction.id,
            transaction_no: transaction.transaction_no,
            supplier_name: transaction.supplier_name,
            date: transaction.date,
            inbound_status: transactionStatus(transaction),
            total_items: numberFrom(transaction.total_items, transaction.quantity),
            product: itemProductLabel(item),
            size: itemSizeLabel(item, product),
            color: itemColorLabel(item, product),
            quantity: numberFrom(item.quantity, transaction.total_items),
            condition: conditionLabel(item),
            condition_note: item.condition_note || item.damage_note || item.note_condition || '',
            notes: transaction.notes || '',
            purchase_price: numberFrom(item.purchase_price),
            subtotal: numberFrom(item.subtotal) || numberFrom(item.quantity, transaction.total_items) * numberFrom(item.purchase_price) || numberFrom(transaction.total_amount),
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
      { key: 'supplier_name', title: 'Supplier' },
      { key: 'date', title: 'Tanggal' },
      { key: 'group_label', title: 'Kelompok', render: (row) => <span className="block min-w-[150px]">{row.group_label}</span> },
      { key: 'inbound_status', title: 'Status', render: (row) => row.inbound_status || 'Barang Baru' },
      { key: 'total_items', title: 'Total Item', render: (row) => `${row.total_items} pcs` },
      { key: 'product', title: 'Produk', render: (row) => <span className="block min-w-[220px]">{row.product}</span> },
      { key: 'size', title: 'Ukuran', render: (row) => <span className="block min-w-[100px]">{row.size}</span> },
      { key: 'color', title: 'Warna' },
      {
        key: 'quantity',
        title: 'Qty Masuk',
        render: (row) => `${row.quantity} pcs`,
      },
      {
        key: 'condition',
        title: 'Kondisi',
        render: (row) => <span className="block min-w-[120px]">{row.condition}</span>,
      },
      {
        key: 'condition_note',
        title: 'Keterangan Rusak',
        render: (row) => <span className="block min-w-[180px] text-sm">{row.condition_note || '-'}</span>,
      },
      {
        key: 'notes',
        title: 'Catatan',
        render: (row) => <span className="block min-w-[180px] text-sm">{row.notes || '-'}</span>,
      },
      {
        key: 'purchase_price',
        title: 'Harga Beli',
        render: (row) => formatCurrency(row.purchase_price),
      },
      {
        key: 'subtotal',
        title: 'Subtotal',
        render: (row) => formatCurrency(row.subtotal),
      },
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



  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-2xl font-bold text-ink">Input Barang Masuk</h3>
        <p className="mt-1 text-sm text-muted">Pilih supplier, cari produk, lalu simpan transaksi untuk menambah stok.</p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <SearchableSelect
              label="Supplier"
              name="supplier_id"
              value={form.supplier_id}
              onChange={handleSupplierChange}
              options={suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))}
              placeholder="Pilih supplier"
            />
            <Input label="Tanggal" type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
            <Input label="Catatan" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="PO, invoice, atau catatan tambahan" />
            <SearchableSelect
              label="Status Barang Masuk"
              name="inbound_status"
              value={form.inbound_status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  inbound_status: e.target.value,
                  items: prev.items.map((item) => ({
                    ...item,
                    condition_status: e.target.value === 'Barang Return' ? item.condition_status || 'Layak' : 'Layak',
                    condition_note: e.target.value === 'Barang Return' ? item.condition_note || '' : '',
                  })),
                }))
              }
              options={INBOUND_STATUSES.map((status) => ({ value: status, label: status }))}
              placeholder="Pilih status"
            />
          </div>

          <div className="rounded-[28px] border border-line bg-white p-5">
            <h4 className="text-lg font-bold text-ink">Tambah Item</h4>
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
                label="Jumlah Masuk"
                type="number"
                min="1"
                value={itemForm.quantity}
                onChange={(e) => setItemForm((prev) => ({ ...prev, quantity: e.target.value }))}
              />
              <CurrencyInput
                label="Harga Beli"
                name="purchase_price"
                value={itemForm.purchase_price}
                onChange={(e) => setItemForm((prev) => ({ ...prev, purchase_price: e.target.value }))}
                placeholder="0"
              />
              {isReturnInbound ? (
                <>
                  <SearchableSelect
                    label="Kondisi Barang"
                    name="condition_status"
                    value={itemForm.condition_status}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        condition_status: e.target.value,
                        condition_note: e.target.value === 'Rusak Ringan' ? prev.condition_note : '',
                      }))
                    }
                    options={RETURN_CONDITIONS.map((condition) => ({ value: condition, label: condition }))}
                    placeholder="Pilih kondisi"
                  />
                  {itemForm.condition_status === 'Rusak Ringan' ? (
                    <Input
                      label="Keterangan Rusak Ringan"
                      as="textarea"
                      value={itemForm.condition_note}
                      onChange={(e) => setItemForm((prev) => ({ ...prev, condition_note: e.target.value }))}
                      placeholder="Ketik keterangan kondisi barang"
                      containerClassName="md:col-span-2"
                    />
                  ) : null}
                </>
              ) : null}
            </div>
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
                    <th className="py-2">Warna</th>
                    <th className="py-2">Qty Masuk</th>
                    <th className="py-2">Kondisi</th>
                    <th className="py-2">Harga Beli</th>
                    <th className="py-2">Subtotal</th>
                    <th className="py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => (
                    <tr
                      key={`${item.product_id}-${index}`}
                      className={[
                        'border-t transition',
                        isReturnInbound ? returnConditionTone(item.condition_status) : 'border-line',
                      ].join(' ')}
                    >
                      <td className="py-3">{item.sku} - {item.product_name}</td>
                      <td className="py-3">{item.size || '-'}</td>
                      <td className="py-3">{item.color || '-'}</td>
                      <td className="py-3">{item.quantity}</td>
                      <td className="py-3">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
                            isReturnInbound ? returnConditionBadgeTone(item.condition_status) : 'bg-surface text-muted',
                          ].join(' ')}
                        >
                          {item.condition_status || 'Layak'}
                        </span>
                        {item.condition_note ? <span className="mt-1 block text-xs text-muted">{item.condition_note}</span> : null}
                      </td>
                      <td className="py-3">{formatCurrency(item.purchase_price)}</td>
                      <td className="py-3">{formatCurrency(item.purchase_price * item.quantity)}</td>
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
            Simpan Transaksi Masuk
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
          <h3 className="text-xl font-bold text-ink">Riwayat Barang Masuk</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={loadInitial} loading={loading}>
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
        <Table
          columns={historyColumns}
          data={filteredHistoryRows}
          loading={loading}
          emptyMessage="Belum ada transaksi barang masuk."
          rowClassName={(row) =>
            row.inbound_status === 'Barang Return' ? returnConditionHighlight(row.condition) : ''
          }
        />
      </Card>
    </div>
  );
}
