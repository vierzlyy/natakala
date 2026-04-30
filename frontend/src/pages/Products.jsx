import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Printer } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import Table from '../components/ui/Table';
import categoryService from '../services/categoryService';
import productService from '../services/productService';
import { getErrorMessage } from '../services/serviceUtils';
import supplierService from '../services/supplierService';
import printBarcodeLabel from '../utils/barcodePrint';
import formatCurrency from '../utils/formatCurrency';
import { formatProductColor, formatSizeStockSummary, getProductVariantColors, getProductVariantStocks } from '../utils/productVariant';
import getStockStatus from '../utils/stockStatus';

const initialFilters = {
  search: '',
  category_id: '',
  supplier_id: '',
  color: '',
  size: '',
  stock_status: '',
  page: 1,
  per_page: 15,
};

const uniqueValues = (items, key) =>
  Array.from(
    new Set(
      (items || [])
        .flatMap((item) => (key === 'color' ? getProductVariantColors(item) : [item[key]]))
        .map((item) => String(item || '').trim())
        .filter(Boolean),
    ),
  ).sort((first, second) => first.localeCompare(second));

const stockStatusValue = (product) => {
  const stock = Number(product.stock || 0);
  const minimum = Number(product.minimum_stock || 5);

  if (stock <= 0) return 'empty';
  if (stock <= minimum) return 'low';
  return 'available';
};

const matchesColorCandidateFilters = (product, filters) => {
  const keyword = String(filters.search || '').trim().toLowerCase();
  const size = String(filters.size || '').trim().toLowerCase();
  const searchable = [product.name, product.sku, product.barcode].map((value) => String(value || '').toLowerCase());

  const searchMatch = !keyword || searchable.some((value) => value.includes(keyword));
  const categoryMatch = !filters.category_id || String(product.category_id) === String(filters.category_id);
  const supplierMatch = !filters.supplier_id || String(product.supplier_id) === String(filters.supplier_id);
  const sizeMatch =
    !size ||
    String(product.size || '').toLowerCase().includes(size) ||
    getProductVariantStocks(product).some((variant) => String(variant.size || '').toLowerCase().includes(size));
  const stockMatch = !filters.stock_status || stockStatusValue(product) === filters.stock_status;

  return searchMatch && categoryMatch && supplierMatch && sizeMatch && stockMatch;
};

