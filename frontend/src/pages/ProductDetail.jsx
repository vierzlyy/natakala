import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Printer } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import productService from '../services/productService';
import printBarcodeLabel from '../utils/barcodePrint';
import formatCurrency from '../utils/formatCurrency';
import { formatProductColor, formatSizeStockSummary } from '../utils/productVariant';
import { useSettings } from '../context/SettingsContext';

export default function ProductDetail() {
  const { id } = useParams();
  const { settings } = useSettings();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState({ stock_history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const [productResponse, historyResponse] = await Promise.all([productService.getById(id), productService.getHistory(id)]);
        setProduct(productResponse.data || productResponse.product || productResponse);
        setHistory(historyResponse.data || historyResponse);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return <Card className="p-6 text-sm text-muted">Memuat detail produk...</Card>;
  }

  if (!product) {
    return <Card className="p-6 text-sm text-danger">Produk tidak ditemukan.</Card>;
  }

  const stockHistoryColumns = [
    { key: 'date', title: 'Waktu' },
    { key: 'type', title: 'Jenis' },
    {
      key: 'quantity',
      title: 'Perubahan',
      render: (row) => (
        <Badge tone={Number(row.quantity) >= 0 ? 'success' : 'danger'}>
          {Number(row.quantity) > 0 ? `+${row.quantity}` : row.quantity}
        </Badge>
      ),
    },
    {
      key: 'after_stock',
      title: 'Stok Akhir',
      render: (row) => `${row.after_stock} pcs`,
    },
    { key: 'reference', title: 'Referensi' },
    { key: 'note', title: 'Catatan' },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-white">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-muted">Tidak ada gambar</div>
            )}
          </div>

          <div className="flex-1 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">{product.sku}</p>
                <h2 className="mt-2 text-3xl font-extrabold text-ink">{product.name}</h2>
              </div>
              <div className="flex gap-3">
                <Link to="/products">
                  <Button variant="secondary">Kembali</Button>
                </Link>
                <Link to={`/products/${product.id}/edit`}>
                  <Button>Edit Produk</Button>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => {
                    try {
                      printBarcodeLabel(product, { format: settings?.barcode_format });
                    } catch (error) {
                      toast.error('Popup diblokir browser. Izinkan popup untuk cetak barcode.');
                    }
                  }}
                >
                  <Printer size={16} />
                  Cetak Barcode
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['Kategori', product.category_name || '-'],
                ['Supplier', product.supplier_name || '-'],
                ['Ukuran', product.size || '-'],
                ['Warna', formatProductColor(product)],
                ['Harga Beli', formatCurrency(product.purchase_price || 0)],
                ['Harga Jual', formatCurrency(product.selling_price || 0)],
                [
                  'Stok Saat Ini',
                  <span key="stock-current">
                    <span className="block">{product.stock || 0} pcs</span>
                    <span className="mt-1 block text-sm font-semibold text-muted">Ukuran: {formatSizeStockSummary(product)}</span>
                    <span className="mt-1 block text-sm font-semibold text-muted">Warna: {formatProductColor(product)}</span>
                  </span>,
                ],
                ['Lokasi Gudang', product.storage_location || '-'],
                ['Zona', product.storage_zone || '-'],
                ['Aisle', product.storage_aisle || '-'],
                ['Rak', product.storage_rack || '-'],
                ['Bin', product.storage_bin || '-'],
                ['Barcode', product.barcode || '-'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[24px] border border-line bg-white p-4">
                  <p className="text-sm text-muted">{label}</p>
                  <p className="mt-2 text-lg font-bold text-ink">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-ink">Histori Stok</h3>
          <p className="text-sm text-muted">Jejak perubahan stok produk dari transaksi dan opname.</p>
        </div>
        <Table
          columns={stockHistoryColumns}
          data={history.stock_history || product.stock_history || []}
          emptyMessage="Belum ada histori stok untuk produk ini."
        />
      </Card>
    </div>
  );
}