export default function Products() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState(initialFilters);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filterProducts, setFilterProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadDependencies = async () => {
    try {
      const [categoryResponse, supplierResponse, productResponse] = await Promise.all([
        categoryService.getAll(),
        supplierService.getAll(),
        productService.getAll({ page: 1, per_page: 1000 }),
      ]);

      setCategories(categoryResponse.data || []);
      setSuppliers(supplierResponse.data || []);
      setFilterProducts(productResponse.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal memuat filter produk.'));
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await productService.getAll(query);
      setProducts(response.data || []);
      setPagination({
        current_page: response.pagination?.current_page || 1,
        last_page: response.pagination?.last_page || 1,
        total: response.pagination?.total || response.data?.length || 0,
      });
    } catch (error) {
      const message = getErrorMessage(error, 'Gagal memuat data produk.');
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [query]);

  const colors = useMemo(
    () => uniqueValues(filterProducts.filter((product) => matchesColorCandidateFilters(product, filters)), 'color'),
    [filterProducts, filters],
  );

  useEffect(() => {
    if (!filters.color || colors.includes(filters.color)) return;
    setFilters((prev) => ({ ...prev, color: '' }));
  }, [colors, filters.color]);

  const columns = useMemo(
    () => [
      { key: 'sku', title: 'SKU' },
      {
        key: 'name',
        title: 'Produk',
        render: (row) => (
          <div>
            <p className="font-semibold text-ink">{row.name}</p>
            <p className="text-xs text-muted">{row.color || 'Tanpa warna'} • {row.size || '-'}</p>
          </div>
        ),
      },
      { key: 'category_name', title: 'Kategori' },
      { key: 'storage_location', title: 'Lokasi' },
      { key: 'supplier_name', title: 'Supplier' },
      {
        key: 'purchase_price',
        title: 'Harga',
        render: (row) => (
          <div>
            <p className="font-semibold text-ink">{formatCurrency(row.selling_price || 0)}</p>
            <p className="text-xs text-muted">Beli {formatCurrency(row.purchase_price || 0)}</p>
          </div>
        ),
      },
      {
        key: 'stock',
        title: 'Stok',
        render: (row) => {
          const status = getStockStatus(row.stock, row.minimum_stock);
          return (
            <div className="space-y-1">
              <Badge tone={status.tone}>{`${row.stock} pcs - ${status.label}`}</Badge>
              <p className="text-xs text-muted">Ukuran: {formatSizeStockSummary(row)}</p>
              <p className="text-xs text-muted">Warna: {formatProductColor(row)}</p>
            </div>
          );
        },
      },
      {
        key: 'actions',
        title: 'Aksi',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => navigate(`/products/${row.id}`)}>
              Detail
            </Button>
            <Button variant="warning" className="px-3 py-2 text-xs" onClick={() => navigate(`/products/${row.id}/edit`)}>
              Edit
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2 text-xs"
              onClick={() => {
                try {
                  printBarcodeLabel(row);
                } catch (error) {
                  toast.error('Popup diblokir browser. Izinkan popup untuk cetak barcode.');
                }
              }}
            >
              <Printer size={14} />
              Cetak
            </Button>
            <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => setSelectedProduct(row)}>
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setQuery({ ...filters, page: 1 });
  };

  const changePage = (page) => {
    if (page < 1 || page > pagination.last_page) return;
    setFilters((prev) => ({ ...prev, page }));
    setQuery((prev) => ({ ...prev, page }));
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      setDeleting(true);
      await productService.remove(selectedProduct.id);
      toast.success('Produk berhasil dihapus.');
      setProducts((prev) => prev.filter((item) => item.id !== selectedProduct.id));
      setFilterProducts((prev) => prev.filter((item) => item.id !== selectedProduct.id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, Number(prev.total || 0) - 1),
      }));
      setSelectedProduct(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menghapus produk.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <form className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-6" onSubmit={handleSearch}>
            <Input label="Cari Produk" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Nama / SKU" />
            <Input label="Kategori" as="select" name="category_id" value={filters.category_id} onChange={handleFilterChange}>
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Input>
            <Input label="Warna" as="select" name="color" value={filters.color} onChange={handleFilterChange}>
              <option value="">Semua warna</option>
              {colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </Input>
            <Input label="Supplier" as="select" name="supplier_id" value={filters.supplier_id} onChange={handleFilterChange}>
              <option value="">Semua supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Input>
            <Input label="Ukuran" name="size" value={filters.size} onChange={handleFilterChange} placeholder="S / M / L" />
            <Input label="Status Stok" as="select" name="stock_status" value={filters.stock_status} onChange={handleFilterChange}>
              <option value="">Semua status</option>
              <option value="available">Tersedia</option>
              <option value="low">Menipis</option>
              <option value="empty">Habis</option>
            </Input>
            <div className="md:col-span-2 xl:col-span-6 flex gap-3">
              <Button type="submit">Terapkan Filter</Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setFilters(initialFilters);
                  setQuery(initialFilters);
                }}
              >
                Reset
              </Button>
            </div>
          </form>

          <Link to="/products/create">
            <Button>Tambah Produk</Button>
          </Link>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-ink">Daftar Produk</h3>
            <p className="text-sm text-muted">{pagination.total} produk ditemukan</p>
          </div>
          <Badge tone="muted">Halaman {pagination.current_page} / {pagination.last_page}</Badge>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMessage}
          </div>
        ) : null}

        <Table columns={columns} data={products} loading={loading} emptyMessage="Belum ada data produk." pagination={false} />

        <div className="mt-5">
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.last_page}
            totalItems={pagination.total}
            pageSize={query.per_page || 15}
            onChange={changePage}
          />
        </div>
      </Card>

      <Modal
        open={Boolean(selectedProduct)}
        title="Konfirmasi Hapus Produk"
        onClose={() => setSelectedProduct(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedProduct(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm leading-7 text-muted">
          Produk <span className="font-semibold text-ink">{selectedProduct?.name}</span> akan dihapus permanen dari daftar inventaris.
        </p>
      </Modal>
    </div>
  );
}
